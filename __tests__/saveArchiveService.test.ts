import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/dbService', () => ({
    导出存档数据: vi.fn(async () => ({ saves: [] })),
    读取图片资源: vi.fn(async (ref: string) => (
        String(ref).includes('player-avatar-local') ? 'data:image/png;base64,LOCAL_AVATAR' : ''
    )),
    保存图片资源: vi.fn(async () => 'wuxia-asset://saved-local')
}));

describe('saveArchiveService local image export', () => {
    it('keeps local wuxia asset refs when exporting without embedded images', async () => {
        const dbService = await import('../services/dbService');
        const { 导出ZIP存档文件 } = await import('../services/saveArchiveService');

        const blob = await 导出ZIP存档文件({
            includeImages: false,
            saves: [
                {
                    id: 1,
                    类型: 'manual',
                    时间戳: 1779000000000,
                    角色数据: {
                        姓名: '杨培强',
                        头像图片URL: 'wuxia-asset://player-avatar-local',
                        图片档案: {
                            已选头像图片ID: 'avatar-1',
                            生图历史: [
                                {
                                    id: 'avatar-1',
                                    构图: '头像',
                                    状态: 'success',
                                    本地路径: 'wuxia-asset://player-avatar-local'
                                }
                            ]
                        }
                    },
                    环境信息: { 具体地点: '武馆' },
                    历史记录: []
                } as any
            ]
        });

        const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
        const manifest = JSON.parse(strFromU8(entries['manifest.json']));
        const gameDataPath = manifest.saves[0].游戏数据文件;
        const gameData = JSON.parse(strFromU8(entries[gameDataPath]));
        const serialized = JSON.stringify(gameData);

        expect(dbService.读取图片资源).not.toHaveBeenCalled();
        expect(dbService.保存图片资源).not.toHaveBeenCalled();
        expect(serialized).toContain('wuxia-asset://player-avatar-local');
        expect(serialized).not.toContain('LOCAL_AVATAR');
        expect(manifest.saves[0].图片文件数).toBe(0);
    });
});
