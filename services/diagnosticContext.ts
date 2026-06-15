import type { 存档结构 } from '../types';
import { 读取存档列表, 计算存档摘要短哈希 } from './dbService';
import { recordDiagnosticLog } from './diagnosticLog';

const AI_PARSE_FAILURE_STORAGE_KEY = 'moranjianghu.diagnostic.aiParseFailures.v1';
const MAX_PARSE_FAILURE_RECORDS = 6;
const MAX_PARSE_FAILURE_RAW_CHARS = 180_000;
const MAX_SAVE_HISTORY_ITEMS = 36;
const MAX_ARRAY_ITEMS = 80;
const MAX_OBJECT_KEYS = 160;
const MAX_GENERAL_STRING_CHARS = 12_000;
const MAX_RAW_JSON_STRING_CHARS = 80_000;
const MAX_SNAPSHOT_JSON_CHARS = 520_000;

export type AiParseFailureDiagnostic = {
    id: string;
    time: string;
    stage: string;
    message: string;
    parseDetail?: string;
    rawTextLength: number;
    rawText: string;
    rawTextHead?: string;
    rawTextTail?: string;
    model?: string;
    supplier?: string;
    baseUrlHost?: string;
    streaming?: boolean;
    validateTagCompleteness?: boolean;
    enableTagRepair?: boolean;
    requireActionOptionsTag?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    gameTime?: string;
};

type SanitizedSaveSnapshot = {
    capturedAt: string;
    totalSaves: number;
    selectedReason: string;
    notes: string[];
    saves: unknown[];
    truncated?: boolean;
};

const truncateMiddle = (value: string, maxChars: number): string => {
    const text = typeof value === 'string' ? value : '';
    if (text.length <= maxChars) return text;
    const marker = `\n...内容已截断，原始长度 ${text.length} 字符...\n`;
    const remaining = Math.max(0, maxChars - marker.length);
    const head = Math.ceil(remaining * 0.55);
    const tail = Math.max(0, remaining - head);
    return `${text.slice(0, head)}${marker}${text.slice(Math.max(0, text.length - tail))}`;
};

const readStorageList = (): AiParseFailureDiagnostic[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
        const parsed = JSON.parse(localStorage.getItem(AI_PARSE_FAILURE_STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item) => item && typeof item === 'object' && typeof item.id === 'string')
            .slice(0, MAX_PARSE_FAILURE_RECORDS) as AiParseFailureDiagnostic[];
    } catch {
        return [];
    }
};

const writeStorageList = (items: AiParseFailureDiagnostic[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(AI_PARSE_FAILURE_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_PARSE_FAILURE_RECORDS)));
    } catch {
        // Keep the normal diagnostic log even if localStorage quota is unavailable.
    }
};

const getBaseUrlHost = (baseUrl?: string): string => {
    const raw = typeof baseUrl === 'string' ? baseUrl.trim() : '';
    if (!raw) return '';
    try {
        return new URL(raw).host;
    } catch {
        return raw.replace(/^https?:\/\//i, '').split('/')[0] || raw.slice(0, 120);
    }
};

export const recordAiParseFailureDiagnostic = (params: {
    stage: string;
    error: any;
    rawText?: string;
    apiConfig?: any;
    streaming?: boolean;
    validateTagCompleteness?: boolean;
    enableTagRepair?: boolean;
    requireActionOptionsTag?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    gameTime?: string;
}) => {
    const rawText = typeof params.rawText === 'string'
        ? params.rawText
        : (typeof params.error?.rawText === 'string' ? params.error.rawText : '');
    const parseDetail = typeof params.error?.parseDetail === 'string' ? params.error.parseDetail : undefined;
    const message = typeof params.error?.message === 'string' && params.error.message.trim()
        ? params.error.message.trim()
        : (parseDetail || 'AI 响应解析失败');
    const record: AiParseFailureDiagnostic = {
        id: `parse_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        time: new Date().toISOString(),
        stage: params.stage,
        message,
        parseDetail,
        rawTextLength: rawText.length,
        rawText: truncateMiddle(rawText, MAX_PARSE_FAILURE_RAW_CHARS),
        rawTextHead: rawText ? rawText.slice(0, 3000) : undefined,
        rawTextTail: rawText ? rawText.slice(Math.max(0, rawText.length - 3000)) : undefined,
        model: typeof params.apiConfig?.model === 'string' ? params.apiConfig.model : undefined,
        supplier: typeof params.apiConfig?.供应商 === 'string' ? params.apiConfig.供应商 : undefined,
        baseUrlHost: getBaseUrlHost(params.apiConfig?.baseUrl),
        streaming: params.streaming,
        validateTagCompleteness: params.validateTagCompleteness,
        enableTagRepair: params.enableTagRepair,
        requireActionOptionsTag: params.requireActionOptionsTag,
        inputTokens: Number.isFinite(params.inputTokens) ? Number(params.inputTokens) : undefined,
        outputTokens: Number.isFinite(params.outputTokens) ? Number(params.outputTokens) : undefined,
        gameTime: params.gameTime
    };

    writeStorageList([record, ...readStorageList()].slice(0, MAX_PARSE_FAILURE_RECORDS));
    recordDiagnosticLog('error', ['AI 响应解析失败诊断', {
        stage: record.stage,
        message: record.message,
        parseDetail: record.parseDetail,
        rawTextLength: record.rawTextLength,
        rawTextHead: record.rawTextHead,
        rawTextTail: record.rawTextTail,
        model: record.model,
        supplier: record.supplier,
        baseUrlHost: record.baseUrlHost,
        streaming: record.streaming,
        validateTagCompleteness: record.validateTagCompleteness,
        enableTagRepair: record.enableTagRepair,
        requireActionOptionsTag: record.requireActionOptionsTag,
        storedContextId: record.id
    }]);
};

export const getRecentAiParseFailureDiagnostics = (): AiParseFailureDiagnostic[] => readStorageList();

const sensitiveKeyPattern = /(?:api[_-]?key|authorization|bearer|password|passwd|secret|client[_-]?secret|access[_-]?key|secret[_-]?key|github[_-]?.*token|image[_-]?host[_-]?token|discord[_-]?token|密钥|密码|令牌|凭证|访问令牌)/i;
const imageLikeKeyPattern = /(?:dataUrl|base64|图片数据|图像数据|背景图片|头像数据|imageData|blob)$/i;
const rawTextKeyPattern = /^(?:rawJson|rawText|原始回复|原始消息|parseErrorRawText)$/i;

const sanitizeString = (value: string, key: string): string => {
    if (/^data:image\//i.test(value)) {
        return `[已脱敏图片dataURL，原始长度 ${value.length} 字符]`;
    }
    if (/^data:/i.test(value) && value.length > 1000) {
        return `[已脱敏dataURL，原始长度 ${value.length} 字符]`;
    }
    if (imageLikeKeyPattern.test(key) && value.length > 1000) {
        return `[已脱敏疑似图片字段，原始长度 ${value.length} 字符]`;
    }
    return truncateMiddle(value, rawTextKeyPattern.test(key) ? MAX_RAW_JSON_STRING_CHARS : MAX_GENERAL_STRING_CHARS);
};

const sanitizeValue = (value: any, key = '', depth = 0): any => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return sanitizeString(value, key);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value !== 'object') return String(value);
    if (depth >= 8) return '[对象层级过深，已截断]';
    if (Array.isArray(value)) {
        const source = value.length > MAX_ARRAY_ITEMS
            ? value.slice(Math.max(0, value.length - MAX_ARRAY_ITEMS))
            : value;
        const mapped = source.map((item) => sanitizeValue(item, key, depth + 1));
        if (value.length > source.length) {
            return [{
                __truncatedArrayHead__: value.length - source.length,
                note: '数组过长，仅保留尾部排错相关条目'
            }, ...mapped];
        }
        return mapped;
    }

    const result: Record<string, any> = {};
    const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS);
    for (const [entryKey, entryValue] of entries) {
        if (sensitiveKeyPattern.test(entryKey)) {
            result[entryKey] = '[已脱敏敏感字段]';
            continue;
        }
        result[entryKey] = sanitizeValue(entryValue, entryKey, depth + 1);
    }
    if (Object.keys(value).length > entries.length) {
        result.__truncatedObjectKeys__ = Object.keys(value).length - entries.length;
    }
    return result;
};

const sanitizeHistory = (history: unknown): unknown[] => {
    if (!Array.isArray(history)) return [];
    return history
        .slice(Math.max(0, history.length - MAX_SAVE_HISTORY_ITEMS))
        .map((item) => sanitizeValue(item, 'historyItem'));
};

const saveSummary = (save: 存档结构) => ({
    id: save.id,
    type: save.类型,
    timestamp: save.时间戳,
    realSavedAt: (save.元数据 as any)?.现实保存时间ISO || (save.时间戳 ? new Date(save.时间戳).toISOString() : ''),
    shortHash: 计算存档摘要短哈希(save),
    characterName: save.角色数据?.姓名 || '',
    gameTime: save.环境信息?.时间 || '',
    location: [
        save.环境信息?.大地点,
        save.环境信息?.中地点,
        save.环境信息?.小地点,
        save.环境信息?.具体地点
    ].filter(Boolean).join(' / '),
    historyCount: Array.isArray(save.历史记录) ? save.历史记录.length : 0
});

const sanitizeSave = (save: 存档结构) => ({
    summary: saveSummary(save),
    metadata: sanitizeValue(save.元数据, '元数据'),
    gameInitialTime: save.游戏初始时间,
    role: sanitizeValue(save.角色数据, '角色数据'),
    environment: sanitizeValue(save.环境信息, '环境信息'),
    historyTail: sanitizeHistory(save.历史记录),
    social: sanitizeValue(save.社交, '社交'),
    world: sanitizeValue(save.世界, '世界'),
    tasks: sanitizeValue(save.任务列表, '任务列表'),
    agreements: sanitizeValue(save.约定列表, '约定列表'),
    story: sanitizeValue(save.剧情, '剧情'),
    storyPlan: sanitizeValue(save.剧情规划, '剧情规划'),
    heroinePlan: sanitizeValue(save.女主剧情规划, '女主剧情规划'),
    memory: sanitizeValue(save.记忆系统, '记忆系统'),
    openingConfig: sanitizeValue(save.openingConfig, 'openingConfig'),
    gameSettings: sanitizeValue(save.游戏设置, '游戏设置')
});

const shrinkSnapshotIfNeeded = (snapshot: SanitizedSaveSnapshot): SanitizedSaveSnapshot => {
    const text = JSON.stringify(snapshot);
    if (text.length <= MAX_SNAPSHOT_JSON_CHARS) return snapshot;
    return {
        ...snapshot,
        truncated: true,
        notes: [
            ...snapshot.notes,
            `完整脱敏快照 ${text.length} 字符，超过上报预算，已压缩为摘要 + 历史尾部。`
        ],
        saves: (snapshot.saves as any[]).map((item) => ({
            summary: item.summary,
            metadata: item.metadata,
            environment: item.environment,
            role: item.role,
            historyTail: item.historyTail,
            gameSettings: item.gameSettings,
            openingConfig: item.openingConfig
        }))
    };
};

export const buildDiagnosticSaveSnapshot = async (): Promise<SanitizedSaveSnapshot> => {
    const saves = await 读取存档列表();
    const selected: 存档结构[] = [];
    const pushUnique = (save?: 存档结构) => {
        if (!save) return;
        if (selected.some((item) => item.id === save.id)) return;
        selected.push(save);
    };
    pushUnique(saves[0]);
    pushUnique(saves.find((save) => save.类型 === 'auto'));
    pushUnique(saves.find((save) => save.类型 !== 'auto'));

    const snapshot: SanitizedSaveSnapshot = {
        capturedAt: new Date().toISOString(),
        totalSaves: saves.length,
        selectedReason: 'latest overall + latest auto + latest manual',
        notes: [
            '存档快照已递归脱敏 API Key、secret、token、password 与图片 dataURL。',
            '历史记录只保留尾部，rawJson 会保留头尾并按预算截断。',
            '如果错误发生在存档写入前，请优先查看 recentAiParseFailures 中的原始 AI 回复。'
        ],
        saves: selected.map((save) => sanitizeSave(save))
    };
    return shrinkSnapshotIfNeeded(snapshot);
};

export const buildDiagnosticDebugContext = async () => {
    const recentAiParseFailures = getRecentAiParseFailureDiagnostics();
    const saveSnapshot = await buildDiagnosticSaveSnapshot().catch((error: any) => ({
        capturedAt: new Date().toISOString(),
        totalSaves: 0,
        selectedReason: 'failed',
        notes: [`读取存档快照失败：${error?.message || String(error)}`],
        saves: []
    }));
    return {
        schemaVersion: 1,
        capturedAt: new Date().toISOString(),
        notes: [
            '上报按钮始终附带全量运行日志，不受页面筛选影响。',
            'recentAiParseFailures 保存解析失败瞬间的模型原文；saveSnapshot 保存最近存档的脱敏排错快照。'
        ],
        recentAiParseFailures,
        saveSnapshot
    };
};
