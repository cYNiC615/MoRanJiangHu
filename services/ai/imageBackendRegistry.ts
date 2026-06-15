import type { 发现图片后端记录结构 } from '../../models/system';

type 后端注册表响应 = {
    ok?: boolean;
    items?: 发现图片后端记录结构[];
};

const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, '');
const CONNECTION_STATS_STORAGE_KEY = 'moranjianghu.imageBackendConnectionStats.v1';
const UNAVAILABLE_BACKENDS_STORAGE_KEY = 'moranjianghu.imageBackendUnavailable.v1';
const UNAVAILABLE_BACKEND_TTL_MS = 10 * 60 * 1000;

export type ImageBackendConnectionTarget = 'main' | 'scene' | 'nsfw' | 'global';

export type ImageBackendConnectionStatsEntry = {
    successCount: number;
    lastConnectedAt: number;
};

export type ImageBackendConnectionStats = Record<string, ImageBackendConnectionStatsEntry>;

const canUseLocalStorage = (): boolean => (
    typeof window !== 'undefined'
    && typeof window.localStorage !== 'undefined'
);

export const normalizeDiscoveredBackendUrl = (value?: string): string => normalizeUrl(value || '');

const readUnavailableBackends = (): Record<string, number> => {
    if (!canUseLocalStorage()) return {};
    try {
        const raw = window.localStorage.getItem(UNAVAILABLE_BACKENDS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== 'object') return {};
        const now = Date.now();
        return Object.fromEntries(
            Object.entries(parsed as Record<string, unknown>)
                .map(([key, value]) => [normalizeDiscoveredBackendUrl(key), Math.max(0, Number(value) || 0)] as const)
                .filter(([key, value]) => key && now - value < UNAVAILABLE_BACKEND_TTL_MS)
        );
    } catch {
        return {};
    }
};

const writeUnavailableBackends = (items: Record<string, number>): void => {
    if (!canUseLocalStorage()) return;
    try {
        window.localStorage.setItem(UNAVAILABLE_BACKENDS_STORAGE_KEY, JSON.stringify(items));
    } catch {
        // localStorage may be full; failing to remember an unavailable backend should not break image generation.
    }
};

export const recordImageBackendConnectionFailure = (backend: Partial<发现图片后端记录结构> | string): void => {
    const url = normalizeDiscoveredBackendUrl(typeof backend === 'string' ? backend : backend.url);
    if (!url) return;
    writeUnavailableBackends({
        ...readUnavailableBackends(),
        [url]: Date.now()
    });
};

export const clearImageBackendConnectionFailure = (backend: Partial<发现图片后端记录结构> | string): void => {
    const url = normalizeDiscoveredBackendUrl(typeof backend === 'string' ? backend : backend.url);
    if (!url) return;
    const items = readUnavailableBackends();
    if (!(url in items)) return;
    delete items[url];
    writeUnavailableBackends(items);
};

export const isImageBackendRecentlyUnavailable = (backend: Partial<发现图片后端记录结构> | string): boolean => {
    const url = normalizeDiscoveredBackendUrl(typeof backend === 'string' ? backend : backend.url);
    if (!url) return false;
    return url in readUnavailableBackends();
};

const buildBackendStatKeys = (
    target: ImageBackendConnectionTarget,
    backend: Partial<发现图片后端记录结构> | string
): string[] => {
    const id = typeof backend === 'string' ? '' : (backend.id || '').trim();
    const url = normalizeDiscoveredBackendUrl(typeof backend === 'string' ? backend : backend.url);
    const rawKeys = [
        id ? `${target}:id:${id}` : '',
        url ? `${target}:url:${url}` : '',
        id ? `global:id:${id}` : '',
        url ? `global:url:${url}` : ''
    ];
    return Array.from(new Set(rawKeys.filter(Boolean)));
};

export const readImageBackendConnectionStats = (): ImageBackendConnectionStats => {
    if (!canUseLocalStorage()) return {};
    try {
        const raw = window.localStorage.getItem(CONNECTION_STATS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== 'object') return {};
        return Object.fromEntries(
            Object.entries(parsed as Record<string, Partial<ImageBackendConnectionStatsEntry>>)
                .map(([key, value]) => {
                    const successCount = Math.max(0, Math.floor(Number(value?.successCount) || 0));
                    const lastConnectedAt = Math.max(0, Math.floor(Number(value?.lastConnectedAt) || 0));
                    return [key, { successCount, lastConnectedAt }];
                })
        );
    } catch {
        return {};
    }
};

const writeImageBackendConnectionStats = (stats: ImageBackendConnectionStats): void => {
    if (!canUseLocalStorage()) return;
    try {
        window.localStorage.setItem(CONNECTION_STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
        // localStorage may be unavailable in private mode or native shells.
    }
};

const pickBestStatsEntry = (
    stats: ImageBackendConnectionStats,
    target: ImageBackendConnectionTarget,
    backend: Partial<发现图片后端记录结构> | string
): ImageBackendConnectionStatsEntry => {
    return buildBackendStatKeys(target, backend)
        .map((key) => stats[key])
        .filter(Boolean)
        .reduce<ImageBackendConnectionStatsEntry>((best, item) => {
            if (item.successCount > best.successCount) return item;
            if (item.successCount === best.successCount && item.lastConnectedAt > best.lastConnectedAt) return item;
            return best;
        }, { successCount: 0, lastConnectedAt: 0 });
};

export const recordImageBackendConnectionSuccess = (
    target: Exclude<ImageBackendConnectionTarget, 'global'>,
    backend: Partial<发现图片后端记录结构> | string
): ImageBackendConnectionStats => {
    clearImageBackendConnectionFailure(backend);
    const keys = buildBackendStatKeys(target, backend);
    if (!keys.length) return readImageBackendConnectionStats();
    const now = Date.now();
    const stats = { ...readImageBackendConnectionStats() };
    keys.forEach((key) => {
        const previous = stats[key] || { successCount: 0, lastConnectedAt: 0 };
        stats[key] = {
            successCount: previous.successCount + 1,
            lastConnectedAt: now
        };
    });
    writeImageBackendConnectionStats(stats);
    return stats;
};

export const sortDiscoveredImageBackendsByPreference = (
    items: 发现图片后端记录结构[],
    target: ImageBackendConnectionTarget,
    stats: ImageBackendConnectionStats = readImageBackendConnectionStats()
): 发现图片后端记录结构[] => {
    return [...items].sort((a, b) => {
        const unavailableA = isImageBackendRecentlyUnavailable(a) ? 1 : 0;
        const unavailableB = isImageBackendRecentlyUnavailable(b) ? 1 : 0;
        if (unavailableA !== unavailableB) {
            return unavailableA - unavailableB;
        }
        const matchedA = a.connectTokenMatched === true ? 1 : 0;
        const matchedB = b.connectTokenMatched === true ? 1 : 0;
        if (matchedA !== matchedB) {
            return matchedB - matchedA;
        }
        const statsA = pickBestStatsEntry(stats, target, a);
        const statsB = pickBestStatsEntry(stats, target, b);
        if (statsA.successCount !== statsB.successCount) {
            return statsB.successCount - statsA.successCount;
        }
        if (statsA.lastConnectedAt !== statsB.lastConnectedAt) {
            return statsB.lastConnectedAt - statsA.lastConnectedAt;
        }
        const timeA = Date.parse(a.lastHeartbeatAt || a.detectedAt || '') || 0;
        const timeB = Date.parse(b.lastHeartbeatAt || b.detectedAt || '') || 0;
        return timeB - timeA;
    });
};

export const pickPreferredDiscoveredImageBackend = (
    items: 发现图片后端记录结构[],
    target: ImageBackendConnectionTarget,
    current?: { id?: string; url?: string },
    stats: ImageBackendConnectionStats = readImageBackendConnectionStats()
): 发现图片后端记录结构 | null => {
    const sorted = sortDiscoveredImageBackendsByPreference(items, target, stats);
    if (!sorted.length) return null;

    const currentId = (current?.id || '').trim();
    const currentUrl = normalizeDiscoveredBackendUrl(current?.url);
    const currentItemById = currentId
        ? sorted.find((item) => item.id === currentId) || null
        : null;
    const currentItemByUrl = currentUrl
        ? sorted.find((item) => normalizeDiscoveredBackendUrl(item.url) === currentUrl) || null
        : null;
    const currentItem = currentItemById || currentItemByUrl;
    const best = sorted[0];

    if (!currentItem) return best;
    if (currentItemById && normalizeDiscoveredBackendUrl(currentItemById.url) !== currentUrl) {
        return currentItemById;
    }
    if (!currentUrl) return currentItem;

    const currentStats = pickBestStatsEntry(stats, target, currentItem);
    const bestStats = pickBestStatsEntry(stats, target, best);
    return bestStats.successCount > currentStats.successCount ? best : null;
};

const buildRegistryUrl = (customUrl?: string): string => {
    const normalized = normalizeUrl(customUrl || '');
    if (normalized) {
        return normalized.includes('/api/image-backend/cnb-sync')
            ? normalized
            : `${normalized}/api/image-backend/cnb-sync`;
    }
    const origin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://127.0.0.1:4173';
    return `${origin.replace(/\/+$/, '')}/api/image-backend/cnb-sync`;
};

export const fetchDiscoveredImageBackends = async (
    customUrl?: string,
    backendType = 'comfyui',
    connectToken?: string
): Promise<发现图片后端记录结构[]> => {
    const url = new URL(buildRegistryUrl(customUrl), typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid');
    url.searchParams.set('backendType', backendType);
    const normalizedConnectToken = (connectToken || '').trim();
    if (normalizedConnectToken) {
        url.searchParams.set('connectToken', normalizedConnectToken);
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`图片后端注册表请求失败: ${response.status}${detail ? ` - ${detail.slice(0, 160)}` : ''}`);
    }

    const payload = await response.json().catch(() => null) as 后端注册表响应 | null;
    const items = Array.isArray(payload?.items) ? payload!.items : [];
    return items
        .filter((item) => item && typeof item.url === 'string')
        .sort((a, b) => {
            const timeA = Date.parse(a.lastHeartbeatAt || a.detectedAt || '') || 0;
            const timeB = Date.parse(b.lastHeartbeatAt || b.detectedAt || '') || 0;
            return timeB - timeA;
        });
};

export const buildDiscoveredBackendLabel = (item: 发现图片后端记录结构): string => {
    const title = item.label?.trim() || item.customerId?.trim() || item.workspace?.trim() || item.url;
    const suffix = item.port ? `:${item.port}` : '';
    return `${title}${suffix}`;
};
