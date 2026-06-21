const 普通现代废话模式 = /(普通现代都市|现代都市生活|每天通勤|外卖|刷手机|便利店|智能手机|电子支付|地铁公交|普通居民|日常经济|城市生活常识)/;
const 独特设定模式 = /(势力|组织|同盟|集团|家族|机构|禁忌|禁令|规则|资源|异常|档案|冲突|失踪|秘密|地下|黑市|封口|限制|牵制|长期|协议|实验|污染|异能|超自然|近未来|灾变|遗留|代价|风险|社会结构|阶层|垄断|调查|灰色)/;

const 清理摘要行 = (line: string): string => line
    .replace(/^\s*(?:[-*+•]|\d+[.)、]|#+)\s*/, '')
    .replace(/^\s*[【\[]?世界观摘要[】\]]?\s*[:：]?/i, '')
    .trim();

export const 构建世界观摘要提示词 = (worldPrompt: string): string => [
    '你是世界观压缩器，只负责把完整世界观压缩为主剧情常驻摘要。',
    '输出必须只包含一个 `<世界观摘要>` 标签块，不要解释，不要输出世界基底或变量命令。',
    '',
    '摘要要求：',
    '- 只保留本局独特规则、势力、禁忌、资源、冲突、社会结构与长期可引用事实。',
    '- 过滤普通现代都市废话：通勤、外卖、刷手机、普通支付、普通交通、普通城市生活常识不需要写入，除非它们被改造成独特规则或关键冲突。',
    '- 不要写角色种子 ID，不要强制任何未登场角色出场。',
    '- 控制在 600-1200 中文字，优先短句和可引用事实。',
    '',
    '<完整世界观>',
    (worldPrompt || '').trim(),
    '</完整世界观>',
    '',
    '<世界观摘要>'
].join('\n');

export const 提取世界观摘要内容 = (rawText: string): string => {
    const source = (rawText || '').replace(/\r\n/g, '\n').trim();
    if (!source) return '';
    const matches = Array.from(source.matchAll(/<\s*世界观摘要\s*>([\s\S]*?)(?:<\s*\/\s*世界观摘要\s*>|$)/gi));
    const tagged = matches.length > 0 ? (matches[matches.length - 1]?.[1] || '').trim() : '';
    return (tagged || source)
        .replace(/<\s*\/?\s*世界观摘要\s*>/gi, '')
        .trim();
};

export const 生成世界观确定性摘要 = (worldPrompt: string, maxChars = 1400): string => {
    const source = (worldPrompt || '').replace(/\r\n/g, '\n').trim();
    if (!source) return '【世界观摘要】\n- 本局世界观摘要暂缺；主剧情可临时参考完整世界观提示词。';

    const lines = source
        .split('\n')
        .map(清理摘要行)
        .filter(Boolean)
        .filter((line) => line.length >= 4)
        .filter((line) => !/^<\s*\/?\s*世界观\s*>$/i.test(line));

    const uniqueLines: string[] = [];
    const seen = new Set<string>();
    lines.forEach((line) => {
        const normalized = line.replace(/\s+/g, '');
        if (seen.has(normalized)) return;
        seen.add(normalized);
        const hasUniqueSignal = 独特设定模式.test(line);
        if (!hasUniqueSignal && 普通现代废话模式.test(line)) return;
        if (hasUniqueSignal || uniqueLines.length < 6) uniqueLines.push(line);
    });

    const fallbackLines = uniqueLines.length > 0
        ? uniqueLines
        : lines.filter((line) => !普通现代废话模式.test(line)).slice(0, 8);
    const summaryLines = fallbackLines.length > 0 ? fallbackLines : lines.slice(0, 6);
    let summary = ['【世界观摘要】', ...summaryLines.map((line) => `- ${line}`)].join('\n');
    if (summary.length > maxChars) {
        summary = `${summary.slice(0, Math.max(80, maxChars - 1)).trim()}…`;
    }
    return summary;
};
