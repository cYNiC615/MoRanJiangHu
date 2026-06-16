import type { 游戏物品, 物品词条 } from '../models/item';
import { 规范化消耗品使用效果 } from './itemEffects';

export interface 属性明细条目 {
    标签: string;
    数值: string;
    依据: string;
}

export interface 物品明细分组 {
    标题: string;
    条目: 属性明细条目[];
}

const 读数 = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const 读文本 = (value: unknown, fallback = '') => (
    typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const 格式数值 = (value: unknown, fallback = 0) => 读数(value, fallback).toLocaleString('zh-CN');

const 百分比 = (value: number) => `${Math.round(value * 100)}%`;

const 规范化部位列表 = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => 读文本(item))
            .filter(Boolean);
    }
    const text = 读文本(value);
    return text
        ? text.split(/[、/，,\s]+/).map((item) => item.trim()).filter(Boolean)
        : [];
};

const 词条转条目 = (词条列表: unknown, context: string): 属性明细条目[] => {
    if (!Array.isArray(词条列表)) return [];
    return 词条列表
        .map((entry: 物品词条) => {
            const name = 读文本(entry?.名称, '词条');
            const attr = 读文本(entry?.属性, '属性');
            const value = 读数(entry?.数值);
            const type = entry?.类型 === '百分比' ? '%' : '';
            if (!attr || attr === '属性' || !Number.isFinite(value) || value === 0) return null;
            return {
                标签: `${name} · ${attr}`,
                数值: `${value > 0 ? '+' : ''}${value}${type}`,
                依据: `${context}：来自物品词条列表，按同名属性并入统一判定。`,
            };
        })
        .filter(Boolean) as 属性明细条目[];
};

const 是否对敌效果 = (effect: any): boolean => {
    const target = 读文本(effect?.目标属性);
    return /^敌方/.test(target) || 读数(effect?.数值) < 0;
};

const 是否攻杀消耗品 = (item: any, effects: any[]): boolean => {
    const text = `${读文本(item?.名称)} ${读文本(item?.描述)} ${读文本(item?.视觉描述)} ${effects.map((effect) => 读文本(effect?.目标属性)).join(' ')}`;
    return /杀伤|敌方|中毒|毒箭|毒羽箭|箭簇|羽箭|毒镖|毒针|毒刃|毒粉|迷烟|断肠|见血封喉|淬毒|涂毒|麻痹|致盲|控场/.test(text);
};

export const 获取物品明细分组 = (item: 游戏物品 | any, options?: { 价值单位?: string }): 物品明细分组[] => {
    if (!item) return [];
    const type = 读文本(item?.类型, '未知');
    const stackCount = Math.max(1, 读数(item?.堆叠数量, 1));
    const stackMax = Math.max(stackCount, 读数(item?.最大堆叠, stackCount));
    const groups: 物品明细分组[] = [
        {
            标题: '基础',
            条目: [
                { 标签: '单件价值', 数值: `${格式数值(item?.价值)} ${options?.价值单位 || '铜'}`, 依据: '物品.价值 是市场估值的基础折算值，会按当前题材显示为对应货币单位。' },
                { 标签: '重量', 数值: `${格式数值(item?.重量)} 斤`, 依据: '物品.重量 * 堆叠数量 计入当前负重。' },
                { 标签: '堆叠', 数值: `${格式数值(stackCount, 1)} / ${格式数值(stackMax, 1)}`, 依据: '堆叠数量决定出售、使用和总价值的数量基数。' },
                { 标签: '耐久', 数值: `${格式数值(item?.当前耐久)} / ${格式数值(item?.最大耐久)}`, 依据: '战斗、格挡和恶劣环境会消耗耐久；耐久过低会削弱装备贡献。' },
            ],
        },
    ];

    const equipEntries: 属性明细条目[] = [];
    if (type === '武器') {
        equipEntries.push(
            { 标签: '攻击区间', 数值: `${格式数值(item?.最小攻击)} - ${格式数值(item?.最大攻击)}`, 依据: '武器.最小攻击/最大攻击 取均值后进入装备攻势。' },
            { 标签: '攻速修正', 数值: `x${读数(item?.攻速修正, 1).toFixed(2)}`, 依据: '武器.攻速修正 影响先手和连续出招解释。' },
            { 标签: '格挡率', 数值: `${格式数值(item?.格挡率)}%`, 依据: '武器.格挡率 作为近身防御的辅助来源。' },
        );
    }
    if (type === '防具') {
        const equipPosition = 读文本(item?.装备位置, 读文本(item?.当前装备部位, '未知'));
        const coveredParts = 规范化部位列表(item?.覆盖部位);
        const hasUsefulCoveredParts = coveredParts.length > 0
            && !coveredParts.some((part) => /未标注|未知|无/.test(part))
            && coveredParts.join(' / ') !== equipPosition;
        equipEntries.push(
            { 标签: '装备位置', 数值: equipPosition, 依据: '防具.装备位置 决定装备槽位与基础承伤区域。' },
            ...(hasUsefulCoveredParts
                ? [{ 标签: '覆盖部位', 数值: coveredParts.join(' / '), 依据: '覆盖部位仅在区别于装备位置时补充说明受击抵消范围。' }]
                : []),
            { 标签: '物理防御', 数值: 格式数值(item?.物理防御), 依据: '防具.物理防御 进入装备守势。' },
            { 标签: '内功防御', 数值: 格式数值(item?.内功防御), 依据: '防具.内功防御 进入内力/真气类伤害减免解释。' },
        );
    }
    if (type === '饰品') {
        equipEntries.push({ 标签: '饰品定位', 数值: 读文本(item?.当前装备部位, '腰部/背部/坐骑等'), 依据: '饰品主要通过词条和特殊效果影响判定。' });
    }
    if (equipEntries.length > 0) groups.push({ 标题: '装备属性', 条目: equipEntries });

    if (type === '消耗品') {
        const effects = 规范化消耗品使用效果(item);
        const isAttackConsumable = 是否攻杀消耗品(item, effects);
        const benefitEffects = effects.filter((effect) => !是否对敌效果(effect));
        const debuffEffects = effects.filter(是否对敌效果);
        if (benefitEffects.length > 0) {
            groups.push({
                标题: '使用增益',
                条目: benefitEffects.map((effect: any) => ({
                    标签: 读文本(effect?.目标属性, '效果'),
                    数值: `${读数(effect?.数值) > 0 ? '+' : ''}${格式数值(effect?.数值)}`,
                    依据: effect?.依据 || (isAttackConsumable ? '消耗品.使用效果 标注攻杀效能，用于对敌行动解释。' : '消耗品.使用效果 会直接写回对应角色属性，并按最大值裁切。'),
                })),
            });
        }
        const toxicity = 读数(item?.毒性);
        if (debuffEffects.length > 0 || toxicity > 0) {
            groups.push({
                标题: '使用减益',
                条目: debuffEffects.length > 0
                    ? debuffEffects.map((effect: any) => ({
                    标签: 读文本(effect?.目标属性, '敌方减益'),
                    数值: 格式数值(effect?.数值),
                    依据: effect?.依据 || '该效果用于对敌方施加负面状态或削弱判定。',
                }))
                    : [{ 标签: '毒性/负担', 数值: 格式数值(toxicity), 依据: '消耗品.毒性 用于丹毒、负担或后续事件判断。' }],
            });
        }
    }

    const affixes = 词条转条目(item?.词条列表, '物品词条');
    if (affixes.length > 0) groups.push({ 标题: '词条增益', 条目: affixes });

    return groups;
};
