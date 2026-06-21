import { describe, expect, it } from 'vitest';
import { 获取题材预设天赋, 获取题材预设背景 } from '../data/presets';
import { 获取题材开局配置文案, 默认开局配置, 规范化开局配置 } from '../utils/openingConfig';
import { 构建官方模式运行时配置 } from '../utils/modeRuntimeProfile';
import { 构建开局配置提示词 } from '../prompts/runtime/openingConfig';
import { 题材模式顺序 } from '../utils/topicModeProfiles';

describe('开局配置题材边界', () => {
    it('默认开局配置使用现代都市且不主动生成组织成员', () => {
        const config = 默认开局配置();
        const normalized = 规范化开局配置({});

        expect(config.题材模式).toBe('现代都市');
        expect(config.开局生成组织).toBe(false);
        expect(config.开局生成成员).toBe(false);
        expect(config.初始伙伴?.enabled).toBe(false);
        expect(config.modeRuntimeProfile?.identity.baseMode).toBe('现代都市');
        expect(normalized.题材模式).toBe('现代都市');
        expect(normalized.开局生成组织).toBe(false);
        expect(normalized.开局生成成员).toBe(false);
    });

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

    it('现代都市默认池保持小而普通，其他题材保留 30 个官方背景和天赋', () => {
        题材模式顺序.forEach((mode) => {
            if (mode === '现代都市') {
                expect(获取题材预设背景(mode), mode).toHaveLength(10);
                expect(获取题材预设天赋(mode), mode).toHaveLength(12);
                return;
            }
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

    it('现代都市默认提示词不主动生成组织，并把玩家剧情倾向作为导演偏好注入', () => {
        const config = 规范化开局配置({
            题材模式: '现代都市',
            玩家剧情倾向: '想从合租、兼职和校园社团慢慢展开关系。'
        });
        const prompt = 构建开局配置提示词(config);

        expect(config.玩家剧情倾向).toBe('想从合租、兼职和校园社团慢慢展开关系。');
        expect(prompt).toContain('开局组织口径：本次不主动生成初始组织');
        expect(prompt).toContain('玩家剧情倾向');
        expect(prompt).toContain('导演偏好');
        expect(prompt).toContain('不是世界事实');
        expect(prompt).toContain('合租、兼职和校园社团');
    });

    it('新建游戏开局配置保留首批角色种子并初始化运行时状态', () => {
        const config = 规范化开局配置({
            题材模式: '现代都市',
            玩家剧情倾向: '慢热校园合租。',
            导演配置: {
                角色种子定义: [{
                    id: 'seed-roommate',
                    名称: '林知夏',
                    性别: '女',
                    是否启用: true,
                    入口摘要: '合租室友，表面疏离。',
                    完整设定: '新闻系研究生，亲密阻力来自家庭债务。',
                    关系入口标签: ['合租']
                }]
            }
        });

        expect(config.导演配置?.玩家剧情倾向).toBe('慢热校园合租。');
        expect(config.导演配置?.角色种子定义).toHaveLength(1);
        expect(config.导演配置?.角色种子定义[0]).toMatchObject({
            id: 'seed-roommate',
            名称: '林知夏',
            入口摘要: '合租室友，表面疏离。'
        });
        expect(config.导演配置?.角色种子运行时状态).toEqual([
            { seedId: 'seed-roommate', 状态: '未引入' }
        ]);
    });
});
