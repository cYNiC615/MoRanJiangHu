import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    构建有效导演开局配置,
    构建导演配置注入文本,
    删除未转正角色种子,
    设置角色种子暂停状态,
    同步角色种子转正并回写社交,
    同步角色种子转正状态,
    规范化导演配置
} from '../utils/directorConfig';

describe('Phase 3.2 director config and role seeds', () => {
    it('后处理使用顶层导演配置覆盖开局快照里的旧导演配置', () => {
        const openingConfig = {
            题材模式: '现代都市',
            玩家剧情倾向: '旧开局倾向。',
            导演配置: {
                玩家剧情倾向: '旧导演倾向。',
                角色种子定义: [{
                    id: 'seed-old',
                    名称: '旧种子',
                    性别: '女',
                    是否启用: true,
                    入口摘要: '旧摘要'
                }],
                角色种子运行时状态: [{ seedId: 'seed-old', 状态: '未引入' }]
            }
        } as any;
        const runtimeDirectorConfig = 规范化导演配置({
            玩家剧情倾向: '游戏内新导演倾向。',
            角色种子定义: [{
                id: 'seed-new',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '游戏内新增室友种子'
            }],
            角色种子运行时状态: [{ seedId: 'seed-new', 状态: '未引入' }]
        });

        const effective = 构建有效导演开局配置(openingConfig, runtimeDirectorConfig);
        const prompt = 构建导演配置注入文本(effective?.导演配置);

        expect(effective?.题材模式).toBe('现代都市');
        expect(effective?.导演配置?.玩家剧情倾向).toBe('游戏内新导演倾向。');
        expect(prompt).toContain('角色种子ID：seed-new');
        expect(prompt).not.toContain('seed-old');
    });

    it('角色种子编辑器用固定选项维护默认发展方向', () => {
        const source = readFileSync(resolve(process.cwd(), 'components/features/Director/RoleSeedEditor.tsx'), 'utf8');

        expect(source).toContain('默认发展方向选项');
        expect(source).toContain('<select');
        expect(source).toContain('红颜/后宫对象');
        expect(source).toContain('非红颜/普通配角');
        expect(source).not.toContain('placeholder="默认发展方向"');
    });

    it('世界演变和规划分析后处理接入导演种子摘要边界', () => {
        const worldEvolutionSource = readFileSync(resolve(process.cwd(), 'hooks/useGame/worldEvolutionWorkflow.ts'), 'utf8');
        const planningSource = readFileSync(resolve(process.cwd(), 'hooks/useGame/planningUpdateWorkflow.ts'), 'utf8');

        expect(worldEvolutionSource).toContain('构建导演配置注入文本');
        expect(worldEvolutionSource).toContain('构建有效导演开局配置');
        expect(worldEvolutionSource).toContain("stage: 'world_evolution'");
        expect(worldEvolutionSource).toContain('includeExpandedCards: false');
        expect(planningSource).toContain('构建导演配置注入文本');
        expect(planningSource).toContain('构建有效导演开局配置');
        expect(planningSource).toContain("stage: 'planning'");
        expect(planningSource).toContain('directorConfigPrompt');
    });

    it('初始世界生成接入导演种子弱约束摘要，不把完整卡片作为世界事实', () => {
        const worldGenerationSource = readFileSync(resolve(process.cwd(), 'hooks/useGame/worldGenerationWorkflow.ts'), 'utf8');

        expect(worldGenerationSource).toContain('构建有效导演开局配置');
        expect(worldGenerationSource).toContain('构建世界生成导演种子弱约束提示词');
        expect(worldGenerationSource).toContain('worldGenerationDirectorSeedPrompt');
        expect(worldGenerationSource).not.toContain("stage: 'opening'");
    });

    it('从旧 openingConfig 玩家剧情倾向迁移到导演配置，但不把种子当作既定事实', () => {
        const config = 规范化导演配置(undefined, {
            openingConfig: { 玩家剧情倾向: '慢热校园合租，偏后宫推进。' } as any
        });

        expect(config.玩家剧情倾向).toBe('慢热校园合租，偏后宫推进。');
        expect(config.角色种子定义).toEqual([]);
        expect(config.角色种子运行时状态).toEqual([]);
    });

    it('常驻只注入角色种子入口摘要，命中时才展开完整卡片', () => {
        const config = 规范化导演配置({
            玩家剧情倾向: '偏慢热关系。',
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友，表面疏离但会被长期照顾打动。',
                完整设定: '新闻系研究生，独立、自尊心强，亲密阻力来自家庭债务和对失控关系的戒备。',
                关系入口标签: ['合租', '校园'],
                默认发展方向: '红颜/后宫对象'
            }]
        });

        const summaryOnly = 构建导演配置注入文本(config, {
            stage: 'main',
            triggerTexts: ['今天去兼职，没有回合命中合租。']
        });
        const expanded = 构建导演配置注入文本(config, {
            stage: 'main',
            triggerTexts: ['回到合租公寓，准备和室友聊聊。']
        });

        expect(summaryOnly).toContain('角色种子入口摘要');
        expect(summaryOnly).toContain('林知夏');
        expect(summaryOnly).toContain('合租室友');
        expect(summaryOnly).not.toContain('家庭债务');
        expect(expanded).toContain('角色种子完整卡片');
        expect(expanded).toContain('家庭债务');
        expect(summaryOnly).toContain('角色种子ID：seed-roommate');
        expect(expanded).toContain('角色种子ID：seed-roommate');
    });

    it('NPC 建档命中角色种子后标记转正，避免再次作为新 NPC 素材', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友',
                完整设定: '新闻系研究生',
                关系入口标签: ['合租'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });

        const next = 同步角色种子转正状态(config, [{
            id: 'npc_lin_zhixia',
            姓名: '林知夏',
            性别: '女',
            角色种子ID: 'seed-roommate'
        }]);

        expect(next.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '已转正',
            linkedNpcId: 'npc_lin_zhixia',
            linkedNpcName: '林知夏'
        }));
    });

    it('有效角色种子ID转正时同步回写社交档案，姓名相同但无种子ID不误转正', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友',
                完整设定: '新闻系研究生',
                关系入口标签: ['合租'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });

        const linked = 同步角色种子转正并回写社交(config, [{
            id: 'npc_lin_zhixia',
            姓名: '林知夏',
            性别: '女',
            seedId: 'seed-roommate'
        }]);
        const sameNameOnly = 同步角色种子转正并回写社交(config, [{
            id: 'npc_same_name',
            姓名: '林知夏',
            性别: '女'
        }]);

        expect(linked.socialList[0].角色种子ID).toBe('seed-roommate');
        expect(linked.directorConfig.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '已转正',
            linkedNpcId: 'npc_lin_zhixia'
        }));
        expect(linked.changed).toBe(true);
        expect(linked.linkedSeedIds).toEqual(['seed-roommate']);
        expect(sameNameOnly.socialList[0].角色种子ID).toBeUndefined();
        expect(sameNameOnly.directorConfig.角色种子运行时状态).toContainEqual(expect.objectContaining({
            seedId: 'seed-roommate',
            状态: '未引入'
        }));
    });

    it('同步转正拒绝禁用或暂停的角色种子ID，并清除 AI 写入的无效链接', () => {
        const config = 规范化导演配置({
            角色种子定义: [
                {
                    id: 'seed-disabled',
                    名称: '许南枝',
                    性别: '女',
                    是否启用: false,
                    入口摘要: '暂停使用的同学'
                },
                {
                    id: 'seed-paused',
                    名称: '白棠',
                    性别: '女',
                    是否启用: true,
                    入口摘要: '运行时暂停的邻居'
                }
            ],
            角色种子运行时状态: [
                { seedId: 'seed-disabled', 状态: '未引入' },
                { seedId: 'seed-paused', 状态: '暂停' }
            ]
        });

        const result = 同步角色种子转正并回写社交(config, [
            { id: 'npc_disabled', 姓名: '许南枝', 性别: '女', 角色种子ID: 'seed-disabled' },
            { id: 'npc_paused', 姓名: '白棠', 性别: '女', seedId: 'seed-paused' }
        ]);

        expect(result.socialList[0].角色种子ID).toBeUndefined();
        expect(result.socialList[1].seedId).toBeUndefined();
        expect(result.linkedSeedIds).toEqual([]);
        expect(result.directorConfig.角色种子运行时状态).toEqual([
            expect.objectContaining({ seedId: 'seed-disabled', 状态: '未引入' }),
            expect.objectContaining({ seedId: 'seed-paused', 状态: '暂停' })
        ]);
    });

    it('暂停和恢复未转正种子时同步定义启用状态与运行时状态', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });

        const paused = 设置角色种子暂停状态(config, 'seed-roommate', true);
        expect(paused.角色种子定义[0].是否启用).toBe(false);
        expect(paused.角色种子运行时状态[0].状态).toBe('暂停');
        expect(构建导演配置注入文本(paused)).not.toContain('林知夏');

        const resumed = 设置角色种子暂停状态(paused, 'seed-roommate', false);
        expect(resumed.角色种子定义[0].是否启用).toBe(true);
        expect(resumed.角色种子运行时状态[0].状态).toBe('未引入');
        expect(构建导演配置注入文本(resumed)).toContain('林知夏');
    });

    it('暂停和恢复已引入但未转正种子时保留已引入状态', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '已引入' }]
        });

        const paused = 设置角色种子暂停状态(config, 'seed-roommate', true);
        expect(paused.角色种子定义[0].是否启用).toBe(false);
        expect(paused.角色种子运行时状态[0].状态).toBe('已引入');
        expect(构建导演配置注入文本(paused)).not.toContain('林知夏');

        const resumed = 设置角色种子暂停状态(paused, 'seed-roommate', false);
        expect(resumed.角色种子定义[0].是否启用).toBe(true);
        expect(resumed.角色种子运行时状态[0].状态).toBe('已引入');
        expect(构建导演配置注入文本(resumed)).toContain('林知夏');
    });

    it('已转正种子不可被游戏内删除，未转正或暂停种子可以删除', () => {
        const config = 规范化导演配置({
            角色种子定义: [
                { id: 'seed-linked', 名称: '林知夏', 性别: '女', 是否启用: true, 入口摘要: '已转正室友' },
                { id: 'seed-future', 名称: '许南枝', 性别: '女', 是否启用: true, 入口摘要: '未来同学' }
            ],
            角色种子运行时状态: [
                { seedId: 'seed-linked', 状态: '已转正', linkedNpcId: 'npc_lin_zhixia', linkedNpcName: '林知夏' },
                { seedId: 'seed-future', 状态: '未引入' }
            ]
        });

        const afterLinkedDelete = 删除未转正角色种子(config, 'seed-linked');
        expect(afterLinkedDelete.角色种子定义.map((seed) => seed.id)).toEqual(['seed-linked', 'seed-future']);

        const afterFutureDelete = 删除未转正角色种子(afterLinkedDelete, 'seed-future');
        expect(afterFutureDelete.角色种子定义.map((seed) => seed.id)).toEqual(['seed-linked']);
        expect(afterFutureDelete.角色种子运行时状态.map((state) => state.seedId)).toEqual(['seed-linked']);
    });

    it('已转正种子对应 NPC 消失时降为已引入并清除 linkedNpcId', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友'
            }],
            角色种子运行时状态: [{
                seedId: 'seed-roommate',
                状态: '已转正',
                linkedNpcId: 'npc_lin_zhixia',
                linkedNpcName: '林知夏'
            }]
        });

        const next = 同步角色种子转正状态(config, []);
        expect(next.角色种子运行时状态[0]).toMatchObject({
            seedId: 'seed-roommate',
            状态: '已引入'
        });
        expect(next.角色种子运行时状态[0].linkedNpcId).toBeUndefined();
    });

    it('NPC 改名或合并后按角色种子ID刷新 linkedNpcId 和 linkedNpcName', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友'
            }],
            角色种子运行时状态: [{
                seedId: 'seed-roommate',
                状态: '已转正',
                linkedNpcId: 'npc_old',
                linkedNpcName: '林知夏'
            }]
        });

        const next = 同步角色种子转正状态(config, [{
            id: 'npc_merged',
            姓名: '林知夏（化名许枝）',
            性别: '女',
            角色种子ID: 'seed-roommate'
        }]);

        expect(next.角色种子运行时状态[0]).toMatchObject({
            seedId: 'seed-roommate',
            状态: '已转正',
            linkedNpcId: 'npc_merged',
            linkedNpcName: '林知夏（化名许枝）'
        });
    });

    it('同一角色种子ID重复落到多个 NPC 时只保留第一个有效链接', () => {
        const config = 规范化导演配置({
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });

        const result = 同步角色种子转正并回写社交(config, [
            { id: 'npc_primary', 姓名: '林知夏', 性别: '女', 角色种子ID: 'seed-roommate' },
            { id: 'npc_duplicate', 姓名: '另一个林知夏', 性别: '女', 角色种子ID: 'seed-roommate' }
        ]);

        expect(result.directorConfig.角色种子运行时状态[0].linkedNpcId).toBe('npc_primary');
        expect(result.socialList[0].角色种子ID).toBe('seed-roommate');
        expect(result.socialList[1].角色种子ID).toBeUndefined();
    });
});
