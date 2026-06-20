import { describe, expect, it } from 'vitest';
import { 获取题材预设背景, 获取题材预设天赋, 预设背景, 预设天赋 } from '../data/presets';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('topic mode talent and background presets', () => {
    it('每个官方题材模式都有专属天赋和身份背景池', () => {
        for (const mode of 题材模式顺序) {
            const talents = 获取题材预设天赋(mode);
            const backgrounds = 获取题材预设背景(mode);

            expect(talents.length, `${mode}:talents`).toBeGreaterThanOrEqual(8);
            expect(backgrounds.length, `${mode}:backgrounds`).toBeGreaterThanOrEqual(8);
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

    it('现代都市默认池是普通现实身份，不预置通用随身物品', () => {
        const talents = 获取题材预设天赋('现代都市');
        const backgrounds = 获取题材预设背景('现代都市');
        const talentNames = talents.map((item) => item.名称);
        const backgroundNames = backgrounds.map((item) => item.名称);

        expect(talents).toHaveLength(12);
        expect(backgrounds).toHaveLength(10);
        expect(backgroundNames).toEqual([
            '普通大学生',
            '兼职打工',
            '家教兼职',
            '企业实习生',
            '合租青年',
            '社团成员',
            '夜校学生',
            '自由接单者',
            '社区志愿者',
            '小店店员'
        ]);
        expect(talentNames).toContain('信息检索');
        expect(talentNames).toContain('边界感');
        expect(backgroundNames).not.toContain('公司职员');
        expect(backgroundNames).not.toContain('小店店主');
        expect(backgroundNames).not.toContain('基层公务员');

        for (const background of backgrounds) {
            expect(background.初始物品 || [], background.名称).toEqual([]);
            expect(background.可选初始物品 || [], background.名称).toEqual([]);
            expect(background.开局货币, background.名称).toBeUndefined();
        }
    });

    it('西方奇幻天赋卷宗不直接混入武侠默认天赋名', () => {
        const talentNames = 获取题材预设天赋('西方奇幻').map((item) => item.名称);

        expect(talentNames).toContain('魔力亲和');
        expect(talentNames).toContain('骑士誓言');
        expect(talentNames).toContain('幸运银币');
        expect(talentNames).not.toContain('稳扎稳打');
        expect(talentNames).not.toContain('过目不忘');
        expect(talentNames).not.toContain('山水识路');
        expect(talentNames).not.toContain('百工底子');
    });

    it('无限流身份和天赋贴合主神空间口径', () => {
        const talentNames = 获取题材预设天赋('无限流').map((item) => item.名称);
        const backgroundNames = 获取题材预设背景('无限流').map((item) => item.名称);

        expect(talentNames).toContain('情报记忆');
        expect(talentNames).toContain('恐惧抗性');
        expect(talentNames).toContain('主神商城估价');
        expect(talentNames).toContain('兑换规划');
        expect(backgroundNames).toContain('恐怖片影迷');
        expect(backgroundNames).toContain('退役密室主持');
        expect(backgroundNames).toContain('末班地铁乘客');

        expect(backgroundNames).not.toContain('名门之后');
        expect(backgroundNames).not.toContain('王府世子');
        expect(backgroundNames).not.toContain('宗门旧徒');
    });
});
