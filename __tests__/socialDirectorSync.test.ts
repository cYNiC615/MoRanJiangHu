import { describe, expect, it } from 'vitest';
import type { NPC结构 } from '../types';
import { 规范化导演配置 } from '../utils/directorConfig';
import { 规范化并同步社交导演状态 } from '../hooks/useGame/socialDirectorSync';

describe('social director sync boundary', () => {
    const 创建导演配置 = () => 规范化导演配置({
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

    it('一次性规范化社交、过滤主角同名 NPC，并同步导演配置', () => {
        const result = 规范化并同步社交导演状态({
            nextSocial: [
                { id: 'npc_player_clone', 姓名: '沈砚', 性别: '男' },
                { id: 'npc_lin_zhixia', 姓名: '林知夏', 性别: '女', seedId: 'seed-roommate' }
            ] as any,
            currentDirectorConfig: 创建导演配置(),
            playerName: '沈砚',
            normalizeSocialList: (list) => list as NPC结构[]
        });

        expect(result.social).toHaveLength(1);
        expect(result.social[0].姓名).toBe('林知夏');
        expect(result.social[0].角色种子ID).toBe('seed-roommate');
        expect(result.directorChanged).toBe(true);
        expect(result.directorConfig.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '已转正',
            linkedNpcId: 'npc_lin_zhixia'
        }));
    });
});
