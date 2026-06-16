import { describe, expect, it } from 'vitest';
import { 提取图片资源引用列表 } from '../hooks/useImageAssetPrefetch';
import {
    创建图片资源引用,
    获取图片资源文本地址,
    注册图片资源缓存,
    图片资源记录含可恢复地址
} from '../utils/imageAssets';

describe('imageAssets', () => {
    it('treats local or direct remote image records as recoverable', () => {
        expect(图片资源记录含可恢复地址({ 本地路径: 'wuxia-asset://npc-avatar-1' })).toBe(true);
        expect(图片资源记录含可恢复地址({ 图片URL: 'https://image.bacon159.pp.ua/api/v1/file/abc' })).toBe(true);
        expect(图片资源记录含可恢复地址({ 本地路径: '' })).toBe(false);
    });

    it('prefetches only local app image refs', () => {
        const ref = 创建图片资源引用('npc-avatar-local');
        expect(提取图片资源引用列表({ 图片URL: 'https://example.test/avatar.png', 本地路径: ref })).toEqual([ref]);
    });

    it('uses warm local cache for app image refs', () => {
        const ref = 创建图片资源引用('player-avatar-local');
        const dataUrl = 'data:image/png;base64,LOCAL_AVATAR';
        注册图片资源缓存('player-avatar-local', dataUrl);

        expect(获取图片资源文本地址(ref)).toBe(dataUrl);
    });
});
