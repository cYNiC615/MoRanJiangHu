import type {
    OpeningConfig,
    OpeningRuntimeSnapshot,
    初始伙伴配置结构,
    游戏难度,
    初始关系模板类型,
    关系侧重类型,
    开局切入偏好类型,
    开局生成性别类型,
    题材模式类型,
} from '../types';
import { 获取题材模式配置, 获取题材模式选项, 规范化题材模式 } from './topicModeProfiles';
import { 构建官方模式运行时配置, 规范化模式运行时配置 } from './modeRuntimeProfile';
import {
    创建主题默认属性分配,
    创建主题默认初始伙伴配置,
    创建主题默认开局配置,
    获取创意工坊属性字段,
    获取创意工坊新开局步骤列表
} from './workshopEngine';
import { 规范化导演配置 } from './directorConfig';
import { 补全开局运行时世界书快照 } from './runtimeWorldbooks';

export const 新开局步骤定义列表 = 获取创意工坊新开局步骤列表();
export const 新开局步骤列表 = 新开局步骤定义列表.map((step) => step.label);

export const 属性字段定义列表 = 获取创意工坊属性字段();
export const 属性键列表 = ['力量', '敏捷', '体质', '根骨', '悟性', '福源'] as const;
export const 默认属性值 = 属性字段定义列表[0]?.defaultValue ?? 3;
export const 属性最小值 = Math.min(...属性字段定义列表.map((field) => field.min));
export const 属性最大值 = Math.max(...属性字段定义列表.map((field) => field.max));
export type 属性分配结构 = Record<typeof 属性键列表[number], number>;

export type 难度设定结构 = {
    id: 游戏难度;
    label: string;
    shortLabel: string;
    description: string;
    起始属性点: number;
    天赋重Roll次数: number;
    判定修正: number;
    敌方强度: string;
    资源压力: string;
    失败代价: string;
    推荐人群: string;
};

export const 难度设定表: Record<游戏难度, 难度设定结构> = {
    relaxed: {
        id: 'relaxed',
        label: '轻松',
        shortLabel: '剧情模式',
        description: '适合先看世界、轻松体验剧情推进，资源与失败压力最低。',
        起始属性点: 38,
        天赋重Roll次数: 12,
        判定修正: 3,
        敌方强度: '敌人更保守，跨级压力下降',
        资源压力: '经验、掉落与恢复更宽松',
        失败代价: '多为轻伤、少量损耗或可补救后果',
        推荐人群: '想体验剧情、探索设定或测试新开局'
    },
    easy: {
        id: 'easy',
        label: '简单',
        shortLabel: '稳健养成',
        description: '适合正常养成但保留较高容错，资源循环比较顺。',
        起始属性点: 34,
        天赋重Roll次数: 8,
        判定修正: 1,
        敌方强度: '敌人略弱，普通冲突更好处理',
        资源压力: '收益略高，物价略低，恢复较稳定',
        失败代价: '会受伤或损失资源，但大多能补救',
        推荐人群: '第一次正式开档或想少一点折磨'
    },
    normal: {
        id: 'normal',
        label: '正常',
        shortLabel: '标准江湖',
        description: '标准体验，强调风险、收益、关系与代价之间的平衡。',
        起始属性点: 30,
        天赋重Roll次数: 5,
        判定修正: 0,
        敌方强度: '敌人按标准强度行动',
        资源压力: '收益与消耗按标准江湖压力结算',
        失败代价: '失败会带来伤势、关系或剧情门控损失',
        推荐人群: '想体验默认平衡的长期存档'
    },
    hard: {
        id: 'hard',
        label: '困难',
        shortLabel: '高压实战',
        description: '更看重路线规划、补给、人情和战术判断，失误更疼。',
        起始属性点: 26,
        天赋重Roll次数: 3,
        判定修正: -1,
        敌方强度: '敌人更积极，攻防与追击压力提升',
        资源压力: '收益减少，物价偏高，恢复更慢',
        失败代价: '更容易留下长期后遗症或丢失关键机会',
        推荐人群: '熟悉系统后想要更硬的生存压力'
    },
    extreme: {
        id: 'extreme',
        label: '极限',
        shortLabel: '残酷求生',
        description: '高风险挑战，任何错误都可能滚成不可逆后果。',
        起始属性点: 22,
        天赋重Roll次数: 1,
        判定修正: -3,
        敌方强度: '敌人强势且世界反应更严酷',
        资源压力: '收益稀缺，消耗和物价压力最高',
        失败代价: '可能触发重伤、残废、清算或主线断裂',
        推荐人群: '想要硬核求生和高失败代价'
    }
};

export const 难度总属性点映射: Record<游戏难度, number> = {
    relaxed: 难度设定表.relaxed.起始属性点,
    easy: 难度设定表.easy.起始属性点,
    normal: 难度设定表.normal.起始属性点,
    hard: 难度设定表.hard.起始属性点,
    extreme: 难度设定表.extreme.起始属性点
};

export const 获取难度设定 = (difficulty?: 游戏难度): 难度设定结构 => (
    难度设定表[difficulty || 'normal'] || 难度设定表.normal
);

export const 获取题材化难度设定 = (
    difficulty?: 游戏难度,
    mode?: 题材模式类型
): 难度设定结构 => {
    const base = 获取难度设定(difficulty);
    const profile = 获取题材模式配置(mode);
    if (profile.group === 'infinite') {
        return {
            ...base,
            shortLabel: base.id === 'normal' ? '标准轮回' : base.shortLabel,
            资源压力: base.id === 'normal'
                ? '元、支线剧情凭证与道具消耗按主神任务压力结算'
                : base.资源压力.replace(/江湖/g, '轮回任务'),
            失败代价: base.id === 'extreme'
                ? '可能触发重伤、队友死亡、支线失败、抹杀风险或主线断裂'
                : base.失败代价.replace(/伤势、关系或剧情门控/g, '伤势、队伍关系、奖励惩罚或任务门控')
        };
    }
    if (profile.group === 'apocalypse' && base.id === 'normal') {
        return {
            ...base,
            shortLabel: '标准求生',
            资源压力: '补给、感染风险和营地信用按标准末日压力结算'
        };
    }
    if (profile.group === 'modern' && base.id === 'normal') {
        return {
            ...base,
            shortLabel: '标准现实',
            资源压力: '资金、人情、时间和机会成本按标准现实压力结算'
        };
    }
    return base;
};

export const 初始关系模板选项: Array<{ value: 初始关系模板类型; label: string; hint: string }> = [
    { value: '独行少系', label: '独行少系', hint: '初始社交网收束为 1~2 人，更偏向孤身闯荡。' },
    { value: '家族牵引', label: '家族牵引', hint: '优先生成家人、族人、旧宅与家业压力。' },
    { value: '师门牵引', label: '师门牵引', hint: '优先生成师父、同门、组织规则与门内承接。' },
    { value: '世家官门', label: '世家官门', hint: '偏向门第、人脉、礼法与现实资源网络。' },
    { value: '青梅旧识', label: '青梅旧识', hint: '优先生成旧交、故人和情感承接线。' },
    { value: '旧仇旧债', label: '旧仇旧债', hint: '开局社会关系带着旧账、旧怨与压力源。' }
];

export const 关系侧重选项: Array<{ value: 关系侧重类型; label: string }> = [
    { value: '亲情', label: '亲情' },
    { value: '友情', label: '友情' },
    { value: '师门', label: '师门' },
    { value: '情缘', label: '情缘' },
    { value: '利益', label: '利益' },
    { value: '仇怨', label: '仇怨' }
];

export const 开局切入偏好选项: Array<{ value: 开局切入偏好类型; label: string; hint: string }> = [
    { value: '日常低压', label: '日常低压', hint: '优先从生活流、环境感和轻关系起步。' },
    { value: '在途起手', label: '在途起手', hint: '开局落在赶路、渡口、驿路、山道等途中场景。' },
    { value: '家宅起手', label: '家宅起手', hint: '优先落在卧房、院落、铺面、旧宅等内场。' },
    { value: '门派起手', label: '门派起手', hint: '优先落在山门、偏院、堂口、习武地等门派场景。' },
    { value: '风波前夜', label: '风波前夜', hint: '允许有将起未起的异动，但仍保持第一幕克制。' }
];

export type 题材开局配置文案 = {
    intro: string;
    relationHelper: string;
    organizationEnabled: boolean;
    organizationTitle: string;
    organizationDescription: string;
    memberTitle: string;
    memberDescription: string;
    organizationOffHint: string;
    relationLabels: Partial<Record<关系侧重类型, string>>;
    cutInLabels: Partial<Record<开局切入偏好类型, { label: string; hint: string }>>;
    promptBoundary: string;
};

const 应用运行时组织文案 = (
    copy: 题材开局配置文案,
    runtimeProfile?: unknown
): 题材开局配置文案 => {
    const normalized = runtimeProfile ? 规范化模式运行时配置(runtimeProfile) : null;
    const organizationName = normalized?.organization?.organizationName?.trim();
    const memberName = normalized?.organization?.memberName?.trim();
    if (!organizationName && !memberName) return copy;
    const finalOrganization = organizationName || '组织';
    const finalMember = memberName || '成员';
    return {
        ...copy,
        organizationTitle: `开局生成${finalOrganization}`,
        organizationDescription: `开启后第0回合会生成可承接的${finalOrganization}、相关据点或初始组织关系。`,
        memberTitle: `开局生成${finalMember}`,
        memberDescription: `开启后生成初始${finalMember}、同行者、联系人或组织成员名录。`,
        relationLabels: {
            ...copy.relationLabels,
            师门: finalOrganization
        },
        cutInLabels: {
            ...copy.cutInLabels,
            门派起手: {
                label: `${finalOrganization}起手`,
                hint: `优先落在${finalOrganization}据点、集合点、任务现场或组织关系承接处。`
            }
        }
    };
};

export const 获取题材开局配置文案 = (mode?: 题材模式类型, runtimeProfile?: unknown): 题材开局配置文案 => {
    const profile = 获取题材模式配置(mode);
    if (profile.group === 'apocalypse') {
        return 应用运行时组织文案({
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式；末日题材会按幸存者语境生成关系与场景。',
            relationHelper: '会优先影响初始幸存者关系网的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成营地',
            organizationDescription: '开启后第0回合会生成可承接的营地、避难所、车队、军方残部或幸存者小队。',
            memberTitle: '开局生成队友',
            memberDescription: '开启后生成初始队友、营地成员、临时同行者或幸存者关系名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '队伍', 友情: '互助', 利益: '物资', 仇怨: '冲突' },
            cutInLabels: {
                在途起手: { label: '转移起手', hint: '开局落在转移、搜刮、撤离、车队或封锁线附近。' },
                家宅起手: { label: '避难点起手', hint: '优先落在家中、避难所、仓库、药房或临时安全屋。' },
                门派起手: { label: '营地起手', hint: '优先落在幸存者营地、临时据点、军方残部或安全区边缘。' }
            },
            promptBoundary: profile.promptBoundary
        }, runtimeProfile);
    }
    if (profile.group === 'modern') {
        return 应用运行时组织文案({
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式；现代都市会按现实社会语境生成关系与场景。',
            relationHelper: '会优先影响初始现实社交网、职场/家庭/城市关系的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成组织',
            organizationDescription: '默认关闭；开启后第0回合会生成可承接的公司、学校、社区、项目组、门店或合作团队。',
            memberTitle: '开局生成成员',
            memberDescription: '开启后生成联系人、同事、亲友、邻里、合作对象或组织成员名录。',
            organizationOffHint: '关闭时开局不主动给主角绑定公司、学校、社团或团队归属，只保留可自然接触的现实关系。',
            relationLabels: { 师门: '职场', 情缘: '情感', 利益: '合作', 仇怨: '矛盾' },
            cutInLabels: {
                在途起手: { label: '通勤起手', hint: '开局落在通勤、出差、路口、地铁、网约车或城市移动途中。' },
                家宅起手: { label: '住处起手', hint: '优先落在出租屋、家中、小区、店铺或办公室。' },
                门派起手: { label: '组织起手', hint: '优先落在公司、学校、社区、项目组、门店或合作现场。' }
            },
            promptBoundary: profile.promptBoundary
        }, runtimeProfile);
    }
    if (profile.group === 'urban_xianxia') {
        return 应用运行时组织文案({
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和隐秘组织/同道生成。',
            relationHelper: '会优先影响初始社交网、现实身份与隐秘圈层的情绪结构。',
            organizationEnabled: true,
            organizationTitle: profile.value === '灵气复苏' ? '开局生成机构' : '开局生成隐门',
            organizationDescription: profile.value === '灵气复苏'
                ? '开启后可生成研究小组、临时管控机构、觉醒者互助点或异常处理小队，而不是古代门派。'
                : '开启后可生成隐秘修行家族、暗线组织、同道据点或都市隐门。',
            memberTitle: profile.value === '灵气复苏' ? '开局生成协作者' : '开局生成同道',
            memberDescription: profile.value === '灵气复苏'
                ? '开启后生成协作者、调查员、研究员、觉醒者同伴或互助者名录。'
                : '开启后生成同道、师承联系人、家族成员或暗线伙伴名录。',
            organizationOffHint: '',
            relationLabels: { 师门: profile.value === '灵气复苏' ? '机构' : '隐门', 利益: '资源', 仇怨: '旧怨' },
            cutInLabels: {
                在途起手: { label: '城市途中', hint: '开局落在通勤、调查、转移、赶赴异常点或城市途中场景。' },
                家宅起手: { label: '住处起手', hint: '优先落在住处、学校、医院、公司、店铺或家族据点。' },
                门派起手: { label: profile.value === '灵气复苏' ? '机构起手' : '隐门起手', hint: profile.value === '灵气复苏' ? '优先落在研究机构、管控点、互助点或异常处理现场。' : '优先落在隐门据点、家族内场、暗市入口或修行圈碰头处。' }
            },
            promptBoundary: profile.promptBoundary
        }, runtimeProfile);
    }
    if (profile.group === 'xianxia') {
        return 应用运行时组织文案({
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和宗门/同道生成。',
            relationHelper: '会优先影响初始修真社交网的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成宗门',
            organizationDescription: '开启后第0回合会直接拥有可用宗门、仙坊或修真势力承接。',
            memberTitle: '开局生成同道',
            memberDescription: '开启后会生成师长、同门、道友或宗门外缘人物名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '宗门' },
            cutInLabels: {
                在途起手: { label: '行旅起手', hint: '开局落在赶路、飞舟、坊市路口、山道或秘境入口途中。' },
                家宅起手: { label: '洞府起手', hint: '优先落在洞府、院落、仙坊住处、家族旧宅等内场。' },
                门派起手: { label: '宗门起手', hint: '优先落在山门、外门院、讲经堂、演法台或宗门任务现场。' }
            },
            promptBoundary: profile.promptBoundary
        }, runtimeProfile);
    }
    if (profile.group === 'western_fantasy') {
        return 应用运行时组织文案({
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和公会/冒险者生成。',
            relationHelper: '会优先影响初始冒险队伍、公会、骑士团、学院或教会关系的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成公会',
            organizationDescription: '开启后第0回合会生成可承接的冒险者公会、骑士团、魔法学院、教会、佣兵团或商会。',
            memberTitle: '开局生成冒险者',
            memberDescription: '开启后生成初始队友、公会成员、骑士、法师学徒、牧师、佣兵或委托联系人名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '公会', 友情: '同伴', 利益: '委托', 仇怨: '阵营' },
            cutInLabels: {
                在途起手: { label: '旅途起手', hint: '开局落在护送、行商路、边境道路、森林或地下城入口附近。' },
                家宅起手: { label: '酒馆起手', hint: '优先落在旅店、酒馆、公会宿舍、教会客房或学院宿舍。' },
                门派起手: { label: '公会起手', hint: '优先落在冒险者公会、骑士团驻地、学院课堂或教会任务现场。' }
            },
            promptBoundary: profile.promptBoundary
        }, runtimeProfile);
    }
    if (profile.group === 'infinite') {
        return 应用运行时组织文案({
            intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和轮回小队生成。',
            relationHelper: '会优先影响初始轮回小队、资深者、新人和任务利益关系的情绪结构。',
            organizationEnabled: true,
            organizationTitle: '开局生成轮回小队',
            organizationDescription: '开启后第0回合会生成可承接的轮回小队、队伍房间、资深者或主神空间初始组织关系。',
            memberTitle: '开局生成轮回者',
            memberDescription: '开启后生成轮回者、新人、资深者、队友或临时同盟名录。',
            organizationOffHint: '',
            relationLabels: { 师门: '轮回小队', 友情: '队友', 利益: '奖励', 仇怨: '团战' },
            cutInLabels: {
                在途起手: { label: '投放途中', hint: '开局落在任务投放、倒计时、车厢/走廊/入口或进入副本途中。' },
                家宅起手: { label: '队伍房间起手', hint: '优先落在队伍房间、主神广场、训练场或休整空间。' },
                门派起手: { label: '轮回小队起手', hint: '优先落在轮回小队集合、主神光球说明规则或资深者带新人现场。' }
            },
            promptBoundary: profile.promptBoundary
        }, runtimeProfile);
    }
    return 应用运行时组织文案({
        intro: '题材模式已移到“世界观”。这里只决定初始关系侧重、第一幕切入方式和初始门派生成。',
        relationHelper: '会优先影响初始社交网的情绪结构。',
        organizationEnabled: true,
        organizationTitle: '开局生成组织',
        organizationDescription: '开启后第0回合会直接拥有可用门派，而不是只靠旧存档兜底。',
        memberTitle: '开局生成成员',
        memberDescription: '开启后会生成多层次成员名录，少数主要角色加若干普通同门。',
        organizationOffHint: '',
        relationLabels: {},
        cutInLabels: {},
        promptBoundary: profile.promptBoundary
    }, runtimeProfile);
};

export const 获取题材关系侧重选项 = (mode?: 题材模式类型): Array<{ value: 关系侧重类型; label: string }> => {
    const copy = 获取题材开局配置文案(mode);
    return 关系侧重选项.map((item) => ({ ...item, label: copy.relationLabels[item.value] || item.label }));
};

export const 获取题材开局切入偏好选项 = (mode?: 题材模式类型): Array<{ value: 开局切入偏好类型; label: string; hint: string }> => {
    const copy = 获取题材开局配置文案(mode);
    return 开局切入偏好选项.map((item) => ({ ...item, ...(copy.cutInLabels[item.value] || {}) }));
};

export const 题材模式选项: Array<{ value: 题材模式类型; label: string; hint: string }> = 获取题材模式选项();

export const 开局生成性别选项: Array<{ value: 开局生成性别类型; label: string }> = [
    { value: '男', label: '男' },
    { value: '女', label: '女' },
    { value: '男娘', label: '男娘' },
    { value: '扶她', label: '扶她' }
];

export const 默认开局生成性别列表: 开局生成性别类型[] = 开局生成性别选项.map((item) => item.value);

export const 规范化开局生成性别列表 = (value: unknown): 开局生成性别类型[] => {
    const rawList = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(/[\r\n,，、;；\s]+/u)
            : [];
    const allowed = new Set<开局生成性别类型>(默认开局生成性别列表);
    const seen = new Set<开局生成性别类型>();
    const result: 开局生成性别类型[] = [];
    rawList.forEach((item) => {
        const next = 读取文本(item) as 开局生成性别类型;
        if (!allowed.has(next) || seen.has(next)) return;
        seen.add(next);
        result.push(next);
    });
    return result.length > 0 ? result : [...默认开局生成性别列表];
};

export const 默认开局配置 = (): OpeningConfig => ({
    ...创建主题默认开局配置(),
    modeRuntimeProfile: 构建官方模式运行时配置('现代都市'),
    导演配置: 规范化导演配置(),
    允许生成性别: [...默认开局生成性别列表],
    生成性别锁定: false
});

export const 默认初始伙伴配置 = (): 初始伙伴配置结构 => ({
    ...创建主题默认初始伙伴配置(),
    属性: 创建默认属性分配()
});

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const 获取难度总属性点 = (difficulty?: 游戏难度): number => (
    获取难度设定(difficulty).起始属性点
);

export const 创建默认属性分配 = (): 属性分配结构 => ({
    ...创建主题默认属性分配()
});

export const 计算属性总点数 = (attributes: Partial<属性分配结构>): number => (
    属性键列表.reduce((sum, key) => sum + (Number.isFinite(attributes[key]) ? Number(attributes[key]) : 默认属性值), 0)
);

export const 创建平均属性分配 = (totalBudget: number): 属性分配结构 => {
    const next = 创建默认属性分配();
    let remaining = Math.max(0, Math.floor(totalBudget) - 计算属性总点数(next));
    let index = 0;
    while (remaining > 0 && 属性键列表.some((key) => next[key] < 属性最大值)) {
        const key = 属性键列表[index % 属性键列表.length];
        if (next[key] < 属性最大值) {
            next[key] += 1;
            remaining -= 1;
        }
        index += 1;
    }
    return next;
};

export const 创建随机属性分配 = (totalBudget: number, random: () => number = Math.random): 属性分配结构 => {
    const next = 创建默认属性分配();
    let remaining = Math.max(0, Math.floor(totalBudget) - 计算属性总点数(next));
    while (remaining > 0 && 属性键列表.some((key) => next[key] < 属性最大值)) {
        const availableKeys = 属性键列表.filter((key) => next[key] < 属性最大值);
        const key = availableKeys[Math.floor(random() * availableKeys.length)] || availableKeys[0];
        next[key] += 1;
        remaining -= 1;
    }
    return next;
};

const 规范化属性分配 = (value: any) => {
    const fallback = 创建默认属性分配();
    const result = { ...fallback };
    属性键列表.forEach((key) => {
        const num = Number(value?.[key]);
        result[key] = Number.isFinite(num)
            ? Math.max(属性最小值, Math.min(属性最大值, Math.floor(num)))
            : fallback[key];
    });
    return result;
};

const 规范化天赋列表 = (value: unknown): 初始伙伴配置结构['天赋列表'] => (
    Array.isArray(value)
        ? value
            .map((item: any) => ({
                名称: 读取文本(item?.名称),
                描述: 读取文本(item?.描述),
                效果: 读取文本(item?.效果)
            }))
            .filter((item) => item.名称 && item.描述 && item.效果)
            .slice(0, 3)
        : []
);

type 开局背景快照项 = NonNullable<OpeningRuntimeSnapshot['modeBackgrounds']>[number];

const 规范化背景物品快照列表 = (value: unknown): NonNullable<开局背景快照项['初始物品']> | undefined => {
    if (!Array.isArray(value)) return undefined;
    const normalized = value
        .map((item: any) => {
            const source = item && typeof item === 'object' && !Array.isArray(item) ? item : { 名称: item };
            const 名称 = 读取文本(source?.名称);
            if (!名称) return null;
            const 数量 = Number(source?.数量);
            const 最小数量 = Number(source?.最小数量);
            const 最大数量 = Number(source?.最大数量);
            const 描述 = 读取文本(source?.描述);
            const 类型 = 读取文本(source?.类型);
            return {
                名称,
                ...(Number.isFinite(数量) ? { 数量 } : {}),
                ...(Number.isFinite(最小数量) ? { 最小数量 } : {}),
                ...(Number.isFinite(最大数量) ? { 最大数量 } : {}),
                ...(描述 ? { 描述 } : {}),
                ...(类型 ? { 类型 } : {})
            };
        })
        .filter(Boolean) as NonNullable<开局背景快照项['初始物品']>;
    return normalized.length > 0 ? normalized : undefined;
};

// ponytail: keep only the live runtimeSnapshot background shape, not the dead legacy snapshot normalizer.
const 规范化开局背景快照项 = (item: any): 开局背景快照项 | null => {
    const 名称 = 读取文本(item?.名称);
    const 描述 = 读取文本(item?.描述);
    const 效果 = 读取文本(item?.效果);
    if (!名称 || !描述 || !效果) return null;
    const 初始物品 = 规范化背景物品快照列表(item?.初始物品);
    const 可选初始物品 = 规范化背景物品快照列表(item?.可选初始物品);
    const 开局货币 = 规范化背景物品快照列表(item?.开局货币);
    return {
        名称,
        描述,
        效果,
        ...(初始物品 ? { 初始物品 } : {}),
        ...(可选初始物品 ? { 可选初始物品 } : {}),
        ...(开局货币 ? { 开局货币 } : {})
    };
};

const 规范化开局运行时快照 = (raw?: any): OpeningRuntimeSnapshot | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const modeWorldbooks = Array.isArray(raw?.modeWorldbooks)
        ? raw.modeWorldbooks.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) as NonNullable<OpeningRuntimeSnapshot['modeWorldbooks']>
        : [];
    const workshopSelection = raw?.workshopSelection && typeof raw.workshopSelection === 'object' && !Array.isArray(raw.workshopSelection)
        ? (() => {
            const selectedMode = 读取文本(raw.workshopSelection.selectedMode) as NonNullable<OpeningRuntimeSnapshot['workshopSelection']>['selectedMode'];
            const selectedModules = raw.workshopSelection.selectedModules && typeof raw.workshopSelection.selectedModules === 'object' && !Array.isArray(raw.workshopSelection.selectedModules)
                ? Object.fromEntries(
                    Object.entries(raw.workshopSelection.selectedModules)
                        .map(([key, value]) => [key, 读取文本(value)])
                        .filter(([, value]) => value)
                ) as NonNullable<NonNullable<OpeningRuntimeSnapshot['workshopSelection']>['selectedModules']>
                : undefined;
            if (!selectedMode && (!selectedModules || Object.keys(selectedModules).length <= 0)) return undefined;
            return {
                ...(selectedMode ? { selectedMode } : {}),
                ...(selectedModules && Object.keys(selectedModules).length > 0 ? { selectedModules } : {})
            };
        })()
        : undefined;
    const modeBackgrounds = Array.isArray(raw?.modeBackgrounds)
        ? raw.modeBackgrounds
            .map((item: any) => 规范化开局背景快照项(item))
            .filter(Boolean) as NonNullable<OpeningRuntimeSnapshot['modeBackgrounds']>
        : [];
    const modeTalents = Array.isArray(raw?.modeTalents)
        ? raw.modeTalents
            .map((item: any) => ({
                名称: 读取文本(item?.名称),
                描述: 读取文本(item?.描述),
                效果: 读取文本(item?.效果)
            }))
            .filter((item) => item.名称 && item.描述 && item.效果)
        : [];
    const snapshot: OpeningRuntimeSnapshot = {
        openingStreaming: raw?.openingStreaming !== false,
        openingExtraRequirement: 读取文本(raw?.openingExtraRequirement),
        openingExtraPrompt: 读取文本(raw?.openingExtraPrompt),
        activeModuleExtraRules: 读取文本(raw?.activeModuleExtraRules),
        ...(modeWorldbooks.length > 0 ? { modeWorldbooks } : {}),
        ...(workshopSelection ? { workshopSelection } : {}),
        ...(modeBackgrounds.length > 0 ? { modeBackgrounds } : {}),
        ...(modeTalents.length > 0 ? { modeTalents } : {})
    };
    if (
        snapshot.openingStreaming === true
        && !snapshot.openingExtraRequirement
        && !snapshot.openingExtraPrompt
        && !snapshot.activeModuleExtraRules
        && modeWorldbooks.length <= 0
        && !workshopSelection?.selectedMode
        && (!workshopSelection?.selectedModules || Object.keys(workshopSelection.selectedModules).length <= 0)
        && modeBackgrounds.length <= 0
        && modeTalents.length <= 0
    ) {
        return undefined;
    }
    return snapshot;
};

export const 规范化初始伙伴配置 = (raw?: any): 初始伙伴配置结构 => {
    const fallback = 默认初始伙伴配置();
    return {
        enabled: raw?.enabled !== false,
        头像图片URL: 读取文本(raw?.头像图片URL),
        图片档案: raw?.图片档案 && typeof raw.图片档案 === 'object' && !Array.isArray(raw.图片档案)
            ? raw.图片档案
            : undefined,
        姓名: 读取文本(raw?.姓名),
        性别: 读取文本(raw?.性别) || fallback.性别,
        年龄: Number.isFinite(Number(raw?.年龄)) ? Math.max(1, Math.floor(Number(raw.年龄))) : fallback.年龄,
        出生月: Number.isFinite(Number(raw?.出生月)) ? Math.max(1, Math.min(12, Math.floor(Number(raw.出生月)))) : fallback.出生月,
        出生日: Number.isFinite(Number(raw?.出生日)) ? Math.max(1, Math.min(30, Math.floor(Number(raw.出生日)))) : fallback.出生日,
        外貌: 读取文本(raw?.外貌) || fallback.外貌,
        性格: 读取文本(raw?.性格) || fallback.性格,
        属性: 规范化属性分配(raw?.属性),
        背景名称: 读取文本(raw?.背景名称),
        背景描述: 读取文本(raw?.背景描述),
        背景效果: 读取文本(raw?.背景效果),
        天赋列表: 规范化天赋列表(raw?.天赋列表),
        关系: 读取文本(raw?.关系) || fallback.关系,
        备注: 读取文本(raw?.备注)
    };
};

export const 规范化初始伙伴列表 = (raw?: any, legacy?: any): 初始伙伴配置结构[] => {
    const source = Array.isArray(raw) ? raw : (legacy ? [legacy] : []);
    return source.map((item) => 规范化初始伙伴配置(item));
};

export const 规范化开局配置 = (raw?: any): OpeningConfig => {
    const fallback = 默认开局配置();
    const 题材模式 = 规范化题材模式(raw?.题材模式 || fallback.题材模式);
    const 初始关系模板 = 初始关系模板选项.some((item) => item.value === raw?.初始关系模板)
        ? raw.初始关系模板
        : fallback.初始关系模板;
    const 关系侧重 = Array.isArray(raw?.关系侧重)
        ? raw.关系侧重
            .map((item: unknown) => 读取文本(item))
            .filter((item: string): item is 关系侧重类型 => 关系侧重选项.some((option) => option.value === item))
            .slice(0, 2)
        : fallback.关系侧重;
    const 开局切入偏好 = 开局切入偏好选项.some((item) => item.value === raw?.开局切入偏好)
        ? raw.开局切入偏好
        : fallback.开局切入偏好;
    const 初始伙伴列表 = 规范化初始伙伴列表(raw?.初始伙伴列表, raw?.初始伙伴 ?? fallback.初始伙伴);
    const 第一初始伙伴 = 初始伙伴列表[0] || 规范化初始伙伴配置(raw?.初始伙伴 ?? fallback.初始伙伴);

    const normalized: OpeningConfig = {
        配置约束启用: raw?.配置约束启用 !== false,
        题材模式,
        modeRuntimeProfile: 规范化模式运行时配置(raw?.modeRuntimeProfile, 题材模式),
        runtimeSnapshot: 规范化开局运行时快照(raw?.runtimeSnapshot),
        初始关系模板,
        关系侧重: 关系侧重.length > 0 ? 关系侧重 : fallback.关系侧重,
        开局切入偏好,
        开局生成组织: raw?.开局生成组织 === undefined ? fallback.开局生成组织 !== false : raw.开局生成组织 === true,
        开局生成成员: raw?.开局生成成员 === undefined ? fallback.开局生成成员 !== false : raw.开局生成成员 === true,
        玩家剧情倾向: 读取文本(raw?.玩家剧情倾向),
        导演配置: 规范化导演配置(raw?.导演配置, { openingConfig: raw }),
        允许生成性别: 规范化开局生成性别列表(
            raw?.允许生成性别
            ?? raw?.modeRuntimeProfile?.opening?.allowedGeneratedGenders
            ?? fallback.允许生成性别
        ),
        生成性别锁定: raw?.生成性别锁定 === true || raw?.modeRuntimeProfile?.opening?.lockGeneratedGenders === true,
        初始伙伴列表,
        初始伙伴: 第一初始伙伴
    };
    return 补全开局运行时世界书快照(normalized);
};

export const 规范化可选开局配置 = (raw?: any): OpeningConfig | undefined => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    return 规范化开局配置(raw);
};
