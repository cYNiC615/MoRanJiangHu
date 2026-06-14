import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (relativePath: string) => {
    const absolutePath = resolve(process.cwd(), relativePath);
    return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const projectFileExists = (relativePath: string) => existsSync(resolve(process.cwd(), relativePath));

describe('homebrew dead feature registry', () => {
    it('removes player-visible novel decomposition entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('NovelDecompositionWorkbenchModal');
        expect(app).not.toContain('小说拆分后台调度服务');
        expect(app).not.toContain('openNovelDecompositionWorkbench');
        expect(app).not.toContain('onNovelDecomposition');
        expect(app).not.toContain('onOpenNovelDecomposition');
        expect(app).not.toContain('enableNovelDecomposition');

        expect(readProjectFile('components/layout/LandingPage.tsx')).not.toContain('onNovelDecomposition');
        expect(readProjectFile('components/features/Workshop/CreativeWorkshopModal.tsx')).not.toContain('onNovelDecomposition');
        expect(readProjectFile('components/features/Workshop/CreativeWorkshopModal.tsx')).not.toContain('小说分解模块');
        expect(readProjectFile('components/layout/RightPanel.tsx')).not.toContain('onOpenNovelDecomposition');
        expect(readProjectFile('components/layout/MobileQuickMenu.tsx')).not.toContain('novel_decomposition');
        expect(readProjectFile('components/features/Settings/SettingsModal.tsx')).not.toContain('novel_decomposition');
        expect(readProjectFile('components/features/Settings/mobile/MobileSettingsModal.tsx')).not.toContain('novel_decomposition');
    });

    it('records the remaining novel decomposition backend as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('novel_decomposition');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/novelDecompositionPipeline.ts');
        expect(registry).toContain('prompts/runtime/novelDecomposition.ts');
        expect(registry).toContain('functions/api/workshop/novel-decomposition.ts');
    });

    it('removes music playback entrypoints and runtime files', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('MusicProvider');
        expect(app).not.toContain('MobileMusicPlayer');
        expect(app).not.toContain('showMobileMusic');
        expect(app).not.toContain("case 'music'");
        expect(app).not.toContain("case '音乐'");

        expect(readProjectFile('components/layout/RightPanel.tsx')).not.toContain('MusicPlayerUI');
        expect(readProjectFile('components/layout/RightPanel.tsx')).not.toContain('useMusic');
        expect(readProjectFile('components/layout/MobileQuickMenu.tsx')).not.toContain('useMusic');
        expect(readProjectFile('components/layout/MobileQuickMenu.tsx')).not.toContain("| 'music'");
        expect(readProjectFile('components/features/Settings/SettingsModal.tsx')).not.toContain("'music'");
        expect(readProjectFile('components/features/Settings/mobile/MobileSettingsModal.tsx')).not.toContain("'music'");
        expect(readProjectFile('hooks/useGameState.ts')).not.toContain("'music'");
        expect(readProjectFile('utils/settingsSchema.ts')).not.toContain('music_tracks');
        expect(readProjectFile('models/system.ts')).not.toContain('MusicTrack');
        expect(readProjectFile('models/system.ts')).not.toContain('启用背景音乐');

        expect(projectFileExists('components/features/Music/MusicProvider.tsx')).toBe(false);
        expect(projectFileExists('components/features/Music/MusicPlayerUI.tsx')).toBe(false);
        expect(projectFileExists('components/features/Music/mobile/MobileMusicPlayer.tsx')).toBe(false);
        expect(projectFileExists('components/features/Settings/MusicSettings.tsx')).toBe(false);
        expect(projectFileExists('data/defaultMusicTracks.ts')).toBe(false);
        expect(projectFileExists('utils/musicMetadata.ts')).toBe(false);
    });

    it('records music playback as removed except for storage migration history', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('music_playback');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_removed');
        expect(registry).toContain('storage_pending');
        expect(registry).toContain('music_tracks');
    });

    it('removes auction house player-visible entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('AuctionHouseModal');
        expect(app).not.toContain('showAuctionHouse');
        expect(app).not.toContain("case 'auction_house'");
        expect(app).not.toContain('openAuctionHouse');
        expect(app).not.toContain('onOpenAuctionHouse');
        expect(app).not.toContain('auctionHouseLabel');
        expect(app).not.toContain('onSellItem={handleSellBagItemToAuction}');
        expect(app).not.toContain('onSellAllMisc={handleSellAllMiscItems}');
        expect(app).not.toContain('已送入拍卖行');
        expect(app).not.toContain('杂物已寄售');

        const rightPanel = readProjectFile('components/layout/RightPanel.tsx');
        expect(rightPanel).not.toContain('onOpenAuctionHouse');
        expect(rightPanel).not.toContain('auctionHouseLabel');

        const mobileMenu = readProjectFile('components/layout/MobileQuickMenu.tsx');
        expect(mobileMenu).not.toContain("| 'auction_house'");
        expect(mobileMenu).not.toContain('auction_house');
        expect(mobileMenu).not.toContain('auctionHouseLabel');

        const inventory = readProjectFile('components/features/Inventory/InventoryModal.tsx');
        expect(inventory).not.toContain('onSellItem');
        expect(inventory).not.toContain('onSellAllMisc');
        expect(inventory).not.toContain('拍卖行');
        expect(inventory).not.toContain('寄售');

        const mobileInventory = readProjectFile('components/features/Inventory/MobileInventoryModal.tsx');
        expect(mobileInventory).not.toContain('onSellItem');
        expect(mobileInventory).not.toContain('onSellAllMisc');
        expect(mobileInventory).not.toContain('拍卖行');
        expect(mobileInventory).not.toContain('寄售');
    });

    it('records auction house backend and prompts as pending removal after entrypoints are gone', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('auction_house');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/auctionHouse.ts');
        expect(registry).toContain('models/world.ts');
        expect(registry).toContain('prompts/runtime/worldDataSchema.ts');
    });
});
