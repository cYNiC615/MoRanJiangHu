import { describe, expect, it } from 'vitest';
import { 构建变量路径登记提示 } from '../utils/variableRegistry';

describe('variable registry priority', () => {
    it('keeps important writable root domains visible when character and social records are large', () => {
        const manyFields = Object.fromEntries(Array.from({ length: 260 }, (_, index) => [`字段${index}`, index]));
        const prompt = 构建变量路径登记提示({
            角色: manyFields,
            环境: { 大地点: '海川市', 小地点: '槐树街老社区' },
            社交: [{ 姓名: '林知夏', 是否主要角色: true, 是否队友: true, ...manyFields }],
            世界: { 地图层级: [] },
            玩家组织: { 名称: '海川大学项目组', 兑换列表: [] },
            任务列表: []
        });

        expect(prompt).toContain('- 角色');
        expect(prompt).toContain('- 环境');
        expect(prompt).toContain('- 社交');
        expect(prompt).toContain('- 世界');
        expect(prompt).toContain('- 玩家组织');
        expect(prompt).toContain('- 任务列表');
    });
});
