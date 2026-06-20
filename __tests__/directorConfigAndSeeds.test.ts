import { describe, expect, it } from 'vitest';
import {
    构建导演配置注入文本,
    同步角色种子转正并回写社交,
    同步角色种子转正状态,
    规范化导演配置
} from '../utils/directorConfig';

describe('Phase 3.2 director config and role seeds', () => {
    it('从旧 openingConfig 玩家剧情倾向迁移到导演配置，但不把种子当作既定事实', () => {
        const config = 规范化导演配置(undefined, {
            openingConfig: { 玩家剧情倾向: '慢热校园合租，偏后宫推进。' } as any
        });

        expect(config.玩家剧情倾向).toBe('慢热校园合租，偏后宫推进。');
        expect(config.角色种子定义).toEqual([]);
        expect(config.角色种子运行时状态).toEqual([]);
    });

    it('常驻只注入角色种子入口摘要，命中时才展开完整卡片', () => {
        const config = 规范化导演配置({
            玩家剧情倾向: '偏慢热关系。',
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友，表面疏离但会被长期照顾打动。',
                完整设定: '新闻系研究生，独立、自尊心强，亲密阻力来自家庭债务和对失控关系的戒备。',
                关系入口标签: ['合租', '校园'],
                默认发展方向: '红颜/后宫对象'
            }]
        });

        const summaryOnly = 构建导演配置注入文本(config, {
            stage: 'main',
            triggerTexts: ['今天去兼职，没有回合命中合租。']
        });
        const expanded = 构建导演配置注入文本(config, {
            stage: 'main',
            triggerTexts: ['回到合租公寓，准备和室友聊聊。']
        });

        expect(summaryOnly).toContain('角色种子入口摘要');
        expect(summaryOnly).toContain('林知夏');
        expect(summaryOnly).toContain('合租室友');
        expect(summaryOnly).not.toContain('家庭债务');
        expect(expanded).toContain('角色种子完整卡片');
        expect(expanded).toContain('家庭债务');
        expect(summaryOnly).toContain('角色种子ID：seed-roommate');
        expect(expanded).toContain('角色种子ID：seed-roommate');
    });

    it('NPC 建档命中角色种子后标记转正，避免再次作为新 NPC 素材', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友',
                完整设定: '新闻系研究生',
                关系入口标签: ['合租'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });

        const next = 同步角色种子转正状态(config, [{
            id: 'npc_lin_zhixia',
            姓名: '林知夏',
            性别: '女',
            角色种子ID: 'seed-roommate'
        }]);

        expect(next.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '已转正',
            linkedNpcId: 'npc_lin_zhixia',
            linkedNpcName: '林知夏'
        }));
    });

    it('有效角色种子ID转正时同步回写社交档案，姓名相同但无种子ID不误转正', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友',
                完整设定: '新闻系研究生',
                关系入口标签: ['合租'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });

        const linked = 同步角色种子转正并回写社交(config, [{
            id: 'npc_lin_zhixia',
            姓名: '林知夏',
            性别: '女',
            seedId: 'seed-roommate'
        }]);
        const sameNameOnly = 同步角色种子转正并回写社交(config, [{
            id: 'npc_same_name',
            姓名: '林知夏',
            性别: '女'
        }]);

        expect(linked.socialList[0].角色种子ID).toBe('seed-roommate');
        expect(linked.directorConfig.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '已转正',
            linkedNpcId: 'npc_lin_zhixia'
        }));
        expect(linked.changed).toBe(true);
        expect(linked.linkedSeedIds).toEqual(['seed-roommate']);
        expect(sameNameOnly.socialList[0].角色种子ID).toBeUndefined();
        expect(sameNameOnly.directorConfig.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '未引入'
        }));
    });
});
