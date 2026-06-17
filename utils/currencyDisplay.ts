import type { OpeningConfig, 角色数据结构 } from '../types';
import type { 角色金钱 } from '../models/character';

export type 货币字段键 = 'baseAmount';

export type 货币槽位配置 = {
    key: 货币字段键;
    label: string;
    fullLabel: string;
};

export type 世界观货币卡片信息 = {
    title: string;
    summary: string;
    exchangeHint: string;
};

export type 角色金钱世界观显示快照 = {
    baseAmount: number;
    显示: string;
    货币体系?: string;
    基础单位?: string;
};

export type 变量管理动态钱包视图 = {
    enabled: boolean;
    baseAmount: number;
    formatted: string;
    systemName: string;
    baseUnitLabel: string;
    primaryFieldPath: '角色.金钱.baseAmount';
};

export type 货币物品聚合信息 = {
    类型: string;
    分类名: string;
    名称: string;
    数量: number;
    描述: string;
};

const 单一货币单位 = '元';

const 读取非负整数金额 = (value: unknown): number => {
    const numeric = Math.floor(Number(value));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

export const 获取世界观货币槽位 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 货币槽位配置[] => {
    void openingConfig;
    void character;
    return [{ key: 'baseAmount', label: 单一货币单位, fullLabel: 单一货币单位 }];
};

export const 获取世界观BaseAmount单位标签 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): string => {
    void openingConfig;
    void character;
    return 单一货币单位;
};

export const 格式化世界观BaseAmount = (
    baseAmount: number,
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): string => {
    void openingConfig;
    void character;
    return `${读取非负整数金额(baseAmount).toLocaleString('zh-CN')} ${单一货币单位}`;
};

export const 格式化角色金钱行 = (
    money?: Partial<角色金钱> | null
): string => 格式化世界观BaseAmount(获取角色金钱BaseAmount(money));

export const 获取世界观简短货币汇率说明 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): string => {
    void openingConfig;
    void character;
    return '单一货币，无层级换算';
};

export const 获取世界观货币卡片信息 = (
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 世界观货币卡片信息 => {
    void openingConfig;
    return {
        title: '货币',
        summary: 格式化角色金钱行((character as any)?.金钱),
        exchangeHint: '单位：元。'
    };
};

const 创建单一角色金钱 = (
    money?: Partial<角色金钱> | null
): 角色金钱 => {
    const source = money && typeof money === 'object' ? money as Record<string, unknown> : {};
    return { baseAmount: 读取非负整数金额(source.baseAmount) };
};

export const 规范化角色金钱 = 创建单一角色金钱;

export const 获取角色金钱BaseAmount = (
    money?: Partial<角色金钱> | null
): number => 创建单一角色金钱(money).baseAmount;

export const 确保角色金钱BaseAmount = (
    money?: Partial<角色金钱> | null
): { baseAmount: number } => ({
    baseAmount: 获取角色金钱BaseAmount(money)
});

export const 获取角色金钱显示行列表 = (
    money?: Partial<角色金钱> | null
): string[] => [格式化角色金钱行(money)];

export const 构建角色金钱显示快照 = (
    money?: Partial<角色金钱> | null,
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 角色金钱世界观显示快照 => {
    const baseAmount = 获取角色金钱BaseAmount(money);
    return {
        baseAmount,
        显示: 格式化世界观BaseAmount(baseAmount, openingConfig, character),
        货币体系: '现代单一货币',
        基础单位: 单一货币单位
    };
};

export const 构建变量管理动态钱包视图 = (
    money?: Partial<角色金钱> | null,
    openingConfig?: OpeningConfig | null,
    character?: Partial<角色数据结构> | null
): 变量管理动态钱包视图 => {
    const baseAmount = 获取角色金钱BaseAmount(money);
    return {
        enabled: true,
        baseAmount,
        formatted: 格式化世界观BaseAmount(baseAmount, openingConfig, character),
        systemName: '现代单一货币',
        baseUnitLabel: 单一货币单位,
        primaryFieldPath: '角色.金钱.baseAmount'
    };
};

export const 获取背包货币物品聚合列表 = (
    items?: Array<{ 类型?: string; 名称?: string; 堆叠数量?: number; 描述?: string }> | null
): 货币物品聚合信息[] => {
    if (!Array.isArray(items)) return [];
    const total = items.reduce((sum, item) => {
        const type = typeof item?.类型 === 'string' ? item.类型 : '';
        const name = typeof item?.名称 === 'string' ? item.名称 : '';
        if (!type.startsWith('货币') && !['现金', '人民币', '元'].includes(name)) return sum;
        return sum + 读取非负整数金额(item?.堆叠数量 ?? 1);
    }, 0);
    return total > 0
        ? [{ 类型: '货币', 分类名: 单一货币单位, 名称: 单一货币单位, 数量: total, 描述: '现代单一货币。' }]
        : [];
};
