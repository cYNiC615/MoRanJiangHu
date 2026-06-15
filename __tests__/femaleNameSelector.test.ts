import { describe, expect, it } from 'vitest';
import { 女性人名选择器列表, 提取命中女性姓名黑名单, 提取命中新女性角色姓名黑名单, 重命名重复女性NPC列表, 选择唯一女性姓名, 选择女性姓名候选列表 } from '../utils/femaleNameSelector';
import { 构建女性姓名候选提示词 } from '../utils/femaleNameCandidatePrompt';

describe('female name selector', () => {
    it('loads the user-provided female name selector as a unique pool', () => {
        expect(女性人名选择器列表.length).toBeGreaterThan(9000);
        expect(new Set(女性人名选择器列表).size).toBe(女性人名选择器列表.length);
    });

    it('chooses unused names from the selector', () => {
        const selected = 选择唯一女性姓名({
            usedNames: 女性人名选择器列表.slice(0, 20),
            seed: 'same-seed'
        });

        expect(女性人名选择器列表).toContain(selected);
        expect(女性人名选择器列表.slice(0, 20)).not.toContain(selected);
    });

    it('injects a blacklist prompt instead of forcing AI into a candidate pool', () => {
        const candidates = 选择女性姓名候选列表({
            usedNames: ['苏婉儿', '林清雪', '端测少侠'],
            seed: '端测少侠|端测州|前厅',
            count: 100
        });
        const prompt = 构建女性姓名候选提示词({
            usedNames: ['苏婉儿', '林清雪', '端测少侠'],
            seed: '端测少侠|端测州|前厅',
            count: 100
        });

        expect(candidates).toHaveLength(100);
        expect(new Set(candidates).size).toBe(100);
        expect(candidates).not.toContain('苏婉儿');
        expect(candidates).not.toContain('林清雪');
        expect(prompt).toContain('女性新角色姓名黑名单');
        expect(prompt).toContain('苏婉清');
        expect(prompt).toContain('林婉儿');
        expect(prompt).toContain('自行创造 2-4 字中文真实姓名');
        expect(prompt).not.toContain('候选姓名（100个）');
    });

    it('detects common female template names for regeneration', () => {
        expect(提取命中女性姓名黑名单('【苏婉儿】她与林婉儿同时出现')).toEqual(['苏婉儿', '林婉儿']);
        expect(提取命中女性姓名黑名单({ value: { 姓名: '苏婉清' } })).toEqual(['苏婉清']);
        expect(提取命中女性姓名黑名单('沈清婉提着剑走入山门')).toEqual(['沈清婉']);
    });

    it('only treats blacklist hits as invalid when they are new structured NPC names', () => {
        const response = {
            logs: [
                { sender: '旁白', text: '你轻声唤了一句“婉儿”，她偏头应了。' },
                { sender: '婉儿', text: '我在。' }
            ],
            tavern_commands: []
        };

        expect(提取命中新女性角色姓名黑名单({ response })).toEqual([]);
        expect(提取命中新女性角色姓名黑名单({
            response: {
                logs: [],
                tavern_commands: [
                    {
                        action: 'push',
                        key: '社交',
                        value: { 姓名: '婉儿', 性别: '女', 身份: '新登场侍女' }
                    }
                ]
            }
        })).toEqual(['婉儿']);
    });

    it('does not locally rename generated female NPC names', () => {
        const list = 重命名重复女性NPC列表([
            { id: 'a', 姓名: '慕容青鸾', 性别: '女', 身份: '师姐' },
            { id: 'b', 姓名: '慕容青鸾', 性别: '女', 身份: '药堂弟子' },
            { id: 'c', 姓名: '慕容青鸾', 性别: '男', 身份: '男弟子' },
            { id: 'd', 姓名: '角色3', 性别: '女', 身份: '侍女' }
        ]);

        expect(list[0].姓名).toBe('慕容青鸾');
        expect(list[1].姓名).toBe('慕容青鸾');
        expect(list[2].姓名).toBe('慕容青鸾');
        expect(list[3].姓名).toBe('角色3');
        expect(list[3].曾用名).toBeUndefined();
    });

    it('keeps legacy template-like female names instead of rewriting old saves', () => {
        const [npc] = 重命名重复女性NPC列表([
            { id: 'short_given_name', 姓名: '婉儿', 性别: '女', 身份: '贴身侍女' }
        ]);

        expect(npc.姓名).toBe('婉儿');
        expect(npc.曾用名).toBeUndefined();
    });

    it('keeps legacy main female template names instead of rewriting old saves', () => {
        const [npc] = 重命名重复女性NPC列表([
            { id: 'main_su_waner', 姓名: '苏婉儿', 性别: '女', 身份: '主要女角色', 是否主要角色: true }
        ]);

        expect(npc.姓名).toBe('苏婉儿');
        expect(npc.曾用名).toBeUndefined();
    });

    it('keeps named major female characters outside the selector pool when local protection is enabled', () => {
        const [npc] = 重命名重复女性NPC列表([
            {
                id: 'major_huang_rong',
                姓名: '黄蓉',
                性别: '女',
                身份: '主要女性角色',
                是否主要角色: true,
                简介: '玩家手动保留的关键人物。'
            }
        ], { 保留非姓名库主要女性名: true });

        expect(npc.姓名).toBe('黄蓉');
        expect(npc.曾用名).toBeUndefined();
    });
});
