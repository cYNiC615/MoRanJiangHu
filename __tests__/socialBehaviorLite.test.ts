import { describe, expect, it } from 'vitest';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';
import { 构建统一规划分析用户提示词 } from '../prompts/runtime/planningAnalysis';
import {
    构建红颜规划候选角色摘要,
    构建红颜规划候选结果,
    规范化NPC行为档案,
    过滤女主规划命令
} from '../utils/socialBehavior';

describe('Phase 3.2 B-lite social behavior profile', () => {
    it('从旧扁平 NPC 字段投影 v2 行为档案，保留稳定人格', () => {
        const profile = 规范化NPC行为档案({
            核心性格特征: '克制、自尊心强',
            行动意图: '想确认主角是否可靠',
            关系突破条件: '需要一次共同承担风险的经历',
            好感度突破条件: '持续兑现承诺'
        });

        expect(profile.性格底色).toBe('克制、自尊心强');
        expect(profile.当前agenda).toBe('想确认主角是否可靠');
        expect(profile.亲密阻力).toContain('需要一次共同承担风险的经历');
        expect(profile.吸引点).toContain('持续兑现承诺');
    });

    it('社交列表规范化补齐女性重要角色行为档案，并保留既有 v2 稳定字段', () => {
        const normalized = 规范化社交列表([{
            id: 'npc_su_wanqing',
            姓名: '苏晚晴',
            性别: '女',
            是否主要角色: true,
            核心性格特征: '温柔但有边界',
            行为档案: {
                性格底色: '外冷内热',
                核心欲望: '想摆脱家庭安排'
            }
        }], { 合并同名: false });

        expect(normalized[0].社交档案版本).toBe(2);
        expect(normalized[0].行为档案).toMatchObject({
            性格底色: '外冷内热',
            核心欲望: '想摆脱家庭安排'
        });
    });

    it('红颜规划 v2 只读取有承接价值的女性重要角色', () => {
        const candidates = 构建红颜规划候选角色摘要([
            {
                id: 'npc_su_wanqing',
                姓名: '苏晚晴',
                性别: '女',
                是否主要角色: true,
                是否在场: true,
                关系状态: '暧昧',
                行为档案: { 当前agenda: '试探主角是否会保护她', 亲密阻力: ['害怕被当作附属品'] }
            },
            { id: 'npc_passenger', 姓名: '路人甲', 性别: '男', 是否主要角色: true },
            { id: 'npc_empty', 姓名: '空壳女性', 性别: '女', 是否主要角色: true }
        ]);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toContain('苏晚晴');
        expect(candidates[0]).toContain('害怕被当作附属品');
    });

    it('规划分析 prompt 用红颜规划 v2 候选摘要约束女主规划补位', () => {
        const prompt = 构建统一规划分析用户提示词({
            currentStoryJson: '{}',
            currentHeroinePlanJson: '{}',
            worldJson: '{}',
            socialJson: '[{"姓名":"空白女性","性别":"女","是否主要角色":true}]',
            envJson: '{}',
            recentBodiesText: '最近正文',
            currentPlanText: '',
            auditFocusText: '',
            heroineEnabled: true,
            heroineCandidateText: ''
        } as any);

        expect(prompt).toContain('【红颜规划候选摘要】');
        expect(prompt).toContain('当前没有可用于红颜规划 v2 的候选摘要');
        expect(prompt).toContain('不得生成空女主规划');
    });

    it('女主规划命令只允许写入红颜规划 v2 候选目标', () => {
        const emptyCandidates = 构建红颜规划候选结果([
            { id: 'npc_empty', 姓名: '空壳女性', 性别: '女', 是否主要角色: true }
        ]);
        const candidates = 构建红颜规划候选结果([
            {
                id: 'npc_su_wanqing',
                姓名: '苏晚晴',
                性别: '女',
                是否主要角色: true,
                关系状态: '暧昧',
                行为档案: { 当前agenda: '确认主角是否可靠', 核心欲望: '摆脱家庭安排' }
            }
        ]);

        const emptyRejected = 过滤女主规划命令([{
            action: 'push',
            key: 'gameState.女主剧情规划.女主条目',
            value: { 女主姓名: '空壳女性', 阶段: '初见' }
        }] as any, emptyCandidates);
        const nonCandidateRejected = 过滤女主规划命令([{
            action: 'push',
            key: 'gameState.女主剧情规划.女主条目',
            value: { 女主姓名: '空白女性', 阶段: '初见' }
        }] as any, candidates);
        const candidateAllowed = 过滤女主规划命令([{
            action: 'push',
            key: 'gameState.女主剧情规划.女主条目',
            value: { 女主姓名: '苏晚晴', 阶段: '暧昧推进' }
        }] as any, candidates);

        expect(emptyRejected.commands).toEqual([]);
        expect(emptyRejected.rejectedReports[0]).toContain('当前没有可用于红颜规划 v2 的候选摘要');
        expect(nonCandidateRejected.commands).toEqual([]);
        expect(nonCandidateRejected.rejectedReports[0]).toContain('不在红颜规划 v2 候选范围');
        expect(candidateAllowed.commands).toHaveLength(1);
        expect(candidateAllowed.rejectedReports).toEqual([]);
    });
});
