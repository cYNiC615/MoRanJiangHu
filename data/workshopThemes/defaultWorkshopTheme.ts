import type {
    OpeningConfig,
    WorldGenConfig,
    初始伙伴配置结构,
    游戏难度,
    题材模式类型
} from '../../models/system';
import type { ModeRuntimeProfile } from '../../models/system';

export type 创意工坊引擎步骤ID = 'world' | 'backgrounds' | 'character' | 'companion' | 'opening' | 'confirm';

export interface 创意工坊引擎步骤定义 {
    id: 创意工坊引擎步骤ID;
    label: string;
    description?: string;
    required?: boolean;
}

export interface 创意工坊属性字段定义 {
    key: '力量' | '敏捷' | '体质' | '根骨' | '悟性' | '福源';
    label: string;
    min: number;
    max: number;
    defaultValue: number;
}

export interface 创意工坊选项定义<T extends string = string> {
    value: T;
    label: string;
    hint?: string;
}

export interface 创意工坊主题配置 {
    schema: 'moranjianghu-workshop-theme';
    formatVersion: number;
    id: string;
    title: string;
    description: string;
    defaultMode: 题材模式类型;
    creationFlow: 创意工坊引擎步骤定义[];
    worldDefaults: WorldGenConfig;
    characterDefaults: {
        gender: string;
        age: number;
        birthMonth: number;
        birthDay: number;
        appearance: string;
        personality: string;
    };
    companionDefaults: 初始伙伴配置结构;
    openingDefaults: Omit<OpeningConfig, 'modeRuntimeProfile'> & {
        modeRuntimeProfile?: ModeRuntimeProfile;
    };
    attributeFields: 创意工坊属性字段定义[];
    difficultyOptions: Array<创意工坊选项定义<游戏难度>>;
    worldSizeOptions: Array<创意工坊选项定义<WorldGenConfig['worldSize']>>;
    editablePools: {
        backgrounds: boolean;
        talents: boolean;
        openingPresets: boolean;
    };
}

const 默认属性字段: 创意工坊属性字段定义[] = [
    { key: '力量', label: '力量', min: 3, max: 10, defaultValue: 3 },
    { key: '敏捷', label: '敏捷', min: 3, max: 10, defaultValue: 3 },
    { key: '体质', label: '体质', min: 3, max: 10, defaultValue: 3 },
    { key: '根骨', label: '根骨', min: 3, max: 10, defaultValue: 3 },
    { key: '悟性', label: '悟性', min: 3, max: 10, defaultValue: 3 },
    { key: '福源', label: '福源', min: 3, max: 10, defaultValue: 3 }
];

export const 默认创意工坊主题配置: 创意工坊主题配置 = {
    schema: 'moranjianghu-workshop-theme',
    formatVersion: 1,
    id: 'official-moranjianghu',
    title: '墨色江湖默认主题',
    description: '内置武侠/仙侠/现代/末日/无限流等题材的新建存档主题。流程、基础字段、默认值和选项均由主题配置驱动。',
    defaultMode: '现代都市',
    creationFlow: [
        { id: 'world', label: '世界观', description: '选择题材、世界规模、世界观草稿和本地模式包。', required: true },
        { id: 'backgrounds', label: '天赋背景', description: '选择或自定义长期身份背景与天赋。', required: true },
        { id: 'character', label: '角色基础', description: '设置主角基础信息、出生日期、形象和属性。', required: true },
        { id: 'companion', label: '开局伙伴', description: '设置可选同行伙伴。' },
        { id: 'opening', label: '开局配置', description: '设置初始关系、切入方式和题材约束。' },
        { id: 'confirm', label: '确认生成', description: '复核配置并开始生成。', required: true }
    ],
    worldDefaults: {
        worldName: '海川市',
        worldSize: '弹丸之地',
        dynastySetting: '现代城市由大学城、社区、商圈、写字楼、医院和交通网络构成，现实压力、人情关系和城市机会共同推进剧情。',
        sectDensity: '稀少',
        tianjiaoSetting: '优势来自学习能力、时间管理、信息差、人际分寸、心理韧性和现实资源调度，不默认出现超常能力体系。',
        worldExtraRequirement: '',
        manualWorldPrompt: '',
        manualRealmPrompt: '',
        difficulty: 'normal'
    },
    characterDefaults: {
        gender: '男',
        age: 18,
        birthMonth: 1,
        birthDay: 1,
        appearance: '黑发黑眸，面容清秀，衣着朴素利落。',
        personality: '外冷内热，谨慎克制，遇事先观察再出手。'
    },
    companionDefaults: {
        enabled: false,
        头像图片URL: '',
        图片档案: undefined,
        姓名: '',
        性别: '女',
        年龄: 18,
        出生月: 1,
        出生日: 1,
        外貌: '眉眼清亮，衣着利落，随身带着惯用行囊。',
        性格: '稳重可靠，重诺守信，遇事会主动提醒主角风险。',
        属性: 默认属性字段.reduce((acc, field) => ({ ...acc, [field.key]: field.defaultValue }), {}) as 初始伙伴配置结构['属性'],
        背景名称: '',
        背景描述: '',
        背景效果: '',
        天赋列表: [],
        关系: '自幼相识的同行伙伴',
        备注: ''
    },
    openingDefaults: {
        配置约束启用: true,
        题材模式: '现代都市',
        初始关系模板: '独行少系',
        关系侧重: ['友情', '情缘'],
        开局切入偏好: '日常低压',
        开局生成组织: false,
        开局生成成员: false,
        允许生成性别: ['男', '女', '男娘', '扶她'],
        生成性别锁定: false,
        初始伙伴: undefined
    },
    attributeFields: 默认属性字段,
    difficultyOptions: [
        { value: 'relaxed', label: '轻松 (剧情模式)' },
        { value: 'easy', label: '简单 (初入江湖)' },
        { value: 'normal', label: '正常 (标准体验)' },
        { value: 'hard', label: '困难 (刀光剑影)' },
        { value: 'extreme', label: '极限 (修罗炼狱)' }
    ],
    worldSizeOptions: [
        { value: '弹丸之地', label: '弹丸之地 (一岛或一城)' },
        { value: '九州宏大', label: '九州宏大 (万里河山)' },
        { value: '无尽位面', label: '无尽位面 (多重世界)' }
    ],
    editablePools: {
        backgrounds: true,
        talents: true,
        openingPresets: true
    }
};
