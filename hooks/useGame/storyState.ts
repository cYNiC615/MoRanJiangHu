import type {
    WorldGenConfig,
    世界数据结构,
    玩家组织结构,
    剧情系统结构,
    剧情规划结构,
    女主剧情规划结构,
    环境信息结构,
    聊天记录结构,
    角色数据结构,
    记忆系统结构,
    OpeningConfig
} from '../../types';
import type { 任务结构 } from '../../models/task';
import { 修复开局伙伴社交列表 } from '../../utils/openingCompanion';
import { buildWorldMapLayersFromDraft } from '../../utils/newGameDiy';
import { 构建默认技艺 } from '../../utils/skillDefaults';
import { 获取题材模式配置 } from '../../utils/topicModeProfiles';
import { 候选名命中模板黑名单 } from '../../utils/templateNameBlacklist';
import { 确保角色金钱BaseAmount } from '../../utils/currencyDisplay';
import type { WorldFoundationResult } from '../../services/ai/storyTasks';

const 职位等级排序: Record<string, number> = {};

// ponytail: only helpers used across files stay exported; opening internals stay local.
type 开场命令基态 = {
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

const 取文本 = (value: any, fallback = ''): string => (
    typeof value === 'string' ? value.trim() : fallback
);

const 取首个已定义值 = (source: any, keys: string[]): any => {
    if (!source || typeof source !== 'object') return undefined;
    for (const key of keys) {
        if (source[key] !== undefined) return source[key];
    }
    return undefined;
};

const 取数字 = (value: any, fallback = 0): number => {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
};

const 生成稳定哈希 = (text: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const 按种子取项 = <T,>(items: T[], seed: number, offset = 0): T => (
    items[Math.abs(seed + offset) % items.length]
);

const 含幕后生成占位文本 = (value: any): boolean => (
    typeof value === 'string' && /待\s*AI|AI\s*生成|请由AI|开局模板|不得沿用固定|待AI生成|待AI评定|待AI评估/u.test(value)
);

const 传统组织职位贡献门槛: Record<string, number> = {
    杂役弟子: 0,
    外门弟子: 100,
    内门弟子: 350,
    真传弟子: 900,
    执事: 1600,
    长老: 3200,
    副掌门: 6500,
    掌门: 12000,
};

const 标准传统组织职位列表 = ['杂役弟子', '外门弟子', '内门弟子', '真传弟子', '执事', '长老', '副掌门', '掌门'];

const 地图层级顺序 = ['寰宇', '大地点', '中地点', '小地点', '区地点', '子地点'] as const;
const 地图层级集合 = new Set<string>(地图层级顺序);

const 规范化地图层级名称 = (value: any): any => {
    const text = 取文本(value);
    if (text === '具体地点') return '区地点';
    if (text === '室内' || text === '房间') return '子地点';
    return 地图层级集合.has(text) ? text : '区地点';
};

const 规范化世界基底地图层级 = (rawLayers: any[]): any[] => {
    const normalized = (Array.isArray(rawLayers) ? rawLayers : [])
        .map((layer) => ({
            名称: 取文本(layer?.名称 || layer?.name),
            层级: 规范化地图层级名称(layer?.层级 || layer?.level),
            父级ID: 取文本(layer?.父级ID || layer?.parentId || layer?.parent || layer?.上级地点),
            描述: 取文本(layer?.描述 || layer?.description),
            控制势力: 取文本(layer?.控制势力 || layer?.主导势力 || layer?.所属势力 || layer?.controllingFaction),
            势力影响: 取文本(layer?.势力影响 || layer?.势力分布 || layer?.factionInfluence),
            势力标签: 取字符串数组(layer?.势力标签 || layer?.factionTags)
        }))
        .filter((layer) => layer.名称);
    if (!normalized.some((layer) => layer.层级 === '寰宇')) {
        normalized.unshift({
            名称: '诸天万界',
            层级: '寰宇',
            父级ID: '',
            描述: '诸天万界交汇之地',
            控制势力: '',
            势力影响: '',
            势力标签: []
        });
    }

    let seq = 0;
    const nextId = () => {
        seq += 1;
        return `DT-${String(seq).padStart(3, '0')}`;
    };
    const nameToId = new Map<string, string>();
    normalized.forEach((layer) => {
        if (!nameToId.has(layer.名称)) nameToId.set(layer.名称, nextId());
    });

    return normalized.map((layer) => ({
        ID: nameToId.get(layer.名称) || nextId(),
        名称: layer.名称,
        层级: layer.层级,
        父级ID: layer.父级ID ? (nameToId.get(layer.父级ID) || layer.父级ID) : '',
        描述: layer.描述,
        控制势力: layer.控制势力,
        势力影响: layer.势力影响,
        势力标签: layer.势力标签,
        归属: { 大地点: '', 中地点: '', 小地点: '' }
    }));
};

const 势力类型集合 = new Set(['门派', '家族', '商会', '镖局', '官府', '帮派', '散修联盟', '其他']);
const 势力关系集合 = new Set(['友好', '中立', '敌对', '从属', '联盟']);

const 规范化世界基底势力列表 = (rawFactions: any[]): any[] => {
    const source = Array.isArray(rawFactions) ? rawFactions : [];
    const ids = new Set<string>();
    const fallbackId = (index: number) => `FCT-${String(index + 1).padStart(3, '0')}`;
    return source
        .map((faction, index) => {
            const idRaw = 取文本(faction?.ID || faction?.id) || fallbackId(index);
            let id = idRaw;
            if (ids.has(id)) id = fallbackId(index);
            ids.add(id);
            const type = 取文本(faction?.类型 || faction?.type);
            const relationSource = faction?.关系网 && typeof faction.关系网 === 'object' && !Array.isArray(faction.关系网)
                ? faction.关系网
                : {};
            const relationEntries = Object.entries(relationSource)
                .map(([key, value]) => [取文本(key), 势力关系集合.has(取文本(value)) ? 取文本(value) : '中立'])
                .filter(([key]) => key);
            return {
                ID: id,
                名称: 取文本(faction?.名称 || faction?.name),
                类型: 势力类型集合.has(type) ? type : '其他',
                实力等级: Math.max(1, Math.min(10, 取数字(faction?.实力等级 || faction?.power || faction?.level, 5))),
                地盘归属: 取文本(faction?.地盘归属 || faction?.territory || faction?.所在地),
                描述: 取文本(faction?.描述 || faction?.description),
                代表性物品风格: 取文本(faction?.代表性物品风格 || faction?.itemStyle),
                关系网: Object.fromEntries(relationEntries),
                库藏物品池: Array.isArray(faction?.库藏物品池 || faction?.items)
                    ? (faction?.库藏物品池 || faction?.items).map((item: any) => ({
                        名称: 取文本(item?.名称 || item?.name),
                        类型: 取文本(item?.类型 || item?.type),
                        品质: 取文本(item?.品质 || item?.quality, '普通'),
                        描述: 取文本(item?.描述 || item?.description),
                        预置图片URL: 取文本(item?.预置图片URL)
                    })).filter((item: any) => item.名称)
                    : [],
                当前状态: 取文本(faction?.当前状态 || faction?.status)
            };
        })
        .filter((faction) => faction.名称);
};

export const 合并世界基底到开场状态 = <T extends { 世界?: 世界数据结构 }>(
    openingBase: T,
    foundation?: Pick<WorldFoundationResult, 'mapLayers' | 'factions'> | null
): T => {
    if (!foundation) return openingBase;
    const mapLayers = 规范化世界基底地图层级(foundation.mapLayers || []);
    const factions = 规范化世界基底势力列表(foundation.factions || []);
    if (mapLayers.length <= 0 && factions.length <= 0) return openingBase;
    const currentWorld = openingBase.世界 || 创建开场空白世界();
    return {
        ...openingBase,
        世界: {
            ...currentWorld,
            地图层级: mapLayers.length > 0 ? mapLayers as any : currentWorld.地图层级,
            势力列表: factions.length > 0 ? factions as any : currentWorld.势力列表
        }
    };
};

const 补全传统组织职位 = (source: any, totalContribution = 0, fallback = '无'): string => {
    const customOrganizationKind = 推导组织语义(source);
    const explicitCustomRank = [
        source?.玩家职位,
        source?.弟子等级,
        source?.弟子级别,
        source?.弟子身份,
        source?.身份,
        source?.职位,
        source?.rank,
    ].map((item) => 取文本(item)).find(Boolean);
    if (customOrganizationKind && explicitCustomRank && !标准传统组织职位列表.includes(explicitCustomRank)) {
        return explicitCustomRank;
    }
    let contributionRank = fallback !== '无' || totalContribution > 0 ? '杂役弟子' : '无';
    Object.entries(传统组织职位贡献门槛).forEach(([rank, required]) => {
        if (totalContribution >= required) contributionRank = rank;
    });
    const candidates = [
        source?.玩家职位,
        source?.弟子等级,
        source?.弟子级别,
        source?.弟子身份,
        source?.身份,
        source?.职位,
        source?.rank,
        fallback,
    ].map((item) => 取文本(item)).filter(Boolean);
    const exact = candidates.find((item) => 标准传统组织职位列表.includes(item));
    if (exact) {
        const exactRequired = 传统组织职位贡献门槛[exact] ?? 0;
        if (totalContribution < exactRequired) return contributionRank;
        return (职位等级排序[contributionRank] || 0) > (职位等级排序[exact] || 0) ? contributionRank : exact;
    }
    const matched = candidates
        .map((item) => 标准传统组织职位列表.find((rank) => item.includes(rank)))
        .find(Boolean);
    if (matched) {
        const matchedRequired = 传统组织职位贡献门槛[matched] ?? 0;
        if (totalContribution < matchedRequired) return contributionRank;
        return (职位等级排序[contributionRank] || 0) > (职位等级排序[matched] || 0) ? contributionRank : matched;
    }
    if (fallback !== '无') {
        return (职位等级排序[contributionRank] || 0) > (职位等级排序[fallback] || 0) ? contributionRank : fallback;
    }
    return contributionRank;
};

const 取布尔 = (value: any, fallback = false): boolean => (
    typeof value === 'boolean' ? value : fallback
);

const 取字符串数组 = (value: any): string[] => (
    Array.isArray(value)
        ? value
            .map((item) => 取文本(item))
            .filter(Boolean)
        : []
);

const 无门派文本集合 = new Set(['', 'none', '无', '无门派', '无门无派', '暂无所属组织', '未加入任何组织', '无所属组织', '尚未加入任何门派', '尚未加入任何组织', '江湖散人', '散修', '无所属门派']);

const 是否无组织标识 = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    const normalized = typeof value === 'string' ? value.trim().replace(/\s+/g, '') : String(value).trim();
    return 无门派文本集合.has(normalized);
};

type 组织题材 = '营地' | '组织' | '轮回小队' | '宗门' | '门派' | '';

const 获取开局题材分组 = (openingConfig?: OpeningConfig) => 获取题材模式配置(openingConfig?.题材模式).group;
const 开局题材属于 = (openingConfig: OpeningConfig | undefined, groups: string[]) => groups.includes(获取开局题材分组(openingConfig));
const 是末日题材 = (openingConfig?: OpeningConfig) => 开局题材属于(openingConfig, ['apocalypse']);
const 是无限流题材 = (openingConfig?: OpeningConfig) => 开局题材属于(openingConfig, ['infinite']);
const 是现代组织题材 = (openingConfig?: OpeningConfig) => 开局题材属于(openingConfig, ['modern', 'urban_xianxia']);
const 是西幻题材 = (openingConfig?: OpeningConfig) => 开局题材属于(openingConfig, ['western_fantasy']);
const 是仙侠宗门题材 = (openingConfig?: OpeningConfig) => 开局题材属于(openingConfig, ['xianxia']);
const 开局配置允许生成组织 = (openingConfig?: OpeningConfig): boolean => (
    Boolean(openingConfig) && openingConfig?.配置约束启用 !== false && openingConfig?.开局生成组织 === true
);

const 推导组织语义 = (source?: any, openingConfig?: OpeningConfig): 组织题材 => {
    const explicit = 取文本(source?.组织语义 || source?.组织类型 || source?.题材组织类型 || source?.类型 || source?.organizationKind);
    if (['营地', '组织', '轮回小队', '宗门', '门派'].includes(explicit)) return explicit as 组织题材;
    const runtimeProfile = openingConfig?.modeRuntimeProfile;
    const runtimeOrganizationName = 取文本(runtimeProfile?.organization?.organizationName);
    if (/轮回|主神|队伍房间|团战小队/u.test(runtimeOrganizationName)) return '轮回小队';
    if (runtimeProfile?.identity?.baseMode === '无限流' || runtimeProfile?.identity?.modeId === '无限流') return '轮回小队';
    if (runtimeProfile?.identity?.isApocalypse) return '营地';
    if (/营地|避难|安全区|车队|哨站|幸存/u.test(runtimeOrganizationName)) return '营地';
    if (/宗门|仙宗|道院|灵门|玄府|真宫/u.test(runtimeOrganizationName)) return '宗门';
    if (runtimeOrganizationName && runtimeOrganizationName !== '门派') return '组织';
    if (是无限流题材(openingConfig)) return '轮回小队';
    if (是末日题材(openingConfig)) return '营地';
    if (是现代组织题材(openingConfig) || 是西幻题材(openingConfig)) return '组织';
    if (是仙侠宗门题材(openingConfig)) return '宗门';
    const text = [
        source?.ID,
        source?.id,
        source?.名称,
        source?.name,
        source?.类型,
        source?.玩家职位,
        source?.简介,
        source?.描述,
        ...(Array.isArray(source?.组织规则) ? source.组织规则 : []),
        ...(Array.isArray(source?.兑换列表) ? source.兑换列表.map((item: any) => `${item?.物品名称 || ''}${item?.类型 || ''}${item?.要求职位 || ''}`) : []),
        ...(Array.isArray(source?.商城) ? source.商城.map((item: any) => `${item?.名称 || ''}${item?.物品名称 || ''}${item?.类型 || ''}${item?.描述 || ''}`) : []),
        ...(Array.isArray(source?.资料库列表) ? source.资料库列表.map((item: any) => `${item?.名称 || ''}${item?.类型 || ''}${item?.简介 || ''}${item?.要求职位 || ''}`) : []),
        ...(Array.isArray(source?.能力库) ? source.能力库.map((item: any) => `${item?.名称 || ''}${item?.类型 || ''}${item?.描述 || ''}`) : []),
        ...(Array.isArray(source?.重要成员) ? source.重要成员.map((item: any) => `${item?.身份 || ''}${item?.境界 || ''}${item?.简介 || ''}`) : []),
        ...(Array.isArray(source?.成员列表) ? source.成员列表.map((item: any) => `${item?.身份 || ''}${item?.境界 || ''}${item?.简介 || ''}`) : [])
    ].map((item) => 取文本(item)).filter(Boolean).join(' ');
    if (/主神|轮回|奖励点|支线剧情|基因锁|队伍房间|主神空间|恐怖片|团战|兑换强化|轮回者/u.test(text)) return '轮回小队';
    if (/末日|丧尸|感染|尸群|营地|避难|安全点|据点|车队|哨站|救援站|搜救|巡逻|后勤|弹药|口粮|净水|燃油|维修|隔离/u.test(text)) return '营地';
    if (/现代|都市|公司|项目组|事务所|社区中心|门店|合作团队|合同|客户|技术成员|行政联系人|外勤成员|电脑|手机|培训|项目/u.test(text)) return '组织';
    if (/仙宗|剑宗|道院|灵门|玄府|真宫|炼气|筑基|灵根|灵力|符箓|御气/u.test(text)) return '宗门';
    return '';
};

const 规范化章节时间校准 = (value: any): 剧情系统结构['章节时间校准'] => (
    Array.isArray(value)
        ? value
            .map((item: any) => ({
                关联分解组: Math.max(1, 取数字(item?.关联分解组, 1)),
                原始起始时间: 取文本(item?.原始起始时间),
                校准后起始时间: 取文本(item?.校准后起始时间),
                校准来源时间: 取文本(item?.校准来源时间)
            }))
            .filter((item) => item.原始起始时间 || item.校准后起始时间)
        : []
);

const 取数字数组 = (value: any): number[] => (
    Array.isArray(value)
        ? value
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item))
        : []
);

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 创建开场空白角色 = (): 角色数据结构 => ({
    姓名: '',
    头像图片URL: '',
    性别: '男',
    年龄: 16,
    出生日期: '',
    外貌: '',
    性格: '',
    称号: '',
    天赋列表: [],
    出身背景: { 名称: '', 描述: '', 效果: '' },
    金钱: 确保角色金钱BaseAmount({ baseAmount: 0 }),
    当前精力: 0,
    最大精力: 0,
    当前饱腹: 0,
    最大饱腹: 0,
    当前口渴: 0,
    最大口渴: 0,
    当前负重: 0,
    最大负重: 0,
    当前坐标X: 0,
    当前坐标Y: 0,
    力量: 0,
    敏捷: 0,
    体质: 0,
    根骨: 0,
    悟性: 0,
    福源: 0,
    头部当前血量: 0,
    头部最大血量: 0,
    头部状态: '',
    胸部当前血量: 0,
    胸部最大血量: 0,
    胸部状态: '',
    腹部当前血量: 0,
    腹部最大血量: 0,
    腹部状态: '',
    左手当前血量: 0,
    左手最大血量: 0,
    左手状态: '',
    右手当前血量: 0,
    右手最大血量: 0,
    右手状态: '',
    左腿当前血量: 0,
    左腿最大血量: 0,
    左腿状态: '',
    右腿当前血量: 0,
    右腿最大血量: 0,
    右腿状态: '',
    装备: {
        头部: '无',
        胸部: '无',
        盔甲: '无',
        内衬: '无',
        腿部: '无',
        手部: '无',
        足部: '无',
        主武器: '无',
        副武器: '无',
        暗器: '无',
        背部: '无',
        腰部: '无',
        坐骑: '无'
    },
    物品列表: [],
    技艺: 构建默认技艺(),
    当前经验: 0,
    升级经验: 0,
    玩家BUFF: [],
    突破条件: []
});

export const 创建空组织状态 = (): 玩家组织结构 => ({
    ID: 'none',
    名称: '暂无所属组织',
    简介: '尚未加入任何组织。',
    组织规则: [],
    组织资金: 0,
    组织物资: 0,
    建设度: 0,
    组织等级: '无',
    组织规模: '无',
    成员总数: 0,
    能力分布: {},
    财富评级: '无',
    津贴规则: {
        基础俸禄: 0,
        贡献系数: 0,
        规模系数: 0,
        发放说明: '未加入任何组织时没有固定津贴。'
    },
    上次津贴月份: '',
    玩家职位: '无',
    玩家贡献: 0,
    累计贡献: 0,
    任务列表: [],
    兑换列表: [],
    资料库列表: [],
    重要成员: []
});

export const 同步角色与组织状态 = <T extends { 角色?: any; 玩家组织?: any }>(state: T): T => {
    const role = state?.角色 && typeof state.角色 === 'object' ? state.角色 : undefined;
    const organization = 规范化组织状态(state?.玩家组织);

    if (!role) {
        return {
            ...state,
            玩家组织: organization
        };
    }

    if (是否无组织标识(organization.ID)) {
        return {
            ...state,
            玩家组织: organization,
            角色: { ...role }
        };
    }

    return {
        ...state,
        玩家组织: organization,
        角色: { ...role }
    };
};

const 创建开局主线任务 = (sect: 玩家组织结构, openingConfig?: OpeningConfig): 任务结构 => {
    const topic = openingConfig?.题材模式;
    const organizationName = 是否无组织标识(sect?.ID) ? '' : 取文本(sect?.名称);
    const publisher = topic === '无限流' ? '主神光球' : (organizationName || (topic === '末日丧尸' ? '求生本能' : topic === '现代都市' ? '现实处境' : '江湖因缘'));
    const location = topic === '无限流' ? '主神空间' : (organizationName || (topic === '末日丧尸' ? '临时落脚点' : topic === '现代都市' ? '当前城市' : '当前落脚处'));
    if (topic === '无限流') {
        return {
            标题: '主神任务倒计时',
            描述: `${publisher}的光球在头顶闪烁，屏幕上跳出本轮任务的标题、存活时限和失败惩罚。主角必须在倒计时归零前弄清楚：任务目标到底是什么、当前环境中最致命的威胁在哪里、队友各自擅长什么、以及如果局势失控该往哪撤。`,
            类型: '主线',
            发布人: publisher,
            发布地点: location,
            任务世界: '当前任务世界',
            推荐境界: '新人轮回者',
            当前状态: '进行中',
            目标列表: [{
                描述: '从主神光球或任务腕表上读到本轮任务的标题、存活时限和失败惩罚。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }, {
                描述: '确认当前任务世界中最直接的一项致命威胁（怪物、陷阱、环境或敌对轮回者）。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }, {
                描述: '摸清至少一名队友的战斗特长或可用技能，以及一条可撤退的路线或安全点。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }],
            奖励描述: ['主神结算奖励（按完成度判定）'],
            剧情暗线: '主线：任务必须围绕当前任务世界的生存威胁推进。没有正文证据时不得额外生成支线、隐藏奖励或团队日常任务。'
        };
    }
    if (topic === '末日丧尸') {
        return {
            标题: '守住第一夜',
            描述: `${publisher}的第一晚还不稳，主角需要确认水源、药品、哨位和撤离路线，先把能活到天亮的基础秩序立起来。`,
            类型: '主线',
            发布人: publisher,
            发布地点: location,
            推荐境界: '新手求生',
            当前状态: '进行中',
            目标列表: [{
                描述: '确认一处可用水源、一份基础急救物资和夜间警戒安排。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }],
            奖励描述: ['组织信用 +80', '急救熟练度 +8', '可分配属性点 +1'],
            剧情暗线: '主线：第一夜奖励必须由营地值班者、队友或主角亲自确认；若奖励涉及物品，必须由AI在变量命令中明确写入背包，本地代码不会生成物品。'
        };
    }
    if (topic === '现代都市') {
        return {
            标题: '把眼前的麻烦理清楚',
            描述: `${publisher}并不急着把主角推入宏大组织，而是先把住处、学校、工作点、家庭账单或人情约定里最紧迫的一件事摆到台前。主角需要确认压力来源、找到可行动地点或联系人，并留住至少一项可用资源。`,
            类型: '主线',
            发布人: publisher,
            发布地点: location,
            推荐境界: '现实起步',
            当前状态: '进行中',
            目标列表: [{
                描述: '确认当前最紧迫的现实压力来自哪里（住处、学校、工作点、家庭账单或人情约定），并记录一个明确期限。',
                当前进度: 0,
                总需进度: 2,
                完成状态: false
            }, {
                描述: '找到至少一处可行动地点或一名可联系对象，弄清对方能提供的帮助、阻力或信息。',
                当前进度: 0,
                总需进度: 2,
                完成状态: false
            }, {
                描述: '在时间、金钱、资料或关系中锁定一项可用资源，为下一步选择留下余地。',
                当前进度: 0,
                总需进度: 1,
                完成状态: false
            }],
            奖励描述: ['后续机会（按剧情判定）'],
            剧情暗线: '主线：第一轮只要求现实压力、地点/联系人和可用资源三类锚点成立；不得强制空降公司、学校、社团或固定管理者来确认成果。若奖励涉及物品或金钱，必须由AI在变量命令中明确写入，本地代码不会生成物品。'
        };
    }
    return {
        标题: '初入江湖',
        描述: `${publisher}交到眼前的第一件事并不惊天动地，却足以让主角开始在江湖里留下自己的脚印。`,
        类型: '主线',
        发布人: publisher,
        发布地点: location,
        推荐境界: '初入江湖',
        当前状态: '进行中',
        目标列表: [{
            描述: '完成一次眼前差遣、拜访或小规模历练。',
            当前进度: 0,
            总需进度: 1,
            完成状态: false
        }],
        奖励描述: ['组织贡献 +70', '医术熟练度 +6', '可分配属性点 +1'],
        剧情暗线: '主线：完成后要由发布人或见证者确认成果；若奖励涉及物品，必须由AI在变量命令中明确写入背包，本地代码不会生成物品。'
    };
};

const 创建默认兑换列表 = (sectName = '本门', openingConfig?: OpeningConfig): 玩家组织结构['兑换列表'] => {
    const seed = 生成稳定哈希(`${sectName}|${openingConfig?.题材模式 || ''}|exchange`);
    if (是无限流题材(openingConfig)) {
        return [
            { id: `infinite_shop_${生成稳定哈希(`${sectName}|hemostatic`).toString(36)}`, 物品名称: '止血喷雾', 类型: '医疗补给', 兑换价格: 30, 库存: 4 + (seed % 3), 要求职位: '新人' },
            { id: `infinite_shop_${生成稳定哈希(`${sectName}|flashlight`).toString(36)}`, 物品名称: '战术手电', 类型: '工具', 兑换价格: 45, 库存: 2 + (seed % 2), 要求职位: '新人' },
            { id: `infinite_shop_${生成稳定哈希(`${sectName}|vest`).toString(36)}`, 物品名称: '轻型防护背心', 类型: '上衣', 兑换价格: 120, 库存: 2, 要求职位: '正式队员' },
            { id: `infinite_shop_${生成稳定哈希(`${sectName}|stabilizer`).toString(36)}`, 物品名称: '精神稳定剂', 类型: '精神补给', 兑换价格: 180, 库存: 1 + (seed % 2), 要求职位: '资深者' }
        ] as any;
    }
    if (是末日题材(openingConfig)) {
        return [
            { id: `camp_shop_${生成稳定哈希(`${sectName}|water`).toString(36)}`, 物品名称: '净水片', 类型: '生存物资', 兑换价格: 25, 库存: 8, 要求职位: '营地成员' },
            { id: `camp_shop_${生成稳定哈希(`${sectName}|firstaid`).toString(36)}`, 物品名称: '基础急救包', 类型: '医疗物资', 兑换价格: 60, 库存: 3, 要求职位: '营地成员' },
            { id: `camp_shop_${生成稳定哈希(`${sectName}|toolkit`).toString(36)}`, 物品名称: '维修工具包', 类型: '工具', 兑换价格: 120, 库存: 2, 要求职位: '营地骨干' }
        ] as any;
    }
    if (是现代组织题材(openingConfig) || 是西幻题材(openingConfig)) {
        return [
            { id: `org_shop_${生成稳定哈希(`${sectName}|kit`).toString(36)}`, 物品名称: '外勤工具包', 类型: '工具', 兑换价格: 45, 库存: 4, 要求职位: '成员' },
            { id: `org_shop_${生成稳定哈希(`${sectName}|medical`).toString(36)}`, 物品名称: '便携急救包', 类型: '补给', 兑换价格: 60, 库存: 3, 要求职位: '成员' },
            { id: `org_shop_${生成稳定哈希(`${sectName}|access`).toString(36)}`, 物品名称: '资料调阅权限', 类型: '权限', 兑换价格: 140, 库存: 2, 要求职位: '专业骨干' }
        ] as any;
    }
    if (是仙侠宗门题材(openingConfig)) {
        return [
            { id: `xianxia_shop_${生成稳定哈希(`${sectName}|dan`).toString(36)}`, 物品名称: '回气丹', 类型: '丹药', 兑换价格: 45, 库存: 5, 要求职位: '杂役弟子' },
            { id: `xianxia_shop_${生成稳定哈希(`${sectName}|paper`).toString(36)}`, 物品名称: '符纸一沓', 类型: '材料', 兑换价格: 35, 库存: 6, 要求职位: '杂役弟子' },
            { id: `xianxia_shop_${生成稳定哈希(`${sectName}|jade`).toString(36)}`, 物品名称: '聚灵玉佩', 类型: '饰品', 兑换价格: 180, 库存: 1, 要求职位: '外门弟子' }
        ] as any;
    }
    return [
        { id: `sect_shop_${生成稳定哈希(`${sectName}|medicine`).toString(36)}`, 物品名称: '金疮药', 类型: '丹药', 兑换价格: 30, 库存: 6, 要求职位: '杂役弟子' },
        { id: `sect_shop_${生成稳定哈希(`${sectName}|guard`).toString(36)}`, 物品名称: '软皮护腕', 类型: '防具', 兑换价格: 80, 库存: 3, 要求职位: '杂役弟子' },
        { id: `sect_shop_${生成稳定哈希(`${sectName}|manual`).toString(36)}`, 物品名称: `${提取组织资料前缀(sectName)}入门手札`, 类型: '武学', 兑换价格: 150, 库存: 2, 要求职位: '外门弟子' }
    ];
};

const 规范化兑换列表 = (items: any[], fallbackName: string, openingConfig?: OpeningConfig): 玩家组织结构['兑换列表'] => {
    const normalized = (Array.isArray(items) ? items : [])
        .map((item: any, index: number) => ({
            id: 取文本(item?.id || item?.ID, `exchange_${生成稳定哈希(`${fallbackName}|${index}|${item?.物品名称 || item?.名称 || ''}`).toString(36)}`),
            物品名称: 取文本(item?.物品名称 || item?.名称 || item?.title),
            类型: 取文本(item?.类型 || item?.分类 || item?.category, '物品'),
            兑换价格: Math.max(1, 取数字(item?.兑换价格 ?? item?.价格 ?? item?.消耗 ?? item?.兑换额度, 30)),
            库存: Math.max(0, 取数字(item?.库存 ?? item?.数量 ?? item?.stock, 1)),
            要求职位: 取文本(item?.要求职位 || item?.要求身份 || item?.门槛, 是无限流题材(openingConfig) ? '新人' : 是末日题材(openingConfig) ? '营地成员' : 是现代组织题材(openingConfig) || 是西幻题材(openingConfig) ? '成员' : '杂役弟子')
        }))
        .filter((item) => item.物品名称 && !含幕后生成占位文本(item.物品名称));
    return normalized.length > 0 ? normalized : 创建默认兑换列表(fallbackName, openingConfig);
};

const 提取组织资料前缀 = (sectName: string): string => {
    const compact = 取文本(sectName, '本门').replace(/(山庄|剑派|武馆|仙宗|剑宗|道院|灵门|玄府|真宫|宗|派|门|帮|堂|堡|庄|院|府)$/u, '');
    return compact || 取文本(sectName, '本门');
};

const 创建默认资料库列表 = (sectName = '本门', openingConfig?: OpeningConfig): NonNullable<玩家组织结构['资料库列表']> => {
    const seed = 生成稳定哈希(`${sectName}|${openingConfig?.题材模式 || ''}|藏经阁`);
    const prefix = 提取组织资料前缀(sectName);
    if (是末日题材(openingConfig)) {
        return [
            {
                id: `camp_doc_${生成稳定哈希(`${sectName}|infection`).toString(36)}`,
                名称: '感染防护手册',
                类型: '防护训练',
                品阶: '基础',
                简介: `${sectName}整理的隔离、咬伤处理、血污清理和噪音控制流程，适合新成员先读。`,
                要求职位: '营地成员',
                要求累计贡献: 0
            },
            {
                id: `camp_doc_${生成稳定哈希(`${sectName}|shooting`).toString(36)}`,
                名称: '基础枪械演练',
                类型: '射击训练',
                品阶: '进阶',
                简介: `${sectName}用于教授持枪姿势、短点射、换弹、枪声管控和弹药节约的演练资料。`,
                要求职位: '外勤成员',
                要求累计贡献: 120
            },
            {
                id: `camp_doc_${生成稳定哈希(`${sectName}|rescue`).toString(36)}`,
                名称: '搜救路线课',
                类型: '搜救训练',
                品阶: '进阶',
                简介: `${sectName}标注安全屋、物资点、尸群绕行线和撤离信号，供一线搜救队复盘使用。`,
                要求职位: '搜救队员',
                要求累计贡献: 260
            }
        ] as any;
    }
    if (是无限流题材(openingConfig)) {
        return [
            {
                id: `infinite_ability_${生成稳定哈希(`${sectName}|psychic_scan`).toString(36)}`,
                名称: '精神力扫描',
                类型: '精神能力',
                品阶: '基础',
                简介: `${sectName}用于感知附近生命反应、敌意波动和异常剧情节点的入门精神力能力，适合新人先建立任务警戒。`,
                要求职位: '新人',
                要求累计贡献: 0
            },
            {
                id: `infinite_ability_${生成稳定哈希(`${sectName}|telekinesis`).toString(36)}`,
                名称: '念动力牵引',
                类型: '超能力',
                品阶: '进阶',
                简介: `${sectName}以精神负荷牵引轻型物体、干扰敌方动作或在恐怖片场景中触发远程机关的基础超能力。`,
                要求职位: '正式队员',
                要求累计贡献: 120
            },
            {
                id: `infinite_ability_${生成稳定哈希(`${sectName}|firearm_module`).toString(36)}`,
                名称: '枪械速成模块',
                类型: '战斗模块',
                品阶: '进阶',
                简介: `${sectName}将持枪姿势、快速换弹、近距离点射和低噪声行动压缩成可在任务世界实战调用的战斗模块。`,
                要求职位: '资深者',
                要求累计贡献: 260
            },
            {
                id: `infinite_ability_${生成稳定哈希(`${sectName}|gene_lock`).toString(36)}`,
                名称: '基因锁一阶应激',
                类型: '血统强化',
                品阶: '上品',
                简介: `${sectName}记录濒死压力下短暂突破反应速度、疼痛耐受和战场判断的高风险强化方向。`,
                要求职位: '资深者',
                要求累计贡献: 520
            }
        ] as any;
    }
    if (是现代组织题材(openingConfig) || 是西幻题材(openingConfig)) {
        return [
            {
                id: `org_doc_${生成稳定哈希(`${sectName}|coordination`).toString(36)}`,
                名称: '现场协调手册',
                类型: '培训资料',
                品阶: '基础',
                简介: `${sectName}沉淀的沟通、记录、排期和风险报备方法，帮助成员把现实事务办稳。`,
                要求职位: '成员',
                要求累计贡献: 0
            },
            {
                id: `org_doc_${生成稳定哈希(`${sectName}|tech`).toString(36)}`,
                名称: '设备维护课',
                类型: '技能培训',
                品阶: '进阶',
                简介: `${sectName}用于教授电脑、手机、监控和常用设备排障的内部培训资料。`,
                要求职位: '技术成员',
                要求累计贡献: 120
            },
            {
                id: `org_doc_${生成稳定哈希(`${sectName}|field`).toString(36)}`,
                名称: '外勤应急指南',
                类型: '外勤训练',
                品阶: '进阶',
                简介: `${sectName}整理的路线规划、现场沟通、急救和突发事件留证流程。`,
                要求职位: '外勤成员',
                要求累计贡献: 260
            }
        ] as any;
    }
    const martialStyle = 按种子取项(
        ['剑诀', '玄功', '御气诀', '灵息诀', '符剑诀', '剑法', '刀法', '拳谱', '掌法', '枪诀', '腿法'],
        seed
    );
    const innerStyle = 按种子取项(
        ['凝真心法', '归元诀', '清虚吐纳篇', '抱朴灵息法', '养息功', '归元心法', '听风内功', '沉炉劲'],
        seed,
        7
    );
    const movementStyle = 按种子取项(
        ['流云步', '踏星步', '御风身法', '轻烟遁法', '轻身步', '掠影步', '燕回身法', '穿林步'],
        seed,
        13
    );
    return [
        {
            id: `sect_lib_${生成稳定哈希(`${sectName}|entry`).toString(36)}`,
            名称: `${prefix}入门${martialStyle}`,
            类型: martialStyle.includes('步') || martialStyle.includes('身') ? '身法' : '能力',
            品阶: '凡品',
            简介: `${sectName}给新进弟子打基础的入门典籍，招路贴合本门传承，不再沿用固定青云模板。`,
            要求职位: '杂役弟子',
            要求累计贡献: 0
        },
        {
            id: `sect_lib_${生成稳定哈希(`${sectName}|inner`).toString(36)}`,
            名称: `${prefix}${innerStyle}`,
            类型: '心法',
            品阶: '良品',
            简介: `${sectName}藏经阁常见的内修法门，用来稳住气息与根基。`,
            要求职位: '外门弟子',
            要求累计贡献: 120
        },
        {
            id: `sect_lib_${生成稳定哈希(`${sectName}|movement`).toString(36)}`,
            名称: `${prefix}${movementStyle}`,
            类型: '身法',
            品阶: '良品',
            简介: `${sectName}弟子外出行走时常修的身法，重在趋避、追击与赶路。`,
            要求职位: '外门弟子',
            要求累计贡献: 260
        }
    ];
};

const 无限流违和能力词 = /剑法|刀法|拳谱|残卷|吐纳|内力|真经|宗门|门派|藏经阁|灵石|修仙|炼气|筑基|江湖|武学/u;

const 资料库条目转无限流能力 = (entry: any, organizationName: string) => {
    const name = 取文本(entry?.名称, '团队基础能力');
    const rawType = `${取文本(entry?.类型)} ${name}`;
    const type = /精神|扫描|念动力|超能力/u.test(rawType)
        ? '术法'
        : /血统|基因锁/u.test(rawType)
            ? '神通'
            : /枪械|战斗|格斗|模块/u.test(rawType)
                ? '招式'
                : '被动';
    const quality = ({ 基础: '凡品', 进阶: '良品', 上品: '上品', 极品: '极品' } as Record<string, string>)[取文本(entry?.品阶)] || '凡品';
    return {
        ID: `opening_${取文本(entry?.id, name)}`,
        来源藏经ID: 取文本(entry?.id),
        名称: name,
        描述: 取文本(entry?.简介, '团队能力库记录的基础能力。'),
        类型: type,
        品质: quality,
        来源: `${organizationName || '轮回小队'}能力库`,
        当前重数: 1,
        最高重数: 8,
        当前熟练度: 0,
        升级经验: 100,
        突破条件: '通过任务世界实战、兑换训练或极限压力触发提升',
        境界限制: 取文本(entry?.要求职位, '新人可解锁'),
        大成方向: '在任务世界中形成稳定可控的高阶运用',
        圆满效果: `${name}满级后可提高任务世界中的生存、侦查或协作表现。`,
        武器限制: [],
        消耗类型: /精神|扫描|念动力/u.test(rawType) ? '精神力' : '精力',
        消耗数值: 0,
        施展耗时: '即时',
        冷却时间: '按场景',
        基础伤害: /枪械|格斗|战斗|念动力/u.test(rawType) ? 8 : 0,
        加成属性: /精神|扫描|念动力/u.test(rawType) ? '悟性' : /基因锁|体能|格斗/u.test(rawType) ? '根骨' : '敏捷',
        加成系数: /枪械|念动力|基因锁|格斗/u.test(rawType) ? 0.35 : 0.15,
        内力系数: 0,
        伤害类型: /精神|念动力/u.test(rawType) ? '真实' : /枪械|格斗|战斗/u.test(rawType) ? '物理' : '混合',
        目标类型: /扫描|感知/u.test(rawType) ? '全体' : '自身',
        最大目标数: /扫描|感知/u.test(rawType) ? 6 : 1,
        重数描述映射: [{ 重数: 1, 描述: 取文本(entry?.简介, '完成基础解锁，能在任务世界中低负荷调用。') }],
        附带效果: [],
        被动修正: [],
        境界特效: []
    };
};

const 清洗无限流开局能力 = (charData: 角色数据结构, organization: 玩家组织结构, openingConfig?: OpeningConfig): 角色数据结构 => {
    const isInfinite = 是无限流题材(openingConfig) || 推导组织语义(organization) === '轮回小队';
    if (!isInfinite) return charData;
    const current = Array.isArray((charData as any)?.能力列表) ? 深拷贝((charData as any).能力列表) : [];
    const cleaned = current.filter((skill: any) => !无限流违和能力词.test([
        skill?.名称,
        skill?.描述,
        skill?.类型,
        skill?.来源,
        skill?.消耗类型,
        skill?.圆满效果
    ].map((value) => 取文本(value)).join(' ')));
    if (cleaned.length > 0) return { ...charData, 能力列表: cleaned } as 角色数据结构;
    const fallback = Array.isArray(organization?.资料库列表) ? organization.资料库列表[0] : undefined;
    return {
        ...charData,
        能力列表: fallback ? [资料库条目转无限流能力(fallback, 取文本(organization?.名称))] : []
    } as 角色数据结构;
};

const 补齐组织重要成员 = (sourceMembers: unknown): 玩家组织结构['重要成员'] => {
    if (!Array.isArray(sourceMembers)) return [];
    const usedIds = new Set<string>();
    const usedNames = new Set<string>();
    const members = sourceMembers
        .filter((item) => item && typeof item === 'object')
        .filter((item: any) => {
            const memberId = 取文本(item?.id);
            const memberName = 取文本(item?.姓名);
            const isPlayer = item?.是否玩家本人 === true;
            const nameKey = isPlayer ? `player:${memberName}` : memberName;
            if (memberId && usedIds.has(memberId)) return false;
            if (memberId) usedIds.add(memberId);
            if (nameKey && usedNames.has(nameKey)) return false;
            if (nameKey) usedNames.add(nameKey);
            return true;
        });
    return members as 玩家组织结构['重要成员'];
};

const 创建玩家组织成员简报 = (
    charData: 角色数据结构,
    sectName: string,
    playerRank: string,
    openingConfig?: OpeningConfig
): 玩家组织结构['重要成员'][number] | null => {
    const name = 取文本(charData?.姓名);
    if (!name) return null;
    const isApocalypse = 是末日题材(openingConfig);
    const isInfinite = 是无限流题材(openingConfig);
    const isModern = 是现代组织题材(openingConfig) || 是西幻题材(openingConfig);
    const gender = 取文本((charData as any)?.性别) === '女' ? '女' : '男';
    const age = 取数字((charData as any)?.年龄, 18);
    const realm = 取文本((charData as any)?.境界, isInfinite ? '新人轮回者' : isApocalypse ? '幸存者' : isModern ? '普通成员' : '初境');
    const identity = 取文本(playerRank, isInfinite ? '新人' : isApocalypse ? '营地成员' : isModern ? '成员' : '外门弟子');
    return {
        id: `organization_member_player_${生成稳定哈希(`${sectName}|${name}|player`).toString(36)}`,
        姓名: name,
        性别: gender as any,
        年龄: age,
        境界: realm,
        身份: identity,
        是否玩家本人: true,
        简介: isInfinite
            ? `${sectName}当前轮回者成员，也是玩家本人。`
            : isApocalypse
                ? `${sectName}当前营地成员，也是玩家本人。`
                : isModern
                    ? `${sectName}当前组织成员，也是玩家本人。`
                    : `${sectName}当前门派成员，也是玩家本人。`
    };
};

const 合并玩家到重要成员 = (
    members: 玩家组织结构['重要成员'],
    playerMember: 玩家组织结构['重要成员'][number] | null
): 玩家组织结构['重要成员'] => {
    if (!playerMember) return members;
    const playerNameKey = playerMember.姓名.trim();
    const existingIndex = members.findIndex((item: any) => (
        String(item?.id || '').trim() === playerMember.id
        || (playerNameKey && String(item?.姓名 || '').trim() === playerNameKey)
    ));
    if (existingIndex >= 0) {
        const next = [...members];
        next[existingIndex] = { ...next[existingIndex], ...playerMember, 简介: next[existingIndex]?.简介 || playerMember.简介 };
        return next;
    }
    return [playerMember, ...members];
};

const 生成开局组织名称 = (charData: 角色数据结构, openingConfig?: OpeningConfig): string => {
    const seed = 生成稳定哈希([
        取文本(charData?.姓名),
        取文本((charData as any)?.出身背景?.名称),
        取文本(openingConfig?.初始关系模板),
        取文本(openingConfig?.开局切入偏好),
        (openingConfig?.关系侧重 || []).join('|'),
        取文本(openingConfig?.题材模式)
    ].join('|'));
    const isApocalypse = 是末日题材(openingConfig);
    const isInfinite = 是无限流题材(openingConfig);
    const isModern = 是现代组织题材(openingConfig);
    const isFantasy = 是西幻题材(openingConfig);
    const isXianxia = 是仙侠宗门题材(openingConfig);
    const prefix = isApocalypse
        ? ['曙光', '北桥', '南仓', '临江', '铁栅', '白塔', '灰港', '星火']
        : isInfinite
            ? ['中洲', '北冰', '南炎', '灰烬', '天启', '白塔', '赤环', '零号']
        : isModern
            ? ['青橙', '远行', '明德', '星河', '安桥', '启明', '合众', '南城']
            : isFantasy
                ? ['银冠', '白鹿', '烛塔', '铁蔷', '星坠', '灰鹰', '金榭', '晨钟']
                : isXianxia
                    ? ['青崖', '玄衡', '云岫', '烬霞', '澄霄', '归藏', '天炉', '寒照']
                    : ['折柳', '玄墨', '听潮', '照影', '归雁', '松风', '问剑', '长鲸'];
    const suffix = isApocalypse
        ? ['营地', '避难所', '车队', '安全点', '哨站', '救援站']
        : isInfinite
            ? ['轮回小队', '主神小队', '队伍房间', '团战小队', '临时同盟']
        : isModern
            ? ['公司', '项目组', '事务所', '社区中心', '门店', '合作团队']
            : isFantasy
                ? ['公会', '骑士团', '佣兵团', '魔法学院', '教会', '商会']
                : isXianxia
                    ? ['仙宗', '剑宗', '道院', '灵门', '玄府', '真宫']
                    : ['山庄', '门', '帮', '武馆', '剑派', '堂'];
    return `${按种子取项(prefix, seed)}${按种子取项(suffix, seed, 11)}`;
};

const 按性别比例取性别 = (ratio: string | { 男: number; 女: number; 男娘: number; 扶她: number } | undefined, seed: number, index: number): string => {
    if (ratio && typeof ratio === 'object') {
        const total = ratio.男 + ratio.女 + ratio.男娘 + ratio.扶她;
        if (total <= 0) return '男';
        const pool: string[] = [];
        if (ratio.男 > 0) pool.push(...Array(Math.max(1, Math.round(ratio.男 / total * 20))).fill('男'));
        if (ratio.女 > 0) pool.push(...Array(Math.max(1, Math.round(ratio.女 / total * 20))).fill('女'));
        if (ratio.男娘 > 0) pool.push(...Array(Math.max(1, Math.round(ratio.男娘 / total * 20))).fill('男娘'));
        if (ratio.扶她 > 0) pool.push(...Array(Math.max(1, Math.round(ratio.扶她 / total * 20))).fill('扶她'));
        return 按种子取项(pool, seed, index * 3 + 1);
    }
    if (typeof ratio === 'string' && ratio.includes(':')) {
        const parts = ratio.split(':');
        const maleCount = parseInt(parts[0], 10) || 1;
        const femaleCount = parseInt(parts[1], 10) || 1;
        const pool = [...Array(maleCount).fill('男'), ...Array(femaleCount).fill('女')];
        return 按种子取项(pool, seed, index * 3 + 1);
    }
    return index % 3 === 1 ? '女' : '男';
};

const 创建默认组织成员名录 = (sectName: string, openingConfig?: OpeningConfig, playerName?: string): 玩家组织结构['重要成员'] => {
    if (openingConfig?.开局生成成员 === false) return [];
    const seed = 生成稳定哈希(`${sectName}|${openingConfig?.题材模式 || ''}|同门`);
    const surnames = ['沈', '顾', '林', '陆', '许', '程', '韩', '苏', '叶', '周', '秦', '赵'];
    const givenNames = ['照临', '清砚', '明棠', '砚舟', '若衡', '怀瑾', '听澜', '云笙', '承岳', '知微', '景行', '映雪'];
    const playerKey = typeof playerName === 'string' ? playerName.trim().replace(/\s+/g, '').toLowerCase() : '';
    const isApocalypse = 是末日题材(openingConfig);
    const isInfinite = 是无限流题材(openingConfig);
    const isModern = 是现代组织题材(openingConfig);
    const isFantasy = 是西幻题材(openingConfig);
    const roles = isApocalypse
        ? ['营地负责人', '物资管理员', '巡逻队员', '医护志愿者', '维修工', '前哨哨兵', '搜救队员', '临时同行者']
        : isInfinite
            ? ['资深轮回者', '火力手', '精神力者', '医疗位', '新人引导者', '兑换规划员', '近战队员', '临时队友']
        : isModern
            ? ['项目负责人', '资深同事', '行政联系人', '技术成员', '外勤成员', '合作伙伴', '社区联络人', '实习成员']
            : isFantasy
                ? ['公会负责人', '资深冒险者', '骑士侍从', '见习法师', '炼金助手', '委托登记员', '佣兵同伴', '教会联络人']
            : ['掌事师叔', '外务执事', '内门师兄', '内门师姐', '外门弟子', '外门弟子', '杂役弟子', '藏经阁值守'];
    const count = isInfinite ? 1 : 6 + (seed % 5);
    const genderRatio = openingConfig?.modeRuntimeProfile?.npc?.genderRatio;
    return Array.from({ length: count }, (_, index) => {
        const name = `${按种子取项(surnames, seed, index * 3)}${按种子取项(givenNames, seed, index * 5 + 1)}`;
        // 兜底1：随机生成的同门若与主角同名，直接跳过，避免主角被当作 NPC 进入社交/门派成员。
        // 兜底2：命中男性/中性模板姓名黑名单（如"林砚舟"）也跳过，避免开局同门反复撞同一批模板名。
        if (playerKey && name.trim().replace(/\s+/g, '').toLowerCase() === playerKey) return null;
        if (候选名命中模板黑名单(name)) return null;
        const identity = 按种子取项(roles, seed, index * 7 + 2);
        const duty = isApocalypse
            ? 按种子取项(['物资清点', '外围巡逻', '伤员照护', '路线侦察', '设备维护', '夜间值守'], seed, index)
            : isInfinite
                ? 按种子取项(['主神任务复盘', '兑换规划', '支线线索记录', '恐怖片情报整理', '武器维护', '新人心理稳定'], seed, index)
            : isModern
                ? 按种子取项(['客户沟通', '现场协调', '资料整理', '技术支持', '外勤跑动', '资源对接'], seed, index)
                : isFantasy
                    ? 按种子取项(['委托登记', '营地补给', '遗迹调查', '魔物警戒', '药剂整理', '路线护送'], seed, index)
                : 按种子取项(['外务传令', '照看新弟子', '巡守山门', '整理典籍', '采办物资', '维持组织规则'], seed, index);
    return {
        id: `organization_member_opening_${生成稳定哈希(`${sectName}|${name}|${index}`).toString(36)}`,
        姓名: name,
        性别: 按性别比例取性别(genderRatio, seed, index),
        年龄: identity.includes('执事') || identity.includes('掌事') ? 34 + (seed + index) % 18 : 16 + (seed + index) % 12,
        境界: '初境',
        身份: identity,
            简介: `${sectName}${identity}，负责${duty}。`
        };
    }).filter(Boolean) as 玩家组织结构['重要成员'];
};

const 题材资料库是否违和 = (items: any[], organizationKind: 组织题材): boolean => {
    if (!Array.isArray(items) || items.length === 0) return false;
    const text = JSON.stringify(items);
    if (organizationKind === '营地') {
        return /藏经阁|能力|心法|身法|剑法|刀法|拳谱|掌法|弟子|宗门|门派|吐纳|丹田|内功|轻功/u.test(text);
    }
    if (organizationKind === '组织') {
        return /藏经阁|能力|心法|身法|剑法|刀法|拳谱|掌法|弟子|宗门|门派|吐纳|丹田|内功|轻功/u.test(text);
    }
    return false;
};

const 创建开局组织种子数据 = (
    charData: 角色数据结构,
    openingConfig?: OpeningConfig
) => {
    const sectName = 生成开局组织名称(charData, openingConfig);
    const seed = 生成稳定哈希(`${sectName}|${取文本(charData?.姓名)}|${取文本((charData as any)?.出身背景?.名称)}`);
    const isXianxia = 是仙侠宗门题材(openingConfig);
    const isApocalypse = 是末日题材(openingConfig);
    const isInfinite = 是无限流题材(openingConfig);
    const isModern = 是现代组织题材(openingConfig);
    const isFantasy = 是西幻题材(openingConfig);
    const total = isInfinite ? 2 + (seed % 3) : 36 + (seed % 185);
    const funds = 1800 + (seed % 9000);
    const material = 420 + (seed % 1800);
    const build = 220 + (seed % 720);
    const ideals = isApocalypse
        ? ['隔离优先，物资登记，结伴行动', '守住净水、药品与撤离路线', '不隐瞒伤情，不制造无谓噪音', '互保夜巡，遇险先救活人']
        : isInfinite
            ? ['任务优先，情报共享，兑换透明', '新人互保，支线谨慎，回归结算不隐瞒', '兑换先活命，团战先保队形', '恐惧可说谎，主神规则不可赌']
        : isModern
            ? ['守约履责，信息透明，互相兜底', '按合同做事，按人情留余地', '问题不过夜，资源要留痕', '把事情办成，也把人照顾到']
            : isXianxia
                ? ['守正炼心，护持一方灵脉', '以剑问道，以戒束身', '扶危济困，斩妖护民', '内修清明，外守山河']
                : isFantasy
                    ? ['守护委托契约，尊重公会誓约', '不欺弱旅，不私吞战利品', '调查优先，撤离有序', '同伴互保，风险明示']
                    : ['扶危济困，守信重义', '以武立身，以义束众', '护商路，平乡难，重同门', '练武不欺弱，行事有担当'];
    return {
        sectName,
        seed,
        total,
        funds,
        material,
        build,
        intro: isApocalypse
            ? `${sectName}${按种子取项(['占据旧商场侧翼', '守着一处净水点', '依托临时车队转移', '靠近封锁线边缘'], seed, 5)}，行动准则是${按种子取项(ideals, seed, 9)}。`
            : isInfinite
                ? `${sectName}${按种子取项(['刚结束上一场恐怖片任务', '在主神空间队伍房间休整', '围绕第一次团战风险重整分工', '正在核对支线剧情和兑换账目'], seed, 5)}，小队准则是${按种子取项(ideals, seed, 9)}。`
            : isModern
                ? `${sectName}${按种子取项(['扎根城市街区', '围绕一个长期项目运转', '由熟人和合作方维系', '近来事务压力上升'], seed, 5)}，行事准则是${按种子取项(ideals, seed, 9)}。`
                : isFantasy
                    ? `${sectName}${按种子取项(['立在边境城镇', '承接王国与民间委托', '靠近旧遗迹道路', '由冒险者互助扩张而来'], seed, 5)}，行事准则是${按种子取项(ideals, seed, 9)}。`
                : `${sectName}${按种子取项(['立于山城要道', '据守旧岭山门', '传承数代', '近年声势渐起'], seed, 5)}，宗旨是${按种子取项(ideals, seed, 9)}。`,
        rules: isApocalypse
            ? ['伤情与感染风险必须登记', 按种子取项(['外出搜刮必须结伴', '夜间噪音严格管控', '药品弹药统一记录'], seed, 13), '路线、哨位和物资点不得私自泄露']
            : isInfinite
                ? ['主神任务情报必须共享', 按种子取项(['兑换权限和支线剧情必须登记', '新人不得单独进入未知剧情点', '兑换强化必须说明风险'], seed, 13), '团战、污染和附身风险不得隐瞒']
            : isModern
                ? ['合作事项必须留痕', 按种子取项(['外勤风险要提前报备', '客户与邻里关系不得私自激化', '资金和资料流向必须清楚'], seed, 13), '成员隐私和关键资料不得外泄']
                : isFantasy
                    ? ['委托收益必须登记', 按种子取项(['遗迹探索不得单独行动', '魔物情报要及时共享', '战利品按契约分配'], seed, 13), '公会声望和通行凭证不得私卖']
                : [
                    '不可同门相残',
                    按种子取项(['任务所得须如实登记', '外出历练须回报见闻', '不得借门派名义欺压百姓'], seed, 13),
                    '藏经阁典籍不得私自外传'
                ],
        organizationKind: isApocalypse ? '营地' : isInfinite ? '轮回小队' : (isModern || isFantasy) ? '组织' : isXianxia ? '宗门' : '门派'
    };
};

const 推导组织规模数据 = (source: any, displayName: string) => {
    const organizationKind = 推导组织语义(source);
    const isApocalypse = organizationKind === '营地';
    const isInfinite = organizationKind === '轮回小队';
    const isModern = organizationKind === '组织';
    const sourceMembers = Array.isArray(source?.重要成员)
        ? source.重要成员
        : Array.isArray(source?.成员列表)
            ? source.成员列表
            : Array.isArray(source?.队员列表)
                ? source.队员列表
                : [];
    const resources = source?.资源 && typeof source.资源 === 'object' && !Array.isArray(source.资源) ? source.资源 : {};
    const rawTotal = 取数字(source?.成员总数 ?? source?.成员总数 ?? source?.门人总数 ?? source?.人数, 0);
    const importantCount = sourceMembers.length;
    const total = isInfinite
        ? Math.max(1, importantCount || (rawTotal > 0 && rawTotal <= 12 ? rawTotal : 0))
        : Math.max(rawTotal, importantCount);
    const funds = 取数字(source?.组织资金 ?? source?.资金 ?? resources?.兑换额度 ?? resources?.资金, isInfinite ? 0 : 1200);
    const material = 取数字(source?.组织物资 ?? source?.物资 ?? resources?.物资, 350);
    const build = 取数字(source?.建设度 ?? source?.建设 ?? resources?.建设, 180);
    const score = total * 2 + Math.floor(funds / 500) + Math.floor(material / 80) + Math.floor(build / 50);
    const rawLevel = 含幕后生成占位文本(source?.组织等级) ? '' : 取文本(source?.组织等级);
    const rawScale = 含幕后生成占位文本(source?.组织规模) ? '' : 取文本(source?.组织规模);
    const rawWealth = 含幕后生成占位文本(source?.财富评级) ? '' : 取文本(source?.财富评级);
    const level = rawLevel
        || (isApocalypse
            ? (score >= 120 ? '大型安全区' : score >= 70 ? '稳定营地' : score >= 35 ? '小型据点' : score >= 12 ? '临时营地' : '求生小队')
            : isInfinite
                ? (total >= 9 ? '精英轮回队' : total >= 5 ? '稳定轮回队' : total >= 3 ? '新人轮回队' : '临时轮回小队')
            : isModern
                ? (score >= 120 ? '成熟组织' : score >= 70 ? '稳定团队' : score >= 35 ? '小型团队' : score >= 12 ? '临时项目组' : '个人协作点')
                : (score >= 120 ? '一流大派' : score >= 70 ? '二流门派' : score >= 35 ? '三流门派' : score >= 12 ? '地方小派' : '草创门派'));
    const scale = rawScale
        || (isApocalypse
            ? (total >= 500 ? '大型安全区' : total >= 120 ? '中型营地' : total >= 30 ? '小型营地' : '临时小队')
            : isInfinite
                ? (total >= 9 ? '大型轮回队' : total >= 5 ? '标准小队' : total >= 3 ? '小型轮回小队' : '双人小队')
            : isModern
                ? (total >= 500 ? '集团级组织' : total >= 120 ? '中型组织' : total >= 30 ? '小型组织' : '小团队')
                : (total >= 500 ? '大宗门' : total >= 120 ? '中型门派' : total >= 30 ? '小型门派' : '草创小门'));
    const wealth = rawWealth
        || (isApocalypse
            ? (funds >= 30000 ? '补给充足' : funds >= 10000 ? '库存稳定' : funds >= 2500 ? '勉强周转' : '严重短缺')
            : isInfinite
                ? (funds >= 30000 ? '额度充足' : funds >= 10000 ? '兑换储备稳定' : funds >= 2500 ? '额度紧张' : '资源见底')
            : isModern
                ? (funds >= 30000 ? '现金流充足' : funds >= 10000 ? '运转稳定' : funds >= 2500 ? '预算有限' : '资金紧张')
                : (funds >= 30000 ? '富甲一方' : funds >= 10000 ? '殷实' : funds >= 2500 ? '尚可' : '拮据'));
    const rawDistribution = source?.能力分布 && typeof source.能力分布 === 'object' && !Array.isArray(source.能力分布)
        ? source.能力分布
        : {};
    const stipend = source?.津贴规则 && typeof source.津贴规则 === 'object' && !Array.isArray(source.津贴规则)
        ? source.津贴规则
        : {};
    return {
        组织等级: level,
        组织规模: scale,
        成员总数: total,
        能力分布: rawDistribution,
        财富评级: wealth,
        津贴规则: {
            基础俸禄: 取数字(stipend?.基础俸禄, level.includes('一流') ? 900 : level.includes('二流') ? 500 : level.includes('三流') ? 260 : 120),
            贡献系数: 取数字(stipend?.贡献系数, 0.08),
            规模系数: 取数字(stipend?.规模系数, total >= 500 ? 1.6 : total >= 120 ? 1.25 : total >= 30 ? 1 : 0.75),
            发放说明: 取文本(stipend?.发放说明, isApocalypse
                ? `${displayName}按贡献、岗位、风险和库存情况分配口粮、药品、弹药、燃油或通行资源。`
                : isInfinite
                    ? `${displayName}按主神任务贡献、支线剧情、队伍分工和回归结算分配元、兑换权限或补给额度。`
                : isModern
                    ? `${displayName}按岗位、贡献、项目预算和合作关系结算工资、补贴、分成或资源支持。`
                    : `${displayName}按月根据职位、累计贡献、贡献等级、组织规模与财富状况发放俸禄。`)
        },
        上次津贴月份: 取文本(source?.上次津贴月份)
    };
};

const 创建开局组织状态 = (
    charData: 角色数据结构,
    openingConfig?: OpeningConfig
): 玩家组织结构 => {
    const shouldCreateOrganization = 开局配置允许生成组织(openingConfig);
    if (!shouldCreateOrganization) return 创建空组织状态();

    const seedData = 创建开局组织种子数据(charData, openingConfig);
    const organizationName = seedData.sectName;
    const contribution = 0;
    const isApocalypse = 是末日题材(openingConfig);
    const isInfinite = 是无限流题材(openingConfig);
    const isModern = 是现代组织题材(openingConfig) || 是西幻题材(openingConfig);
    const playerRank = isApocalypse
        ? '营地成员'
        : isInfinite
            ? '新人'
        : isModern
            ? '成员'
            : '外门弟子';
    const playerMember = 创建玩家组织成员简报(charData, organizationName, playerRank, openingConfig);
    const normalized = 规范化组织状态({
        ID: organizationName,
        名称: organizationName,
        玩家职位: playerRank,
        玩家贡献: contribution,
        累计贡献: contribution,
        简介: seedData.intro,
        组织规则: seedData.rules,
        组织资金: seedData.funds,
        组织物资: seedData.material,
        建设度: seedData.build,
        组织语义: seedData.organizationKind,
        成员总数: seedData.total,
        兑换列表: 创建默认兑换列表(organizationName, openingConfig),
        资料库列表: 创建默认资料库列表(organizationName, openingConfig),
        任务列表: [],
        重要成员: 合并玩家到重要成员(创建默认组织成员名录(organizationName, openingConfig, charData?.姓名), playerMember)
    });
    return normalized;
};

export const 规范化组织状态 = (raw?: any): 玩家组织结构 => {
    const base = 创建空组织状态();
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const organizationKind = 推导组织语义(source);
    const isApocalypseOrganization = organizationKind === '营地';
    const isInfiniteOrganization = organizationKind === '轮回小队';
    const isModernOrganization = organizationKind === '组织';
    const sourceId = 取首个已定义值(source, ['ID', 'id', 'Id', '组织ID', '门派ID']);
    const sourceName = 取首个已定义值(source, ['名称', 'name', 'Name', '组织名称', '门派名称']);
    const sourcePlayerRank = 取首个已定义值(source, ['玩家职位', '职位', '身份', 'rank']);
    const id = 取文本(sourceId, base.ID);
    const name = 取文本(sourceName, base.名称);
    const playerRankSource = 取文本(sourcePlayerRank, base.玩家职位);
    const idInactive = sourceId !== undefined && 是否无组织标识(id);
    const nameInactive = sourceName !== undefined && 是否无组织标识(name);
    const playerRankInactive = sourcePlayerRank !== undefined && 是否无组织标识(playerRankSource);
    const hasActiveId = sourceId !== undefined && !是否无组织标识(id);
    const hasActiveName = sourceName !== undefined && !是否无组织标识(name) && name !== base.名称;
    const hasActiveRank = sourcePlayerRank !== undefined && !是否无组织标识(playerRankSource);
    const hasExplicitInactiveMarker = (
        idInactive
        || (nameInactive && !hasActiveId && !hasActiveRank)
        || (playerRankInactive && !hasActiveId && !hasActiveName)
    );
    const hasActiveMarker = hasActiveId || hasActiveName || hasActiveRank;
    const isActiveSect = hasActiveMarker && !hasExplicitInactiveMarker;
    if (!isActiveSect) return base;
    const displayName = isActiveSect && name === base.名称 ? (id === 'none' ? '青云山庄' : id) : name;
    const sourceExchange = Array.isArray(source?.兑换列表)
        ? source.兑换列表
        : Array.isArray(source?.商城)
            ? source.商城
            : Array.isArray(source?.团队商城)
                ? source.团队商城
                : [];
    const sourceLibrary = Array.isArray(source?.资料库列表)
        ? source.资料库列表
        : Array.isArray(source?.能力库)
            ? source.能力库
            : Array.isArray(source?.技能库)
                ? source.技能库
                : [];
    const sourceMembers = Array.isArray(source?.重要成员)
        ? source.重要成员
        : Array.isArray(source?.成员列表)
            ? source.成员列表
            : Array.isArray(source?.队员列表)
                ? source.队员列表
                : [];
    const playerContribution = 取数字(source?.玩家贡献 ?? source?.贡献 ?? source?.兑换额度, base.玩家贡献);
    const totalContribution = Math.max(
        playerContribution,
        取数字(source?.累计贡献 ?? source?.历史贡献 ?? source?.累计生成贡献, playerContribution)
    );
    const playerRank = 补全传统组织职位(source, totalContribution, isActiveSect ? '杂役弟子' : base.玩家职位);
    const scaleData = 推导组织规模数据(source, displayName);
    const defaultLibraryConfig = isApocalypseOrganization
        ? ({ 题材模式: '末日丧尸' } as OpeningConfig)
        : isInfiniteOrganization
            ? ({ 题材模式: '无限流' } as OpeningConfig)
        : isModernOrganization
            ? ({ 题材模式: '现代都市' } as OpeningConfig)
            : undefined;
    const rawLibrary = sourceLibrary;
    const shouldReplaceLibrary = 题材资料库是否违和(rawLibrary, organizationKind);
    const sourceIntro = 取文本(source?.简介 || source?.描述 || source?.intro);
    const safeIntro = sourceIntro && !含幕后生成占位文本(sourceIntro)
        ? sourceIntro
        : isApocalypseOrganization
            ? `${displayName}在灾后维持一处可承接的幸存者关系网，围绕补给、巡逻、救援、隔离和路线选择运转。`
            : isInfiniteOrganization
                ? `${displayName}在主神空间中维持一支轮回者小队，围绕任务情报、支线剧情、兑换强化和回归结算运转。`
            : isModernOrganization
                ? `${displayName}在现代城市中维持一组可承接的现实关系，围绕工作、合作、资源、人情和城市事务运转。`
                : `${displayName}立足一方，门中事务围绕修行、贡献、同门互助与外务历练展开。`;
    const safeRules = Array.isArray(source?.组织规则) && source.组织规则.length > 0
        ? source.组织规则.map((item: any) => 取文本(item)).filter((item: string) => item && !含幕后生成占位文本(item))
        : [];
    const safeTasks = Array.isArray(source?.任务列表)
        ? source.任务列表.filter((item: any) => !含幕后生成占位文本(item?.标题) && !含幕后生成占位文本(item?.描述))
        : [];
    return {
        ID: id,
        名称: displayName,
        组织语义: organizationKind || undefined,
        简介: isActiveSect ? safeIntro : base.简介,
        组织规则: safeRules.length > 0
            ? safeRules
            : (isActiveSect
                ? isApocalypseOrganization
                    ? ['伤情与感染风险必须登记', '外出搜刮必须结伴', '路线、哨位和物资点不得私自泄露']
                    : isInfiniteOrganization
                        ? ['主神任务情报必须共享', '兑换权限和支线剧情必须登记', '团战、污染和附身风险不得隐瞒']
                    : isModernOrganization
                        ? ['合作事项必须留痕', '资金和资料流向必须清楚', '成员隐私和关键资料不得外泄']
                        : ['不可同门相残', '任务所得须如实登记', '藏经阁典籍不得私自外传']
                : []),
        组织资金: 取数字(source?.组织资金 ?? source?.资金 ?? source?.资源?.兑换额度 ?? source?.资源?.资金, isActiveSect ? 1200 : base.组织资金),
        组织物资: 取数字(source?.组织物资 ?? source?.物资 ?? source?.资源?.物资, isActiveSect ? 350 : base.组织物资),
        建设度: 取数字(source?.建设度 ?? source?.建设 ?? source?.资源?.建设, isActiveSect ? 180 : base.建设度),
        ...scaleData,
        玩家职位: playerRank,
        玩家贡献: playerContribution,
        累计贡献: totalContribution,
        任务列表: safeTasks,
        兑换列表: isActiveSect ? 规范化兑换列表(sourceExchange, displayName, defaultLibraryConfig) : [],
        资料库列表: sourceLibrary.length > 0
            ? (shouldReplaceLibrary ? 创建默认资料库列表(displayName, defaultLibraryConfig) : sourceLibrary)
            : (isActiveSect ? 创建默认资料库列表(displayName, defaultLibraryConfig) : []),
        重要成员: isActiveSect ? 补齐组织重要成员(sourceMembers) : []
    };
};

export const 保护开局生成组织状态 = <T extends { 玩家组织?: any; 角色?: any }>(
    nextState: T,
    baseState: { 玩家组织?: any; 角色?: any },
    openingConfig?: OpeningConfig
): T => {
    const baseOrganization = 规范化组织状态(baseState?.玩家组织);
    const nextOrganization = 规范化组织状态(nextState?.玩家组织);
    const shouldKeepGeneratedOrganization = 开局配置允许生成组织(openingConfig)
        && !是否无组织标识(baseOrganization.ID)
        && 是否无组织标识(nextOrganization.ID);
    if (!shouldKeepGeneratedOrganization) return nextState;

    const nextRole = nextState?.角色 && typeof nextState.角色 === 'object'
        ? { ...nextState.角色 }
        : nextState?.角色;

    return {
        ...nextState,
        玩家组织: baseOrganization,
        角色: nextRole
    };
};

export const 创建开场空白环境 = (): 环境信息结构 => ({
    时间: '1:01:01:00:00',
    大地点: '',
    中地点: '',
    小地点: '',
    具体地点: '',
    环境变量: []
});

const 规范化地点归属 = (raw?: any) => ({
    大地点: 取文本(raw?.大地点),
    中地点: 取文本(raw?.中地点),
    小地点: 取文本(raw?.小地点)
});

export const 创建开场空白世界 = (): 世界数据结构 => ({
    活跃NPC列表: [],
    待执行事件: [],
    进行中事件: [],
    已结算事件: [],
    世界镜头规划: [],
    江湖史册: [],
    地图: [],
    建筑: [],
    地图层级: [],
    地图建筑: [],
    地图道路: [],
    地图人物: [],
    势力列表: [],
    势力互动历史: [],
});

export const 规范化世界状态 = (raw?: any): 世界数据结构 => {
    const world = raw && typeof raw === 'object' ? raw : {};
    const normalizedWorld: 世界数据结构 = {
        活跃NPC列表: Array.isArray(world?.活跃NPC列表)
            ? world.活跃NPC列表
                .map((item: any) => ({
                    姓名: 取文本(item?.姓名),
                    所属势力: 取文本(item?.所属势力),
                    当前位置: 取文本(item?.当前位置),
                    位置路径: 取文本(item?.位置路径),
                    当前状态: 取文本(item?.当前状态),
                    当前行动: 取文本(item?.当前行动),
                    行动开始时间: 取文本(item?.行动开始时间),
                    行动结束时间: 取文本(item?.行动结束时间)
                }))
                .filter((item) => item.姓名 || item.当前状态 || item.当前行动)
            : [],
        待执行事件: Array.isArray(world?.待执行事件)
            ? world.待执行事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    类型: 取文本(item?.类型),
                    事件说明: 取文本(item?.事件说明),
                    计划执行时间: 取文本(item?.计划执行时间),
                    最早执行时间: 取文本(item?.最早执行时间),
                    最晚执行时间: 取文本(item?.最晚执行时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    执行后影响: 取字符串数组(item?.执行后影响),
                    错过后影响: 取字符串数组(item?.错过后影响),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        进行中事件: Array.isArray(world?.进行中事件)
            ? world.进行中事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    类型: 取文本(item?.类型),
                    事件说明: 取文本(item?.事件说明),
                    开始时间: 取文本(item?.开始时间),
                    预计结束时间: 取文本(item?.预计结束时间),
                    当前进展: 取文本(item?.当前进展),
                    已产生影响: 取字符串数组(item?.已产生影响),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        已结算事件: Array.isArray(world?.已结算事件)
            ? world.已结算事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    类型: 取文本(item?.类型),
                    事件说明: 取文本(item?.事件说明),
                    结算时间: 取文本(item?.结算时间),
                    事件结果: 取字符串数组(item?.事件结果),
                    长期影响: 取字符串数组(item?.长期影响),
                    是否进入史册: 取布尔(item?.是否进入史册),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        世界镜头规划: Array.isArray(world?.世界镜头规划)
            ? world.世界镜头规划
                .map((item: any) => ({
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    触发条件: 取字符串数组(item?.触发条件),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分解组: 取数字数组(item?.关联分解组),
                    关联分歧线: 取字符串数组(item?.关联分歧线),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.镜头标题 || item.镜头内容)
            : [],
        江湖史册: Array.isArray(world?.江湖史册)
            ? world.江湖史册
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    归档时间: 取文本(item?.归档时间),
                    归档内容: 取字符串数组(item?.归档内容),
                    长期影响: 取字符串数组(item?.长期影响),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联势力: 取字符串数组(item?.关联势力),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联分歧线: 取字符串数组(item?.关联分歧线)
                }))
                .filter((item) => item.标题 || item.归档内容.length > 0)
            : [],
        地图: Array.isArray(world?.地图)
            ? world.地图
                .map((item: any) => ({
                    名称: 取文本(item?.名称),
                    坐标: 取文本(item?.坐标),
                    描述: 取文本(item?.描述),
                    归属: 规范化地点归属(item?.归属),
                    内部建筑: 取字符串数组(item?.内部建筑)
                }))
                .filter((item) => item.名称 || item.描述)
            : [],
        建筑: Array.isArray(world?.建筑)
            ? world.建筑
                .map((item: any) => ({
                    名称: 取文本(item?.名称),
                    描述: 取文本(item?.描述),
                    归属: 规范化地点归属(item?.归属)
                }))
                .filter((item) => item.名称 || item.描述)
            : [],
        地图层级: Array.isArray(world?.地图层级) ? world.地图层级 : [],
        地图建筑: Array.isArray(world?.地图建筑) ? world.地图建筑 : [],
        地图道路: Array.isArray(world?.地图道路) ? world.地图道路 : [],
        地图人物: Array.isArray(world?.地图人物) ? world.地图人物 : [],
        // 势力系统（旧存档兼容：缺失时默认为空数组）
        势力列表: Array.isArray(world?.势力列表) ? world.势力列表 : [],
        势力互动历史: Array.isArray(world?.势力互动历史) ? world.势力互动历史 : [],
    };

    // 不再调用补齐——旧坐标系统已废弃，新地图系统不需要空间坐标补全
    return normalizedWorld;
};

export const 创建开场空白剧情 = (): 剧情系统结构 => ({
    当前章节: {
        标题: '',
        当前分解组: 1,
        已完成摘要: [],
        当前待解问题: [],
        切章后沉淀要点: []
    },
    下一章预告: {
        标题: '',
        大纲: [],
        进入条件: [],
        风险提示: []
    },
    历史卷宗: [],
    章节时间校准: []
});

export const 规范化剧情状态 = (raw?: any): 剧情系统结构 => {
    const story = raw && typeof raw === 'object' ? raw : {};
    const chapter = story?.当前章节 && typeof story.当前章节 === 'object' ? story.当前章节 : {};
    const preview = story?.下一章预告 && typeof story.下一章预告 === 'object' ? story.下一章预告 : {};
    return {
        当前章节: {
            标题: 取文本(chapter?.标题),
            当前分解组: Math.max(1, 取数字(chapter?.当前分解组, 1)),
            已完成摘要: 取字符串数组(chapter?.已完成摘要),
            当前待解问题: 取字符串数组(chapter?.当前待解问题),
            切章后沉淀要点: 取字符串数组(chapter?.切章后沉淀要点)
        },
        下一章预告: {
            标题: 取文本(preview?.标题),
            大纲: 取字符串数组(preview?.大纲),
            进入条件: 取字符串数组(preview?.进入条件),
            风险提示: 取字符串数组(preview?.风险提示)
        },
        历史卷宗: Array.isArray(story?.历史卷宗)
            ? story.历史卷宗
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    所属章节范围: 取文本(item?.所属章节范围),
                    所属分解组: Math.max(1, 取数字(item?.所属分解组, 1)),
                    章节总结: 取字符串数组(item?.章节总结),
                    延续事项: 取字符串数组(item?.延续事项),
                    关系变化: 取字符串数组(item?.关系变化),
                    势力变化: 取字符串数组(item?.势力变化),
                    地点变化: 取字符串数组(item?.地点变化),
                    资源变化: 取字符串数组(item?.资源变化),
                    分歧线变化: 取字符串数组(item?.分歧线变化),
                    记录时间: 取文本(item?.记录时间)
                }))
                .filter((item) => item.标题 || item.章节总结.length > 0)
            : [],
        章节时间校准: 规范化章节时间校准(story?.章节时间校准)
    };
};

export const 创建空剧情规划 = (): 剧情规划结构 => ({
    当前章目标: [],
    当前章任务: [],
    跨章延续事项: [],
    待触发事件: [],
    镜头规划: [],
    换章规则: {
        本章完成判定: [],
        允许切章条件: [],
        禁止切章条件: [],
        切章后需沉淀内容: [],
        切章后需清空字段: [],
        切章后需重建字段: []
    }
});

export const 规范化剧情规划状态 = (raw?: any): 剧情规划结构 => {
    const plan = raw && typeof raw === 'object' ? raw : {};
    const chapterRule = plan?.换章规则 && typeof plan.换章规则 === 'object' ? plan.换章规则 : {};
    return {
        当前章目标: 取字符串数组(plan?.当前章目标),
        当前章任务: Array.isArray(plan?.当前章任务)
            ? plan.当前章任务
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    任务说明: 取文本(item?.任务说明),
                    计划执行时间: 取文本(item?.计划执行时间),
                    最早执行时间: 取文本(item?.最早执行时间),
                    最晚执行时间: 取文本(item?.最晚执行时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    执行动作: 取字符串数组(item?.执行动作),
                    完成判定: 取字符串数组(item?.完成判定),
                    失败后转移: 取字符串数组(item?.失败后转移),
                    完成后沉淀: 取字符串数组(item?.完成后沉淀),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    关联势力: 取字符串数组(item?.关联势力),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.标题 || item.任务说明)
            : [],
        跨章延续事项: Array.isArray(plan?.跨章延续事项)
            ? plan.跨章延续事项
                .map((item: any) => ({
                    标题: 取文本(item?.标题),
                    延续原因: 取字符串数组(item?.延续原因),
                    当前状态: 取字符串数组(item?.当前状态),
                    延续到何时: 取文本(item?.延续到何时),
                    后续接续条件: 取字符串数组(item?.后续接续条件),
                    终止条件: 取字符串数组(item?.终止条件)
                }))
                .filter((item) => item.标题 || item.当前状态.length > 0)
            : [],
        待触发事件: Array.isArray(plan?.待触发事件)
            ? plan.待触发事件
                .map((item: any) => ({
                    事件名: 取文本(item?.事件名),
                    事件说明: 取文本(item?.事件说明),
                    计划触发时间: 取文本(item?.计划触发时间),
                    最早触发时间: 取文本(item?.最早触发时间),
                    最晚触发时间: 取文本(item?.最晚触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    成功结果: 取字符串数组(item?.成功结果),
                    失败结果: 取字符串数组(item?.失败结果),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.事件名 || item.事件说明)
            : [],
        镜头规划: Array.isArray(plan?.镜头规划)
            ? plan.镜头规划
                .map((item: any) => ({
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    关联任务: 取字符串数组(item?.关联任务),
                    关联人物: 取字符串数组(item?.关联人物),
                    关联地点: 取字符串数组(item?.关联地点),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.镜头标题 || item.镜头内容)
            : [],
        换章规则: {
            本章完成判定: 取字符串数组(chapterRule?.本章完成判定),
            允许切章条件: 取字符串数组(chapterRule?.允许切章条件),
            禁止切章条件: 取字符串数组(chapterRule?.禁止切章条件),
            切章后需沉淀内容: 取字符串数组(chapterRule?.切章后需沉淀内容),
            切章后需清空字段: 取字符串数组(chapterRule?.切章后需清空字段),
            切章后需重建字段: 取字符串数组(chapterRule?.切章后需重建字段)
        }
    };
};

export const 规范化女主剧情规划状态 = (raw?: any): 女主剧情规划结构 | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const plan = raw;
    return {
        阶段推进: Array.isArray(plan?.阶段推进)
            ? plan.阶段推进
                .map((item: any) => ({
                    阶段名: 取文本(item?.阶段名),
                    阶段目标: 取字符串数组(item?.阶段目标),
                    主推女主: 取字符串数组(item?.主推女主),
                    次推女主: 取字符串数组(item?.次推女主),
                    禁止越级对象: 取字符串数组(item?.禁止越级对象),
                    关联剧情任务: 取字符串数组(item?.关联剧情任务),
                    阶段完成判定: 取字符串数组(item?.阶段完成判定),
                    切换条件: 取字符串数组(item?.切换条件)
                }))
                .filter((item) => item.阶段名 || item.阶段目标.length > 0)
            : [],
        女主条目: Array.isArray(plan?.女主条目)
            ? plan.女主条目
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    类型: 取文本(item?.类型),
                    当前关系状态: 取文本(item?.当前关系状态),
                    当前阶段: 取文本(item?.当前阶段),
                    已成立事实: 取字符串数组(item?.已成立事实),
                    阶段目标: 取字符串数组(item?.阶段目标),
                    推进方式: 取字符串数组(item?.推进方式),
                    阻断因素: 取字符串数组(item?.阻断因素),
                    允许突破条件: 取字符串数组(item?.允许突破条件),
                    失败后回退: 取字符串数组(item?.失败后回退)
                }))
                .filter((item) => item.女主姓名)
            : [],
        女主互动事件: Array.isArray(plan?.女主互动事件)
            ? plan.女主互动事件
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    事件名: 取文本(item?.事件名),
                    事件说明: 取文本(item?.事件说明),
                    计划触发时间: 取文本(item?.计划触发时间),
                    最早触发时间: 取文本(item?.最早触发时间),
                    最晚触发时间: 取文本(item?.最晚触发时间),
                    前置条件: 取字符串数组(item?.前置条件),
                    触发条件: 取字符串数组(item?.触发条件),
                    阻断条件: 取字符串数组(item?.阻断条件),
                    成功结果: 取字符串数组(item?.成功结果),
                    失败结果: 取字符串数组(item?.失败结果),
                    关联剧情任务: 取字符串数组(item?.关联剧情任务),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.女主姓名 || item.事件名)
            : [],
        女主镜头规划: Array.isArray(plan?.女主镜头规划)
            ? plan.女主镜头规划
                .map((item: any) => ({
                    女主姓名: 取文本(item?.女主姓名),
                    镜头标题: 取文本(item?.镜头标题),
                    镜头内容: 取文本(item?.镜头内容),
                    触发时间: 取文本(item?.触发时间),
                    触发条件: 取字符串数组(item?.触发条件),
                    关联事件: 取字符串数组(item?.关联事件),
                    关联剧情任务: 取字符串数组(item?.关联剧情任务),
                    沉淀内容: 取字符串数组(item?.沉淀内容),
                    当前状态: 取文本(item?.当前状态)
                }))
                .filter((item) => item.女主姓名 || item.镜头标题)
            : []
    };
};

export const 剧情规划值有可读内容 = (value: unknown): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.some(剧情规划值有可读内容);
    if (!value || typeof value !== 'object') return false;
    return Object.values(value as Record<string, unknown>).some(剧情规划值有可读内容);
};

export const 女主剧情规划有可读内容 = 剧情规划值有可读内容;

export const 创建开场基础状态 = (charData: 角色数据结构, worldConfig: WorldGenConfig, openingConfig?: OpeningConfig) => {
    const 玩家组织 = 创建开局组织状态(charData, openingConfig);
    const 角色基态 = 清洗无限流开局能力(深拷贝(charData), 玩家组织, openingConfig);
    const 角色 = {
        ...角色基态,
        金钱: 确保角色金钱BaseAmount((角色基态 as any).金钱)
    };
    const 社交 = 修复开局伙伴社交列表([], openingConfig, 角色);
    const 世界 = 创建开场空白世界();
    const 地图草稿层级 = Array.isArray(worldConfig?.mapDiyDraft?.nodes) && worldConfig.mapDiyDraft.nodes.length > 0
        ? buildWorldMapLayersFromDraft(worldConfig.mapDiyDraft)
        : [];
    if (地图草稿层级.length > 0) {
        世界.地图层级 = 地图草稿层级 as any;
    }
    const 开局任务 = [创建开局主线任务(玩家组织, openingConfig)];
    return {
        角色,
        环境: 创建开场空白环境(),
        游戏初始时间: '',
        社交,
        世界,
        玩家组织,
        任务列表: 开局任务,
        剧情: 创建开场空白剧情(),
        剧情规划: 创建空剧情规划(),
        女主剧情规划: undefined as 女主剧情规划结构 | undefined,
        开局配置: openingConfig
    };
};

export const 创建开场命令基态 = (openingBase?: Partial<ReturnType<typeof 创建开场基础状态>>): 开场命令基态 => ({
    角色: openingBase?.角色 ? {
        ...深拷贝(openingBase.角色),
        金钱: 确保角色金钱BaseAmount((openingBase.角色 as any).金钱)
    } : 创建开场空白角色(),
    环境: openingBase?.环境 ? 深拷贝(openingBase.环境) : 创建开场空白环境(),
    社交: Array.isArray(openingBase?.社交) ? 深拷贝(openingBase.社交) : [],
    世界: openingBase?.世界 ? 深拷贝(openingBase.世界) : 创建开场空白世界(),
    玩家组织: openingBase?.玩家组织 ? 规范化组织状态(openingBase.玩家组织) : 创建空组织状态(),
    任务列表: Array.isArray(openingBase?.任务列表) ? 深拷贝(openingBase.任务列表) : [],
    剧情: openingBase?.剧情 ? 规范化剧情状态(openingBase.剧情) : 创建开场空白剧情(),
    剧情规划: openingBase?.剧情规划 ? 规范化剧情规划状态(openingBase.剧情规划) : 创建空剧情规划(),
    女主剧情规划: openingBase?.女主剧情规划 ? 规范化女主剧情规划状态(openingBase.女主剧情规划) : undefined
});

export const 构建前端清空开场状态 = (
    openingBase: ReturnType<typeof 创建开场基础状态>
): ReturnType<typeof 创建开场基础状态> => ({
    ...openingBase,
    角色: 创建开场空白角色(),
    环境: 创建开场空白环境(),
    社交: [],
    世界: 创建开场空白世界(),
    玩家组织: 创建空组织状态(),
    任务列表: [],
    剧情: 创建开场空白剧情(),
    剧情规划: 创建空剧情规划(),
    女主剧情规划: undefined
});

export const 创建空记忆系统 = (): 记忆系统结构 => ({
    回忆档案: [],
    即时记忆: [],
    短期记忆: [],
    中期记忆: [],
    长期记忆: []
});

export const 按回合窗口裁剪历史 = (sourceHistory: 聊天记录结构[], roundLimit: number): 聊天记录结构[] => {
    const history = Array.isArray(sourceHistory) ? sourceHistory : [];
    const normalizedLimit = Math.max(0, Math.floor(Number(roundLimit) || 0));
    if (normalizedLimit <= 0) return [];

    const turnAnchors = history
        .map((item, idx) => (item.role === 'assistant' && item.structuredResponse ? idx : -1))
        .filter((idx) => idx >= 0);

    if (turnAnchors.length <= normalizedLimit) return [...history];

    const firstVisibleTurnPos = turnAnchors.length - normalizedLimit;
    if (firstVisibleTurnPos <= 0) return [...history];

    const prevTurnAnchor = turnAnchors[firstVisibleTurnPos - 1];
    const sliceStart = Math.min(history.length, prevTurnAnchor + 1);
    return history.slice(sliceStart);
};
