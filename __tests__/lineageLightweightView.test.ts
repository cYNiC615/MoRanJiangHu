import { describe, expect, it } from 'vitest';
import { 投影存档谱系轻量视图, type 存档谱系轻量视图 } from '../services/dbService';
import { 修复本地存档谱系列表 } from '../utils/saveLineage';

describe('投影存档谱系轻量视图', () => {
    it('投影后只保留谱系需要的小字段', () => {
        const fullSave: any = {
            id: 1,
            类型: 'manual',
            时间戳: 1779000001000,
            游戏初始时间: '1:01:01:08:00',
            角色数据: { 姓名: '沈知夏', 境界: '不应进入轻量视图' },
            环境信息: { 大地点: '海川市', 中地点: '东城区', 小地点: '景明公寓', 具体地点: '顶楼活动室' },
            历史记录: [
                { role: 'system', content: '系统提示' },
                { role: 'user', content: '第一回合行动' },
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '第二回合行动' }
            ],
            元数据: {
                存档哈希: 'hash-a',
                存档系列ID: 'series-a',
                存档谱系版本: 1,
                游戏回合数: 2
            },
            社交: [{ 姓名: '大型字段不应进入视图' }],
            世界: { 活跃NPC列表: ['大型字段不应进入视图'] },
            剧情: { 当前章节: '大型字段不应进入视图' },
            背景图片: 'data:image/png;base64,very-large'
        };

        const view = 投影存档谱系轻量视图(fullSave, fullSave.id);

        expect(view).toMatchObject({
            id: 1,
            类型: 'manual',
            时间戳: 1779000001000,
            游戏初始时间: '1:01:01:08:00',
            角色数据: { 姓名: '沈知夏' },
            环境信息: { 大地点: '海川市', 中地点: '东城区', 小地点: '景明公寓', 具体地点: '顶楼活动室' },
            元数据: expect.objectContaining({ 存档哈希: 'hash-a', 存档系列ID: 'series-a' })
        });
        expect(view.历史记录).toEqual([
            { role: 'system', content: '系统提示' },
            { role: 'user', content: '第一回合行动' }
        ]);
        expect((view as any).社交).toBeUndefined();
        expect((view as any).世界).toBeUndefined();
        expect((view as any).剧情).toBeUndefined();
        expect((view as any).背景图片).toBeUndefined();
        expect((view.角色数据 as any).境界).toBeUndefined();
    });

    it('谱系完整的轻量视图不会被修复算法误判为需要写回', () => {
        const views: 存档谱系轻量视图[] = [
            {
                id: 1,
                类型: 'manual',
                时间戳: 1779000001000,
                历史记录: [],
                元数据: {
                    存档哈希: 'hash-root',
                    存档系列ID: 'series-ok',
                    存档父节点哈希: '',
                    存档根节点哈希: 'hash-root',
                    存档谱系深度: 0,
                    存档谱系版本: 1,
                    游戏回合数: 0,
                    存档分支输入: '开局'
                }
            },
            {
                id: 2,
                类型: 'auto',
                时间戳: 1779000002000,
                历史记录: [{ role: 'user', content: '继续调查' }],
                元数据: {
                    存档哈希: 'hash-child',
                    存档系列ID: 'series-ok',
                    存档父节点哈希: 'hash-root',
                    存档根节点哈希: 'hash-root',
                    存档谱系深度: 1,
                    存档谱系版本: 1,
                    游戏回合数: 1,
                    存档分支输入: '继续调查'
                }
            }
        ];

        const repaired = 修复本地存档谱系列表(views as any);

        expect(repaired.changed).toBe(false);
        expect(repaired.repairedNodes).toBe(0);
    });
});
