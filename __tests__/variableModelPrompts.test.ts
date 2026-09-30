import { describe, expect, it } from 'vitest';
import { 构建变量模型任务提示词 } from '../prompts/runtime/variableModel';
import { 构建社交档案完整性审计提示 } from '../hooks/useGame/variableModelWorkflow';

describe('variableModel prompts', () => {
    it('extracts named dialogue candidates without treating the narrator as an NPC', () => {
        const prompt = 构建变量模型任务提示词({
            stateJson: '{}',
            response: {
                logs: [
                    { sender: '旁白', text: '院门外有人轻叩。' },
                    { sender: '护院1', text: '老爷吩咐过，闲人不得入内。' },
                    { sender: '杨青儿', text: '兄长，前厅来客了。' }
                ],
                tavern_commands: []
            } as any
        });

        expect(prompt).toContain('【本回合对白候选角色列表】');
        expect(prompt).toContain('候选1：护院1');
        expect(prompt).toContain('候选2：杨青儿');
        expect(prompt).not.toContain('候选3：');
        expect(prompt).not.toMatch(/候选\d+：旁白/u);
    });

    it('does not treat ordinary uterus normal/closed state as a missing social archive', () => {
        const audit = 构建社交档案完整性审计提示([{
            姓名: '林知夏',
            性别: '女',
            是否主要角色: true,
            身份: '合租室友',
            简介: '新闻系研究生。',
            关系状态: '熟悉',
            记忆: ['一起整理过厨房。'],
            生日: '1999-05-12',
            对主角称呼: '沈砚',
            核心性格特征: '独立，自尊心强。',
            好感度突破条件: '长期照顾与尊重边界。',
            关系突破条件: '私下坦白家庭压力。',
            关系网变量: ['家庭债务', '校园媒体'],
            外貌描写: '清冷干净。',
            身材描写: '高挑。',
            衣着风格: '简洁通勤。',
            胸部描述: '无对应名器：常态档案。',
            小穴描述: '无名器：常态档案。',
            屁穴描述: '无名器：常态档案。',
            名器档案: [
                { 部位: '胸部', 名称: '无名器', 稳定描述: '常态', 效果: { 说明: '无' } },
                { 部位: '小穴', 名称: '无名器', 稳定描述: '常态', 效果: { 说明: '无' } },
                { 部位: '屁穴', 名称: '无名器', 稳定描述: '常态', 效果: { 说明: '无' } }
            ],
            性癖: '未知边界待剧情确认',
            敏感点: '未知边界待剧情确认',
            子宫: {
                状态: '正常',
                宫口状态: '闭合',
                内射记录: []
            },
            是否处女: true,
            失贞档案: { 是否失贞: false },
            首次亲密记录: []
        } as any]);

        const gapLine = audit.split('\n').find((line) => line.includes('社交[0] 林知夏')) || '';
        expect(gapLine).not.toContain('子宫档案');
    });

    it('普通日常层级不强制补齐女性主要角色私密/名器/子宫档案', () => {
        const audit = 构建社交档案完整性审计提示([{
            姓名: '林知夏',
            性别: '女',
            是否主要角色: true,
            身份: '合租室友',
            简介: '新闻系研究生。',
            关系状态: '熟悉',
            记忆: ['一起整理过厨房。'],
            当前装备: { 上装: '白色衬衫' },
            天赋列表: [],
            背包: [],
            BUFF: [],
            DEBUFF: [],
            技艺: [],
            出身背景: '普通家庭',
            力量: 5,
            敏捷: 5,
            体质: 5,
            攻击力: 5,
            防御力: 5,
            当前血量: 100,
            最大血量: 100,
            当前精力: 50,
            最大精力: 50,
            头部当前血量: 100,
            头部最大血量: 100,
            头部状态: '正常',
            胸部当前血量: 100,
            胸部最大血量: 100,
            胸部状态: '正常',
            腹部当前血量: 100,
            腹部最大血量: 100,
            腹部状态: '正常',
            左手当前血量: 100,
            左手最大血量: 100,
            左手状态: '正常',
            右手当前血量: 100,
            右手最大血量: 100,
            右手状态: '正常',
            左腿当前血量: 100,
            左腿最大血量: 100,
            左腿状态: '正常',
            右腿当前血量: 100,
            右腿最大血量: 100,
            右腿状态: '正常'
        } as any], { nsfwPromptLevel: 'beacon' as any });

        expect(audit).not.toMatch(/胸部描述|小穴描述|屁穴描述|名器档案|性癖|敏感点|子宫档案|是否处女|失贞档案|首次亲密记录/u);
    });

    it('亲密层级会恢复女性主要角色私密档案审计', () => {
        const audit = 构建社交档案完整性审计提示([{
            姓名: '林知夏',
            性别: '女',
            是否主要角色: true,
            身份: '合租室友',
            简介: '新闻系研究生。',
            关系状态: '暧昧',
            记忆: ['两人已经开始单独约会。']
        } as any], { nsfwPromptLevel: 'intimacy' as any });

        expect(audit).toMatch(/胸部描述|小穴描述|名器档案|子宫档案/u);
    });

});
