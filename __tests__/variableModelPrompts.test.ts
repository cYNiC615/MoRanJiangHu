import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { 构建变量模型任务提示词, 构建变量模型职责提示词 } from '../prompts/runtime/variableModel';
import { 构建社交档案完整性审计提示 } from '../hooks/useGame/variableModelWorkflow';

describe('variableModel prompts', () => {
    it('injects dialogue candidate guidance without forcing every speaker into long-term social records', () => {
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
        expect(prompt).toContain('以下名字只表示“本回合在对白层出现过或被点名过的人物候选”');
        expect(prompt).toContain('不是已经确认必须长期建档的正式 NPC');
    });

    it('tells the variable model to prefer story evidence for gender and only use ratio as a weak prior', () => {
        const systemPrompt = 构建变量模型职责提示词();

        expect(systemPrompt).toContain('其中 `性别` 必须优先由你根据正文和档案证据判断并显式写入');
        expect(systemPrompt).toContain('只有当正文、变量规划、已有社交档案和本回合命令合起来仍不足以判断时');
        expect(systemPrompt).toContain('你可以把这些配置当作最后一层弱先验来帮助裁决');
    });

    it('requires delta accounting for item inputs, outputs, and balances', () => {
        const systemPrompt = 构建变量模型职责提示词();

        expect(systemPrompt).toContain('输入物/输出物/余额');
        expect(systemPrompt).toContain('输入物离开背包时，对 `角色.物品列表[i]` 执行 `delete` 或 `sub 堆叠数量`');
        expect(systemPrompt).toContain('输出物进入背包时，对 `角色.物品列表` 执行 `push/add`');
        expect(systemPrompt).toContain('货币、信用等收支同步写入对应变量');
    });

    it('maps transaction and production facts to paired variable commands', () => {
        const systemPrompt = 构建变量模型职责提示词();

        expect(systemPrompt).toContain('卖出=扣原物+加收入');
        expect(systemPrompt).toContain('买入=扣货币+加物品');
        expect(systemPrompt).toContain('兑换=扣旧物+加新物');
        expect(systemPrompt).toContain('制作=扣材料+加成品');
        expect(systemPrompt).toContain('只写产出不扣输入');
    });

    it('keeps intimacy rules in their existing 16.1 and 16.2 slots', () => {
        const systemPrompt = 构建变量模型职责提示词();

        expect(systemPrompt).toContain('16.1 NSFW 模式下，主要女性/长期关系对象必须维护 `亲密边界档案`');
        expect(systemPrompt).toContain('16.2 正文或变量规划若确认发生亲密关系，变量命令必须能解释并落档“发生关系判定”');
    });

    it('anchors the variable model as a fictional local RPG state sync engine', () => {
        const systemPrompt = 构建变量模型职责提示词();

        expect(systemPrompt).toContain('本地虚构角色扮演项目');
        expect(systemPrompt).toContain('所有角色均为虚构成年人');
        expect(systemPrompt).toContain('只输出结构化变量命令');
        expect(systemPrompt).toContain('不提供现实医疗、法律或性行为指导');
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

    it('variable calibration service injects extra prompt only through the task prompt builder', () => {
        const source = readFileSync(resolve(process.cwd(), 'services/ai/storyTasks.ts'), 'utf8');
        const start = source.indexOf('export const generateVariableCalibrationUpdate');
        const end = source.indexOf('const 构建规划分析消息链', start);
        expect(start).toBeGreaterThanOrEqual(0);
        expect(end).toBeGreaterThan(start);
        const body = source.slice(start, end);

        expect(body).toContain('extraPrompt: normalizedVariableExtraPrompt');
        expect(body).not.toContain('【最终输出附加要求】');
    });
});
