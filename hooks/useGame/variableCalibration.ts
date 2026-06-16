import type {
    角色数据结构,
    环境信息结构,
    世界数据结构,
    玩家组织结构,
    剧情系统结构,
    剧情规划结构,
    女主剧情规划结构
} from '../../types';

export type 变量校准状态 = {
    角色: 角色数据结构;
    环境: 环境信息结构;
    社交: any[];
    世界: 世界数据结构;
    玩家组织: 玩家组织结构;
    任务列表: any[];
    剧情: 剧情系统结构;
    剧情规划: 剧情规划结构;
    女主剧情规划?: 女主剧情规划结构;
};

type 变量校准依赖 = {
    规范化环境信息: (envLike?: any) => 环境信息结构;
    规范化社交列表: (raw?: any[], options?: { 合并同名?: boolean }) => any[];
    规范化世界状态: (raw?: any) => 世界数据结构;
    规范化组织状态: (raw?: any) => 玩家组织结构;
    规范化剧情状态: (raw?: any, envLike?: any) => 剧情系统结构;
    规范化剧情规划状态: (raw?: any) => 剧情规划结构;
    规范化女主剧情规划状态: (raw?: any) => 女主剧情规划结构 | undefined;
    规范化角色物品容器映射: (raw?: any, options?: { 当前时间?: unknown; 事件文本?: string }) => 角色数据结构;
};

const 夹取数值 = (value: number, min: number, max: number): number => {
    if (!Number.isFinite(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
};

export const 执行变量自动校准 = (
    inputState: 变量校准状态,
    deps: 变量校准依赖
): { state: 变量校准状态; corrections: string[] } => {
    const corrections: string[] = [];
    const 角色 = deps.规范化角色物品容器映射(inputState.角色, { 当前时间: inputState.环境 });

    const 校准当前值 = (currentKey: keyof 角色数据结构, maxKey: keyof 角色数据结构, label: string) => {
        const rawCurrent = Number(角色[currentKey]);
        const rawMax = Math.max(0, Number(角色[maxKey]) || 0);
        const nextCurrent = 夹取数值(rawCurrent, 0, rawMax);
        if (!Number.isFinite(rawCurrent) || nextCurrent !== rawCurrent) {
            corrections.push(`${label}(${rawCurrent} -> ${nextCurrent})`);
            (角色 as any)[currentKey] = nextCurrent;
        }
        if (!Number.isFinite(Number(角色[maxKey])) || Number(角色[maxKey]) < 0) {
            corrections.push(`${String(maxKey)}(${角色[maxKey]} -> ${rawMax})`);
            (角色 as any)[maxKey] = rawMax;
        }
    };

    校准当前值('当前精力', '最大精力', '精力');
    校准当前值('当前内力', '最大内力', '内力');
    校准当前值('当前饱腹', '最大饱腹', '饱腹');
    校准当前值('当前口渴', '最大口渴', '口渴');

    const 部位列表 = ['头部', '胸部', '腹部', '左手', '右手', '左腿', '右腿'] as const;
    部位列表.forEach((part) => {
        const currentKey = `${part}当前血量` as keyof 角色数据结构;
        const maxKey = `${part}最大血量` as keyof 角色数据结构;
        校准当前值(currentKey, maxKey, `${part}血量`);
    });

    const 环境 = deps.规范化环境信息(inputState.环境);
    const 社交 = deps.规范化社交列表(inputState.社交, { 合并同名: false });
    const 世界 = deps.规范化世界状态(inputState.世界);
    const 玩家组织 = deps.规范化组织状态(inputState.玩家组织);
    const 剧情 = deps.规范化剧情状态(inputState.剧情, 环境);
    const 剧情规划 = deps.规范化剧情规划状态(inputState.剧情规划);
    const 女主剧情规划 = deps.规范化女主剧情规划状态(inputState.女主剧情规划);

    return {
        state: {
            角色,
            环境,
            社交,
            世界,
            玩家组织,
            任务列表: Array.isArray(inputState.任务列表) ? inputState.任务列表 : [],
            剧情,
            剧情规划,
            女主剧情规划
        },
        corrections
    };
};
