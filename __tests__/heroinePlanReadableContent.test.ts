import { describe, expect, it } from 'vitest';
import { 女主剧情规划有可读内容, 规范化女主剧情规划状态 } from '../hooks/useGame/storyState';

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

    it('recovers heroine plan arrays when commands stored array fields as strings or single objects', () => {
        const normalized = 规范化女主剧情规划状态({
            阶段推进: { 阶段名: '开篇铺垫', 阶段目标: ['建立关系基础'] },
            女主条目: '[{ 女主姓名: "王秀芳", 当前关系状态: "房东-租客" }]',
            女主互动事件: { 女主姓名: '王秀芳', 事件名: '晨间偶遇' },
            女主镜头规划: { 女主姓名: '王秀芳', 镜头标题: '一楼拐角的灯' }
        });

        expect(normalized?.阶段推进).toHaveLength(1);
        expect(normalized?.阶段推进[0].阶段名).toBe('开篇铺垫');
        expect(normalized?.女主条目).toHaveLength(1);
        expect(normalized?.女主条目[0].女主姓名).toBe('王秀芳');
        expect(normalized?.女主互动事件).toHaveLength(1);
        expect(normalized?.女主镜头规划).toHaveLength(1);
    });

    it('deduplicates repeated heroine events and shot plans by stable planning identity', () => {
        const normalized = 规范化女主剧情规划状态({
            女主互动事件: [
                { 女主姓名: '王秀芳', 事件名: '晨间偶遇', 计划触发时间: '0001:01:02:07:00', 事件说明: '旧说明' },
                { 女主姓名: '王秀芳', 事件名: '晨间偶遇', 计划触发时间: '0001:01:02:07:00', 事件说明: '新说明' }
            ],
            女主镜头规划: [
                { 女主姓名: '王秀芳', 镜头标题: '一楼拐角的灯', 触发时间: '0001:01:01:21:10', 镜头内容: '旧镜头' },
                { 女主姓名: '王秀芳', 镜头标题: '一楼拐角的灯', 触发时间: '0001:01:01:21:10', 镜头内容: '新镜头' }
            ]
        });

        expect(normalized?.女主互动事件).toHaveLength(1);
        expect(normalized?.女主互动事件[0].事件说明).toBe('新说明');
        expect(normalized?.女主镜头规划).toHaveLength(1);
        expect(normalized?.女主镜头规划[0].镜头内容).toBe('新镜头');
    });
});
