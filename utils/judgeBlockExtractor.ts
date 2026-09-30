import { 是否判定日志文本 } from './judgmentFormat';

export type JudgeBlockExtraction = {
    cleanText: string;
    blocks: string[];
};

type JudgeTagToken = {
    start: number;
    end: number;
    closing: boolean;
};

const Judge标签正则 = /(?:<|&lt;)\s*(\/?)\s*judge\s*(?:>|&gt;)/gi;

const 读取Judge标签 = (text: string): JudgeTagToken[] => {
    const tokens: JudgeTagToken[] = [];
    let match: RegExpExecArray | null = null;
    Judge标签正则.lastIndex = 0;
    while ((match = Judge标签正则.exec(text)) !== null) {
        tokens.push({
            start: match.index,
            end: Judge标签正则.lastIndex,
            closing: Boolean(match[1])
        });
    }
    return tokens;
};

const 清理标签空行 = (text: string): string => (
    text
        .replace(/[\t ]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
);

export const 提取并清理Judge区块 = (text: string): JudgeBlockExtraction => {
    const source = String(text || '').replace(/\r\n/g, '\n');
    const tokens = 读取Judge标签(source);
    if (tokens.length === 0) {
        return { cleanText: source, blocks: [] };
    }

    const blocks: string[] = [];
    let cleanText = '';
    let cursor = 0;

    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        cleanText += source.slice(cursor, token.start);

        if (token.closing) {
            cursor = token.end;
            continue;
        }

        const boundary = tokens[index + 1];
        if (!boundary) {
            cursor = token.end;
            continue;
        }

        const block = source.slice(token.end, boundary.start).trim();
        if (/^【[^】]+】/.test(block) && !是否判定日志文本(block)) {
            cleanText += block;
        } else if (block) {
            blocks.push(block);
        }
        cursor = boundary.end;
        index += 1;
    }

    cleanText += source.slice(cursor);
    return {
        cleanText: 清理标签空行(cleanText),
        blocks
    };
};
