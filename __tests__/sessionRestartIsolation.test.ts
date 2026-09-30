import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 创建会话生命周期工作流 } from '../hooks/useGame/sessionLifecycleWorkflow';
import { 执行世界生成工作流 } from '../hooks/useGame/worldGenerationWorkflow';
import { 执行开场剧情生成工作流 } from '../hooks/useGame/openingStoryWorkflow';
import { 保存设置 } from '../services/dbService';

vi.mock('../hooks/useGame/worldGenerationWorkflow', () => ({ 执行世界生成工作流: vi.fn() }));
vi.mock('../hooks/useGame/openingStoryWorkflow', () => ({ 执行开场剧情生成工作流: vi.fn() }));
vi.mock('../services/dbService', () => ({ 保存设置: vi.fn(async () => undefined) }));
vi.mock('../utils/apiConfig', () => ({ 获取主剧情接口配置: () => ({}), 接口配置是否可用: () => true }));

const createDeps = () => {
    const deps: any = {
        prompts: [{ id: 'core_world', 内容: 'original-world' }], 世界书列表: [{ id: 'original-book' }],
        历史记录: [], 社交: [], 任务列表: [], view: 'game', loading: false,
        深拷贝: (value: any) => value === undefined ? undefined : structuredClone(value),
        创建开场基础状态: () => ({}), 构建前端清空开场状态: () => ({}), 创建开场命令基态: () => ({}),
        规范化导演配置: () => ({}), 获取当前视觉设置快照: () => ({}), 获取当前场景图片档案快照: () => ({}),
        设置最近开局配置: (value: any) => { deps.最近开局配置 = value; }
    };
    for (const name of ['设置开局文章优化进度', '设置开局变量生成进度', '设置开局世界演变进度', '设置开局规划进度',
        '设置开局地图更新进度', '设置游戏设置', 'setPrompts', '设置世界书列表', '清空重Roll快照', '重置自动存档状态',
        '切换生图存档作用域', '设置场景图片档案', '设置角色锚点列表', '设置当前角色锚点ID', '设置开局配置',
        '设置导演配置', '应用开场基态', 'setLoading', '推入重Roll快照']) deps[name] = vi.fn();
    return deps;
};

describe('session restart isolation', () => {
    beforeEach(() => vi.clearAllMocks());

    it('captures a detached baseline and restores it for world restart, including the opening callback', async () => {
        const deps = createDeps();
        vi.mocked(执行世界生成工作流).mockImplementation(async (...args) => {
            const effects: any = args[7];
            effects.设置最近开局配置({ worldConfig: args[0], charData: args[1], openingStreaming: true, openingExtraPrompt: '' });
        });
        await 创建会话生命周期工作流(deps).handleGenerateWorld({} as any, {} as any, undefined, 'all');
        deps.prompts[0].内容 = 'generated-world';
        deps.世界书列表 = [{ id: 'changed-book' }];
        await 创建会话生命周期工作流(deps).handleQuickRestart('world_only');
        const effects: any = vi.mocked(执行世界生成工作流).mock.calls.at(-1)![7];
        expect(effects.prompts[0].内容).toBe('original-world');
        expect(deps.设置世界书列表).toHaveBeenCalledWith([{ id: 'original-book' }]);
        expect(保存设置).toHaveBeenCalledTimes(2);
        await effects.执行开场剧情生成({}, effects.prompts, true, {});
        const openingDeps: any = vi.mocked(执行开场剧情生成工作流).mock.calls.at(-1)![5];
        expect(openingDeps.worldbooks).toEqual([{ id: 'original-book' }]);
        expect(deps.推入重Roll快照).toHaveBeenCalledWith(expect.objectContaining({ 回档前世界书: [{ id: 'original-book' }], 回档前提示词池: effects.prompts }));
    });

    it('opening-only restart keeps the generated world instead of restoring the wizard baseline', async () => {
        const deps = createDeps();
        deps.最近开局配置 = { worldConfig: {}, charData: {}, openingStreaming: true, 提示词基线: { prompts: [], worldbooks: [] } };
        await 创建会话生命周期工作流(deps).handleQuickRestart('opening_only');
        expect(执行世界生成工作流).not.toHaveBeenCalled();
        expect(保存设置).not.toHaveBeenCalled();
        expect(vi.mocked(执行开场剧情生成工作流).mock.calls[0][1]).toBe(deps.prompts);
    });
});
