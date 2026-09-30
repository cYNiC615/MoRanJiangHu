import { describe, expect, it } from 'vitest';
import { 收集未登记规划人物 } from '../utils/planningDiagnostics';
import {
    构建规划性别比例约束摘要,
    构建统一规划分析用户提示词
} from '../prompts/runtime/planningAnalysis';

describe('planning prompts', () => {
    it('reports unresolved references without mutating plans or treating seeds and aliases as missing NPCs', () => {
        const plan: any = { 当前章任务: [{ 当前状态: '未开始', 关联人物: ['主角', '老林', '种子角色', '未登记人物', '未登记人物'] }], 镜头规划: [] };
        const before = structuredClone(plan);
        const result = 收集未登记规划人物(plan, [{ 姓名: '林知夏', 曾用名: ['老林'] }], '主角', {
            角色种子定义: [{ id: 'seed', 名称: '种子角色', 是否启用: true, 入口摘要: '' }]
        });
        expect(result).toEqual([{ path: '当前章任务[0].关联人物', name: '未登记人物' }]);
        expect(plan).toEqual(before);
    });
    it('passes the supplied gender ratio summary into the planning request', () => {
        const genderRatioConstraintText = 构建规划性别比例约束摘要('1:9');
        const userPrompt = 构建统一规划分析用户提示词({
            currentStoryJson: '{}',
            currentHeroinePlanJson: '{}',
            worldJson: '{"NPC系统":{"男女比例":"1:9"}}',
            socialJson: '[]',
            envJson: '{}',
            recentBodiesText: '正文',
            auditFocusText: '常规回合固定审计',
            genderRatioConstraintText,
            heroineEnabled: true
        });

        expect(genderRatioConstraintText).toContain('1:9');
        expect(userPrompt.split(genderRatioConstraintText)).toHaveLength(2);
    });

    it('renders structured gender ratio values into an explicit planning constraint block', () => {
        const summary = 构建规划性别比例约束摘要({ 男: 10, 女: 80, 男娘: 5, 扶她: 5 });

        expect(summary).toContain('男:10，女:80，男娘:5，扶她:5');
    });

    it('does not imply heroine planning exists when heroine planning is disabled', () => {
        const params = {
            currentStoryJson: '{}',
            currentHeroinePlanJson: '{"id":"heroine-plan-marker"}',
            worldJson: '{}',
            socialJson: '[]',
            envJson: '{}',
            recentBodiesText: '正文里提到一位女性路人。',
            auditFocusText: '常规回合固定审计',
            heroineEnabled: false
        };

        expect(构建统一规划分析用户提示词(params)).not.toContain('heroine-plan-marker');
        expect(构建统一规划分析用户提示词({ ...params, heroineEnabled: true })).toContain('heroine-plan-marker');
    });

});
