import { describe, expect, it, vi } from 'vitest';
import { 创建历史回合工作流 } from '../hooks/useGame/historyTurnWorkflow';

const 空记忆 = {
    回忆档案: [],
    即时记忆: [],
    短期记忆: [],
    中期记忆: [],
    长期记忆: []
};

const 克隆 = <T,>(value: T): T => (
    value === undefined ? value : JSON.parse(JSON.stringify(value))
);

const 创建响应 = (text = '旧正文'): any => ({
    logs: [{ sender: '旁白', text }],
    tavern_commands: []
});

const 创建基础依赖 = (overrides: Record<string, unknown> = {}) => ({
    历史记录: [{
        role: 'assistant',
        content: 'Structured Response',
        structuredResponse: 创建响应(),
        rawJson: '<正文>旧正文</正文>',
        timestamp: 1
    }],
    记忆系统: 空记忆,
    memoryConfig: { 即时消息上传条数N: 10 },
    gameConfig: {},
    prompts: [],
    内置提示词列表: [],
    世界书列表: [],
    loading: false,
    变量生成中: false,
    记忆总结阶段: 'idle',
    社交: [],
    visualConfig: {},
    visualConfigRef: { current: {} },
    场景图片档案Ref: { current: {} },
    scrollRef: { current: null },
    获取最新快照: () => ({
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
            剧情规划: {},
            女主剧情规划: {},
            记忆系统: 空记忆
        },
        回档前持久态: {
            视觉设置: {},
            场景图片档案: {}
        },
        回档前历史: []
    }),
    回档到快照: vi.fn(),
    弹出重Roll快照: vi.fn(),
    删除最近自动存档并重置状态: vi.fn(async () => undefined),
    深拷贝: 克隆,
    环境时间转标准串: () => '开局',
    规范化记忆配置: () => ({ 即时消息上传条数N: 10 }),
    规范化记忆系统: (raw?: any) => raw || 空记忆,
    规范化社交列表: (raw?: any[]) => raw || [],
    规范化视觉设置: (raw?: any) => raw || {},
    规范化场景图片档案: (raw?: any) => raw || {},
    normalizeCanonicalGameTime: (input?: string) => input || '',
    构建即时记忆条目: vi.fn(() => ({})),
    构建短期记忆条目: vi.fn(() => ({})),
    写入四段记忆: vi.fn((memory: any) => memory),
    估算AI输出Token: () => 0,
    提取解析失败原始信息: () => '',
    提取原始报错详情: () => '',
    构建标签解析选项: () => ({}),
    parseStoryRawText: () => 创建响应(),
    执行正文润色: vi.fn(),
    规范化游戏设置: (raw?: any) => raw || {},
    processResponseCommands: vi.fn((_response: any, baseState: any) => ({
        ...baseState,
        剧情规划: {},
        女主剧情规划: {}
    })),
    按世界演变分流净化响应: (response: any) => ({ response }),
    世界演变功能已开启: () => false,
    执行重解析变量生成: vi.fn(async (params: any) => params.parsedResponse),
    应用并同步记忆系统: vi.fn(),
    performAutoSave: vi.fn(async () => undefined),
    设置剧情: vi.fn(),
    设置历史记录: vi.fn(),
    设置玩家组织: vi.fn(),
    设置任务列表: vi.fn(),
    设置社交: vi.fn(),
    记录变量生成上下文: vi.fn(),
    set聊天区自动滚动抑制令牌: vi.fn(),
    获取NPC唯一标识: (_npc: any, index = 0) => String(index),
    合并NPC图片档案: (baseNpc: any) => baseNpc,
    ...overrides
}) as any;

describe('history turn variable retry', () => {
    it('keeps current history visible until variable retry has rebuilt the turn', async () => {
        let resolveVariable!: (value: any) => void;
        const variablePromise = new Promise<any>((resolve) => {
            resolveVariable = resolve;
        });
        const deps = 创建基础依赖({
            执行重解析变量生成: vi.fn(() => variablePromise)
        });
        const workflow = 创建历史回合工作流(deps);

        const retryPromise = workflow.handleRetryLatestVariableGeneration();
        await Promise.resolve();

        expect(deps.执行重解析变量生成).toHaveBeenCalledTimes(1);
        expect(deps.回档到快照).not.toHaveBeenCalled();
        expect(deps.设置历史记录).not.toHaveBeenCalled();

        resolveVariable({
            ...创建响应(),
            tavern_commands: [{ action: 'set', key: 'gameState.角色.金钱', value: 1 }]
        });
        await retryPromise;

        expect(deps.回档到快照).toHaveBeenCalledTimes(1);
        expect(deps.设置历史记录).toHaveBeenCalledTimes(1);
        expect(deps.设置历史记录.mock.calls[0][0][0].structuredResponse.tavern_commands).toHaveLength(1);
    });

    it('does not feed previous supplemental commands back into variable retry', async () => {
        const mainCommand = { action: 'set', key: 'gameState.环境.具体地点', value: '302室' };
        const oldVariableCommand = { action: 'push', key: 'gameState.社交[0].记忆', value: '旧变量补充' };
        const oldPlanningCommand = { action: 'push', key: 'gameState.女主剧情规划.女主互动事件', value: { 女主姓名: '王秀芳', 事件名: '晨间偶遇' } };
        const deps = 创建基础依赖({
            历史记录: [{
                role: 'assistant',
                content: 'Structured Response',
                structuredResponse: {
                    logs: [{ sender: '旁白', text: '旧正文' }],
                    tavern_commands: [mainCommand, oldVariableCommand, oldPlanningCommand, oldPlanningCommand],
                    variable_calibration_commands: [oldVariableCommand],
                    planning_analysis_commands: [oldPlanningCommand]
                },
                rawJson: '<正文>旧正文</正文>',
                timestamp: 1
            }],
            执行重解析变量生成: vi.fn(async (params: any) => ({
                ...params.parsedResponse,
                tavern_commands: [
                    ...(Array.isArray(params.parsedResponse?.tavern_commands) ? params.parsedResponse.tavern_commands : []),
                    { action: 'push', key: 'gameState.社交[0].记忆', value: '新变量补充' }
                ],
                variable_calibration_commands: [
                    { action: 'push', key: 'gameState.社交[0].记忆', value: '新变量补充' }
                ]
            }))
        });
        const workflow = 创建历史回合工作流(deps);

        await workflow.handleRetryLatestVariableGeneration();

        expect(deps.执行重解析变量生成).toHaveBeenCalledTimes(1);
        const retryInput = deps.执行重解析变量生成.mock.calls[0][0].parsedResponse;
        expect(retryInput.tavern_commands).toEqual([mainCommand, oldPlanningCommand]);

        const rebuilt = deps.设置历史记录.mock.calls[0][0][0].structuredResponse;
        expect(rebuilt.tavern_commands).toEqual([
            mainCommand,
            oldPlanningCommand,
            { action: 'push', key: 'gameState.社交[0].记忆', value: '新变量补充' }
        ]);
        expect(rebuilt.variable_calibration_commands).toEqual([
            { action: 'push', key: 'gameState.社交[0].记忆', value: '新变量补充' }
        ]);
    });
});
