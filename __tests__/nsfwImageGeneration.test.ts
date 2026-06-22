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
    NSFW轻信标提示词,
    NSFW亲密推进提示词,
    评估NSFW提示层级,
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
    it('普通日常只注入 NSFW 轻信标，不常驻完整显式规则', () => {
        const result = 构建运行时额外提示词('', { 启用NSFW模式: true, 启用亲密边界机制: true }, {
            stage: 'main',
            playerInput: '今天上午去学校旁边的便利店买早餐。'
        });
        expect(评估NSFW提示层级({ 启用NSFW模式: true }, { playerInput: '去便利店买早餐' })).toBe('beacon');
        expect(result).toContain(NSFW轻信标提示词);
        expect(result).not.toContain(默认NSFW模式提示词);
        expect(result).not.toContain('肉棒');
        expect(result).not.toContain('小穴');
        expect(result).not.toContain('action + senses + body reaction + psychological change + relationship tension');
        expect(result).not.toContain('ASD部位阈值');
    });

    it('暧昧/私密上下文注入亲密推进层，但不进入完整显式词库', () => {
        const result = 构建运行时额外提示词('custom instruction', { 启用NSFW模式: true, 启用亲密边界机制: true }, {
            stage: 'main',
            playerInput: '晚上和林知夏单独约会后送她回到合租卧室门口。',
            sceneText: '私密、安全、二人独处'
        });
        expect(评估NSFW提示层级({ 启用NSFW模式: true }, {
            playerInput: '和她单独约会，气氛暧昧',
            sceneText: '私密空间'
        })).toBe('intimacy');
        expect(result).toContain('custom instruction');
        expect(result).toContain(NSFW亲密推进提示词);
        expect(result).toContain(默认亲密边界机制提示词);
        expect(result).not.toContain(默认NSFW模式提示词);
        expect(result).not.toContain('肉棒');
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

    it('明确成人输入才注入完整显式 NSFW 规则', () => {
        const result = 构建运行时额外提示词('', { 启用NSFW模式: true, 启用亲密边界机制: true }, {
            stage: 'main',
            playerInput: '她同意后，两人在卧室里开始做爱。'
        });
        expect(评估NSFW提示层级({ 启用NSFW模式: true }, { playerInput: '两人在卧室里开始做爱' })).toBe('explicit');
        expect(result).toContain(默认NSFW模式提示词);
        expect(result).toContain(默认亲密边界机制提示词);
        expect(result).toContain('肉棒');
        expect(result).toContain('afterglow');
    });

    it('协议字段名和建档规则不会自触发 explicit 层级', () => {
        const protocolText = [
            '开局变量生成规则：主要角色缺少名器档案、小穴描述、子宫档案、失贞档案时需要后续补齐。',
            '世界书正文和字段名只用于建档协议，不代表当前回合正在发生成人场景。'
        ].join('\n');

        expect(评估NSFW提示层级({ 启用NSFW模式: true }, {
            stage: 'opening',
            playerInput: protocolText
        })).toBe('beacon');
    });

    it('明确成人输入即使提到档案也会进入 explicit 层级', () => {
        expect(评估NSFW提示层级({ 启用NSFW模式: true }, {
            stage: 'main',
            playerInput: '她明确同意后，要求参考已有名器档案，继续描写小穴、阴蒂和蜜液反应。'
        })).toBe('explicit');
    });

    it('构建运行时额外提示词 allows disabling intimacy boundary rules', () => {
        const result = 构建运行时额外提示词('', { 启用NSFW模式: true, 启用亲密边界机制: false }, {
            playerInput: '她同意后，两人在卧室里开始做爱。'
        });
        expect(result).toContain(默认NSFW模式提示词);
        expect(result).not.toContain('ASD反轻浮机制');
    });
});
