import { describe, expect, it } from 'vitest';
import { 获取题材预设天赋, 获取题材预设背景 } from '../data/presets';
import { 获取题材开局配置文案, 规范化开局配置 } from '../utils/openingConfig';
import { 构建官方模式运行时配置 } from '../utils/modeRuntimeProfile';
import { 构建开局配置提示词 } from '../prompts/runtime/openingConfig';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('开局配置题材边界', () => {
    it('末日丧尸会保留营地和队友生成开关', () => {
        const config = 规范化开局配置({
            题材模式: '末日丧尸',
            开局生成组织: true,
            开局生成成员: true
        });

        expect(config.开局生成组织).toBe(true);
        expect(config.开局生成成员).toBe(true);
    });

    it('末世丧尸作为旧称会规范化到末日丧尸', () => {
        const config = 规范化开局配置({
            题材模式: '末世丧尸'
        });

        expect(config.题材模式).toBe('末日丧尸');
    });

    it('末日丧尸界面文案不把组织显示成旧门派成员', () => {
        const copy = 获取题材开局配置文案('末日丧尸');

        expect(copy.organizationEnabled).toBe(true);
        expect(copy.organizationTitle).toBe('开局生成营地');
        expect(copy.memberTitle).toBe('开局生成队友');
        expect(copy.organizationDescription).toContain('营地');
        expect(copy.memberDescription).toContain('队友');
        expect(copy.cutInLabels.门派起手?.label).toBe('营地起手');
    });

    it('现代都市会把组织位显示为现实组织和成员', () => {
        const config = 规范化开局配置({
            题材模式: '现代都市',
            开局生成组织: true,
            开局生成成员: true
        });
        const copy = 获取题材开局配置文案('现代都市');

        expect(config.开局生成组织).toBe(true);
        expect(config.开局生成成员).toBe(true);
        expect(copy.organizationEnabled).toBe(true);
        expect(copy.organizationTitle).toBe('开局生成组织');
        expect(copy.memberTitle).toBe('开局生成成员');
        expect(copy.organizationDescription).toContain('公司');
    });

    it('每个题材都有 30 个官方背景和 30 个官方天赋', () => {
        题材模式顺序.forEach((mode) => {
            expect(获取题材预设背景(mode), mode).toHaveLength(30);
            expect(获取题材预设天赋(mode), mode).toHaveLength(30);
        });
    });

    it('开局生成性别缺失、空值或非法值时回退为全选', () => {
        expect(规范化开局配置({ 题材模式: '武侠' }).允许生成性别).toEqual(['男', '女', '男娘', '扶她']);
        expect(规范化开局配置({ 题材模式: '武侠', 允许生成性别: [] }).允许生成性别).toEqual(['男', '女', '男娘', '扶她']);
        expect(规范化开局配置({ 题材模式: '武侠', 允许生成性别: ['未知', '妖'] }).允许生成性别).toEqual(['男', '女', '男娘', '扶她']);
    });

    it('开局生成性别保留合法多选并去重', () => {
        const config = 规范化开局配置({
            题材模式: '武侠',
            允许生成性别: ['女', '女', '扶她', '未知', '男娘']
        });

        expect(config.允许生成性别).toEqual(['女', '扶她', '男娘']);
        expect(config.生成性别锁定).toBe(false);
    });

    it('模式包运行时配置可提供默认生成性别并锁定', () => {
        const runtime = 构建官方模式运行时配置('现代都市', {
            opening: {
                ...构建官方模式运行时配置('现代都市').opening,
                allowedGeneratedGenders: ['女'],
                lockGeneratedGenders: true
            }
        });
        const config = 规范化开局配置({
            题材模式: '现代都市',
            modeRuntimeProfile: runtime
        });

        expect(config.允许生成性别).toEqual(['女']);
        expect(config.生成性别锁定).toBe(true);
    });

    it('开局配置提示词会注入 AI 生成角色性别硬约束', () => {
        const config = 规范化开局配置({
            题材模式: '武侠',
            允许生成性别: ['女']
        });
        const prompt = 构建开局配置提示词(config);

        expect(prompt).toContain('AI 生成角色性别硬约束');
        expect(prompt).toContain('只允许新生成的 NPC');
        expect(prompt).toContain('女');
        expect(prompt).toContain('主角性别以玩家建档为准');
    });
});
