import { describe, expect, it } from 'vitest';
import { 补全缺失游戏初始时间, 从历史与回忆恢复游戏初始时间 } from '../hooks/useGame/gameInitialTimeRecovery';

describe('游戏初始时间恢复', () => {
    it('已有游戏初始时间时不覆盖', () => {
        const result = 补全缺失游戏初始时间(
            '1:01:01:08:00',
            [{ role: 'assistant', gameTime: '1:01:03:20:00' }] as any,
            { 回忆档案: [{ 回合: 1, 记录时间: '1:01:01:07:30' }] } as any
        );

        expect(result).toBe('1:01:01:08:00');
    });

    it('缺失时从历史记录里选择最早可信 gameTime', () => {
        const result = 从历史与回忆恢复游戏初始时间(
            [
                { role: 'assistant', gameTime: '1:01:03:20:00' },
                { role: 'assistant', gameTime: '1:01:01:08:00' },
                { role: 'assistant', gameTime: '开局' }
            ] as any,
            { 回忆档案: [] } as any
        );

        expect(result).toBe('1:01:01:08:00');
    });

    it('开局回忆无效时回退到其他有效回忆', () => {
        const result = 从历史与回忆恢复游戏初始时间(
            [],
            {
                回忆档案: [
                    { 回合: 1, 名称: '【回忆001】', 记录时间: '1:01:01:00:00' },
                    { 回合: 2, 名称: '【回忆002】', 记录时间: '1:01:01:09:00' },
                    { 回合: 3, 名称: '【回忆003】', 时间戳: '1:01:01:08:30' }
                ]
            } as any
        );

        expect(result).toBe('1:01:01:08:30');
    });

    it('没有可信历史或回忆时保持空值，不用当前环境时间兜底', () => {
        const result = 补全缺失游戏初始时间(
            '',
            [{ role: 'assistant', gameTime: '未知时间' }] as any,
            { 回忆档案: [{ 回合: 1, 记录时间: '1:01:01:00:00' }] } as any
        );

        expect(result).toBe('');
    });
});
