import { describe, expect, it, vi } from 'vitest';
import { 创建变量校准协调器 } from '../hooks/useGame/variableCalibrationCoordinator';

const 克隆 = <T,>(value: T): T => (
    value === undefined ? value : JSON.parse(JSON.stringify(value))
);

const 创建快照 = () => ({
    玩家输入: '',
    游戏时间: '',
    回档前状态: {
        角色: {},
        环境: {},
        社交: [],
        世界: {},
        玩家组织: {},
        任务列表: [],
        剧情: {},
        女主剧情规划: {},
        记忆系统: {}
    },
    回档前历史: []
});

const 创建依赖 = (overrides: Record<string, unknown> = {}) => ({
    apiConfig: {},
    gameConfig: {},
    prompts: [],
    开局配置: undefined,
    内置提示词列表: [],
    世界书列表: [],
    世界演变进行中Ref: { current: false },
    variableGenerationAbortControllerRef: { current: null },
    set变量生成中: vi.fn(),
    深拷贝: 克隆,
    世界演变功能已开启: () => false,
    等待世界演变空闲: vi.fn(async () => undefined),
    收集最近变量生成上下文: () => [],
    执行变量模型校准工作流: vi.fn(async () => null),
    合并变量生成结果到响应: vi.fn((response: any, calibration: any) => ({
        ...response,
        tavern_commands: calibration.commands
    })),
    变量生成功能已启用: () => true,
    获取变量计算接口配置: () => ({}),
    接口配置是否可用: () => true,
    序列化变量生成命令: (cmd: any) => `${cmd.action} ${cmd.key}`,
    使用快照重建解析回合: vi.fn(async () => undefined),
    ...overrides
}) as any;

describe('variable calibration retry coordinator', () => {
    it('marks reparse variable retry as running until the model resolves', async () => {
        let resolveModel!: (value: any) => void;
        const modelPromise = new Promise<any>((resolve) => {
            resolveModel = resolve;
        });
        let modelParams: any;
        const deps = 创建依赖({
            执行变量模型校准工作流: vi.fn((params: any) => {
                modelParams = params;
                return modelPromise;
            })
        });
        const coordinator = 创建变量校准协调器(deps);

        const retryPromise = coordinator.执行重解析变量校准({
            snapshot: 创建快照() as any,
            playerInput: '',
            parsedResponse: { logs: [], tavern_commands: [] } as any
        });
        await Promise.resolve();

        expect(deps.set变量生成中).toHaveBeenCalledWith(true);
        expect(modelParams.signal).toBeInstanceOf(AbortSignal);
        expect(deps.variableGenerationAbortControllerRef.current).toBeInstanceOf(AbortController);

        resolveModel({
            commands: [{ action: 'set', key: 'gameState.角色.金钱', value: 1 }],
            reports: [],
            rawText: '',
            model: 'test'
        });
        await retryPromise;

        expect(deps.set变量生成中).toHaveBeenLastCalledWith(false);
        expect(deps.variableGenerationAbortControllerRef.current).toBeNull();
    });
});
