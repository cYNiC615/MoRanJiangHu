import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { 补齐世界地图空间字段 } from '../utils/mapSpatial';
import { 规范化任务列表自动结算 } from '../utils/taskCompat';

describe('用户反馈问题端到端回归', () => {
    it('任务列表只去重完全重复任务，保留相似但不同的正式目标', () => {
        const tasks = 规范化任务列表自动结算([
            {
                ID: 'main-rent',
                标题: '房租协商',
                类型: '主线',
                描述: '三天内与房东谈妥缓缴方案。',
                发布人: '房东',
                当前状态: '进行中',
                目标列表: [{ 描述: '准备收入证明', 当前进度: 0, 总需进度: 1 }]
            },
            {
                ID: 'side-utility',
                标题: '整理水电账单',
                类型: '支线',
                描述: '室友提醒你把本月水电和房租记录整理清楚。',
                发布人: '室友',
                当前状态: '进行中',
                目标列表: [{ 描述: '核对转账记录', 当前进度: 0, 总需进度: 1 }]
            },
            {
                ID: 'side-utility-copy',
                标题: '整理水电账单',
                类型: '支线',
                描述: '室友提醒你把本月水电和房租记录整理清楚。',
                发布人: '室友',
                当前状态: '进行中',
                目标列表: [{ 描述: '核对转账记录', 当前进度: 0, 总需进度: 1 }]
            },
            {
                ID: 'side-bank',
                标题: '整理银行流水',
                类型: '支线',
                描述: '你决定额外整理近三个月银行流水，避免协商时说不清。',
                发布人: '自己',
                当前状态: '进行中',
                目标列表: [{ 描述: '导出银行流水', 当前进度: 0, 总需进度: 1 }]
            }
        ]);

        expect(tasks.map((task: any) => task.标题)).toEqual([
            '房租协商',
            '整理水电账单',
            '整理银行流水'
        ]);
    });

    it('同一个角色只保留一个最细地图落点，不会同时出现在父级和子级', () => {
        const world = 补齐世界地图空间字段({
            地图层级: [
                { ID: 'world', 名称: '主神空间', 层级: '寰宇', 网格宽度: 40, 网格高度: 30 },
                { ID: 'hall', 名称: '主神大厅', 层级: '大地点', 父级ID: 'world', 网格宽度: 32, 网格高度: 24 },
                { ID: 'room', 名称: '队伍休息室', 层级: '子地点', 父级ID: 'hall', 网格宽度: 20, 网格高度: 16 }
            ],
            地图建筑: [],
            地图道路: [],
            地图人物: [
                { ID: 'p-parent', 名称: '林越', 关联NPC: 'player-1', 所在层级ID: 'hall', 坐标: { x: 6, y: 6 }, 是否当前玩家: true },
                { ID: 'p-leaf', 名称: '林越', 关联NPC: 'player-1', 所在层级ID: 'room', 坐标: { x: 9, y: 9 }, 是否当前玩家: true },
                { ID: 'npc-parent', 名称: '叶青', 关联NPC: 'npc-ye-qing', 所在层级ID: 'hall', 坐标: { x: 8, y: 8 } },
                { ID: 'npc-leaf', 名称: '叶青', 关联NPC: 'npc-ye-qing', 所在层级ID: 'room', 坐标: { x: 10, y: 10 } }
            ]
        } as any);

        const playerSpots = world.地图人物.filter((person: any) => person.关联NPC === 'player-1');
        const npcSpots = world.地图人物.filter((person: any) => person.关联NPC === 'npc-ye-qing');

        expect(playerSpots).toHaveLength(1);
        expect(playerSpots[0].所在层级ID).toBe('room');
        expect(npcSpots).toHaveLength(1);
        expect(npcSpots[0].所在层级ID).toBe('room');
    });

    it('社交同步 setter 不会递归调用自身', () => {
        const source = readFileSync('hooks/useGame.ts', 'utf8');
        const match = source.match(/const 同步设置社交 = \(updater: any\) => \{[\s\S]*?\n    \};/u);

        expect(match?.[0]).toBeTruthy();
        expect(match![0]).toContain('设置社交(normalized);');
        expect(match![0]).not.toContain('同步设置社交(normalized);');
    });
});
