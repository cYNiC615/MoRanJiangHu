import { describe, expect, it } from 'vitest';
import { 创建开场基础状态 } from '../hooks/useGame/storyState';
import { 规范化开局配置 } from '../utils/openingConfig';
import { 创建主题默认世界配置 } from '../utils/workshopEngine';
import type { 角色数据结构 } from '../types';

describe('modern urban default opening state', () => {
    it('starts without an organization and creates a multi-step modern main quest', () => {
        const role = {
            姓名: '周行',
            性别: '男',
            背景: '普通大学生',
            天赋: ['信息检索'],
            金钱: { baseAmount: 0 },
            物品列表: []
        } as unknown as 角色数据结构;
        const world = 创建主题默认世界配置('现代都市');
        const opening = 规范化开局配置({ 题材模式: '现代都市' });
        const state = 创建开场基础状态(role, world, opening);
        const mainQuest = state.任务列表.find((task: any) => task?.类型 === '主线');

        expect(state.玩家组织.ID).toBe('none');
        expect(state.玩家组织.名称).toBe('暂无所属组织');
        expect(state.玩家组织.简介).toContain('尚未加入任何组织');
        expect(mainQuest).toBeTruthy();
        expect(mainQuest?.目标列表).toHaveLength(3);
        expect(mainQuest?.目标列表.some((goal: any) => Number(goal?.总需进度) > 1)).toBe(true);
        expect(JSON.stringify(mainQuest)).not.toContain('组织信用');
        expect(JSON.stringify(mainQuest)).not.toContain('负责人');
    });
});
