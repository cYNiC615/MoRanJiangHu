import { describe, expect, it } from 'vitest';
import { 投影存档谱系轻量视图, 校正并写回本地存档谱系, type 存档谱系轻量视图 } from '../services/dbService';
import { 修复本地存档谱系列表, 读取存档系列ID, 补全存档谱系元数据 } from '../utils/saveLineage';

describe('投影存档谱系轻量视图', () => {
    it('uses the same stable opening signature for full and projected saves while separating repeated new games', () => {
        const save: any = { id: 1, 时间戳: 1, 角色数据: { 姓名: '沈砚' }, 游戏初始时间: '2026:01:01:08:00',
            历史记录: [{ role: 'system', content: '正在生成开场' }, { role: 'assistant', content: '医院开场'.repeat(500), structuredResponse: { logs: [] } }],
            环境信息: { 具体地点: '医院' }, 元数据: { 存档哈希: 'root' } };
        const root = 补全存档谱系元数据(save);
        const view = 投影存档谱系轻量视图(root);
        expect(JSON.stringify(view).length).toBeLessThan(1200);
        expect(读取存档系列ID({ ...view, 元数据: {} } as any)).toBe(读取存档系列ID(save));
        const continued = 补全存档谱系元数据({ ...save, id: 2, 时间戳: 2, 环境信息: { 具体地点: '学校' },
            历史记录: [...save.历史记录, { role: 'user', content: '去学校' }], 元数据: { 存档哈希: 'child' } }, [view as any]);
        expect(continued.元数据.存档父节点哈希).toBe('root');
        const other = 补全存档谱系元数据({ ...save, 时间戳: 3,
            历史记录: [save.历史记录[0], { role: 'assistant', content: '另一局开场' }], 元数据: { 存档哈希: 'other' } }, [view as any]);
        expect(other.元数据.存档父节点哈希).toBe('');
        expect(other.元数据.存档系列ID).not.toBe(root.元数据.存档系列ID);
        const opening = (text: string): any => ({ ...save, 元数据: {}, 历史记录: [save.历史记录[0], {
            role: 'assistant', content: 'Opening Story', structuredResponse: { logs: [{ sender: '旁白', text }] }
        }] });
        const a = opening('相同前缀'.repeat(100) + '第一局');
        const b = opening('相同前缀'.repeat(100) + '第二局');
        expect(读取存档系列ID(a)).not.toBe(读取存档系列ID(b));
        expect(读取存档系列ID(投影存档谱系轻量视图(a) as any)).toBe(读取存档系列ID(a));
    });

    it('writes only repaired metadata back onto a fresh complete record', async () => {
        const metadata = (hash: string, depth: number) => ({ 存档哈希: hash, 存档系列ID: 'series', 存档根节点哈希: hash,
            存档父节点哈希: '', 存档谱系深度: depth, 存档谱系版本: 1, 游戏回合数: depth, 存档分支输入: '开局' });
        const full: any = { id: 2, 类型: 'manual', 时间戳: 2, 角色数据: { 姓名: '沈砚' }, 社交: [{ 姓名: '林知夏' }],
            历史记录: [{ role: 'assistant', structuredResponse: { logs: [{ text: '开场' }] } }, { role: 'assistant', structuredResponse: { logs: [{ text: '后续' }] } }], 元数据: metadata('child', 5) };
        const views: any[] = [{ id: 1, 时间戳: 1, 历史记录: [], 元数据: metadata('root', 0) }, 投影存档谱系轻量视图(full)];
        const writes: any[] = [];
        const reads: number[] = [];
        const db = { transaction: () => {
            const tx: any = { objectStore: (name: string) => ({
                get: (id: number) => {
                    reads.push(id);
                    const req: any = { result: structuredClone(full) };
                    queueMicrotask(() => { req.onsuccess(); tx.oncomplete(); });
                    return req;
                },
                put: (value: any) => { if (name === 'saves') writes.push(value); }
            }) };
            return tx;
        } } as any;
        await 校正并写回本地存档谱系(db, views);
        expect(reads).toEqual([2]);
        expect(writes).toHaveLength(1);
        expect(writes[0].历史记录).toEqual(full.历史记录);
        expect(writes[0].社交).toEqual(full.社交);
        expect(writes[0].元数据.存档父节点哈希).toBe('root');
        expect(writes[0].谱系轻量视图).toBeUndefined();
    });
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
        expect(view.历史记录).toMatchObject([
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
