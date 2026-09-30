import { describe, expect, it } from 'vitest';
import { 获取题材预设背景, 获取题材预设天赋, 预设背景, 预设天赋 } from '../data/presets';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('topic mode talent and background presets', () => {
    it('每个官方题材模式都有专属天赋和身份背景池', () => {
        for (const mode of 题材模式顺序) {
            const talents = 获取题材预设天赋(mode);
            const backgrounds = 获取题材预设背景(mode);

            expect(talents.length, `${mode}:talents`).toBeGreaterThan(0);
            expect(backgrounds.length, `${mode}:backgrounds`).toBeGreaterThan(0);
            expect(new Set(talents.map((item) => item.名称)).size, `${mode}:talent-names`).toBe(talents.length);
            expect(new Set(backgrounds.map((item) => item.名称)).size, `${mode}:background-names`).toBe(backgrounds.length);

            for (const talent of talents) {
                expect(talent.名称, `${mode}:talent-name`).toBeTruthy();
                expect(talent.描述, `${mode}:${talent.名称}:desc`).toBeTruthy();
                expect(talent.效果, `${mode}:${talent.名称}:effect`).toBeTruthy();
            }
            for (const background of backgrounds) {
                expect(background.名称, `${mode}:background-name`).toBeTruthy();
                expect(background.描述, `${mode}:${background.名称}:desc`).toBeTruthy();
                expect(background.效果, `${mode}:${background.名称}:effect`).toBeTruthy();
            }
        }
    });

    it('新增模式不能静默回退到武侠默认池', () => {
        for (const mode of 题材模式顺序.filter((item) => item !== '武侠')) {
            expect(获取题材预设天赋(mode), `${mode}:talents`).not.toEqual(预设天赋);
            expect(获取题材预设背景(mode), `${mode}:backgrounds`).not.toEqual(预设背景);
        }
    });

    it('现代都市默认背景不预置通用随身物品或开局货币', () => {
        const backgrounds = 获取题材预设背景('现代都市');

        for (const background of backgrounds) {
            expect(background.初始物品 || [], background.名称).toEqual([]);
            expect(background.可选初始物品 || [], background.名称).toEqual([]);
            expect(background.开局货币, background.名称).toBeUndefined();
        }
    });

});
