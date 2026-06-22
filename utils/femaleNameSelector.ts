import 女性人名选择器原始文本 from '../女性人名选择器?raw';

const 规范化姓名键 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

const 稳定哈希 = (text: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

export const 女性人名选择器列表 = Array.from(new Set(
    女性人名选择器原始文本
        .split(/\r?\n/)
        .map(规范化姓名键)
        .filter((name) => name.length > 0)
));

const 女性人名选择器集合 = new Set(女性人名选择器列表);

const 女性性别正则 = /女|女性|女子|少女|女修|姑娘|妇人|夫人|娘子|侍女|丫鬟/;
const 非女性性别正则 = /男娘|男性|男子|少年|男修|公子|汉子|男/;
const 占位女性姓名正则 = /^(?:角色|同门|随行者|新NPC|未命名NPC|未命名|未知|无名|女子|少女|女修|姑娘|侍女|丫鬟)\d*$/;
const 模板化女性姓名正则 = /^(?:苏婉儿|苏婉清|苏清婉|沈清婉|林婉儿|林清雪|柳若嫣|叶灵儿|赵灵儿|萧薰儿|云韵|婉儿|清雪|若嫣|灵儿|月儿|芷若|小雅|小柔|小蝶|小环|小翠)$/;

export const 判断女性名称目标 = (npc: any): boolean => {
    const sex = 规范化姓名键(npc?.性别 ?? npc?.gender);
    if (!sex) return false;
    if (非女性性别正则.test(sex) && !女性性别正则.test(sex)) return false;
    return 女性性别正则.test(sex);
};

export const 判断女性姓名来自姓名库 = (value: unknown): boolean => {
    const name = 规范化姓名键(value);
    return Boolean(name && 女性人名选择器集合.has(name));
};

export const 判断女性姓名需要兜底重命名 = (value: unknown): boolean => {
    const name = 规范化姓名键(value);
    return !name || 占位女性姓名正则.test(name);
};

export const 判断模板化女性姓名 = (value: unknown): boolean => {
    const name = 规范化姓名键(value);
    return Boolean(name && 模板化女性姓名正则.test(name));
};

export const 常见女性姓名黑名单 = [
    '苏婉儿',
    '苏婉清',
    '苏清婉',
    '沈清婉',
    '林婉儿',
    '林清雪',
    '柳若嫣',
    '叶灵儿',
    '赵灵儿',
    '萧薰儿',
    '云韵',
    '婉儿',
    '清雪',
    '若嫣',
    '灵儿',
    '月儿',
    '芷若',
    '小雅',
    '小柔',
    '小蝶',
    '小环',
    '小翠'
];

const 常见女性姓名黑名单集合 = new Set(常见女性姓名黑名单);
const 短昵称黑名单集合 = new Set(常见女性姓名黑名单.filter((name) => name.length <= 2));

const 排序姓名黑名单命中 = (hits: Iterable<string>): string[] => (
    Array.from(new Set(Array.from(hits).filter(Boolean)))
        .sort((a, b) => 常见女性姓名黑名单.indexOf(a) - 常见女性姓名黑名单.indexOf(b))
);

export const 提取命中女性姓名黑名单 = (value: unknown): string[] => {
    const text = typeof value === 'string'
        ? value
        : (value == null ? '' : JSON.stringify(value));
    if (!text) return [];
    const hits: string[] = [];
    [...常见女性姓名黑名单]
        .sort((a, b) => b.length - a.length)
        .forEach((name) => {
            if (!text.includes(name)) return;
            if (hits.some((hit) => hit.includes(name))) return;
            hits.push(name);
        });
    return 排序姓名黑名单命中(hits);
};

const 命令路径去前缀 = (value: unknown): string => (
    typeof value === 'string' ? value.trim().replace(/^gameState\./, '') : ''
);

const 命令动作 = (cmd: any): string => (
    typeof cmd?.action === 'string' ? cmd.action.trim() : 'set'
);

const 读取候选姓名 = (value: unknown): string => 规范化姓名键(value);

const 当前社交姓名集合 = (currentSocial?: any[]): Set<string> => new Set(
    (Array.isArray(currentSocial) ? currentSocial : [])
        .map((npc) => 规范化姓名键(npc?.姓名 ?? npc?.名称))
        .filter(Boolean)
);

const 命中黑名单姓名 = (name: unknown): string[] => {
    const normalized = 读取候选姓名(name);
    return normalized && 常见女性姓名黑名单集合.has(normalized) ? [normalized] : [];
};

const 命令值疑似女性姓名目标 = (value: any): boolean => (
    判断女性名称目标(value)
    || 命中黑名单姓名(value?.姓名 ?? value?.名称).length > 0
);

export const 提取命中新女性角色姓名黑名单 = (params: {
    response?: any;
    commands?: any[];
    currentSocial?: any[];
    includeLogSenders?: boolean;
}): string[] => {
    const hits = new Set<string>();
    const existingNames = 当前社交姓名集合(params.currentSocial);
    const commands = Array.isArray(params.commands)
        ? params.commands
        : (Array.isArray(params.response?.tavern_commands) ? params.response.tavern_commands : []);

    const pushName = (name: unknown) => {
        命中黑名单姓名(name).forEach((hit) => hits.add(hit));
    };

    commands.forEach((cmd: any) => {
        const action = 命令动作(cmd);
        const key = 命令路径去前缀(cmd?.key);
        if (action === 'push' && key === '社交' && cmd?.value && typeof cmd.value === 'object') {
            if (命令值疑似女性姓名目标(cmd.value)) pushName(cmd.value?.姓名 ?? cmd.value?.名称);
            return;
        }
        if (action !== 'set') return;

        const setName = key.match(/^社交\[(\d+)\]\.姓名$/);
        if (setName) {
            const index = Number(setName[1]);
            const nextName = 读取候选姓名(cmd?.value);
            const currentName = 读取候选姓名(params.currentSocial?.[index]?.姓名);
            if (!currentName || currentName !== nextName) pushName(nextName);
            return;
        }

        const setWholeNpc = key.match(/^社交\[(\d+)\]$/);
        if (setWholeNpc && cmd?.value && typeof cmd.value === 'object' && !Array.isArray(cmd.value)) {
            const index = Number(setWholeNpc[1]);
            const nextName = 读取候选姓名(cmd.value?.姓名 ?? cmd.value?.名称);
            const currentName = 读取候选姓名(params.currentSocial?.[index]?.姓名);
            if ((!currentName || currentName !== nextName) && 命令值疑似女性姓名目标(cmd.value)) pushName(nextName);
            return;
        }

        if (key === '社交' && Array.isArray(cmd?.value)) {
            cmd.value.forEach((item: any, index: number) => {
                if (!item || typeof item !== 'object' || Array.isArray(item)) return;
                const nextName = 读取候选姓名(item?.姓名 ?? item?.名称);
                const currentName = 读取候选姓名(params.currentSocial?.[index]?.姓名);
                if ((!currentName || currentName !== nextName) && 命令值疑似女性姓名目标(item)) pushName(nextName);
            });
        }
    });

    if (params.includeLogSenders !== false && Array.isArray(params.response?.logs)) {
        params.response.logs.forEach((log: any) => {
            const sender = 读取候选姓名(log?.sender);
            if (!sender || existingNames.has(sender) || 短昵称黑名单集合.has(sender)) return;
            pushName(sender);
        });
    }

    return 排序姓名黑名单命中(hits);
};

export const 构建女性姓名黑名单提示词 = (): string => [
    '【女性新角色姓名黑名单】',
    `- 禁止给新女性 NPC、女主、同学、同事、邻居、合作对象、姑娘、夫人等使用这些过度常见/模板化姓名：${常见女性姓名黑名单.join('、')}。`,
    '- 不再提供姓名候选池；请结合世界观、地域、家庭、组织、职业、身份、时代语感自行创造 2-4 字中文真实姓名。',
    '- 正文对白框 sender、`<变量规划>` 中的人物称呼、变量命令里的 `社交[i].姓名` 必须完全一致。',
    '- 已存在于社交档案、玩家手动修改或正文已点名的人物姓名必须原样保留；不要为了避开黑名单而改旧角色。',
    '- 临时代称、身份称呼或外貌描述不得写进姓名，可写入身份、简介或记忆；只有确有旧称、化名、曾用称呼时才写 `曾用名`，不要给每个 NPC 强行生成曾用名。'
].join('\n');

export const 选择唯一女性姓名 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
}): string => {
    const used = new Set(Array.from(params?.usedNames || []).map(规范化姓名键).filter(Boolean));
    if (女性人名选择器列表.length === 0) return `女性${used.size + 1}`;
    const start = 稳定哈希(params?.seed || `female-${used.size}`) % 女性人名选择器列表.length;
    for (let offset = 0; offset < 女性人名选择器列表.length; offset += 1) {
        const candidate = 女性人名选择器列表[(start + offset) % 女性人名选择器列表.length];
        if (candidate && !used.has(candidate)) return candidate;
    }
    const base = 女性人名选择器列表[start] || '女性';
    let suffix = used.size + 1;
    while (used.has(`${base}${suffix}`)) suffix += 1;
    return `${base}${suffix}`;
};

export const 选择女性姓名候选列表 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
    count?: number;
}): string[] => {
    const used = new Set(Array.from(params?.usedNames || []).map(规范化姓名键).filter(Boolean));
    const count = Math.max(1, Math.min(
        Number.isFinite(Number(params?.count)) ? Math.floor(Number(params?.count)) : 100,
        女性人名选择器列表.length || 1
    ));
    if (女性人名选择器列表.length === 0) return [];
    const start = 稳定哈希(params?.seed || `female-candidates-${used.size}`) % 女性人名选择器列表.length;
    const candidates: string[] = [];
    for (let offset = 0; offset < 女性人名选择器列表.length && candidates.length < count; offset += 1) {
        const candidate = 女性人名选择器列表[(start + offset) % 女性人名选择器列表.length];
        if (!candidate || used.has(candidate) || candidates.includes(candidate)) continue;
        candidates.push(candidate);
    }
    if (candidates.length >= count) return candidates;
    for (const candidate of 女性人名选择器列表) {
        if (candidates.length >= count) break;
        if (!candidate || used.has(candidate) || candidates.includes(candidate)) continue;
        candidates.push(candidate);
    }
    return candidates;
};

export const 重命名重复女性NPC列表 = (list: any[], options?: { 保留非姓名库主要女性名?: boolean }): any[] => {
    void options;
    return Array.isArray(list) ? list : [];
};
