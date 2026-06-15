import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    判断ComfyUI工作流缺模型错误,
    格式化ComfyUI工作流校验错误,
    校验ComfyUI工作流可生图
} from '../services/ai/comfyWorkflowValidation';

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => store.set(key, value)),
        removeItem: vi.fn((key: string) => store.delete(key)),
    };
};

const apiWorkflow = JSON.stringify({
    '1': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Positive Prompt' },
        inputs: { text: '__PROMPT__' }
    },
    '2': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Negative Prompt' },
        inputs: { text: '__NEGATIVE_PROMPT__' }
    },
    '3': {
        class_type: 'EmptyLatentImage',
        inputs: { width: '__WIDTH__', height: '__HEIGHT__', batch_size: 1 }
    },
    '4': {
        class_type: 'KSampler',
        inputs: {
            model: ['5', 0],
            positive: ['1', 0],
            negative: ['2', 0],
            latent_image: ['3', 0],
            seed: '__SEED__',
            steps: '__STEPS__',
            cfg: '__CFG__',
            sampler_name: '__SAMPLER__',
            scheduler: '__SCHEDULER__'
        }
    },
    '6': {
        class_type: 'SaveImage',
        inputs: { images: ['4', 0] }
    }
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('ComfyUI workflow upload validation', () => {
    it('runs the workflow through a real ComfyUI prompt/history cycle before upload', async () => {
        vi.stubGlobal('window', {
            localStorage: createLocalStorageMock(),
            location: {
                protocol: 'https:',
                origin: 'https://msjh.bacon159.pp.ua',
            },
        });
        let submittedWorkflow: any = null;
        vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            if (url === 'https://comfy.example/prompt') {
                submittedWorkflow = JSON.parse(String(init?.body || '{}')).prompt;
                return new Response(JSON.stringify({ prompt_id: 'upload-check' }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            if (url === 'https://comfy.example/history/upload-check') {
                return new Response(JSON.stringify({
                    'upload-check': {
                        status: { status_str: 'success', completed: true },
                        outputs: {
                            save: { images: [{ filename: 'validated.png', subfolder: '', type: 'output' }] },
                        },
                    },
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            throw new Error(`unexpected fetch ${url}`);
        }));

        const result = await 校验ComfyUI工作流可生图({
            workflowJson: apiWorkflow,
            apiConfig: {
                id: 'test',
                名称: 'ComfyUI test',
                供应商: 'openai_compatible',
                协议覆盖: 'auto',
                baseUrl: 'https://comfy.example',
                apiKey: '',
                model: '',
                图片后端类型: 'comfyui',
                图片接口路径: '/prompt',
                图片响应格式: 'url',
                ComfyUI工作流JSON: apiWorkflow,
            } as any,
            timeoutMs: 30_000
        });

        expect(result.ok).toBe(true);
        expect(result.imageUrl).toBe('https://comfy.example/view?filename=validated.png&subfolder=&type=output');
        expect(submittedWorkflow?.['1']?.inputs?.text).toContain('single plain ceramic cup');
        expect(submittedWorkflow?.['2']?.inputs?.text).toContain('watermark');
        expect(submittedWorkflow?.['3']?.inputs?.width).toBe(512);
        expect(submittedWorkflow?.['3']?.inputs?.height).toBe(512);
        expect(submittedWorkflow?.['4']?.inputs?.steps).toBe(8);
    });

    it('formats missing-model failures with a local setup hint', () => {
        const error = new Error('Prompt outputs failed validation: CheckpointLoaderSimple ckpt_name not in list: missing.safetensors');
        expect(判断ComfyUI工作流缺模型错误(error)).toBe(true);
        const message = 格式化ComfyUI工作流校验错误(error);
        expect(message).toContain('缺少这个工作流需要的模型');
        expect(message).toContain('请先在本地生图服务器安装工作流所需模型');
    });
});
