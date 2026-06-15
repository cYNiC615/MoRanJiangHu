import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateImageByPrompt } from '../services/ai/image';
import { isImageBackendRecentlyUnavailable } from '../services/ai/imageBackendRegistry';

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => store.set(key, value)),
        removeItem: vi.fn((key: string) => store.delete(key)),
    };
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('ComfyUI unavailable backend detection', () => {
    it('injects the final negative prompt into existing negative text nodes without inline positive fallback', async () => {
        vi.stubGlobal('window', {
            localStorage: createLocalStorageMock(),
            location: {
                protocol: 'https:',
                origin: 'https://msjh.bacon159.pp.ua',
            },
        });
        let submittedWorkflow: any = null;
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            if (url === 'https://live-8188.cnb.run/prompt') {
                submittedWorkflow = JSON.parse(String(init?.body || '{}')).prompt;
                return new Response(JSON.stringify({ prompt_id: 'p1' }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            if (url === 'https://live-8188.cnb.run/history/p1') {
                return new Response(JSON.stringify({
                    p1: {
                        status: { status_str: 'success', completed: true },
                        outputs: {
                            save: { images: [{ filename: 'ok.png', subfolder: '', type: 'output' }] },
                        },
                    },
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            if (url === 'https://live-8188.cnb.run/view?filename=ok.png&subfolder=&type=output') {
                return new Response(new Uint8Array([1, 2, 3]), {
                    status: 200,
                    headers: { 'content-type': 'image/png' },
                });
            }
            throw new Error(`unexpected fetch ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        await generateImageByPrompt('single pair of old straw sandals', {
            id: 'test',
            名称: 'ComfyUI test',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://live-8188.cnb.run',
            apiKey: '',
            model: '',
            图片后端类型: 'comfyui',
            图片接口路径: '/prompt',
            图片响应格式: 'url',
            ComfyUI工作流JSON: JSON.stringify({
                '1': {
                    class_type: 'CLIPTextEncode',
                    _meta: { title: 'Positive Prompt' },
                    inputs: { text: '__PROMPT__' }
                },
                '2': {
                    class_type: 'CLIPTextEncode',
                    _meta: { title: 'Negative Prompt' },
                    inputs: { text: 'old default negative' }
                },
                '3': {
                    class_type: 'KSampler',
                    inputs: {
                        positive: ['1', 0],
                        negative: ['2', 0],
                        seed: 1,
                        steps: 4,
                        cfg: 1,
                        sampler_name: 'euler',
                        scheduler: 'simple'
                    }
                },
                '4': {
                    class_type: 'SaveImage',
                    inputs: { images: ['3', 0] }
                }
            }),
        } as any, undefined, {
            构图: '物品图标' as any,
            附加负面提示词: 'person, human, face, hand, foot, feet, body part, portrait, photo frame'
        });

        expect(submittedWorkflow?.['1']?.inputs?.text).toContain('single pair of old straw sandals');
        expect(submittedWorkflow?.['1']?.inputs?.text).not.toContain('Negative prompt:');
        expect(submittedWorkflow?.['2']?.inputs?.text).toContain('person, human, face');
        expect(submittedWorkflow?.['2']?.inputs?.text).toContain('photo frame');
        expect(submittedWorkflow?.['2']?.inputs?.text).not.toBe('old default negative');
    });

    it('marks a CNB ComfyUI URL unavailable when /prompt returns the app HTML page', async () => {
        vi.stubGlobal('window', {
            localStorage: createLocalStorageMock(),
            location: {
                protocol: 'https:',
                origin: 'https://msjh.bacon159.pp.ua',
            },
        });
        vi.stubGlobal('fetch', vi.fn(async () => new Response(
            '<!DOCTYPE html><html><head><title>墨色江湖</title></head><body>墨色江湖</body></html>',
            { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
        )));

        await expect(generateImageByPrompt('test item', {
            id: 'test',
            名称: 'ComfyUI test',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://bad-8188.cnb.run',
            apiKey: '',
            model: '',
            图片后端类型: 'comfyui',
            图片接口路径: '/prompt',
            图片响应格式: 'url',
            ComfyUI工作流JSON: '{"1":{"class_type":"CLIPTextEncode","inputs":{"text":"__PROMPT__"}}}',
        } as any)).rejects.toThrow(/HTML|prompt_id|不可用|失效/);

        expect(isImageBackendRecentlyUnavailable('https://bad-8188.cnb.run')).toBe(true);
    });

    it('marks a CNB ComfyUI URL unavailable when /prompt returns Cloudflare 1101 HTML', async () => {
        vi.stubGlobal('window', {
            localStorage: createLocalStorageMock(),
            location: {
                protocol: 'https:',
                origin: 'https://msjh.bacon159.pp.ua',
            },
        });
        vi.stubGlobal('fetch', vi.fn(async () => new Response(
            '<!DOCTYPE html><html><head><title>Worker threw exception | msjh.bacon159.pp.ua | Cloudflare</title></head><body><span class="cf-error-code">1101</span></body></html>',
            { status: 500, headers: { 'content-type': 'text/html; charset=UTF-8' } }
        )));

        await expect(generateImageByPrompt('test item', {
            id: 'test',
            名称: 'ComfyUI test',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://cloudflare-8188.cnb.run',
            apiKey: '',
            model: '',
            图片后端类型: 'comfyui',
            图片接口路径: '/prompt',
            图片响应格式: 'url',
            ComfyUI工作流JSON: '{"1":{"class_type":"CLIPTextEncode","inputs":{"text":"__PROMPT__"}}}',
        } as any)).rejects.toThrow(/HTML|不可用|Cloudflare|1101/);

        expect(isImageBackendRecentlyUnavailable('https://cloudflare-8188.cnb.run')).toBe(true);
    });

});
