import type { 酒馆正则脚本分类条目 } from '../models/system';
import { 编译酒馆正则 } from './tavernRegexEngine';

const 提取选项行 = (text: string): string[] => {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const rawLine of (text || '').replace(/\r\n/g, '\n').split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;
        const labeled = line.match(/^(?:>\s*)?(?:(?:选项|选择)\s*[一二三四五六七八九十\d]*|(?:option|choice)\s*\d*)\s*[:：]\s*(.+)$/i);
        const numbered = line.match(/^(?:>\s*)?\d+\s*[.、)]\s*(.+)$/);
        const value = (labeled?.[1] || numbered?.[1] || '').trim();
        if (!value || seen.has(value)) continue;
        seen.add(value);
        result.push(value);
    }
    return result;
};

const 收集显式选项块 = (text: string): string[] => {
    const blocks: string[] = [];
    const regex = /<\s*(?:options|branches)\s*>([\s\S]*?)<\s*\/\s*(?:options|branches)\s*>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) blocks.push(match[1]);
    return blocks;
};

export const 提取酒馆选项 = (
    text: string,
    scripts: 酒馆正则脚本分类条目[]
): string[] => {
    const candidates = 收集显式选项块(text).flatMap(提取选项行);
    if (candidates.length === 0) {
        for (const item of scripts) {
            if (item.safetyType !== 'option-render' || item.script.disabled) continue;
            if (item.script.placement.length > 0 && !item.script.placement.includes(2)) continue;
            const regex = 编译酒馆正则(item.script.findRegex);
            if (!regex) continue;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(text)) !== null) {
                const source = match.slice(1).find((value) => typeof value === 'string' && value.trim()) || match[0];
                candidates.push(...提取选项行(source));
                if (!regex.global) break;
            }
        }
    }
    return Array.from(new Set(candidates));
};
