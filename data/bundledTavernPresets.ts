import type { 酒馆预设结构 } from '../models/system';
import { 规范化酒馆预设 } from '../utils/tavernPreset';

export type 内置酒馆预设条目 = {
    id: string;
    名称: string;
    path: string;
};

export const 内置酒馆预设列表: 内置酒馆预设条目[] = [
    {
        id: 'builtin_izumi_0503',
        名称: 'Izumi 0503',
        path: '/tavern-presets/izumi-0503.json'
    },
    {
        id: 'builtin_izumi_0623',
        名称: 'Izumi 0623',
        path: '/tavern-presets/izumi-0623.json'
    }
];

export const 加载内置酒馆预设 = async (entry: 内置酒馆预设条目): Promise<酒馆预设结构> => {
    const response = await fetch(entry.path, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`${entry.名称} 读取失败（HTTP ${response.status}）。`);
    }
    const payload = await response.json();
    const normalized = 规范化酒馆预设(payload);
    if (!normalized) {
        throw new Error(`${entry.名称} 不是可用的酒馆预设。`);
    }
    return normalized;
};
