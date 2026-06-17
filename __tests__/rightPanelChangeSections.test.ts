import { describe, expect, it } from 'vitest';
import { 提取结构化响应变化区域 } from '../App';

describe('right panel change sections', () => {
    it('does not mark planning tabs for empty planning shells', () => {
        const sections = 提取结构化响应变化区域({
            tavern_commands: [
                { action: 'set', key: 'gameState.剧情规划', value: { 当前章任务: [], 换章规则: {} } },
                { action: 'set', key: 'gameState.女主剧情规划', value: { 女主关系主线: [], 女主互动事件: [] } }
            ],
            planning_analysis_updated: true,
            planning_analysis_commands: []
        });

        expect(sections).not.toContain('剧情规划');
        expect(sections).not.toContain('女主剧情规划');
    });

    it('separates story planning from heroine planning red dots', () => {
        expect(提取结构化响应变化区域({
            planning_analysis_commands: [
                { action: 'set', key: 'gameState.剧情规划.当前章任务', value: [{ 标题: '调查旧仓库' }] }
            ]
        })).toContain('剧情规划');

        const heroineSections = 提取结构化响应变化区域({
            planning_analysis_commands: [
                { action: 'set', key: 'gameState.女主剧情规划.女主互动事件', value: [{ 事件名: '雨夜同行' }] }
            ]
        });
        expect(heroineSections).toContain('女主剧情规划');
        expect(heroineSections).not.toContain('剧情规划');
    });
});
