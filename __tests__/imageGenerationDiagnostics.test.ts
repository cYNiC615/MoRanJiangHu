import { describe, expect, it } from 'vitest';
import {
    判断疑似网络或跨域错误,
    构建ComfyUI连接失败提示,
    构建ComfyUI运行时代理端点,
    翻译连接测试错误
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

    it('translates token IP allow-list denials without dumping raw JSON first', () => {
        const message = 翻译连接测试错误({
            message: 'API Error: 403 - {"error":{"code":"access_denied","message":"您的 IP 不在令牌允许访问的列表中"}}'
        }, { backendLabel: '图片接口', baseUrl: 'https://image.example.com' });

        expect(message).toContain('图片接口拒绝访问');
        expect(message).toContain('IP 不在这枚 Token 允许访问的列表中');
        expect(message).toContain('IP 白名单');
        expect(message).not.toContain('{"error"');
    });

    it('builds CNB ComfyUI runtime proxy endpoints for fallback requests', () => {
        const originalWindow = (globalThis as any).window;
        (globalThis as any).window = {
            location: {
                protocol: 'https:',
                origin: 'https://app.example.test'
            }
        };

        try {
            expect(构建ComfyUI运行时代理端点('https://giexocxqpl-8188.cnb.run/', '/prompt'))
                .toBe('https://app.example.test/api/image-backend/comfyui-proxy/prompt?url=https%3A%2F%2Fgiexocxqpl-8188.cnb.run');
            expect(构建ComfyUI运行时代理端点('https://giexocxqpl-8188.cnb.run', '/view?filename=a.png&type=output'))
                .toBe('https://app.example.test/api/image-backend/comfyui-proxy/view?filename=a.png&type=output&url=https%3A%2F%2Fgiexocxqpl-8188.cnb.run');
            expect(构建ComfyUI运行时代理端点('https://example.com', '/prompt'))
                .toBe('https://example.com/prompt');
        } finally {
            (globalThis as any).window = originalWindow;
        }
    });

});
