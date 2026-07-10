import type { 酒馆正则脚本分类条目 } from '../models/system';

export type 酒馆正则执行选项 = {
    placement: number;
    isMarkdown?: boolean;
    isPrompt?: boolean;
    chatDepth?: number;
};

export const 编译酒馆正则 = (source: string): RegExp | null => {
    const text = typeof source === 'string' ? source.trim() : '';
    if (!text) return null;
    try {
        const literal = text.match(/^\/([\s\S]*)\/([dgimsuvy]*)$/);
        if (literal) return new RegExp(literal[1], literal[2]);
        return new RegExp(text, 'g');
    } catch {
        return null;
    }
};

const 脚本适用于上下文 = (
    item: 酒馆正则脚本分类条目,
    options: 酒馆正则执行选项
): boolean => {
    const { script, safetyType } = item;
    if (safetyType !== 'safe-cleanup' && safetyType !== 'html-beautify') return false;
    if (script.disabled) return false;
    if (script.placement.length > 0 && !script.placement.includes(options.placement)) return false;
    if (script.markdownOnly && options.isMarkdown !== true) return false;
    if (script.promptOnly && options.isPrompt !== true) return false;
    if (options.chatDepth !== undefined) {
        if (script.minDepth >= 0 && options.chatDepth < script.minDepth) return false;
        if (script.maxDepth > 0 && options.chatDepth > script.maxDepth) return false;
    }
    return true;
};

export const 执行酒馆安全正则 = (
    text: string,
    scripts: 酒馆正则脚本分类条目[],
    options: 酒馆正则执行选项
): string => {
    if (typeof text !== 'string' || !text || !Array.isArray(scripts) || scripts.length === 0) return text;
    let result = text;
    for (const item of scripts) {
        if (!脚本适用于上下文(item, options)) continue;
        const regex = 编译酒馆正则(item.script.findRegex);
        if (!regex) continue;
        try {
            result = result.replace(regex, item.script.replaceString);
        } catch {
            // A malformed preset script must not fail the game turn.
        }
    }
    return result;
};
