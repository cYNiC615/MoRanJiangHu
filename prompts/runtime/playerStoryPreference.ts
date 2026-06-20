import type { OpeningConfig } from '../../types';

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const 读取玩家剧情倾向 = (openingConfig?: OpeningConfig | null): string => (
    读取文本(openingConfig?.导演配置?.玩家剧情倾向)
    || 读取文本(openingConfig?.玩家剧情倾向)
);

export const 构建玩家剧情倾向提示词 = (
    openingConfig?: OpeningConfig | null,
    options?: { stage?: string }
): string => {
    const preference = 读取玩家剧情倾向(openingConfig);
    if (!preference) return '';
    const stage = 读取文本(options?.stage) || 'runtime';
    return [
        '【玩家剧情倾向】',
        `- 作用阶段：${stage}。`,
        '- 这是本存档的导演偏好，不是世界事实、记忆、任务事实或角色已知情报。',
        '- 使用方式：作为情节取舍、镜头分配、关系推进节奏和后续规划的软约束；若与建档硬约束、世界观母本或玩家最新输入冲突，以后者为准。',
        `- 原文：${preference}`
    ].join('\n');
};
