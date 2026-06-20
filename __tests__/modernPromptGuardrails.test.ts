import { describe, expect, it } from 'vitest';
import { 获取世界观生成系统提示词 } from '../prompts/runtime/worldGeneration';
import { 构建世界观种子提示词 } from '../prompts/runtime/worldSetup';
import { 开局变量生成附加提示词 } from '../prompts/runtime/openingVariableGenerationInit';
import { 开局世界演变初始化附加提示词 } from '../prompts/runtime/openingWorldEvolutionInit';
import { 开场初始化任务提示词 } from '../prompts/runtime/opening';
import { 构建变量模型职责提示词 } from '../prompts/runtime/variableModel';
import { 构建世界演变系统提示词 } from '../prompts/runtime/worldEvolution';
import { 世界数据结构参考 } from '../prompts/runtime/worldDataSchema';
import { 数值_世界演化 } from '../prompts/stats/world';

describe('modern urban prompt guardrails', () => {
    it('现代默认 prompt 不强制生成势力数量或每轮势力互动', () => {
        const combined = [
            获取世界观生成系统提示词({ topicMode: '现代都市', 生成世界基底: true } as any),
            构建世界观种子提示词({
                worldName: '镜湖市',
                worldSize: '单城',
                dynastySetting: '现代城市',
                sectDensity: '低',
                tianjiaoSetting: '现实资源与心理韧性',
                difficulty: 'normal',
                worldExtraRequirement: ''
            } as any, {
                姓名: '沈砚',
                性别: '男',
                年龄: 22,
                出生日期: '',
                外貌: '',
                性格: '',
                力量: 5,
                敏捷: 5,
                体质: 5,
                根骨: 5,
                悟性: 5,
                福源: 5,
                天赋列表: [],
                出身背景: {}
            } as any, { 题材模式: '现代都市' } as any),
            开局变量生成附加提示词,
            开局世界演变初始化附加提示词,
            开场初始化任务提示词,
            构建变量模型职责提示词(),
            构建世界演变系统提示词({ topicMode: '现代都市' } as any),
            世界数据结构参考,
            数值_世界演化.内容
        ].join('\n');

        expect(combined).not.toMatch(/生成\s*5-15\s*个势力/u);
        expect(combined).not.toContain('必须保证 `世界.势力列表` 不为空');
        expect(combined).not.toContain('每次世界演化至少产生 1 个势力互动事件');
        expect(combined).toContain('"势力列表": []');
        expect(combined).not.toContain('"势力列表": [\n      {"ID":"FCT-001"');
        expect(combined).toContain('没有明确组织行动或势力结构时，允许 `世界.势力列表` 为空');
        expect(combined).toMatch(/学校|公司|社团|利益集团/u);
        expect(combined).toContain('主线不是短待办');
        expect(combined).toContain('角色种子ID');
    });
});
