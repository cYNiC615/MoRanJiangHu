import { describe, expect, it } from 'vitest';
import { 修复本地存档谱系列表, 补全存档谱系元数据 } from '../utils/saveLineage';

describe('存档谱系补全', () => {
    it('keeps valid sibling branches instead of flattening them into a single chain', () => {
        const node = (hash: string, parent: string, depth: number, timestamp: number): any => ({
            时间戳: timestamp, 历史记录: [], 元数据: { 存档哈希: hash, 存档系列ID: 'branching',
                存档父节点哈希: parent, 存档根节点哈希: 'root', 存档谱系深度: depth,
                游戏回合数: depth, 存档谱系版本: 1, 存档分支输入: parent ? '继续' : '开局' }
        });
        const input = [node('root', '', 0, 1), node('left', 'root', 1, 2), node('right', 'root', 1, 3)];
        const repaired = 修复本地存档谱系列表(input);
        expect(repaired.changed).toBe(false);
        expect(repaired.saves).toEqual(input);
        expect(补全存档谱系元数据(node('self', 'self', 1, 1), []).元数据.存档父节点哈希).toBe('');
    });
    it('云端导入存档已带父节点时，不因本地暂缺父节点而降级成根节点', () => {
        const save: any = {
            类型: 'auto',
            时间戳: 1779000003000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '武馆' },
            历史记录: [
                { role: 'user', content: '第一回合' },
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '第二回合' },
                { role: 'assistant', structuredResponse: { logs: [] } }
            ],
            元数据: {
                存档哈希: 'cccccccccccccccc',
                存档系列ID: 'series-test',
                存档父节点哈希: 'bbbbbbbbbbbbbbbb',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档谱系深度: 2,
                存档分支输入: '继续修炼'
            }
        };

        const normalized = 补全存档谱系元数据(save, []);

        expect(normalized.元数据.存档父节点哈希).toBe('bbbbbbbbbbbbbbbb');
        expect(normalized.元数据.存档根节点哈希).toBe('aaaaaaaaaaaaaaaa');
        expect(normalized.元数据.存档谱系深度).toBe(2);
        expect(normalized.元数据.存档分支输入).toBe('继续修炼');
    });

    it('本地新谱系根节点即使带旧深度和旧回合数，也会从第0回合开始', () => {
        const save: any = {
            类型: 'auto',
            时间戳: 1779000003000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '武馆' },
            历史记录: [
                { role: 'user', content: '开局' },
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '继续' },
                { role: 'assistant', structuredResponse: { logs: [] } }
            ],
            元数据: {
                存档哈希: 'aaaaaaaaaaaaaaaa',
                存档系列ID: 'series-root',
                存档谱系深度: 7,
                游戏回合数: 7,
                存档分支输入: '继续游玩'
            }
        };

        const normalized = 补全存档谱系元数据(save, []);

        expect(normalized.元数据.存档父节点哈希).toBe('');
        expect(normalized.元数据.存档根节点哈希).toBe('aaaaaaaaaaaaaaaa');
        expect(normalized.元数据.存档谱系深度).toBe(0);
        expect(normalized.元数据.游戏回合数).toBe(0);
        expect(normalized.元数据.存档分支输入).toBe('开局');
    });

    it('本地旧坏谱系存在中途开线时，会修成同一条从0开始的连续线', () => {
        const root: any = {
            id: 1,
            类型: 'auto',
            时间戳: 1779000000000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '山门' },
            历史记录: [{ role: 'assistant', structuredResponse: { logs: [] } }],
            元数据: {
                存档哈希: 'aaaaaaaaaaaaaaaa',
                存档系列ID: 'series-broken',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档谱系版本: 1,
                存档谱系深度: 0,
                游戏回合数: 0,
                存档分支输入: '开局'
            }
        };
        const middleRoot: any = {
            id: 2,
            类型: 'auto',
            时间戳: 1779000005000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '藏经阁' },
            历史记录: [
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'assistant', structuredResponse: { logs: [] } }
            ],
            元数据: {
                存档哈希: 'bbbbbbbbbbbbbbbb',
                存档系列ID: 'series-broken',
                存档根节点哈希: 'bbbbbbbbbbbbbbbb',
                存档父节点哈希: '',
                存档谱系版本: 1,
                存档谱系深度: 5,
                游戏回合数: 5,
                存档分支输入: '继续游玩'
            }
        };

        const repaired = 修复本地存档谱系列表([middleRoot, root]);
        const ordered = [...repaired.saves].sort((a: any, b: any) => a.元数据.游戏回合数 - b.元数据.游戏回合数);

        expect(repaired.changed).toBe(true);
        expect(ordered.map((item: any) => item.元数据.游戏回合数)).toEqual([0, 1]);
        expect(ordered[1].元数据).toEqual(expect.objectContaining({
            存档根节点哈希: 'aaaaaaaaaaaaaaaa',
            存档父节点哈希: 'aaaaaaaaaaaaaaaa',
            存档谱系深度: 1
        }));
    });

    it('新存档当前地点变化时，会继承已有父节点系列并连续接上', () => {
        const root: any = {
            id: 1,
            类型: 'manual',
            时间戳: 1779000000000,
            游戏初始时间: '1:01:01:08:00',
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '培强院' },
            历史记录: [
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '出门去英道' }
            ],
            元数据: {
                存档哈希: 'aaaaaaaaaaaaaaaa',
                存档系列ID: 'series-stable-root',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档父节点哈希: '',
                存档谱系版本: 1,
                存档谱系深度: 0,
                游戏回合数: 0,
                存档分支输入: '开局'
            }
        };
        const next: any = {
            类型: 'auto',
            时间戳: 1779000005000,
            游戏初始时间: '1:01:01:08:00',
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '英道' },
            历史记录: [
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '出门去英道' },
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'user', content: '继续前行' }
            ],
            元数据: {
                存档哈希: 'bbbbbbbbbbbbbbbb',
                游戏回合数: 1
            }
        };

        const normalized = 补全存档谱系元数据(next, [root]);

        expect(normalized.元数据).toEqual(expect.objectContaining({
            存档系列ID: 'series-stable-root',
            存档根节点哈希: 'aaaaaaaaaaaaaaaa',
            存档父节点哈希: 'aaaaaaaaaaaaaaaa',
            存档谱系深度: 1,
            存档分支输入: '继续前行'
        }));
    });

    it('本地只下载到缺父节点的半截谱系时，会保留原始回合并降级为本地根节点', () => {
        const childOnly: any = {
            id: 2,
            类型: 'auto',
            时间戳: 1779000005000,
            角色数据: { 姓名: '杨培强' },
            环境信息: { 具体地点: '藏经阁' },
            历史记录: [
                { role: 'assistant', structuredResponse: { logs: [] } },
                { role: 'assistant', structuredResponse: { logs: [] } }
            ],
            元数据: {
                存档哈希: 'bbbbbbbbbbbbbbbb',
                存档系列ID: 'series-incomplete',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档父节点哈希: 'aaaaaaaaaaaaaaaa',
                存档谱系版本: 1,
                存档谱系深度: 1,
                游戏回合数: 1,
                存档分支输入: '继续游玩'
            }
        };

        const repaired = 修复本地存档谱系列表([childOnly]);

        expect(repaired.changed).toBe(true);
        expect(repaired.saves[0].元数据).toEqual(expect.objectContaining({
            存档根节点哈希: 'bbbbbbbbbbbbbbbb',
            存档父节点哈希: '',
            存档谱系深度: 0,
            游戏回合数: 1
        }));
    });

    it('同一系列中的独立开局根不被修复扫描强行串成父子', () => {
        const firstRoot: any = {
            id: 1,
            类型: 'auto',
            时间戳: 1779000000000,
            角色数据: { 姓名: '杨培强' },
            历史记录: [],
            元数据: {
                存档哈希: 'aaaaaaaaaaaaaaaa',
                存档系列ID: 'series-collided',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档父节点哈希: '',
                存档谱系版本: 1,
                存档谱系深度: 0,
                游戏回合数: 0,
                存档分支输入: '开局'
            }
        };
        const secondRoot: any = {
            id: 2,
            类型: 'auto',
            时间戳: 1779000100000,
            角色数据: { 姓名: '杨培强' },
            历史记录: [],
            元数据: {
                存档哈希: 'bbbbbbbbbbbbbbbb',
                存档系列ID: 'series-collided',
                存档根节点哈希: 'bbbbbbbbbbbbbbbb',
                存档父节点哈希: '',
                存档谱系版本: 1,
                存档谱系深度: 0,
                游戏回合数: 0,
                存档分支输入: '开局'
            }
        };

        const repaired = 修复本地存档谱系列表([secondRoot, firstRoot]);

        expect(repaired.changed).toBe(false);
        expect(repaired.saves.every((item: any) => !item.元数据.存档父节点哈希)).toBe(true);
        expect(repaired.saves.find((item: any) => item.id === 1)?.元数据.存档系列ID).toBe('series-collided');
        expect(repaired.saves.find((item: any) => item.id === 2)?.元数据.存档系列ID).toBe('series-collided');
        expect(repaired.saves.map((item: any) => item.元数据.游戏回合数)).toEqual([0, 0]);
    });

    it('本地已有可信第0回合根节点时，会把同根缺父节点接回连续谱系', () => {
        const root: any = {
            id: 1,
            类型: 'auto',
            时间戳: 1779000000000,
            角色数据: { 姓名: '杨培强' },
            历史记录: [],
            元数据: {
                存档哈希: 'aaaaaaaaaaaaaaaa',
                存档系列ID: 'series-missing-parent',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档父节点哈希: '',
                存档谱系版本: 1,
                存档谱系深度: 0,
                游戏回合数: 0,
                存档分支输入: '开局'
            }
        };
        const orphan: any = {
            id: 2,
            类型: 'auto',
            时间戳: 1779000100000,
            角色数据: { 姓名: '杨培强' },
            历史记录: [],
            元数据: {
                存档哈希: 'bbbbbbbbbbbbbbbb',
                存档系列ID: 'series-missing-parent',
                存档根节点哈希: 'aaaaaaaaaaaaaaaa',
                存档父节点哈希: 'missing-parent-hash',
                存档谱系版本: 1,
                存档谱系深度: 17,
                游戏回合数: 17,
                存档分支输入: '继续游玩'
            }
        };

        const repaired = 修复本地存档谱系列表([orphan, root]);
        const child = repaired.saves.find((item: any) => item.id === 2) as any;

        expect(repaired.changed).toBe(true);
        expect(child.元数据).toEqual(expect.objectContaining({
            存档根节点哈希: 'aaaaaaaaaaaaaaaa',
            存档父节点哈希: 'aaaaaaaaaaaaaaaa',
            存档谱系深度: 1,
            游戏回合数: 17
        }));
    });
});
