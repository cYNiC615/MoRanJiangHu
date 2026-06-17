import { afterEach, describe, expect, it, vi } from 'vitest';
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
});
