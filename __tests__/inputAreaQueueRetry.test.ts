import { describe, expect, it } from 'vitest';
import { 获取队列阶段重新生成操作 } from '../components/features/Chat/InputArea';

describe('InputArea queue retry controls', () => {
    it('does not expose a dead retry button for opening variable generation', () => {
        expect(获取队列阶段重新生成操作({
            stageId: 'variable',
            phase: 'done',
            variableGenerationRunning: false,
            canRetryLatestVariableGeneration: false,
            hasRetryLatestVariableGeneration: true
        })).toBeNull();
    });

    it('keeps retry visible only for actionable variable generation', () => {
        expect(获取队列阶段重新生成操作({
            stageId: 'variable',
            phase: 'done',
            variableGenerationRunning: false,
            canRetryLatestVariableGeneration: true,
            hasRetryLatestVariableGeneration: true
        })).toBe('retry-variable');
    });

    it('does not show no-op retry buttons on local or unimplemented stages', () => {
        for (const stageId of ['opening-input', 'opening-story', 'world', 'planning', 'opening-map', 'opening-save']) {
            expect(获取队列阶段重新生成操作({
                stageId,
                phase: 'done',
                variableGenerationRunning: false,
                canRetryLatestVariableGeneration: true,
                hasRetryLatestVariableGeneration: true
            })).toBeNull();
        }
    });
});
