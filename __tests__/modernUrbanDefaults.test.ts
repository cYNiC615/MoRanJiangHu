import { describe, expect, it } from 'vitest';
import { 创建开场基础状态, 合并世界基底到开场状态, 清理空占位地图根节点 } from '../hooks/useGame/storyState';
import { 规范化开局配置 } from '../utils/openingConfig';
import { 创建主题默认世界配置 } from '../utils/workshopEngine';
import type { 角色数据结构 } from '../types';

describe('modern urban default opening state', () => {
    it('starts without an organization and does not create prompt-instruction fallback quests', () => {
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

        expect(state.玩家组织.ID).toBe('none');
        expect(state.玩家组织.名称).toBe('暂无所属组织');
        expect(state.玩家组织.简介).toContain('尚未加入任何组织');
        expect(state.任务列表).toEqual([]);
        expect(JSON.stringify(state.任务列表)).not.toContain('把眼前的麻烦理清楚');
        expect(JSON.stringify(state.任务列表)).not.toContain('现实处境');
        expect(JSON.stringify(state.任务列表)).not.toContain('宏大组织');
    });

    it('modern world foundation fallback uses reality root instead of empty wuxia multiverse root', () => {
        const role = {
            姓名: '周行',
            性别: '男',
            金钱: { baseAmount: 0 },
            物品列表: []
        } as unknown as 角色数据结构;
        const world = 创建主题默认世界配置('现代都市');
        const opening = 规范化开局配置({ 题材模式: '现代都市' });
        const state = 创建开场基础状态(role, world, opening);

        const merged = 合并世界基底到开场状态(state, {
            mapLayers: [
                { 名称: '镜湖市', 层级: '大地点', 父级ID: '现实世界', 描述: '现代都市圈。' }
            ],
            factions: []
        }, opening);

        const names = (merged.世界.地图层级 || []).map((layer: any) => layer.名称);
        expect(names).toContain('现实世界');
        expect(names).toContain('镜湖市');
        expect(names).not.toContain('诸天万界');
    });

    it('removes only isolated empty legacy multiverse map root', () => {
        expect(清理空占位地图根节点([
            { ID: 'DT-001', 名称: '诸天万界', 层级: '寰宇', 父级ID: '', 描述: '' }
        ] as any)).toEqual([]);

        expect(清理空占位地图根节点([
            { ID: 'DT-001', 名称: '诸天万界', 层级: '寰宇', 父级ID: '', 描述: '' },
            { ID: 'DT-002', 名称: '镜湖市', 层级: '大地点', 父级ID: 'DT-001', 描述: '现代都市圈。' }
        ] as any).map((layer: any) => layer.名称)).toEqual(['诸天万界', '镜湖市']);
    });
});
