import { describe, expect, it } from 'vitest';
import {
    判断疑似网络或跨域错误,
    构建ComfyUI连接失败提示,
    构建ComfyUI运行时代理端点,
    构建OpenAI图片生成端点,
    构建通用生图连接失败提示,
    翻译连接测试错误,
    规范化OpenAI图片基础地址,
    规范化OpenAI图片模型名称
} from '../services/ai/imageGenerationDiagnostics';

describe('imageGenerationDiagnostics', () => {
    it('recognizes common browser fetch and CORS failures', () => {
        expect(判断疑似网络或跨域错误(new TypeError('Failed to fetch'))).toBe(true);
        expect(判断疑似网络或跨域错误(new Error('blocked by CORS policy'))).toBe(true);
        expect(判断疑似网络或跨域错误(new Error('validation failed'))).toBe(false);
    });

    it('builds actionable ComfyUI connection guidance', () => {
        const message = 构建ComfyUI连接失败提示('https://cnb-demo-001.cnb.space/', new Error('Failed to fetch'));

        expect(message).toContain('ComfyUI 连接失败');
        expect(message).toContain('CNB 的 VS Code 页面保持打开');
        expect(message).toContain('--enable-cors-header "*"');
        expect(message).toContain('https://cnb-xxxx-xxxx-001.cnb.space/?folder=/workspace');
        expect(message).toContain('原始错误：Failed to fetch');
    });

    it('uses local deployment wording for loopback ComfyUI addresses', () => {
        const message = 构建ComfyUI连接失败提示('http://127.0.0.1:8188', new Error('Failed to fetch'));

        expect(message).toContain('本机 ComfyUI');
        expect(message).toContain('如果从另一台设备访问');
        expect(message).toContain('电脑的局域网 IP');
        expect(message).not.toContain('CNB 的 VS Code 页面保持打开');
    });

    it('uses LAN deployment wording for private ComfyUI addresses', () => {
        const message = 构建ComfyUI连接失败提示('http://192.168.1.23:8188', new Error('Failed to fetch'));

        expect(message).toContain('局域网 IP');
        expect(message).toContain('防火墙');
        expect(message).toContain('--listen 0.0.0.0');
        expect(message).not.toContain('CNB 工作区页面地址');
    });

    it('uses backend-specific wording for SD WebUI', () => {
        const message = 构建通用生图连接失败提示('sd_webui', 'http://127.0.0.1:7860', new Error('NetworkError'));

        expect(message).toContain('Stable Diffusion WebUI 连接失败');
        expect(message).toContain('API/CORS');
        expect(message).toContain('NetworkError');
    });

    it('translates NovelAI IP allow-list denials without dumping raw JSON first', () => {
        const message = 翻译连接测试错误({
            message: 'API Error: 403 - {"error":{"code":"access_denied","message":"您的 IP 不在令牌允许访问的列表中"}}'
        }, { backendLabel: 'NovelAI', baseUrl: 'https://image.novelai.net' });

        expect(message).toContain('NovelAI拒绝访问');
        expect(message).toContain('IP 不在这枚 Token 允许访问的列表中');
        expect(message).toContain('IP 白名单');
        expect(message).not.toContain('{"error"');
    });

    it('normalizes pucoding image console URLs to the OpenAI-compatible image endpoint', () => {
        expect(规范化OpenAI图片基础地址('https://pucoding.com/playground/image')).toBe('https://pucoding.com');
        expect(构建OpenAI图片生成端点('https://pucoding.com/playground/image')).toBe('https://pucoding.com/v1/images/generations');
        expect(构建OpenAI图片生成端点('https://example.com/v1')).toBe('https://example.com/v1/images/generations');
        expect(构建OpenAI图片生成端点('https://api.example.com', 'https://pucoding.com/playground/image')).toBe('https://pucoding.com/v1/images/generations');
    });

    it('routes OpenAI-compatible image endpoints through the runtime same-origin proxy when requested', () => {
        const originalWindow = (globalThis as any).window;
        (globalThis as any).window = {
            location: {
                protocol: 'http:',
                origin: 'http://127.0.0.1:4173'
            }
        };

        try {
            expect(构建OpenAI图片生成端点('https://pucoding.com/playground/image', undefined, { useRuntimeProxy: true }))
                .toBe('http://127.0.0.1:4173/api/image-backend/openai-image-proxy/v1/images/generations?url=https%3A%2F%2Fpucoding.com');
            expect(构建OpenAI图片生成端点('https://api.example.com/v1', undefined, { useRuntimeProxy: true }))
                .toBe('http://127.0.0.1:4173/api/image-backend/openai-image-proxy/v1/images/generations?url=https%3A%2F%2Fapi.example.com');
            expect(构建OpenAI图片生成端点('https://www.aicost.xyz/', undefined, { useRuntimeProxy: true }))
                .toBe('http://127.0.0.1:4173/api/image-backend/openai-image-proxy/v1/images/generations?url=https%3A%2F%2Fwww.aicost.xyz');
        } finally {
            (globalThis as any).window = originalWindow;
        }
    });

    it('builds CNB ComfyUI runtime proxy endpoints for fallback requests', () => {
        const originalWindow = (globalThis as any).window;
        (globalThis as any).window = {
            location: {
                protocol: 'https:',
                origin: 'https://msjh.bacon159.pp.ua'
            }
        };

        try {
            expect(构建ComfyUI运行时代理端点('https://giexocxqpl-8188.cnb.run/', '/prompt'))
                .toBe('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/prompt?url=https%3A%2F%2Fgiexocxqpl-8188.cnb.run');
            expect(构建ComfyUI运行时代理端点('https://giexocxqpl-8188.cnb.run', '/view?filename=a.png&type=output'))
                .toBe('https://msjh.bacon159.pp.ua/api/image-backend/comfyui-proxy/view?filename=a.png&type=output&url=https%3A%2F%2Fgiexocxqpl-8188.cnb.run');
            expect(构建ComfyUI运行时代理端点('https://example.com', '/prompt'))
                .toBe('https://example.com/prompt');
        } finally {
            (globalThis as any).window = originalWindow;
        }
    });

    it('repairs the common gpt-image model typo before image requests', () => {
        expect(规范化OpenAI图片模型名称('gpt-iamge-2')).toBe('gpt-image-2');
        expect(规范化OpenAI图片模型名称('gpt-image-2')).toBe('gpt-image-2');
    });
});
