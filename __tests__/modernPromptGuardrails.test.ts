import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { 获取世界观生成系统提示词, 构建世界观生成消息链 } from '../prompts/runtime/worldGeneration';
import { 获取世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../prompts/runtime/worldGenerationCot';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词, 构建世界观难度摘要 } from '../prompts/runtime/worldSetup';
import { 开局变量生成附加提示词 } from '../prompts/runtime/openingVariableGenerationInit';
import { 开局世界演变初始化附加提示词 } from '../prompts/runtime/openingWorldEvolutionInit';
import { 开场初始化任务提示词 } from '../prompts/runtime/opening';
import { 构建开局配置提示词 } from '../prompts/runtime/openingConfig';
import { 构建变量模型职责提示词 } from '../prompts/runtime/variableModel';
import { 构建主剧情难度摘要提示词 } from '../prompts/runtime/promptOwnership';
import { 构建世界演变系统提示词 } from '../prompts/runtime/worldEvolution';
import { 世界数据结构参考 } from '../prompts/runtime/worldDataSchema';
import { 构建变量相关规则提示词 } from '../prompts/runtime/variableCalibrationReference';
import { 核心_输出格式 } from '../prompts/core/format';
import { 核心_行动选项规范 } from '../prompts/core/actionOptions';
import { 构建主剧情COT内容 } from '../prompts/core/cot';
import { 构建女主主COT内容 } from '../prompts/core/cotHeroine';
import { 获取开局思维链提示词 } from '../prompts/core/cotOpening';
import { 核心_判定思维链 } from '../prompts/core/cotJudge';
import { 核心_时间推进法则 } from '../prompts/core/timeProgress';
import { 核心_世界观摘要 } from '../prompts/core/worldSummary';
import { 默认提示词 } from '../prompts';
import { 写作_风格 } from '../prompts/writing/style';
import { 写作_避免极端情绪 } from '../prompts/writing/emotionGuard';
import { 写作_防止说话 } from '../prompts/writing/noControl';
import { 写作_防全知 } from '../prompts/writing/antiOmniscient';
import { 默认文章优化提示词 } from '../prompts/runtime/defaults';
import { 数值_世界演化 } from '../prompts/stats/world';
import { 数值_NPC参考 } from '../prompts/stats/npc';
import { 数值_物品属性 } from '../prompts/stats/items';
import { 变量生成COT提示词 } from '../prompts/runtime/variableCot';
import { 构建开局世界观生成提示词预览 } from '../utils/worldGenerationPromptPreview';
import { 裁剪成长体系上下文数据 } from '../utils/promptFeatureToggles';
import { 构建官方模式运行时配置, 渲染模式运行时配置世界书内容 } from '../utils/modeRuntimeProfile';
import { 规范化导演配置, 构建世界生成导演种子弱约束提示词 } from '../utils/directorConfig';
import { 构建女性姓名黑名单提示词 } from '../utils/femaleNameSelector';
import { 题材模式配置表 } from '../data/workshopThemes/topicModeThemeData';
import { 开局预设方案列表 } from '../data/newGamePresets';

const 现代开局配置 = { 题材模式: '现代都市' } as any;
const 现代世界配置 = {
    worldName: '镜湖市',
    worldSize: '弹丸之地',
    dynastySetting: '现代城市由大学城、社区、写字楼、医院、媒体和治安系统构成，现实压力与城市机会共同推进剧情。',
    sectDensity: '稀少',
    tianjiaoSetting: '优势来自学历、技能、人脉、信息差、资金调度和心理韧性。',
    difficulty: 'normal',
    worldExtraRequirement: ''
} as any;
const 测试角色 = {
    姓名: '沈砚',
    性别: '男',
    年龄: 22,
    出生日期: '',
    外貌: '',
    性格: '',
    力量: 5,
    敏捷: 5,
    体质: 5,
    根骨: 5,
    悟性: 5,
    福源: 5,
    天赋列表: [],
    出身背景: {}
} as any;

const 计数 = (source: string, needle: string): number => (
    source.split(needle).length - 1
);

const 构建现代世界观请求文本 = (options?: { directorSeedPrompt?: string }): string => {
    const seed = 构建世界观种子提示词(现代世界配置, 测试角色, 现代开局配置);
    const difficultySummary = 构建世界观难度摘要([
        {
            id: 'diff_game_normal',
            类型: '难度设定',
            标题: '游戏难度 正常',
            启用: true,
            内容: '<游戏难度协议>\n定位: 标准资源压力与失败代价。\n</游戏难度协议>'
        },
        {
            id: 'diff_check_normal',
            类型: '难度设定',
            标题: '判定难度 正常',
            启用: true,
            内容: '<判定难度协议>\n定位: 标准判定窗口。\n</判定难度协议>'
        },
        {
            id: 'diff_phys_normal',
            类型: '难度设定',
            标题: '生理难度 正常',
            启用: true,
            内容: '<生理难度协议>\n定位: 标准恢复压力。\n</生理难度协议>'
        }
    ] as any);
    const context = 构建世界生成任务上下文提示词(
        seed,
        'normal',
        difficultySummary,
        '',
        现代开局配置,
        options?.directorSeedPrompt || ''
    );
    const messages = 构建世界观生成消息链({
        worldContext: context,
        charData: 测试角色,
        extraPrompt: 获取世界观生成COT提示词(现代开局配置),
        cotPseudoHistoryPrompt: 世界观生成COT伪装历史消息提示词,
        config: { 生成世界基底: true, openingConfig: 现代开局配置 },
        openingConfig: 现代开局配置
    });
    return messages.map((message) => message.content).join('\n');
};

describe('modern urban prompt guardrails', () => {
    it('现代默认 prompt 不强制生成势力数量或每轮势力互动', () => {
        const combined = [
            获取世界观生成系统提示词({ topicMode: '现代都市', 生成世界基底: true } as any),
            构建世界观种子提示词({
                worldName: '镜湖市',
                worldSize: '单城',
                dynastySetting: '现代城市',
                sectDensity: '低',
                tianjiaoSetting: '现实资源与心理韧性',
                difficulty: 'normal',
                worldExtraRequirement: ''
            } as any, {
                姓名: '沈砚',
                性别: '男',
                年龄: 22,
                出生日期: '',
                外貌: '',
                性格: '',
                力量: 5,
                敏捷: 5,
                体质: 5,
                根骨: 5,
                悟性: 5,
                福源: 5,
                天赋列表: [],
                出身背景: {}
            } as any, { 题材模式: '现代都市' } as any),
            开局变量生成附加提示词,
            开局世界演变初始化附加提示词,
            开场初始化任务提示词,
            构建变量模型职责提示词(),
            构建世界演变系统提示词(),
            世界数据结构参考,
            数值_世界演化.内容
        ].join('\n');

        expect(combined).not.toMatch(/生成\s*5-15\s*个势力/u);
        expect(combined).not.toContain('必须保证 `世界.势力列表` 不为空');
        expect(combined).not.toContain('每次世界演化至少产生 1 个势力互动事件');
        expect(combined).toContain('"势力列表": []');
        expect(combined).not.toContain('"势力列表": [\n      {"ID":"FCT-001"');
        expect(combined).toContain('没有明确组织行动或势力结构时，允许 `世界.势力列表` 为空');
        expect(combined).toMatch(/学校|公司|社团|利益集团/u);
        expect(combined).toContain('主线不是短待办');
        expect(combined).toContain('角色种子ID');
        expect(combined).not.toContain('名称固定为"诸天万界"');
        expect(combined).toContain('现代都市默认"现实世界"');
    });

    it('世界演变只保留上限和章节相关性，不再要求后台事件常态补位', () => {
        const combined = [
            构建世界演变系统提示词(),
            世界数据结构参考,
            数值_世界演化.内容
        ].join('\n');

        expect(combined).toContain('当前章目标');
        expect(combined).toContain('玩家当前体验');
        expect(combined).toContain('只保留峰值上限，不设最低常态补位目标');
        expect(combined).toContain('没有章节相关、玩家相关、女主/核心 NPC 相关、当前地点相关或玩家行动后果时');
        expect(combined).not.toMatch(/常态建议维持\s*[457]/u);
        expect(combined).not.toContain('条数不足时先补');
        expect(combined).not.toContain('低于常态时');
        expect(combined).not.toContain('再次清点普通远端活跃 NPC 是否回到 7 条左右');
    });

    it('现代世界观生成 payload 只注入一份 COT，且不注入完整难度协议', () => {
        const payload = 构建现代世界观请求文本();

        expect(计数(payload, '<世界观生成思考协议>')).toBe(1);
        expect(payload).not.toContain('<游戏难度协议>');
        expect(payload).not.toContain('<判定难度协议>');
        expect(payload).not.toContain('<生理难度协议>');
        expect(payload).toContain('【当前世界观生成难度摘要】');
    });

    it('现代世界观生成需要世界基底时不再出现只输出世界观的冲突指令', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).toContain('先输出 `<世界观>...</世界观>`');
        expect(payload).toContain('随后输出 `<世界基底>...</世界基底>`');
        expect(payload).not.toContain('只生成世界观提示词文本，并包裹在 `<世界观>...</世界观>` 中');
        expect(payload).not.toContain('`</thinking>` 之后只输出一个 `<世界观>...</世界观>` 标签块');
        expect(payload).not.toContain('好的，将先以<thinking></thinking>输出思考，再以<世界观></世界观>输出世界观正文，且不使用Markdown，不生成玩家定制内容，不做变量初始化：');
        expect(payload).toContain('本轮要求世界基底时继续输出<世界基底></世界基底>');
        expect(payload).not.toMatch(/只输出一个 `?<世界观>.*若系统要求输出/u);
    });

    it('现代世界观生成 payload 使用当前世界基底目标和都市尺度', () => {
        const seed = 构建世界观种子提示词(现代世界配置, 测试角色, 现代开局配置);
        const difficultySummary = 构建世界观难度摘要(默认提示词);
        const context = 构建世界生成任务上下文提示词(
            seed,
            'normal',
            difficultySummary,
            '',
            现代开局配置
        );
        const payload = 构建世界观生成消息链({
            worldContext: context,
            charData: 测试角色,
            extraPrompt: 获取世界观生成COT提示词(现代开局配置),
            cotPseudoHistoryPrompt: 世界观生成COT伪装历史消息提示词,
            config: { 生成世界基底: true, openingConfig: 现代开局配置 },
            openingConfig: 现代开局配置
        }).map((message) => message.content).join('\n');

        expect(payload).toContain('生成目标: 生成 world_prompt，并在启用世界基底扩展时追加世界基底 JSON');
        expect(payload).toContain('寰宇层为现实世界，大地点为当前城市或都市圈');
    });

    it('现代世界观生成默认偏角色扮演剧情沙盒，不把社会冲突写成主舞台', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).toContain('原创现代都市角色扮演剧情沙盒');
        expect(payload).toContain('默认偏后宫恋爱轻喜剧、都市日常、人物路线和轻量故事牵引');
        expect(payload).toContain('现实制度、金钱、交通和法律只作为可信底座与行动边界');
        expect(payload).toContain('除非玩家世界观草稿与细化要求明确要求');
        expect(payload).toContain('熟人误会、家庭期待、角色间竞争、邀约错位、秘密暴露、临时求助、边界试探和轻量尴尬');
        expect(payload).toContain('不要把犯罪、黑市、家暴、勒索、政治丑闻或商业阴谋写成默认主舞台');
        expect(payload).not.toContain('家庭/朋友起哄');
    });

    it('现代世界观生成避免纪实城市报告和默认街景堆砌', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).toContain('不要把世界观写成纪实城市报告');
        expect(payload).toContain('不要把普通街道、小贩/摊贩、通勤、社区治理或城市管理细节写成默认取景清单');
        expect(payload).toContain('世界观应提供可反复进入的地点、可遇见人物、人物路线土壤、轻量秘密、关系冲突源、生活小目标和长期未完全说破的背景事实');
        expect(payload).not.toContain('成人游乐场');
        expect(payload).not.toMatch(/(^|[^A-Za-z])RP([^A-Za-z]|$)/u);
    });

    it('现代世界观生成把城市治理结构降为背景支撑层', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).toContain('城市治理、行政区划、公共服务网络等治理结构只作为背景支撑层');
        expect(payload).toContain('默认优先写可反复进入的地点、常驻或可遇见人物类型、人物路线土壤、轻量秘密、关系摩擦与生活小目标');
        expect(payload).toContain('不要默认展开行政区划、政府部门、社区治理、城市管理、治安体系、产业结构或公共服务网络');
        expect(payload).toContain('人物圈层与可接触机构');
        expect(payload).not.toContain('组织/圈层版图');
    });

    it('现代默认配置锚定角色扮演剧情沙盒，不再默认朋友起哄', () => {
        const profile = 题材模式配置表.现代都市;
        const preset = 开局预设方案列表.find((item) => item.id === 'builtin_modern_city');
        const combined = JSON.stringify([profile.worldDefaults, profile.mapPrompt, profile.promptLines, preset?.worldConfig]);

        expect(combined).toContain('原创现代都市角色扮演剧情沙盒');
        expect(combined).toContain('人物路线');
        expect(combined).toContain('轻量故事牵引');
        expect(combined).toContain('少量秘密地点');
        expect(combined).toContain('治理结构只作为背景支撑层');
        expect(combined).not.toContain('家庭/朋友起哄');
    });

    it('现代世界观生成正文结构不暴露 DM 元话语', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).not.toContain('DM 可用运行逻辑');
        expect(payload).not.toContain('DM 能立即调用');
        expect(payload).not.toContain('事件联动与剧情推进逻辑');
    });

    it('现代世界观生成压缩经济制度说明，避免宏观经济报告口径', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).toContain('经济、制度、法律和交通只作为行动边界');
        expect(payload).toContain('不要展开宏观经济循环');
        expect(payload).toContain('不要把工资、房租、合同、信用记录写成主要篇幅');
        expect(payload).toContain('禁止写入“后续世界演化会自动生成”这类系统元话语');
        expect(payload).not.toContain('经济如何运转');
        expect(payload).not.toContain('现金流、舆论与法律后果如何影响个人命运');
    });

    it('世界观阶段难度摘要使用现代风险口径，不暴露旧生理协议标题', () => {
        const summary = 构建世界观难度摘要([
            { id: 'diff_game_normal', 类型: '难度设定', 标题: '游戏难度 正常', 启用: true, 内容: '<游戏难度协议>\n定位: 标准资源压力与失败代价。\n</游戏难度协议>' },
            { id: 'diff_check_normal', 类型: '难度设定', 标题: '判定难度 正常', 启用: true, 内容: '<判定难度协议>\n定位: 标准判定窗口。\n</判定难度协议>' },
            { id: 'diff_phys_normal', 类型: '难度设定', 标题: '生理难度 正常', 启用: true, 内容: '<生理难度协议>\n定位: 标准恢复压力。\n</生理难度协议>' }
        ] as any);

        expect(summary).toContain('日常压力');
        expect(summary).toContain('资源压力');
        expect(summary).not.toMatch(/生理难度|生理协议|江湖压力|修炼/u);
    });

    it('现代主剧情难度摘要使用过滤后口径，不暴露旧武侠或关闭的生理难度', () => {
        const summary = 构建主剧情难度摘要提示词([
            { id: 'diff_game_normal', 类型: '难度设定', 标题: '游戏难度：正常', 启用: true, 内容: '<游戏难度协议>\n定位: 本项目标准难度，强调真实江湖生存与代价。\n</游戏难度协议>' },
            { id: 'diff_check_normal', 类型: '难度设定', 标题: '判定难度：正常', 启用: true, 内容: '<判定难度协议>\n定位: 标准武侠判定窗口。\n</判定难度协议>' },
            { id: 'diff_phys_normal', 类型: '难度设定', 标题: '生理难度：正常', 启用: true, 内容: '<生理难度协议>\n定位: 本项目标准生理难度，强调持续生存压力。\n</生理难度协议>' }
        ], {
            gameConfig: {
                启用成长体系: false,
                启用饱腹口渴系统: false
            } as any
        });

        expect(summary).toContain('【当前难度摘要】');
        expect(summary).toContain('综合难度');
        expect(summary).toContain('判定窗口');
        expect(summary).not.toMatch(/武侠|江湖|修炼|宗门|门派|生理难度|diff_phys|真实江湖/u);
    });

    it('初始世界生成可注入导演和未转正种子弱约束，但禁止当作世界观事实输出', () => {
        const config = 规范化导演配置({
            玩家剧情倾向: '慢热合租与校园关系，不急着进入主线大事件。',
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友，表面疏离但会被长期照顾打动。',
                完整设定: '新闻系研究生，家庭债务压力很重。',
                关系入口标签: ['合租', '校园'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        } as any);
        const weakPrompt = 构建世界生成导演种子弱约束提示词(config);
        const payload = 构建现代世界观请求文本({ directorSeedPrompt: weakPrompt });

        expect(weakPrompt).toContain('【世界生成导演/角色种子弱约束】');
        expect(weakPrompt).toContain('慢热合租与校园关系');
        expect(weakPrompt).toContain('角色种子ID：seed-roommate');
        expect(weakPrompt).toContain('不强制登场');
        expect(weakPrompt).toContain('不得把角色种子ID、完整角色卡或未登场角色事实写入 `<世界观>`');
        expect(weakPrompt).not.toContain('家庭债务压力很重');
        expect(payload).toContain('角色种子ID：seed-roommate');
    });

    it('显式武侠题材仍保留武侠世界观能力，不受现代禁词断言约束', () => {
        const systemPrompt = 获取世界观生成系统提示词(
            { 生成世界基底: true } as any,
            { 题材模式: '武侠' } as any
        );

        expect(systemPrompt).toMatch(/武侠|江湖|门派/u);
    });

    it('开局与变量 prompt 明确普通现代随身物不进背包，并保留可追踪例外', () => {
        const combined = [
            开场初始化任务提示词,
            开局变量生成附加提示词,
            构建变量模型职责提示词()
        ].join('\n');

        expect(combined).toContain('普通手机、校园卡、交通卡、门禁卡、身份证件、钱包、银行卡、钥匙、笔记本电脑、普通衣物');
        expect(combined).toContain('默认只作为生活背景、身份凭证或操作入口');
        expect(combined).toContain('不得写入 `角色.物品列表` 或装备栏');
        expect(combined).toContain('不能因为');
        expect(combined).toContain('任务道具');
        expect(combined).not.toMatch(/只有[^。]*(任务道具|当前要操作\/交付的对象)/u);
        expect(combined).toMatch(/剧情证据|工作配发|加密数据|损坏状态|可交付物|被夺\/遗失\/扣押对象|明确金额现金/u);
        expect(combined).toContain('角色.金钱.baseAmount');
        expect(数值_物品属性.内容).toContain('不因出现在预设清单、正文或变量规划中就写入背包');
    });

    it('世界观提示词预览与真实请求共享同一份 COT 和消息拼装规则', () => {
        const payload = 构建现代世界观请求文本();
        const preview = 构建开局世界观生成提示词预览({
            worldConfig: 现代世界配置,
            charData: 测试角色,
            openingConfig: 现代开局配置,
            gameConfig: {},
            prompts: []
        });

        expect(计数(preview, '<世界观生成思考协议>')).toBe(1);
        expect(preview).toContain('【当前世界观生成难度摘要】');
        expect(preview).not.toContain('【额外要求提示词】');
        expect(preview).not.toContain('<游戏难度协议>');
        expect(preview).toContain(获取世界观生成COT提示词(现代开局配置));
        expect(payload).toContain(获取世界观生成COT提示词(现代开局配置));
    });

    it('世界观提示词预览与真实请求同样注入导演种子弱约束', () => {
        const 导演配置 = 规范化导演配置({
            玩家剧情倾向: '慢热合租与校园关系，不急着进入主线大事件。',
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友，表面疏离但会被长期照顾打动。',
                完整设定: '新闻系研究生，家庭债务压力很重。',
                关系入口标签: ['合租', '校园'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        } as any);
        const openingConfig = { ...现代开局配置, 导演配置 } as any;
        const weakPrompt = 构建世界生成导演种子弱约束提示词(导演配置);
        const seed = 构建世界观种子提示词(现代世界配置, 测试角色, openingConfig);
        const context = 构建世界生成任务上下文提示词(
            seed,
            'normal',
            构建世界观难度摘要(默认提示词),
            '',
            openingConfig,
            weakPrompt
        );
        const payload = 构建世界观生成消息链({
            worldContext: context,
            charData: 测试角色,
            extraPrompt: 获取世界观生成COT提示词(openingConfig),
            cotPseudoHistoryPrompt: 世界观生成COT伪装历史消息提示词,
            config: { 生成世界基底: true, openingConfig },
            openingConfig
        }).map((message) => message.content).join('\n');
        const preview = 构建开局世界观生成提示词预览({
            worldConfig: 现代世界配置,
            charData: 测试角色,
            openingConfig,
            gameConfig: {},
            prompts: 默认提示词
        });

        expect(payload).toContain('角色种子ID：seed-roommate');
        expect(preview).toContain('角色种子ID：seed-roommate');
        expect(preview).toContain('不得把角色种子ID、完整角色卡或未登场角色事实写入 `<世界观>`');
        expect(preview).not.toContain('家庭债务压力很重');
    });

    it('现代默认上下文投影会裁剪旧成长体系字段', () => {
        const trimmed = 裁剪成长体系上下文数据({
            角色: {
                姓名: '沈砚',
                境界: '开脉境',
                境界层级: 1,
                当前内力: 20,
                最大内力: 30,
                修炼体系: '旧武侠'
            },
            社交: [{
                姓名: '林知夏',
                境界: '凡人',
                当前内力: 0
            }],
            任务列表: [{
                标题: '调查',
                推荐境界: '炼气'
            }]
        } as any, { 启用成长体系: false } as any);

        const serialized = JSON.stringify(trimmed);
        expect(serialized).not.toMatch(/境界|内力|修炼/u);
        expect(serialized).toContain('沈砚');
        expect(serialized).toContain('林知夏');
    });

    it('核心时间推进法则使用现代时间口径，不携带古法换算表', () => {
        const content = 核心_时间推进法则.内容;

        expect(content).toContain('YYYY:MM:DD:HH:MM');
        expect(content).toMatch(/分钟|小时|上午|下午|晚上/u);
        expect(content).not.toMatch(/古法换算|时辰映射|一炷香|半炷香|炷香|盏茶|子\s*23:00|打坐调息|闭关|疗伤修养/u);
    });

    it('主剧情 COT 和输出格式使用现代中性措辞', () => {
        const combined = [
            构建主剧情COT内容(),
            构建女主主COT内容({ ntl: false }),
            构建女主主COT内容({ ntl: true }),
            获取开局思维链提示词({}),
            核心_判定思维链.内容,
            核心_输出格式.内容
        ].join('\n');

        expect(combined).toMatch(/能力边界|组织与任务初始化|能力成长/u);
        expect(核心_输出格式.内容).toContain('《证据录音》');
    });

    it('主剧情、女主与开局 COT 均要求优先匹配可用角色种子但不强行登场', () => {
        [
            构建主剧情COT内容(),
            构建女主主COT内容({ ntl: false }),
            获取开局思维链提示词({})
        ].forEach((content) => {
            expect(content).toContain('角色种子');
            expect(content).toMatch(/匹配.*角色种子/u);
            expect(content).toMatch(/无匹配|没有匹配|无可用/u);
        });
    });

    it('开局主剧情和开局变量生成都会注入角色种子所在的导演配置提示词', () => {
        const source = readFileSync('hooks/useGame/openingStoryWorkflow.ts', 'utf8');

        expect(source).toContain('openingContext.contextPieces.题材模式提示词');
        expect(source).toContain('openingContext.contextPieces.玩家剧情倾向提示词');
        expect(source).toContain('openingContext.contextPieces.导演配置提示词');
        expect(source).toMatch(/variableExtraPrompt[\s\S]*openingContext\.contextPieces\.导演配置提示词/u);
    });

    it('现代开局任务 prompt 要求一周内可推进，不把学期级目标直接作为首条目标', () => {
        const rendered = 渲染模式运行时配置世界书内容(构建官方模式运行时配置('现代都市'));
        const combined = [
            开场初始化任务提示词,
            构建变量模型职责提示词(),
            rendered
        ].join('\n');

        expect(combined).toContain('1 周以内可完成或至少阶段性推进');
        expect(combined).toContain('完成整个学期');
        expect(combined).toContain('不能直接写成首条目标');
        expect(rendered).not.toContain('长期目标推进主线');
    });

    it('文章优化附加格式示例不再把普通手机作为档案引用锚点', () => {
        const source = readFileSync('hooks/useGame/bodyPolish.ts', 'utf8');

        expect(source).not.toContain('《智能手机》');
        expect(source).toContain('《证据录音》');
    });

    it('默认现代写作与润色 prompt 使用现代都市口径', () => {
        const combined = [
            写作_风格.内容,
            默认文章优化提示词,
            开场初始化任务提示词,
            数值_NPC参考.内容,
            数值_世界演化.内容
        ].join('\n');

        expect(combined).toMatch(/现代都市|现实压力|组织|能力边界|社会边界/u);
    });

    it('默认写作文风只保留成人轻信标，不常驻显式成人词汇表或古风小说参考', () => {
        const content = 写作_风格.内容;

        expect(content).toContain('题材优先');
        expect(content).toContain('不是固定道具清单');
        expect(content).toContain('人物关系、玩家选择和故事推进');
        expect(content).toContain('普通街道、小贩/摊贩、通勤和社区琐事只在当前地点或已成立事实需要时少量出现');
        expect(content).toMatch(/成年人自愿亲密|成人内容/u);
        expect(content).not.toMatch(/参考.*古风|古言|武侠小说|古风小说/u);
        expect(content).not.toMatch(/肉棒|龟头|阴茎|小穴|阴蒂|蜜液|精液|穴口|臀缝/u);
        expect(content).not.toMatch(/手机.*门禁.*地铁.*监控/u);
    });

    it('内置提示词包含独立世界观摘要槽位', () => {
        expect(核心_世界观摘要.id).toBe('core_world_summary');
        expect(核心_世界观摘要.内容).toContain('开局后此处会被替换为本局世界观摘要');
    });

    it('现代运行时配置摘要不暴露旧成长体系 copy', () => {
        const profile = 构建官方模式运行时配置('现代都市');
        const rendered = 渲染模式运行时配置世界书内容(profile);

        expect(rendered).not.toMatch(/属性点或境界变化|修炼=否|境界变化/u);
        expect(rendered).not.toContain('门派起手');
        expect(rendered).toContain('特殊成长=否');
        expect(rendered).toContain('切入=日常低压、在途起手、家宅起手、风波前夜');
        expect(rendered).toContain('可分配点数或能力成长');
    });

    it('现代开局配置 prompt 使用题材化切入文案', () => {
        const prompt = 构建开局配置提示词({
            配置约束启用: true,
            题材模式: '现代都市',
            初始关系模板: '独行少系',
            关系侧重: ['师门', '利益'],
            开局切入偏好: '门派起手',
            开局生成组织: false,
            开局生成成员: false,
            允许生成性别: ['男', '女', '男娘', '扶她'],
            生成性别锁定: false,
            初始伙伴: { enabled: false }
        } as any);

        expect(prompt).toContain('开局切入偏好：组织起手');
        expect(prompt).toContain('关系侧重：职场、合作');
        expect(prompt).toContain('公司、学校、社区、项目组、门店或合作现场');
    });

    it('现代变量相关规则保留当前登记表边界说明', () => {
        const prompt = 构建变量相关规则提示词({
            promptPool: 默认提示词,
            gameConfig: {
                启用成长体系: false,
                启用NSFW模式: false,
                启用饱腹口渴系统: true
            } as any
        });

        expect(prompt).toContain('旧坐标字段已废弃');
    });

    it('现代变量与行动选项 payload 保留现代示例锚点', () => {
        const rendered = 渲染模式运行时配置世界书内容(构建官方模式运行时配置('现代都市'));
        const combined = [
            构建变量模型职责提示词(),
            开局变量生成附加提示词,
            变量生成COT提示词,
            数值_NPC参考.内容,
            构建变量相关规则提示词({
                promptPool: [],
                gameConfig: {
                    启用成长体系: false,
                    启用NSFW模式: false,
                    启用饱腹口渴系统: false
                } as any
            }),
            核心_行动选项规范.内容,
            构建女性姓名黑名单提示词(),
            rendered
        ].join('\n');

        expect(combined).toContain('现代都市');
        expect(combined).toContain('现实压力');
        expect(combined).toContain('观察宿舍走廊');
        expect(combined).toContain('查看兼职群消息');
    });

    it('女性 NPC 命名提示只注入现代正例，不注入模板名反例', () => {
        const combined = [
            构建变量模型职责提示词(),
            数值_NPC参考.内容,
            构建女性姓名黑名单提示词()
        ].join('\n');

        expect(combined).toContain('女性 NPC 命名风格');
        expect(combined).toContain('林知夏');
        expect(combined).toContain('顾明澜');
        expect(combined).not.toMatch(/女性新角色姓名黑名单|女性姓名黑名单|女性模板姓名黑名单/u);
        expect(combined).not.toMatch(/苏婉儿|苏婉清|林婉儿|若嫣|清雪|婉儿|灵儿|月儿|芷若/u);
    });
});
