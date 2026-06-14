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
        expect(app).not.toContain('services/cloudPlayService');
        expect(app).not.toContain('等待云端后台同步完成');
        expect(app).not.toContain('确保本地存档已同步到云端');
        expect(app).not.toContain('确保最新本地存档已同步到云端');
        expect(app).not.toContain('尝试返回首页云端同步');
        expect(app).not.toContain('云端同步将在后台继续重试');
        expect(app).not.toContain('正在保存当前进度并同步存档');

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

        const saveCoordinator = readProjectFile('hooks/useGame/saveCoordinator.ts');
        expect(saveCoordinator).not.toContain('后台同步存档到云端');
        expect(saveCoordinator).not.toContain('services/cloudPlayService');
    });

    it('records cloud play and sync backend as pending removal after entrypoints are gone', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('cloud_play_and_sync');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('automatic_side_effect_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/cloudPlayService.ts');
        expect(registry).toContain('services/githubSync.ts');
        expect(registry).toContain('services/objectStorageSync.ts');
        expect(registry).toContain('services/webdavSync.ts');
        expect(registry).toContain('functions/api/cloud-play.ts');
        expect(registry).toContain('utils/settingsSchema.ts');
    });

    it('removes creative-workshop community publishing entrypoints', () => {
        const workshop = readProjectFile('components/features/Workshop/CreativeWorkshopModal.tsx');
        expect(workshop).not.toContain('读取云端游玩会话');
        expect(workshop).not.toContain('onRequireLogin');
        expect(workshop).not.toContain('cloudUsername');
        expect(workshop).not.toContain('发布创意工坊模块');
        expect(workshop).not.toContain('编辑创意工坊模块');
        expect(workshop).not.toContain('删除创意工坊模块');
        expect(workshop).not.toContain("source === 'cloud'");
        expect(workshop).not.toContain("'cloud'");
        expect(workshop).not.toContain('社区贡献');
        expect(workshop).not.toContain('发布到社区');
        expect(workshop).not.toContain('贡献社区');
        expect(workshop).not.toContain('编辑投稿');
        expect(workshop).not.toContain('保存编辑');
        expect(workshop).not.toContain('删除投稿');
        expect(workshop).not.toContain('反馈问题');
        expect(workshop).not.toContain('提交反馈');
        expect(workshop).not.toContain('reportTarget');

        const imageSettings = readProjectFile('components/features/Settings/ImageGenerationSettings.tsx');
        expect(imageSettings).not.toContain('发布创意工坊模块');
        expect(imageSettings).not.toContain('已发布到创意工坊');
        expect(imageSettings).not.toContain('发布到社区失败');
        expect(imageSettings).not.toContain('其他玩家');
    });

    it('records creative-workshop community backend as pending removal after entrypoints are gone', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('creative_workshop_cloud_ugc');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('components/features/Workshop/CreativeWorkshopModal.tsx');
        expect(registry).toContain('components/features/Settings/ImageGenerationSettings.tsx');
        expect(registry).toContain('services/creativeWorkshop.ts');
        expect(registry).toContain('functions/api/workshop/modules.ts');
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

        expect(projectFileExists('public/online-ranking.html')).toBe(false);
        expect(projectFileExists('public/admin/online.html')).toBe(false);
    });

    it('records online presence backend and public pages as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('online_presence_public_ops');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('static_pages_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/onlinePresence.ts');
        expect(registry).toContain('functions/api/admin/online');
        expect(registry).toContain('public/online-ranking.html');
        expect(registry).toContain('public/admin/online.html');
        expect(registry).toContain('tests/online-ranking-session-regression.test.ts');
        expect(registry).toContain('tests/e2e-admin-online.spec.mjs');
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

    it('removes structured weather and festival AI context entrypoints', () => {
        const topBar = readProjectFile('components/layout/TopBar.tsx');
        expect(topBar).not.toContain("'weather'");
        expect(topBar).not.toContain('weatherDisplay');
        expect(topBar).not.toContain('当前天气');
        expect(topBar).not.toContain('预计结束');
        expect(topBar).not.toContain('label="天气"');
        expect(topBar).not.toContain("label: '天气'");

        const systemPromptBuilder = readProjectFile('hooks/useGame/systemPromptBuilder.ts');
        expect(systemPromptBuilder).not.toContain('天气原始');
        expect(systemPromptBuilder).not.toContain('天气结束日期');
        expect(systemPromptBuilder).not.toContain('节日原始');
        expect(systemPromptBuilder).not.toContain('取文本(天气原始?.天气)');
        expect(systemPromptBuilder).not.toContain('取文本(节日原始?.名称)');

        const stateHelpers = readProjectFile('utils/stateHelpers.ts');
        expect(stateHelpers).not.toContain("'天气', '环境变量'");
        expect(stateHelpers).not.toContain("'节日', '时间'");

        const worldEvolutionUtils = readProjectFile('hooks/useGame/worldEvolutionUtils.ts');
        expect(worldEvolutionUtils).not.toContain('环境.天气');

        expect(readProjectFile('prompts/core/data.ts')).not.toContain('├─ 天气');
        expect(readProjectFile('prompts/core/data.ts')).not.toContain('├─ 节日');
        expect(readProjectFile('prompts/core/cotOpening.ts')).not.toContain('规划天气');
        expect(readProjectFile('prompts/core/cotOpening.ts')).not.toContain('环境变量、节日');
        expect(readProjectFile('prompts/runtime/opening.ts')).not.toContain('节日/天气');
        expect(readProjectFile('prompts/runtime/opening.ts')).not.toContain('`天气` 使用对象结构');
        expect(readProjectFile('prompts/runtime/openingVariableGenerationInit.ts')).not.toContain('天气、节日');
        expect(readProjectFile('prompts/runtime/worldEvolution.ts')).not.toContain('环境.天气');
        expect(readProjectFile('prompts/runtime/worldEvolution.ts')).not.toContain('天气整体变化');
        expect(readProjectFile('prompts/runtime/worldEvolutionCot.ts')).not.toContain('环境.天气');
        expect(readProjectFile('prompts/runtime/variableCot.ts')).not.toContain('天气、环境变量');
        expect(readProjectFile('prompts/stats/recovery.ts')).not.toContain('环境.天气');
        expect(readProjectFile('prompts/stats/others.ts')).not.toContain('环境.天气');
        expect(readProjectFile('prompts/difficulty/physiology.ts')).not.toContain('环境天气');
    });

    it('records weather game system as downgraded to prose atmosphere only', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('weather_game_system');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('automatic_side_effect_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('prose_atmosphere_only');
        expect(registry).toContain('models/environment.ts');
        expect(registry).toContain('hooks/useGame/stateTransforms.ts');
    });

    it('removes new-game fandom and novel-injection player-visible entrypoints', () => {
        const desktopWizard = readProjectFile('components/features/NewGame/NewGameWizard.tsx');
        const mobileWizard = readProjectFile('components/features/NewGame/mobile/MobileNewGameWizard.tsx');

        for (const wizard of [desktopWizard, mobileWizard]) {
            expect(wizard).not.toContain('Fandom Blend');
            expect(wizard).not.toContain('启用同人融合');
            expect(wizard).not.toContain('启用附加小说分解');
            expect(wizard).not.toContain('启用同人角色替换');
            expect(wizard).not.toContain('<p>同人融合:');
            expect(wizard).not.toContain('<p>角色替换:');
            expect(wizard).not.toContain('<p>附加小说:');
            expect(wizard).not.toContain('小说分解数据集');
            expect(wizard).not.toContain('读取小说拆分数据集列表');
            expect(wizard).not.toContain('novelDecompositionStore');
        }
    });

    it('records new-game fandom backend and prompts as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('new_game_fandom_entrypoints');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('components/features/NewGame/NewGameWizard.tsx');
        expect(registry).toContain('components/features/NewGame/mobile/MobileNewGameWizard.tsx');
        expect(registry).toContain('models/fandomPlanning');
        expect(registry).toContain('prompts/runtime/fandom*.ts');
        expect(registry).toContain('data/creativeWorkshopModules.ts');
    });

    it('removes legacy battle player-visible entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('BattleModal');
        expect(app).not.toContain('MobileBattleModal');
        expect(app).not.toContain('showBattle');
        expect(app).not.toContain("case 'battle'");
        expect(app).not.toContain("case '战斗'");
        expect(app).not.toContain('openBattle');
        expect(app).not.toContain('onOpenBattle');
        expect(app).not.toContain('latestBattleContextText');
        expect(app).not.toContain('battle={state.战斗}');

        const rightPanel = readProjectFile('components/layout/RightPanel.tsx');
        expect(rightPanel).not.toContain('onOpenBattle');
        expect(rightPanel).not.toContain('menuLabel?.battle');
        expect(rightPanel).not.toContain("changeKeys: ['战斗']");

        const mobileMenu = readProjectFile('components/layout/MobileQuickMenu.tsx');
        expect(mobileMenu).not.toContain("| 'battle'");
        expect(mobileMenu).not.toContain("id: 'battle'");
        expect(mobileMenu).not.toContain("case 'battle'");
    });

    it('records legacy battle backend and replacement direction as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('legacy_battle_system');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('components/features/Battle');
        expect(registry).toContain('models/battle.ts');
        expect(registry).toContain('prompts/runtime');
        expect(registry).toContain('lightweight opposition system');
    });

    it('removes wuxia cultivation, kungfu, skills, and sect player-visible entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('KungfuModal');
        expect(app).not.toContain('MobileKungfuModal');
        expect(app).not.toContain('SkillsPanel');
        expect(app).not.toContain('MobileSkillsPanel');
        expect(app).not.toContain('SectModal');
        expect(app).not.toContain('MobileSect');
        expect(app).not.toContain('showKungfu');
        expect(app).not.toContain('showSkills');
        expect(app).not.toContain('showSect');
        expect(app).not.toContain('openKungfu');
        expect(app).not.toContain('openSkills');
        expect(app).not.toContain('openSect');
        expect(app).not.toContain('onOpenKungfu');
        expect(app).not.toContain('onOpenSect');
        expect(app).not.toContain('handleLearnSectBook');
        expect(app).not.toContain('handleSectExchange');
        expect(app).not.toContain('handleRecruitNpcToSect');
        expect(app).not.toContain('cultivationSystemEnabled={启用修炼体系}');

        const rightPanel = readProjectFile('components/layout/RightPanel.tsx');
        expect(rightPanel).not.toContain('onOpenKungfu');
        expect(rightPanel).not.toContain('onOpenSect');
        expect(rightPanel).not.toContain('enableKungfu');
        expect(rightPanel).not.toContain('kungfuLabel');
        expect(rightPanel).not.toContain("changeKeys: ['功法']");
        expect(rightPanel).not.toContain("changeKeys: ['玩家门派']");

        const mobileMenu = readProjectFile('components/layout/MobileQuickMenu.tsx');
        expect(mobileMenu).not.toContain("| 'kungfu'");
        expect(mobileMenu).not.toContain("| 'skills'");
        expect(mobileMenu).not.toContain("| 'sect'");
        expect(mobileMenu).not.toContain("id: 'kungfu'");
        expect(mobileMenu).not.toContain("id: 'skills'");
        expect(mobileMenu).not.toContain("id: 'sect'");
        expect(mobileMenu).not.toContain("case 'kungfu'");
        expect(mobileMenu).not.toContain("case 'skills'");
        expect(mobileMenu).not.toContain("case 'sect'");

        const gameSettings = readProjectFile('components/features/Settings/GameSettings.tsx');
        expect(gameSettings).not.toContain('修炼体系相关内容');
        expect(gameSettings).not.toContain('启用修炼体系');

        const desktopWizard = readProjectFile('components/features/NewGame/NewGameWizard.tsx');
        const mobileWizard = readProjectFile('components/features/NewGame/mobile/MobileNewGameWizard.tsx');
        for (const wizard of [desktopWizard, mobileWizard]) {
            expect(wizard).not.toContain('开局生成门派');
            expect(wizard).not.toContain('境界体系提示词');
            expect(wizard).not.toContain('manualRealmPrompt');
        }

        const diyTools = readProjectFile('components/features/NewGame/NewGameDiyTools.tsx');
        expect(diyTools).not.toContain('境界体系');
        expect(diyTools).not.toContain('启用修炼体系');
        expect(diyTools).not.toContain('generateFandomRealmData');
    });

    it('records wuxia cultivation backend and prompt residue as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('wuxia_cultivation_system');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('components/features/Kungfu');
        expect(registry).toContain('components/features/Sect');
        expect(registry).toContain('components/features/Skills');
        expect(registry).toContain('models/kungfu.ts');
        expect(registry).toContain('models/sect.ts');
        expect(registry).toContain('prompts/stats/kungfu.ts');
        expect(registry).toContain('prompts/core/realm.ts');
    });

    it('removes APK/app-update player-visible entrypoints and automatic effects', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('services/appUpdate');
        expect(app).not.toContain('checkForAppUpdate');
        expect(app).not.toContain('downloadLatestApkPackage');
        expect(app).not.toContain('subscribeAppUpdateProgress');
        expect(app).not.toContain('AppUpdateProgressState');
        expect(app).not.toContain('APK仅手动更新已启用');
        expect(app).not.toContain('runAppUpdateCheck');
        expect(app).not.toContain('appUpdateProgress');
        expect(app).not.toContain('应用更新');
        expect(app).not.toContain('ReleaseNotesModal');
        expect(app).not.toContain('RELEASE_NOTES_SUPPRESS_DATE_KEY');

        const landing = readProjectFile('components/layout/LandingPage.tsx');
        expect(landing).not.toContain('checkForAppUpdate');
        expect(landing).not.toContain('downloadLatestApkPackage');
        expect(landing).not.toContain('handleCheckUpdate');
        expect(landing).not.toContain('handleDownloadApk');
        expect(landing).not.toContain('检查 APK 更新');
        expect(landing).not.toContain('APK 下载');
        expect(landing).not.toContain('下载 APK');
        expect(landing).not.toContain('APK CODE');
        expect(landing).not.toContain('Web / APK');
        expect(landing).not.toContain('APK {RELEASE_INFO.versionCode}');

        const gameSettings = readProjectFile('components/features/Settings/GameSettings.tsx');
        expect(gameSettings).not.toContain('仅手动更新 APK');
        expect(gameSettings).not.toContain('禁用APK自动更新');

        const useGameState = readProjectFile('hooks/useGameState.ts');
        expect(useGameState).not.toContain('写入APK自动更新禁用镜像');
        expect(useGameState).not.toContain('appUpdatePreferences');
    });

    it('records APK/app-update backend, release, and storage residue as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('apk_app_update_system');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('storage_pending');
        expect(registry).toContain('services/appUpdate.ts');
        expect(registry).toContain('services/nativeApkUpdater.ts');
        expect(registry).toContain('utils/appUpdatePreferences.ts');
        expect(registry).toContain('components/ui/ReleaseNotesModal.tsx');
        expect(registry).toContain('functions/api/apk');
        expect(registry).toContain('android');
        expect(registry).toContain('capacitor.config.ts');
        expect(registry).toContain('moranjianghu.apkAutoUpdateDisabled');
    });

    it('removes mobile frontend shell entrypoints and app mounts', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('MobileQuickMenu');
        expect(app).not.toContain('MobileNewGameWizard');
        expect(app).not.toContain('MobileSettingsModal');
        expect(app).not.toContain('MobileInventoryModal');
        expect(app).not.toContain('MobileCharacter');
        expect(app).not.toContain('MobileSocial');
        expect(app).not.toContain('MobileImageManagerModal');
        expect(app).not.toContain('MobileTeamModal');
        expect(app).not.toContain('MobileWorldModal');
        expect(app).not.toContain('MobileMapModal');
        expect(app).not.toContain('MobileTask');
        expect(app).not.toContain('MobileAgreementModal');
        expect(app).not.toContain('MobileStory');
        expect(app).not.toContain('MobileHeroinePlanModal');
        expect(app).not.toContain('MobileMemory');
        expect(app).not.toContain('MemorySummaryFlowMobileModal');
        expect(app).not.toContain('NpcMemorySummaryFlowMobileModal');
        expect(app).not.toContain('移动端轻量预热目标');
        expect(app).not.toContain('handleMobileMenuAction');
    });

    it('records mobile frontend residue as pending deeper deletion', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('mobile_frontend');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('components/layout/MobileQuickMenu.tsx');
        expect(registry).toContain('components/features/NewGame/mobile/MobileNewGameWizard.tsx');
        expect(registry).toContain('components/features/Settings/mobile/MobileSettingsModal.tsx');
    });
});
