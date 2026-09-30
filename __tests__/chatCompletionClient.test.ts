import { afterEach, describe, expect, it, vi } from 'vitest';
import { 应用Gemini尾部Model回合修正, 构建文本请求最终消息诊断 } from '../services/ai/chatCompletionClient';
import { 应用Claude兼容末尾User修正, 请求模型文本, 是否流式连接中断错误消息, 规范化流式连接错误提示, 规范化请求模型名称, type 通用消息 } from '../services/ai/chatCompletionClient';
import type { 当前可用接口结构 } from '../utils/apiConfig';

const baseConfig: 当前可用接口结构 = {
    id: 'test',
    名称: 'test',
    供应商: 'openai_compatible',
    协议覆盖: 'auto',
    baseUrl: 'https://example.com/v1',
    apiKey: 'test-key',
    model: 'test-model'
};

describe('chatCompletionClient Claude compatible message normalization', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('normalizes Gemini assistant tails without changing other models or explicit prefix requests', () => {
        const config = { ...baseConfig, model: 'gemini-test' };
        const messages: 通用消息[] = [{ role: 'user', content: 'input' }, { role: 'assistant', content: 'format-marker' }];
        const normalized = 应用Gemini尾部Model回合修正(messages, config);
        expect(normalized.at(-1)).toMatchObject({ role: 'user', content: expect.stringContaining('format-marker') });
        expect(messages.at(-1)?.role).toBe('assistant');
        expect(应用Gemini尾部Model回合修正([...messages.slice(0, 1), { role: 'assistant', content: '  ' }], config)).toEqual(messages.slice(0, 1));
        expect(应用Gemini尾部Model回合修正(messages, baseConfig)).toBe(messages);
        const prefix: 通用消息[] = [{ role: 'assistant', content: 'start', prefix: true }];
        expect(应用Gemini尾部Model回合修正(prefix, config)).toBe(prefix);
        expect(构建文本请求最终消息诊断(config, messages).providerNormalized.roleSequence).toEqual(normalized.map(m => m.role));
    });

    it('retries empty JSON and streaming responses with a finite attempt limit', async () => {
        vi.useFakeTimers();
        const json = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { headers: { 'content-type': 'application/json' } });
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json(''));
        const failed = expect(请求模型文本(baseConfig, [{ role: 'user', content: 'ping' }], { temperature: 0.7 })).rejects.toThrow('模型返回了空内容');
        await vi.runAllTimersAsync();
        await failed;
        expect(fetchMock).toHaveBeenCalledTimes(3);
        fetchMock.mockReset().mockImplementationOnce(async () => new Response('data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }))
            .mockImplementationOnce(async () => new Response('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }));
        const success = 请求模型文本(baseConfig, [{ role: 'user', content: 'ping' }], { temperature: 0.7, streamOptions: { stream: true } });
        await vi.runAllTimersAsync();
        expect(await success).toBe('ok');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('appends a user turn when Claude-like models end with assistant COT pseudo history', () => {
        const messages: 通用消息[] = [
            { role: 'system', content: '规则' },
            { role: 'assistant', content: '<think>好的思考结束</think>' }
        ];

        const normalized = 应用Claude兼容末尾User修正(messages, {
            ...baseConfig,
            model: 'claude-opus-4.6'
        });

        expect(normalized).toHaveLength(3);
        expect(normalized.at(-1)?.role).toBe('user');
        expect(normalized.at(-1)?.content).toContain('继续执行');
    });

    it('leaves normal OpenAI-compatible messages unchanged', () => {
        const messages: 通用消息[] = [
            { role: 'system', content: '规则' },
            { role: 'assistant', content: '<think>好的思考结束</think>' }
        ];

        const normalized = 应用Claude兼容末尾User修正(messages, {
            ...baseConfig,
            model: 'gpt-4.1'
        });

        expect(normalized).toBe(messages);
    });

    it('uses the Qianfan Coding chat completions path without inserting /v1', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{ message: { content: 'pong' } }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        const result = await 请求模型文本({
            ...baseConfig,
            baseUrl: 'https://qianfan.baidubce.com/v2/coding',
            model: 'deepseek-v3.2'
        }, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(result).toBe('pong');
        expect(fetchMock).toHaveBeenCalled();
        expect(String(fetchMock.mock.calls[0][0])).toBe('https://qianfan.baidubce.com/v2/coding/chat/completions');
    });

    it('strips Chinese display suffixes from OpenAI-compatible model ids before sending requests', async () => {
        expect(规范化请求模型名称('gemini-3.1-pro-high-search-真流-[星星公益站-CLI渠道]'))
            .toBe('gemini-3.1-pro-high-search');
        expect(规范化请求模型名称('deepseek-v3.2（公益渠道）')).toBe('deepseek-v3.2');

        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{ message: { content: 'pong' } }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        await 请求模型文本({
            ...baseConfig,
            model: 'gemini-3.1-pro-high-search-真流-[星星公益站-CLI渠道]'
        }, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        const requestBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
        expect(requestBody.model).toBe('gemini-3.1-pro-high-search');
    });

    it('treats stream truncation as a retryable transport error', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockRejectedValueOnce(new Error('unexpected end of stream while reading response body'))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                choices: [{ message: { content: 'retried-ok' } }]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }));

        const result = await 请求模型文本(baseConfig, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        });

        expect(result).toBe('retried-ok');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('normalizes stream truncation into a user-readable message', () => {
        const raw = 'unexpected end of stream while reading response body';

        expect(是否流式连接中断错误消息(raw)).toBe(true);
        expect(规范化流式连接错误提示(raw)).toContain('模型流式连接中途断开');
        expect(规范化流式连接错误提示(raw)).not.toContain('unexpected end of stream');
    });

    it('rejects non-stream max-token truncation instead of returning partial text', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            choices: [{
                message: { content: '<命令>[{\"action\":\"set\"' },
                finish_reason: 'length'
            }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        await expect(请求模型文本(baseConfig, [{ role: 'user', content: 'ping' }], {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 500
        })).rejects.toThrow(/max_tokens|截断/);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
