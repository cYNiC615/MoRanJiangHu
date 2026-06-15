import type { OpeningConfig, WorldGenConfig, 游戏设置结构, 提示词结构, 角色数据结构 } from '../types';
import { 默认提示词 } from '../prompts';
import { 获取世界观生成系统提示词, 构建世界观生成用户提示词 } from '../prompts/runtime/worldGeneration';
import { 世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../prompts/runtime/worldGenerationCot';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词 } from '../prompts/runtime/worldSetup';
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

    const worldPromptSeed = 按功能开关过滤提示词内容(
        构建世界观种子提示词(worldConfig, charData, openingConfig),
        normalizedGameConfig
    );

    const enabledDifficultyPrompts = promptPool
        .map((prompt) => (
            prompt.类型 === '难度设定'
                ? { ...prompt, 启用: prompt.id.endsWith(`_${difficulty}`) }
                : prompt
        ))
        .filter((prompt) => prompt.类型 === '难度设定' && prompt.启用)
        .map((prompt) => 按功能开关过滤提示词内容(`【${prompt.标题}】\n${prompt.内容}`, normalizedGameConfig))
        .join('\n\n');

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
    const worldGenerationExtraPrompt = 按功能开关过滤提示词内容([
        世界观生成COT提示词,
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
        分隔('system'),
        systemPrompt,
        分隔('user'),
        userPrompt,
        分隔('assistant 预置回复'),
        世界观生成COT伪装历史消息提示词
    ].join('\n').trim();
};
