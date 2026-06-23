import { normalizeCanonicalGameTime, 标准时间串转结构化 } from './timeUtils';

const 占位游戏初始时间 = '1:01:01:00:00';

const 规范化可恢复时间 = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const canonical = normalizeCanonicalGameTime(value.trim());
    if (!canonical || canonical === 占位游戏初始时间) return null;
    return canonical;
};

const 比较标准时间 = (a: string, b: string): number => {
    const left = 标准时间串转结构化(a);
    const right = 标准时间串转结构化(b);
    if (!left || !right) return a.localeCompare(b);
    return (left.年 - right.年)
        || (left.月 - right.月)
        || (left.日 - right.日)
        || (left.时 - right.时)
        || (left.分 - right.分);
};

const 收集回忆时间候选 = (memory: any): string[] => {
    const 回忆档案 = Array.isArray(memory?.回忆档案) ? memory.回忆档案 : [];
    return 回忆档案
        .flatMap((item: any) => [
            规范化可恢复时间(item?.gameTime),
            规范化可恢复时间(item?.记录时间),
            规范化可恢复时间(item?.时间戳)
        ])
        .filter((item): item is string => Boolean(item));
};

export const 从历史与回忆恢复游戏初始时间 = (history: any[] = [], memory?: any): string => {
    const 历史时间候选 = (Array.isArray(history) ? history : [])
        .map((item: any) => 规范化可恢复时间(item?.gameTime))
        .filter((item): item is string => Boolean(item));
    const all = [...历史时间候选, ...收集回忆时间候选(memory)].sort(比较标准时间);
    return all[0] || '';
};

export const 补全缺失游戏初始时间 = (
    current: string | null | undefined,
    history: any[] = [],
    memory?: any
): string => {
    const existing = typeof current === 'string' ? current.trim() : '';
    if (existing) return existing;
    return 从历史与回忆恢复游戏初始时间(history, memory);
};
