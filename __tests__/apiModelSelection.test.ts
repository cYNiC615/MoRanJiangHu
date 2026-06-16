import { describe, expect, it } from 'vitest';

import { 选择最佳可用模型 } from '../components/features/Settings/ApiSettings';
import { 创建接口配置模板, 获取剧情回忆接口配置, 规范化接口设置 } from '../utils/apiConfig';

describe('接口模型自动选择', () => {
    it('优先选择同渠道返回列表中版本号更大的高能力模型', () => {
        expect(选择最佳可用模型([
            'gemini-2.5-pro',
            'gemini-2.0-pro',
            'gemini-2.5-flash',
            'text-embedding-004'
        ])).toBe('gemini-2.5-pro');
    });

    it('不会在小米等非 GPT 渠道测试时硬保留 GPT 模型', () => {
        expect(选择最佳可用模型([
            'moonshot-v1-8k',
            'moonshot-v1-32k',
            'moonshot-v1-128k',
            'moonshot-v1-8k-vision-preview'
        ])).toBe('moonshot-v1-128k');
    });

    it('过滤空值并避开图片、语音和嵌入类模型', () => {
        expect(选择最佳可用模型([
            '',
            'image-render-model',
            'text-embedding-3-large',
            'gpt-5-mini',
            'gpt-5'
        ])).toBe('gpt-5');
    });
});

describe('阶段上游模型解析', () => {
    const createSettings = (recallModel: string) => 规范化接口设置({
        activeConfigId: 'main-channel',
        configs: [
            {
                ...创建接口配置模板('openai_compatible'),
                id: 'main-channel',
                名称: '主剧情渠道',
                baseUrl: 'https://main.example.test/v1',
                apiKey: 'main-key',
                model: 'main-model'
            },
            {
                ...创建接口配置模板('openai_compatible'),
                id: 'recall-channel',
                名称: '剧情回忆渠道',
                baseUrl: 'https://recall.example.test/v1',
                apiKey: 'recall-key',
                model: 'recall-default-model'
            }
        ],
        功能模型占位: {
            剧情回忆独立模型开关: true,
            剧情回忆渠道ID: 'recall-channel',
            剧情回忆使用模型: recallModel
        }
    });

    it('阶段模型为空时会使用所选渠道默认模型', () => {
        const config = 获取剧情回忆接口配置(createSettings(''));

        expect(config?.id).toBe('recall-channel');
        expect(config?.baseUrl).toBe('https://recall.example.test/v1');
        expect(config?.apiKey).toBe('recall-key');
        expect(config?.model).toBe('recall-default-model');
    });

    it('阶段旧模型会覆盖新渠道默认模型', () => {
        const config = 获取剧情回忆接口配置(createSettings('main-model'));

        expect(config?.id).toBe('recall-channel');
        expect(config?.baseUrl).toBe('https://recall.example.test/v1');
        expect(config?.apiKey).toBe('recall-key');
        expect(config?.model).toBe('main-model');
    });

    it('阶段旧 API 地址会覆盖新渠道默认端点', () => {
        const config = 获取剧情回忆接口配置({
            ...规范化接口设置({
                activeConfigId: 'main-channel',
                configs: [
                    { ...创建接口配置模板('openai_compatible'), id: 'main-channel', 名称: '主剧情渠道', baseUrl: 'https://main.example.test/v1', apiKey: 'main-key', model: 'main-model' },
                    { ...创建接口配置模板('openai_compatible'), id: 'recall-channel', 名称: '剧情回忆渠道', baseUrl: 'https://recall.example.test/v1', apiKey: 'recall-key', model: 'recall-default-model' }
                ],
                功能模型占位: {
                    剧情回忆独立模型开关: true,
                    剧情回忆渠道ID: 'recall-channel',
                    剧情回忆使用模型: '',
                    剧情回忆API地址: 'https://old-manual-endpoint.test/v1',
                    剧情回忆API密钥: 'old-manual-key'
                }
            })
        });

        expect(config?.id).toBe('recall-channel');
        expect(config?.baseUrl).toBe('https://old-manual-endpoint.test/v1');
        expect(config?.apiKey).toBe('old-manual-key');
        expect(config?.model).toBe('recall-default-model');
    });
});
