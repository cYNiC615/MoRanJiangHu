import type { NPC结构, 导演配置结构 } from '../../types';
import { 同步角色种子转正并回写社交, 规范化导演配置 } from '../../utils/directorConfig';

type 社交NPC = Partial<NPC结构> & Record<string, any>;

export type 社交列表规范化函数 = (
    rawSocialList: Array<社交NPC>,
    options?: { 合并同名?: boolean; 保留非姓名库主要女性名?: boolean }
) => 社交NPC[];

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const 规范姓名键 = (value: unknown): string => 读取文本(value).replace(/\s+/g, '').toLowerCase();

export const 过滤主角同名NPC = <T extends 社交NPC>(socialList: T[], playerName?: string): T[] => {
    const normalizedPlayerName = 规范姓名键(playerName);
    if (!normalizedPlayerName || !Array.isArray(socialList)) return socialList;
    return socialList.filter((npc) => {
        const npcName = 规范姓名键(npc?.姓名);
        return !npcName || npcName !== normalizedPlayerName;
    });
};

export type 社交导演同步参数 = {
    nextSocial: Array<社交NPC>;
    currentDirectorConfig: Partial<导演配置结构> | null | undefined;
    playerName?: string;
    normalizeSocialList: 社交列表规范化函数;
};

export type 社交导演同步结果 = {
    social: 社交NPC[];
    directorConfig: 导演配置结构;
    directorChanged: boolean;
    linkedSeedIds: string[];
};

const 序列化运行时状态 = (config: 导演配置结构): string => (
    JSON.stringify(config.角色种子运行时状态 || [])
);

export const 规范化并同步社交导演状态 = ({
    nextSocial,
    currentDirectorConfig,
    playerName,
    normalizeSocialList
}: 社交导演同步参数): 社交导演同步结果 => {
    const previousDirectorConfig = 规范化导演配置(currentDirectorConfig);
    const normalizedSocial = 过滤主角同名NPC(
        normalizeSocialList(Array.isArray(nextSocial) ? nextSocial : [], { 合并同名: false }),
        playerName
    );
    const synced = 同步角色种子转正并回写社交(previousDirectorConfig, normalizedSocial);
    return {
        social: synced.socialList,
        directorConfig: synced.directorConfig,
        directorChanged: synced.changed || 序列化运行时状态(previousDirectorConfig) !== 序列化运行时状态(synced.directorConfig),
        linkedSeedIds: synced.linkedSeedIds
    };
};
