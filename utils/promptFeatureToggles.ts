import type { 游戏设置结构 } from '../types';

const 生理系统提示词关键词正则 = /(饱腹|口渴|水分|饥饿|脱水)/u;
const 功能附加块正则 = /<!--\s*PROMPT_FEATURE:([a-z0-9_-]+):START\s*-->([\s\S]*?)<!--\s*PROMPT_FEATURE:\1:END\s*-->/giu;

const 按关键词过滤整行 = (content: string, keyword: RegExp): string => (
    (content || '')
        .split('\n')
        .filter((line) => !keyword.test(line))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
);

export const 过滤饱腹口渴提示词行 = (content: string): string => (
    按关键词过滤整行(content, 生理系统提示词关键词正则)
);

const 归一化功能附加块内容 = (content: string): string => (
    (content || '')
        .replace(/\r\n/g, '\n')
        .trim()
);

const 功能附加块是否启用 = (
    featureId: string,
    config?: Partial<游戏设置结构> | null
): boolean => {
    switch ((featureId || '').trim().toLowerCase()) {
        case 'survival':
            return config?.启用饱腹口渴系统 !== false;
        case 'femboy_nsfw':
            return config?.启用NSFW模式 === true && config?.启用男娘NSFW内容 !== false;
        default:
            return true;
    }
};

export const 构建功能附加块 = (featureId: string, content: string): string => {
    const normalizedFeatureId = (featureId || '').trim().toLowerCase();
    const normalizedContent = 归一化功能附加块内容(content);
    if (!normalizedFeatureId || !normalizedContent) return '';
    return [
        `<!-- PROMPT_FEATURE:${normalizedFeatureId}:START -->`,
        normalizedContent,
        `<!-- PROMPT_FEATURE:${normalizedFeatureId}:END -->`
    ].join('\n');
};

export const 构建男娘NSFW附加块 = (content: string): string => (
    构建功能附加块('femboy_nsfw', content)
);

export const 构建成长体系附加块 = (_content: string | string[]): string => '';

const 旧成长体系字段正则 = /(境界|内力|修炼)/u;

const 成长体系启用 = (config?: unknown): boolean => (
    Boolean(config && typeof config === 'object' && (config as any).启用成长体系 === true)
);

const 裁剪旧成长体系字段 = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map((item) => 裁剪旧成长体系字段(item));
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
        if (旧成长体系字段正则.test(key)) return;
        result[key] = 裁剪旧成长体系字段(child);
    });
    return result;
};

export const 裁剪成长体系上下文数据 = <T,>(value: T, config?: unknown): T => (
    成长体系启用(config)
        ? value
        : 裁剪旧成长体系字段(value) as T
);

const 解析功能附加块 = (
    content: string,
    config?: Partial<游戏设置结构> | null
): string => {
    let next = typeof content === 'string' ? content : '';
    let previous = '';
    while (next !== previous) {
        previous = next;
        next = next.replace(功能附加块正则, (_match, featureId: string, body: string) => (
            功能附加块是否启用(featureId, config)
                ? 归一化功能附加块内容(body)
                : ''
        ));
    }
    return next;
};

export const 按功能开关过滤提示词内容 = (
    content: string,
    config?: Partial<游戏设置结构> | null
): string => {
    let next = 解析功能附加块(typeof content === 'string' ? content : '', config);
    if (config?.启用饱腹口渴系统 === false) {
        next = 过滤饱腹口渴提示词行(next);
    }
    return next
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};
