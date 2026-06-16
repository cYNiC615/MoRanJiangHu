import { describe, expect, it } from 'vitest';
import { 归一化任务类型, 规范化任务自动结算 } from '../utils/taskCompat';

describe('任务分类归一化', () => {
    it('把宗门/师门语义归入组织任务', () => {
        expect(归一化任务类型({
            类型: '宗门委托',
            标题: '外务堂急令',
            描述: '同门请你回山门处理聚宝阁物资短缺。'
        })).toBe('门派');
    });

    it('补齐悬赏与传闻分类', () => {
        expect(归一化任务类型({ 类型: '悬榜', 标题: '缉盗有赏' })).toBe('悬赏');
        expect(归一化任务类型({ 类型: '江湖消息', 标题: '坊间传闻' })).toBe('传闻');
    });

    it('未知类型兜底为支线并保留自动结算', () => {
        const normalized = 规范化任务自动结算({
            类型: '杂事',
            当前状态: '进行中',
            目标列表: [{ 描述: '办完', 当前进度: 1, 总需进度: 1, 完成状态: false }]
        });

        expect(normalized.类型).toBe('支线');
        expect(normalized.当前状态).toBe('已完成');
    });
});
