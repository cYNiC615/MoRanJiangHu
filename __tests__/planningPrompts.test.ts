import { describe, expect, it } from 'vitest';
import {
    构建规划性别比例约束摘要,
    构建统一规划分析系统提示词,
    构建统一规划分析用户提示词
} from '../prompts/runtime/planningAnalysis';
import { 构建统一规划分析专用上下文, 统一规划分析COT提示词 } from '../prompts/runtime/planUpdateReference';
import { 剧情规划变量结构提示词 } from '../prompts/runtime/storyPlanSchema';
import { 核心_剧情推动 } from '../prompts/core/story';
import { 构建开局规划初始化审计重点, 开局规划初始化附加提示词 } from '../prompts/runtime/openingPlanningInit';

describe('planning prompts', () => {
    it('requires planning analysis to apply world gender ratio constraints to new character pools', () => {
        const systemPrompt = 构建统一规划分析系统提示词({ heroineEnabled: true });
        const userPrompt = 构建统一规划分析用户提示词({
            currentStoryJson: '{}',
            currentHeroinePlanJson: '{}',
            worldJson: '{"NPC系统":{"男女比例":"1:9"}}',
            socialJson: '[]',
            envJson: '{}',
            recentBodiesText: '正文',
            auditFocusText: '常规回合固定审计',
            genderRatioConstraintText: 构建规划性别比例约束摘要('1:9'),
            heroineEnabled: true
        });

        expect(systemPrompt).toContain('新增 NPC、公共场景路人、组织成员、敌友角色池或女主候选补位');
        expect(systemPrompt).toContain('男女比例或性别比例设定');
        expect(systemPrompt).toContain('新增人物池的分布约束');
        expect(systemPrompt).toContain('已有事实、角色身份边界、后宫/后院/妻妾等特殊场景和玩家明确要求优先于比例');

        expect(userPrompt).toContain('世界观/NPC系统男女比例或性别比例设定');
        expect(userPrompt).toContain('当前世界/NPC系统男女比例：1:9');
        expect(userPrompt).toContain('按该比例保持新增人物池分布');
    });

    it('renders structured gender ratio values into an explicit planning constraint block', () => {
        const summary = 构建规划性别比例约束摘要({ 男: 10, 女: 80, 男娘: 5, 扶她: 5 });

        expect(summary).toContain('【规划性别比例约束】');
        expect(summary).toContain('男:10，女:80，男娘:5，扶她:5');
        expect(summary).toContain('按该比例保持新增人物池分布');
    });

    it('does not imply heroine planning exists when heroine planning is disabled', () => {
        const userPrompt = 构建统一规划分析用户提示词({
            currentStoryJson: '{}',
            currentHeroinePlanJson: '{}',
            worldJson: '{}',
            socialJson: '[]',
            envJson: '{}',
            recentBodiesText: '正文里提到一位女性路人。',
            auditFocusText: '常规回合固定审计',
            heroineEnabled: false
        });

        expect(userPrompt).toContain('【女主规划状态】');
        expect(userPrompt).toContain('女主剧情规划未启用');
        expect(userPrompt).toContain('不得新增、推断、补位、修订或输出任何 `女主剧情规划.*` 命令');
        expect(userPrompt).toContain('即使正文提到女性角色，也只能按普通社交、剧情或世界状态处理');
        expect(userPrompt).not.toContain('【当前女主规划树】');
    });

    it('requires opening planning initialization to preserve gender ratio constraints', () => {
        const auditFocus = 构建开局规划初始化审计重点({ heroineEnabled: true });

        expect(开局规划初始化附加提示词).toContain('新增 NPC、公共场景路人、组织成员、敌友角色池或女主候选补位');
        expect(开局规划初始化附加提示词).toContain('男女比例或性别比例设定');
        expect(开局规划初始化附加提示词).toContain('已有事实、角色身份边界、后宫/后院/妻妾等特殊场景和玩家明确要求优先于比例');

        expect(auditFocus).toContain('世界观/NPC系统男女比例或性别比例设定');
        expect(auditFocus).toContain('按该比例保持新增人物池分布');
    });

    it('treats current chapter goals as the private DM axis instead of player-visible tasks', () => {
        const combined = [
            核心_剧情推动.内容,
            构建统一规划分析系统提示词({ heroineEnabled: true })
        ].join('\n');

        expect(combined).toContain('当前章目标');
        expect(combined).toContain('后台 DM 主轴');
        expect(combined).toContain('不直接暴露给玩家');
        expect(combined).toContain('任务列表');
        expect(combined).toContain('不要把普通章节节拍写成玩家可见任务');
        expect(combined).toContain('当前章目标优先于世界背景补位');
    });

    it('keeps hidden plot threads inside story planning instead of player-visible tasks', () => {
        const combined = [
            剧情规划变量结构提示词,
            核心_剧情推动.内容,
            构建统一规划分析系统提示词({ heroineEnabled: true })
        ].join('\n');

        expect(combined).toContain('剧情规划.剧情暗线');
        expect(combined).toContain('不直接暴露给玩家');
        expect(combined).toContain('信息边界');
        expect(combined).toContain('不得写入 `任务列表`');
    });

    it('keeps heroine numeric pool targets canonical to heroine protocols in unified planning support blocks', () => {
        const supportPrompt = [
            构建统一规划分析专用上下文(),
            统一规划分析COT提示词,
            构建统一规划分析用户提示词({
                currentStoryJson: '{}',
                currentHeroinePlanJson: '{}',
                worldJson: '{}',
                socialJson: '[]',
                envJson: '{}',
                recentBodiesText: '正文',
                auditFocusText: '常规回合固定审计',
                heroineEnabled: true
            })
        ].join('\n');

        expect(supportPrompt).toContain('按 `<女主剧情规划协议>`');
        expect(supportPrompt).not.toMatch(/女主条目`?[^\n]*常态[^\n]*1~4/u);
        expect(supportPrompt).not.toMatch(/女主互动事件`?[^\n]*常态[^\n]*3~6/u);
        expect(supportPrompt).not.toMatch(/女主镜头规划`?[^\n]*常态[^\n]*2~5/u);
    });
});
