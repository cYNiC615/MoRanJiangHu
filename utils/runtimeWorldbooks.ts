import type { OpeningConfig, OpeningRuntimeSnapshot, 世界书结构 } from '../types';
import { 构建题材模式世界书 } from '../data/creativeWorkshopModules';
import { 规范化题材模式 } from './topicModeProfiles';

const 世界书列表 = (value: unknown): 世界书结构[] => (
    Array.isArray(value)
        ? value.filter((item): item is 世界书结构 => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
        : []
);

const 有显式工坊选择 = (selection?: OpeningRuntimeSnapshot['workshopSelection']): boolean => (
    Boolean(selection?.selectedMode)
    || Object.keys(selection?.selectedModules || {}).length > 0
);

const 去重世界书 = (...groups: Array<世界书结构[] | undefined>): 世界书结构[] => {
    const result: 世界书结构[] = [];
    const seen = new Set<string>();
    groups.flatMap((group) => group || []).forEach((book) => {
        const key = book.id || book.标题;
        if (!key || seen.has(key)) return;
        seen.add(key);
        result.push(book);
    });
    return result;
};

export const 应补默认现代模式世界书 = (openingConfig?: Partial<OpeningConfig> | null): boolean => {
    if (!openingConfig) return true;
    const mode = 规范化题材模式(openingConfig.题材模式);
    if (mode !== '现代都市') return false;
    const snapshot = openingConfig.runtimeSnapshot;
    if (世界书列表(snapshot?.modeWorldbooks).length > 0) return false;
    if (有显式工坊选择(snapshot?.workshopSelection)) return false;
    return true;
};

export const 构建默认现代模式世界书 = (openingConfig?: Partial<OpeningConfig> | null): 世界书结构[] => (
    应补默认现代模式世界书(openingConfig)
        ? 构建题材模式世界书('现代都市', openingConfig?.modeRuntimeProfile)
        : []
);

export const 补全开局运行时世界书快照 = <T extends Partial<OpeningConfig> | undefined>(openingConfig: T): T => {
    if (!openingConfig || !应补默认现代模式世界书(openingConfig)) return openingConfig;
    return {
        ...openingConfig,
        runtimeSnapshot: {
            ...(openingConfig.runtimeSnapshot || {}),
            modeWorldbooks: 构建默认现代模式世界书(openingConfig)
        }
    } as T;
};

export const 构建运行时世界书解析结果 = (params: {
    openingConfig?: Partial<OpeningConfig> | null;
    userWorldbooks?: 世界书结构[];
}) => {
    const openingConfig = 补全开局运行时世界书快照(params.openingConfig || undefined);
    const userWorldbooks = 世界书列表(params.userWorldbooks);
    const modeWorldbooks = 世界书列表(openingConfig?.runtimeSnapshot?.modeWorldbooks);
    return {
        openingConfig,
        userWorldbooks,
        modeWorldbooks,
        books: 去重世界书(userWorldbooks, modeWorldbooks)
    };
};
