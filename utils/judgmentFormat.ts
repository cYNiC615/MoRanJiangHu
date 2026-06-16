const 判定固定名称列表 = [
    '(?:NSFW)?判定',
    '对撞',
    '对抗',
    '防御',
    '化解',
    '伤害',
    '反击',
    '反馈',
    '消耗',
    '洞察',
    '衰退'
];

const 判定固定名称正则 = new RegExp(`^(?:${判定固定名称列表.join('|')})$`);
const 判定固定前缀正则 = new RegExp(`^(?:【\\s*(?:${判定固定名称列表.join('|')})\\s*】|\\[\\s*(?:${判定固定名称列表.join('|')})\\s*\\])`);
const 判定自定义分类前缀正则 = /^(【\s*[^】｜\n\r]{1,16}\s*】|\[\s*[^\]｜\n\r]{1,16}\s*\])/;
const 判定值难度特征正则 = /判定值\s*[+\-]?\d+(?:\.\d+)?\s*\/\s*难度\s*[+\-]?\d+(?:\.\d+)?/;
const 判定结果特征正则 = /(?:^|[｜\s])结果\s*=/;
const 判定结果词列表 = ['大成功', '大失败', '极成功', '极失败', '成功', '失败', '胜利', '落败', '锁定', '偏离', '致残', '重创', '肢残', '骨折', '破防', '截脉', '格挡', '僵持'];
const 判定结果字段正则 = new RegExp(`结果\\s*=\\s*(?:${判定结果词列表.join('|')})`, 'g');
const 判定大成功默认阈值 = 20;
const 判定大失败默认阈值 = -20;
const 判定战斗结果正则 = /^(胜利|落败|锁定|偏离|致残|重创|肢残|骨折|破防|截脉|格挡|僵持)$/;

export const 提取判定日志前缀 = (value: unknown): string => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (判定固定名称正则.test(text)) return text;
    const fixedMatch = text.match(判定固定前缀正则);
    if (fixedMatch?.[0]) return fixedMatch[0];

    const customMatch = text.match(判定自定义分类前缀正则);
    if (!customMatch?.[0]) return '';
    if (!判定值难度特征正则.test(text) || !判定结果特征正则.test(text)) return '';
    return customMatch[0];
};

export const 是否判定日志文本 = (value: unknown): boolean => Boolean(提取判定日志前缀(value));

export const 根据差额校正判定结果 = (rawResult: string, delta: number | null): string => {
    if (delta === null || !Number.isFinite(delta)) return rawResult;
    const normalized = String(rawResult || '').trim();
    if (判定战斗结果正则.test(normalized)) return normalized;
    if (delta < 0) return delta <= 判定大失败默认阈值 ? '大失败' : '失败';
    return delta >= 判定大成功默认阈值 ? '大成功' : '成功';
};

export const 拆分判定日志与后续正文 = (value: unknown): { judgmentText: string; trailingBody: string } | null => {
    const text = String(value || '').trim();
    if (!text || !是否判定日志文本(text)) return null;

    判定结果字段正则.lastIndex = 0;
    let match: RegExpExecArray | null = null;
    while ((match = 判定结果字段正则.exec(text)) !== null) {
        const resultEnd = match.index + match[0].length;
        const rest = text.slice(resultEnd);
        const trimmedRest = rest.trimStart();
        if (!trimmedRest || trimmedRest.startsWith('｜') || trimmedRest.startsWith('|')) continue;

        const trailingBody = rest.replace(/^[\s　。！？!?；;，,、:：-]+/, '').trim();
        if (!trailingBody) continue;
        return {
            judgmentText: text.slice(0, resultEnd).trim(),
            trailingBody
        };
    }

    return null;
};
