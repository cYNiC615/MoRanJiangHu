const readEnvString = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

export const getSyncApiBaseUrl = (): string => {
    const raw = readEnvString((import.meta as any).env?.VITE_SYNC_API_BASE_URL);
    return raw.replace(/\/+$/, '');
};

export const buildSyncApiUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = getSyncApiBaseUrl();
    return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};

export const isNativeCapacitorEnvironment = (): boolean => false;

export const requiresRemoteSyncApi = (): boolean => false;

export const isMissingNativeSyncApiBaseUrl = (): boolean => false;

export const setNativeSystemBarsHidden = async (_hidden: boolean): Promise<void> => {};

export const 构建同步API地址 = buildSyncApiUrl;
export const 是否原生Capacitor环境 = isNativeCapacitorEnvironment;
export const 当前环境需要远程同步API = requiresRemoteSyncApi;
export const 设置原生系统栏隐藏 = setNativeSystemBarsHidden;
