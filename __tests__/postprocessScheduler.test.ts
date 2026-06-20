import { describe, expect, it } from 'vitest';
import { 判定后处理调度请求 } from '../hooks/useGame/postprocessScheduler';
import type { GameResponse, PostprocessSignal } from '../types';

const 可靠否信号: PostprocessSignal = {
    needsPlanningAnalysis: false,
    needsWorldEvolution: false,
    reason: '模型判断无需后处理'
};

const 进行中主线状态 = {
    任务列表: [
        { 名称: '主线：新的城市生活', 类型: '主线', 状态: '进行中' }
    ]
};

const 构建响应 = (partial: Partial<GameResponse>): Partial<GameResponse> => ({
    logs: [{ sender: '旁白', text: '今天很平静。' }],
    ...partial
});

describe('postprocessScheduler', () => {
    it('后处理信号缺失或解析失败时安全兜底触发规划和世界演变', () => {
        const missing = 判定后处理调度请求({
            response: 构建响应({}),
            state: 进行中主线状态
        });
        expect(missing.signalReliable).toBe(false);
        expect(missing.planningStageRequested).toBe(true);
        expect(missing.worldStageRequested).toBe(true);
        expect([...missing.planningReasons, ...missing.worldReasons].join(' ')).toContain('安全兜底');

        const parseError = 判定后处理调度请求({
            postprocessSignal: {
                ...可靠否信号,
                parseError: 'invalid json'
            },
            response: 构建响应({}),
            state: 进行中主线状态
        });
        expect(parseError.signalReliable).toBe(false);
        expect(parseError.planningStageRequested).toBe(true);
        expect(parseError.worldStageRequested).toBe(true);
    });

    it('可靠信号均为否且无本地规则命中时不请求后处理阶段', () => {
        const result = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({}),
            state: 进行中主线状态
        });
        expect(result.signalReliable).toBe(true);
        expect(result.planningStageRequested).toBe(false);
        expect(result.worldStageRequested).toBe(false);
        expect(result.planningReasons).toEqual([]);
        expect(result.worldReasons).toEqual([]);
    });

    it('可靠信号均为否但 dynamic_world 非空时只强制世界演变', () => {
        const result = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({
                dynamic_world: ['远处的投资人开始重新分配资源。']
            }),
            state: 进行中主线状态
        });
        expect(result.planningStageRequested).toBe(false);
        expect(result.worldStageRequested).toBe(true);
        expect(result.worldReasons.join(' ')).toContain('动态世界');
    });

    it('可靠信号均为否但主线任务缺失时强制规划分析', () => {
        const result = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({}),
            state: { 任务列表: [] }
        });
        expect(result.planningStageRequested).toBe(true);
        expect(result.worldStageRequested).toBe(false);
        expect(result.planningReasons.join(' ')).toContain('主线任务');
    });

    it('可靠信号均为否但主线任务完成或失效时强制规划分析', () => {
        const finished = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({}),
            state: { 任务列表: [{ 名称: '主线：初入校园', 类型: '主线', 状态: '已完成' }] }
        });
        expect(finished.planningStageRequested).toBe(true);
        expect(finished.planningReasons.join(' ')).toContain('已完成');

        const invalid = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({}),
            state: { 任务列表: [{ 名称: '主线：旧线索', 类型: '主线', 状态: '失效' }] }
        });
        expect(invalid.planningStageRequested).toBe(true);
        expect(invalid.planningReasons.join(' ')).toContain('已完成/失效');
    });

    it('可靠信号均为否但正文或剧情规划出现承接词时强制规划分析', () => {
        const result = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({
                logs: [{ sender: '旁白', text: '这次关系突破需要下一回合强制接住，冲突升级已经压到台前。' }]
            }),
            state: 进行中主线状态
        });
        expect(result.planningStageRequested).toBe(true);
        expect(result.worldStageRequested).toBe(false);
        expect(result.planningReasons.join(' ')).toMatch(/关系突破|冲突升级|强制接住/);
    });

    it('可靠信号均为否但新主要角色由命令成立并在本回合被提及时强制规划分析', () => {
        const result = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({
                logs: [{ sender: '旁白', text: '林知夏正式卷入主线，玩家需要决定是否信任她。' }],
                tavern_commands: [
                    { action: 'push', key: '社交', value: { 姓名: '林知夏', 是否主要角色: true } }
                ]
            }),
            state: {
                ...进行中主线状态,
                社交: [{ 姓名: '林知夏', 是否主要角色: true }]
            }
        });
        expect(result.planningStageRequested).toBe(true);
        expect(result.planningReasons.join(' ')).toContain('新主要角色');
    });

    it('可靠信号均为否但正文或剧情规划出现世界侧后果时强制世界演变', () => {
        const result = 判定后处理调度请求({
            postprocessSignal: 可靠否信号,
            response: 构建响应({
                logs: [{ sender: '旁白', text: '数日后，城市发生重大事件，某公司开始组织行动，后台余波扩散到新区。' }]
            }),
            state: 进行中主线状态
        });
        expect(result.planningStageRequested).toBe(false);
        expect(result.worldStageRequested).toBe(true);
        expect(result.worldReasons.join(' ')).toMatch(/重大事件|组织行动|后台余波/);
    });
});
