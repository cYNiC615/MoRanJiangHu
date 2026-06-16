import { describe, expect, it } from 'vitest';
import { parseStoryRawText } from '../services/ai/storyResponseParser';

describe('开局正文对白兜底恢复', () => {
    it('主剧情严格模式检测到无标签台词时触发重试错误', () => {
        const raw = `
<正文>
许知夏把雨伞收进门边伞架，水珠在瓷砖上洇开。
我们昨晚查到的消息，海川东站明天下午会有一班去临港新区的城际列车。如果想赶上那场面试，今天必须凑齐车票和押金的两百元。
</正文>
<短期记忆>开局。</短期记忆>
`;

        expect(() => parseStoryRawText(raw, { validateDialogueFormat: true })).toThrow('对白没有使用【角色名】标签');
    });

    it('把无角色标签但紧邻人物动作的口语段保留为旁白，等待局部修复器处理', () => {
        const raw = `
<正文>
许知夏把雨伞收进门边伞架，水珠在瓷砖上洇开。
我们昨晚查到的消息，海川东站明天下午会有一班去临港新区的城际列车。如果想赶上那场面试，今天必须凑齐车票和押金的两百元。
陈砚秋走到桌旁，给自己倒了一杯冷掉的咖啡。
昨天在二手群里，我看到有人急转一台旧笔记本，价格刚好是三百元。地点就在海川东站旁边的共享办公楼。
</正文>
<短期记忆>开局。</短期记忆>
`;

        const parsed = parseStoryRawText(raw);
        expect(parsed.logs).toEqual([{
            sender: '旁白',
            text: '许知夏把雨伞收进门边伞架，水珠在瓷砖上洇开。\n我们昨晚查到的消息，海川东站明天下午会有一班去临港新区的城际列车。如果想赶上那场面试，今天必须凑齐车票和押金的两百元。\n陈砚秋走到桌旁，给自己倒了一杯冷掉的咖啡。\n昨天在二手群里，我看到有人急转一台旧笔记本，价格刚好是三百元。地点就在海川东站旁边的共享办公楼。'
        }]);
    });

    it('保留明确叙事段，不把普通旁白误拆成角色对白', () => {
        const raw = `
<正文>
雨水沿着海川东站的玻璃幕墙往下滑。
远处的便利店灯牌忽明忽暗，像被清晨雾气压低的一小块霓虹。
</正文>
<短期记忆>无。</短期记忆>
`;

        const parsed = parseStoryRawText(raw);
        expect(parsed.logs).toHaveLength(1);
        expect(parsed.logs[0].sender).toBe('旁白');
        expect(parsed.logs[0].text).toContain('雨水沿着海川东站');
    });
});
