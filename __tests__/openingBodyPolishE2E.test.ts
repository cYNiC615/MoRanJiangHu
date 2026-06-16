import { describe, expect, it } from 'vitest';
import * as bodyPolish from '../hooks/useGame/bodyPolish';

const readE2EConfig = () => {
    const baseUrl = process.env.MORAN_E2E_AI_BASE_URL?.trim();
    const apiKey = process.env.MORAN_E2E_AI_API_KEY?.trim();
    const model = process.env.MORAN_E2E_AI_MODEL?.trim();
    return baseUrl && apiKey && model ? { baseUrl, apiKey, model } : null;
};

describe('opening body polish e2e', () => {
    it.skipIf(!readE2EConfig())('does not echo protocol confirmation text during opening polish', async () => {
        const config = readE2EConfig();
        if (!config) throw new Error('missing e2e AI config');

        const executePolish = (bodyPolish as any)['执行正文润色'] as Function;
        const detectPollution = (bodyPolish as any)['检测文章优化协议确认污染'] as Function;
        const openingBody = [
            '<正文>',
            '【旁白】冷白色的主神光芒像一层没有温度的雾，压在东偏厅破败的梁柱之间。',
            '【旁白】林岚从地上坐起，指尖先摸到口袋里的短刃，又碰到那台已经无服务的智能手机。',
            '【林岚】先别乱走。这里像是任务世界的开场安全房，但门窗太破，安全时间不会太久。',
            '【沈青萝】你是说，我们现在已经被主神投放进来了？',
            '【旁白】窗外的雾气贴着糊纸游动，院门深处传来像木头被指甲缓慢刮过的声音。',
            '</正文>'
        ].join('\n');

        const deltas: string[] = [];
        const result = await executePolish(
            {
                logs: [
                    { sender: '旁白', text: '冷白色的主神光芒像一层没有温度的雾，压在东偏厅破败的梁柱之间。林岚从地上坐起，指尖先摸到口袋里的短刃，又碰到那台已经无服务的智能手机。' },
                    { sender: '林岚', text: '先别乱走。这里像是任务世界的开场安全房，但门窗太破，安全时间不会太久。' },
                    { sender: '沈青萝', text: '你是说，我们现在已经被主神投放进来了？' },
                    { sender: '旁白', text: '窗外的雾气贴着糊纸游动，院门深处传来像木头被指甲缓慢刮过的声音。' }
                ]
            },
            openingBody,
            {
                apiConfig: {
                    configs: [
                        {
                            id: 'e2e',
                            名称: 'E2E',
                            供应商: 'openai',
                            协议覆盖: 'auto',
                            baseUrl: config.baseUrl,
                            apiKey: config.apiKey,
                            model: config.model,
                            maxTokens: 4096,
                            temperature: 0.4
                        }
                    ],
                    activeConfigId: 'e2e',
                    功能模型占位: {
                        文章优化独立模型开关: true,
                        文章优化使用模型: config.model,
                        文章优化API地址: config.baseUrl,
                        文章优化API密钥: config.apiKey
                    }
                },
                prompts: [],
                gameConfig: { 启用COT伪装注入: true },
                环境: {
                    时间: '1:01:01:00:00',
                    大地点: '任务世界<荒怨>',
                    中地点: '封门村区域',
                    小地点: '封门村',
                    具体地点: '荒废古宅-东偏厅'
                },
                剧情: {},
                社交: [],
                角色: { 姓名: '林岚' },
                文章优化已开启: true,
                深拷贝: (value: any) => JSON.parse(JSON.stringify(value)),
                onDelta: (delta: string) => {
                    deltas.push(delta);
                }
            },
            {
                minLength: 120,
                signal: AbortSignal.timeout(90_000)
            }
        );

        const rawText = String(result.rawText || '');
        const finalText = JSON.stringify(result.response || {});
        expect(detectPollution(rawText)).toMatchObject({ polluted: false });
        expect(detectPollution(finalText)).toMatchObject({ polluted: false });
        expect(rawText).not.toContain('好的，将以<正文></正文>包裹正文');
        expect(finalText).not.toContain('好的，将以<正文></正文>包裹正文');
        expect(result.applied).toBe(true);
        expect(result.response.logs?.some((item: any) => item?.sender === '林岚')).toBe(true);
        expect(deltas.join('')).not.toContain('好的，将以<正文></正文>包裹正文');
    }, 120_000);
});
