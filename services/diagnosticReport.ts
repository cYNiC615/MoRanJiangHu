import { LOCAL_APP_VERSION_CODE, LOCAL_APP_VERSION_NAME, 获取本地站点基址 } from '../utils/localAppInfo';
import { getDiagnosticLogs, type DiagnosticLogEntry } from './diagnosticLog';
import { recordDiagnosticLog } from './diagnosticLog';
import { buildDiagnosticDebugContext } from './diagnosticContext';

const DAILY_LIMIT = 10;
const RATE_LIMIT_STORAGE_KEY = 'moranjianghu.diagnosticReportRateLimit';
const DEVICE_ID_STORAGE_KEY = 'moranjianghu.diagnosticReportDeviceId';
const AUTO_REPORT_STORAGE_KEY = 'moranjianghu.diagnosticReportAutoUpload';
const AUTO_REPORT_MIN_INTERVAL_MS = 60 * 1000;

type RateLimitState = {
    date: string;
    count: number;
};

export type DiagnosticReportResult = {
    id: string;
    createdAt: string;
    expiresAt: string;
    remainingToday: number;
};

const getTodayKey = (): string => {
    const chinaTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 10);
};

const readRateLimitState = (): RateLimitState => {
    try {
        const parsed = JSON.parse(localStorage.getItem(RATE_LIMIT_STORAGE_KEY) || '{}') as Partial<RateLimitState>;
        const today = getTodayKey();
        if (parsed.date !== today) {
            return { date: today, count: 0 };
        }
        return { date: today, count: Math.max(0, Math.floor(Number(parsed.count) || 0)) };
    } catch {
        return { date: getTodayKey(), count: 0 };
    }
};

const writeRateLimitState = (state: RateLimitState) => {
    try {
        localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore localStorage failures; server-side storage still protects data retention.
    }
};

export const getDiagnosticReportQuota = (): { used: number; remaining: number; limit: number } => {
    const state = readRateLimitState();
    const used = Math.min(DAILY_LIMIT, state.count);
    return {
        used,
        remaining: Math.max(0, DAILY_LIMIT - used),
        limit: DAILY_LIMIT
    };
};

const buildApiBaseUrl = (): string => {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol;
    if (protocol === 'http:' || protocol === 'https:') {
        return window.location.origin;
    }
    return 获取本地站点基址();
};

const buildDiagnosticReportEndpoints = (): string[] => {
    const bases = [buildApiBaseUrl()]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);
    const uniqueBases = Array.from(new Set(bases));
    return uniqueBases.map((base) => new URL('/api/diagnostics/report', base).toString());
};

const readDiagnosticResponsePayload = async (response: Response): Promise<{ payload: any; rawText: string }> => {
    const rawText = await response.text().catch(() => '');
    if (!rawText.trim()) return { payload: null, rawText };
    try {
        return { payload: JSON.parse(rawText), rawText };
    } catch {
        return { payload: null, rawText };
    }
};

const submitDiagnosticPayload = async (
    payloadBody: unknown,
    options?: { autoUpload?: boolean }
): Promise<any> => {
    const endpoints = buildDiagnosticReportEndpoints();
    let lastError: Error | null = null;
    for (let index = 0; index < endpoints.length; index += 1) {
        const endpoint = endpoints[index];
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadBody)
            });
            const { payload, rawText } = await readDiagnosticResponsePayload(response);
            if (response.ok && payload?.ok && payload?.id) {
                if (index > 0) {
                    recordDiagnosticLog('info', '诊断日志上报使用备用入口成功', {
                        endpoint,
                        status: response.status
                    });
                }
                return payload;
            }

            const snippet = rawText.slice(0, 240);
            const message = payload?.error
                || `诊断日志上报失败：HTTP ${response.status}${snippet ? `，响应：${snippet}` : ''}`;
            lastError = new Error(message);
            recordDiagnosticLog(response.ok ? 'warn' : 'error', '诊断日志上报入口返回异常', {
                endpoint,
                status: response.status,
                ok: response.ok,
                hasJson: Boolean(payload),
                hasReportId: Boolean(payload?.id),
                responseSnippet: snippet
            });
            if ((!response.ok && response.status < 500) || options?.autoUpload) break;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            lastError = new Error(message);
            recordDiagnosticLog('warn', '诊断日志上报入口请求失败', {
                endpoint,
                message
            });
        }
    }
    throw lastError || new Error('诊断日志上报失败：网络或服务器无响应');
};

const getOrCreateDeviceId = (): string => {
    try {
        const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
        if (existing) return existing;
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        const next = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
        return next;
    } catch {
        return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
};

const countByLevel = (logs: DiagnosticLogEntry[]) => logs.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.level] = (acc[entry.level] || 0) + 1;
    return acc;
}, {});

const buildReportPayload = async (
    logs: DiagnosticLogEntry[],
    options?: { autoUpload?: boolean; triggerReason?: string }
) => {
    return {
        app: {
            name: '墨色江湖',
            versionCode: LOCAL_APP_VERSION_CODE,
            versionName: LOCAL_APP_VERSION_NAME,
            releaseChannel: 'homebrew',
            websiteUrl: 获取本地站点基址(),
            isNative: false
        },
        client: {
            deviceId: getOrCreateDeviceId(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            language: typeof navigator !== 'undefined' ? navigator.language : '',
            platform: typeof navigator !== 'undefined' ? navigator.platform : '',
            url: typeof window !== 'undefined' ? window.location.href : '',
            screen: typeof window !== 'undefined' ? {
                width: window.screen?.width,
                height: window.screen?.height,
                devicePixelRatio: window.devicePixelRatio
            } : undefined,
            reportedAt: new Date().toISOString()
        },
        summary: {
            autoUpload: options?.autoUpload === true,
            triggerReason: options?.triggerReason || '',
            total: logs.length,
            countByLevel: countByLevel(logs),
            latestError: logs.find((entry) => entry.level === 'error') || null
        },
        logs: logs.slice(0, 200),
        debugContext: await buildDiagnosticDebugContext()
    };
};

export const submitDiagnosticReport = async (entries?: DiagnosticLogEntry[]): Promise<DiagnosticReportResult> => {
    const state = readRateLimitState();
    if (state.count >= DAILY_LIMIT) {
        throw new Error(`今天诊断日志上报次数已达上限（${DAILY_LIMIT} 次），请明天再试。`);
    }

    const logs = (entries || getDiagnosticLogs()).slice(0, 200);
    if (!logs.length) {
        throw new Error('暂无可上报的诊断日志。');
    }

    const payload = await submitDiagnosticPayload(await buildReportPayload(logs));

    const nextState = { date: state.date, count: state.count + 1 };
    writeRateLimitState(nextState);

    return {
        id: String(payload.id),
        createdAt: String(payload.createdAt || ''),
        expiresAt: String(payload.expiresAt || ''),
        remainingToday: Math.max(0, Number(payload.remainingToday ?? (DAILY_LIMIT - nextState.count)) || 0)
    };
};

const readAutoReportState = (): { lastAt: number; lastErrorId: string } => {
    try {
        const parsed = JSON.parse(localStorage.getItem(AUTO_REPORT_STORAGE_KEY) || '{}') as Partial<{ lastAt: number; lastErrorId: string }>;
        return {
            lastAt: Math.max(0, Math.floor(Number(parsed.lastAt) || 0)),
            lastErrorId: typeof parsed.lastErrorId === 'string' ? parsed.lastErrorId : ''
        };
    } catch {
        return { lastAt: 0, lastErrorId: '' };
    }
};

const writeAutoReportState = (state: { lastAt: number; lastErrorId: string }) => {
    try {
        localStorage.setItem(AUTO_REPORT_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Automatic diagnostics are best-effort only.
    }
};

export const submitAutomaticErrorDiagnosticReport = async (reason?: string): Promise<DiagnosticReportResult | null> => {
    // 诊断上报改为用户在日志页手动触发，避免后台网络失败刷屏。
    void reason;
    return null;
};

export const submitAutomaticErrorDiagnosticReportDisabled = async (reason?: string): Promise<DiagnosticReportResult | null> => {
    const logs = getDiagnosticLogs().slice(0, 200);
    const latestError = logs.find((entry) => entry.level === 'error');
    if (!latestError) return null;

    const state = readAutoReportState();
    const now = Date.now();
    if (state.lastErrorId === latestError.id || now - state.lastAt < AUTO_REPORT_MIN_INTERVAL_MS) {
        return null;
    }

    const payload = await submitDiagnosticPayload(await buildReportPayload(logs, {
        autoUpload: true,
        triggerReason: reason || latestError.message
    }), { autoUpload: true }).catch(() => null);
    if (!payload?.ok || !payload?.id) {
        return null;
    }

    writeAutoReportState({ lastAt: now, lastErrorId: latestError.id });

    return {
        id: String(payload.id),
        createdAt: String(payload.createdAt || ''),
        expiresAt: String(payload.expiresAt || ''),
        remainingToday: Math.max(0, Number(payload.remainingToday ?? 0) || 0)
    };
};
