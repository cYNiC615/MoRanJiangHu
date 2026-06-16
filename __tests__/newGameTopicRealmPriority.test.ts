import { describe, expect, it } from 'vitest';
import { 选择开局境界体系来源 } from '../hooks/useGame/worldGenerationWorkflow';
import { 构建开局配置提示词, 构建题材模式提示词 } from '../prompts/runtime/openingConfig';
import { 构建官方模式运行时配置, 获取题材顶部时间显示格式 } from '../utils/modeRuntimeProfile';
import { 规范化开局配置 } from '../utils/openingConfig';

describe('新开局题材模式与手动境界优先级', () => {
    it('仙侠题材启用开局配置时，手动境界提示词优先于固定仙侠境界', () => {
        const source = 选择开局境界体系来源({
            启用成长体系: true,
            手动境界提示词: '<境界体系>凡骨境 -> 入道境 -> 星河境</境界体系>',
            是仙侠题材: true,
            启用模式能力体系: false
        });

        expect(source).toBe('manual');
    });

    it('关闭开局配置时，题材模式仍然保留单一货币口径，但不注入开局关系约束', () => {
        const config = 规范化开局配置({
            配置约束启用: false,
            题材模式: '仙侠'
        });

        const topicPrompt = 构建题材模式提示词(config);
        const openingPrompt = 构建开局配置提示词(config);

        expect(topicPrompt).toContain('题材模式：仙侠世界');
        expect(topicPrompt).toContain('现代单一货币');
        expect(topicPrompt).toContain('角色.金钱.baseAmount');
        expect(openingPrompt).toBe('');
    });

    it('西方奇幻模式包会禁止正文使用东方古法时间词', () => {
        const runtime = 构建官方模式运行时配置('西方奇幻');
        const config = 规范化开局配置({
            配置约束启用: true,
            题材模式: '西方奇幻',
            modeRuntimeProfile: runtime
        });
        const topicPrompt = 构建题材模式提示词(config);

        expect(runtime.time.displayFormat).toBe('western');
        expect(runtime.time.bannedTimeTerms).toContain('时辰');
        expect(topicPrompt).toContain('运行时时间口径');
        expect(topicPrompt).toContain('禁止：时辰');
        expect(topicPrompt).toContain('王国历');
    });

    it('顶部时间显示跟随题材时，西幻走数字显示，武侠保留传统显示', () => {
        expect(获取题材顶部时间显示格式(构建官方模式运行时配置('西方奇幻'), '西方奇幻')).toBe('数字');
        expect(获取题材顶部时间显示格式(构建官方模式运行时配置('武侠'), '武侠')).toBe('传统');
    });
});
