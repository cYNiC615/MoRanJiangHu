import { afterEach, describe, expect, it, vi } from 'vitest';
import { 执行文章优化请求带超时 } from '../hooks/useGame/polishRequestTimeout';

describe('polish request deadlines', () => {
    afterEach(() => vi.useRealTimers());

    it('aborts a hanging first response and removes its timer', async () => {
        vi.useFakeTimers();
        let signal!: AbortSignal;
        const result = 执行文章优化请求带超时({ parentSignal: new AbortController().signal,
            firstResponseTimeoutMs: 100, streamIdleTimeoutMs: 50,
            task: s => { signal = s; return new Promise(() => {}); }, resolveCompletedDraft: () => null });
        const failure = expect(result).rejects.toThrow('首次响应超时');
        await vi.advanceTimersByTimeAsync(100);
        await failure;
        expect(signal.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('accepts a complete stalled draft but never turns cancellation into success', async () => {
        vi.useFakeTimers();
        let signal!: AbortSignal;
        const parent = new AbortController();
        const params = { parentSignal: parent.signal, firstResponseTimeoutMs: 100, streamIdleTimeoutMs: 50,
            task: (s: AbortSignal, delta: (d: string, a: string) => void) => {
                signal = s;
                delta('done', '<正文>done</正文>');
                return new Promise<string>(() => {});
            }, resolveCompletedDraft: (draft: string) => draft || null };
        const result = 执行文章优化请求带超时(params);
        await vi.advanceTimersByTimeAsync(50);
        expect(await result).toBe('<正文>done</正文>');
        expect(signal.aborted).toBe(true);
        const cancelled = 执行文章优化请求带超时(params);
        const failure = expect(cancelled).rejects.toThrow('cancelled');
        parent.abort(new Error('cancelled'));
        await failure;
        expect(vi.getTimerCount()).toBe(0);
    });
});
