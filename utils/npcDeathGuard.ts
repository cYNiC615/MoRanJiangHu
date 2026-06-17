import type { TavernCommand } from '../types';
import { normalizeStateCommandKey } from './stateHelpers';

const 死亡状态字段正则 = /(?:状态|生死状态|生命状态)$/u;
const 死亡判定词正则 = /死亡|已故|身亡|阵亡|战死|气绝|断气|毙命|亡故|丧命|殒命|死去|死了|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|化为飞灰|尸骨无存|尸体|遗体|残尸/u;
const 死亡状态名称正则 = /^(?:死亡|已死|身亡|阵亡|战死|气绝|断气|毙命|亡故|丧命|殒命|已故)$/u;
const 死亡状态效果正则 = /角色已死亡|气血归零|不能继续作为在场行动角色|已故不可调度|生死状态[^。！？\n\r]{0,8}死亡|生命状态[^。！？\n\r]{0,8}死亡/u;

const 命令值文本 = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
};

const 收集NPC死亡命令状态 = (commands: TavernCommand[]) => {
    const byIndex = new Map<number, {
        death: boolean;
        hpZero: boolean;
        hasDeathTime: boolean;
        hasDeathDesc: boolean;
        deathCommandIndices: Set<number>;
    }>();

    const ensure = (index: number) => {
        const existing = byIndex.get(index);
        if (existing) return existing;
        const next = { death: false, hpZero: false, hasDeathTime: false, hasDeathDesc: false, deathCommandIndices: new Set<number>() };
        byIndex.set(index, next);
        return next;
    };

    commands.forEach((cmd: any, commandIndex) => {
        const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '').replace(/^gameState\./, '');
        const match = normalizedKey.match(/^社交\[(\d+)\](?:\.(.+))?$/u);
        if (!match) return;
        const index = Number(match[1]);
        if (!Number.isInteger(index) || index < 0) return;
        const field = match[2] || '';
        const valueText = 命令值文本(cmd?.value);
        const state = ensure(index);
        const wholeObject = !field;

        const isHpZero = (field === '当前血量' && Number(cmd?.value) === 0) || (wholeObject && Number(cmd?.value?.当前血量) === 0);
        const isDeath = (死亡状态字段正则.test(field) || wholeObject) && 死亡判定词正则.test(valueText);
        const isDeathTime = field === '死亡时间' && typeof cmd?.value === 'string' && cmd.value.trim().length > 0;
        const isDeathDesc = field === '死亡描述' && typeof cmd?.value === 'string' && cmd.value.trim().length > 0;

        if (isHpZero) { state.hpZero = true; state.deathCommandIndices.add(commandIndex); }
        if (isDeath) { state.death = true; state.deathCommandIndices.add(commandIndex); }
        if (isDeathTime) { state.hasDeathTime = true; state.deathCommandIndices.add(commandIndex); }
        if (isDeathDesc) { state.hasDeathDesc = true; state.deathCommandIndices.add(commandIndex); }
    });

    return byIndex;
};

export const 检测NPC死亡判定风险命令 = (
    commands: TavernCommand[],
    currentSocial: any[]
): string[] => {
    if (!Array.isArray(commands) || !Array.isArray(currentSocial)) return [];
    const byIndex = 收集NPC死亡命令状态(commands);

    const issues: string[] = [];
    byIndex.forEach((state, index) => {
        if (!state.death) return;
        const name = typeof currentSocial[index]?.姓名 === 'string'
            ? currentSocial[index].姓名.trim()
            : `社交[${index}]`;
        const missing: string[] = [];
        if (!state.hpZero) missing.push('当前血量归零');
        if (!state.hasDeathTime) missing.push('死亡时间');
        if (!state.hasDeathDesc) missing.push('死亡描述');
        if (missing.length > 0) {
            issues.push(`${name} 缺少${missing.join('、')}`);
        }
    });
    return issues;
};

export const 状态效果是死亡判定 = (item: any): boolean => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const 名称 = typeof item?.名称 === 'string' ? item.名称.trim() : '';
    const 效果 = typeof item?.效果 === 'string' ? item.效果.trim() : '';
    return 死亡状态名称正则.test(名称) || 死亡状态效果正则.test(效果);
};

export const 提取NPC死亡风险命令索引 = (
    commands: TavernCommand[],
    currentSocial: any[]
): Set<number> => {
    if (!Array.isArray(commands) || !Array.isArray(currentSocial)) return new Set();
    const risky = new Set<number>();
    const byIndex = 收集NPC死亡命令状态(commands);

    byIndex.forEach((state) => {
        if (!state.death) return;
        // AI 提供了死亡状态 + 当前血量归零 + 死亡时间 + 死亡描述，视为完整证据
        if (state.hpZero && state.hasDeathTime && state.hasDeathDesc) return;
        // 否则标记为风险命令
        state.deathCommandIndices.forEach((commandIndex) => risky.add(commandIndex));
    });

    return risky;
};
