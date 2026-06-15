import type {
    OpeningConfig,
    WorldGenConfig,
    初始伙伴配置结构,
    题材模式类型
} from '../models/system';
import {
    默认创意工坊主题配置,
    type 创意工坊属性字段定义,
    type 创意工坊引擎步骤定义,
    type 创意工坊主题配置,
    type 创意工坊选项定义
} from '../data/workshopThemes/defaultWorkshopTheme';
export {
    合并题材世界默认值,
    获取题材模式配置,
    获取题材模式选项,
    规范化题材模式,
    题材是否仙侠,
    题材是否现代,
    题材模式配置表,
    题材模式顺序
} from '../data/workshopThemes/topicModeThemeData';
export type {
    题材模式配置,
    题材模式分组
} from '../data/workshopThemes/topicModeThemeData';
import { 构建官方模式运行时配置 } from './modeRuntimeProfile';

const 深拷贝 = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 必备步骤: 创意工坊引擎步骤定义['id'][] = ['world', 'backgrounds', 'character', 'companion', 'opening', 'confirm'];

const 规范化步骤列表 = (steps: unknown): 创意工坊引擎步骤定义[] => {
    const source = Array.isArray(steps) ? steps : [];
    const normalized = source
        .map((item: any) => ({
            id: item?.id,
            label: typeof item?.label === 'string' ? item.label.trim() : '',
            description: typeof item?.description === 'string' ? item.description.trim() : '',
            required: item?.required === true
        }))
        .filter((item): item is 创意工坊引擎步骤定义 => (
            必备步骤.includes(item.id) && Boolean(item.label)
        ));
    const seen = new Set<string>();
    const deduped = normalized.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
    const missing = 必备步骤.filter((id) => !seen.has(id));
    if (missing.length <= 0) return deduped;
    const fallbackMap = new Map(默认创意工坊主题配置.creationFlow.map((item) => [item.id, item]));
    return [
        ...deduped,
        ...missing.map((id) => 深拷贝(fallbackMap.get(id)!))
    ];
};

const 规范化属性字段 = (fields: unknown): 创意工坊属性字段定义[] => {
    const fallback = 默认创意工坊主题配置.attributeFields;
    const source = Array.isArray(fields) ? fields : [];
    const allowed = new Set(fallback.map((item) => item.key));
    const byKey = new Map<string, 创意工坊属性字段定义>();
    source.forEach((item: any) => {
        if (!allowed.has(item?.key)) return;
        const fallbackItem = fallback.find((field) => field.key === item.key)!;
        const min = Number.isFinite(Number(item.min)) ? Math.floor(Number(item.min)) : fallbackItem.min;
        const max = Number.isFinite(Number(item.max)) ? Math.floor(Number(item.max)) : fallbackItem.max;
        const defaultValue = Number.isFinite(Number(item.defaultValue)) ? Math.floor(Number(item.defaultValue)) : fallbackItem.defaultValue;
        byKey.set(item.key, {
            key: item.key,
            label: typeof item.label === 'string' && item.label.trim() ? item.label.trim() : fallbackItem.label,
            min: Math.min(min, max),
            max: Math.max(min, max),
            defaultValue: Math.max(Math.min(defaultValue, Math.max(min, max)), Math.min(min, max))
        });
    });
    return fallback.map((field) => byKey.get(field.key) || 深拷贝(field));
};

const 规范化选项列表 = <T extends string>(
    options: unknown,
    fallback: Array<创意工坊选项定义<T>>
): Array<创意工坊选项定义<T>> => {
    const source = Array.isArray(options) ? options : [];
    const fallbackValues = new Set(fallback.map((item) => item.value));
    const normalized = source
        .map((item: any) => ({
            value: item?.value,
            label: typeof item?.label === 'string' ? item.label.trim() : '',
            hint: typeof item?.hint === 'string' ? item.hint.trim() : ''
        }))
        .filter((item): item is 创意工坊选项定义<T> => fallbackValues.has(item.value) && Boolean(item.label));
    return normalized.length > 0 ? normalized : 深拷贝(fallback);
};

export const 解析创意工坊主题配置 = (raw?: Partial<创意工坊主题配置> | null): 创意工坊主题配置 => {
    const source = raw && typeof raw === 'object' ? raw : 默认创意工坊主题配置;
    const fallback = 默认创意工坊主题配置;
    const defaultMode = source.defaultMode || fallback.defaultMode;
    const modeRuntimeProfile = 构建官方模式运行时配置(defaultMode);
    const worldDefaults: WorldGenConfig = {
        ...fallback.worldDefaults,
        ...(source.worldDefaults || {}),
        modeRuntimeProfile: source.worldDefaults?.modeRuntimeProfile || modeRuntimeProfile
    };
    const companionDefaults: 初始伙伴配置结构 = {
        ...fallback.companionDefaults,
        ...(source.companionDefaults || {}),
        属性: {
            ...fallback.companionDefaults.属性,
            ...(source.companionDefaults?.属性 || {})
        },
        天赋列表: Array.isArray(source.companionDefaults?.天赋列表) ? source.companionDefaults!.天赋列表 : []
    };
    return {
        ...fallback,
        ...source,
        schema: 'moranjianghu-workshop-theme',
        formatVersion: Number.isFinite(Number(source.formatVersion)) ? Number(source.formatVersion) : fallback.formatVersion,
        id: typeof source.id === 'string' && source.id.trim() ? source.id.trim() : fallback.id,
        title: typeof source.title === 'string' && source.title.trim() ? source.title.trim() : fallback.title,
        description: typeof source.description === 'string' && source.description.trim() ? source.description.trim() : fallback.description,
        defaultMode,
        creationFlow: 规范化步骤列表(source.creationFlow),
        worldDefaults,
        characterDefaults: {
            ...fallback.characterDefaults,
            ...(source.characterDefaults || {})
        },
        companionDefaults,
        openingDefaults: {
            ...fallback.openingDefaults,
            ...(source.openingDefaults || {}),
            题材模式: source.openingDefaults?.题材模式 || defaultMode,
            modeRuntimeProfile: source.openingDefaults?.modeRuntimeProfile || modeRuntimeProfile,
            初始伙伴: companionDefaults
        },
        attributeFields: 规范化属性字段(source.attributeFields),
        difficultyOptions: 规范化选项列表(source.difficultyOptions, fallback.difficultyOptions),
        worldSizeOptions: 规范化选项列表(source.worldSizeOptions, fallback.worldSizeOptions),
        editablePools: {
            ...fallback.editablePools,
            ...(source.editablePools || {})
        }
    };
};

export const 获取默认创意工坊主题 = (): 创意工坊主题配置 => 解析创意工坊主题配置(默认创意工坊主题配置);

export const 获取创意工坊新开局步骤列表 = (theme?: Partial<创意工坊主题配置> | null): 创意工坊引擎步骤定义[] => (
    解析创意工坊主题配置(theme).creationFlow
);

export const 获取创意工坊属性字段 = (theme?: Partial<创意工坊主题配置> | null): 创意工坊属性字段定义[] => (
    解析创意工坊主题配置(theme).attributeFields
);

export const 创建主题默认属性分配 = (theme?: Partial<创意工坊主题配置> | null): 初始伙伴配置结构['属性'] => (
    获取创意工坊属性字段(theme).reduce((acc, field) => ({
        ...acc,
        [field.key]: field.defaultValue
    }), {}) as 初始伙伴配置结构['属性']
);

export const 创建主题默认世界配置 = (
    mode?: 题材模式类型,
    theme?: Partial<创意工坊主题配置> | null
): WorldGenConfig => {
    const resolved = 解析创意工坊主题配置(theme);
    const baseMode = mode || resolved.defaultMode;
    return {
        ...深拷贝(resolved.worldDefaults),
        modeRuntimeProfile: resolved.worldDefaults.modeRuntimeProfile || 构建官方模式运行时配置(baseMode)
    };
};

export const 获取创意工坊角色默认值 = (theme?: Partial<创意工坊主题配置> | null) => (
    深拷贝(解析创意工坊主题配置(theme).characterDefaults)
);

export const 创建主题默认初始伙伴配置 = (
    theme?: Partial<创意工坊主题配置> | null
): 初始伙伴配置结构 => ({
    ...深拷贝(解析创意工坊主题配置(theme).companionDefaults),
    属性: 创建主题默认属性分配(theme)
});

export const 创建主题默认开局配置 = (
    mode?: 题材模式类型,
    theme?: Partial<创意工坊主题配置> | null
): OpeningConfig => {
    const resolved = 解析创意工坊主题配置(theme);
    const baseMode = mode || resolved.defaultMode;
    const modeRuntimeProfile = 构建官方模式运行时配置(baseMode);
    return {
        ...深拷贝(resolved.openingDefaults),
        题材模式: baseMode,
        modeRuntimeProfile,
        初始伙伴: 创建主题默认初始伙伴配置(resolved)
    };
};

export const 获取创意工坊难度选项 = (theme?: Partial<创意工坊主题配置> | null) => (
    解析创意工坊主题配置(theme).difficultyOptions
);

export const 获取创意工坊世界规模选项 = (theme?: Partial<创意工坊主题配置> | null) => (
    解析创意工坊主题配置(theme).worldSizeOptions
);
