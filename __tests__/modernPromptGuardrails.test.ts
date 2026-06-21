import { describe, expect, it } from 'vitest';
import { 获取世界观生成系统提示词, 构建世界观生成消息链 } from '../prompts/runtime/worldGeneration';
import { 获取世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../prompts/runtime/worldGenerationCot';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词, 构建世界观难度摘要 } from '../prompts/runtime/worldSetup';
import { 开局变量生成附加提示词 } from '../prompts/runtime/openingVariableGenerationInit';
import { 开局世界演变初始化附加提示词 } from '../prompts/runtime/openingWorldEvolutionInit';
import { 开场初始化任务提示词 } from '../prompts/runtime/opening';
import { 构建变量模型职责提示词 } from '../prompts/runtime/variableModel';
import { 构建世界演变系统提示词 } from '../prompts/runtime/worldEvolution';
import { 世界数据结构参考 } from '../prompts/runtime/worldDataSchema';
import { 核心_输出格式 } from '../prompts/core/format';
import { 构建主剧情COT内容 } from '../prompts/core/cot';
import { 构建女主主COT内容 } from '../prompts/core/cotHeroine';
import { 获取开局思维链提示词 } from '../prompts/core/cotOpening';
import { 核心_判定思维链 } from '../prompts/core/cotJudge';
import { 核心_时间推进法则 } from '../prompts/core/timeProgress';
import { 核心_世界观摘要 } from '../prompts/core/worldSummary';
import { 写作_风格 } from '../prompts/writing/style';
import { 写作_避免极端情绪 } from '../prompts/writing/emotionGuard';
import { 写作_防止说话 } from '../prompts/writing/noControl';
import { 写作_防全知 } from '../prompts/writing/antiOmniscient';
import { 默认文章优化提示词 } from '../prompts/runtime/defaults';
import { 数值_世界演化 } from '../prompts/stats/world';
import { 数值_NPC参考 } from '../prompts/stats/npc';
import { 构建开局世界观生成提示词预览 } from '../utils/worldGenerationPromptPreview';
import { 裁剪成长体系上下文数据 } from '../utils/promptFeatureToggles';
import { 构建官方模式运行时配置, 渲染模式运行时配置世界书内容 } from '../utils/modeRuntimeProfile';
import { 规范化导演配置, 构建世界生成导演种子弱约束提示词 } from '../utils/directorConfig';

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
            构建世界演变系统提示词({ topicMode: '现代都市' } as any),
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

    it('现代世界观生成 payload 只注入一份 COT，且不注入完整难度协议', () => {
        const payload = 构建现代世界观请求文本();

        expect(计数(payload, '<世界观生成思考协议>')).toBe(1);
        expect(payload).not.toContain('<游戏难度协议>');
        expect(payload).not.toContain('<判定难度协议>');
        expect(payload).not.toContain('<生理难度协议>');
        expect(payload).toContain('【当前世界观生成难度摘要】');
    });

    it('现代世界观生成 payload 不携带旧武侠默认触发词', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).not.toMatch(/WuXia|武侠口径|江湖叙事|门派|宗门|朝廷|诸天万界|九州/u);
        expect(payload).toMatch(/城市制度|职业压力|家庭关系|现实资源|组织\/圈层|法律后果/u);
    });

    it('现代世界观生成需要世界基底时不再出现只输出世界观的冲突指令', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).toContain('先输出 `<世界观>...</世界观>`');
        expect(payload).toContain('随后输出 `<世界基底>...</世界基底>`');
        expect(payload).not.toContain('只生成世界观提示词文本，并包裹在 `<世界观>...</世界观>` 中');
        expect(payload).not.toMatch(/只输出一个 `?<世界观>.*若系统要求输出/u);
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

        expect(combined).toContain('普通手机、钱包、银行卡、钥匙、笔记本电脑、普通衣物');
        expect(combined).toContain('默认只作为生活背景');
        expect(combined).toContain('不得写入 `角色.物品列表` 或装备栏');
        expect(combined).toMatch(/剧情证据|任务道具|工作配发|加密数据|损坏状态|可交付物|明确金额现金/u);
        expect(combined).toContain('角色.金钱.baseAmount');
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

        expect(combined).not.toMatch(/武力梯度|招式|礼法|境界推进|门派与任务初始化|门派状态|修炼状态/u);
        expect(combined).toMatch(/能力边界|组织与任务初始化|能力成长/u);
    });

    it('默认现代写作与润色 prompt 不再使用旧武侠文风锚点', () => {
        const combined = [
            写作_风格.内容,
            默认文章优化提示词,
            开场初始化任务提示词,
            数值_NPC参考.内容,
            数值_世界演化.内容
        ].join('\n');

        expect(combined).not.toMatch(/雪中悍刀行|世子很凶|娱乐春秋|江湖压迫|朝堂气势|不能滑成现代段子|武侠\/古风|古法换算/u);
        expect(combined).toMatch(/现代都市|现实压力|组织|能力边界|社会边界/u);
    });

    it('默认写作文风只保留成人轻信标，不常驻显式成人词汇表或古风小说参考', () => {
        const content = 写作_风格.内容;

        expect(content).toContain('题材优先');
        expect(content).toContain('不是固定道具清单');
        expect(content).toMatch(/成年人自愿亲密|成人内容/u);
        expect(content).not.toMatch(/参考.*古风|古言|武侠小说|古风小说/u);
        expect(content).not.toMatch(/肉棒|龟头|阴茎|小穴|阴蒂|蜜液|精液|穴口|臀缝/u);
        expect(content).not.toMatch(/手机.*门禁.*地铁.*监控/u);
    });

    it('活跃写作守门提示不携带普通现代默认旧锚点', () => {
        const combined = [
            写作_风格.内容,
            写作_避免极端情绪.内容,
            写作_防止说话.内容,
            写作_防全知.内容
        ].join('\n');

        expect(combined).not.toMatch(/传功|拔剑|江湖传言|茶馆议论|术法追踪|命牌|血引/u);
    });

    it('内置提示词包含独立世界观摘要槽位', () => {
        expect(核心_世界观摘要.id).toBe('core_world_summary');
        expect(核心_世界观摘要.内容).toContain('开局后此处会被替换为本局世界观摘要');
    });

    it('现代运行时配置摘要不暴露旧成长体系 copy', () => {
        const profile = 构建官方模式运行时配置('现代都市');
        const rendered = 渲染模式运行时配置世界书内容(profile);

        expect(rendered).not.toMatch(/属性点或境界变化|修炼=否|境界变化/u);
        expect(rendered).toContain('特殊成长=否');
        expect(rendered).toContain('可分配点数或能力成长');
    });
});
