const 普通现代废话模式 = /(普通现代都市|现代都市生活|每天通勤|通勤|外卖|刷手机|便利店|智能手机|普通支付|支付方式|微信|支付宝|银行卡转账|地铁公交|普通交通|普通居民|普通小区|普通白领|实习生、兼职者|日常经济|城市生活常识|招聘App|二手交易|日常社交平台|交通开销|基础餐饮)/;
const 独特设定模式 = /(核心组织|势力|组织|同盟|集团|家族|机构|学院|高校|实业|劳务中介|校企|实习合作|就业率|抽成|欠薪|押金|合同纠纷|媒体|报道|调解|社区事务|禁忌|禁令|规则|资源|异常|档案|冲突|失踪|秘密|地下|黑市|封口|限制|牵制|长期|协议|实验|污染|异能|超自然|近未来|灾变|遗留|代价|风险|风险生态|社会结构|阶层|垄断|调查|灰色|因果链|压力网|隐性冲突|信息差|制度信用|圈层信用|地理六层|父子地点|地点链)/;

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
    '- 必须优先覆盖核心组织/势力、长期冲突链、禁忌、稀缺资源、地理/社会结构；宁可少写城市常识。',
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

    const distinctiveLines: string[] = [];
    const contextLines: string[] = [];
    const seen = new Set<string>();
    lines.forEach((line) => {
        const normalized = line.replace(/\s+/g, '');
        if (seen.has(normalized)) return;
        seen.add(normalized);
        const hasUniqueSignal = 独特设定模式.test(line);
        if (hasUniqueSignal) {
            distinctiveLines.push(line);
            return;
        }
        if (!普通现代废话模式.test(line)) {
            contextLines.push(line);
        }
    });

    const fallbackLines = distinctiveLines.length > 0
        ? [...distinctiveLines, ...contextLines]
        : (contextLines.length > 0 ? contextLines : lines);
    const selectedLines: string[] = [];
    let currentLength = '【世界观摘要】'.length;
    for (const line of fallbackLines) {
        const bullet = `- ${line}`;
        const nextLength = currentLength + 1 + bullet.length;
        if (selectedLines.length > 0 && nextLength > maxChars) continue;
        if (selectedLines.length <= 0 && nextLength > maxChars) {
            selectedLines.push(`${bullet.slice(0, Math.max(40, maxChars - currentLength - 2)).trim()}…`);
            break;
        }
        selectedLines.push(bullet);
        currentLength = nextLength;
    }
    return ['【世界观摘要】', ...selectedLines.slice(0, 12)].join('\n');
};
