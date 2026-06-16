import type { 游戏物品, 物品生图结果 } from '../models/item';
import { 获取图片展示地址, 是否远程图片地址 } from './imageAssets';
import { 获取预置物品图片URL } from '../data/presetItemImages';

const 读取物品生图历史 = (item?: 游戏物品 | null): 物品生图结果[] => {
    if (!Array.isArray(item?.图片档案?.生图历史)) return [];
    return item!.图片档案!.生图历史 as 物品生图结果[];
};

const 获取物品预置图地址 = (item?: 游戏物品 | null): string => {
    if (!item) return '';
    const candidateNames = [
        (item as any)?.规范物品名称,
        (item as any)?.预设物品名称,
        (item as any)?.标准物品名称,
        (item as any)?.基础物品名称,
        (item as any)?.图片匹配名称,
        (item as any)?.名称
    ].map((value) => typeof value === 'string' ? value.trim() : '').filter(Boolean);
    for (const name of candidateNames) {
        const url = 获取预置物品图片URL(
            name,
            (item as any)?.类型 || '',
            (item as any)?.品质 || ''
        );
        if (url) return url;
    }
    return '';
};

const 规范化物品图标复用字段 = (value: unknown): string => (
    typeof value === 'string' ? value.trim().replace(/[\s\u3000]+/g, '') : ''
);

export const 获取物品图标复用Key = (item?: 游戏物品 | null): string => {
    if (!item || typeof item !== 'object') return 'unknown';
    const name = [
        (item as any).规范物品名称,
        (item as any).预设物品名称,
        (item as any).标准物品名称,
        (item as any).基础物品名称,
        (item as any).图片匹配名称,
        (item as any).名称
    ].map(规范化物品图标复用字段).find(Boolean) || '';
    const type = 规范化物品图标复用字段((item as any).类型);
    const quality = 规范化物品图标复用字段((item as any).品质);
    const visualDescription = 规范化物品图标复用字段((item as any).生图描述);
    const visualTags = Array.isArray((item as any).视觉标签)
        ? (item as any).视觉标签.map(规范化物品图标复用字段).filter(Boolean).sort().join(',')
        : 规范化物品图标复用字段((item as any).视觉标签);
    const visualKey = [name, type, quality, visualDescription, visualTags].filter(Boolean).join('|');
    if (visualKey) return visualKey;
    return 规范化物品图标复用字段((item as any).ID) || 'unknown';
};

const 物品远程图片字段 = [
    '图片URL',
    '图标URL',
    '图片地址',
    '图标地址',
    '远程图片URL',
    '远程图标URL',
    '封面URL',
    '图标',
    '图片'
];

export const 获取物品远程图片地址 = (item?: 游戏物品 | null): string => {
    if (!item || typeof item !== 'object') return '';
    for (const key of 物品远程图片字段) {
        const value = (item as any)[key];
        if (typeof value === 'string' && 是否远程图片地址(value)) {
            return value.trim();
        }
    }
    return '';
};

const 获取物品远程图片记录 = (item?: 游戏物品 | null): 物品生图结果 | null => {
    const remoteUrl = 获取物品远程图片地址(item);
    if (!remoteUrl) return null;
    return {
        id: `hosted_${remoteUrl}`,
        图片URL: remoteUrl,
        生图词组: '',
        原始描述: '',
        使用模型: 'hosted',
        生成时间: 0,
        构图: '物品图标',
        状态: 'success',
        来源: 'hosted'
    };
};

export const 获取物品已选图标记录 = (item?: 游戏物品 | null): 物品生图结果 | null => {
    if (!item) return null;

    const history = 读取物品生图历史(item);
    const selectedIconId = typeof item.图片档案?.已选图标图片ID === 'string'
        ? item.图片档案.已选图标图片ID.trim()
        : '';

    const selectedRecord = selectedIconId
        ? history.find((entry) => entry?.id === selectedIconId)
            || (item.图片档案?.最近生图结果?.id === selectedIconId ? item.图片档案.最近生图结果 || null : null)
        : null;

    if (selectedRecord?.状态 === 'success' && 获取图片展示地址(selectedRecord)) {
        return selectedRecord;
    }

    const firstIconRecord = history.find((entry) => entry?.构图 === '物品图标' && entry?.状态 === 'success' && 获取图片展示地址(entry));
    if (firstIconRecord) return firstIconRecord;

    const recentRecord = item.图片档案?.最近生图结果;
    if (recentRecord?.状态 === 'success' && 获取图片展示地址(recentRecord)) {
        return recentRecord;
    }

    const hostedRecord = 获取物品远程图片记录(item);
    if (hostedRecord) return hostedRecord;

    return history.find((entry) => entry?.状态 === 'success' && 获取图片展示地址(entry)) || null;
};

export const 获取物品已选图标地址 = (item?: 游戏物品 | null): string => {
    const record = 获取物品已选图标记录(item);
    const fromRecord = 获取图片展示地址(record);
    if (fromRecord) return fromRecord;

    const presetUrl = 获取物品预置图地址(item);
    if (presetUrl) return presetUrl;

    return '';
};

export const 物品已有可用图标 = (item?: 游戏物品 | null): boolean => Boolean(获取物品已选图标地址(item));

export const 合并物品图片档案 = (item: 游戏物品, result: 物品生图结果) => {
    const archive = item.图片档案 && typeof item.图片档案 === 'object' ? item.图片档案 : {};
    const history = Array.isArray(archive.生图历史) ? archive.生图历史 : [];
    const normalized: 物品生图结果 = {
        ...result,
        id: result.id || `item_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    const mergedHistory = [normalized, ...history.filter((entry) => entry?.id !== normalized.id)].slice(0, 12);
    return {
        ...archive,
        最近生图结果: normalized,
        生图历史: mergedHistory,
        已选图标图片ID: normalized.构图 === '物品图标'
            ? normalized.id
            : archive.已选图标图片ID || normalized.id,
    };
};
