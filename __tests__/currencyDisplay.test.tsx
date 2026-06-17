import { describe, expect, it } from 'vitest';
import {
    格式化世界观BaseAmount,
    格式化角色金钱行,
    获取世界观简短货币汇率说明,
    获取世界观货币卡片信息,
    获取世界观货币槽位,
    获取背包货币物品聚合列表,
    获取角色金钱BaseAmount,
    构建变量管理动态钱包视图,
    构建角色金钱显示快照,
    确保角色金钱BaseAmount,
    规范化角色金钱
} from '../utils/currencyDisplay';
import {
    构建官方模式运行时配置,
    渲染模式运行时配置世界书内容,
    规范化模式运行时配置
} from '../utils/modeRuntimeProfile';

describe('现代单一货币', () => {
    it('角色钱包只保留 baseAmount', () => {
        expect(规范化角色金钱({ baseAmount: 88, legacyAmount: 9 } as any)).toEqual({ baseAmount: 88 });
        expect(确保角色金钱BaseAmount({ 现金: 120 } as any)).toEqual({ baseAmount: 0 });
        expect(获取角色金钱BaseAmount({ 电子支付: 300 } as any)).toBe(0);
        expect(格式化角色金钱行({ baseAmount: 123456 })).toBe('123,456 元');
    });

    it('UI 显示只有一个元槽位', () => {
        expect(获取世界观货币槽位()).toEqual([{ key: 'baseAmount', label: '元', fullLabel: '元' }]);
        expect(格式化世界观BaseAmount(5000)).toBe('5,000 元');
        expect(获取世界观简短货币汇率说明()).toBe('单一货币，无层级换算');
        const walletCard = 获取世界观货币卡片信息(null, { 金钱: { baseAmount: 9876 } } as any);
        expect(walletCard.summary).toBe('9,876 元');
        expect(walletCard.exchangeHint).toBe('单位：元。');
        expect(`${walletCard.summary}${walletCard.exchangeHint}`).not.toContain('baseAmount');
        expect(构建角色金钱显示快照({ baseAmount: 77 })).toMatchObject({
            baseAmount: 77,
            显示: '77 元',
            货币体系: '现代单一货币',
            基础单位: '元'
        });
    });

    it('变量管理钱包和背包货币物品都汇总到元', () => {
        expect(构建变量管理动态钱包视图({ baseAmount: 42 })).toMatchObject({
            enabled: true,
            baseAmount: 42,
            formatted: '42 元',
            primaryFieldPath: '角色.金钱.baseAmount'
        });
        expect(获取背包货币物品聚合列表([
            { 名称: '现金', 类型: '货币:现金', 堆叠数量: 20, 描述: '' },
            { 名称: '银行卡', 类型: '证件', 堆叠数量: 1, 描述: '' }
        ])).toEqual([{ 类型: '货币', 分类名: '元', 名称: '元', 数量: 20, 描述: '现代单一货币。' }]);
    });

    it('运行时配置不再保留编辑字段', () => {
        const removedSystemKey = ['currency', 'System'].join('');
        const removedTierKey = ['currency', 'Tiers'].join('');
        const removedDefaultKey = ['default', 'Currency'].join('');
        const profile = 构建官方模式运行时配置('现代都市') as any;
        expect(profile.economy.accountingUnit).toBe('元');
        expect(profile.economy.primaryCurrency).toBe('元');
        expect(profile.economy[removedSystemKey]).toBeUndefined();
        expect(profile.economy[removedTierKey]).toBeUndefined();
        expect(profile.opening[removedDefaultKey]).toBeUndefined();

        const normalized = 规范化模式运行时配置({
            economy: {
                [removedSystemKey]: { id: 'legacy' },
                [removedTierKey]: { upperName: 'legacy' },
                accountingUnit: '点'
            },
            opening: {
                [removedDefaultKey]: { legacy: 1 }
            }
        } as any, '现代都市') as any;
        expect(normalized.economy.accountingUnit).toBe('元');
        expect(normalized.economy[removedSystemKey]).toBeUndefined();
        expect(normalized.economy[removedTierKey]).toBeUndefined();
        expect(normalized.opening[removedDefaultKey]).toBeUndefined();
        expect(渲染模式运行时配置世界书内容(normalized)).toContain('货币=元');
    });
});
