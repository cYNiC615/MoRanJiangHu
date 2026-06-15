import type { OpeningConfig, WorldGenConfig, 游戏设置结构, 提示词结构, 角色数据结构 } from '../types';
import { 默认提示词 } from '../prompts';
import { 核心_境界体系 } from '../prompts/core/realm';
import { 构建同人运行时提示词包 } from '../prompts/runtime/fandom';
import { 获取世界观生成系统提示词, 构建世界观生成用户提示词 } from '../prompts/runtime/worldGeneration';
import { 世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../prompts/runtime/worldGenerationCot';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词 } from '../prompts/runtime/worldSetup';
import { 是否仙侠开局模式 } from '../prompts/runtime/openingConfig';
import { 按功能开关过滤提示词内容 } from './promptFeatureToggles';
import { 获取繁体输出指令 } from './traditionalChinese';

type 预览参数 = {
    worldConfig: WorldGenConfig;
    charData: 角色数据结构;
    openingConfig?: OpeningConfig | null;
    gameConfig?: Partial<游戏设置结构> | null;
    prompts?: 提示词结构[];
};

const 分隔 = (title: string): string => `\n\n================ ${title} ================\n`;

export const 构建开局世界观生成提示词预览 = ({
    worldConfig,
    charData,
    openingConfig,
    gameConfig,
    prompts
}: 预览参数): string => {
    const promptPool = Array.isArray(prompts) && prompts.length > 0 ? prompts : 默认提示词;
    const normalizedGameConfig = gameConfig || {};
    const difficulty = worldConfig.difficulty || 'normal';
    const normalizedWorldExtraRequirement = typeof worldConfig.worldExtraRequirement === 'string'
        ? worldConfig.worldExtraRequirement.trim()
        : '';
    const 启用修炼体系 = normalizedGameConfig.启用修炼体系 === true;
    const isXianxiaOpening = 是否仙侠开局模式(openingConfig);
    const initialFandomBundle = 构建同人运行时提示词包({ openingConfig: openingConfig || undefined });
    const fandomEnabled = initialFandomBundle.enabled;

    const worldPromptSeed = 按功能开关过滤提示词内容(
        构建世界观种子提示词(worldConfig, charData, openingConfig),
        normalizedGameConfig
    );

    const promptPoolWithCoreRealm = 启用修炼体系 && promptPool.some((item) => item.id === 核心_境界体系.id)
        ? promptPool
        : (启用修炼体系 ? [...promptPool, { ...核心_境界体系 }] : promptPool);
    const enabledDifficultyPrompts = promptPoolWithCoreRealm
        .map((prompt) => (
            prompt.类型 === '难度设定'
                ? { ...prompt, 启用: prompt.id.endsWith(`_${difficulty}`) }
                : prompt
        ))
        .filter((prompt) => prompt.类型 === '难度设定' && prompt.启用)
        .map((prompt) => 按功能开关过滤提示词内容(`【${prompt.标题}】\n${prompt.内容}`, normalizedGameConfig))
        .join('\n\n');

    const realmPromptContent = 启用修炼体系
        ? (
            isXianxiaOpening
                ? (initialFandomBundle.境界母板补丁 || 核心_境界体系.内容)
                : (fandomEnabled ? (initialFandomBundle.境界母板补丁 || '') : (initialFandomBundle.境界母板补丁 || 核心_境界体系.内容))
        )
        : '';

    const worldGenerationContext = 按功能开关过滤提示词内容(
        构建世界生成任务上下文提示词(
            worldPromptSeed,
            difficulty,
            enabledDifficultyPrompts,
            normalizedWorldExtraRequirement,
            openingConfig
        ),
        normalizedGameConfig
    );
    const fandomPromptBundle = 构建同人运行时提示词包({
        openingConfig: openingConfig || undefined,
        realmPrompt: realmPromptContent
    });
    const worldGenerationExtraPrompt = 按功能开关过滤提示词内容([
        世界观生成COT提示词,
        fandomPromptBundle.世界观创建补丁,
        启用修炼体系 && (fandomEnabled || isXianxiaOpening) && realmPromptContent
            ? [
                isXianxiaOpening ? '【已固定仙侠境界体系参考】' : '【同人境界体系参考】',
                isXianxiaOpening
                    ? '- 仙侠境界体系由项目内置固定映射提供；world_prompt 的力量常识、高手稀缺度、强弱断层与术语口径必须跟随这份体系，不得回退默认武侠术语或自行生成新境界。'
                    : '- 若实际开局启用同人境界生成，运行时会先生成同人境界体系；此预览保留当前可见参考，最终请求以开局时生成结果为准。',
                '- 生成 world_prompt 时只提炼概述级境界与力量边界，不得把完整映射、阶段推进表或大境突破表原样抄回世界观正文。',
                realmPromptContent
            ].join('\n')
            : '',
        normalizedWorldExtraRequirement ? `【玩家世界观草稿与细化要求】\n${normalizedWorldExtraRequirement}\n- 必须优先保留玩家已写明的事实、地名、势力、时代、规则和禁忌。\n- 生成时只补全缺口、细化因果、补齐长期运行结构，不得推翻、绕开或替换玩家草稿。` : '',
        获取繁体输出指令(normalizedGameConfig)
    ]
        .filter(Boolean)
        .join('\n\n')
        .trim(), normalizedGameConfig);

    const systemPrompt = 获取世界观生成系统提示词(normalizedGameConfig, openingConfig);
    const userPrompt = [
        构建世界观生成用户提示词(worldGenerationContext, charData, normalizedGameConfig, openingConfig),
        worldGenerationExtraPrompt ? `【最终输出附加要求】\n${worldGenerationExtraPrompt}` : ''
    ].filter(Boolean).join('\n\n');

    return [
        '【开局世界观生成提示词预览】',
        '以下内容按当前开局表单拼装，可复制到外部模型或网页搜索工作流中使用。',
        '如果开局时启用了同人境界生成，实际运行会先生成境界体系，再把生成结果注入世界观请求；本预览会尽量展示当前可确定部分。',
        分隔('system'),
        systemPrompt,
        分隔('user'),
        userPrompt,
        分隔('assistant 预置回复'),
        世界观生成COT伪装历史消息提示词
    ].join('\n').trim();
};
