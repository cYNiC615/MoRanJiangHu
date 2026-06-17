import { describe, expect, it } from 'vitest';
import {
    获取NSFW文生图接口配置,
    生图接口支持NSFW,
    获取文生图接口配置,
    获取场景文生图接口配置,
    接口配置是否可用,
    规范化接口设置,
    默认功能模型占位
} from '../utils/apiConfig';
import type { 接口设置结构 } from '../models/system';
import {
    构建运行时额外提示词,
    构建文生图运行时额外提示词,
    默认NSFW模式提示词,
    默认文生图NSFW模式提示词,
    默认亲密边界机制提示词
} from '../prompts/runtime/nsfw';

const 构建测试接口设置 = (overrides: Partial<接口设置结构['功能模型占位']> = {}): 接口设置结构 => 规范化接口设置({
    activeConfigId: 'default',
    configs: [{
        id: 'default',
        名称: '默认配置',
        供应商: 'openai_compatible',
        协议覆盖: 'auto',
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'text-model',
        maxTokens: 4096,
        temperature: 0.7,
        createdAt: 1,
        updatedAt: 1
    }],
    功能模型占位: {
        ...默认功能模型占位,
        文生图功能启用: true,
        文生图模型API地址: 'http://main-comfyui:8188',
        ...overrides
    }
});

describe('ComfyUI NSFW image config', () => {
    it('uses the shared ComfyUI image config when independent NSFW is off', () => {
        const settings = 构建测试接口设置();
        const result = 获取NSFW文生图接口配置(settings);

        expect(result).not.toBeNull();
        expect(result?.图片后端类型).toBe('comfyui');
        expect(result?.baseUrl).toBe('http://main-comfyui:8188');
        expect(result?.图片接口路径).toBe('/prompt');
        expect(生图接口支持NSFW(result)).toBe(true);
        expect(接口配置是否可用(result)).toBe(true);
    });

    it('returns null when image generation is disabled and no fallback exists', () => {
        const settings = 构建测试接口设置({ 文生图功能启用: false });

        expect(获取文生图接口配置(settings)).toBeNull();
        expect(获取NSFW文生图接口配置(settings)).toBeNull();
    });

    it('uses independent ComfyUI NSFW config when enabled', () => {
        const settings = 构建测试接口设置({
            NSFW生图独立接口启用: true,
            NSFW生图模型API地址: 'http://nsfw-comfyui:8188'
        });
        const result = 获取NSFW文生图接口配置(settings);

        expect(result).not.toBeNull();
        expect(result?.图片后端类型).toBe('comfyui');
        expect(result?.baseUrl).toBe('http://nsfw-comfyui:8188');
        expect(result?.model).toBe('');
        expect(result?.图片接口路径).toBe('/prompt');
        expect(生图接口支持NSFW(result)).toBe(true);
    });

    it('falls back to scene ComfyUI config when shared image generation is not usable', () => {
        const settings = 构建测试接口设置({
            文生图模型API地址: '',
            场景生图独立接口启用: true,
            场景生图模型API地址: 'http://scene-comfyui:8188'
        });
        const result = 获取NSFW文生图接口配置(settings);

        expect(result).not.toBeNull();
        expect(result?.图片后端类型).toBe('comfyui');
        expect(result?.baseUrl).toBe('http://scene-comfyui:8188');
    });

    it('uses discovered ComfyUI backends as last resort', () => {
        const settings = 构建测试接口设置({
            文生图模型API地址: '',
            场景生图模型API地址: '',
            NSFW生图模型API地址: ''
        });
        const result = 获取NSFW文生图接口配置(settings, [{ url: 'http://discovered-comfyui:8188' }]);

        expect(result).not.toBeNull();
        expect(result?.图片后端类型).toBe('comfyui');
        expect(result?.baseUrl).toBe('http://discovered-comfyui:8188');
        expect(result?.自动切换提示).toContain('已自动切换到在线 ComfyUI 后端');
    });

    it('keeps independent scene image config on the ComfyUI prompt route', () => {
        const settings = 构建测试接口设置({
            场景生图独立接口启用: true,
            场景生图模型API地址: 'http://scene-comfyui:8188'
        });
        const result = 获取场景文生图接口配置(settings);

        expect(result).not.toBeNull();
        expect(result?.图片后端类型).toBe('comfyui');
        expect(result?.baseUrl).toBe('http://scene-comfyui:8188');
        expect(result?.图片接口路径).toBe('/prompt');
    });
});

describe('NSFW prompt generation', () => {
    it('构建运行时额外提示词 returns NSFW prompt when enabled', () => {
        const result = 构建运行时额外提示词('', { 启用NSFW模式: true, 启用亲密边界机制: true });
        expect(result).toContain('NSFW');
        expect(result).toContain('肉棒');
        expect(result).toContain('小穴');
        expect(result).toContain('action + senses + body reaction + psychological change + relationship tension');
        expect(result).toContain('invitation/approach');
        expect(result).toContain('afterglow');
        expect(result).toContain('ASD反轻浮机制');
        expect(result).toContain('ASD部位阈值');
    });

    it('构建运行时额外提示词 combines custom prompt with NSFW', () => {
        const result = 构建运行时额外提示词('custom instruction', { 启用NSFW模式: true, 启用亲密边界机制: true });
        expect(result).toContain('custom instruction');
        expect(result).toContain('NSFW');
    });

    it('构建运行时额外提示词 returns only custom prompt when NSFW disabled', () => {
        const result = 构建运行时额外提示词('custom instruction', { 启用NSFW模式: false, 启用亲密边界机制: true });
        expect(result).toBe('custom instruction');
        expect(result).not.toContain('NSFW');
    });

    it('构建文生图运行时额外提示词 returns image NSFW prompt when enabled', () => {
        const result = 构建文生图运行时额外提示词('', { 启用NSFW模式: true });
        expect(result).toBe(默认文生图NSFW模式提示词);
        expect(result).toContain('adult');
        expect(result).toContain('sensual body language');
    });

    it('构建文生图运行时额外提示词 combines custom prompt with image NSFW', () => {
        const result = 构建文生图运行时额外提示词('style: dark fantasy', { 启用NSFW模式: true });
        expect(result).toContain('style: dark fantasy');
        expect(result).toContain('NSFW');
        expect(result).toContain('adult');
    });

    it('构建运行时额外提示词 handles empty custom prompt', () => {
        const result = 构建运行时额外提示词('', { 启用NSFW模式: true, 启用亲密边界机制: true });
        expect(result).toContain(默认NSFW模式提示词);
        expect(result).toContain(默认亲密边界机制提示词);
    });

    it('构建运行时额外提示词 allows disabling intimacy boundary rules', () => {
        const result = 构建运行时额外提示词('', { 启用NSFW模式: true, 启用亲密边界机制: false });
        expect(result).toBe(默认NSFW模式提示词);
        expect(result).not.toContain('ASD反轻浮机制');
    });
});
