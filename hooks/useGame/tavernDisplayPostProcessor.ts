import type { GameLog, GameResponse, 酒馆预设结构 } from '../../types';
import { 获取预设已分类正则脚本 } from '../../utils/tavernPreset';
import { 提取酒馆选项 } from '../../utils/tavernOptionRenderer';
import { 执行酒馆安全正则 } from '../../utils/tavernRegexEngine';
import { 提取酒馆静态HTML, 清洗酒馆静态HTML } from '../../utils/tavernStaticHtml';

const 克隆日志 = (log: GameLog): GameLog => ({ ...log });

export const 处理酒馆展示响应 = (
    response: GameResponse,
    preset: 酒馆预设结构 | null | undefined
): GameResponse => {
    const scripts = 获取预设已分类正则脚本(preset);
    const sourceLogs = Array.isArray(response.logs) ? response.logs : [];
    const optionSource = sourceLogs.map(log => String(log?.text || '')).join('\n');
    const currentOptions = Array.isArray(response.action_options) ? [...response.action_options] : [];
    const extractedOptions = currentOptions.length === 0 ? 提取酒馆选项(optionSource, scripts) : [];

    const logs = sourceLogs.map((sourceLog) => {
        const log = 克隆日志(sourceLog);
        const regexProcessed = 执行酒馆安全正则(String(log.text || ''), scripts, {
            placement: 2,
            isMarkdown: true,
            chatDepth: 0
        });
        const extracted = 提取酒馆静态HTML(regexProcessed);
        const existingHtml = log.htmlContent ? 清洗酒馆静态HTML(log.htmlContent) : '';
        const htmlContent = [existingHtml, extracted.htmlContent].filter(Boolean).join('\n').trim();
        return {
            ...log,
            text: extracted.text || (htmlContent ? '酒馆静态界面' : regexProcessed),
            ...(htmlContent ? { htmlContent, htmlRenderMode: 'purify' as const } : {})
        };
    });

    return {
        ...response,
        logs,
        ...(Array.isArray(response.body_original_logs)
            ? { body_original_logs: response.body_original_logs.map(克隆日志) }
            : {}),
        ...(Array.isArray(response.tavern_commands)
            ? { tavern_commands: response.tavern_commands.map(command => ({ ...command })) }
            : {}),
        action_options: currentOptions.length > 0 ? currentOptions : extractedOptions
    };
};
