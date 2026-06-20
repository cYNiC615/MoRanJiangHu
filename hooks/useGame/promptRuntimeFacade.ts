import type {
    OpeningConfig,
    世界书作用域,
    提示词结构,
    记忆系统结构
} from '../../types';
import { 执行游戏后台重计算 } from '../../utils/gameHeavyWorkerClient';
import {
    构建系统提示词 as 构建系统提示词工作流,
    type 系统提示词构建参数,
    type 系统提示词构建结果
} from './systemPromptBuilder';

export type PromptRuntimeBuildOptions = {
    禁用中期长期记忆?: boolean;
    禁用短期记忆?: boolean;
    禁用世界演变分流?: boolean;
    禁用行动选项提示词?: boolean;
    注入剧情推动协议?: boolean;
    注入女主剧情规划协议?: boolean;
    世界书作用域?: 世界书作用域[];
    世界书附加文本?: string[];
    openingConfig?: OpeningConfig;
    强制剧情COT提示词ID?: string;
};

export type PromptRuntimeFacadeDeps = {
    获取导演配置: () => unknown;
    获取游戏设置: () => 系统提示词构建参数['gameConfig'];
    获取记忆配置: () => 系统提示词构建参数['memoryConfig'];
    获取玩家姓名: () => string | undefined;
    获取内置提示词列表: () => 系统提示词构建参数['builtinPromptEntries'];
    获取世界书列表: () => 系统提示词构建参数['worldbooks'];
    世界演变功能已开启: () => boolean;
};

export type PromptRuntimeFacade = {
    构建系统提示词: (
        promptPool: 提示词结构[],
        memoryData: 记忆系统结构,
        socialData: any[],
        statePayload: any,
        options?: PromptRuntimeBuildOptions
    ) => Promise<系统提示词构建结果>;
};

export const 创建PromptRuntimeFacade = (deps: PromptRuntimeFacadeDeps): PromptRuntimeFacade => ({
    构建系统提示词: (promptPool, memoryData, socialData, statePayload, options) => {
        const payload: 系统提示词构建参数 = {
            promptPool,
            memoryData,
            socialData,
            statePayload: {
                ...(statePayload || {}),
                导演配置: deps.获取导演配置()
            },
            gameConfig: deps.获取游戏设置(),
            memoryConfig: deps.获取记忆配置(),
            fallbackPlayerName: deps.获取玩家姓名(),
            builtinPromptEntries: deps.获取内置提示词列表(),
            worldbooks: deps.获取世界书列表(),
            worldEvolutionEnabled: deps.世界演变功能已开启(),
            options
        };
        return 执行游戏后台重计算(
            'buildSystemPrompt',
            payload,
            () => 构建系统提示词工作流(payload)
        );
    }
});
