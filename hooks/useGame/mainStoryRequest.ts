import type {
    游戏设置结构,
    角色数据结构,
    聊天记录结构,
    记忆系统结构,
    内置提示词条目结构,
    世界书结构
} from '../../types';
import type { 当前可用接口结构 } from '../../utils/apiConfig';
import { 规范化游戏设置 } from '../../utils/gameSettings';
import { formatHistoryToScript } from './historyUtils';
import {
    构建COT伪装提示词,
    构建酒馆预设消息链,
    酒馆预设模式可用
} from './promptRuntime';
import { 构建剧情风格助手提示词 } from '../../prompts/runtime/storyStyles';
import { 构建真实世界模式提示词 } from '../../prompts/runtime/realWorldMode';
import { 构建运行时额外提示词, 评估NSFW提示层级, type NSFW提示层级 } from '../../prompts/runtime/nsfw';
import { 获取DeepSeek主剧情兼容提示词 } from '../../prompts/runtime/deepseekMode';
import {
    世界书本体槽位
} from '../../utils/worldbook';
import { 获取剧情风格内置槽位, 获取内置提示词槽位内容 } from '../../utils/builtinPrompts';
import { 按功能开关过滤提示词内容 } from '../../utils/promptFeatureToggles';
import { 包装繁体任务提示, 获取繁体输出指令 } from '../../utils/traditionalChinese';

export type 有序消息角色 = 'system' | 'user' | 'assistant';

export type 有序消息 = {
    role: 有序消息角色;
    content: string;
    prefix?: boolean;
};

type 主剧情上下文片段 = {
    AI角色声明: string;
    worldPrompt: string;
    worldPromptSource?: 'summary' | 'full_fallback';
    nsfwPromptLevel?: NSFW提示层级;
    suppressedWorldbookCount?: number;
    地图建筑状态: string;
    离场NPC档案: string;
    otherPrompts: string;
    题材模式提示词?: string;
    玩家剧情倾向提示词?: string;
    导演配置提示词?: string;
    难度设置提示词: string;
    叙事人称提示词: string;
    人称硬约束提示词?: string;
    字数设置提示词: string;
    重试格式要求提示词?: string;
    协议重试要求提示词?: string;
    长期记忆: string;
    中期记忆: string;
    在场NPC档案: string;
    剧情安排: string;
    女主剧情规划状态: string;
    世界状态: string;
    环境状态: string;
    角色状态: string;
    任务状态: string;
    COT提示词: string;
    格式提示词: string;
    字数要求提示词: string;
    免责声明输出提示词: string;
    输出协议提示词: string;
};

export type 主剧情系统上下文 = {
    shortMemoryContext: string;
    contextPieces: 主剧情上下文片段;
};

export type 主剧情消息条目 = {
    id: string;
    title: string;
    category: string;
    role: 有序消息角色;
    content: string;
    charCount: number;
    prefix?: boolean;
};

export type 主剧情请求Payload诊断 = {
    tavernPresetModeEnabled: boolean;
    assemblyBranch: 'tavern_preset' | 'native_ordered_segments';
    worldPromptSource: 'summary' | 'full_fallback';
    nsfwPromptLevel: NSFW提示层级;
    suppressedWorldbookCount: number;
    orderedMessageCount: number;
    orderedRoleSequence: 有序消息角色[];
    payloadSegments: Array<{
        id: string;
        category: string;
        role: 有序消息角色;
        charCount: number;
        prefix?: boolean;
    }>;
};

export type 主剧情请求构建结果 = {
    runtimeGameConfig: 游戏设置结构;
    tavernPresetModeEnabled: boolean;
    runtimeGptMode: boolean;
    runtimeCotPseudoEnabled: boolean;
    deepSeekMode: 游戏设置结构['主剧情消息模式'];
    deepSeekPrefixMode: boolean;
    lengthRequirementPrompt: string;
    disclaimerRequirementPrompt?: string;
    outputProtocolPrompt: string;
    styleAssistantPrompt: string;
    realWorldModePrompt: string;
    cotPseudoPrompt: string;
    messageEntries: 主剧情消息条目[];
    orderedMessages: 有序消息[];
    extraPromptForService: string;
    diagnostics: 主剧情请求Payload诊断;
};

const 角色标题前缀映射: Record<有序消息角色, string> = {
    system: '系统',
    user: '用户',
    assistant: '助手'
};

const 角色分类映射: Record<有序消息角色, string> = {
    system: '系统',
    user: '用户',
    assistant: '助手'
};

const 剥离标签块 = (content: string, tagName: string): string => {
    const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (content || '')
        .replace(new RegExp(`<\\s*${escaped}\\s*>[\\s\\S]*?<\\s*/\\s*${escaped}\\s*>`, 'gi'), '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const 构建本回合硬约束提示词 = (pieces: 主剧情上下文片段): string => [
    pieces.字数要求提示词,
    pieces.人称硬约束提示词,
    pieces.重试格式要求提示词,
    pieces.协议重试要求提示词,
    pieces.免责声明输出提示词
]
    .map((item) => (item || '').trim())
    .filter(Boolean)
    .join('\n\n');

export const 构建主剧情请求参数 = (
    params: {
        gameConfig: 游戏设置结构;
        apiConfig: 接口设置结构扩展;
        builtContext: 主剧情系统上下文;
        updatedContextHistory: 聊天记录结构[];
        updatedMemSys: 记忆系统结构;
        sendInput: string;
        recallTag?: string;
        playerRole?: 角色数据结构;
        builtinPromptEntries?: 内置提示词条目结构[];
        worldbooks?: 世界书结构[];
    }
): 主剧情请求构建结果 => {
    const runtimeGameConfig = 规范化游戏设置(params.gameConfig);
    const tavernPresetModeEnabled = 酒馆预设模式可用(runtimeGameConfig);
    const deepSeekMode = runtimeGameConfig.主剧情消息模式;
    const deepSeekMainModeEnabled = deepSeekMode === 'DeepSeek标准' || deepSeekMode === 'DeepSeek锁格式';
    const runtimeGptMode = runtimeGameConfig.启用GPT模式 === true || runtimeGameConfig.主剧情消息模式 === 'GPT' || deepSeekMainModeEnabled;
    const runtimeCotPseudoEnabled = deepSeekMainModeEnabled ? false : runtimeGameConfig.启用COT伪装注入 !== false;
    const deepSeekPrefixMode = deepSeekMode === 'DeepSeek锁格式' && runtimeGameConfig.DeepSeek策略?.启用Prefix能力探测 !== false;
    const lengthRequirementPrompt = params.builtContext.contextPieces.字数要求提示词;
    const disclaimerRequirementPrompt = params.builtContext.contextPieces.免责声明输出提示词 || undefined;
    const outputProtocolPrompt = params.builtContext.contextPieces.输出协议提示词;
    const styleAssistantPrompt = 按功能开关过滤提示词内容(
        获取内置提示词槽位内容({
            entries: params.builtinPromptEntries,
            slotId: 获取剧情风格内置槽位('main', runtimeGameConfig.剧情风格, runtimeGameConfig?.NTL后宫档位),
            fallback: 构建剧情风格助手提示词(
                runtimeGameConfig.剧情风格,
                runtimeGameConfig?.NTL后宫档位,
                runtimeGameConfig
            )
        }),
        runtimeGameConfig
    );
    const realWorldModePrompt = runtimeGameConfig.启用真实世界模式 === true
        ? 获取内置提示词槽位内容({
            entries: params.builtinPromptEntries,
            slotId: 世界书本体槽位.真实世界模式,
            fallback: 构建真实世界模式提示词(runtimeGameConfig)
        })
        : '';
    const deepSeekModePrompt = 获取DeepSeek主剧情兼容提示词(runtimeGameConfig);
    const traditionalChinesePrompt = 获取繁体输出指令(runtimeGameConfig);
    const cotPseudoPrompt = runtimeCotPseudoEnabled
        ? 构建COT伪装提示词(
            runtimeGameConfig,
            params.builtContext.contextPieces.AI角色声明
        )
        : '';
    const recentScriptText = formatHistoryToScript(params.updatedContextHistory);
    const evaluatedNsfwPromptLevel = params.builtContext.contextPieces.nsfwPromptLevel || 评估NSFW提示层级(runtimeGameConfig, {
        stage: 'main',
        playerInput: params.sendInput,
        recentBodyText: recentScriptText,
        sceneText: params.builtContext.contextPieces.环境状态,
        directorText: params.builtContext.contextPieces.导演配置提示词 || '',
        socialText: params.builtContext.contextPieces.在场NPC档案 || ''
    });
    const runtimeNsfwContext = {
        stage: 'main',
        playerInput: params.sendInput,
        recentBodyText: recentScriptText,
        sceneText: params.builtContext.contextPieces.环境状态,
        directorText: params.builtContext.contextPieces.导演配置提示词 || '',
        socialText: params.builtContext.contextPieces.在场NPC档案 || '',
        forceLevel: evaluatedNsfwPromptLevel
    };
    const normalizedRuntimeExtraPrompt = !tavernPresetModeEnabled
        ? 构建运行时额外提示词(runtimeGameConfig.额外提示词 || '', runtimeGameConfig, runtimeNsfwContext)
        : '';
    const tavernRuntimeExtraPrompt = 构建运行时额外提示词(runtimeGameConfig.额外提示词 || '', runtimeGameConfig, runtimeNsfwContext);
    const recallScriptAppend = params.recallTag ? `\n\n【剧情回忆】\n${params.recallTag}` : '';
    const scriptSectionText = `【即时剧情回顾】\n${recentScriptText || '暂无'}${recallScriptAppend}`;
    const latestUserInputAsModel = 包装繁体任务提示([
        '以下是用户最新输入内容：',
        `<用户输入>${params.sendInput}</用户输入>`
    ].join('\n'), runtimeGameConfig);
    const latestUserInputForTavern = 包装繁体任务提示(
        params.recallTag
            ? `${params.sendInput}\n\n<剧情回忆>\n${params.recallTag}\n</剧情回忆>`
            : params.sendInput,
        runtimeGameConfig
    );
    const messageEntries: 主剧情消息条目[] = [];
    const turnDirectivesPrompt = 构建本回合硬约束提示词(params.builtContext.contextPieces);

    if (tavernPresetModeEnabled) {
        const tavernContext: 主剧情系统上下文 = {
            ...params.builtContext,
            contextPieces: {
                ...params.builtContext.contextPieces,
                字数设置提示词: 剥离标签块(params.builtContext.contextPieces.字数设置提示词, '字数')
            }
        };
        const tavernOutputProtocolPrompt = (() => {
            const source = outputProtocolPrompt.trim();
            const formatPrompt = params.builtContext.contextPieces.格式提示词.trim();
            if (!source) return '';
            if (!formatPrompt) return source;
            const normalizedSource = source.replace(/\r\n/g, '\n').trim();
            const normalizedFormat = formatPrompt.replace(/\r\n/g, '\n').trim();
            return normalizedSource === normalizedFormat
                ? normalizedSource
                : normalizedSource;
        })();
        const tavernMessages = 构建酒馆预设消息链({
            config: runtimeGameConfig,
            context: tavernContext,
            chatHistory: params.updatedContextHistory,
            latestUserInput: latestUserInputForTavern,
            playerName: params.playerRole?.姓名 || '',
            playerRole: params.playerRole,
            worldbookExtraTexts: [
                params.builtContext.contextPieces.题材模式提示词 || '',
                params.builtContext.contextPieces.玩家剧情倾向提示词 || '',
                params.builtContext.contextPieces.导演配置提示词 || '',
                styleAssistantPrompt,
                realWorldModePrompt,
                deepSeekModePrompt,
                traditionalChinesePrompt,
                turnDirectivesPrompt,
                tavernRuntimeExtraPrompt,
                tavernOutputProtocolPrompt
            ]
        });
        tavernMessages.forEach((message, index) => {
            const trimmed = (message?.content || '').trim();
            if (!trimmed) return;
            const role = message.role as 有序消息角色;
            messageEntries.push({
                id: `tavern_message_${index + 1}`,
                title: `酒馆${角色标题前缀映射[role] || '消息'} ${index + 1}`,
                category: `酒馆${角色分类映射[role] || ''}`,
                role,
                content: trimmed,
                charCount: trimmed.length
            });
        });
    } else {
        const latestUserInputRole: 有序消息角色 = 'assistant';
        const pushEntry = (
            id: string,
            title: string,
            category: string,
            role: 有序消息角色,
            content: string,
            options?: { userInput?: boolean; prefix?: boolean }
        ) => {
            const raw = content || '';
            const normalizedContent = options?.prefix === true ? raw : raw.trim();
            if (normalizedContent.length === 0) return;
            const normalizedRole: 有序消息角色 = role;
            messageEntries.push({
                id,
                title,
                category,
                role: normalizedRole,
                content: normalizedContent,
                charCount: normalizedContent.length,
                ...(options?.prefix === true ? { prefix: true } : {})
            });
        };
        const writingRequirementPrompt = 剥离标签块(params.builtContext.contextPieces.字数设置提示词, '字数');

        pushEntry('ai_role', 'AI角色声明', '系统', 'system', params.builtContext.contextPieces.AI角色声明);
        pushEntry('world_prompt', '世界观提示词', '系统', 'system', params.builtContext.contextPieces.worldPrompt);
        pushEntry('world_map', '地图与空间锚点', '系统', 'system', params.builtContext.contextPieces.地图建筑状态);
        pushEntry('npc_away', '以下为不在场角色', '系统', 'system', params.builtContext.contextPieces.离场NPC档案);
        pushEntry('topic_mode', '题材模式', '系统', 'system', params.builtContext.contextPieces.题材模式提示词 || '');
        pushEntry('player_preference', '玩家剧情倾向', '系统', 'system', params.builtContext.contextPieces.玩家剧情倾向提示词 || '');
        pushEntry('director_config', '导演配置与角色种子', '系统', 'system', params.builtContext.contextPieces.导演配置提示词 || '');
        pushEntry('other_prompts', '叙事/规则提示词', '系统', 'system', params.builtContext.contextPieces.otherPrompts);
        pushEntry('difficulty_prompts', '难度设置提示词', '系统', 'system', params.builtContext.contextPieces.难度设置提示词);
        pushEntry('perspective_prompt', '叙事人称提示词', '系统', 'system', params.builtContext.contextPieces.叙事人称提示词);
        pushEntry('writing_requirements', '写作要求提示词', '系统', 'system', writingRequirementPrompt);
        pushEntry('memory_long', '长期记忆', '记忆', 'system', params.builtContext.contextPieces.长期记忆);
        pushEntry('memory_mid', '中期记忆', '记忆', 'system', params.builtContext.contextPieces.中期记忆);
        pushEntry('story_plan', '剧情安排', '系统', 'system', params.builtContext.contextPieces.剧情安排);
        pushEntry('npc_present', '以下为在场角色', '系统', 'system', params.builtContext.contextPieces.在场NPC档案);
        pushEntry('heroine_plan', '女主剧情规划', '系统', 'system', params.builtContext.contextPieces.女主剧情规划状态);
        pushEntry('state_world', '世界', '系统', 'system', params.builtContext.contextPieces.世界状态);
        pushEntry('state_environment', '当前环境', '系统', 'system', params.builtContext.contextPieces.环境状态);
        pushEntry('state_role', '用户角色数据', '系统', 'system', params.builtContext.contextPieces.角色状态);
        pushEntry('state_tasks', '任务列表', '系统', 'system', params.builtContext.contextPieces.任务状态);
        pushEntry('memory_short', '短期记忆', '记忆', 'system', params.builtContext.shortMemoryContext);

        pushEntry('script', '即时剧情回顾', '历史', 'system', scriptSectionText);
        pushEntry('style_assistant', '剧情风格助手消息', '系统', 'system', styleAssistantPrompt);
        pushEntry('real_world_mode', '真实世界模式消息', '系统', 'system', realWorldModePrompt);
        pushEntry('deepseek_mode', 'DeepSeek兼容模式', '系统', 'system', deepSeekModePrompt);
        pushEntry('traditional_chinese', '繁体中文输出要求', '系统', 'system', traditionalChinesePrompt);
        pushEntry('extra_prompt', '额外要求提示词', '用户', 'user', normalizedRuntimeExtraPrompt);
        pushEntry('format_prompt', '输出格式提示词', '系统', 'system', params.builtContext.contextPieces.格式提示词);
        pushEntry('cot_core', 'COT提示词', '系统', 'system', params.builtContext.contextPieces.COT提示词);
        pushEntry(
            'turn_directives',
            '本回合硬性要求',
            '用户',
            'user',
            turnDirectivesPrompt
        );
        if (!runtimeGptMode) {
            pushEntry(
                'player_input_as_model',
                '最新用户输入（模型消息）',
                '助手',
                latestUserInputRole,
                latestUserInputAsModel,
                { userInput: true }
            );
        }
        pushEntry(
            'start_task',
            runtimeGptMode ? '本回合用户输入' : '开始任务',
            '用户',
            'user',
            runtimeGptMode ? 包装繁体任务提示(params.sendInput, runtimeGameConfig) : 包装繁体任务提示('开始任务', runtimeGameConfig)
        );
        if (runtimeCotPseudoEnabled) {
            pushEntry(
                'cot_fake_history',
                'COT伪装历史消息',
                '助手',
                'assistant',
                cotPseudoPrompt
            );
        }
        if (deepSeekPrefixMode) {
            pushEntry(
                'deepseek_prefix',
                'DeepSeek锁格式Prefix',
                '助手',
                'assistant',
                '<thinking>\n',
                { prefix: true }
            );
        }
    }

    const orderedMessages = messageEntries.map((entry) => ({
        role: entry.role,
        content: entry.content,
        ...(entry.prefix === true ? { prefix: true } : {})
    }));
    const diagnostics: 主剧情请求Payload诊断 = {
        tavernPresetModeEnabled,
        assemblyBranch: tavernPresetModeEnabled ? 'tavern_preset' : 'native_ordered_segments',
        worldPromptSource: params.builtContext.contextPieces.worldPromptSource || 'full_fallback',
        nsfwPromptLevel: evaluatedNsfwPromptLevel,
        suppressedWorldbookCount: params.builtContext.contextPieces.suppressedWorldbookCount || 0,
        orderedMessageCount: orderedMessages.length,
        orderedRoleSequence: orderedMessages.map((message) => message.role),
        payloadSegments: messageEntries.map((entry) => ({
            id: entry.id,
            category: entry.category,
            role: entry.role,
            charCount: entry.charCount,
            ...(entry.prefix === true ? { prefix: true } : {})
        }))
    };

    return {
        runtimeGameConfig,
        tavernPresetModeEnabled,
        runtimeGptMode,
        runtimeCotPseudoEnabled,
        deepSeekMode,
        deepSeekPrefixMode,
        lengthRequirementPrompt,
        disclaimerRequirementPrompt,
        outputProtocolPrompt,
        styleAssistantPrompt,
        realWorldModePrompt,
        cotPseudoPrompt,
        messageEntries,
        orderedMessages,
        extraPromptForService: tavernPresetModeEnabled
            ? ''
            : normalizedRuntimeExtraPrompt,
        diagnostics
    };
};

type 接口设置结构扩展 = 当前可用接口结构 & {
    功能模型占位?: {
        剧情回忆独立模型开关?: boolean;
        剧情回忆完整原文条数N?: number;
    };
};
