import {
    角色数据结构,
    环境信息结构,
    NPC结构,
    世界数据结构,
    剧情系统结构,
    剧情规划结构,
    女主剧情规划结构,
    玩家组织结构,
    任务结构
} from '../types';

type 状态命令动作 = 'set' | 'add' | 'push' | 'delete' | 'sub';

const 根路径列表 = [
    '女主剧情规划',
    '剧情规划',
    '玩家组织',
    '任务列表',
    '记忆系统',
    '角色',
    '环境',
    '社交',
    '世界',
    '剧情'
] as const;

type 支持根路径类型 = typeof 根路径列表[number];

type 命令结果结构 = {
    char: 角色数据结构;
    env: 环境信息结构;
    social: NPC结构[];
    world: 世界数据结构;
    story: 剧情系统结构;
    storyPlan: 剧情规划结构;
    heroinePlan: 女主剧情规划结构 | undefined;
    sect: 玩家组织结构;
    tasks: 任务结构[];
};

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 是对象 = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const 读取社交姓名字段 = (value: any): string => {
    if (!是对象(value)) return '';
    return [value.姓名, value.名字, value.名称, value.name]
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .find(Boolean) || '';
};

const 是否社交新增整对象命令 = (root: 支持根路径类型, rest: string, action: 状态命令动作): boolean => {
    if (root !== '社交') return false;
    if (!['push', 'add'].includes(action)) return false;
    const path = (rest || '').trim();
    return path === '' || /^\[\d+\]$/u.test(path);
};

const 读取社交槽位索引 = (root: 支持根路径类型, rest: string, action: 状态命令动作): number | null => {
    if (root !== '社交' || action !== 'set') return null;
    const match = (rest || '').trim().match(/^\[(\d+)\]$/u);
    return match ? Number(match[1]) : null;
};

const 是否非法社交整对象值 = (value: any): boolean => (
    !是对象(value) || !读取社交姓名字段(value)
);

const 深合并对象 = (left: any, right: any): any => {
    if (Array.isArray(right)) return 深拷贝(right);
    if (!是对象(right)) return 深拷贝(right);
    const seed = 是对象(left) ? 深拷贝(left) : {};
    Object.entries(right).forEach(([key, value]) => {
        seed[key] = 深合并对象(seed[key], value);
    });
    return seed;
};

const 世界相对根字段 = ['活跃NPC列表', '待执行事件', '进行中事件', '已结算事件', '世界镜头规划', '江湖史册', '地图', '建筑', '地图层级', '地图建筑', '地图道路', '地图人物', '势力列表', '势力互动历史'];
const 环境相对根字段 = ['环境变量', '大地点', '中地点', '小地点', '具体地点', '时间'];
const 剧情相对根字段 = ['当前章节', '下一章预告', '历史卷宗'];
const 剧情规划相对根字段 = ['当前章目标', '当前章任务', '跨章延续事项', '待触发事件', '镜头规划', '换章规则'];
const 女主规划相对根字段 = ['阶段推进', '女主条目', '女主互动事件', '女主镜头规划'];
const 背包别名字段 = ['背包', '行囊', '物品列表'];

const 废弃世界地图字段 = new Set(['地图', '建筑', '地图建筑', '地图道路', '地图人物']);
const 废弃环境字段 = new Set(['天气', '节日']);
const 废弃命令根路径 = new Set(['战斗', '战斗态势']);
const 废弃玩家组织字段 = new Set(['任务列表']);

export const 是否废弃世界地图字段路径 = (normalizedKey: string): boolean => {
    const comparable = (normalizedKey || '').trim().replace(/^gameState\./, '');
    const match = comparable.match(/^世界(?:\.|\[|$)([^.\[]*)/u);
    if (!match) return false;
    return 废弃世界地图字段.has(match[1] || '');
};

export const 是否废弃环境字段路径 = (normalizedKey: string): boolean => {
    const comparable = (normalizedKey || '').trim().replace(/^gameState\./, '');
    const root = comparable.split(/[.\[]/u)[0] || '';
    if (废弃环境字段.has(root)) return true;
    const match = comparable.match(/^环境(?:\.|\[|$)([^.\[]*)/u);
    if (!match) return false;
    return 废弃环境字段.has(match[1] || '');
};

export const 是否废弃命令根路径 = (normalizedKey: string): boolean => {
    const comparable = (normalizedKey || '').trim().replace(/^gameState\./, '');
    const root = comparable.split(/[.\[]/u)[0] || '';
    return 废弃命令根路径.has(root);
};

export const 是否废弃玩家组织字段路径 = (normalizedKey: string): boolean => {
    const comparable = (normalizedKey || '').trim().replace(/^gameState\./, '');
    const match = comparable.match(/^玩家组织(?:\.|\[|$)([^.\[]*)/u);
    if (!match) return false;
    return 废弃玩家组织字段.has(match[1] || '');
};

export const normalizeStateCommandKey = (rawKey: string): string => {
    const raw = (rawKey || '').trim();
    const hasGameStatePrefix = raw.startsWith('gameState.');
    const withoutPrefix = hasGameStatePrefix ? raw.slice('gameState.'.length) : raw;
    const alias = 背包别名字段.find((head) => withoutPrefix === head || withoutPrefix.startsWith(`${head}.`) || withoutPrefix.startsWith(`${head}[`));
    const key = alias ? `角色.物品列表${withoutPrefix.slice(alias.length)}` : withoutPrefix;
    if (!key) return '';

    if (hasGameStatePrefix) {
        return `gameState.${key}`;
    }

    for (const root of 根路径列表) {
        if (key === root) return `gameState.${root}`;
        if (key.startsWith(`${root}.`)) return `gameState.${key}`;
        if (key.startsWith(`${root}[`)) return `gameState.${key}`;
    }

    if (世界相对根字段.some((head) => key === head || key.startsWith(`${head}.`) || key.startsWith(`${head}[`))) {
        return `gameState.世界.${key}`;
    }
    if (环境相对根字段.some((head) => key === head || key.startsWith(`${head}.`) || key.startsWith(`${head}[`))) {
        return `gameState.环境.${key}`;
    }
    if (剧情相对根字段.some((head) => key === head || key.startsWith(`${head}.`) || key.startsWith(`${head}[`))) {
        return `gameState.剧情.${key}`;
    }
    if (剧情规划相对根字段.some((head) => key === head || key.startsWith(`${head}.`) || key.startsWith(`${head}[`))) {
        return `gameState.剧情规划.${key}`;
    }
    if (女主规划相对根字段.some((head) => key === head || key.startsWith(`${head}.`) || key.startsWith(`${head}[`))) {
        return `gameState.女主剧情规划.${key}`;
    }
    return key;
};

const 提取根路径 = (normalizedKey: string): { root: 支持根路径类型; rest: string } | null => {
    for (const root of 根路径列表) {
        const exact = `gameState.${root}`;
        if (normalizedKey === exact) {
            return { root, rest: '' };
        }
        if (normalizedKey.startsWith(`${exact}.`)) {
            return { root, rest: normalizedKey.slice(exact.length + 1) };
        }
        if (normalizedKey.startsWith(`${exact}[`)) {
            return { root, rest: normalizedKey.slice(exact.length) };
        }
    }
    return null;
};

const 解析路径片段 = (rawPath: string): Array<string | number> => {
    const tokens: Array<string | number> = [];
    const regex = /([^. \[\]]+)|\[(\d+)\]/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(rawPath || ''))) {
        if (match[1]) tokens.push(match[1]);
        if (match[2] !== undefined) tokens.push(Number(match[2]));
    }
    return tokens;
};

const 应用路径命令 = (
    rootValue: any,
    rawPath: string,
    action: 状态命令动作,
    nextValue: any
): any => {
    const tokens = 解析路径片段(rawPath);

    if (tokens.length === 0) {
        if (action === 'delete') return undefined;
        if (action === 'push') {
            const base = Array.isArray(rootValue) ? 深拷贝(rootValue) : [];
            base.push(深拷贝(nextValue));
            return base;
        }
        if (action === 'add') {
            return (Number(rootValue) || 0) + (Number(nextValue) || 0);
        }
        if (action === 'sub') {
            return (Number(rootValue) || 0) - (Number(nextValue) || 0);
        }
        if (是对象(rootValue) && 是对象(nextValue)) {
            return 深合并对象(rootValue, nextValue);
        }
        return 深拷贝(nextValue);
    }

    const draft = rootValue === undefined
        ? (typeof tokens[0] === 'number' ? [] : {})
        : 深拷贝(rootValue);

    let cursor: any = draft;
    for (let index = 0; index < tokens.length - 1; index += 1) {
        const token = tokens[index];
        const nextToken = tokens[index + 1];
        if (typeof token === 'number') {
            if (!Array.isArray(cursor)) return draft;
            if (cursor[token] === undefined) {
                cursor[token] = typeof nextToken === 'number' ? [] : {};
            }
            cursor = cursor[token];
            continue;
        }
        if (cursor[token] === undefined || cursor[token] === null || typeof cursor[token] !== 'object') {
            cursor[token] = typeof nextToken === 'number' ? [] : {};
        }
        cursor = cursor[token];
    }

    const lastToken = tokens[tokens.length - 1];
    if (typeof lastToken === 'number') {
        if (!Array.isArray(cursor)) return draft;
        if (action === 'delete') {
            if (lastToken >= 0 && lastToken < cursor.length) {
                cursor.splice(lastToken, 1);
            }
            return draft;
        }
        if (action === 'push') {
            const current = Array.isArray(cursor[lastToken]) ? cursor[lastToken] : [];
            current.push(深拷贝(nextValue));
            cursor[lastToken] = current;
            return draft;
        }
        if (action === 'add') {
            cursor[lastToken] = (Number(cursor[lastToken]) || 0) + (Number(nextValue) || 0);
            return draft;
        }
        if (action === 'sub') {
            cursor[lastToken] = (Number(cursor[lastToken]) || 0) - (Number(nextValue) || 0);
            return draft;
        }
        if (是对象(cursor[lastToken]) && 是对象(nextValue)) {
            cursor[lastToken] = 深合并对象(cursor[lastToken], nextValue);
            return draft;
        }
        cursor[lastToken] = 深拷贝(nextValue);
        return draft;
    }

    if (action === 'delete') {
        delete cursor[lastToken];
        return draft;
    }
    if (action === 'push') {
        const current = Array.isArray(cursor[lastToken]) ? cursor[lastToken] : [];
        current.push(深拷贝(nextValue));
        cursor[lastToken] = current;
        return draft;
    }
    if (action === 'add') {
        cursor[lastToken] = (Number(cursor[lastToken]) || 0) + (Number(nextValue) || 0);
        return draft;
    }
    if (action === 'sub') {
        cursor[lastToken] = (Number(cursor[lastToken]) || 0) - (Number(nextValue) || 0);
        return draft;
    }
    if (是对象(cursor[lastToken]) && 是对象(nextValue)) {
        cursor[lastToken] = 深合并对象(cursor[lastToken], nextValue);
        return draft;
    }
    cursor[lastToken] = 深拷贝(nextValue);
    return draft;
};

export const readGameStateValueByPath = (stateLike: any, rawPath: string): any => {
    const normalizedPath = normalizeStateCommandKey(rawPath);
    if (!normalizedPath.startsWith('gameState.')) return undefined;
    const parsed = 提取根路径(normalizedPath);
    if (!parsed) return undefined;

    let current = stateLike?.[parsed.root];
    for (const token of 解析路径片段(parsed.rest)) {
        if (current === undefined || current === null) return undefined;
        current = current[token as any];
    }
    return current;
};

export const applyStateCommand = (
    rootCharacter: 角色数据结构,
    rootEnv: 环境信息结构,
    rootSocial: NPC结构[],
    rootWorld: 世界数据结构,
    rootStory: 剧情系统结构,
    rootStoryPlan: 剧情规划结构,
    rootHeroinePlan: 女主剧情规划结构 | undefined,
    rootSect: 玩家组织结构,
    rootTasks: 任务结构[],
    key: string,
    value: any,
    action: 状态命令动作
): 命令结果结构 => {
    const normalizedKey = normalizeStateCommandKey(key);
    const parsed = 提取根路径(normalizedKey);

    const result: 命令结果结构 = {
        char: rootCharacter,
        env: rootEnv,
        social: rootSocial,
        world: rootWorld,
        story: rootStory,
        storyPlan: rootStoryPlan,
        heroinePlan: rootHeroinePlan,
        sect: rootSect,
        tasks: rootTasks
    };

    if (!parsed) {
        return result;
    }

    if (是否废弃命令根路径(normalizedKey)) {
        return result;
    }

    if (是否废弃玩家组织字段路径(normalizedKey)) {
        return result;
    }

    if (是否废弃环境字段路径(normalizedKey)) {
        return result;
    }

    if (action !== 'delete' && 是否废弃世界地图字段路径(normalizedKey)) {
        return result;
    }

    if (parsed.root === '社交' && action === 'set' && parsed.rest === '' && !Array.isArray(value)) {
        return result;
    }

    const socialSlotIndex = 读取社交槽位索引(parsed.root, parsed.rest, action);
    if (socialSlotIndex !== null) {
        if (!是对象(value)) return result;
        if (!Array.isArray(rootSocial) || rootSocial[socialSlotIndex] === undefined) {
            if (是否非法社交整对象值(value)) return result;
        }
    }

    if (是否社交新增整对象命令(parsed.root, parsed.rest, action) && 是否非法社交整对象值(value)) {
        return result;
    }

    const 写回根路径 = (root: 支持根路径类型, next: any) => {
        switch (root) {
            case '角色':
                result.char = next as 角色数据结构;
                break;
            case '环境':
                result.env = next as 环境信息结构;
                break;
            case '社交':
                result.social = Array.isArray(next) ? next as NPC结构[] : [];
                break;
            case '世界':
                result.world = next as 世界数据结构;
                break;
            case '剧情':
                result.story = next as 剧情系统结构;
                break;
            case '剧情规划':
                result.storyPlan = next as 剧情规划结构;
                break;
            case '女主剧情规划':
                result.heroinePlan = next as 女主剧情规划结构 | undefined;
                break;
            case '玩家组织':
                result.sect = next as 玩家组织结构;
                break;
            case '任务列表':
                result.tasks = Array.isArray(next) ? next as 任务结构[] : [];
                break;
            default:
                break;
        }
    };

    const 读取当前根值 = () => {
        switch (parsed.root) {
            case '角色':
                return result.char;
            case '环境':
                return result.env;
            case '社交':
                return result.social;
            case '世界':
                return result.world;
            case '剧情':
                return result.story;
            case '剧情规划':
                return result.storyPlan;
            case '女主剧情规划':
                return result.heroinePlan;
            case '玩家组织':
                return result.sect;
            case '任务列表':
                return result.tasks;
            default:
                return undefined;
        }
    };

    写回根路径(parsed.root, 应用路径命令(读取当前根值(), parsed.rest, action, value));
    return result;
};
