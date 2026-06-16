import { describe, expect, it } from 'vitest';
import { 构建NPC上下文 } from '../hooks/useGame/npcContext';

describe('npc context', () => {
    it('uses generic teammate state instead of retired battle state', () => {
        const result = 构建NPC上下文([
            {
                id: 'npc_1',
                姓名: '林夏',
                性别: '女',
                年龄: 22,
                身份: '队友',
                简介: '可靠的临时同伴',
                是否在场: true,
                是否队友: true,
                是否主要角色: true,
                好感度: 20,
                关系状态: '同伴',
                攻击力: 8,
                防御力: 6,
                当前血量: 30,
                最大血量: 30
            }
        ], {} as any);

        expect(result.在场数据块).toContain('队友状态');
        expect(result.在场数据块).not.toContain('战斗状态');
    });
});
