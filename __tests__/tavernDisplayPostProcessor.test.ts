import { describe, expect, it } from 'vitest';
import type { GameResponse, 酒馆预设结构, 酒馆正则脚本分类条目 } from '../types';
import { 处理酒馆展示响应 } from '../hooks/useGame/tavernDisplayPostProcessor';
import { formatHistoryToScript } from '../hooks/useGame/historyUtils';

const 创建脚本 = (
    safetyType: 酒馆正则脚本分类条目['safetyType'],
    findRegex: string,
    replaceString: string
): 酒馆正则脚本分类条目 => ({
    safetyType,
    script: {
        id: `${safetyType}-${findRegex}`,
        scriptName: safetyType,
        findRegex,
        replaceString,
        placement: [2],
        disabled: false,
        markdownOnly: false,
        promptOnly: false,
        runOnEdit: false,
        minDepth: -1,
        maxDepth: 0
    }
});

const 创建预设 = (scripts: 酒馆正则脚本分类条目[]): 酒馆预设结构 => ({
    prompts: [{ identifier: 'main', role: 'system', content: 'test' }],
    prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }],
    兼容性: {
        正则脚本总数: scripts.length,
        安全清理脚本数: scripts.filter(item => item.safetyType === 'safe-cleanup').length,
        选项渲染脚本数: scripts.filter(item => item.safetyType === 'option-render').length,
        HTML美化脚本数: scripts.filter(item => item.safetyType === 'html-beautify').length,
        阻止脚本数: scripts.filter(item => item.safetyType === 'blocked').length,
        说明: [],
        已分类脚本列表: scripts
    }
});

describe('酒馆展示响应后处理', () => {
    it('返回克隆并且不改动状态命令或来源日志', () => {
        const response: GameResponse = {
            logs: [{ sender: '旁白', text: '正文<cleanup>删除</cleanup>' }],
            tavern_commands: [{ action: 'set', key: 'gameState.角色.金钱', value: 10 }],
            action_options: ['保留原选项']
        };
        const snapshot = structuredClone(response);
        const preset = 创建预设([
            创建脚本('safe-cleanup', '/<cleanup>[\\s\\S]*?<\\/cleanup>/g', '')
        ]);

        const result = 处理酒馆展示响应(response, preset);

        expect(result).not.toBe(response);
        expect(result.logs).not.toBe(response.logs);
        expect(result.tavern_commands).not.toBe(response.tavern_commands);
        expect(result.logs[0].text).toBe('正文');
        expect(result.body_original_logs).toEqual(snapshot.logs);
        expect(result.action_options).toEqual(['保留原选项']);
        expect(response).toEqual(snapshot);
        expect(formatHistoryToScript([{
            role: 'assistant',
            content: '',
            timestamp: 1,
            structuredResponse: result
        }])).toContain('正文<cleanup>删除</cleanup>');
    });

    it('仅在原选项为空时提取酒馆原生选项', () => {
        const response: GameResponse = {
            logs: [{
                sender: '旁白',
                text: '<options>\n>选项一：推门查看\n>选项二：留在原地\n</options>'
            }],
            action_options: []
        };

        const result = 处理酒馆展示响应(response, 创建预设([]));

        expect(result.action_options).toEqual(['推门查看', '留在原地']);
    });

    it('附加已清洗的静态 HTML 并忽略 blocked 脚本', () => {
        const response: GameResponse = {
            logs: [{ sender: '旁白', text: '面板标记' }]
        };
        const preset = 创建预设([
            创建脚本('html-beautify', '/面板标记/g', '```html\n<section onclick="alert(1)"><strong>状态</strong></section>\n```'),
            创建脚本('blocked', '/状态/g', '已执行危险替换')
        ]);

        const result = 处理酒馆展示响应(response, preset);

        expect(result.logs[0]).toMatchObject({
            htmlRenderMode: 'purify',
            htmlContent: '<section><strong>状态</strong></section>'
        });
        expect(result.logs[0].htmlContent).not.toContain('onclick');
        expect(result.logs[0].htmlContent).not.toContain('已执行危险替换');
    });
});
