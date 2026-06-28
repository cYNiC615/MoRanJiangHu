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
    const rawRecord = raw as Partial<NPC行为档案结构> & { 边界?: unknown; 硬锁?: unknown };
    return {
        性格底色: 读取文本(rawRecord.性格底色) || 读取文本(npc?.核心性格特征),
        核心欲望: 读取文本(rawRecord.核心欲望),
        当前agenda: 读取文本(rawRecord.当前agenda) || 读取文本(npc?.行动意图) || 读取文本(npc?.当前任务),
        防御机制: 读取文本(rawRecord.防御机制),
        交流风格: 读取文本(rawRecord.交流风格),
        情感需求: 读取文本(rawRecord.情感需求),
        吸引点: 文本列表(rawRecord.吸引点, npc?.好感度突破条件),
        戒备点: 文本列表(rawRecord.戒备点),
        亲密阻力: 文本列表(rawRecord.亲密阻力, npc?.关系突破条件),
        边界与硬锁: 文本列表(rawRecord.边界与硬锁, rawRecord.边界, rawRecord.硬锁),
        后宫兼容路径: 读取文本(rawRecord.后宫兼容路径),
        最近更新原因: 读取文本(rawRecord.最近更新原因),
        更新时间: 读取文本(rawRecord.更新时间)
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

const 取稳定文本 = (left: unknown, right: unknown): string => 读取文本(left) || 读取文本(right);
const 取易变文本 = (left: unknown, right: unknown): string => 读取文本(right) || 读取文本(left);

export const 合并NPC行为档案 = (left: any, right: any): NPC行为档案结构 => {
    const leftProfile = 规范化NPC行为档案(left);
    const rightProfile = 规范化NPC行为档案(right);
    return {
        性格底色: 取稳定文本(leftProfile.性格底色, rightProfile.性格底色),
        核心欲望: 取稳定文本(leftProfile.核心欲望, rightProfile.核心欲望),
        当前agenda: 取易变文本(leftProfile.当前agenda, rightProfile.当前agenda),
        防御机制: 取稳定文本(leftProfile.防御机制, rightProfile.防御机制),
        交流风格: 取稳定文本(leftProfile.交流风格, rightProfile.交流风格),
        情感需求: 取稳定文本(leftProfile.情感需求, rightProfile.情感需求),
        吸引点: 文本列表(leftProfile.吸引点, rightProfile.吸引点),
        戒备点: 文本列表(leftProfile.戒备点, rightProfile.戒备点),
        亲密阻力: 文本列表(leftProfile.亲密阻力, rightProfile.亲密阻力),
        边界与硬锁: 文本列表(leftProfile.边界与硬锁, rightProfile.边界与硬锁),
        后宫兼容路径: 取稳定文本(leftProfile.后宫兼容路径, rightProfile.后宫兼容路径),
        最近更新原因: 取易变文本(leftProfile.最近更新原因, rightProfile.最近更新原因),
        更新时间: 取易变文本(leftProfile.更新时间, rightProfile.更新时间)
    };
};

const NPC有关系承接内容 = (npc: Partial<NPC结构> & Record<string, any>, profile = 规范化NPC行为档案(npc)): boolean => (
    Boolean(
        读取文本(npc.关系状态)
        || 读取文本(npc.简介)
        || 读取文本(npc.身份)
        || (Array.isArray(npc.记忆) && npc.记忆.some((item) => 读取文本(item)))
        || 行为档案有可读内容(profile)
    )
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
                if (!name || !NPC有关系承接内容(npc, profile) || (readablePieces.length <= 0 && !行为档案有可读内容(profile))) return;
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

export type 规划社交上下文 = {
    当前在场角色: Array<Partial<NPC结构> & Record<string, any>>;
    非在场重要角色摘要: string[];
    统计: {
        原始社交数量: number;
        当前在场数量: number;
        非在场重要角色数量: number;
        是否已裁剪: boolean;
    };
};

const 裁剪文本 = (text: string, maxChars: number): string => (
    text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 1))}…` : text
);

const 构建非在场重要角色摘要 = (
    npc: Partial<NPC结构> & Record<string, any>,
    maxChars: number
): string => {
    const profile = 规范化NPC行为档案(npc);
    if (!NPC有关系承接内容(npc, profile)) return '';
    const ids = 收集候选ID(npc);
    const pieces = [
        读取文本(npc.姓名),
        ids.length > 0 ? `ID：${ids.join('、')}` : '',
        读取文本(npc.性别) ? `性别：${读取文本(npc.性别)}` : '',
        读取文本(npc.身份) ? `身份：${读取文本(npc.身份)}` : '',
        读取文本(npc.关系状态) ? `关系：${读取文本(npc.关系状态)}` : '',
        profile.当前agenda ? `agenda：${profile.当前agenda}` : '',
        profile.亲密阻力.length > 0 ? `阻力：${profile.亲密阻力.join('、')}` : '',
        profile.边界与硬锁.length > 0 ? `边界：${profile.边界与硬锁.join('、')}` : '',
        Array.isArray(npc.记忆) && npc.记忆.length > 0 ? `记忆：${npc.记忆.map((item) => 读取文本(item)).filter(Boolean).slice(0, 3).join('、')}` : ''
    ].filter(Boolean);
    if (!pieces[0]) return '';
    return 裁剪文本(pieces.join('；'), maxChars);
};

export const 构建规划社交上下文 = (
    socialList: Array<Partial<NPC结构> & Record<string, any>> | undefined,
    options?: { maxInScene?: number; maxOffscreenImportant?: number; maxSummaryChars?: number }
): 规划社交上下文 => {
    const source = Array.isArray(socialList) ? socialList : [];
    const maxInScene = Math.max(1, Math.floor(options?.maxInScene ?? 8));
    const maxOffscreenImportant = Math.max(0, Math.floor(options?.maxOffscreenImportant ?? 12));
    const maxSummaryChars = Math.max(40, Math.floor(options?.maxSummaryChars ?? 220));
    const inSceneAll = source.filter((npc) => npc && typeof npc === 'object' && npc.是否在场 === true);
    const 当前在场角色 = inSceneAll.slice(0, maxInScene);
    const inSceneKeys = new Set(当前在场角色.flatMap((npc) => [读取文本(npc.id), 读取文本(npc.姓名)]).filter(Boolean));
    const offscreenImportantAll = source
        .filter((npc) => {
            if (!npc || typeof npc !== 'object' || npc.是否在场 === true || npc.是否主要角色 !== true) return false;
            const keyHit = [读取文本(npc.id), 读取文本(npc.姓名)].filter(Boolean).some((key) => inSceneKeys.has(key));
            if (keyHit) return false;
            return NPC有关系承接内容(npc);
        });
    const offscreenImportant = offscreenImportantAll.slice(0, maxOffscreenImportant);
    const 非在场重要角色摘要 = offscreenImportant
        .map((npc) => 构建非在场重要角色摘要(npc, maxSummaryChars))
        .filter(Boolean);
    return {
        当前在场角色,
        非在场重要角色摘要,
        统计: {
            原始社交数量: source.length,
            当前在场数量: 当前在场角色.length,
            非在场重要角色数量: 非在场重要角色摘要.length,
            是否已裁剪: inSceneAll.length > 当前在场角色.length || offscreenImportantAll.length > offscreenImportant.length
        }
    };
};

export const 是女主剧情规划命令 = (command: TavernCommand): boolean => (
    typeof command?.key === 'string'
    && (
        command.key === '女主剧情规划'
        || command.key.startsWith('女主剧情规划.')
        || command.key.startsWith('女主剧情规划[')
        || command.key === 'gameState.女主剧情规划'
        || command.key.startsWith('gameState.女主剧情规划.')
        || command.key.startsWith('gameState.女主剧情规划[')
    )
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
