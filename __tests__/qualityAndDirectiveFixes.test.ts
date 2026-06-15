import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 标准化能力列表, 规范化社交列表 } from '../hooks/useGame/stateTransforms';
import { 执行正文润色 } from '../hooks/useGame/bodyPolish';
import * as textAIService from '../services/ai/text';
import { 获取题材模式配置 } from '../utils/topicModeProfiles';
import { 获取题材界面文案 } from '../utils/resourceLabels';
import { 创建开场基础状态 } from '../hooks/useGame/storyState';

vi.mock('../services/ai/text', () => ({
    generatePolishedBody: vi.fn(),
    StoryResponseParseError: class StoryResponseParseError extends Error {}
}));

vi.mock('../utils/apiConfig', () => ({
    获取文章优化接口配置: vi.fn(() => ({
        apiKey: 'test-key',
        model: 'test-model',
        baseUrl: 'https://example.com',
        供应商: 'openai',
        协议覆盖: 'auto'
    })),
    接口配置是否可用: vi.fn(() => true)
}));

describe('能力品质校准', () => {
    it('会把高品质能力补成匹配的数值和效果结构', () => {
        const list = 标准化能力列表([
            {
                ID: 'k1',
                名称: '太虚剑典',
                类型: '外功',
                品质: '绝世',
                描述: '很强的剑法',
                当前重数: 1,
                最高重数: 2,
                升级经验: 30,
                基础伤害: 5,
                加成系数: 0.1,
                内力系数: 0.1,
                附带效果: [],
                被动修正: [],
                重数描述映射: [],
                境界特效: []
            }
        ]);

        expect(list).toHaveLength(1);
        const kungfu = list[0];
        expect(kungfu.最高重数).toBeGreaterThanOrEqual(10);
        expect(kungfu.升级经验).toBeGreaterThanOrEqual(650);
        expect(kungfu.基础伤害).toBeGreaterThanOrEqual(65);
        expect(kungfu.加成系数).toBeGreaterThanOrEqual(1.75);
        expect(kungfu.内力系数).toBeGreaterThanOrEqual(1.2);
        expect(kungfu.圆满效果).toContain('绝世');
        expect(kungfu.重数描述映射.length).toBeGreaterThan(0);
        expect(kungfu.附带效果.length + kungfu.被动修正.length).toBeGreaterThan(0);
    });

    it('能力重数提升会同步抬高能力数值下限', () => {
        const base = {
            ID: 'k2',
            名称: '小周天心法',
            类型: '外功',
            品质: '上品',
            当前熟练度: 0,
            升级经验: 260,
            基础伤害: 24,
            加成系数: 1.05,
            内力系数: 0.55,
            被动修正: [{ 属性名: '根骨', 数值: 6, 类型: '百分比' }],
            附带效果: [{ 名称: '气息调匀', 触发概率: '16%', 持续时间: '1回合', 数值参数: '6', 生效间隔: '每次施展' }],
            重数描述映射: [],
            境界特效: []
        };
        const low = 标准化能力列表([{ ...base, 当前重数: 1, 最高重数: 6 }])[0];
        const high = 标准化能力列表([{ ...base, 当前重数: 5, 最高重数: 6 }])[0];

        expect(high.基础伤害).toBeGreaterThan(low.基础伤害);
        expect(high.加成系数).toBeGreaterThan(low.加成系数);
        expect(high.内力系数).toBeGreaterThan(low.内力系数);
        expect(high.被动修正[0].数值).toBeGreaterThan(low.被动修正[0].数值);
    });
});

describe('NPC 指令字段保留', () => {
    it('不会在规范化时丢掉当前任务和去向字段', () => {
        const list = 规范化社交列表([
            {
                id: 'npc_1',
                姓名: '沈青岚',
                身份: '同伴',
                当前任务: '去东门接应',
                行动意图: '前往东门',
                待执行指令: '先去东门等候',
                指令来源: '玩家',
                指令时间: '2026-05-23 13:00',
                预期汇合地点: '临安城东门',
                是否在场: false
            }
        ]);

        expect(list[0]).toMatchObject({
            当前任务: '去东门接应',
            行动意图: '前往东门',
            待执行指令: '先去东门等候',
            指令来源: '玩家',
            指令时间: '2026-05-23 13:00',
            预期汇合地点: '临安城东门'
        });
    });
});

describe('正文优化重试', () => {
    beforeEach(() => {
        vi.mocked(textAIService.generatePolishedBody).mockReset();
    });

    it('在第一次扩写仍偏短时会自动再试一次并接受达标结果', async () => {
        vi.mocked(textAIService.generatePolishedBody)
            .mockResolvedValueOnce({
                bodyText: '短文草稿短文草稿短文草稿短文草稿短文草稿短文草稿短文草稿短文草稿',
                rawText: 'first'
            } as any)
            .mockResolvedValueOnce({
                bodyText: '这是一段足够长的扩写正文。'.repeat(20),
                rawText: 'second'
            } as any);

        const result = await 执行正文润色(
            { logs: [{ sender: '旁白', text: '原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文' }] } as any,
            '<正文>原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文</正文>',
            {
                apiConfig: {
                    功能模型占位: {
                        文章优化独立模型开关: true,
                        文章优化使用模型: 'test-model',
                        文章优化API地址: 'https://example.com',
                        文章优化API密钥: 'test-key'
                    }
                },
                prompts: [],
                gameConfig: {},
                环境: {} as any,
                剧情: {} as any,
                社交: [],
                战斗: {} as any,
                角色: {} as any,
                文章优化已开启: true,
                深拷贝: (value: any) => JSON.parse(JSON.stringify(value))
            } as any,
            { allowExpansionForLength: true, minLength: 80 }
        );

        expect(vi.mocked(textAIService.generatePolishedBody)).toHaveBeenCalledTimes(2);
        expect(result.applied).toBe(true);
        expect(result.response.body_optimized).toBe(true);
        expect(result.rawText).toBe('second');
    });

    it('发现协议确认句复读污染时会打断并自动重试一次', async () => {
        const pollutedRaw = [
            '好的，将以<正文></正文>包裹正文，并且本次会在<短期记忆>、<变量规划>、<剧情规划>等回合标签之后输出<行动选项></行动选项>，<正文>前以<thinking>作为开头进行思考并以</thinking>闭合：',
            '好的，将以<正文></正文>包裹正文，并且本次会在<短期记忆>、<变量规划>、<剧情规划>等回合标签之后输出<行动选项></行动选项>，<正文>前以<thinking>作为开头进行思考并以</thinking>闭合：'
        ].join('\n');

        vi.mocked(textAIService.generatePolishedBody)
            .mockResolvedValueOnce({
                bodyText: '',
                rawText: pollutedRaw
            } as any)
            .mockResolvedValueOnce({
                bodyText: '这是一段修复后的正文。'.repeat(12),
                rawText: 'second'
            } as any);

        const result = await 执行正文润色(
            { logs: [{ sender: '旁白', text: '原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文' }] } as any,
            '<正文>原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文原始正文</正文>',
            {
                apiConfig: {
                    功能模型占位: {
                        文章优化独立模型开关: true,
                        文章优化使用模型: 'test-model',
                        文章优化API地址: 'https://example.com',
                        文章优化API密钥: 'test-key'
                    }
                },
                prompts: [],
                gameConfig: {},
                环境: {} as any,
                剧情: {} as any,
                社交: [],
                战斗: {} as any,
                角色: {} as any,
                文章优化已开启: true,
                深拷贝: (value: any) => JSON.parse(JSON.stringify(value))
            } as any,
            { minLength: 80 }
        );

        expect(vi.mocked(textAIService.generatePolishedBody)).toHaveBeenCalledTimes(2);
        expect(vi.mocked(textAIService.generatePolishedBody).mock.calls[0][5]).toBe('');
        expect(result.applied).toBe(true);
        expect(result.response.logs?.[0]?.text).toContain('修复后的正文');
        expect(result.rawText).toBe('second');
    });
});

describe('无限流商城文案边界', () => {
    it('外部市场入口叫主神商城，团队内部兑换叫团队商城', () => {
        const profile = 获取题材模式配置('无限流');
        const labels = 获取题材界面文案('无限流');

        expect(profile.auctionName).toBe('主神商城');
        expect(labels.菜单.retiredMarket).toBe('主神商城');
        expect(labels.组织.商城).toBe('团队商城');
    });

    it('侧栏和弹窗标题使用无限流口径', () => {
        const labels = 获取题材界面文案('无限流');

        expect(labels.标题.系统菜单题头).toBe('主控');
        expect(labels.标题.地图).toBe('任务地图');
        expect(labels.标题.任务).toBe('主神任务');
        expect(labels.标题.能力).toBe('能力档案');
        expect(labels.标题.任务发布字段).toBe('主神发布');
    });

    it('无限流开局默认任务和能力不会退回武侠模板', () => {
        const base = 创建开场基础状态(
            {
                姓名: '陈默',
                境界: '新人轮回者',
                当前精力: 20,
                最大精力: 20,
                当前内力: 0,
                最大内力: 0,
                能力列表: [
                    {
                        ID: 'bad_wuxia_skill',
                        名称: '基础剑法残卷',
                        类型: '外功',
                        品质: '凡品',
                        描述: '旧江湖剑法。',
                        来源: '藏经阁',
                        当前重数: 1,
                        最高重数: 3,
                        当前熟练度: 0,
                        升级经验: 100,
                        突破条件: '勤修',
                        境界限制: '无',
                        大成方向: '剑法',
                        圆满效果: '提升内力',
                        武器限制: [],
                        消耗类型: '内力',
                        消耗数值: 0,
                        施展耗时: '1息',
                        冷却时间: '0息',
                        基础伤害: 0,
                        加成属性: '力量',
                        加成系数: 0,
                        内力系数: 1,
                        伤害类型: '物理',
                        目标类型: '自身',
                        最大目标数: 1,
                        重数描述映射: [],
                        附带效果: [],
                        被动修正: [],
                        境界特效: []
                    }
                ]
            } as any,
            {} as any,
            {
                题材模式: '无限流',
                开局生成门派: true,
                开局生成同门: false
            } as any
        );

        const skillText = JSON.stringify(base.角色.能力列表 || []);
        const taskText = JSON.stringify(base.任务列表 || []);

        expect(skillText).toContain('精神力扫描');
        expect(skillText).not.toContain('基础剑法残卷');
        expect(skillText).not.toContain('藏经阁');
        expect(taskText).toContain('主神');
        expect(taskText).toContain('主神任务倒计时');
        expect(taskText).not.toContain('初入江湖');
        expect(taskText).not.toContain('D级支线剧情');
        expect(taskText).not.toContain('确认第一项主线任务');
    });
});
