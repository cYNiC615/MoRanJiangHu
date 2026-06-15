import { describe, expect, it, vi } from 'vitest';
import { 创建手动NPC工作流 } from '../hooks/useGame/manualNpcWorkflow';

describe('手动 NPC 工作流', () => {
    it('删除门派同门 NPC 时同步移除玩家组织重要成员', () => {
        let social: any[] = [
            {
                id: 'NPC002',
                姓名: '杨承岳',
                来源: '玩家组织.重要成员'
            },
            {
                id: 'npc_manual_1',
                姓名: '路人甲'
            }
        ];
        let sect: any = {
            ID: 'Org001',
            名称: '杨家堡',
            重要成员: [
                { id: 'NPC002', 姓名: '杨承岳', 性别: '男', 年龄: 48, 身份: '堡主', 境界: '先天', 简介: '' },
                { id: 'NPC003', 姓名: '杨若雪', 性别: '女', 年龄: 19, 身份: '弟子', 境界: '开脉', 简介: '' }
            ]
        };
        const autoSave = vi.fn();
        const workflow = 创建手动NPC工作流({
            获取环境: () => ({}),
            环境时间转标准串: () => '',
            规范化社交列表: (list) => list,
            设置社交: (updater: any) => {
                social = typeof updater === 'function' ? updater(social) : updater;
            },
            获取玩家组织: () => sect,
            设置玩家组织: (updater: any) => {
                sect = typeof updater === 'function' ? updater(sect) : updater;
            },
            执行社交自动存档: autoSave,
            保存图片资源: async (dataUrl: string) => dataUrl
        });

        workflow.deleteNpcManually('NPC002');

        expect(social.map((npc) => npc.姓名)).toEqual(['路人甲']);
        expect(sect.重要成员.map((member: any) => member.姓名)).toEqual(['杨若雪']);
        expect(autoSave).toHaveBeenCalledTimes(1);
        expect(autoSave).toHaveBeenCalledWith(social, sect);
    });
});
