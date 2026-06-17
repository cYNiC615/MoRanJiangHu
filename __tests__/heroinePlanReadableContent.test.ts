import { describe, expect, it } from 'vitest';
import { 女主剧情规划有可读内容 } from '../hooks/useGame/storyState';

describe('heroine plan readable-content guard', () => {
    it('treats empty plan shells as unreadable', () => {
        expect(女主剧情规划有可读内容(undefined)).toBe(false);
        expect(女主剧情规划有可读内容({})).toBe(false);
        expect(女主剧情规划有可读内容({
            阶段推进: [{}],
            女主条目: [{ 女主姓名: '   ' }],
            女主互动事件: [],
            女主镜头规划: []
        })).toBe(false);
    });

    it('accepts real readable plan text or pending update text', () => {
        expect(女主剧情规划有可读内容({
            女主条目: [{ 女主姓名: '苏晚晴', 当前关系状态: '待推进' }]
        })).toBe(true);
        expect(女主剧情规划有可读内容('待处理更新')).toBe(true);
    });
});
