import { describe, expect, it } from 'vitest';
import { 获取内置提示词槽位内容 } from '../utils/builtinPrompts';

const 创建地图提示词条目 = (enabled: boolean) => ({
    id: 'map-system-override',
    槽位ID: 'builtin_map_regenerate_system_prompt',
    标题: '地图重建系统提示词',
    分类: '地图生成' as const,
    内容: '自定义地图重建提示',
    启用: enabled,
    创建时间: 1,
    更新时间: 2
});

describe('builtin prompt slots', () => {
    it('uses enabled entries and falls back when disabled', () => {
        expect(获取内置提示词槽位内容({
            entries: [创建地图提示词条目(true)],
            slotId: 'builtin_map_regenerate_system_prompt',
            fallback: '默认地图提示'
        })).toBe('自定义地图重建提示');

        expect(获取内置提示词槽位内容({
            entries: [创建地图提示词条目(false)],
            slotId: 'builtin_map_regenerate_system_prompt',
            fallback: '默认地图提示'
        })).toBe('默认地图提示');
    });
});
