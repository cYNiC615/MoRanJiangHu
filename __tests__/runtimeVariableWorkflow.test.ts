import { describe, expect, it, vi } from 'vitest';
import { 创建运行时变量工作流 } from '../hooks/useGame/runtimeVariableWorkflow';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';

const 创建依赖 = (options?: { heroinePlanEnabled?: boolean }) => {
    let social: any[] = [];
    const state = {
        角色: {},
        环境: {},
        社交: social,
        世界: {},
        剧情: {},
        剧情规划: {},
        女主剧情规划: undefined,
        玩家组织: { 名称: '铁栅安全点', 玩家贡献: 120, 累计贡献: 1500, 任务列表: [] },
        任务列表: [],
        记忆系统: {}
    };
    const performAutoSave = vi.fn();
    const deps = {
        获取历史记录: () => [],
        深拷贝: <T,>(value: T): T => JSON.parse(JSON.stringify(value)),
        获取当前状态: () => ({ ...state, 社交: social }),
        规范化角色物品容器映射: (value: any) => value || {},
        规范化环境信息: (value: any) => value || {},
        规范化社交列表,
        规范化世界状态: (value: any) => value || {},
        规范化剧情状态: (value: any) => value || {},
        规范化剧情规划状态: (value: any) => value || {},
        规范化女主剧情规划状态: (value: any) => value,
        规范化组织状态: (value: any) => value || {},
        规范化记忆系统: (value: any) => value || {},
        设置角色: (value: any) => { state.角色 = value; },
        设置环境: (value: any) => { state.环境 = value; },
        设置社交: (value: any) => { social = value; state.社交 = value; },
        设置世界: (value: any) => { state.世界 = value; },
        设置剧情: (value: any) => { state.剧情 = value; },
        设置剧情规划: (value: any) => { state.剧情规划 = value; },
        设置女主剧情规划: (value: any) => { state.女主剧情规划 = value; },
        设置玩家组织: (value: any) => { state.玩家组织 = value; },
        设置任务列表: (value: any) => { state.任务列表 = value; },
        应用并同步记忆系统: (value: any) => { state.记忆系统 = value; },
        performAutoSave,
        女主规划已启用: () => options?.heroinePlanEnabled !== false
    };
    return { deps, getSocial: () => social, getState: () => state, performAutoSave };
};

describe('运行时变量管理', () => {
    it('保存社交分区时保留人工填写的主要女性正式姓名', async () => {
        const { deps, getSocial, performAutoSave } = 创建依赖();
        const workflow = 创建运行时变量工作流(deps);

        await workflow.updateRuntimeVariableSection('社交', [
            {
                id: 'npc_manual_social_name',
                姓名: '黄蓉',
                性别: '女',
                年龄: 18,
                是否主要角色: true
            }
        ]);

        expect(getSocial()[0].姓名).toBe('黄蓉');
        expect(performAutoSave).toHaveBeenCalledWith(expect.objectContaining({
            social: expect.arrayContaining([
                expect.objectContaining({ 姓名: '黄蓉' })
            ]),
            force: true
        }));
    });

    it('关闭女主规划时忽略女主规划分区保存', async () => {
        const { deps, getState, performAutoSave } = 创建依赖({ heroinePlanEnabled: false });
        const workflow = 创建运行时变量工作流(deps);

        await workflow.updateRuntimeVariableSection('女主剧情规划', { 现状: '新规划' });

        expect(getState().女主剧情规划).toBeUndefined();
        expect(performAutoSave).not.toHaveBeenCalled();
    });

    it('关闭女主规划时忽略女主规划变量命令', async () => {
        const { deps, getState, performAutoSave } = 创建依赖({ heroinePlanEnabled: false });
        const workflow = 创建运行时变量工作流(deps);

        await workflow.applyRuntimeVariableCommand({ action: 'set', key: '女主剧情规划.现状', value: '新规划' } as any);

        expect(getState().女主剧情规划).toBeUndefined();
        expect(performAutoSave).not.toHaveBeenCalled();
    });

    it('忽略已退役功能分区保存', async () => {
        const { deps, getState, performAutoSave } = 创建依赖();
        const workflow = 创建运行时变量工作流(deps);

        await workflow.updateRuntimeVariableSection('战斗' as any, { 是否战斗中: true });

        expect('战斗' in getState()).toBe(false);
        expect(performAutoSave).not.toHaveBeenCalled();
    });

    it('保存玩家组织分区时同步当前组织状态', async () => {
        const { deps, getState, performAutoSave } = 创建依赖();
        const workflow = 创建运行时变量工作流(deps);

        await workflow.updateRuntimeVariableSection('玩家组织', { 名称: '新安全点', 玩家贡献: 180, 累计贡献: 1560, 任务列表: [] });

        expect(getState().玩家组织).toEqual(expect.objectContaining({ 名称: '新安全点', 玩家贡献: 180 }));
        expect(performAutoSave).toHaveBeenCalledWith(expect.objectContaining({
            sect: expect.objectContaining({ 名称: '新安全点', 玩家贡献: 180 }),
            force: true
        }));
    });

    it('忽略已退役功能变量命令且不触发全量旧状态写回', async () => {
        const { deps, getState, performAutoSave } = 创建依赖();
        const workflow = 创建运行时变量工作流(deps);

        await workflow.applyRuntimeVariableCommand({ action: 'set', key: '战斗.是否战斗中', value: true } as any);

        expect('战斗' in getState()).toBe(false);
        expect(performAutoSave).not.toHaveBeenCalled();
    });

    it('应用玩家组织变量命令时写回组织状态', async () => {
        const { deps, getState, performAutoSave } = 创建依赖();
        const workflow = 创建运行时变量工作流(deps);

        await workflow.applyRuntimeVariableCommand({ action: 'set', key: '玩家组织.玩家贡献', value: 180 } as any);

        expect(getState().玩家组织).toEqual(expect.objectContaining({ 玩家贡献: 180 }));
        expect(performAutoSave).toHaveBeenCalledWith(expect.objectContaining({
            sect: expect.objectContaining({ 玩家贡献: 180 }),
            force: true
        }));
    });
});
