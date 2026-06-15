import * as textAIService from '../../services/ai/text';
import * as dbService from '../../services/dbService';
import type { OpeningConfig, WorldGenConfig, 角色数据结构, 提示词结构, 聊天记录结构 } from '../../types';
import type { 当前可用接口结构 } from '../../utils/apiConfig';
import { 获取主剧情接口配置, 接口配置是否可用 } from '../../utils/apiConfig';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词 } from '../../prompts/runtime/worldSetup';
import { 世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../../prompts/runtime/worldGenerationCot';
import { 设置键 } from '../../utils/settingsSchema';
import { 规范化游戏设置 } from '../../utils/gameSettings';
import { 获取繁体输出指令 } from '../../utils/traditionalChinese';
import { 按功能开关过滤提示词内容 } from '../../utils/promptFeatureToggles';
import { 构建题材默认境界体系提示词, 题材是否使用默认现代境界 } from '../../utils/topicRealmDefaults';
import { 构建开局运行时快照 } from '../../utils/customNewGamePresets';
import { recordDiagnosticLog } from '../../services/diagnosticLog';
import { 合并世界基底到开场状态 } from './storyState';

type 世界生成选项 = {
    清空前端变量?: boolean;
};

type 世界生成工作流依赖 = {
    apiConfig: any;
    gameConfig: any;
    prompts: 提示词结构[];
    view: 'home' | 'game' | 'new_game';
    setView: (value: 'home' | 'game' | 'new_game') => void;
    setPrompts: (value: 提示词结构[]) => void;
    setLoading: (value: boolean) => void;
    setShowSettings: (value: boolean) => void;
    设置历史记录: (value: 聊天记录结构[] | ((prev: 聊天记录结构[]) => 聊天记录结构[])) => void;
    设置开局配置: (value: OpeningConfig | undefined) => void;
    设置最近开局配置: (value: any) => void;
    清空重Roll快照: () => void;
    重置自动存档状态: () => void;
    创建开场基础状态: (charData: 角色数据结构, worldConfig: WorldGenConfig, openingConfig?: OpeningConfig) => any;
    构建前端清空开场状态: (baseState: any) => any;
    应用开场基态: (baseState: any) => void;
    创建开场命令基态: (openingBase?: any) => any;
    执行开场剧情生成: (
        contextData: any,
        promptSnapshot: 提示词结构[],
        useStreaming: boolean,
        apiForOpening: 当前可用接口结构,
        options?: { 命令基态?: any; 开局额外要求?: string; 开局配置?: OpeningConfig }
    ) => Promise<void>;
    追加系统消息: (message: string) => void;
    替换流式草稿为失败提示: (history: 聊天记录结构[], errorMessage: string) => 聊天记录结构[];
};

const 世界观阶段超时毫秒 = 300000;
const 境界阶段超时毫秒 = 300000;
const 开局流式预览最小间隔毫秒 = 700;
export const 选择开局境界体系来源 = (params: {
    启用成长体系: boolean;
    手动境界提示词?: string;
    是仙侠题材: boolean;
    题材模式?: unknown;
    启用模式能力体系: boolean;
}): 'disabled' | 'manual' | 'xianxia_default' | 'topic_default' | 'mode_default' | 'core_default' => {
    if (!params.启用成长体系) return 'disabled';
    if ((params.手动境界提示词 || '').trim()) return 'manual';
    if (params.是仙侠题材) return 'xianxia_default';
    if (题材是否使用默认现代境界(params.题材模式)) return 'topic_default';
    if (params.启用模式能力体系) return 'mode_default';
    return 'core_default';
};

const 开局阶段是否使用流式请求 = (apiConfig: 当前可用接口结构): boolean => {
    const supplier = (apiConfig.供应商 || '').toLowerCase();
    const baseUrl = (apiConfig.baseUrl || '').toLowerCase();
    const model = (apiConfig.model || '').toLowerCase();
    if (supplier === 'zhipu') return false;
    if (baseUrl.includes('open.bigmodel.cn') || baseUrl.includes('/api/paas/v4')) return false;
    if (model.includes('glm-')) return false;
    return true;
};

const 创建开局流式历史更新器 = (
    设置历史记录: 世界生成工作流依赖['设置历史记录']
) => {
    let lastFlushAt = 0;
    let pendingContent = '';
    let timer: ReturnType<typeof setTimeout> | null = null;

    const 写入 = (content: string) => {
        设置历史记录(prev => prev.map(item => {
            if (
                item.role === 'assistant'
                && !item.structuredResponse
                && typeof item.content === 'string'
                && item.content.startsWith('【生成中】')
            ) {
                if (item.content === content) return item;
                return {
                    ...item,
                    content
                };
            }
            return item;
        }));
    };

    const 刷新 = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (!pendingContent) return;
        lastFlushAt = Date.now();
        const content = pendingContent;
        pendingContent = '';
        写入(content);
    };

    const 更新 = (content: string, options?: { immediate?: boolean }) => {
        pendingContent = content;
        if (options?.immediate) {
            刷新();
            return;
        }
        const elapsed = Date.now() - lastFlushAt;
        if (elapsed >= 开局流式预览最小间隔毫秒) {
            刷新();
            return;
        }
        if (!timer) {
            timer = setTimeout(刷新, Math.max(80, 开局流式预览最小间隔毫秒 - elapsed));
        }
    };

    const 停止 = () => {
        刷新();
    };

    return { 更新, 停止 };
};

const 创建阶段超时错误 = (stageLabel: string, timeoutMs: number, idleTimeout = false): Error => {
    const timeoutLabel = idleTimeout ? `无新输出超时` : `超时`;
    const error = new Error(`${stageLabel}${timeoutLabel}（${Math.max(1, Math.ceil(timeoutMs / 1000))} 秒），请检查模型服务或稍后重试。`);
    error.name = 'TimeoutError';
    return error;
};

const 是否模式包题材片段 = (text: string): boolean => {
    const source = (text || '').trim();
    if (!source) return false;
    return /【\s*(题材口径|模式专属世界书|世界规则|运行时模式配置)\s*】/.test(source)
        && !/<\s*世界观\s*>/i.test(source)
        && !/"world_prompt"\s*:/.test(source)
        && !/"worldPrompt"\s*:/.test(source);
};

const 是否模式包能力片段 = (text: string): boolean => {
    const source = (text || '').trim();
    if (!source) return false;
    return /【\s*(能力体系|运行时模式配置)\s*】/.test(source)
        && !/<\s*境界体系\s*>/i.test(source)
        && !/【\s*境界映射母板\s*】/.test(source);
};

const 执行带超时 = async <T,>(
    stageLabel: string,
    timeoutMs: number,
    task: (signal: AbortSignal, 标记活动: () => void) => Promise<T>,
    options?: { idleTimeout?: boolean }
): Promise<T> => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeoutError = 创建阶段超时错误(stageLabel, timeoutMs, options?.idleTimeout === true);
    const 启动计时 = (reject: (reason?: any) => void) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            if (!controller.signal.aborted) {
                controller.abort(timeoutError);
            }
            reject(timeoutError);
        }, timeoutMs);
    };
    try {
        let rejectTimeout: ((reason?: any) => void) | null = null;
        const 标记活动 = () => {
            if (options?.idleTimeout && rejectTimeout) {
                启动计时(rejectTimeout);
            }
        };
        return await Promise.race([
            task(controller.signal, 标记活动),
            new Promise<T>((_, reject) => {
                rejectTimeout = reject;
                启动计时(reject);
            })
        ]);
    } catch (error: any) {
        if (controller.signal.aborted && controller.signal.reason === timeoutError) {
            throw timeoutError;
        }
        throw error;
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
};

export const 执行世界生成工作流 = async (
    worldConfig: WorldGenConfig,
    charData: 角色数据结构,
    openingConfig: OpeningConfig | undefined,
    mode: 'all' | 'step',
    _openingStreaming: boolean,
    openingExtraPrompt: string,
    options: 世界生成选项 | undefined,
    deps: 世界生成工作流依赖
): Promise<void> => {
    const 写入或插入提示词 = (
        promptPool: 提示词结构[],
        promptId: string,
        fallbackPrompt: 提示词结构,
        content: string
    ): 提示词结构[] => {
        const next = {
            ...(promptPool.find((item) => item.id === promptId) || fallbackPrompt),
            id: promptId,
            内容: content,
            启用: true
        };
        return promptPool.some((item) => item.id === promptId)
            ? promptPool.map((item) => item.id === promptId ? next : item)
            : [...promptPool, next];
    };

    const openingStreaming = _openingStreaming !== false;
    const normalizedGameConfig = 规范化游戏设置(deps.gameConfig);
    const 启用成长体系 = false;
    const currentApi = 获取主剧情接口配置(deps.apiConfig);
    if (!接口配置是否可用(currentApi)) {
        deps.追加系统消息('[开局生成失败] 请先在设置中填写 API 地址/API Key，并选择主剧情使用模型。');
        deps.setShowSettings(true);
        return;
    }
    const openingRequestStreaming = openingStreaming && 开局阶段是否使用流式请求(currentApi);

    const normalizedOpeningExtraPrompt = (openingExtraPrompt || '').trim();
    const normalizedOpeningConfig = openingConfig
        ? {
            ...openingConfig,
            runtimeSnapshot: 构建开局运行时快照({
                openingConfig,
                openingStreaming,
                openingExtraPrompt: normalizedOpeningExtraPrompt,
                openingExtraRequirement: openingConfig.runtimeSnapshot?.openingExtraRequirement,
                activeModuleExtraRules: openingConfig.runtimeSnapshot?.activeModuleExtraRules,
                modeWorldbooks: openingConfig.runtimeSnapshot?.modeWorldbooks,
                workshopSelection: openingConfig.runtimeSnapshot?.workshopSelection,
                modeBackgrounds: openingConfig.runtimeSnapshot?.modeBackgrounds,
                modeTalents: openingConfig.runtimeSnapshot?.modeTalents
            })
        }
        : undefined;
    deps.设置最近开局配置({
        worldConfig: JSON.parse(JSON.stringify(worldConfig)),
        charData: JSON.parse(JSON.stringify(charData)),
        openingConfig: normalizedOpeningConfig ? JSON.parse(JSON.stringify(normalizedOpeningConfig)) : undefined,
        openingStreaming,
        openingExtraPrompt: normalizedOpeningExtraPrompt
    });
    deps.设置开局配置(normalizedOpeningConfig ? JSON.parse(JSON.stringify(normalizedOpeningConfig)) : undefined);
    deps.清空重Roll快照();
    deps.重置自动存档状态();

    let openingBase = deps.创建开场基础状态(charData, worldConfig, openingConfig);
    let clearedOpeningBase = options?.清空前端变量
        ? deps.构建前端清空开场状态(openingBase)
        : null;

    if (clearedOpeningBase) {
        deps.应用开场基态(clearedOpeningBase);
        if (deps.view !== 'game') {
            deps.setView('game');
        }
    }

    if (openingStreaming) {
        const worldStreamMarker = Date.now();
        deps.setView('game');
        deps.设置历史记录([
            {
                role: 'system',
                content: '系统: 正在生成数据，请稍候...',
                timestamp: worldStreamMarker
            },
            {
                role: 'assistant',
                content: '【生成中】准备连接模型...',
                timestamp: worldStreamMarker + 1
            }
        ]);
    }

    deps.setLoading(true);

    let worldStreamHeartbeat: ReturnType<typeof setInterval> | null = null;
    let worldDeltaReceived = false;
    let realmStreamHeartbeat: ReturnType<typeof setInterval> | null = null;
    let realmDeltaReceived = false;
    const 开局流式历史更新器 = openingStreaming
        ? 创建开局流式历史更新器(deps.设置历史记录)
        : null;
    try {
        const worldPromptSeed = 按功能开关过滤提示词内容(
            构建世界观种子提示词(worldConfig, charData, openingConfig),
            normalizedGameConfig
        );
        const difficulty = worldConfig.difficulty || 'normal';
        const normalizedManualWorldPrompt = typeof worldConfig.manualWorldPrompt === 'string'
            ? worldConfig.manualWorldPrompt.trim()
            : '';
        const manualWorldPromptIsModePackageFragment = 是否模式包题材片段(normalizedManualWorldPrompt);
        const normalizedManualRealmPrompt = typeof worldConfig.manualRealmPrompt === 'string'
            ? worldConfig.manualRealmPrompt.trim()
            : '';
        const manualRealmPromptIsModePackageFragment = 是否模式包能力片段(normalizedManualRealmPrompt);
        const useManualWorldPrompt = normalizedManualWorldPrompt.length > 0 && !manualWorldPromptIsModePackageFragment;
        const normalizedWorldExtraRequirement = [
            typeof worldConfig.worldExtraRequirement === 'string' ? worldConfig.worldExtraRequirement.trim() : '',
            manualWorldPromptIsModePackageFragment ? normalizedManualWorldPrompt : '',
            manualRealmPromptIsModePackageFragment ? normalizedManualRealmPrompt : ''
        ].filter(Boolean).join('\n\n');
        const useWorldRefinement = !useManualWorldPrompt && normalizedWorldExtraRequirement.length > 0;
        const updatedPromptsBase = deps.prompts.map(prompt => {
            if (prompt.id === "core_world") {
                return { ...prompt, 内容: worldPromptSeed };
            }
            if (prompt.类型 === "难度设定") {
                return { ...prompt, 启用: prompt.id.endsWith(`_${difficulty}`) };
            }
            return prompt;
        });

        const enabledDifficultyPrompts = updatedPromptsBase
            .filter(prompt => prompt.类型 === "难度设定" && prompt.启用)
            .map(prompt => 按功能开关过滤提示词内容(`【${prompt.标题}】\n${prompt.内容}`, normalizedGameConfig))
            .join("\n\n");
        const worldGenerationCotPseudoPrompt = 世界观生成COT伪装历史消息提示词;

        const updatedPrompts = updatedPromptsBase;
        deps.setPrompts(updatedPrompts);
        await dbService.保存设置(设置键.提示词池, updatedPrompts);

        const worldGenerationContext = 按功能开关过滤提示词内容(构建世界生成任务上下文提示词(
            worldPromptSeed,
            difficulty,
            enabledDifficultyPrompts,
            normalizedWorldExtraRequirement,
            openingConfig
        ), normalizedGameConfig);
        const worldGenerationExtraPrompt = 按功能开关过滤提示词内容([
            世界观生成COT提示词,
            normalizedWorldExtraRequirement ? `【玩家世界观草稿与细化要求】\n${normalizedWorldExtraRequirement}\n- 必须优先保留玩家已写明的事实、地名、势力、时代、规则和禁忌。\n- 生成时只补全缺口、细化因果、补齐长期运行结构，不得推翻、绕开或替换玩家草稿。` : '',
            获取繁体输出指令(normalizedGameConfig)
        ]
            .filter(Boolean)
            .join('\n\n')
            .trim(), normalizedGameConfig);

        if (openingStreaming) {
            开局流式历史更新器?.更新(
                useManualWorldPrompt ? '【生成中】校验手动世界观提示词...' : useWorldRefinement ? '【生成中】AI 细化世界观...' : '【生成中】AI 生成世界观...',
                { immediate: true }
            );
            if (!useManualWorldPrompt) {
                let pulse = 0;
                worldStreamHeartbeat = setInterval(() => {
                    if (worldDeltaReceived) return;
                    pulse = (pulse + 1) % 4;
                    const dots = '.'.repeat(pulse) || '.';
                    开局流式历史更新器?.更新(`【生成中】${useWorldRefinement ? 'AI 细化世界观' : 'AI 生成世界观'}${dots}`);
                }, 420);
            }
        }

        const generatedWorldResult = useManualWorldPrompt
            ? {
                worldPrompt: textAIService.解析世界观提示词内容(normalizedManualWorldPrompt),
                mapLayers: [],
                factions: [],
                rawText: normalizedManualWorldPrompt
            }
            : await 执行带超时(useWorldRefinement ? 'AI 细化世界观' : 'AI 生成世界观', 世界观阶段超时毫秒, (signal, 标记活动) => textAIService.generateWorldFoundationData(
                worldGenerationContext,
                charData,
                currentApi,
                openingRequestStreaming
                    ? {
                        stream: true,
                        onDelta: (_delta, accumulated) => {
                            标记活动();
                            worldDeltaReceived = true;
                            const normalized = (accumulated || '').replace(/\r/g, '');
                            const tail = normalized.length > 480
                                ? `...${normalized.slice(-480)}`
                                : normalized;
                            const preview = tail.split('\n').slice(-10).join('\n').trim();
                            开局流式历史更新器?.更新(`【生成中】${useWorldRefinement ? 'AI 细化世界观与世界基底' : 'AI 生成世界观与世界基底'}（流式预览）\n${preview || '...'}\n\n已接收 ${normalized.length} 字符`);
                        }
                    }
                    : undefined,
                worldGenerationExtraPrompt,
                worldGenerationCotPseudoPrompt,
                {
                    启用成长体系,
                    openingConfig,
                    signal
                }
            ), { idleTimeout: openingRequestStreaming });
        if (worldStreamHeartbeat) clearInterval(worldStreamHeartbeat);
        开局流式历史更新器?.停止();

        const worldPromptContent = generatedWorldResult.worldPrompt?.trim() || worldPromptSeed;
        if (generatedWorldResult.mapLayers.length > 0 || generatedWorldResult.factions.length > 0) {
            openingBase = 合并世界基底到开场状态(openingBase, generatedWorldResult);
            if (clearedOpeningBase) {
                clearedOpeningBase = 合并世界基底到开场状态(clearedOpeningBase, generatedWorldResult);
                deps.应用开场基态(clearedOpeningBase);
            }
        }

        let finalPrompts = 写入或插入提示词(
            updatedPrompts,
            'core_world',
            updatedPrompts.find((prompt) => prompt.id === 'core_world') || updatedPrompts[0],
            worldPromptContent
        );
        deps.setPrompts(finalPrompts);
        await dbService.保存设置(设置键.提示词池, finalPrompts);

        if (mode === 'step') {
            const frontendBase = options?.清空前端变量
                ? (clearedOpeningBase || deps.构建前端清空开场状态(openingBase))
                : openingBase;
            deps.应用开场基态(frontendBase);
            deps.setView('game');
            deps.setLoading(false);
            deps.追加系统消息(
                '[系统] 世界观提示词已写入。请在聊天框输入指令开始初始化。'
            );
            return;
        }

        await deps.执行开场剧情生成(
            openingBase,
            finalPrompts,
            openingStreaming,
            currentApi,
            {
                命令基态: deps.创建开场命令基态(openingBase),
                开局额外要求: normalizedOpeningExtraPrompt,
                开局配置: openingConfig
            }
        );
        deps.setLoading(false);
    } catch (error: any) {
        if (worldStreamHeartbeat) clearInterval(worldStreamHeartbeat);
        if (realmStreamHeartbeat) clearInterval(realmStreamHeartbeat);
        开局流式历史更新器?.停止();
        recordDiagnosticLog('error', ['世界观生成失败', {
            message: error?.message || '',
            name: error?.name || typeof error,
            stack: typeof error?.stack === 'string' ? error.stack : undefined
        }]);
        console.error(error);
        const errorMessage = error?.message || '未知错误';
        deps.设置历史记录(prev => ([
            ...deps.替换流式草稿为失败提示(prev, errorMessage),
            {
                role: 'system',
                content: `[开局生成失败] ${errorMessage}\n可点击输入栏左侧闪电按钮“快速重开”立即重试，建角参数已保留。`,
                timestamp: Date.now()
            }
        ]));
        deps.setLoading(false);
    }
};
