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
        expect(readProjectFile('models/system.ts')).not.toContain('启用回合提示音');
        expect(readProjectFile('utils/gameSettings.ts')).not.toContain('启用回合提示音');
        expect(readProjectFile('hooks/useGame.ts')).not.toContain('turnNotificationSound');
        expect(readProjectFile('hooks/useGame.ts')).not.toContain('启用回合提示音');
        expect(readProjectFile('components/features/Settings/GameSettings.tsx')).not.toContain('回合提示音');

        expect(projectFileExists('components/features/Music/MusicProvider.tsx')).toBe(false);
        expect(projectFileExists('components/features/Music/MusicPlayerUI.tsx')).toBe(false);
        expect(projectFileExists('components/features/Music/mobile/MobileMusicPlayer.tsx')).toBe(false);
        expect(projectFileExists('components/features/Settings/MusicSettings.tsx')).toBe(false);
        expect(projectFileExists('data/defaultMusicTracks.ts')).toBe(false);
        expect(projectFileExists('utils/musicMetadata.ts')).toBe(false);
        expect(projectFileExists('utils/turnNotificationSound.ts')).toBe(false);
        expect(projectFileExists('public/sounds/turn-notify.mp3')).toBe(false);
    });

    it('records music playback as removed except for storage migration history', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('music_playback');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_removed');
        expect(registry).toContain('storage_pending');
        expect(registry).toContain('music_tracks');
        expect(registry).toContain('turnNotificationSound.ts');
        expect(registry).toContain('turn-notify.mp3');
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

    it('removes cloud play and cloud sync player-visible entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('CloudPlayModal');
        expect(app).not.toContain('showCloudPlay');
        expect(app).not.toContain("case 'cloud_play'");
        expect(app).not.toContain('openCloudPlay');
        expect(app).not.toContain('onCloudPlay');
        expect(app).not.toContain('读取云端游玩存储模式');

        const landing = readProjectFile('components/layout/LandingPage.tsx');
        expect(landing).not.toContain('GitHubSyncButton');
        expect(landing).not.toContain('onCloudPlay');
        expect(landing).not.toContain('onRequireWorkshopLogin');
        expect(landing).not.toContain('读取云端游玩会话');
        expect(landing).not.toContain('云端游玩');

        const mobileMenu = readProjectFile('components/layout/MobileQuickMenu.tsx');
        expect(mobileMenu).not.toContain("| 'cloud_play'");
        expect(mobileMenu).not.toContain('cloud_play');
        expect(mobileMenu).not.toContain("label: '云端'");

        const saveLoad = readProjectFile('components/features/SaveLoad/SaveLoadModal.tsx');
        expect(saveLoad).not.toContain('读取云端游玩会话');
        expect(saveLoad).not.toContain('读取云端游玩存储模式');
        expect(saveLoad).not.toContain('设置云端游玩存储模式');
        expect(saveLoad).not.toContain('上传本地存档到云端');
        expect(saveLoad).not.toContain('objectStorageSync');
        expect(saveLoad).not.toContain('handleConvertLocalToCloudPlay');
        expect(saveLoad).not.toContain('cloudPlayMode');
        expect(saveLoad).not.toContain('云端游玩');
        expect(saveLoad).not.toContain('转云端');
        expect(saveLoad).not.toContain('对象存储');
    });

    it('records cloud play and sync backend as pending removal after entrypoints are gone', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('cloud_play_and_sync');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/cloudPlayService.ts');
        expect(registry).toContain('services/githubSync.ts');
        expect(registry).toContain('services/objectStorageSync.ts');
        expect(registry).toContain('services/webdavSync.ts');
        expect(registry).toContain('functions/api/cloud-play.ts');
        expect(registry).toContain('utils/settingsSchema.ts');
    });

    it('removes online presence and public ranking player-visible entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('startOnlinePresenceHeartbeat');
        expect(app).not.toContain('services/onlinePresence');

        const landing = readProjectFile('components/layout/LandingPage.tsx');
        expect(landing).not.toContain('fetchOnlinePresencePublicStats');
        expect(landing).not.toContain('在线时长榜');
        expect(landing).not.toContain('online-ranking.html');
        expect(landing).not.toContain('presenceStats');
        expect(landing).not.toContain('presenceHistory');
    });

    it('records online presence backend and public pages as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('online_presence_public_ops');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/onlinePresence.ts');
        expect(registry).toContain('public/online-ranking.html');
        expect(registry).toContain('tests/online-ranking-session-regression.test.ts');
    });

    it('removes festival settings, top-bar display, and automatic festival side effects', () => {
        expect(projectFileExists('data/world.ts')).toBe(false);
        expect(projectFileExists('components/features/Settings/WorldSettings.tsx')).toBe(false);

        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('festivals={');
        expect(app).not.toContain('onUpdateFestivals');
        expect(app).not.toContain('state.festivals');
        expect(app).not.toContain('actions.updateFestivals');

        const topBar = readProjectFile('components/layout/TopBar.tsx');
        expect(topBar).not.toContain('节日');
        expect(topBar).not.toContain('festival');
        expect(topBar).not.toContain('festivals');

        const settings = readProjectFile('components/features/Settings/SettingsModal.tsx');
        expect(settings).not.toContain('WorldSettings');
        expect(settings).not.toContain('onUpdateFestivals');
        expect(settings).not.toContain('festivals');

        const mobileSettings = readProjectFile('components/features/Settings/mobile/MobileSettingsModal.tsx');
        expect(mobileSettings).not.toContain('WorldSettings');
        expect(mobileSettings).not.toContain('onUpdateFestivals');
        expect(mobileSettings).not.toContain('festivals');

        const useGame = readProjectFile('hooks/useGame.ts');
        expect(useGame).not.toContain('设置节日列表');
        expect(useGame).not.toContain('updateFestivals');
        expect(useGame).not.toContain('festivals');
        expect(useGame).not.toContain('自动同步“名称/简介/效果”到环境');

        const useGameState = readProjectFile('hooks/useGameState.ts');
        expect(useGameState).not.toContain('节日列表');
        expect(useGameState).not.toContain('设置键.节日配置');
        expect(useGameState).not.toContain('festivals');

        const settingsWorkflow = readProjectFile('hooks/useGame/config/settingsPersistenceWorkflow.ts');
        expect(settingsWorkflow).not.toContain('设置节日列表');
        expect(settingsWorkflow).not.toContain('updateFestivals');
        expect(settingsWorkflow).not.toContain('节日结构');

        const settingsSchema = readProjectFile('utils/settingsSchema.ts');
        expect(settingsSchema).not.toContain("节日配置: 'festivals'");
        expect(settingsSchema).not.toContain('节日配置');
    });

    it('records festival model, prompt, and storage residue as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('festival_system');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('models/environment.ts');
        expect(registry).toContain('prompts/core/data.ts');
        expect(registry).toContain('hooks/useGame/systemPromptBuilder.ts');
        expect(registry).toContain('settings key: `festivals`');
    });
});
