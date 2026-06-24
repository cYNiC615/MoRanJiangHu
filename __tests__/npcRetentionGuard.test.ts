import { describe, expect, it } from 'vitest';
import { 合并保留既有NPC列表, 检测社交删除风险命令 } from '../utils/npcRetentionGuard';

describe('npcRetentionGuard', () => {
    const currentSocial = [
        { id: 'npc_old', 姓名: '沈青棠', 身份: '旧友' },
        { id: 'npc_second', 姓名: '陆明珂', 身份: '掌柜' }
    ];

    it('detects direct social deletion commands', () => {
        expect(检测社交删除风险命令([
            { action: 'delete', key: '社交[0]' }
        ] as any, currentSocial)).toHaveLength(1);

        expect(检测社交删除风险命令([
            { action: 'delete', key: '社交[0].记忆[0]' }
        ] as any, currentSocial)).toHaveLength(0);
    });

    it('detects full social replacement that drops existing NPCs', () => {
        const issues = 检测社交删除风险命令([
            { action: 'set', key: '社交', value: [{ id: 'npc_second', 姓名: '陆明珂' }] }
        ] as any, currentSocial);

        expect(issues.join('\n')).toContain('沈青棠');
    });

    it('restores missing existing NPCs while preserving matched NPC identity', () => {
        const result = 合并保留既有NPC列表(currentSocial, [
            { id: 'npc_second', 姓名: '陆明珂', 身份: '掌柜', 好感度: 20 }
        ]);

        expect(result.恢复数量).toBe(1);
        expect(result.恢复名称).toEqual(['沈青棠']);
        expect(result.列表.map((npc: any) => npc.姓名)).toEqual(['沈青棠', '陆明珂']);
        expect(result.列表[1].好感度).toBe(20);
    });

    it('merges partial updates for matched existing NPCs instead of keeping the partial object', () => {
        const result = 合并保留既有NPC列表(currentSocial, [
            { id: 'npc_second', 好感度: 20, 档案: { 小穴描述: '新档案。' } }
        ]);

        expect(result.恢复数量).toBe(1);
        expect(result.合并数量).toBe(1);
        expect(result.是否变更).toBe(true);
        expect(result.列表[1]).toMatchObject({
            id: 'npc_second',
            姓名: '陆明珂',
            身份: '掌柜',
            好感度: 20,
            档案: { 小穴描述: '新档案。' }
        });
    });
});
