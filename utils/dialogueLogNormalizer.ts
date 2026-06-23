import type { GameLog } from '../types';

import { 是否可信角色发送者, 规范化正文发送者名 } from './dialogueSpeakerGuard';
import { 是否判定日志文本 } from './judgmentFormat';

const 开头引号正则 = /^[“"「『]/;
const 结尾引号正则 = /[”"」』]$/;
const 说话尾迹正则 = /(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道)\s*[：:]?\s*$/;
const 语气修饰尾迹正则 = /(?:轻声|低声|沉声|冷声|温声|柔声|厉声|朗声|小声|淡淡|缓缓|忽然|忽地|笑着|苦笑着|皱眉|抬眼|侧首|回头|点头|摇头|叹息|压低声音)\s*$/;
const 动作修饰尾迹正则 = /(?:点点头|摇摇头|点点|摇摇|皱了皱眉|皱了皱|皱眉|抬头|低头|回头|转头|转身|侧首|抬眼|垂眼|看着|望着|盯着|瞥向|注视|沉默片刻|轻咳一声|冷笑一声|苦笑一声|笑了笑|叹了口气|压低声音|放低声音)\s*$/;
const 泛称说话人正则 = /^(?:他|她|它|你|我|这人|那人|有人|众人|众弟子|众门人|众侍从|众士卒|众人齐声|众弟子齐声|众门人齐声|众侍从齐声|众士卒齐声|对方|男子|女子|少年|少女|老人|老者|汉子|侍女|侍从|弟子|门人|店小二|台词|旁白|独白|内心|心理|画外音|旁白音)$/;
const 非单一说话人正则 = /^(?:旁白|判定|NSFW判定|系统|众人|众弟子|众门人|众侍从|众士卒|众人齐声|众弟子齐声|众门人齐声|众侍从齐声|众士卒齐声|所有人|全场|人群|群声|齐声|同门|弟子们|门人们)$/;
const 语气词说话人正则 = /^(?:轻声|低声|沉声|冷声|温声|柔声|厉声|朗声|小声|淡淡|缓缓|忽然|忽地|笑着|苦笑着)$/;
const 非人名短语说话人正则 = /^(?:随着|伴随|当他|当她|当你|当我|如果|若是|只是|这是|那是|这个|那个|这种|那种|此时|这时|随后|然后|接着|同时|终于|突然|忽然|仍然|已经|开始|继续|所有|全场|一切|空气|雨声|风声|灯光|夜色|晨光|脚步|声音)/;
const 拟声词正则 = /^(?:啊+|呀+|唔+|嗯+|呃+|哼+|哈+|呵+|嘿+|咳+|轰+|砰+|啪+|咚+|铛+|嗡+|哗+|唰+|嗖+|吱+|喀+|咔+|沙+|呼+|呜+|嗷+|嘶+|噗+|扑通+|哗啦+|咔嚓+|轰隆+|咳咳+|哈哈+|呵呵+|嘿嘿+|呜呜+)[。！？!?…~～—-]*$/;
const Judge标签残留正则 = /(?:<|&lt;)\s*\/?\s*judge\s*(?:>|&gt;)/i;
const Judge数值残留正则 = /^判定值\s*[+\-]?\d+(?:\.\d+)?\s*\/\s*难度\s*[+\-]?\d+(?:\.\d+)?/m;
const 完整判定文本特征正则 = /判定值|结果\s*[=:：]|[｜|]/;

const 读取日志原始片段 = (log?: Partial<GameLog> | null): string => (
    typeof log?.rawText === 'string' ? log.rawText.trim() : ''
);

const 附加原始片段 = (log: GameLog, rawText?: string): GameLog => {
    const source = (rawText || '').trim();
    return source ? { ...log, rawText: source } : log;
};

const 合并原始片段 = (left?: string, right?: string): string => {
    const parts = [left, right]
        .map(item => (item || '').trim())
        .filter(Boolean);
    if (parts.length === 0) return '';
    return Array.from(new Set(parts)).join('\n');
};

const 清理说话人 = (value: string, options?: { declaredNames?: Set<string> }): string => {
    let text = (value || '')
        .replace(/[（(][^）)]{1,16}[）)]/g, '')
        .replace(/[【】\[\]「」『』“”"']/g, '')
        .trim();
    const special = 规范化正文发送者名(text);
    if (special === '奖励') return special;
    if (options?.declaredNames?.has(special)) return special;

    text = text.split(/[，,、；;。！？!?\s]/).filter(Boolean).pop() || text;
    const normalized = 规范化正文发送者名(text);
    if (options?.declaredNames?.has(normalized)) return normalized;
    for (let i = 0; i < 3; i += 1) {
        text = text
            .replace(说话尾迹正则, '')
            .replace(语气修饰尾迹正则, '')
            .replace(动作修饰尾迹正则, '')
            .trim();
    }
    const normalizedAfterCleanup = 规范化正文发送者名(text);
    if (options?.declaredNames?.has(normalizedAfterCleanup)) return normalizedAfterCleanup;
    text = text
        .replace(/^(?:那|这)(?=[\u4e00-\u9fff]{2,})/, '')
        .replace(/正$/, '')
        .replace(/[的盯看望瞥注点摇]$/, '')
        .trim();
    if (!text || text.length > 12) return '';
    if (/[：:，,。！？!?；;\n]/.test(text)) return '';
    if (非单一说话人正则.test(text) || 泛称说话人正则.test(text) || 语气词说话人正则.test(text) || 非人名短语说话人正则.test(text)) return '';
    if (!是否可信角色发送者(text, { allowUnknownName: true, declaredNames: options?.declaredNames })) return '';
    return text;
};

const 清理正文套话 = (value: string): string => (
    (value || '')
        .replace(/([。！？!?；;])\1+/g, '$1')
        .replace(/([。！？!?；;])([”」』])/g, '$1$2')
        .replace(/([”」』])([。！？!?；;])\2+/g, '$1$2')
);

const 拆分过长旁白段落 = (sender: string, value: string): string => {
    const text = 清理正文套话(value).trim();
    if (sender !== '旁白' || text.length < 220 || /\n\s*\n/.test(text)) return text;
    const units = text.match(/[^。！？!?；;\n]+[。！？!?；;]?|\n+/g) || [text];
    const paragraphs: string[] = [];
    let current = '';
    units.forEach((unit) => {
        const piece = unit.trim();
        if (!piece) return;
        if (current && current.length + piece.length > 150) {
            paragraphs.push(current);
            current = piece;
            return;
        }
        current = current ? `${current}${piece}` : piece;
    });
    if (current) paragraphs.push(current);
    return paragraphs.length > 1 ? paragraphs.join('\n\n') : text;
};

const 合并相邻同发送者 = (logs: GameLog[]): GameLog[] => {
    const merged: GameLog[] = [];
    logs.forEach((item) => {
        const sender = (item?.sender || '旁白').trim() || '旁白';
        const text = 拆分过长旁白段落(sender, item?.text || '');
        const rawText = 读取日志原始片段(item);
        if (!text) return;
        const previous = merged[merged.length - 1];
        if (previous && previous.sender === sender) {
            previous.text = `${previous.text}\n${text}`.trim();
            const mergedRaw = 合并原始片段(previous.rawText, rawText);
            if (mergedRaw) previous.rawText = mergedRaw;
            return;
        }
        merged.push(附加原始片段({ sender, text }, rawText));
    });
    return merged;
};

const 查找首段闭合引号位置 = (text: string): number => {
    const source = (text || '').trim();
    if (!source) return -1;
    const open = source[0];
    const close = open === '“' ? '”'
        : open === '「' ? '」'
            : open === '『' ? '』'
                : open === '"' ? '"'
                    : '';
    if (!close) return -1;
    return source.indexOf(close, 1);
};

const 是完整引号对白 = (text: string): boolean => {
    const source = (text || '').trim();
    return Boolean(source && 开头引号正则.test(source) && 结尾引号正则.test(source) && 查找首段闭合引号位置(source) === source.length - 1);
};

const 剥离外层引号 = (text: string): string => {
    const source = (text || '').trim();
    if (!是完整引号对白(source)) return source;
    return source.slice(1, -1).trim();
};

const 是否无效角色对白 = (sender: string, text: string): boolean => {
    const normalizedSender = 清理说话人(sender);
    if (!normalizedSender || 非单一说话人正则.test(normalizedSender) || 泛称说话人正则.test(normalizedSender)) return true;
    const speech = 剥离外层引号(text);
    if (!speech || 拟声词正则.test(speech)) return true;
    if (/^(?:众人|众弟子|众门人|众侍从|众士卒|所有人|全场|人群).{0,8}(?:齐声|一起|同时)/.test(speech)) return true;
    return false;
};

const 是否有效角色说话人 = (sender: string): boolean => {
    const normalizedSender = 清理说话人(sender);
    return Boolean(normalizedSender && !非单一说话人正则.test(normalizedSender) && !泛称说话人正则.test(normalizedSender));
};

const 含有引号对白 = (text: string): boolean => {
    const source = (text || '').trim();
    if (!source) return false;
    return /[“"「『][^”"」』\n]{1,500}[”"」』]/.test(source);
};

const 是否Judge残留文本 = (text: string): boolean => {
    const source = (text || '').trim();
    if (!source) return false;
    return Judge标签残留正则.test(source) || Judge数值残留正则.test(source);
};

const 方括号说话人行正则 = /^【\s*([A-Za-z0-9_\u4e00-\u9fff·]{1,16})\s*】\s*(.{1,800})$/;
const 方括号说话人片段正则 = /【\s*([A-Za-z0-9_\u4e00-\u9fff·]{1,16})\s*】\s*/g;
const 可疑方括号无引号旁白标签正则 = /(?:的|了|着|过|他|她|它|你|我|这|那|带来|摇|低头|抬头|转身|眼力|细雨|雨声|风声|灯光|夜色|青石|空气)/;
const 口语起始正则 = /^(?:我|我们|咱|咱们|你|你们|这事|那就|既然|今天|明天|昨天|前天|刚才|之前|现在|眼下|先|别|不要|必须|可以|应该|不是|恐怕|看来|听我|放心|等等|走|快|慢着|且慢|好|嗯|不行|没错|自然|当然|只要)/;
const 口语证据正则 = /[我你咱]|[？?！!]|(?:吧|吗|呢|啊|呀|嘛|呗|啦|喂|哼|嗯|唔|哦|行|好|滚|停|走|快|慢着|且慢)[。！？!?…~～]*$/;

const 取首段引号对白与余文 = (text: string): { speech: string; rest: string } | null => {
    const source = (text || '').trim();
    if (!开头引号正则.test(source)) return null;
    const closingIndex = 查找首段闭合引号位置(source);
    if (closingIndex <= 0) return null;
    return {
        speech: source.slice(1, closingIndex).trim(),
        rest: source.slice(closingIndex + 1).trim()
    };
};

const 是否可抽取方括号对白 = (speakerName: string, body: string): { speaker: string; speech: string; rest: string } | null => {
    const speaker = 清理说话人(speakerName);
    if (!speaker || 非单一说话人正则.test(speaker) || 泛称说话人正则.test(speaker)) return null;
    const text = (body || '').trim();
    if (!text || 是否Judge残留文本(text)) return null;

    const quoted = 取首段引号对白与余文(text);
    if (quoted) {
        if (!quoted.speech || 拟声词正则.test(quoted.speech)) return null;
        return { speaker, speech: quoted.speech, rest: quoted.rest };
    }

    const firstLine = text.split('\n')[0].trim();
    if (
        firstLine
        && firstLine.length <= 260
        && !可疑方括号无引号旁白标签正则.test(speakerName)
        && !拟声词正则.test(firstLine)
        && (口语证据正则.test(firstLine) || 口语起始正则.test(firstLine))
    ) {
        return { speaker, speech: firstLine, rest: text.slice(firstLine.length).trim() };
    }

    return null;
};

const 拆分旁白中的显式方括号对白 = (log: GameLog): GameLog[] => {
    const source = typeof log?.text === 'string' ? log.text.replace(/\r\n/g, '\n') : '';
    if (!source || !/【\s*[A-Za-z0-9_\u4e00-\u9fff·]{1,16}\s*】/.test(source)) return [log];
    const rawSource = 读取日志原始片段(log);

    const result: GameLog[] = [];
    let cursor = 0;
    let matched = false;
    let match: RegExpExecArray | null = null;
    方括号说话人片段正则.lastIndex = 0;

    while ((match = 方括号说话人片段正则.exec(source)) !== null) {
        const speakerName = (match[1] || '').trim();
        const bodyStart = 方括号说话人片段正则.lastIndex;
        const nextMatch = source.slice(bodyStart).match(/【\s*[A-Za-z0-9_\u4e00-\u9fff·]{1,16}\s*】\s*/);
        const bodyEnd = nextMatch?.index !== undefined && nextMatch.index >= 0
            ? bodyStart + nextMatch.index
            : source.length;
        const body = source.slice(bodyStart, bodyEnd);
        const extracted = 是否可抽取方括号对白(speakerName, body);
        if (!extracted) continue;

        const before = source.slice(cursor, match.index).trim();
        if (before) result.push(附加原始片段({ sender: '旁白', text: before }, rawSource));
        result.push(附加原始片段({ sender: extracted.speaker, text: extracted.speech }, rawSource));
        if (extracted.rest) result.push(附加原始片段({ sender: '旁白', text: extracted.rest }, rawSource));
        cursor = bodyEnd;
        方括号说话人片段正则.lastIndex = bodyEnd;
        matched = true;
    }

    if (!matched) return [log];
    const after = source.slice(cursor).trim();
    if (after) result.push(附加原始片段({ sender: '旁白', text: after }, rawSource));
    return 合并相邻同发送者(result);
};

const 取引号闭合符 = (char: string): string => {
    if (char === '“') return '”';
    if (char === '「') return '」';
    if (char === '『') return '』';
    if (char === '"') return '"';
    return '';
};

const 是否英文数字 = (char: string): boolean => /[A-Za-z0-9]/.test(char);

const 上一个非空字符 = (text: string): string => {
    for (let index = text.length - 1; index >= 0; index -= 1) {
        const char = text[index];
        if (!/\s/.test(char)) return char;
    }
    return '';
};

const 下一个非空字符 = (text: string, startIndex: number): string => {
    for (let index = startIndex; index < text.length; index += 1) {
        const char = text[index];
        if (!/\s/.test(char)) return char;
    }
    return '';
};

const 引号未闭合 = (text: string): boolean => {
    const stack: string[] = [];
    const source = text || '';
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const expectedClose = stack[stack.length - 1];
        if (expectedClose && char === expectedClose) {
            stack.pop();
            continue;
        }
        if (char === '"' && source[index - 1] === '\\') continue;
        const close = 取引号闭合符(char);
        if (close) {
            if (char === '"' && expectedClose === '"') stack.pop();
            else stack.push(close);
        }
    }
    return stack.length > 0;
};

const 压平引号内换行 = (text: string): string => {
    const source = (text || '').replace(/\r\n/g, '\n');
    const stack: string[] = [];
    let output = '';
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const expectedClose = stack[stack.length - 1];
        if (expectedClose && char === expectedClose) {
            stack.pop();
            output += char;
            continue;
        }
        if (char === '"' && source[index - 1] === '\\') {
            output += char;
            continue;
        }
        const close = 取引号闭合符(char);
        if (close) {
            if (char === '"' && expectedClose === '"') stack.pop();
            else stack.push(close);
            output += char;
            continue;
        }
        if (stack.length > 0 && char === '\n') {
            const previous = 上一个非空字符(output);
            const next = 下一个非空字符(source, index + 1);
            if (是否英文数字(previous) && 是否英文数字(next) && !/\s$/.test(output)) output += ' ';
            continue;
        }
        output += char;
    }
    return output;
};

const 保护引号换行日志 = (logs: GameLog[] | undefined): GameLog[] => {
    const sourceLogs = Array.isArray(logs) ? logs : [];
    const result: GameLog[] = [];
    let pending: GameLog | null = null;

    sourceLogs.forEach((item) => {
        const rawSender = (item?.sender || '旁白').trim() || '旁白';
        const rawText = typeof item?.text === 'string' ? item.text : String(item?.text ?? '');
        const rawSource = 读取日志原始片段(item);
        const text = 压平引号内换行(rawText);
        if (!text.trim()) return;

        if (pending) {
            const joiner = pending.text && text ? '' : '';
            pending.text = 压平引号内换行(`${pending.text}${joiner}${text}`);
            const mergedRaw = 合并原始片段(pending.rawText, rawSource);
            if (mergedRaw) pending.rawText = mergedRaw;
            if (!引号未闭合(pending.text)) {
                result.push(pending);
                pending = null;
            }
            return;
        }

        if (引号未闭合(text)) {
            pending = 附加原始片段({ sender: rawSender, text }, rawSource);
            return;
        }

        result.push(附加原始片段({ sender: rawSender, text }, rawSource));
    });

    if (pending) result.push(pending);
    return result;
};

const 拆分旁白夹杂无标签对白 = (log: GameLog): GameLog[] => {
    const source = typeof log?.text === 'string' ? log.text.replace(/\r\n/g, '\n') : '';
    if (!source || !source.includes('\n')) return [log];
    const rawSource = 读取日志原始片段(log);

    const result: GameLog[] = [];
    for (const rawLine of source.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;

        const bracketSpeaker = line.match(方括号说话人行正则);
        const bracketSpeakerName = (bracketSpeaker?.[1] || '').trim();
        if (bracketSpeaker && bracketSpeakerName) {
            const rawSpeech = (bracketSpeaker[2] || '').trim();
            const hasQuotedSpeech = 开头引号正则.test(rawSpeech);
            const speech = 剥离外层引号(rawSpeech);
            if (
                speech
                && bracketSpeakerName.length <= (hasQuotedSpeech ? 12 : 4)
                && (hasQuotedSpeech || !可疑方括号无引号旁白标签正则.test(bracketSpeakerName))
                && !非单一说话人正则.test(bracketSpeakerName)
                && !泛称说话人正则.test(bracketSpeakerName)
                && !拟声词正则.test(speech)
            ) {
                result.push(附加原始片段({ sender: bracketSpeakerName, text: speech }, rawSource));
                continue;
            }
        }

        result.push(附加原始片段({ sender: '旁白', text: line }, rawSource));
    }

    return result.length > 1 ? 合并相邻同发送者(result) : [log];
};

const 行中引号对白正则 = /[""「『]([^""」』\n]{1,500})[」』""]/g;
const 引号后说话人正则 = /^(.{1,20}?)(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道|冷哼|冷笑道|轻声道|低声|高声|厉声|沉声|柔声|淡淡地|淡淡道)(?:\s*[：:，,]\s*|\s+)/;
const 引号前说话人正则 = /(?:说|说道|道|问|问道|喊|喊道|喝|喝道|答|答道|回|回道|唤|唤道|骂|骂道|笑|笑道|叹|叹道|吩咐|提醒|解释|应|应道|接|接道|开口|继续|补充|又道|冷哼)\s*[：:，,]\s*$/;

const 拆分旁白行中引号对白 = (log: GameLog): GameLog[] => {
    const source = typeof log?.text === 'string' ? log.text : '';
    if (!source || source.includes('\n')) return [log];
    const rawSource = 读取日志原始片段(log);
    const parts: GameLog[] = [];
    let lastIndex = 0;
    let hasDialogue = false;
    let match: RegExpExecArray | null;
    行中引号对白正则.lastIndex = 0;
    while ((match = 行中引号对白正则.exec(source)) !== null) {
        const speech = (match[1] || '').trim();
        if (!speech || 拟声词正则.test(speech)) continue;
        const matchEnd = match.index + match[0].length;
        const afterText = source.slice(matchEnd).trim();
        const speakerMatch = afterText.match(引号后说话人正则);
        let speakerName = '';
        if (speakerMatch) {
            const candidate = 清理说话人(speakerMatch[1]);
            if (candidate && !非单一说话人正则.test(candidate) && !泛称说话人正则.test(candidate)) {
                speakerName = candidate;
            }
        }
        const before = source.slice(lastIndex, match.index).trim();
        if (before) {
            const beforeNarration = 引号前说话人正则.test(before)
                ? before.replace(引号前说话人正则, '').trim()
                : before;
            if (beforeNarration) parts.push(附加原始片段({ sender: '旁白', text: beforeNarration }, rawSource));
        }
        hasDialogue = true;
        if (speakerName) {
            parts.push(附加原始片段({ sender: speakerName, text: speech }, rawSource));
            const restAfterSpeaker = afterText.slice(speakerMatch[0].length).trim();
            if (restAfterSpeaker) parts.push(附加原始片段({ sender: '旁白', text: restAfterSpeaker }, rawSource));
            lastIndex = source.length;
            break;
        }
        parts.push(附加原始片段({ sender: '旁白', text: speech }, rawSource));
        lastIndex = matchEnd;
    }
    if (!hasDialogue) return [log];
    if (lastIndex < source.length) {
        const after = source.slice(lastIndex).trim();
        if (after) parts.push(附加原始片段({ sender: '旁白', text: after }, rawSource));
    }
    return parts.length > 1 ? 合并相邻同发送者(parts) : [log];
};

export const 规范化可渲染对白日志 = (logs: GameLog[] | undefined): GameLog[] => {
    const normalized = 保护引号换行日志(logs).flatMap((item) => {
        const rawSender = (item?.sender || '旁白').trim() || '旁白';
        const rawText = typeof item?.text === 'string' ? item.text.trim() : String(item?.text ?? '').trim();
        const rawSource = 读取日志原始片段(item);
        const text = 拆分过长旁白段落(rawSender === '旁白' ? '旁白' : 清理说话人(rawSender) || '旁白', rawText);
        if (是否Judge残留文本(text)) return [];
        if (是否判定日志文本(rawSender) || 是否判定日志文本(text)) {
            if (是否判定日志文本(rawSender) && !完整判定文本特征正则.test(text)) return [];
            return [附加原始片段({ sender: rawSender, text }, rawSource)];
        }
        const sender = 清理说话人(rawSender) || '旁白';
        if (!text) return [];
        if (sender === '旁白') {
            return 拆分旁白中的显式方括号对白(附加原始片段({ sender, text }, rawSource))
                .flatMap(item => item.sender === '旁白' ? 拆分旁白夹杂无标签对白(item) : [item])
                .flatMap(item => item.sender === '旁白' ? 拆分旁白行中引号对白(item) : [item]);
        }
        if (sender === '奖励') return [附加原始片段({ sender, text }, rawSource)];
        if (/^(【)?(?:判定|NSFW判定|对撞|对抗|防御|化解|伤害|反击|反馈|消耗|洞察|衰退)(】)?$/.test(sender)) {
            return [附加原始片段({ sender, text }, rawSource)];
        }
        if (是完整引号对白(text)) {
            return 是否无效角色对白(sender, text)
                ? [附加原始片段({ sender: '旁白', text }, rawSource)]
                : [附加原始片段({ sender, text }, rawSource)];
        }

        const closingIndex = 开头引号正则.test(text) ? 查找首段闭合引号位置(text) : -1;
        if (closingIndex > 0) {
            const quoted = text.slice(0, closingIndex + 1).trim();
            const rest = text.slice(closingIndex + 1).trim();
            const parts: GameLog[] = [];
            if (quoted && !是否无效角色对白(sender, quoted)) parts.push(附加原始片段({ sender, text: quoted }, rawSource));
            else if (quoted) parts.push(附加原始片段({ sender: '旁白', text: quoted }, rawSource));
            if (rest) parts.push(附加原始片段({ sender: '旁白', text: rest }, rawSource));
            return parts;
        }

        if (是否有效角色说话人(sender) && 含有引号对白(text)) {
            return [附加原始片段({ sender, text }, rawSource)];
        }

        if (是否有效角色说话人(sender)) {
            return [附加原始片段({ sender, text }, rawSource)];
        }

        return [附加原始片段({ sender: '旁白', text }, rawSource)];
    });
    return 合并相邻同发送者(normalized);
};

export const 规范化对白日志 = (
    logs: GameLog[] | undefined,
    options?: { declaredNames?: Set<string> }
): GameLog[] => {
    const normalized = 保护引号换行日志(logs)
        .flatMap((item) => {
            const rawSender = (item?.sender || '旁白').trim() || '旁白';
            const rawSource = 读取日志原始片段(item);
            const text = 拆分过长旁白段落(rawSender, typeof item?.text === 'string' ? item.text : String(item?.text ?? ''));
            if (是否判定日志文本(rawSender) || 是否判定日志文本(text)) return [附加原始片段({ sender: rawSender, text }, rawSource)];
            if (rawSender === '奖励') return [附加原始片段({ sender: rawSender, text }, rawSource)];
            const sender = rawSender === '旁白' ? '旁白' : (清理说话人(rawSender, options) || '旁白');
            const log = 附加原始片段({ sender, text }, rawSource);
            if (sender !== '旁白') return [log];
            return 拆分旁白中的显式方括号对白(log)
                .flatMap(item => item.sender === '旁白' ? 拆分旁白夹杂无标签对白(item) : [item])
                .flatMap(item => item.sender === '旁白' ? 拆分旁白行中引号对白(item) : [item]);
        });
    return 合并相邻同发送者(normalized);
};
