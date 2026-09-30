import {
    酒馆正则脚本分类条目,
    酒馆正则脚本安全类型,
    酒馆正则脚本结构,
    酒馆预设兼容性结构,
    酒馆预设结构,
    酒馆预设消息角色类型,
    酒馆预设顺序结构,
    酒馆预设顺序项结构,
    酒馆预设提示词结构
} from '../models/system';

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value : '');
const 读取布尔 = (value: unknown): boolean => value === true;
const 读取数值数组 = (value: unknown): number[] => (
    Array.isArray(value)
        ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)).map(Math.floor)
        : []
);
const 读取数值 = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return Math.floor(parsed);
    }
    return null;
};

const 深拷贝JSON对象 = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    try {
        return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
        return undefined;
    }
};

const 包含阻止能力 = (replaceString: string): boolean => (
    /<\s*(?:script|iframe|object|embed|applet|form|img|link|audio|video|source)\b/i.test(replaceString)
    || /\b(?:window|document|localStorage|sessionStorage|indexedDB)\b/i.test(replaceString)
    || /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|eval)\s*\(/i.test(replaceString)
    || /\b(?:navigator\.sendBeacon|crypto\.subtle|Function\s*\()/i.test(replaceString)
    || /\b(?:src|srcset|href|action|formaction)\s*=/i.test(replaceString)
    || /\bon[a-z]+\s*=/i.test(replaceString)
    || /javascript\s*:/i.test(replaceString)
    || /(?:@import|url\s*\(|image-set\s*\(|expression\s*\(|-moz-binding|behavior\s*:)/i.test(replaceString)
);

const 是选项渲染脚本 = (script: 酒馆正则脚本结构): boolean => {
    const findRegex = script.findRegex.toLowerCase();
    const replaceString = script.replaceString.toLowerCase();
    const scriptName = script.scriptName.toLowerCase();
    const targetsOptions = /<\s*(?:options|branches)/.test(findRegex);
    return /data-option-text|option-list|option-link/.test(replaceString)
        || (/选项栏/.test(scriptName) && /options|branches/.test(findRegex))
        || (targetsOptions && /选项|option|choice/.test(scriptName));
};

const 包含静态HTML = (script: 酒馆正则脚本结构): boolean => (
    /<(?:div|span|p|section|article|details|summary|style|h[1-6]|ul|ol|li|table|blockquote|button)\b/i.test(script.replaceString)
);

export const 分类酒馆正则脚本 = (raw: unknown, index = 0): 酒馆正则脚本分类条目 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const findRegex = 读取文本(source.findRegex).trim();
    if (!findRegex) return null;
    const script: 酒馆正则脚本结构 = {
        id: 读取文本(source.id).trim() || `regex_${index + 1}`,
        scriptName: 读取文本(source.scriptName).trim() || `未命名脚本 ${index + 1}`,
        findRegex,
        replaceString: 读取文本(source.replaceString),
        placement: 读取数值数组(source.placement),
        disabled: source.disabled === true,
        markdownOnly: source.markdownOnly === true,
        promptOnly: source.promptOnly === true,
        runOnEdit: source.runOnEdit === true,
        minDepth: typeof source.minDepth === 'number' && Number.isFinite(source.minDepth) ? source.minDepth : -1,
        maxDepth: typeof source.maxDepth === 'number' && Number.isFinite(source.maxDepth) ? source.maxDepth : 0
    };
    let safetyType: 酒馆正则脚本安全类型 = 'safe-cleanup';
    if (是选项渲染脚本(script)) safetyType = 'option-render';
    else if (包含阻止能力(script.replaceString)) safetyType = 'blocked';
    else if (包含静态HTML(script)) safetyType = 'html-beautify';
    return { script, safetyType };
};

const 构建酒馆兼容性 = (extensions: Record<string, unknown> | undefined): 酒馆预设兼容性结构 | undefined => {
    const rawScripts = (extensions as any)?.regex_scripts;
    if (!Array.isArray(rawScripts)) return undefined;
    const scripts = rawScripts
        .map((item, index) => 分类酒馆正则脚本(item, index))
        .filter((item): item is 酒馆正则脚本分类条目 => Boolean(item));
    const count = (type: 酒馆正则脚本安全类型) => scripts.filter((item) => item.safetyType === type).length;
    const blockedCount = count('blocked');
    return {
        正则脚本总数: scripts.length,
        安全清理脚本数: count('safe-cleanup'),
        选项渲染脚本数: count('option-render'),
        HTML美化脚本数: count('html-beautify'),
        阻止脚本数: blockedCount,
        说明: [
            `已保留 ${scripts.length} 个 regex_scripts 扩展。`,
            blockedCount > 0
                ? `已阻止 ${blockedCount} 个包含脚本、网络、存储或外部资源能力的条目。`
                : '未发现需要阻止的可执行脚本。'
        ],
        已分类脚本列表: scripts
    };
};

const 规范化角色 = (raw: unknown, systemPrompt: unknown): 酒馆预设消息角色类型 => {
    if (raw === 'system' || raw === 'user' || raw === 'assistant') return raw;
    if (systemPrompt === true) return 'system';
    return 'system';
};

const 规范化提示词 = (raw: unknown): 酒馆预设提示词结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const identifier = 读取文本(source.identifier).trim();
    if (!identifier) return null;
    const name = 读取文本(source.name || source.title).trim();
    return {
        identifier,
        ...(name ? { name } : {}),
        role: 规范化角色(source.role, source.system_prompt),
        content: 读取文本(source.content),
        system_prompt: 读取布尔(source.system_prompt)
    };
};

const 规范化顺序项 = (raw: unknown): 酒馆预设顺序项结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const identifier = 读取文本(source.identifier).trim();
    if (!identifier) return null;
    return {
        identifier,
        enabled: source.enabled !== false
    };
};

const 规范化顺序 = (raw: unknown): 酒馆预设顺序结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const characterId = 读取数值(source.character_id);
    const orderRaw = Array.isArray(source.order) ? source.order : [];
    const order = orderRaw
        .map((item) => 规范化顺序项(item))
        .filter((item): item is 酒馆预设顺序项结构 => Boolean(item));
    if (characterId === null || order.length === 0) return null;
    return {
        character_id: characterId,
        order
    };
};

export const 规范化酒馆预设 = (raw: unknown): 酒馆预设结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as any;
    const promptsRaw = Array.isArray(source.prompts) ? source.prompts : [];
    const promptOrderRaw = Array.isArray(source.prompt_order) ? source.prompt_order : [];

    const prompts = promptsRaw
        .map((item) => 规范化提示词(item))
        .filter((item): item is 酒馆预设提示词结构 => Boolean(item));
    const prompt_order = promptOrderRaw
        .map((item) => 规范化顺序(item))
        .filter((item): item is 酒馆预设顺序结构 => Boolean(item));

    if (prompts.length === 0 || prompt_order.length === 0) return null;
    const extensions = 深拷贝JSON对象(source.extensions);
    const 兼容性 = 构建酒馆兼容性(extensions);
    return {
        prompts,
        prompt_order,
        ...(extensions ? { extensions } : {}),
        ...(兼容性 ? { 兼容性 } : {})
    };
};

export const 获取预设已分类正则脚本 = (
    preset: 酒馆预设结构 | null | undefined
): 酒馆正则脚本分类条目[] => preset?.兼容性?.已分类脚本列表 || [];

export const 获取酒馆预设角色ID列表 = (preset: 酒馆预设结构 | null | undefined): number[] => {
    if (!preset || !Array.isArray(preset.prompt_order)) return [];
    return Array.from(new Set(preset.prompt_order.map((item) => item.character_id)));
};

export const 获取酒馆预设顺序 = (
    preset: 酒馆预设结构 | null | undefined,
    selectedCharacterId?: number | null
): 酒馆预设顺序结构 | null => {
    if (!preset || !Array.isArray(preset.prompt_order) || preset.prompt_order.length === 0) return null;
    const normalizedId = typeof selectedCharacterId === 'number' && Number.isFinite(selectedCharacterId)
        ? Math.floor(selectedCharacterId)
        : null;
    if (normalizedId !== null) {
        const matched = preset.prompt_order.find((item) => item.character_id === normalizedId);
        if (matched) return matched;
    }
    const preferredDefault = preset.prompt_order.find((item) => item.character_id === 100001);
    if (preferredDefault) return preferredDefault;
    return preset.prompt_order[0] || null;
};
