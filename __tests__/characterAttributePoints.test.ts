import { describe, expect, it } from 'vitest';
import { 分配角色属性点, 读取可分配属性点 } from '../utils/characterAttributePoints';
import type { 角色数据结构 } from '../types';

const makeCharacter = (): 角色数据结构 => ({
    姓名: '测试侠',
    性别: '男',
    年龄: 18,
    出生日期: '1月1日',
    称号: '无',
    境界: '初入江湖',
    境界层级: 1,
    出身背景: { 名称: '散人', 描述: '', 效果: '' },
    天赋列表: [],
    性格: '',
    外貌: '',
    头像图片URL: '',
    金钱: { baseAmount: 0 },
    当前血量: 100,
    最大血量: 100,
    当前精力: 100,
    最大精力: 100,
    当前内力: 50,
    最大内力: 50,
    当前饱腹: 100,
    最大饱腹: 100,
    当前口渴: 100,
    最大口渴: 100,
    当前负重: 0,
    最大负重: 100,
    力量: 5,
    敏捷: 5,
    体质: 5,
    根骨: 5,
    悟性: 5,
    福源: 5,
    可分配属性点: 2,
    头部当前血量: 10,
    头部最大血量: 10,
    头部状态: '正常',
    胸部当前血量: 20,
    胸部最大血量: 20,
    胸部状态: '正常',
    腹部当前血量: 20,
    腹部最大血量: 20,
    腹部状态: '正常',
    左手当前血量: 10,
    左手最大血量: 10,
    左手状态: '正常',
    右手当前血量: 10,
    右手最大血量: 10,
    右手状态: '正常',
    左腿当前血量: 10,
    左腿最大血量: 10,
    左腿状态: '正常',
    右腿当前血量: 10,
    右腿最大血量: 10,
    右腿状态: '正常',
    装备: {
        头部: '无',
        胸部: '无',
        盔甲: '无',
        内衬: '无',
        背部: '无',
        腰部: '无',
        腿部: '无',
        足部: '无',
        手部: '无',
        主武器: '无',
        副武器: '无',
        暗器: '无',
        坐骑: '无'
    },
    物品列表: [],
    能力列表: [],
    技艺: [],
    当前经验: 0,
    升级经验: 100,
    玩家BUFF: [],
    突破条件: []
} as 角色数据结构);

describe('characterAttributePoints', () => {
    it('spends one available point and increases the chosen attribute', () => {
        const next = 分配角色属性点(makeCharacter(), '悟性');

        expect(next.悟性).toBe(6);
        expect(next.可分配属性点).toBe(1);
    });

    it('does not mutate the character when no points are available', () => {
        const character = { ...makeCharacter(), 可分配属性点: 0 };
        const next = 分配角色属性点(character, '力量');

        expect(next).toBe(character);
        expect(读取可分配属性点(next)).toBe(0);
    });
});
