export const LOCAL_APP_VERSION_NAME = 'homebrew';
export const LOCAL_APP_VERSION_CODE = 0;

export const 获取本地站点基址 = (): string => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '');
    }
    return '';
};
