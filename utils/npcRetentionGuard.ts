import type { TavernCommand } from '../types';
import { normalizeStateCommandKey } from './stateHelpers';

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 规范化NPC键 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '').toLowerCase()
        : ''
);

const 读取NPC键列表 = (npc: any): string[] => {
    if (!npc || typeof npc !== 'object' || Array.isArray(npc)) return [];
    return [
        npc.id,
        npc.ID,
        npc.姓名,
        npc.名称,
        ...(Array.isArray(npc.曾用名) ? npc.曾用名 : [])
    ]
        .map(规范化NPC键)
        .filter(Boolean);
};

const NPC互相匹配 = (left: any, right: any): boolean => {
    const leftKeys = 读取NPC键列表(left);
    const rightKeys = new Set(读取NPC键列表(right));
    return leftKeys.length > 0 && leftKeys.some((key) => rightKeys.has(key));
};

const 是普通对象 = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const 深合并保留NPC字段 = (previous: any, next: any): any => {
    if (Array.isArray(next)) return 深拷贝(next);
    if (!是普通对象(next)) return 深拷贝(next);
    const result = 是普通对象(previous) ? 深拷贝(previous) : {};
    Object.entries(next).forEach(([key, value]) => {
        if (value === undefined) return;
        if (是普通对象(result[key]) && 是普通对象(value)) {
            result[key] = 深合并保留NPC字段(result[key], value);
            return;
        }
        result[key] = 深拷贝(value);
    });
    return result;
};

export const 合并保留既有NPC列表 = (
    previousList: any[],
    nextList: any[],
    playerName?: string
): { 列表: any[]; 恢复数量: number; 恢复名称: string[]; 合并数量: number; 是否变更: boolean } => {
    const previous = Array.isArray(previousList) ? previousList : [];
    const next = Array.isArray(nextList) ? nextList : [];
    if (previous.length <= 0) return { 列表: next, 恢复数量: 0, 恢复名称: [], 合并数量: 0, 是否变更: false };

    const result = 深拷贝(next);
    const restoredNames: string[] = [];
    let mergedCount = 0;
    const playerNormKey = playerName ? 规范化NPC键(playerName) : '';

    previous.forEach((npc, index) => {
        if (!npc || typeof npc !== 'object' || Array.isArray(npc)) return;
        // 跳过与主角同名的NPC，防止主角被NPC化
        if (playerNormKey) {
            const npcKey = 规范化NPC键(npc?.姓名);
            if (npcKey && npcKey === playerNormKey) return;
        }
        const existingIndex = result.findIndex((candidate) => NPC互相匹配(npc, candidate));
        if (existingIndex >= 0) {
            result[existingIndex] = 深合并保留NPC字段(npc, result[existingIndex]);
            mergedCount += 1;
            return;
        }
        const insertIndex = Math.max(0, Math.min(index, result.length));
        result.splice(insertIndex, 0, 深拷贝(npc));
        const label = typeof npc?.姓名 === 'string' && npc.姓名.trim()
            ? npc.姓名.trim()
            : (typeof npc?.id === 'string' ? npc.id.trim() : `社交[${index}]`);
        restoredNames.push(label);
    });

    return {
        列表: result,
        恢复数量: restoredNames.length,
        恢复名称: restoredNames,
        合并数量: mergedCount,
        是否变更: restoredNames.length > 0 || mergedCount > 0
    };
};

const 读取命令动作 = (cmd: any): string => (
    typeof cmd?.action === 'string' && cmd.action.trim()
        ? cmd.action.trim()
        : 'set'
);

const 读取命令路径 = (cmd: any): string => (
    normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '')
);

const 命令路径指向社交整项 = (normalizedKey: string): boolean => (
    /^gameState\.社交(?:$|\[\d+\]$)/.test(normalizedKey)
);

const 命令路径指向社交数组 = (normalizedKey: string): boolean => normalizedKey === 'gameState.社交';

const 命令描述 = (cmd: any): string => {
    const action = 读取命令动作(cmd);
    const key = 读取命令路径(cmd) || String(cmd?.key || '');
    return `${action} ${key}`;
};

export const 检测社交删除风险命令 = (
    commands: TavernCommand[] | any[],
    currentSocial: any[]
): string[] => {
    const social = Array.isArray(currentSocial) ? currentSocial : [];
    if (!Array.isArray(commands) || commands.length <= 0 || social.length <= 0) return [];

    const issues: string[] = [];
    commands.forEach((cmd: any) => {
        const action = 读取命令动作(cmd);
        const normalizedKey = 读取命令路径(cmd);
        if (!normalizedKey.startsWith('gameState.社交')) return;

        if (action === 'delete' && 命令路径指向社交整项(normalizedKey)) {
            issues.push(`${命令描述(cmd)} 会删除既有 NPC`);
            return;
        }

        if (action === 'set' && 命令路径指向社交数组(normalizedKey)) {
            if (!Array.isArray(cmd?.value)) {
                issues.push(`${命令描述(cmd)} 会把社交列表替换为非数组`);
                return;
            }
            const retained = 合并保留既有NPC列表(social, cmd.value);
            if (retained.恢复数量 > 0) {
                issues.push(`${命令描述(cmd)} 缺失既有 NPC：${retained.恢复名称.join('、')}`);
            }
            return;
        }

        const slotMatch = normalizedKey.match(/^gameState\.社交\[(\d+)\]$/);
        if (action === 'set' && slotMatch) {
            const index = Number(slotMatch[1]);
            const currentNpc = social[index];
            if (!currentNpc) return;
            const nextValue = cmd?.value;
            if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
                issues.push(`${命令描述(cmd)} 会清空既有 NPC`);
                return;
            }
            if (!NPC互相匹配(currentNpc, nextValue)) {
                const label = currentNpc?.姓名 || currentNpc?.id || `社交[${index}]`;
                issues.push(`${命令描述(cmd)} 会替换既有 NPC：${label}`);
            }
        }
    });

    return issues;
};

export const 命令存在社交删除风险 = (cmd: TavernCommand | any, currentSocial: any[]): boolean => (
    检测社交删除风险命令([cmd], currentSocial).length > 0
);
