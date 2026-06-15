import { describe, expect, it } from 'vitest';
import { 构建变量路径登记提示 } from '../utils/variableRegistry';

describe('variable registry priority', () => {
    it('keeps important writable root domains visible when character and social records are large', () => {
        const manyFields = Object.fromEntries(Array.from({ length: 260 }, (_, index) => [`字段${index}`, index]));
        const prompt = 构建变量路径登记提示({
            角色: manyFields,
            环境: { 大地点: '主神空间', 小地点: '金属房间' },
            社交: [{ 姓名: '俞月荷', 是否主要角色: true, 是否队友: true, ...manyFields }],
            世界: { 地图层级: [] },
            战斗: { 是否战斗中: false, 敌方: [] },
            玩家组织: { 名称: '零号临时同盟', 兑换列表: [] },
            任务列表: [],
            约定列表: []
        });

        expect(prompt).not.toContain('- 战斗');
        expect(prompt).not.toContain('- 玩家组织');
        expect(prompt).toContain('- 任务列表');
        expect(prompt).toContain('- 约定列表');
    });
});
