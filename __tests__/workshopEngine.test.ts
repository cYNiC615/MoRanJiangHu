import { describe, expect, it } from 'vitest';
import {
    合并题材世界默认值,
    创建主题默认世界配置,
    创建主题默认开局配置,
    获取创意工坊角色默认值,
    获取创意工坊新开局步骤列表,
    获取题材模式配置,
    规范化题材模式,
    题材模式顺序,
    解析创意工坊主题配置
} from '../utils/workshopEngine';
import { 题材模式配置表 } from '../data/workshopThemes/topicModeThemeData';
import type { 题材模式类型 } from '../models/system';

describe('本地模式包主题引擎', () => {
    it('从默认主题生成旧版兼容的新建存档流程', () => {
        const steps = 获取创意工坊新开局步骤列表();

        expect(steps.map((step) => step.id)).toEqual(['world', 'backgrounds', 'character', 'companion', 'opening', 'confirm']);
        expect(steps.map((step) => step.label)).toEqual(['世界观', '天赋背景', '角色基础', '开局伙伴', '开局配置', '确认生成']);
    });

    it('默认世界、角色和开局配置由现代都市主题文件提供', () => {
        const world = 创建主题默认世界配置();
        const role = 获取创意工坊角色默认值();
        const opening = 创建主题默认开局配置();

        expect(world.worldName).toBe('海川市');
        expect(world.worldSize).toBe('弹丸之地');
        expect(world.modeRuntimeProfile?.identity.baseMode).toBe('现代都市');
        expect(role.appearance).toContain('黑发黑眸');
        expect(opening.题材模式).toBe('现代都市');
        expect(opening.开局生成组织).toBe(false);
        expect(opening.开局生成成员).toBe(false);
        expect(opening.初始伙伴?.enabled).toBe(false);
        expect(opening.modeRuntimeProfile?.identity.baseMode).toBe('现代都市');
    });

    it('显式选择武侠时仍能生成旧题材配置', () => {
        const world = 创建主题默认世界配置('武侠');
        const opening = 创建主题默认开局配置('武侠');

        expect(world.worldName).toBe('墨澜江湖');
        expect(world.modeRuntimeProfile?.identity.baseMode).toBe('武侠');
        expect(opening.初始伙伴?.关系).toBe('自幼相识的同行伙伴');
        expect(opening.modeRuntimeProfile?.identity.baseMode).toBe('武侠');
    });

    it('能规范化不完整主题配置并补齐必要步骤', () => {
        const theme = 解析创意工坊主题配置({
            id: 'custom',
            title: '自定义主题',
            description: '测试主题',
            creationFlow: [{ id: 'world', label: '世界设定' }] as any
        });

        expect(theme.id).toBe('custom');
        expect(theme.creationFlow.some((step) => step.id === 'confirm')).toBe(true);
        expect(theme.creationFlow.find((step) => step.id === 'world')?.label).toBe('世界设定');
    });

    it('官方题材模式数据已从工具层剥离到主题数据文件', () => {
        expect(Object.keys(题材模式配置表)).toContain('武侠');
        expect(题材模式配置表.仙侠.worldDefaults.worldExtraRequirement).toContain('灵石');
    });

    it('题材类型、顺序和主题配置保持一一对应', () => {
        const expected: 题材模式类型[] = ['武侠', '仙侠', '西方奇幻', '灵气复苏', '都市修仙', '现代都市', '末日丧尸', '无限流'];

        expect(题材模式顺序).toEqual(expected);
        expect(Object.keys(题材模式配置表).sort()).toEqual([...expected].sort());

        for (const mode of expected) {
            const profile = 获取题材模式配置(mode);
            expect(profile.value).toBe(mode);
            expect(profile.promptLines.length, `${mode}:promptLines`).toBeGreaterThan(0);
            expect(profile.manualRealmPrompt, `${mode}:manualRealmPrompt`).toBeTruthy();
            expect(profile.promptBoundary, `${mode}:promptBoundary`).toBeTruthy();
        }
    });

    it('workshopEngine 导出题材兼容访问函数', () => {
        expect(规范化题材模式('灵气修仙')).toBe('灵气复苏');
        expect(规范化题材模式('末世丧尸')).toBe('末日丧尸');
        expect(规范化题材模式('不存在')).toBe('现代都市');

        const merged = 合并题材世界默认值('无限流', { manualRealmPrompt: 'custom realm' });
        expect(merged.worldName).toBe('主神空间');
        expect(merged.manualRealmPrompt).toBe('custom realm');
    });
});
