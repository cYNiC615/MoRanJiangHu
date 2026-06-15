import { LOCAL_APP_VERSION_CODE, LOCAL_APP_VERSION_NAME, 获取本地站点基址 } from '../utils/localAppInfo';
import { isNativeCapacitorEnvironment } from '../utils/nativeRuntime';
import { 获取本地图片图床迁移状态 } from './dbService';
import { 读取云端游玩会话 } from './cloudPlayService';

const ONLINE_SESSION_ID_KEY = 'moranjianghu.onlineSessionId';
const ONLINE_SESSION_LAST_SEEN_AT_KEY = 'moranjianghu.onlineSessionLastSeenAt';
const HEARTBEAT_PATH = '/api/admin/online';
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const WS_HEARTBEAT_INTERVAL_MS = 25 * 1000;
const WS_RECONNECT_MS = 10 * 1000;
const SESSION_TTL_MS = 2 * 60 * 1000;
const SESSION_RENEW_GRACE_MS = 15 * 1000;

const getOnlineApiBaseUrl = (): string => {
    if (!isNativeCapacitorEnvironment()) return '';
    return 获取本地站点基址();
};

const buildOnlineHttpUrl = (): string => `${getOnlineApiBaseUrl()}${HEARTBEAT_PATH}`;

const buildSessionId = (): string => {
    const bytes = new Uint8Array(12);
    window.crypto?.getRandomValues?.(bytes);
    const random = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('') || Math.random().toString(36).slice(2);
    return `web_${Date.now().toString(36)}_${random}`;
};

const readSessionLastSeenAt = (): number => {
    try {
        const raw = window.localStorage.getItem(ONLINE_SESSION_LAST_SEEN_AT_KEY);
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
        return 0;
    }
};

const markSessionAlive = (): void => {
    try {
        window.localStorage.setItem(ONLINE_SESSION_LAST_SEEN_AT_KEY, String(Date.now()));
    } catch {
        // ignore storage failures
    }
};

const readSessionId = (): string => {
    try {
        const existing = window.localStorage.getItem(ONLINE_SESSION_ID_KEY);
        const lastSeenAt = readSessionLastSeenAt();
        const sessionExpired = !lastSeenAt || Date.now() - lastSeenAt > SESSION_TTL_MS + SESSION_RENEW_GRACE_MS;
        if (existing && /^[a-zA-Z0-9._:-]{8,96}$/.test(existing) && !sessionExpired) return existing;
        const next = buildSessionId();
        window.localStorage.setItem(ONLINE_SESSION_ID_KEY, next);
        markSessionAlive();
        return next;
    } catch {
        return buildSessionId();
    }
};

const buildHeartbeatPayload = (sessionId: string) => {
    const cloudSession = 读取云端游玩会话();
    return {
        sessionId,
        path: `${window.location.pathname}${window.location.search}`.slice(0, 240),
        referrer: document.referrer || '',
        versionName: LOCAL_APP_VERSION_NAME,
        versionCode: LOCAL_APP_VERSION_CODE,
        platform: isNativeCapacitorEnvironment() ? 'capacitor-android' : 'web',
        userId: cloudSession?.userId || '',
        username: cloudSession?.username || '',
        imageStats: {
            migrationStatus: 获取本地图片图床迁移状态()
        }
    };
};

const sendHeartbeat = async (sessionId: string): Promise<void> => {
    await fetch(buildOnlineHttpUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildHeartbeatPayload(sessionId)),
        keepalive: true,
        cache: 'no-store'
    }).then(() => {
        markSessionAlive();
    }).catch(() => undefined);
};

const buildOnlineWebSocketUrl = (): string => {
    const baseUrl = getOnlineApiBaseUrl();
    if (baseUrl) {
        return `${baseUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')}${HEARTBEAT_PATH}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${HEARTBEAT_PATH}`;
};

export const startOnlinePresenceHeartbeat = (): (() => void) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined;
    if (window.location.pathname.startsWith('/admin/')) return () => undefined;

    const sessionId = readSessionId();
    let stopped = false;
    let timer: number | null = null;
    let wsTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;

    const clearWsTimer = () => {
        if (wsTimer) {
            window.clearInterval(wsTimer);
            wsTimer = null;
        }
    };

    const closeSocket = () => {
        clearWsTimer();
        if (socket) {
            try {
                socket.close();
            } catch {
                // ignore close failures
            }
            socket = null;
        }
    };

    const sendSocketPayload = async (type: 'hello' | 'ping') => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        try {
            socket.send(JSON.stringify({
                type,
                ...buildHeartbeatPayload(sessionId)
            }));
        } catch {
            // HTTP heartbeat remains as a fallback.
        }
    };

    const scheduleReconnect = () => {
        if (stopped || reconnectTimer) return;
        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connectSocket();
        }, WS_RECONNECT_MS);
    };

    const connectSocket = () => {
        if (stopped || typeof WebSocket === 'undefined') return;
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
        try {
            socket = new WebSocket(buildOnlineWebSocketUrl());
            socket.addEventListener('open', () => {
                markSessionAlive();
                void sendSocketPayload('hello');
                clearWsTimer();
                wsTimer = window.setInterval(() => {
                    void sendSocketPayload('ping');
                }, WS_HEARTBEAT_INTERVAL_MS);
            });
            socket.addEventListener('message', () => {
                markSessionAlive();
            });
            socket.addEventListener('close', () => {
                clearWsTimer();
                socket = null;
                scheduleReconnect();
            });
            socket.addEventListener('error', () => {
                closeSocket();
                scheduleReconnect();
            });
        } catch {
            scheduleReconnect();
        }
    };

    const tick = () => {
        if (stopped) return;
        if (socket && socket.readyState === WebSocket.OPEN) return;
        void sendHeartbeat(sessionId);
    };

    connectSocket();
    tick();
    timer = window.setInterval(tick, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        stopped = true;
        if (timer) window.clearInterval(timer);
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        closeSocket();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
};

export interface OnlinePresencePublicStats {
    onlineCount: number;
    totalRecentCount: number;
    onlineSessionCount: number;
    ttlSeconds: number;
    serverTime: string;
    playerTimelineWindowStart: string;
    playerTimelineWindowEnd: string;
    loggedInPlayers24h: Array<{
        userId: string;
        username: string;
        online: boolean;
        sessionCount: number;
        totalOnlineSeconds24h: number;
        firstSeenAt: string;
        lastSeenAt: string;
        timelineSegments: Array<{
            startAt: string;
            endAt: string;
            durationSeconds: number;
            active: boolean;
        }>;
    }>;
    topPlayer24h: {
        userId: string;
        username: string;
        online: boolean;
        sessionCount: number;
        totalOnlineSeconds24h: number;
        firstSeenAt: string;
        lastSeenAt: string;
        timelineSegments: Array<{
            startAt: string;
            endAt: string;
            durationSeconds: number;
            active: boolean;
        }>;
    } | null;
    hourlyHistory: Array<{
        hour: string;
        onlineCount: number;
        totalRecentCount: number;
        onlineSessionCount: number;
        sampledAt: string;
    }>;
}

export const fetchOnlinePresencePublicStats = async (): Promise<OnlinePresencePublicStats | null> => {
    try {
        const response = await fetch(`${buildOnlineHttpUrl()}?public=1`, {
            method: 'GET',
            cache: 'no-store'
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) return null;
        return {
            onlineCount: Math.max(0, Number(payload.onlineCount) || 0),
            totalRecentCount: Math.max(0, Number(payload.totalRecentCount) || 0),
            onlineSessionCount: Math.max(0, Number(payload.onlineSessionCount) || 0),
            ttlSeconds: Math.max(0, Number(payload.ttlSeconds) || 0),
            serverTime: typeof payload.serverTime === 'string' ? payload.serverTime : '',
            playerTimelineWindowStart: typeof payload.playerTimelineWindowStart === 'string' ? payload.playerTimelineWindowStart : '',
            playerTimelineWindowEnd: typeof payload.playerTimelineWindowEnd === 'string' ? payload.playerTimelineWindowEnd : '',
            loggedInPlayers24h: Array.isArray(payload.loggedInPlayers24h)
                ? payload.loggedInPlayers24h
                    .map((item: any) => ({
                        userId: typeof item?.userId === 'string' ? item.userId : '',
                        username: typeof item?.username === 'string' ? item.username : '',
                        online: Boolean(item?.online),
                        sessionCount: Math.max(0, Number(item?.sessionCount) || 0),
                        totalOnlineSeconds24h: Math.max(0, Number(item?.totalOnlineSeconds24h) || 0),
                        firstSeenAt: typeof item?.firstSeenAt === 'string' ? item.firstSeenAt : '',
                        lastSeenAt: typeof item?.lastSeenAt === 'string' ? item.lastSeenAt : '',
                        timelineSegments: Array.isArray(item?.timelineSegments)
                            ? item.timelineSegments
                                .map((segment: any) => ({
                                    startAt: typeof segment?.startAt === 'string' ? segment.startAt : '',
                                    endAt: typeof segment?.endAt === 'string' ? segment.endAt : '',
                                    durationSeconds: Math.max(0, Number(segment?.durationSeconds) || 0),
                                    active: Boolean(segment?.active)
                                }))
                                .filter((segment: any) => segment.startAt && segment.endAt)
                            : []
                    }))
                    .filter((item: any) => item.userId && item.username)
                : [],
            topPlayer24h: payload?.topPlayer24h && typeof payload.topPlayer24h === 'object'
                ? {
                    userId: typeof payload.topPlayer24h?.userId === 'string' ? payload.topPlayer24h.userId : '',
                    username: typeof payload.topPlayer24h?.username === 'string' ? payload.topPlayer24h.username : '',
                    online: Boolean(payload.topPlayer24h?.online),
                    sessionCount: Math.max(0, Number(payload.topPlayer24h?.sessionCount) || 0),
                    totalOnlineSeconds24h: Math.max(0, Number(payload.topPlayer24h?.totalOnlineSeconds24h) || 0),
                    firstSeenAt: typeof payload.topPlayer24h?.firstSeenAt === 'string' ? payload.topPlayer24h.firstSeenAt : '',
                    lastSeenAt: typeof payload.topPlayer24h?.lastSeenAt === 'string' ? payload.topPlayer24h.lastSeenAt : '',
                    timelineSegments: Array.isArray(payload.topPlayer24h?.timelineSegments)
                        ? payload.topPlayer24h.timelineSegments
                            .map((segment: any) => ({
                                startAt: typeof segment?.startAt === 'string' ? segment.startAt : '',
                                endAt: typeof segment?.endAt === 'string' ? segment.endAt : '',
                                durationSeconds: Math.max(0, Number(segment?.durationSeconds) || 0),
                                active: Boolean(segment?.active)
                            }))
                            .filter((segment: any) => segment.startAt && segment.endAt)
                        : []
                }
                : null,
            hourlyHistory: Array.isArray(payload.hourlyHistory)
                ? payload.hourlyHistory
                    .map((item: any) => ({
                        hour: typeof item?.hour === 'string' ? item.hour : '',
                        onlineCount: Math.max(0, Number(item?.onlineCount) || 0),
                        totalRecentCount: Math.max(0, Number(item?.totalRecentCount) || 0),
                        onlineSessionCount: Math.max(0, Number(item?.onlineSessionCount) || 0),
                        sampledAt: typeof item?.sampledAt === 'string' ? item.sampledAt : ''
                    }))
                    .filter((item: any) => item.hour)
                : []
        };
    } catch {
        return null;
    }
};
