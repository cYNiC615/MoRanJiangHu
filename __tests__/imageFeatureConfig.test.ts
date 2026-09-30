import { describe, expect, it } from 'vitest';
import { 解析文生图功能配置, 构建生图配置恢复签名 } from '../utils/imageFeatureConfig';
import { 规范化接口设置 } from '../utils/apiConfig';

describe('image feature configuration', () => {
    it('requires the master switch even when automatic tasks remain enabled', () => {
        const config: any = { 功能模型占位: { 文生图功能启用: false, NPC生图启用: true, 自动场景生图启用: true, 物品自动生图启用: true } };
        expect(解析文生图功能配置(config)).toMatchObject({ 总开关: false, NPC开关: false });
        config.功能模型占位.文生图功能启用 = true;
        expect(解析文生图功能配置(config)).toMatchObject({ 总开关: true, NPC开关: true });
        const enabledSignature = 构建生图配置恢复签名(config);
        config.功能模型占位.NPC生图启用 = false;
        expect(构建生图配置恢复签名(config)).not.toBe(enabledSignature);
    });

    it('changes the retry signature when a ComfyUI endpoint becomes usable without including credentials', () => {
        const config: any = 规范化接口设置({});
        const before = 构建生图配置恢复签名(config);
        Object.assign(config.功能模型占位, { 文生图功能启用: true, 文生图后端类型: 'comfyui',
            文生图模型API地址: 'http://127.0.0.1:8188', 文生图模型API密钥: 'private-test-key', 文生图模型使用模型: 'test' });
        const after = 构建生图配置恢复签名(config);
        expect(after).not.toBe(before);
        expect(after).not.toContain('private-test-key');
    });
});
