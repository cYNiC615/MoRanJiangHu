import type { TavernCommand } from '../../types';
import { applyStateCommand, normalizeStateCommandKey, 是否废弃命令根路径 } from '../../utils/stateHelpers';
import { preserveInventoryOnUnsafeRoleReplace, sanitizeInventoryCommand } from './inventoryCommandGuard';
import { 同步角色与组织状态 } from './storyState';

const 同步剧情时间校准 = async ({ nextStory }: { previousStory: any; nextStory: any; envLike: any }) => nextStory;

export type 运行时变量分区类型 =
    | '角色'
    | '环境'
    | '社交'
    | '世界'
    | '剧情'
    | '剧情规划'
    | '女主剧情规划'
    | '玩家组织'
    | '任务列表'
    | '记忆系统';

type 运行时变量工作流依赖 = {
    获取历史记录: () => any[];
    深拷贝: <T,>(value: T) => T;
    获取当前状态: () => {
        角色: any;
        环境: any;
        社交: any[];
        世界: any;
        剧情: any;
        剧情规划: any;
        女主剧情规划: any;
        玩家组织: any;
        任务列表: any[];
        记忆系统: any;
    };
    规范化角色物品容器映射: (value: any, options?: { 当前时间?: unknown; 事件文本?: string }) => any;
    规范化环境信息: (value: any) => any;
    规范化社交列表: (value: any[], options?: { 合并同名?: boolean; 保留非姓名库主要女性名?: boolean }) => any[];
    规范化世界状态: (value: any) => any;
    规范化剧情状态: (value: any) => any;
    规范化剧情规划状态: (value: any) => any;
    规范化女主剧情规划状态: (value: any) => any;
    规范化组织状态: (value: any) => any;
    规范化记忆系统: (value: any) => any;
    环境时间转标准串: (value: any) => string;
    获取开局配置: () => any;
    设置角色: (value: any) => void;
    设置环境: (value: any) => void;
    设置社交: (value: any) => void;
    设置世界: (value: any) => void;
    设置剧情: (value: any) => void;
    设置剧情规划: (value: any) => void;
    设置女主剧情规划: (value: any) => void;
    设置玩家组织: (value: any) => void;
    设置任务列表: (value: any) => void;
    应用并同步记忆系统: (value: any) => void;
    performAutoSave: (snapshot: any) => Promise<any> | any;
    女主规划已启用?: () => boolean;
};

const 是否女主规划分区 = (section: string): boolean => (
    section === '女主剧情规划'
);

const 是否女主规划命令 = (rawKey: string): boolean => {
    const normalizedKey = normalizeStateCommandKey(rawKey || '');
    return normalizedKey === 'gameState.女主剧情规划'
        || normalizedKey.startsWith('gameState.女主剧情规划.')
        || normalizedKey.startsWith('gameState.女主剧情规划[');
};

const 是否废弃运行时变量分区 = (section: string): boolean => (
    是否废弃命令根路径(normalizeStateCommandKey(section || ''))
);

export const 创建运行时变量工作流 = (deps: 运行时变量工作流依赖) => {
    const 女主规划允许写入 = () => deps.女主规划已启用?.() !== false;

    const 解析嵌套路径片段 = (path: string): Array<string | number> => (
        (path || '')
            .split('.')
            .filter(Boolean)
            .flatMap((segment) => {
                const tokens: Array<string | number> = [];
                const regex = /([^\[\]]+)|\[(\d+)\]/g;
                let match: RegExpExecArray | null = null;
                while ((match = regex.exec(segment))) {
                    if (match[1]) tokens.push(match[1]);
                    if (match[2] !== undefined) tokens.push(Number(match[2]));
                }
                return tokens;
            })
    );

    const 应用嵌套路径命令 = (rootValue: any, rawPath: string, action: TavernCommand['action'], nextValue: any): any => {
        const segments = 解析嵌套路径片段(rawPath);
        if (segments.length === 0) {
            if (action === 'delete') return undefined;
            return deps.深拷贝(nextValue);
        }
        const draft = deps.深拷贝(rootValue);
        let cursor: any = draft;
        for (let index = 0; index < segments.length - 1; index += 1) {
            const key = segments[index];
            const following = segments[index + 1];
            if (typeof key === 'number') {
                if (!Array.isArray(cursor)) return draft;
                if (cursor[key] === undefined) {
                    cursor[key] = typeof following === 'number' ? [] : {};
                }
                cursor = cursor[key];
                continue;
            }
            if (!cursor[key] || typeof cursor[key] !== 'object') {
                cursor[key] = typeof following === 'number' ? [] : {};
            }
            cursor = cursor[key];
        }
        const lastKey = segments[segments.length - 1];
        if (action === 'delete') {
            if (typeof lastKey === 'number' && Array.isArray(cursor)) {
                cursor.splice(lastKey, 1);
            } else if (cursor && typeof cursor === 'object') {
                delete cursor[lastKey as any];
            }
            return draft;
        }
        if (action === 'push') {
            const existing = cursor?.[lastKey as any];
            cursor[lastKey as any] = Array.isArray(existing)
                ? [...existing, deps.深拷贝(nextValue)]
                : [deps.深拷贝(nextValue)];
            return draft;
        }
        if (action === 'add') {
            const current = cursor?.[lastKey as any];
            if (typeof current === 'number') {
                cursor[lastKey as any] = current + (Number(nextValue) || 0);
            } else if (Array.isArray(current)) {
                cursor[lastKey as any] = [...current, deps.深拷贝(nextValue)];
            } else if (current && typeof current === 'object' && nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)) {
                cursor[lastKey as any] = { ...current, ...deps.深拷贝(nextValue) };
            } else {
                cursor[lastKey as any] = deps.深拷贝(nextValue);
            }
            return draft;
        }
        cursor[lastKey as any] = deps.深拷贝(nextValue);
        return draft;
    };

    const updateRuntimeVariableSection = async (section: 运行时变量分区类型, value: any) => {
        if (是否废弃运行时变量分区(section)) return;
        if (!女主规划允许写入() && 是否女主规划分区(section)) return;
        const 历史记录 = deps.获取历史记录();
        const 当前状态 = deps.获取当前状态();
        switch (section) {
            case '角色': {
                const nextValue = deps.规范化角色物品容器映射(
                    preserveInventoryOnUnsafeRoleReplace(value || {}, 当前状态.角色),
                    { 当前时间: 当前状态.环境 }
                );
                deps.设置角色(nextValue);
                void deps.performAutoSave({ char: nextValue, history: 历史记录, force: true });
                return;
            }
            case '环境': {
                const nextValue = deps.规范化环境信息(value || {});
                deps.设置环境(nextValue);
                void deps.performAutoSave({ env: nextValue, history: 历史记录, force: true });
                return;
            }
            case '社交': {
                let nextValue = deps.规范化社交列表(Array.isArray(value) ? value : [], { 合并同名: false, 保留非姓名库主要女性名: true });
                // 过滤与主角同名的NPC条目，防止主角被NPC化
                const playerName = typeof 当前状态.角色?.姓名 === 'string' ? 当前状态.角色.姓名.trim().replace(/\s+/g, '').toLowerCase() : '';
                if (playerName) {
                    nextValue = nextValue.filter((npc: any) => {
                        const npcName = typeof npc?.姓名 === 'string' ? npc.姓名.trim().replace(/\s+/g, '').toLowerCase() : '';
                        return !npcName || npcName !== playerName;
                    });
                }
                deps.设置社交(nextValue);
                void deps.performAutoSave({ social: nextValue, history: 历史记录, force: true });
                return;
            }
            case '世界': {
                const nextValue = deps.规范化世界状态(value);
                deps.设置世界(nextValue);
                void deps.performAutoSave({ world: nextValue, history: 历史记录, force: true });
                return;
            }
            case '剧情': {
                const nextValue = deps.规范化剧情状态(value);
                deps.设置剧情(nextValue);
                void deps.performAutoSave({ story: nextValue, history: 历史记录, force: true });
                return;
            }
            case '剧情规划': {
                const nextValue = deps.规范化剧情规划状态(value);
                deps.设置剧情规划(nextValue);
                void deps.performAutoSave({ storyPlan: nextValue, history: 历史记录, force: true });
                return;
            }
            case '女主剧情规划': {
                const nextValue = deps.规范化女主剧情规划状态(value);
                deps.设置女主剧情规划(nextValue);
                void deps.performAutoSave({ heroinePlan: nextValue, history: 历史记录, force: true });
                return;
            }
            case '玩家组织': {
                const synced = 同步角色与组织状态({
                    角色: 当前状态.角色,
                    玩家组织: deps.规范化组织状态(value)
                });
                deps.设置角色(synced.角色);
                deps.设置玩家组织(synced.玩家组织);
                void deps.performAutoSave({ char: synced.角色, sect: synced.玩家组织, history: 历史记录, force: true });
                return;
            }
            case '任务列表': {
                const nextValue = Array.isArray(value) ? value : [];
                deps.设置任务列表(nextValue);
                void deps.performAutoSave({ tasks: nextValue, history: 历史记录, force: true });
                return;
            }
            case '记忆系统': {
                const nextValue = deps.规范化记忆系统(value);
                deps.应用并同步记忆系统(nextValue);
                void deps.performAutoSave({ memory: nextValue, history: 历史记录, force: true });
            }
        }
    };

    const applyRuntimeVariableCommand = async (command: TavernCommand) => {
        const 当前状态 = deps.获取当前状态();
        const 历史记录 = deps.获取历史记录();
        const normalizedKey = normalizeStateCommandKey(command?.key || '');
        if (是否废弃命令根路径(normalizedKey)) return;
        const isMemoryCommand = normalizedKey.startsWith('记忆系统')
            || normalizedKey.startsWith('gameState.记忆系统')
            || (command?.key || '').trim().startsWith('记忆系统');
        if (isMemoryCommand) {
            const memoryPath = (command?.key || '')
                .trim()
                .replace(/^gameState\./, '')
                .replace(/^记忆系统\.?/, '');
            const nextMemory = deps.规范化记忆系统(
                应用嵌套路径命令(当前状态.记忆系统, memoryPath, command.action, command.value)
            );
            deps.应用并同步记忆系统(nextMemory);
            void deps.performAutoSave({ memory: nextMemory, history: 历史记录, force: true });
            return;
        }
        const safeCommand = sanitizeInventoryCommand(command, 当前状态.角色);
        if (!safeCommand) return;
        if (!女主规划允许写入() && 是否女主规划命令(safeCommand.key || '')) return;
        const result = applyStateCommand(
            当前状态.角色,
            当前状态.环境,
            当前状态.社交,
            当前状态.世界,
            当前状态.剧情,
            当前状态.剧情规划,
            当前状态.女主剧情规划,
            当前状态.玩家组织,
            当前状态.任务列表,
            safeCommand.key,
            safeCommand.value,
            safeCommand.action
        );
        const nextEnv = deps.规范化环境信息(result.env);
        const nextChar = deps.规范化角色物品容器映射(result.char, { 当前时间: nextEnv });
        const nextSocial = deps.规范化社交列表(result.social, { 合并同名: false, 保留非姓名库主要女性名: true });
        const nextWorld = deps.规范化世界状态(result.world);
        const nextStory = await 同步剧情时间校准({
            previousStory: 当前状态.剧情,
            nextStory: deps.规范化剧情状态(result.story),
            envLike: nextEnv
        });
        const nextStoryPlan = deps.规范化剧情规划状态(result.storyPlan);
        const nextHeroinePlan = deps.规范化女主剧情规划状态(result.heroinePlan);
        const nextTasks = Array.isArray(result.tasks) ? result.tasks : [];
        deps.设置角色(nextChar);
        deps.设置环境(nextEnv);
        deps.设置社交(nextSocial);
        deps.设置世界(nextWorld);
        deps.设置剧情(nextStory);
        deps.设置剧情规划(nextStoryPlan);
        deps.设置女主剧情规划(nextHeroinePlan);
        deps.设置任务列表(nextTasks);
        void deps.performAutoSave({
            char: nextChar,
            env: nextEnv,
            social: nextSocial,
            world: nextWorld,
            story: nextStory,
            storyPlan: nextStoryPlan,
            heroinePlan: nextHeroinePlan,
            tasks: nextTasks,
            history: 历史记录,
            force: true
        });
    };

    const removeTask = (taskIndex: number) => {
        if (!Number.isInteger(taskIndex) || taskIndex < 0) return;
        let nextTasksSnapshot: any[] | null = null;
        deps.设置任务列表((prev: any) => {
            const baseList = Array.isArray(prev) ? prev : [];
            if (taskIndex >= baseList.length) return prev;
            const nextList = baseList.filter((_: any, index: number) => index !== taskIndex);
            nextTasksSnapshot = nextList;
            return nextList;
        });
        if (nextTasksSnapshot) {
            void deps.performAutoSave({ tasks: nextTasksSnapshot, history: deps.获取历史记录(), force: true });
        }
    };

    return {
        updateRuntimeVariableSection,
        applyRuntimeVariableCommand,
        removeTask
    };
};
