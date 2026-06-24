import {
    GameResponse,
    角色数据结构,
    环境信息结构,
    世界数据结构,
    玩家组织结构,
    剧情系统结构,
    剧情规划结构,
    女主剧情规划结构
} from '../../types';
import { applyStateCommand, normalizeStateCommandKey } from '../../utils/stateHelpers';
import { 规范化任务列表自动结算 } from '../../utils/taskCompat';
import { 结算已完成任务奖励 } from '../../utils/taskRewards';
import { sanitizeInventoryCommand } from './inventoryCommandGuard';
import { 姓名含已知中文姓氏 } from '../../utils/chineseName';
import { 合并保留既有NPC列表, 命令存在社交删除风险 } from '../../utils/npcRetentionGuard';
import { 提取NPC死亡风险命令索引, 状态效果是死亡判定 } from '../../utils/npcDeathGuard';
import { 构建体内射精记录, 推进社交孕产状态, 规范化孕产时间 } from '../../utils/reproduction';
import { 构建红颜规划候选结果, 是女主剧情规划命令, 过滤女主规划命令 } from '../../utils/socialBehavior';

const 占位开局时间 = '1:01:01:00:00';

const 解析标准时间分值 = (raw?: string): number | null => {
    if (typeof raw !== 'string') return null;
    const match = raw.trim().match(/^(\d{1,6}):(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
    const dayValue = (Math.trunc(year) * 12 + Math.max(0, Math.trunc(month) - 1)) * 31 + Math.max(0, Math.trunc(day) - 1);
    return ((dayValue * 24) + Math.trunc(hour)) * 60 + Math.trunc(minute);
};

const 是否环境时间命令 = (rawKey: string): boolean => {
    const normalizedKey = normalizeStateCommandKey(rawKey);
    return normalizedKey === 'gameState.环境.时间';
};

const 是否游戏初始时间命令 = (rawKey: string): boolean => {
    const normalizedKey = normalizeStateCommandKey(rawKey || '');
    if (normalizedKey === 'gameState.游戏初始时间') return true;
    const trimmed = (rawKey || '').trim();
    return trimmed === '游戏初始时间' || trimmed === 'gameState.游戏初始时间';
};

const 是否时间回退或异常重置 = (oldTime: unknown, newValue: unknown): boolean => {
    const newCanonical = typeof newValue === 'string' ? newValue.trim() : '';
    if (!newCanonical) return true;
    if (newCanonical === 占位开局时间) return true;
    const newMinutes = 解析标准时间分值(newCanonical);
    if (newMinutes == null) return true;
    const oldCanonical = typeof oldTime === 'string' ? oldTime.trim() : '';
    if (!oldCanonical || oldCanonical === 占位开局时间) return false;
    const oldMinutes = 解析标准时间分值(oldCanonical);
    if (oldMinutes == null) return false;
    return newMinutes < oldMinutes;
};

export type 响应命令处理状态 = {
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

type 响应命令处理依赖 = {
    规范化环境信息: (envLike?: any) => 环境信息结构;
    规范化社交列表: (raw?: any[], options?: { 合并同名?: boolean }) => any[];
    规范化世界状态: (raw?: any) => 世界数据结构;
    规范化组织状态: (raw?: any) => 玩家组织结构;
    规范化剧情状态: (raw?: any) => 剧情系统结构;
    规范化剧情规划状态: (raw?: any) => 剧情规划结构;
    规范化女主剧情规划状态: (raw?: any) => 女主剧情规划结构 | undefined;
    规范化角色物品容器映射: (raw?: any, options?: { 当前时间?: unknown; 事件文本?: string; 启用饱腹口渴系统?: boolean; 题材模式?: unknown }) => 角色数据结构;
    角色规范化选项?: { 启用饱腹口渴系统?: boolean; 题材模式?: unknown };
    设置角色?: (value: 角色数据结构) => void;
    设置环境?: (value: 环境信息结构) => void;
    设置社交?: (value: any[]) => void;
    设置世界?: (value: 世界数据结构) => void;
    设置玩家组织?: (value: 玩家组织结构) => void;
    设置任务列表?: (value: any[]) => void;
    设置剧情?: (value: 剧情系统结构) => void;
    设置剧情规划?: (value: 剧情规划结构) => void;
    设置女主剧情规划?: (value: 女主剧情规划结构 | undefined) => void;
    命令后校准?: (state: 响应命令处理状态) => { state: 响应命令处理状态; corrections?: string[] } | 响应命令处理状态;
};

const 归一化文本键 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/\s+/g, '').toLowerCase()
        : ''
);

const 噪声对白发送者片段正则 = /(?:轻声|低声|细语|小声|柔声|温声|沉声|冷声|厉声|压低|喃喃|喃语|嘀咕|说道|说着|问道|答道|开口|补充|解释|提醒|笑着|苦笑|皱眉|抬眼|抬头|看向|望向|回头|点头|摇头|叹息|擦净|将|把|并|却|已经|刚刚)/;
const 噪声对白发送者收尾正则 = /(?:地|着|了|道|问|说)$/;
const 噪声对白发送者完整短语正则 = /^(?:(?:他|她|它|你|我|他们|她们|对方|那人|此人|有人|众人))?(?:只能|只好|只得|不得不|勉强|连忙|赶紧|急忙|仍旧|还是|却|并|但|又|便|就|再)?(?:强辩|辩解|解释|补充|提醒|回答|答话|应声|开口|说道|说着|问道|答道|低声|轻声|沉声|苦笑|皱眉|点头|摇头|叹息|看向|望向|回头|抬眼|抬头|擦净)$/;

const 是否噪声对白发送者 = (sender: string): boolean => {
    const name = (sender || '').trim();
    if (!name) return true;
    if (/[，。！？；：、,.!?;:\s\n\r]/.test(name)) return true;
    if (/^[\u4e00-\u9fa5]{2,4}$/u.test(name) && !姓名含已知中文姓氏(name)) return true;
    if (噪声对白发送者完整短语正则.test(name)) return true;
    if (/^(?:他|她|它|你|我|他们|她们|对方|那人|此人|有人|众人).{1,10}$/.test(name) && 噪声对白发送者片段正则.test(name)) return true;
    if (name.length >= 4 && 噪声对白发送者收尾正则.test(name) && 噪声对白发送者片段正则.test(name)) return true;
    return false;
};

const 是否对白NPC发送者 = (senderRaw: unknown, playerNameRaw: unknown): boolean => {
    const sender = typeof senderRaw === 'string' ? senderRaw.trim() : '';
    if (!sender) return false;
    if (/^【?(?:旁白|判定|NSFW判定|免责声明|系统|旁述|叙述|作者|提示|错误|主神|公告)】?$/i.test(sender)) return false;
    if (/^(?:disclaimer|system|narrator|assistant|user)$/i.test(sender)) return false;
    if (是否噪声对白发送者(sender)) return false;
    if (/^[\u4e00-\u9fa5]{2,4}$/u.test(sender) && !姓名含已知中文姓氏(sender)) return false;
    const playerName = 归一化文本键(playerNameRaw);
    if (playerName && 归一化文本键(sender) === playerName) return false;
    return sender.length <= 16;
};

const 稳定哈希文本 = (text: string): string => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
};

const 补入对白发送者到社交 = (
    response: GameResponse,
    socialList: any[],
    playerName?: string
): any[] => {
    const logs = Array.isArray(response?.logs) ? response.logs : [];
    if (logs.length <= 0) return socialList;

    const dialogueNameKeys = new Set<string>();
    logs.forEach((log: any) => {
        const sender = typeof log?.sender === 'string' ? log.sender.trim() : '';
        const key = 归一化文本键(sender);
        if (!是否对白NPC发送者(sender, playerName)) return;
        dialogueNameKeys.add(key);
    });

    const markedSocialList = (Array.isArray(socialList) ? socialList : []).map((npc: any) => {
        const keys = [npc?.id, ...读取NPC名称列表(npc)].map(归一化文本键).filter(Boolean);
        if (!keys.some((key) => dialogueNameKeys.has(key))) return npc;
        return {
            ...npc,
            对白登场: true,
            自动补全头像: true
        };
    });
    return markedSocialList;
};

const 拆分事实句 = (text: string): string[] => (
    (text || '')
        .split(/[。！？!?；;\n\r]+/)
        .map((item) => item.trim())
        .filter(Boolean)
);

const 非现实亲密语境正则 = /(?:脑海中|脑中|心里|心底|想象|幻想|妄想|臆想|脑补|浮现|闪过|梦见|梦境|梦中|梦里|如果|假如|倘若|若是|想要|想把|想将|计划|打算|威胁|恐吓|比喻|形容|演示|模拟|未遂|差点|险些|几乎|并未真正|没有真正|现实中并未|实际上并未|只是(?:[^。！？\n\r]{0,12})?(?:念头|想法|幻想|梦|比喻|威胁|表演|玩笑))/u;

const 是否非现实亲密语境 = (sentence: string): boolean => {
    if (!sentence) return false;
    if (!非现实亲密语境正则.test(sentence)) return false;
    return /(?:初夜|破处|失身|发生关系|亲密关系|房事|云雨|交合|同房|双修|床笫|肉体关系|性事|性交|阴道交|肛交|口交|乳交|手交|足交|股交|内射|中出|小穴|阴道|蜜穴|屁穴|后庭|肉棒|阴茎|性器|插(?:进|入)|贯穿|进入|占有)/u.test(sentence);
};

const 提取对白发送者集合 = (response: GameResponse, playerName?: string): Set<string> => {
    const result = new Set<string>();
    const logs = Array.isArray(response?.logs) ? response.logs : [];
    logs.forEach((log: any) => {
        const sender = typeof log?.sender === 'string' ? log.sender.trim() : '';
        if (!是否对白NPC发送者(sender, playerName)) return;
        result.add(归一化文本键(sender));
    });
    return result;
};

const 现场缺席事实正则 = /(不在(?:场|此处|现场|身边)|未在(?:场|此处|现场|身边)|离场|离开|退下|退走|散去|走远|远在|留守|待命|守在|守于|驻守|回到|返回|躲在|藏在|被押走|被带走|被拖走|逃走|逃离|不见踪影)/;
const 现场确认事实正则 = /(在场|在此|现场|身侧|身旁|旁边|面前|眼前|跟前|近前|席间|堂中|厅中|屋内|房内|院中|站在|立在|坐在|跪在|伏在|靠在|走进|进入|赶来|来到|现身|出声|开口|说道|问道|答道|回应|看着|望向|盯着|拔刀|出手|跪下|行礼|沉默|皱眉|冷笑|微笑)/;
const 同行确认事实正则 = /(同行|随行|随队|随我|随主角|跟随|跟着|一同|一起|同去|同往|同来|带着|领着|率领|听令|听命|出列|列队|编队|队伍|队友|同伴|伴随|护送|压阵|随身|并肩|并行)/;
const 同行强确认事实正则 = /(同行|随行|随队|随我|随主角|跟随|跟着|同去|同往|同来|带着|领着|护送|压阵|随身|并肩|并行|队友|同伴)/;
const 同行离队事实正则 = /(离队|退队|不再同行|不再随行|分道扬镳|各自行动|分头行动|留守|待命|退下|退走|离开|散去|走远|留在|驻守)/;
const 敌对或阻拦事实正则 = /(敌方|敌人|敌军|敌阵|敌手|对手|贼人|杀手|守卫|护院|拦路|拦住|阻拦|围住|围攻|袭击|攻击|交战|厮杀|追杀|堵截|拔刀相向|兵刃相向)/;
const 随行者占位名正则 = /^随行者([1-9]\d*)$/;

const NPC已死亡 = (npc: any): boolean => {
    const statusText = [
        npc?.状态,
        npc?.生死状态,
        npc?.生命状态,
        npc?.死亡描述,
        ...(Array.isArray(npc?.DEBUFF) ? npc.DEBUFF.flatMap((item: any) => [item?.名称, item?.描述, item?.效果]) : [])
    ].filter(Boolean).join(' ');
    return 死亡状态正则.test(statusText);
};

const 判断NPC本回合是否在场 = (
    npc: any,
    responseFactText: string,
    dialogueSenderKeys: Set<string>
): boolean | undefined => {
    const names = 读取NPC名称列表(npc);
    const keys = names.map(归一化文本键).filter(Boolean);
    if (keys.some((key) => dialogueSenderKeys.has(key))) return true;
    if (names.length <= 0 || !names.some((name) => responseFactText.includes(name))) return undefined;
    const relatedSentences = 拆分事实句(responseFactText).filter((sentence) => names.some((name) => sentence.includes(name)));
    if (relatedSentences.length <= 0) return false;
    if (relatedSentences.some((sentence) => 现场缺席事实正则.test(sentence))) return false;
    if (relatedSentences.some((sentence) => 现场确认事实正则.test(sentence))) return true;
    if (relatedSentences.some((sentence) => 同行确认事实正则.test(sentence))) return true;
    return undefined;
};

const 构建环境位置路径 = (env?: Partial<环境信息结构> | null): string => (
    [env?.大地点, env?.中地点, env?.小地点, env?.具体地点]
        .map((item) => typeof item === 'string' ? item.trim() : '')
        .filter(Boolean)
        .join(' > ')
);

export const 同步在场NPC当前位置 = (
    socialList: any[],
    env?: Partial<环境信息结构> | null
): any[] => {
    if (!Array.isArray(socialList) || socialList.length <= 0) return socialList;
    const currentLocation = typeof env?.具体地点 === 'string' && env.具体地点.trim()
        ? env.具体地点.trim()
        : ([env?.小地点, env?.中地点, env?.大地点]
            .map((item) => typeof item === 'string' ? item.trim() : '')
            .find(Boolean) || '');
    const locationPath = 构建环境位置路径(env);
    if (!currentLocation && !locationPath) return socialList;

    let skippedCount = 0;
    let updatedCount = 0;
    const result = socialList.map((npc: any) => {
        if (!npc || typeof npc !== 'object' || npc.是否在场 !== true) return npc;
        const hasExplicitLocation = Boolean(
            (typeof npc.位置路径 === 'string' && npc.位置路径.trim())
            || (typeof npc.当前位置 === 'string' && npc.当前位置.trim())
            || (typeof npc.当前地点 === 'string' && npc.当前地点.trim())
            || (typeof npc.所在地点 === 'string' && npc.所在地点.trim())
            || (typeof npc.所在位置 === 'string' && npc.所在位置.trim())
            || (typeof npc.具体地点 === 'string' && npc.具体地点.trim())
        );
        if (hasExplicitLocation) { skippedCount++; return npc; }
        updatedCount++;
        const next = { ...npc };
        if (currentLocation) {
            next.当前位置 = currentLocation;
            next.当前地点 = currentLocation;
        }
        if (locationPath) next.位置路径 = locationPath;
        return next;
    });
    if (skippedCount > 0 || updatedCount > 0) {
        console.info('[同步在场NPC位置]', { 保留原位: skippedCount, 填充当前位置: updatedCount, 当前地点: currentLocation || '(无)' });
    }
    return result;
};

const 同步当前视角在场状态 = (
    response: GameResponse,
    socialList: any[],
    playerName?: string
): any[] => {
    if (!Array.isArray(socialList) || socialList.length <= 0) return socialList;
    const responseFactText = 提取响应事实文本(response);
    if (!responseFactText.trim()) return socialList;
    const dialogueSenderKeys = 提取对白发送者集合(response, playerName);
    const presenceDecisions = socialList.map((npc: any) => (
        !npc || typeof npc !== 'object' || NPC已死亡(npc)
            ? undefined
            : 判断NPC本回合是否在场(npc, responseFactText, dialogueSenderKeys)
    ));
    const hasConfirmedPresentNpc = presenceDecisions.some((present) => present === true);
    return socialList.map((npc: any, index: number) => {
        if (!npc || typeof npc !== 'object') return npc;
        if (NPC已死亡(npc)) return { ...npc, 是否在场: false };
        const nextPresent = presenceDecisions[index];
        if (nextPresent === undefined) {
            return hasConfirmedPresentNpc && npc.是否在场 === true ? { ...npc, 是否在场: false } : npc;
        }
        return npc.是否在场 === nextPresent ? npc : { ...npc, 是否在场: nextPresent };
    });
};

const 提取响应实名 = (response: GameResponse, playerName?: string): string[] => {
    const names: string[] = [];
    const seen = new Set<string>();
    const push = (value: unknown) => {
        const name = typeof value === 'string' ? value.trim() : '';
        if (!是否对白NPC发送者(name, playerName)) return;
        const key = 归一化文本键(name);
        if (!key || seen.has(key) || 随行者占位名正则.test(name)) return;
        seen.add(key);
        names.push(name);
    };
    (Array.isArray(response?.logs) ? response.logs : []).forEach((log: any) => push(log?.sender));
    return names;
};

const 是否明确同行实名 = (name: string, responseFactText: string): boolean => {
    const key = 归一化文本键(name);
    if (!key) return false;
    return 拆分事实句(responseFactText).some((sentence) => (
        sentence.includes(name)
        && 同行强确认事实正则.test(sentence)
        && !同行离队事实正则.test(sentence)
        && !敌对或阻拦事实正则.test(sentence)
    ));
};

const 用实名替换随行占位 = (response: GameResponse, list: any[], playerName?: string): any[] => {
    const names = 提取响应实名(response, playerName);
    if (names.length <= 0 || !Array.isArray(list) || list.length <= 0) return list;
    const responseFactText = 提取响应事实文本(response);
    let next = [...list];
    let changed = false;
    const confirmedNames = names.filter((name) => 是否明确同行实名(name, responseFactText));
    names.forEach((name) => {
        if (!是否明确同行实名(name, responseFactText)) return;
        const nameKey = 归一化文本键(name);
        const existingIndex = next.findIndex((npc: any) => 归一化文本键(读取NPC名称(npc)) === nameKey);
        const placeholderIndex = next.findIndex((npc: any) => npc?.是否队友 === true && 随行者占位名正则.test(读取NPC名称(npc)));
        if (placeholderIndex < 0) {
            if (existingIndex >= 0) {
                const npc = next[existingIndex];
                if (npc?.是否队友 !== true || npc?.是否在场 !== true) {
                    next[existingIndex] = { ...npc, 是否队友: true, 是否在场: true };
                    changed = true;
                }
            }
            return;
        }
        const existing = existingIndex >= 0 ? next[existingIndex] : null;
        const placeholder = next[placeholderIndex];
        next[placeholderIndex] = {
            ...placeholder,
            ...(existing && typeof existing === 'object' ? existing : {}),
            id: existing?.id || `npc_companion_named_${稳定哈希文本(name)}`,
            姓名: name,
            是否在场: true,
            是否队友: true,
            关系状态: existing?.关系状态 && existing.关系状态 !== '未知' ? existing.关系状态 : '同行',
            简介: existing?.简介 || `原随行占位成员已在正文中点名为：${name}。`
        };
        if (existingIndex >= 0 && existingIndex !== placeholderIndex) {
            next = next.filter((_, index) => index !== existingIndex);
        }
        changed = true;
    });
    const confirmedNamedKeys = new Set(
        names
            .filter((name) => 是否明确同行实名(name, responseFactText))
            .map(归一化文本键)
            .filter(Boolean)
    );
    confirmedNamedKeys.forEach((key) => {
        const hasNamedCompanion = next.some((npc: any) => (
            npc?.是否队友 === true
            && 归一化文本键(读取NPC名称(npc)) === key
            && !随行者占位名正则.test(读取NPC名称(npc))
        ));
        if (!hasNamedCompanion) return;
        const placeholderIndex = next.findIndex((npc: any) => (
            npc?.是否队友 === true
            && 随行者占位名正则.test(读取NPC名称(npc))
        ));
        if (placeholderIndex < 0) return;
        next[placeholderIndex] = {
            ...next[placeholderIndex],
            是否队友: false,
            是否在场: false,
            关系状态: typeof next[placeholderIndex]?.关系状态 === 'string' && next[placeholderIndex].关系状态.trim()
                ? next[placeholderIndex].关系状态
                : '已由实名同行档案替代'
        };
        changed = true;
    });
    confirmedNames.forEach((name) => {
        const namedCompanionExists = next.some((npc: any) => (
            归一化文本键(读取NPC名称(npc)) === 归一化文本键(name)
            && npc?.是否队友 === true
        ));
        if (!namedCompanionExists) return;
        const placeholderIndex = next.findIndex((npc: any) => npc?.是否队友 === true && 随行者占位名正则.test(读取NPC名称(npc)));
        if (placeholderIndex < 0) return;
        next[placeholderIndex] = { ...next[placeholderIndex], 是否队友: false, 是否在场: false };
        changed = true;
    });
    return changed ? next : list;
};

const 应用同行事实到队伍 = (
    response: GameResponse,
    socialList: any[],
    playerName?: string
): any[] => {
    if (!Array.isArray(socialList)) return socialList;
    const responseFactText = 提取响应事实文本(response);
    if (!responseFactText.trim()) return socialList;
    const sentences = 拆分事实句(responseFactText);
    let changed = false;
    const nextList = socialList.map((npc: any) => {
        if (!npc || typeof npc !== 'object') return npc;
        const name = 读取NPC名称(npc);
        if (!name || 归一化文本键(name) === 归一化文本键(playerName)) return npc;
        const relatedSentences = sentences.filter((sentence) => sentence.includes(name));
        if (relatedSentences.length <= 0) return npc;
        if (relatedSentences.some((sentence) => 同行离队事实正则.test(sentence))) {
            if (npc.是否队友 !== true) return npc;
            changed = true;
            return { ...npc, 是否队友: false };
        }
        if (!relatedSentences.some((sentence) => 同行强确认事实正则.test(sentence))) return npc;
        // 敌对或阻拦事实不应设为队友
        if (relatedSentences.some((sentence) => 敌对或阻拦事实正则.test(sentence))) return npc;
        if (npc.是否队友 === true && npc.是否在场 === true) return npc;
        changed = true;
        return {
            ...npc,
            是否队友: true,
            是否在场: true,
            关系状态: typeof npc.关系状态 === 'string' && npc.关系状态.trim() && npc.关系状态 !== '未知'
                ? npc.关系状态
                : '同行'
        };
    });

    let renamed = 用实名替换随行占位(response, nextList, playerName);
    const namedCompanionCount = renamed.filter((npc: any) => {
        const name = 读取NPC名称(npc);
        return npc?.是否队友 === true
            && name
            && !随行者占位名正则.test(name)
            && 归一化文本键(name) !== 归一化文本键(playerName)
            && responseFactText.includes(name);
    }).length;
    if (namedCompanionCount > 0) {
        let remainingToConsume = namedCompanionCount;
        const compacted = renamed.map((npc: any) => {
            if (remainingToConsume <= 0) return npc;
            if (npc?.是否队友 === true && 随行者占位名正则.test(读取NPC名称(npc))) {
                remainingToConsume -= 1;
                return {
                    ...npc,
                    是否队友: false,
                    是否在场: false,
                    关系状态: typeof npc?.关系状态 === 'string' && npc.关系状态.trim()
                        ? npc.关系状态
                        : '已由实名同行档案替代'
                };
            }
            return npc;
        });
        if (remainingToConsume < namedCompanionCount) {
            renamed = compacted;
            changed = true;
        }
    }
    return changed || renamed !== socialList ? renamed : socialList;
};

const 装备槽位列表 = ['头部', '胸部', '盔甲', '内衬', '腿部', '手部', '足部', '主武器', '副武器', '暗器', '背部', '腰部', '坐骑'] as const;
const 装备槽位集合 = new Set<string>(装备槽位列表);

const 是空装备值 = (value: unknown): boolean => (
    value === undefined
    || value === null
    || (typeof value === 'string' && /^(?:|无|空置|空|none|null|undefined)$/i.test(value.trim()))
);

const 提取响应事实文本 = (response: GameResponse): string => {
    const parts: string[] = [];
    if (typeof (response as any)?.body === 'string') parts.push((response as any).body);
    if (typeof (response as any)?.正文 === 'string') parts.push((response as any).正文);
    if (typeof (response as any)?.summary === 'string') parts.push((response as any).summary);
    if (Array.isArray(response?.logs)) {
        response.logs.forEach((log: any) => {
            if (typeof log?.content === 'string') parts.push(log.content);
            if (typeof log?.text === 'string') parts.push(log.text);
            if (typeof log?.message === 'string') parts.push(log.message);
        });
    }
    return parts.join('\n');
};

const 体内射精事实正则 = /(内射|中出|射(?:进|入|在)(?:了)?(?:[^。！？\n\r]{0,24})?(?:体内|阴道|小穴|蜜穴|子宫|宫口|最深处)|精液(?:[^。！？\n\r]{0,24})?(?:灌入|注入|射入|填满|流入|涌入|进入)(?:[^。！？\n\r]{0,24})?(?:体内|阴道|小穴|蜜穴|子宫|宫口|最深处)|(?:子宫|宫口|最深处)(?:[^。！？\n\r]{0,24})?(?:精液|白浊))/;
const 体内射精否定正则 = /(?:未|没|没有|并未|并没有|尚未|不曾|未曾|不要|不许|拒绝|避免|只是在外|体外|没有选择|并非)(?:[^。！？\n\r]{0,18})?(?:内射|中出|射(?:进|入)|精液|体内射精)|(?:内射|中出|体内射精)(?:[^。！？\n\r]{0,18})?(?:未发生|没有发生|并未发生|尚未发生|不成立)/;
const 初次关系事实正则 = /(破处|初夜|失身|不再是处女|不再未经人事|处子(?:之身)?(?:已|被|给|让)?|(?:初次|第一次|首次|首度)(?:[^。！？\n\r]{0,16})?(?:亲密关系|发生关系|房事|云雨|交合|同房|双修|床笫|肉体关系|性事|性交)|(?:发生|完成|坐实)(?:[^。！？\n\r]{0,16})?(?:初次关系|初次亲密|第一次关系)|(?:插(?:进|入)|贯穿|进入(?:了)?)(?:[^。！？\n\r]{0,24})?(?:小穴|阴道|蜜穴|最深处)|(?:小穴|阴道|蜜穴)(?:[^。！？\n\r]{0,24})?(?:被|已|让)?(?:进入|占有|贯穿|破开)|体内射精|内射|中出)/;
const 初次关系否定正则 = /(?:未|没|没有|并未|并没有|尚未|不曾|未曾|不要|不许|拒绝|避免|只是|并非|不是|误判)(?:[^。！？\n\r]{0,18})?(?:初夜|破处|失身|发生关系|亲密关系|房事|云雨|交合|同房|双修|床笫|肉体关系|性事|性交)|(?:初夜|破处|失身|发生关系|亲密关系)(?:[^。！？\n\r]{0,18})?(?:未发生|没有发生|并未发生|尚未发生|不成立)/;
const 亲密行为事实规则 = [
    { 类型: '口交', 正则: /口交|口淫|口活|含住|含弄|吮弄|舔弄/ },
    { 类型: '肛交', 正则: /肛交|后庭交合|进入(?:了)?屁穴|插(?:进|入)(?:了)?屁穴|屁穴(?:被|让)?(?:进入|贯穿|占有)/ },
    { 类型: '阴道交', 正则: /阴道交|破处|初夜|失贞|插(?:进|入)(?:了)?(?:小穴|阴道|蜜穴)|进入(?:了)?(?:小穴|阴道|蜜穴)|(?:小穴|阴道|蜜穴)(?:被|让)?(?:进入|贯穿|占有)|体内射精|内射|中出/ },
    { 类型: '乳交', 正则: /乳交|胸交|乳房(?:夹|包|贴).*?(?:肉棒|阴茎)|肉棒.*?(?:乳房|胸部).*?(?:夹|磨|蹭)/ },
    { 类型: '手交', 正则: /手交|(?:用手|掌心|手指)(?:[^。！？\n\r]{0,12})?(?:抚弄|套弄|握住|撸动|摩挲)(?:[^。！？\n\r]{0,12})?(?:肉棒|阴茎|龟头|下体|性器)/ },
    { 类型: '足交', 正则: /足交|脚交|足心(?:夹|磨|蹭)|脚掌(?:夹|磨|蹭)/ },
    { 类型: '股交', 正则: /股交|(?:腿交)(?!叠)|(?:腿间|大腿)(?:[^。！？\n\r]{0,10})?(?:夹住|夹着|磨蹭|摩擦|抽送|套弄|蹭弄)(?:[^。！？\n\r]{0,12})?(?:肉棒|阴茎|下体|性器)?/ }
] as const;

const 亲密行为明确性器上下文正则 = /肉棒|阴茎|龟头|下体|性器|阴道|小穴|蜜穴|屁穴|后庭/u;
const 亲密行为噪声片段正则 = /腿交叠|双腿交叠|两腿交叠|腿脚交叠|手指|脚趾|掌心出汗|手心出汗|腿间发力/u;
const 私密状态未经历正则 = /(未经人事|未经房事|未曾人事|未曾经人事|尚未人事|尚未完全开发|未完全开发|处子|处女|完璧|无人采撷|未被使用|未曾使用|未开苞|初绽未开)/;

const 句子存在肯定事实 = (text: string, positive: RegExp, negative?: RegExp): boolean => (
    拆分事实句(text).some((sentence) => {
        if (是否非现实亲密语境(sentence)) return false;
        positive.lastIndex = 0;
        if (!positive.test(sentence)) return false;
        if (!negative) return true;
        negative.lastIndex = 0;
        return !negative.test(sentence);
    })
);

const 是否明确体内射精事实 = (text: string): boolean => 句子存在肯定事实(text, 体内射精事实正则, 体内射精否定正则);
const 是否明确初次关系事实 = (text: string): boolean => 句子存在肯定事实(text, 初次关系事实正则, 初次关系否定正则);

const 是否女性NPC = (npc: any): boolean => (
    typeof npc?.性别 === 'string' && npc.性别.trim() === '女'
);

const 是否扶她NPC = (npc: any): boolean => {
    const text = [npc?.性别, npc?.扶她设定, npc?.简介, npc?.身份].filter(Boolean).join(' ');
    return /扶她/.test(text);
};

const 是否男娘NPC = (npc: any): boolean => {
    const text = [npc?.性别, npc?.男娘设定, npc?.简介, npc?.身份].filter(Boolean).join(' ');
    return /男娘/.test(text);
};

const NPC允许亲密行为类型 = (npc: any, type: string): boolean => {
    if (type === '阴道交') return 是否女性NPC(npc) || 是否扶她NPC(npc);
    return true;
};

const 提取亲密行为类型 = (text: string, npc: any): string[] => {
    const sentences = 拆分事实句(text);
    const types = new Set<string>();
    sentences.forEach((sentence) => {
        if (是否非现实亲密语境(sentence)) return;
        if (初次关系否定正则.test(sentence) || 体内射精否定正则.test(sentence)) return;
        亲密行为事实规则.forEach((rule) => {
            rule.正则.lastIndex = 0;
            if (!rule.正则.test(sentence)) return;
            if ((rule.类型 === '手交' || rule.类型 === '股交') && (!亲密行为明确性器上下文正则.test(sentence) || 亲密行为噪声片段正则.test(sentence))) {
                return;
            }
            if (NPC允许亲密行为类型(npc, rule.类型)) {
                types.add(rule.类型);
            }
        });
    });
    if (types.size === 0 && 是否明确初次关系事实(text) && NPC允许亲密行为类型(npc, '阴道交')) {
        types.add('阴道交');
    }
    return Array.from(types);
};

const 读取NPC名称 = (npc: any): string => (
    typeof npc?.姓名 === 'string' && npc.姓名.trim()
        ? npc.姓名.trim()
        : typeof npc?.名称 === 'string' && npc.名称.trim()
            ? npc.名称.trim()
            : ''
);

const 读取NPC名称列表 = (npc: any): string[] => {
    if (!npc || typeof npc !== 'object') return [];
    const values = [
        npc?.姓名,
        npc?.名称,
        ...(Array.isArray(npc?.曾用名) ? npc.曾用名 : [])
    ];
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
        const name = typeof value === 'string' ? value.trim() : '';
        const key = 归一化文本键(name);
        if (!name || !key || seen.has(key)) return;
        seen.add(key);
        result.push(name);
    });
    return result;
};

const 文本包含任一NPC名称 = (text: string, npc: any): boolean => (
    读取NPC名称列表(npc).some((name) => text.includes(name))
);

const 提取亲密事实相关NPC索引 = (responseFactText: string, socialList: any[], options?: { vaginalOnly?: boolean }): number | null => {
    const candidates = (Array.isArray(socialList) ? socialList : [])
        .map((npc: any, index: number) => ({ npc, index, names: 读取NPC名称列表(npc) }))
        .filter((item) => !options?.vaginalOnly || NPC允许亲密行为类型(item.npc, '阴道交'));
    if (candidates.length <= 0) return null;

    const mentioned = candidates.filter((item) => item.names.some((name) => responseFactText.includes(name)));
    if (mentioned.length === 1) return mentioned[0].index;
    if (mentioned.length > 1) {
        const presentMentioned = mentioned.filter((item) => item.npc?.是否在场 === true);
        if (presentMentioned.length === 1) return presentMentioned[0].index;
        const mainMentioned = mentioned.filter((item) => item.npc?.是否主要角色 === true);
        if (mainMentioned.length === 1) return mainMentioned[0].index;
        return mentioned[0].index;
    }

    const presentCandidates = candidates.filter((item) => item.npc?.是否在场 === true);
    if (presentCandidates.length === 1) return presentCandidates[0].index;
    return null;
};

const 提取生理事实相关女性NPC索引 = (responseFactText: string, socialList: any[]): number | null => {
    if (!是否明确体内射精事实(responseFactText) && !是否明确初次关系事实(responseFactText)) return null;
    return 提取亲密事实相关NPC索引(responseFactText, socialList, { vaginalOnly: true });
};

const 构建体内射精记录描述 = (responseFactText: string, playerName?: string): string => {
    const normalized = responseFactText.replace(/\s+/g, ' ').trim();
    const match = normalized.match(/[^。！？\n\r]{0,36}(?:内射|中出|射(?:进|入)|精液|白浊|子宫|宫口)[^。！？\n\r]{0,56}[。！？]?/);
    const detail = (match?.[0] || '').trim();
    const actor = playerName || '主角';
    return detail ? `${actor}与其发生体内射精事件：${detail}` : `${actor}与其发生体内射精事件。`;
};

const 构建初夜描述 = (responseFactText: string, playerName?: string): string => {
    const normalized = responseFactText.replace(/\s+/g, ' ').trim();
    const detail = 拆分事实句(normalized)
        .find((sentence) => !是否非现实亲密语境(sentence) && 初次关系事实正则.test(sentence) && !初次关系否定正则.test(sentence))
        ?.slice(0, 96)
        .trim() || '';
    const actor = playerName || '主角';
    return detail ? `${actor}与其发生初次亲密关系：${detail}` : `${actor}与其发生初次亲密关系。`;
};

const 更新小穴经历状态描述 = (rawValue: unknown): string | undefined => {
    const text = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (!text) return undefined;
    const stateNote = '已发生初次关系，原“未经人事”状态失效';
    if (text.includes(stateNote)) return text;
    if (私密状态未经历正则.test(text)) {
        return text.replace(私密状态未经历正则, stateNote);
    }
    return `${text}；状态：${stateNote}。`;
};

const 生成临时内射记录日期 = (envLike: any): string => (
    规范化孕产时间(envLike)
    || 规范化孕产时间(envLike?.时间)
    || (typeof envLike?.时间 === 'string' && envLike.时间.trim() ? envLike.时间.trim() : '')
    || new Date().toISOString()
);

const 应用生理事实到女性NPC = (
    response: GameResponse,
    socialList: any[],
    envLike: any,
    playerName?: string
): any[] => {
    const responseFactText = 提取响应事实文本(response);
    const targetIndex = 提取生理事实相关女性NPC索引(responseFactText, socialList);
    if (targetIndex === null) return socialList;

    const hasInternalEjaculation = 是否明确体内射精事实(responseFactText);
    const hasFirstSexFact = hasInternalEjaculation || 是否明确初次关系事实(responseFactText);
    const eventDate = 生成临时内射记录日期(envLike);
    const description = 构建体内射精记录描述(responseFactText, playerName);
    const firstNightDescription = 构建初夜描述(responseFactText, playerName);
    return socialList.map((npc: any, index: number) => {
        if (index !== targetIndex || !npc || typeof npc !== 'object') return npc;
        const currentWomb = npc.子宫 && typeof npc.子宫 === 'object' ? npc.子宫 : {};
        const currentRecords = Array.isArray(currentWomb.内射记录) ? currentWomb.内射记录 : [];
        const alreadyRecorded = currentRecords.some((record: any) => (
            typeof record?.日期 === 'string'
            && record.日期 === eventDate
            && typeof record?.描述 === 'string'
            && record.描述.includes('体内射精事件')
        ));
        const nextRecords = alreadyRecorded
            ? currentRecords
            : [
                ...currentRecords,
                构建体内射精记录({
                    npc,
                    子宫: currentWomb,
                    日期: eventDate,
                    描述: description,
                    父亲姓名: playerName || '主角',
                    事件文本: responseFactText
                })
            ];
        const nextVulvaDescription = hasFirstSexFact ? 更新小穴经历状态描述(npc.小穴描述) : undefined;
        const shouldRecordFirstNight = hasFirstSexFact && (npc.是否处女 === true || typeof npc.是否处女 !== 'boolean' || !npc.初夜夺取者);
        const intimacyTypes = 提取亲密行为类型(responseFactText, npc);
        const currentIntimacyRecords = Array.isArray(npc.首次亲密记录) ? npc.首次亲密记录 : [];
        const nextIntimacyRecords = (() => {
            if (intimacyTypes.length <= 0) return currentIntimacyRecords;
            const merged = new Map<string, any>();
            currentIntimacyRecords.forEach((record: any) => {
                if (record?.类型 && NPC允许亲密行为类型(npc, record.类型)) merged.set(record.类型, record);
            });
            intimacyTypes.forEach((type) => {
                const existing = merged.get(type);
                if (existing?.是否已发生 && existing?.第一次对象) return;
                merged.set(type, {
                    ...existing,
                    类型: type,
                    是否已发生: true,
                    第一次对象: existing?.第一次对象 || playerName || '主角',
                    第一次时间: existing?.第一次时间 || eventDate,
                    第一次描述: existing?.第一次描述 || (type === '阴道交' ? firstNightDescription : 构建初夜描述(responseFactText, playerName).replace('初次亲密关系', `第一次${type}`))
                });
            });
            return Array.from(merged.values());
        })();
        const nextSexLossArchive = hasFirstSexFact && NPC允许亲密行为类型(npc, '阴道交')
            ? {
                ...(npc.失贞档案 && typeof npc.失贞档案 === 'object' ? npc.失贞档案 : {}),
                是否失贞: true,
                第一次对象: (npc.失贞档案 as any)?.第一次对象 || npc.初夜夺取者 || playerName || '主角',
                第一次时间: (npc.失贞档案 as any)?.第一次时间 || npc.初夜时间 || eventDate,
                第一次描述: (npc.失贞档案 as any)?.第一次描述 || npc.初夜描述 || firstNightDescription
            }
            : npc.失贞档案;
        return {
            ...npc,
            ...(hasFirstSexFact ? {
                是否处女: false,
                初夜夺取者: npc.初夜夺取者 || playerName || '主角',
                初夜时间: npc.初夜时间 || eventDate,
                初夜描述: npc.初夜描述 || (shouldRecordFirstNight ? firstNightDescription : undefined),
                ...(nextVulvaDescription ? { 小穴描述: nextVulvaDescription } : {})
            } : {}),
            ...(nextSexLossArchive ? { 失贞档案: nextSexLossArchive } : {}),
            ...(nextIntimacyRecords.length > 0 ? { 首次亲密记录: nextIntimacyRecords } : {}),
            子宫: {
                状态: typeof currentWomb.状态 === 'string' && currentWomb.状态.trim()
                    ? currentWomb.状态
                    : '未受孕',
                宫口状态: typeof currentWomb.宫口状态 === 'string' && currentWomb.宫口状态.trim()
                    ? currentWomb.宫口状态
                    : '射精后待观察',
                ...currentWomb,
                内射记录: hasInternalEjaculation ? nextRecords : currentRecords
            }
        };
    });
};

const 是否明确非阴道首次亲密事实 = (text: string): boolean => (
    提取亲密行为类型(text, { 性别: '男' }).some((type) => type !== '阴道交')
);

const 构建首次亲密描述 = (responseFactText: string, playerName: string | undefined, type: string): string => {
    const normalized = responseFactText.replace(/\s+/g, ' ').trim();
    const sentence = 拆分事实句(normalized)
        .find((item) => !是否非现实亲密语境(item) && 提取亲密行为类型(item, { 性别: type === '阴道交' ? '女' : '男' }).includes(type))
        ?.slice(0, 96)
        .trim() || '';
    const actor = playerName || '主角';
    return sentence ? `${actor}与其发生第一次${type}：${sentence}` : `${actor}与其发生第一次${type}。`;
};

const 应用首次亲密事实到NPC = (
    response: GameResponse,
    socialList: any[],
    envLike: any,
    playerName?: string
): any[] => {
    const responseFactText = 提取响应事实文本(response);
    if (!是否明确非阴道首次亲密事实(responseFactText)) return socialList;
    const targetIndex = 提取亲密事实相关NPC索引(responseFactText, socialList);
    if (targetIndex === null) return socialList;
    const eventDate = 生成临时内射记录日期(envLike);
    return socialList.map((npc: any, index: number) => {
        if (index !== targetIndex || !npc || typeof npc !== 'object') return npc;
        const intimacyTypes = 提取亲密行为类型(responseFactText, npc).filter((type) => type !== '阴道交');
        if (intimacyTypes.length <= 0) return npc;
        const merged = new Map<string, any>();
        (Array.isArray(npc.首次亲密记录) ? npc.首次亲密记录 : []).forEach((record: any) => {
            if (record?.类型 && NPC允许亲密行为类型(npc, record.类型)) merged.set(record.类型, record);
        });
        intimacyTypes.forEach((type) => {
            const existing = merged.get(type);
            if (existing?.是否已发生 && existing?.第一次对象) return;
            merged.set(type, {
                ...existing,
                类型: type,
                是否已发生: true,
                第一次对象: existing?.第一次对象 || playerName || '主角',
                第一次时间: existing?.第一次时间 || eventDate,
                第一次描述: existing?.第一次描述 || 构建首次亲密描述(responseFactText, playerName, type)
            });
        });
        const nextRecords = Array.from(merged.values());
        const analRecord = nextRecords.find((record: any) => record?.类型 === '肛交' && record?.是否已发生);
        const nextSexLossArchive = 是否男娘NPC(npc) && analRecord
            ? {
                ...(npc.失贞档案 && typeof npc.失贞档案 === 'object' ? npc.失贞档案 : {}),
                是否失贞: true,
                第一次对象: (npc.失贞档案 as any)?.第一次对象 || analRecord.第一次对象 || playerName || '主角',
                第一次时间: (npc.失贞档案 as any)?.第一次时间 || analRecord.第一次时间 || eventDate,
                第一次描述: (npc.失贞档案 as any)?.第一次描述 || analRecord.第一次描述 || 构建首次亲密描述(responseFactText, playerName, '肛交')
            }
            : npc.失贞档案;
        return {
            ...npc,
            ...(nextSexLossArchive ? { 失贞档案: nextSexLossArchive } : {}),
            首次亲密记录: nextRecords
        };
    });
};

const 攻略目标事实正则 = /(攻略(?:目标|对象)|目标(?:女主|女性|女子|姑娘)|锁定(?:为)?(?:女主|攻略对象|攻略目标)|追求对象|心仪对象|倾慕对象|重点推进(?:对象)?|纳入(?:女主|攻略|关系)(?:线|对象|目标)?)/;
const 关系成立事实正则 = /(发生(?:了)?关系|确立(?:了)?关系|关系(?:已经|正式)?(?:成立|确定|突破|升温)|成为(?:道侣|伴侣|恋人|情人|红颜|妻子|夫人)|结为(?:道侣|伴侣|夫妻)|定情|互许终身|私定终身|双修关系|亲密关系(?:成立|确定|突破)?|初次亲密关系|初夜|破处|失身|内射|中出)/;
const 关系目标字段正则 = /(攻略|女主|目标|追求|心仪|倾慕|恋人|伴侣|道侣|情人|红颜|妻子|夫人|定情|亲密|初夜|失身|双修|发生关系|关系突破)/;

const 提取关系目标事实文本 = (response: GameResponse): string => {
    const parts = [提取响应事实文本(response)];
    if (Array.isArray(response?.tavern_commands)) {
        response.tavern_commands.forEach((cmd: any) => {
            parts.push(typeof cmd?.key === 'string' ? cmd.key : '');
            if (typeof cmd?.value === 'string') {
                parts.push(cmd.value);
            } else if (cmd?.value && typeof cmd.value === 'object') {
                try {
                    parts.push(JSON.stringify(cmd.value));
                } catch {
                    // ignore non-serializable command values
                }
            }
        });
    }
    return parts.filter(Boolean).join('\n');
};

const NPC字段是否含关系目标语义 = (npc: any): boolean => {
    const scalarText = [
        npc?.关系状态,
        npc?.身份,
        npc?.简介,
        npc?.核心性格特征,
        npc?.关系突破条件,
        npc?.好感度突破条件,
        npc?.对主角称呼,
        npc?.备注,
        npc?.标签
    ].filter((value) => typeof value === 'string').join(' ');
    if (关系目标字段正则.test(scalarText)) return true;
    const relationText = Array.isArray(npc?.关系网变量)
        ? npc.关系网变量.map((item: any) => [item?.对象姓名, item?.关系, item?.备注].filter(Boolean).join(' ')).join(' ')
        : '';
    if (关系目标字段正则.test(relationText)) return true;
    const memoryText = Array.isArray(npc?.记忆)
        ? npc.记忆.map((item: any) => typeof item?.内容 === 'string' ? item.内容 : '').join(' ')
        : '';
    return 关系目标字段正则.test(memoryText);
};

const 应用女性关系目标主要角色兜底 = (
    response: GameResponse,
    socialList: any[],
    options?: { heroinePlanEnabled?: boolean }
): any[] => {
    if (options?.heroinePlanEnabled === false) return socialList;
    if (!Array.isArray(socialList) || socialList.length <= 0) return socialList;
    const factText = 提取关系目标事实文本(response);
    const hasGlobalTargetFact = 攻略目标事实正则.test(factText) || 关系成立事实正则.test(factText);
    let changed = false;
    const nextList = socialList.map((npc: any) => {
        if (!npc || typeof npc !== 'object' || !是否女性NPC(npc) || npc?.是否主要角色 === true) return npc;
        const mentionedAsTarget = Boolean(hasGlobalTargetFact && 文本包含任一NPC名称(factText, npc));
        const fieldMarked = NPC字段是否含关系目标语义(npc);
        if (!mentionedAsTarget && !fieldMarked) return npc;
        changed = true;
        return { ...npc, 是否主要角色: true };
    });
    return changed ? nextList : socialList;
};

const 死亡状态正则 = /(死亡|已死|身亡|阵亡|战死|气绝|断气|毙命|殒命|已故|陨落|灰飞烟灭|魂飞魄散|形神俱灭|神魂俱灭|化为飞灰|尸骨无存)/;

const NPC死亡字段含无依据死亡状态 = (npc: any): boolean => {
    const statusText = [npc?.状态, npc?.生死状态, npc?.生命状态].filter(Boolean).join(' ');
    return 死亡状态正则.test(statusText);
};

const NPC已有死亡依据 = (npc: any): boolean => {
    return typeof npc?.死亡时间 === 'string' && npc.死亡时间.trim().length > 0;
};

const 清理无依据死亡状态 = (socialList: any[]): any[] => {
    if (!Array.isArray(socialList) || socialList.length <= 0) return socialList;
    let changed = false;
    const nextList = socialList.map((npc: any) => {
        if (!npc || typeof npc !== 'object') return npc;
        if (!NPC死亡字段含无依据死亡状态(npc) || NPC已有死亡依据(npc)) return npc;
        changed = true;
        const next = { ...npc };
        if (死亡状态正则.test(String(next.状态 || ''))) {
            const hp = Number(next.当前血量);
            const maxHp = Number(next.最大血量);
            if (Number.isFinite(hp) && hp <= 0 && Number.isFinite(maxHp) && maxHp > 0) {
                next.状态 = '重伤';
            } else {
                delete next.状态;
            }
        }
        if (死亡状态正则.test(String(next.生死状态 || ''))) delete next.生死状态;
        if (死亡状态正则.test(String(next.生命状态 || ''))) delete next.生命状态;
        if (死亡状态正则.test(String(next.死亡描述 || ''))) delete next.死亡描述;
        if (Array.isArray(next.DEBUFF)) {
            const filteredDebuff = next.DEBUFF.filter((item: any) => !状态效果是死亡判定(item));
            if (filteredDebuff.length > 0) {
                next.DEBUFF = filteredDebuff;
            } else {
                delete next.DEBUFF;
            }
        }
        return next;
    });
    return changed ? nextList : socialList;
};

const 装备移除触发正则 = /(卸下|脱下|取下|摘下|换下|换装|更换|丢弃|扔掉|遗弃|卖出|售卖|出售|卖给|卖了|卖掉|上架|典当|赠予|交给|交出|缴械|被夺|夺走|抢走|没收|遗失|失落|掉落|损坏|毁坏|破碎|断裂|烧毁|腐蚀|消耗|报废|解除装备|卸除装备)/;

const 命令是否有装备移除触发 = (cmd: any, responseFactText: string): boolean => {
    const commandText = [
        cmd?.key,
        typeof cmd?.value === 'string' ? cmd.value : '',
        typeof cmd?.reason === 'string' ? cmd.reason : '',
        typeof cmd?.原因 === 'string' ? cmd.原因 : '',
        typeof cmd?.说明 === 'string' ? cmd.说明 : '',
        responseFactText
    ].filter(Boolean).join('\n');
    return 装备移除触发正则.test(commandText);
};

const 净化角色装备命令 = (
    cmd: any,
    currentEquipment: Record<string, any>,
    responseFactText: string
): any | null => {
    const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '');
    if (!normalizedKey.startsWith('gameState.角色.装备')) return cmd;
    const action = (cmd?.action || 'set') as string;
    const allowRemoval = 命令是否有装备移除触发(cmd, responseFactText);
    if (allowRemoval) return cmd;

    const rest = normalizedKey.slice('gameState.角色.装备'.length).replace(/^\./, '');
    if (!rest) {
        if (action === 'delete') return null;
        if (cmd?.value && typeof cmd.value === 'object' && !Array.isArray(cmd.value)) {
            const nextValue = { ...cmd.value };
            let changed = false;
            装备槽位列表.forEach((slot) => {
                if (!(slot in nextValue)) return;
                if (!是空装备值(nextValue[slot])) return;
                if (是空装备值(currentEquipment?.[slot])) return;
                nextValue[slot] = currentEquipment[slot];
                changed = true;
            });
            return changed ? { ...cmd, value: nextValue } : cmd;
        }
        if (是空装备值(cmd?.value) && Object.values(currentEquipment || {}).some((value) => !是空装备值(value))) {
            return null;
        }
        return cmd;
    }

    const slot = rest.split(/[.\[]/, 1)[0];
    if (!装备槽位集合.has(slot)) return cmd;
    if ((action === 'delete' || 是空装备值(cmd?.value)) && !是空装备值(currentEquipment?.[slot])) {
        return null;
    }
    return cmd;
};

const 是否社交生理高风险命令 = (cmd: any): boolean => {
    const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '');
    if (!normalizedKey.startsWith('gameState.社交[')) return false;
    const action = (cmd?.action || 'set') as string;
    if (/\.初夜(?:夺取者|时间|描述)$/.test(normalizedKey) && !/\.死亡时间$/.test(normalizedKey)) return true;
    if (/\.失贞档案(?:$|\.)/.test(normalizedKey) && action !== 'delete') return true;
    if (/\.首次亲密记录(?:$|\[)/.test(normalizedKey) && action !== 'delete') return true;
    if (/\.是否处女$/.test(normalizedKey) && action !== 'delete' && cmd?.value === false) return true;
    if (/\.子宫(?:$|\.)/.test(normalizedKey) && action !== 'delete') return true;
    return false;
};

const 是否明确孕产事实 = (text: string): boolean => (
    句子存在肯定事实(
        text,
        /生理期|经期|月事|行经|癸水|天癸|排卵期|受孕期|受孕|怀孕|有孕|妊娠|孕|胎儿|胎动|临盆|生产|分娩|诞下|产下|产子|产女|生下|出生|降生|催生|催产|提前生育|提前生产|时间加速|岁月加速|光阴加速|时光加速|加速秘法/u
    )
);

const 净化社交生理命令 = (
    cmd: any,
    responseFactText: string
): any | null => {
    if (!是否社交生理高风险命令(cmd)) return cmd;
    if (
        是否明确体内射精事实(responseFactText)
        || 是否明确初次关系事实(responseFactText)
        || 是否明确非阴道首次亲密事实(responseFactText)
        || 是否明确孕产事实(responseFactText)
    ) return cmd;
    return null;
};

const 净化角色天赋背景命令 = (
    cmd: any,
    currentChar: any
): any | null => {
    const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '');
    if (!normalizedKey.startsWith('gameState.角色.天赋列表')
        && !normalizedKey.startsWith('gameState.角色.出身背景')) return cmd;
    const action = (cmd?.action || 'set') as string;
    if (action !== 'set') return cmd;
    if (normalizedKey === 'gameState.角色.天赋列表') {
        const existingList = Array.isArray(currentChar?.天赋列表) ? currentChar.天赋列表 : [];
        const newValue = cmd?.value;
        if (!Array.isArray(newValue)) return cmd;
        const merged = newValue.map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const name = typeof item?.名称 === 'string' ? item.名称.trim() : '';
            if (!name) return item;
            const match = existingList.find((e: any) => e?.名称 === name);
            if (!match) return item;
            return {
                ...match,
                ...Object.fromEntries(
                    Object.entries(item).filter(([k, v]) => {
                        if (k === '名称') return true;
                        return v !== undefined && v !== null && v !== '';
                    })
                )
            };
        });
        return { ...cmd, value: merged };
    }
    if (normalizedKey === 'gameState.角色.出身背景') {
        const existing = currentChar?.出身背景 || {};
        const newValue = cmd?.value;
        if (!newValue || typeof newValue !== 'object' || Array.isArray(newValue)) return cmd;
        const merged = {
            ...existing,
            ...Object.fromEntries(
                Object.entries(newValue).filter(([k, v]) => {
                    if (k === '名称') return true;
                    return v !== undefined && v !== null && v !== '';
                })
            )
        };
        return { ...cmd, value: merged };
    }
    return cmd;
};

const 规范化命令姓名 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

const 社交新增保留栏目名 = new Set([
    '队伍', '社交', '背包', '装备', '世界', '地图', '门派', '任务', '剧情', '规划', '记忆',
    '玩家', '角色', '主角', '同伴', '队友', '同行', '随行者', '关系', '人物', 'NPC'
]);

const 是否保留栏目式社交姓名 = (name: string): boolean => {
    if (!name) return false;
    if (社交新增保留栏目名.has(name)) return true;
    return /^(?:队伍|社交|背包|装备|世界|地图|门派|任务|剧情|规划|记忆)(?:数据|信息|列表|面板|状态|更新)?$/u.test(name);
};

const 提取社交姓名命令索引 = (rawKey: unknown): number | null => {
    const normalizedKey = normalizeStateCommandKey(typeof rawKey === 'string' ? rawKey : '');
    const match = normalizedKey.match(/^gameState\.社交\[(\d+)\]\.姓名$/);
    if (!match) return null;
    const index = Number(match[1]);
    return Number.isInteger(index) && index >= 0 ? index : null;
};

const 净化社交姓名命令 = (cmd: any, currentSocial: any[]): any | null => {
    const index = 提取社交姓名命令索引(cmd?.key);
    if (index == null) return cmd;
    if ((cmd?.action || 'set') !== 'set') return cmd;
    const currentName = 规范化命令姓名(currentSocial?.[index]?.姓名);
    const nextName = 规范化命令姓名(cmd?.value);
    if (!currentName || !nextName || currentName === nextName) return cmd;
    return null;
};

const 提取新增社交命令姓名 = (cmd: any): string => {
    const action = cmd?.action || 'set';
    if (action !== 'push' && action !== 'add' && action !== 'set') return '';
    const normalizedKey = normalizeStateCommandKey(typeof cmd?.key === 'string' ? cmd.key : '');
    const isWholeSocialAppend = normalizedKey === 'gameState.社交' && (action === 'push' || action === 'add');
    const isWholeSocialSlotSet = /^gameState\.社交\[\d+\]$/.test(normalizedKey) && action === 'set';
    if (!isWholeSocialAppend && !isWholeSocialSlotSet) return '';
    const value = cmd?.value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    return 规范化命令姓名(value?.姓名 || value?.名称);
};

const 净化新增社交命令 = (
    cmd: any,
    playerName?: string
): any | null => {
    const nextName = 提取新增社交命令姓名(cmd);
    if (!nextName) return cmd;
    if (是否保留栏目式社交姓名(nextName)) return null;
    const nextKey = 归一化文本键(nextName);
    if (playerName && nextKey === 归一化文本键(playerName)) return null;
    return cmd;
};

export const 执行响应命令处理 = (
    response: GameResponse,
    currentState: 响应命令处理状态,
    deps: 响应命令处理依赖,
    baseState?: Partial<响应命令处理状态>,
    options?: {
        applyState?: boolean;
        heroinePlanEnabled?: boolean;
    }
): 响应命令处理状态 => {
    const shouldApplyState = options?.applyState !== false;
    const heroinePlanEnabled = options?.heroinePlanEnabled !== false;
    let charBuffer = baseState?.角色 || currentState.角色;
    let envBuffer = deps.规范化环境信息(baseState?.环境 || currentState.环境);
    let socialBuffer = Array.isArray(baseState?.社交) ? baseState.社交 : currentState.社交;
    let worldBuffer = deps.规范化世界状态(baseState?.世界 || currentState.世界);
    let sectBuffer = deps.规范化组织状态(baseState?.玩家组织 || currentState.玩家组织);
    let tasksBuffer = Array.isArray(baseState?.任务列表) ? baseState.任务列表 : currentState.任务列表;
    let storyBuffer = deps.规范化剧情状态(baseState?.剧情 || currentState.剧情);
    let storyPlanBuffer = deps.规范化剧情规划状态(baseState?.剧情规划 || currentState.剧情规划);
    let heroinePlanBuffer = deps.规范化女主剧情规划状态(baseState?.女主剧情规划 ?? currentState.女主剧情规划);
    const socialBeforeCommands = Array.isArray(socialBuffer) ? socialBuffer : [];

    const responseFactText = 提取响应事实文本(response);
    if (Array.isArray(response.tavern_commands)) {
        const deathRiskCommandIndices = 提取NPC死亡风险命令索引(response.tavern_commands, socialBuffer);
        response.tavern_commands.forEach((cmd, commandIndex) => {
            if (deathRiskCommandIndices.has(commandIndex)) return;
            let safeCmd = 净化新增社交命令(
                净化社交姓名命令(
                    sanitizeInventoryCommand(
                        净化社交生理命令(
                            净化角色天赋背景命令(
                                净化角色装备命令(cmd, charBuffer?.装备 || {}, responseFactText),
                                charBuffer
                            ),
                            responseFactText
                        ),
                        charBuffer,
                        responseFactText
                    ),
                    socialBuffer
                ),
                charBuffer?.姓名
            );
            if (!safeCmd) return;
            if (!heroinePlanEnabled && 是女主剧情规划命令(safeCmd)) return;
            if (heroinePlanEnabled && 是女主剧情规划命令(safeCmd)) {
                const heroineGuard = 过滤女主规划命令([safeCmd], 构建红颜规划候选结果(
                    deps.规范化社交列表(socialBuffer, { 合并同名: false })
                ));
                if (heroineGuard.commands.length <= 0) return;
                safeCmd = heroineGuard.commands[0];
            }
            if (命令存在社交删除风险(safeCmd, socialBuffer)) return;
            if (是否游戏初始时间命令(safeCmd.key)) {
                return;
            }
            if (是否环境时间命令(safeCmd.key) && safeCmd.action === 'set') {
                if (是否时间回退或异常重置(envBuffer?.时间, safeCmd.value)) {
                    return;
                }
            }
            const result = applyStateCommand(
                charBuffer,
                envBuffer,
                socialBuffer,
                worldBuffer,
                storyBuffer,
                storyPlanBuffer,
                heroinePlanBuffer,
                sectBuffer,
                tasksBuffer,
                safeCmd.key,
                safeCmd.value,
                safeCmd.action
            );
            charBuffer = result.char;
            envBuffer = result.env;
            socialBuffer = result.social;
            worldBuffer = result.world;
            sectBuffer = result.sect;
            tasksBuffer = Array.isArray(result.tasks) ? result.tasks : [];
            storyBuffer = result.story;
            storyPlanBuffer = result.storyPlan;
            heroinePlanBuffer = result.heroinePlan;
        });

        envBuffer = deps.规范化环境信息(envBuffer);
        socialBuffer = deps.规范化社交列表(socialBuffer, { 合并同名: false });
        worldBuffer = deps.规范化世界状态(worldBuffer);
        sectBuffer = deps.规范化组织状态(sectBuffer);
        storyPlanBuffer = deps.规范化剧情规划状态(storyPlanBuffer);
        heroinePlanBuffer = deps.规范化女主剧情规划状态(heroinePlanBuffer);

        charBuffer = deps.规范化角色物品容器映射(charBuffer, {
            当前时间: envBuffer,
            事件文本: responseFactText,
            ...deps.角色规范化选项
        });
        socialBuffer = deps.规范化社交列表(
            补入对白发送者到社交(response, socialBuffer, charBuffer?.姓名),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            应用生理事实到女性NPC(response, socialBuffer, envBuffer, charBuffer?.姓名),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            应用首次亲密事实到NPC(response, socialBuffer, envBuffer, charBuffer?.姓名),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            应用女性关系目标主要角色兜底(response, socialBuffer, { heroinePlanEnabled }),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            清理无依据死亡状态(socialBuffer),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            同步当前视角在场状态(response, socialBuffer, charBuffer?.姓名),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            应用同行事实到队伍(response, socialBuffer, charBuffer?.姓名),
            { 合并同名: false }
        );
        socialBuffer = deps.规范化社交列表(
            同步在场NPC当前位置(socialBuffer, envBuffer),
            { 合并同名: false }
        );
        const retention = 合并保留既有NPC列表(socialBeforeCommands, socialBuffer, charBuffer?.姓名);
        if (retention.是否变更) {
            socialBuffer = deps.规范化社交列表(retention.列表, { 合并同名: false });
        }
        socialBuffer = deps.规范化社交列表(
            推进社交孕产状态(socialBuffer, {
                当前时间: envBuffer,
                事件文本: responseFactText,
                父亲姓名: charBuffer?.姓名
            }),
            { 合并同名: false }
        );
        storyBuffer = deps.规范化剧情状态(storyBuffer);

        // 过滤与主角同名的NPC条目，防止主角被NPC化（tavern_commands分支也需要此防护）
        const playerNormKeyTavern = typeof charBuffer?.姓名 === 'string' ? charBuffer.姓名.trim().replace(/\s+/g, '').toLowerCase() : '';
        if (playerNormKeyTavern) {
            socialBuffer = socialBuffer.filter((npc: any) => {
                const npcName = typeof npc?.姓名 === 'string' ? npc.姓名.trim().replace(/\s+/g, '').toLowerCase() : '';
                return !npcName || npcName !== playerNormKeyTavern;
            });
        }

        let finalState: 响应命令处理状态 = {
            角色: charBuffer,
            环境: deps.规范化环境信息(envBuffer),
            社交: socialBuffer,
            世界: deps.规范化世界状态(worldBuffer),
            玩家组织: deps.规范化组织状态(sectBuffer),
            任务列表: 规范化任务列表自动结算(Array.isArray(tasksBuffer) ? tasksBuffer : []),
            剧情: storyBuffer,
            剧情规划: deps.规范化剧情规划状态(storyPlanBuffer),
            女主剧情规划: deps.规范化女主剧情规划状态(heroinePlanBuffer)
        };
        const rewardSettlement = 结算已完成任务奖励({
            response,
            state: finalState,
            normalizeRole: deps.规范化角色物品容器映射,
            roleNormalizeOptions: deps.角色规范化选项
        });
        if (rewardSettlement.changed) {
            finalState = {
                ...finalState,
                角色: rewardSettlement.state.角色,
                玩家组织: deps.规范化组织状态(rewardSettlement.state.玩家组织),
                任务列表: 规范化任务列表自动结算(rewardSettlement.state.任务列表)
            };
        }
        const calibrated = deps.命令后校准?.(finalState);
        if (calibrated) {
            finalState = 'state' in calibrated ? calibrated.state : calibrated;
        }

        if (shouldApplyState) {
            deps.设置角色?.(finalState.角色);
            deps.设置环境?.(finalState.环境);
            deps.设置社交?.(finalState.社交);
            deps.设置世界?.(finalState.世界);
            deps.设置玩家组织?.(finalState.玩家组织);
            deps.设置任务列表?.(finalState.任务列表);
            deps.设置剧情?.(finalState.剧情);
            deps.设置剧情规划?.(finalState.剧情规划);
            deps.设置女主剧情规划?.(finalState.女主剧情规划);
        }

        return finalState;
    }

    const normalizedEnv = deps.规范化环境信息(envBuffer);
    const normalizedSocialBase = deps.规范化社交列表(
        同步在场NPC当前位置(
            应用同行事实到队伍(
                response,
                同步当前视角在场状态(
                    response,
                    清理无依据死亡状态(
                        应用女性关系目标主要角色兜底(
                            response,
                            应用首次亲密事实到NPC(
                                response,
                                应用生理事实到女性NPC(
                                    response,
                                    补入对白发送者到社交(response, socialBuffer, charBuffer?.姓名),
                                    envBuffer,
                                    charBuffer?.姓名
                                ),
                                envBuffer,
                                charBuffer?.姓名
                            ),
                            { heroinePlanEnabled }
                        )
                    ),
                    charBuffer?.姓名
                ),
                charBuffer?.姓名
            ),
            normalizedEnv
        ),
        { 合并同名: false }
    );
    const socialRetention = 合并保留既有NPC列表(socialBeforeCommands, normalizedSocialBase, charBuffer?.姓名);
    let normalizedSocial = socialRetention.是否变更
        ? deps.规范化社交列表(socialRetention.列表, { 合并同名: false })
        : normalizedSocialBase;
    normalizedSocial = deps.规范化社交列表(
        推进社交孕产状态(normalizedSocial, {
            当前时间: normalizedEnv,
            事件文本: responseFactText,
            父亲姓名: charBuffer?.姓名
        }),
        { 合并同名: false }
    );

    // 过滤与主角同名的NPC条目，防止主角被NPC化
    const playerNormKey = typeof charBuffer?.姓名 === 'string' ? charBuffer.姓名.trim().replace(/\s+/g, '').toLowerCase() : '';
    if (playerNormKey) {
        normalizedSocial = normalizedSocial.filter((npc: any) => {
            const npcName = typeof npc?.姓名 === 'string' ? npc.姓名.trim().replace(/\s+/g, '').toLowerCase() : '';
            return !npcName || npcName !== playerNormKey;
        });
    }

    let finalState: 响应命令处理状态 = {
        角色: charBuffer,
        环境: normalizedEnv,
        社交: normalizedSocial,
        世界: deps.规范化世界状态(worldBuffer),
        玩家组织: deps.规范化组织状态(sectBuffer),
        任务列表: 规范化任务列表自动结算(Array.isArray(tasksBuffer) ? tasksBuffer : []),
        剧情: deps.规范化剧情状态(storyBuffer),
        剧情规划: deps.规范化剧情规划状态(storyPlanBuffer),
        女主剧情规划: deps.规范化女主剧情规划状态(heroinePlanBuffer)
    };
    const rewardSettlement = 结算已完成任务奖励({
        response,
        state: finalState,
        normalizeRole: deps.规范化角色物品容器映射,
        roleNormalizeOptions: deps.角色规范化选项
    });
    if (rewardSettlement.changed) {
        finalState = {
            ...finalState,
            角色: rewardSettlement.state.角色,
            玩家组织: deps.规范化组织状态(rewardSettlement.state.玩家组织),
            任务列表: 规范化任务列表自动结算(rewardSettlement.state.任务列表)
        };
    }
    const calibrated = deps.命令后校准?.(finalState);
    if (calibrated) {
        finalState = 'state' in calibrated ? calibrated.state : calibrated;
    };
    if (shouldApplyState) {
        deps.设置角色?.(finalState.角色);
        deps.设置环境?.(finalState.环境);
        deps.设置社交?.(finalState.社交);
        deps.设置世界?.(finalState.世界);
        deps.设置玩家组织?.(finalState.玩家组织);
        deps.设置任务列表?.(finalState.任务列表);
        deps.设置剧情?.(finalState.剧情);
        deps.设置剧情规划?.(finalState.剧情规划);
        deps.设置女主剧情规划?.(finalState.女主剧情规划);
    }
    return finalState;
};
