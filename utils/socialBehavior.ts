import type { NPC结构, NPC行为档案结构, TavernCommand } from '../types';

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 文本列表 = (...values: unknown[]): string[] => {
    const result: string[] = [];
    const seen = new Set<string>();
    values.forEach((value) => {
        const source = Array.isArray(value) ? value : [value];
        source.forEach((item) => {
            const text = 读取文本(item);
            if (!text || seen.has(text)) return;
            seen.add(text);
            result.push(text);
        });
    });
    return result;
};

const 读取档案 = (npc: any): Partial<NPC行为档案结构> => (
    npc?.行为档案 && typeof npc.行为档案 === 'object' && !Array.isArray(npc.行为档案)
        ? npc.行为档案
        : {}
);

export const 规范化NPC行为档案 = (npc: any): NPC行为档案结构 => {
    const raw = 读取档案(npc);
    return {
        性格底色: 读取文本(raw.性格底色) || 读取文本(npc?.核心性格特征),
        核心欲望: 读取文本(raw.核心欲望),
        当前agenda: 读取文本(raw.当前agenda) || 读取文本(npc?.行动意图) || 读取文本(npc?.当前任务),
        防御机制: 读取文本(raw.防御机制),
        交流风格: 读取文本(raw.交流风格),
        情感需求: 读取文本(raw.情感需求),
        吸引点: 文本列表(raw.吸引点, npc?.好感度突破条件),
        戒备点: 文本列表(raw.戒备点),
        亲密阻力: 文本列表(raw.亲密阻力, npc?.关系突破条件),
        边界与硬锁: 文本列表(raw.边界与硬锁, raw.边界, raw.硬锁),
        后宫兼容路径: 读取文本(raw.后宫兼容路径),
        最近更新原因: 读取文本(raw.最近更新原因),
        更新时间: 读取文本(raw.更新时间)
    };
};

export const 行为档案有可读内容 = (profile?: Partial<NPC行为档案结构>): boolean => {
    if (!profile || typeof profile !== 'object') return false;
    return [
        profile.性格底色,
        profile.核心欲望,
        profile.当前agenda,
        profile.防御机制,
        profile.交流风格,
        profile.情感需求,
        profile.后宫兼容路径,
        ...(Array.isArray(profile.吸引点) ? profile.吸引点 : []),
        ...(Array.isArray(profile.戒备点) ? profile.戒备点 : []),
        ...(Array.isArray(profile.亲密阻力) ? profile.亲密阻力 : []),
        ...(Array.isArray(profile.边界与硬锁) ? profile.边界与硬锁 : [])
    ].some((value) => 读取文本(value));
};

export const 合并NPC行为档案 = (left: any, right: any): NPC行为档案结构 => (
    规范化NPC行为档案({
        ...left,
        ...right,
        行为档案: {
            ...规范化NPC行为档案(left),
            ...规范化NPC行为档案(right),
            ...读取档案(left),
            ...读取档案(right)
        }
    })
);

export type 红颜规划候选结果 = {
    summaries: string[];
    summaryText: string;
    candidateIds: string[];
    candidateNames: string[];
    candidateCount: number;
};

const 收集候选ID = (npc: Partial<NPC结构> & Record<string, any>): string[] => (
    文本列表(npc.id, npc.ID, npc.角色种子ID, npc.seedId)
);

export const 构建红颜规划候选结果 = (socialList: Array<Partial<NPC结构> & Record<string, any>>): 红颜规划候选结果 => {
    const summaries: string[] = [];
    const candidateIds: string[] = [];
    const candidateNames: string[] = [];
    if (Array.isArray(socialList)) {
        socialList
            .filter((npc) => npc?.性别 === '女' && npc?.是否主要角色 === true)
            .forEach((npc) => {
                const profile = 规范化NPC行为档案(npc);
                const name = 读取文本(npc.姓名);
                const ids = 收集候选ID(npc);
                const readablePieces = [
                    读取文本(npc.关系状态),
                    profile.当前agenda ? `agenda：${profile.当前agenda}` : '',
                    profile.核心欲望 ? `核心欲望：${profile.核心欲望}` : '',
                    profile.亲密阻力.length > 0 ? `亲密阻力：${profile.亲密阻力.join('、')}` : '',
                    profile.后宫兼容路径 ? `后宫路径：${profile.后宫兼容路径}` : ''
                ].filter(Boolean);
                if (!name || (readablePieces.length <= 0 && !行为档案有可读内容(profile))) return;
                const pieces = [
                    name,
                    ids.length > 0 ? `候选ID：${ids.join('、')}` : '',
                    ...readablePieces
                ].filter(Boolean);
                summaries.push(pieces.join('；'));
                if (name && !candidateNames.includes(name)) candidateNames.push(name);
                ids.forEach((id) => {
                    if (!candidateIds.includes(id)) candidateIds.push(id);
                });
            });
    }
    return {
        summaries,
        summaryText: summaries.map((summary, index) => `${index + 1}. ${summary}`).join('\n'),
        candidateIds,
        candidateNames,
        candidateCount: summaries.length
    };
};

export const 构建红颜规划候选角色摘要 = (socialList: Array<Partial<NPC结构> & Record<string, any>>): string[] => (
    构建红颜规划候选结果(socialList).summaries
);

const 是女主剧情规划命令 = (command: TavernCommand): boolean => (
    typeof command?.key === 'string'
    && (command.key === '女主剧情规划' || command.key.startsWith('女主剧情规划.') || command.key === 'gameState.女主剧情规划' || command.key.startsWith('gameState.女主剧情规划.'))
);

const 命令文本包含候选 = (command: TavernCommand, candidates: 红颜规划候选结果): boolean => {
    const commandText = `${command.key}\n${JSON.stringify(command.value ?? '')}`;
    return [...candidates.candidateIds, ...candidates.candidateNames]
        .filter(Boolean)
        .some((target) => commandText.includes(target));
};

export const 过滤女主规划命令 = (
    commands: TavernCommand[] | undefined,
    candidates: 红颜规划候选结果
): { commands: TavernCommand[]; rejectedReports: string[] } => {
    const kept: TavernCommand[] = [];
    const rejectedReports: string[] = [];
    (commands || []).forEach((command) => {
        if (!是女主剧情规划命令(command)) {
            kept.push(command);
            return;
        }
        if (candidates.candidateCount <= 0) {
            rejectedReports.push(`已拦截 ${command.action} ${command.key}：当前没有可用于红颜规划 v2 的候选摘要。`);
            return;
        }
        if (!命令文本包含候选(command, candidates)) {
            rejectedReports.push(`已拦截 ${command.action} ${command.key}：目标不在红颜规划 v2 候选范围。`);
            return;
        }
        kept.push(command);
    });
    return { commands: kept, rejectedReports };
};
