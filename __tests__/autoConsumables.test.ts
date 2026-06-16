import { describe, expect, it } from 'vitest';
import { 执行自动丹药补给, 补齐自动丹药预设 } from '../utils/autoConsumables';
import { 规范化角色物品容器映射, 设置默认技艺运行时配置 } from '../hooks/useGame/stateTransforms';
import { 执行变量自动校准 } from '../hooks/useGame/variableCalibration';

const 创建角色 = (override: Record<string, any> = {}) => ({
    姓名: '测试角色',
    性别: '男',
    年龄: 16,
    境界: '开脉境',
    境界层级: 1,
    金钱: { baseAmount: 0 },
    当前精力: 4,
    最大精力: 100,
    当前内力: 25,
    最大内力: 150,
    当前饱腹: 19,
    最大饱腹: 100,
    当前口渴: 0,
    最大口渴: 100,
    当前负重: 0,
    最大负重: 100,
    力量: 0,
    敏捷: 0,
    体质: 0,
    根骨: 0,
    悟性: 0,
    福源: 0,
    头部当前血量: 10,
    头部最大血量: 10,
    胸部当前血量: 10,
    胸部最大血量: 10,
    腹部当前血量: 10,
    腹部最大血量: 10,
    左手当前血量: 10,
    左手最大血量: 10,
    右手当前血量: 10,
    右手最大血量: 10,
    左腿当前血量: 10,
    左腿最大血量: 10,
    右腿当前血量: 10,
    右腿最大血量: 10,
    装备: {},
    物品列表: [],
    能力列表: [],
    技艺: [],
    当前经验: 675,
    升级经验: 202,
    玩家BUFF: [],
    突破条件: [],
    ...override
} as any);

describe('本地自动补给禁用', () => {
    it('补齐自动丹药预设不再向空背包生成任何物品', () => {
        expect(补齐自动丹药预设([])).toEqual([]);
        expect(补齐自动丹药预设([], { 题材模式: '末日丧尸' })).toEqual([]);
        expect(补齐自动丹药预设([], { 题材模式: '无限流' })).toEqual([]);
    });

    it('补齐自动丹药预设只返回已有物品浅拷贝，不新增、不删除、不替换', () => {
        const source = [
            { ID: 'ai_water_1', 名称: '净水片', 类型: '消耗品', 堆叠数量: 1 },
            { ID: 'ai_pill_1', 名称: '回气丹', 类型: '丹药', 堆叠数量: 1 }
        ];
        const result = 补齐自动丹药预设(source, { 题材模式: '现代都市' });

        expect(result).toEqual(source);
        expect(result).not.toBe(source);
    });

    it('自动补给函数不再消耗或生成物品，也不改变角色数值和境界', () => {
        const role = 创建角色({
            物品列表: [
                { ID: 'ai_bigu', 名称: '辟谷丹', 类型: '丹药', 堆叠数量: 1, 使用效果: [{ 目标属性: '当前饱腹', 数值: 55 }] },
                { ID: 'ai_huiqi', 名称: '回气丹', 类型: '丹药', 堆叠数量: 1, 使用效果: [{ 目标属性: '当前精力', 数值: 60 }] }
            ]
        });
        const before = JSON.parse(JSON.stringify(role));
        const corrections = 执行自动丹药补给(role);

        expect(corrections).toEqual([]);
        expect(role).toEqual(before);
    });

    it('角色物品归一不会把删除过的补给品补回来', () => {
        const normalized = 规范化角色物品容器映射(创建角色({ 物品列表: [] }), { 题材模式: '无限流' });

        expect(normalized.物品列表).toEqual([]);
    });

    it('题材归一不再本地删除或替换AI已经写入的物品', () => {
        const normalized = 规范化角色物品容器映射(创建角色({
            物品列表: [
                { ID: 'ai_pojing_001', 名称: '破境丹', 类型: '丹药', 描述: 'AI生成的剧情奖励。' },
                { ID: 'ai_water_001', 名称: '净水片', 类型: '消耗品', 描述: 'AI生成的剧情奖励。' }
            ]
        }), { 题材模式: '末日丧尸' });
        const names = normalized.物品列表.map((item: any) => item.名称);

        expect(names).toEqual(expect.arrayContaining(['破境丹', '净水片']));
    });

    it('变量自动校准不会因为低资源或突破条件自动生成补给', () => {
        const role = 创建角色({ 物品列表: [] });
        const result = 执行变量自动校准({
            角色: role,
            环境: { 时间: '0001:01:01:00:00' } as any,
            社交: [],
            世界: {} as any,
            玩家组织: { ID: 'sect', 名称: '测试门派', 玩家职位: '外门弟子', 玩家贡献: 0 } as any,
            任务列表: [],
            剧情: {} as any,
            剧情规划: {} as any
        }, {
            规范化环境信息: (envLike?: any) => envLike,
            规范化社交列表: (raw?: any[]) => raw || [],
            规范化世界状态: (raw?: any) => raw || {},
            规范化组织状态: (raw?: any) => raw || {},
            规范化剧情状态: (raw?: any) => raw || {},
            规范化剧情规划状态: (raw?: any) => raw || {},
            规范化女主剧情规划状态: () => undefined,
            规范化角色物品容器映射
        });

        expect(result.state.角色.物品列表).toEqual([]);
        expect(result.state.角色.当前精力).toBe(4);
        expect(result.state.角色.境界层级).toBe(1);
    });

    it('背景代理资金会展开成现金物品，并同步统计 baseAmount', () => {
        设置默认技艺运行时配置('武侠', undefined);
        const first = 规范化角色物品容器映射(创建角色({
            出身背景: {
                名称: '名门之后',
                描述: '测试背景',
                效果: '测试效果',
                初始物品: [{ 名称: '盘缠', 描述: '出门携带的路费', 数量: 1 }]
            },
            物品列表: []
        }), { 题材模式: '武侠' });

        const second = 规范化角色物品容器映射(first as any, { 题材模式: '武侠' });

        expect(first.物品列表.some((item: any) => item.名称 === '现金')).toBe(true);
        expect(first.物品列表.some((item: any) => item.名称 === '盘缠')).toBe(false);
        expect(first.金钱).toEqual({ baseAmount: 10 });
        expect(second.金钱).toEqual(first.金钱);
    });

    it('背景开局货币支持稳定范围数量且重复归一不会变化', () => {
        设置默认技艺运行时配置('武侠', undefined);
        const first = 规范化角色物品容器映射(创建角色({
            姓名: '稳定测试',
            出身背景: {
                名称: '行商之子',
                描述: '出门会带少量盘缠。',
                效果: '具备基础经商经验。',
                开局货币: [{ 名称: '现金', 最小数量: 3, 最大数量: 8, 描述: '家中给的出行资金。', 类型: '货币:现金' }]
            },
            物品列表: []
        }), { 题材模式: '武侠' });
        const second = 规范化角色物品容器映射(first as any, { 题材模式: '武侠' });

        expect(first.金钱.baseAmount).toBeGreaterThanOrEqual(3);
        expect(first.金钱.baseAmount).toBeLessThanOrEqual(8);
        expect(second.金钱.baseAmount).toBe(first.金钱.baseAmount);
    });

    it('可选初始物品只作为提示字段保留，不由代码自动投放', () => {
        const normalized = 规范化角色物品容器映射(创建角色({
            出身背景: {
                名称: '落魄书生',
                描述: '可选携带旧书或欠条。',
                效果: '开局资产不稳定。',
                可选初始物品: [{ 名称: '旧书', 描述: '可能带在身边。' }]
            },
            物品列表: []
        }), { 题材模式: '武侠' });

        expect(normalized.出身背景.可选初始物品?.[0]?.名称).toBe('旧书');
        expect(normalized.物品列表.some((item: any) => item.名称 === '旧书')).toBe(false);
    });

    it('已有现金物品会回填到单一总账且重复归一不叠加', () => {
        const normalized = 规范化角色物品容器映射(创建角色({
            金钱: { baseAmount: 5 },
            物品列表: [
                { ID: 'money_cash', 名称: '现金', 类型: '货币:现金', 描述: '零钱。', 重量: 0, 堆叠数量: 30, 是否可堆叠: true, 当前耐久: 1, 最大耐久: 1, 价值: 1, 品质: '凡品', 词条列表: [] }
            ]
        }), { 题材模式: '武侠' });
        const second = 规范化角色物品容器映射(normalized as any, { 题材模式: '武侠' });

        expect(normalized.金钱).toEqual({ baseAmount: 30 });
        expect(second.金钱).toEqual(normalized.金钱);
    });

    it('物品栏中的 `类型: 货币:*` 可直接参与 baseAmount 汇总', () => {
        const normalized = 规范化角色物品容器映射(创建角色({
            金钱: { baseAmount: 0 },
            物品列表: [
                { ID: 'money_card', 名称: '储值卡', 类型: '货币:储值卡', 描述: '可消费余额。', 重量: 0, 堆叠数量: 2, 是否可堆叠: true, 当前耐久: 1, 最大耐久: 1, 价值: 100, 品质: '凡品', 词条列表: [] },
                { ID: 'money_cash', 名称: '现金', 类型: '货币:现金', 描述: '现金。', 重量: 0, 堆叠数量: 9, 是否可堆叠: true, 当前耐久: 1, 最大耐久: 1, 价值: 1, 品质: '凡品', 词条列表: [] }
            ]
        }), { 题材模式: '仙侠' });

        expect(normalized.金钱).toEqual({ baseAmount: 11 });
        expect(normalized.物品列表.every((item: any) => item.是否可堆叠)).toBe(true);
    });
});

describe('储物容器效果归一', () => {
    it('储物袋不应提供精力增益，而应归一为直接负重上限加成', () => {
        const normalized = 规范化角色物品容器映射({
            姓名: '测试',
            最大负重: 100,
            物品列表: [
                {
                    ID: 'bag_1',
                    名称: '储物袋',
                    描述: '可收纳一百二十斤杂物的小型法宝。',
                    类型: '法宝',
                    品质: '良品',
                    重量: 0.5,
                    堆叠数量: 1,
                    词条列表: [{ 属性: '最大精力', 数值: 20 }],
                    使用效果: [{ 目标属性: '当前精力', 数值: 20 }]
                }
            ]
        } as any);
        const bag = normalized.物品列表.find((item: any) => item.名称 === '储物袋');
        expect(bag?.容器属性).toBeUndefined();
        expect(bag?.词条列表.some((entry: any) => String(entry.属性).includes('精力'))).toBe(false);
        expect(bag?.词条列表.some((entry: any) => entry.属性 === '最大负重')).toBe(true);
        expect(bag?.使用效果.some((effect: any) => String(effect.目标属性).includes('精力'))).toBe(false);
        expect(normalized.基础最大负重).toBe(100);
        expect(normalized.储物负重加成.总计).toBeGreaterThan(0);
        expect(normalized.最大负重).toBe(100 + normalized.储物负重加成.总计);
    });

    it('储物袋和储物戒指各只取最高一个生效，并且重复归一不会反复抬高最大负重', () => {
        const normalized = 规范化角色物品容器映射({
            姓名: '测试',
            最大负重: 100,
            物品列表: [
                { ID: 'bag_1', 名称: '粗布储物袋', 描述: '负重上限 +20 斤。', 类型: '法宝', 品质: '凡品', 重量: 0.5, 堆叠数量: 1, 容器属性: { 最大容量: 20 } },
                { ID: 'bag_2', 名称: '精制储物袋', 描述: '负重上限 +50 斤。', 类型: '法宝', 品质: '良品', 重量: 0.6, 堆叠数量: 1, 容器属性: { 最大容量: 50 } },
                { ID: 'ring_1', 名称: '纳物戒', 描述: '负重上限 +80 斤。', 类型: '饰品', 品质: '上品', 重量: 0.1, 堆叠数量: 1, 容器属性: { 最大容量: 80 } },
                { ID: 'ring_2', 名称: '乾坤戒', 描述: '负重上限 +150 斤。', 类型: '饰品', 品质: '极品', 重量: 0.1, 堆叠数量: 1, 容器属性: { 最大容量: 150 } },
            ]
        } as any);

        expect(normalized.储物负重加成).toEqual({ 储物袋: 50, 储物戒指: 150, 总计: 200 });
        expect(normalized.最大负重).toBe(300);
        expect(normalized.当前负重).toBe(1.3);
        expect(normalized.物品列表.every((item: any) => !item.容器属性 && !item.当前容器ID)).toBe(true);

        const second = 规范化角色物品容器映射(normalized as any);
        expect(second.基础最大负重).toBe(100);
        expect(second.最大负重).toBe(300);
    });
});

describe('物品复核归一', () => {
    it('会把离谱的单颗丹药重量压回轻便小件，并重算负重', () => {
        const normalized = 规范化角色物品容器映射({
            姓名: '测试',
            最大负重: 180,
            物品列表: [
                {
                    ID: 'Item001',
                    名称: '避瘴丹',
                    描述: '用极品西域香料做药引熬制，能防住大多数迷烟和毒瘴。',
                    类型: '消耗品',
                    品质: '良品',
                    重量: 5,
                    堆叠数量: 50,
                    是否可堆叠: true,
                    价值: 10,
                    当前耐久: 100,
                    最大耐久: 100,
                    词条列表: []
                }
            ]
        } as any);
        const pill = normalized.物品列表.find((item: any) => item.名称 === '避瘴丹');
        expect(pill.重量).toBeLessThanOrEqual(0.2);
        expect(normalized.当前负重).toBeLessThanOrEqual(10);
    });

    it('会合并AI重复生成的同名可堆叠碎块，并忽略离谱的旧负重值', () => {
        const normalized = 规范化角色物品容器映射({
            姓名: '测试',
            当前负重: 355770,
            最大负重: 250,
            物品列表: Array.from({ length: 12 }, (_, index) => ({
                ID: `frag_${index}`,
                名称: '星纹精钢闸门碎块',
                描述: '闸门破碎后留下的精钢碎块，可作为炼器材料。',
                类型: '材料',
                品质: '良品',
                重量: 0.4,
                堆叠数量: 2,
                是否可堆叠: true,
                价值: 3,
                当前耐久: 100,
                最大耐久: 100,
                词条列表: []
            }))
        } as any);

        const fragments = normalized.物品列表.filter((item: any) => item.名称 === '星纹精钢闸门碎块');
        expect(fragments).toHaveLength(1);
        expect(fragments[0].堆叠数量).toBe(24);
        expect(normalized.当前负重).toBe(9.6);
    });

    it('会把无限流支线剧情凭证视为可堆叠资源而不是唯一任务道具', () => {
        const normalized = 规范化角色物品容器映射({
            姓名: '测试',
            当前负重: 0,
            最大负重: 250,
            物品列表: [
                { ID: 'side_d_1', 名称: 'D级支线剧情', 类型: '任务道具', 描述: '主神奖励凭证。', 重量: 0, 堆叠数量: 1, 是否可堆叠: true },
                { ID: 'side_d_2', 名称: 'D级支线剧情', 类型: '任务道具', 描述: '主神奖励凭证。', 重量: 0, 堆叠数量: 2, 是否可堆叠: true },
                { ID: 'side_c_1', 名称: 'C级支线剧情卷轴', 类型: '消耗品', 描述: '主神高级兑换资源。', 重量: 0, 堆叠数量: 1, 是否可堆叠: true },
                { ID: 'used_zero', 名称: '任务磁卡', 类型: '任务道具', 描述: '已提交的任务道具。', 重量: 0, 堆叠数量: 0, 是否可堆叠: false }
            ]
        } as any, { 题材模式: '无限流' });

        expect(normalized.物品列表.filter((item: any) => item.名称 === 'D级支线剧情')).toHaveLength(1);
        expect(normalized.物品列表.find((item: any) => item.名称 === 'D级支线剧情')?.堆叠数量).toBe(3);
        expect(normalized.物品列表.find((item: any) => item.名称 === 'D级支线剧情')?.是否可堆叠).toBe(true);
        expect(normalized.物品列表.find((item: any) => item.名称 === 'C级支线剧情卷轴')?.是否可堆叠).toBe(true);
        expect(normalized.物品列表.some((item: any) => item.名称 === '任务磁卡')).toBe(false);
    });
});
