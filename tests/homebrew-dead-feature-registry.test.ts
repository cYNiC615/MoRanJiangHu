import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { 核心_剧情推动 } from '../prompts/core/story';
import { 核心_思维链 } from '../prompts/core/cot';
import { 核心_核心规则 } from '../prompts/core/rules';
import { 核心_数据格式 } from '../prompts/core/data';
import { 核心_思维链_女主规划版, 核心_思维链_NTL女主规划版 } from '../prompts/core/cotHeroine';
import { 获取开局思维链提示词 } from '../prompts/core/cotOpening';
import { 构建同人运行时提示词包, 同人运行时模式已启用 } from '../prompts/runtime/fandom';
import { 构建世界观同人融合提示词 } from '../prompts/runtime/openingConfig';
import {
    构建统一规划分析系统提示词,
    构建统一规划分析用户提示词,
    构建规划性别比例约束摘要
} from '../prompts/runtime/planningAnalysis';
import { 剧情规划变量结构提示词 } from '../prompts/runtime/storyPlanSchema';
import {
    开局规划初始化附加提示词,
    构建开局规划初始化审计重点,
    构建开局规划初始化正文上下文
} from '../prompts/runtime/openingPlanningInit';
import {
    开局世界演变初始化附加提示词,
    构建开局世界演变初始化上下文
} from '../prompts/runtime/openingWorldEvolutionInit';
import { 构建世界演变系统提示词, 构建世界演变用户提示词 } from '../prompts/runtime/worldEvolution';
import { 构建世界演变COT提示词 } from '../prompts/runtime/worldEvolutionCot';
import { 构建变量模型系统提示词 } from '../prompts/runtime/variableModel';
import { 构建变量生成提示词 } from '../prompts/runtime/variableGeneration';
import { 数值_世界演化 } from '../prompts/stats/world';
import { 数值_其他设定 } from '../prompts/stats/others';
import { 构建系统提示词 } from '../hooks/useGame/systemPromptBuilder';
import { 构建女性姓名黑名单提示词 } from '../utils/femaleNameSelector';
import { 按功能开关过滤提示词内容 } from '../utils/promptFeatureToggles';
import { 规范化内置提示词列表, 创建默认内置提示词列表 } from '../utils/builtinPrompts';
import { 创建内置预设世界书, 规范化世界书列表 } from '../utils/worldbook';
import PromptManager from '../components/features/Settings/PromptManager';
import { 默认提示词 } from '../prompts';

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

    it('removes active novel decomposition injection from AI request paths', () => {
        const activeWorkflowFiles = [
            'hooks/useGame/sendWorkflow.ts',
            'hooks/useGame/mainStoryRequest.ts',
            'hooks/useGame/contextSnapshot.ts',
            'hooks/useGame/planningUpdateWorkflow.ts',
            'hooks/useGame/worldEvolutionWorkflow.ts',
            'hooks/useGame/openingStoryWorkflow.ts',
            'hooks/useGame/runtimeVariableWorkflow.ts',
            'hooks/useGame/historyTurnWorkflow.ts'
        ];

        for (const relativePath of activeWorkflowFiles) {
            const content = readProjectFile(relativePath);
            expect(content, relativePath).not.toContain('获取激活小说拆分注入文本');
            expect(content, relativePath).not.toContain('获取开局小说拆分注入文本');
            expect(content, relativePath).not.toContain('同步剧情小说分解时间校准');
            expect(content, relativePath).not.toContain('novelDecompositionPrompt');
            expect(content, relativePath).not.toContain('小说分解注入');
            expect(content, relativePath).not.toContain('小说拆分注入');
            expect(content, relativePath).not.toContain('overrideStoryAppendPrompt');
        }
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
        expect(projectFileExists('components/features/Music/mobile')).toBe(false);
        expect(projectFileExists('components/features/Music')).toBe(false);
        expect(projectFileExists('components/features/Settings/MusicSettings.tsx')).toBe(false);
        expect(projectFileExists('data/defaultMusicTracks.ts')).toBe(false);
        expect(projectFileExists('utils/musicMetadata.ts')).toBe(false);
        expect(projectFileExists('utils/turnNotificationSound.ts')).toBe(false);
        expect(projectFileExists('public/sounds/turn-notify.mp3')).toBe(false);
        expect(projectFileExists('public/sounds')).toBe(false);
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
        expect(app).not.toContain('services/auctionHouse');
        expect(app).not.toContain('AuctionHouseModal');
        expect(app).not.toContain('showAuctionHouse');
        expect(app).not.toContain('auctionHouseState');
        expect(app).not.toContain('auctionHouseScope');
        expect(app).not.toContain("case 'auction_house'");
        expect(app).not.toContain('openAuctionHouse');
        expect(app).not.toContain('onOpenAuctionHouse');
        expect(app).not.toContain('auctionHouseLabel');
        expect(app).not.toContain('moranjianghu:auction-house-loaded');
        expect(app).not.toContain('从势力互动投放拍卖品');
        expect(app).not.toContain('拍卖行桥接');
        expect(app).not.toContain('世界.拍卖行待投放物品');
        expect(app).not.toContain("sourceLocation: '拍卖行'");
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

        const saveCoordinator = readProjectFile('hooks/useGame/saveCoordinator.ts');
        expect(saveCoordinator).not.toContain('services/auctionHouse');
        expect(saveCoordinator).not.toContain('moranjianghu:auction-house-loaded');
        expect(saveCoordinator).not.toContain('拍卖行:');

        const worldEvolution = readProjectFile('hooks/useGame/worldEvolutionUtils.ts');
        expect(worldEvolution).not.toContain('世界.拍卖行待投放物品');

        const stateHelpers = readProjectFile('utils/stateHelpers.ts');
        expect(stateHelpers).not.toContain('拍卖行待投放物品');

        const worldPrompt = readProjectFile('prompts/stats/world.ts');
        expect(worldPrompt).not.toContain('世界.拍卖行待投放物品');
        expect(worldPrompt).not.toContain('拍卖行物品');

        expect(readProjectFile('prompts/runtime/worldEvolution.ts')).not.toContain('世界.拍卖行待投放物品');
        expect(readProjectFile('prompts/runtime/worldEvolutionCot.ts')).not.toContain('世界.拍卖行待投放物品');
        expect(readProjectFile('prompts/runtime/worldDataSchema.ts')).not.toContain('世界.拍卖行待投放物品');
        expect(readProjectFile('prompts/runtime/openingWorldEvolutionInit.ts')).not.toContain('拍卖行待投放物品');
        expect(readProjectFile('prompts/runtime/openingConfig.ts')).not.toContain('auctionName');
        expect(readProjectFile('prompts/runtime/worldSetup.ts')).not.toContain('auctionName');
        expect(readProjectFile('prompts/runtime/worldGeneration.ts')).not.toContain('auctionName');
        expect(readProjectFile('prompts/runtime/variableCalibrationReference.ts')).not.toContain('拍卖行');
        expect(readProjectFile('prompts/core/data.ts')).not.toContain('拍卖');
        expect(readProjectFile('components/features/Settings/ImageGenerationSettings.tsx')).not.toContain('拍卖行里没有图标');

        const worldModal = readProjectFile('components/features/World/WorldModal.tsx');
        expect(worldModal).not.toContain('拍卖行待投放物品');
        expect(worldModal).not.toContain('拍卖风声');
    });

    it('records auction house backend and storage residue after active paths are gone', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('auction_house');
        expect(registry).toContain('entrypoint_removed');
        expect(registry).toContain('automatic_side_effect_removed');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('storage_pending');
        expect(registry).toContain('services/auctionHouse.ts');
        expect(registry).toContain('models/world.ts');
        expect(registry).toContain('hooks/useGame/storyState.ts');
        expect(registry).toContain('__tests__/auctionHouse.test.ts');
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

    it('disables active fandom prompt injection even when legacy config enables it', () => {
        const legacyFandomOpeningConfig = {
            题材模式: '现代都市',
            同人融合: {
                enabled: true,
                作品名: '旧原著',
                来源类型: '小说',
                融合强度: '显性同台',
                保留原著角色: true,
                启用附加小说: true
            }
        } as any;

        const bundle = 构建同人运行时提示词包({
            openingConfig: legacyFandomOpeningConfig,
            worldPrompt: '旧世界观',
            realmPrompt: '【境界映射母板】\n1 => 自定义一阶'
        });

        expect(bundle.enabled).toBe(false);
        expect(bundle.同人设定摘要).toBe('');
        expect(bundle.世界观创建补丁).toBe('');
        expect(bundle.开局任务补丁).toBe('');
        expect(bundle.开局COT补丁).toBe('');
        expect(bundle.主剧情COT补丁).toBe('');
        expect(bundle.剧情规划补丁).toBe('');
        expect(bundle.女主规划补丁).toBe('');
        expect(bundle.女主思考补丁).toBe('');
        expect(bundle.世界演变补丁).toBe('');
        expect(bundle.变量校准补丁).toBe('');
        expect(同人运行时模式已启用(legacyFandomOpeningConfig)).toBe(false);
        expect(构建世界观同人融合提示词(legacyFandomOpeningConfig)).toBe('');
        expect(构建女性姓名黑名单提示词()).not.toMatch(/同人|原著|小说拆分|分解组/);
    });

    it('prevents legacy fandom config from activating active runtime branches', () => {
        const activeRuntimeFiles = [
            'App.tsx',
            'hooks/useGame.ts',
            'hooks/useGame/promptRuntime.ts',
            'hooks/useGame/systemPromptBuilder.ts',
            'hooks/useGame/variableModelWorkflow.ts',
            'hooks/useGame/openingStoryWorkflow.ts'
        ];

        for (const relativePath of activeRuntimeFiles) {
            const content = readProjectFile(relativePath);
            expect(content, relativePath).not.toContain('同人融合?.enabled === true');
            expect(content, relativePath).not.toContain('同人融合?.enabled');
        }

        expect(readProjectFile('prompts/runtime/fandom.ts')).toContain('HOMEBREW_FANDOM_RUNTIME_DISABLED = true');
        expect(readProjectFile('prompts/runtime/fandom.ts')).toContain('同人运行时模式已启用');
    });

    it('removes retired fandom and novel-decomposition labels from always-on prompts', () => {
        const promptSurfaces = [
            ['core_story', 核心_剧情推动.内容],
            ['core_cot', 核心_思维链.内容],
            ['core_heroine_cot', 核心_思维链_女主规划版.内容],
            ['core_heroine_ntl_cot', 核心_思维链_NTL女主规划版.内容],
            ['cot_opening', 获取开局思维链提示词({})],
            ['story_plan_schema', 剧情规划变量结构提示词],
            ['opening_planning_init_append', 开局规划初始化附加提示词],
            ['opening_planning_init_context', 构建开局规划初始化正文上下文({
                openingBodyText: '开局正文',
                openingPlanText: '开局规划',
                currentGameTime: '0001:01:01:08:00'
            })],
            ['opening_planning_init_audit', 构建开局规划初始化审计重点({
                fandomEnabled: false,
                heroineEnabled: true
            })],
            ['opening_world_evolution_init_append', 开局世界演变初始化附加提示词],
            ['opening_world_evolution_init_context', 构建开局世界演变初始化上下文({
                openingBodyText: '开局正文',
                openingPlanText: '开局规划',
                openingCommandTexts: [],
                currentGameTime: '0001:01:01:08:00'
            })],
            ['planning_system', 构建统一规划分析系统提示词({ heroineEnabled: true })],
            ['planning_user', 构建统一规划分析用户提示词({
                currentStoryJson: '{}',
                currentHeroinePlanJson: '{}',
                worldJson: '{}',
                socialJson: '[]',
                envJson: '{}',
                recentBodiesText: '无',
                currentPlanText: '',
                auditFocusText: '常规回合固定审计',
                heroineEnabled: true
            })],
            ['gender_ratio_constraint', 构建规划性别比例约束摘要('1:1')],
            ['world_evolution_system', 构建世界演变系统提示词({ fandom: false })],
            ['world_evolution_user', 构建世界演变用户提示词('世界上下文', { fandom: false })],
            ['world_evolution_cot', 构建世界演变COT提示词({ fandom: false })],
            ['world_stat_prompt', 数值_世界演化.内容]
        ] as const;

        const retiredPhrases = [
            '同人模式',
            '同人设定',
            '同人开局',
            '同人剧情规划',
            '同人女主剧情规划',
            '小说分解',
            '小说拆分',
            '小说分解滑窗',
            '小说分解后的章节滑窗',
            '原著章节锚点',
            '原著角色信息',
            '原著硬约束',
            '原著',
            '分解组',
            '本组概括',
            '原著章节标题',
            '原著推进状态',
            '原著换章条件',
            '原著切换说明'
        ];

        for (const [name, content] of promptSurfaces) {
            for (const phrase of retiredPhrases) {
                expect(content, `${name}: ${phrase}`).not.toContain(phrase);
            }
        }
    });

    it('removes retired writable roots from active prompt and schema surfaces', () => {
        const filterPrompt = (content: string) => 按功能开关过滤提示词内容(content, { 启用修炼体系: false });
        const promptSurfaces = [
            ['core_rules', 核心_核心规则.内容],
            ['core_data', filterPrompt(核心_数据格式.内容)],
            ['cot_opening', 获取开局思维链提示词({ 启用修炼体系: false })],
            ['stat_other', filterPrompt(数值_其他设定.内容)],
            ['variable_generation', 构建变量生成提示词()],
            ['variable_model', 构建变量模型系统提示词({
                survivalNeedsEnabled: true,
                cultivationSystemEnabled: false
            })]
        ] as const;

        const retiredRootPatterns = [
            /`?战斗(?:\.|\/|`|\b)/u,
            /`?玩家门派(?:\.|\/|`|\b)/u,
            /同人剧情规划/u,
            /同人女主剧情规划/u,
            /功法列表/u,
            /境界层级/u,
            /修炼体系/u,
            /灵根/u,
            /宗门/u
        ];

        for (const [name, content] of promptSurfaces) {
            for (const pattern of retiredRootPatterns) {
                expect(content, `${name}: ${pattern}`).not.toMatch(pattern);
            }
        }
    });

    it('does not serialize retired roots or fandom decomposition fields into active system context', () => {
        const result = 构建系统提示词({
            promptPool: [],
            memoryData: {
                长期记忆: [],
                中期记忆: [],
                短期记忆: [],
                即时记忆: []
            } as any,
            socialData: [],
            statePayload: {
                开局配置: {
                    题材模式: '现代都市',
                    启用女主剧情规划: true,
                    同人融合: {
                        enabled: true,
                        作品名: '旧原著'
                    }
                },
                角色: {
                    姓名: '测试主角',
                    境界: '旧境界',
                    境界层级: 9,
                    根骨: 99,
                    悟性: 99,
                    福源: 99,
                    所属门派ID: 'sect-old',
                    门派职位: '旧职位',
                    门派贡献: 100,
                    当前内力: 100,
                    最大内力: 100,
                    功法列表: [{ 名称: '旧功法' }]
                },
                环境: {
                    时间: '0001:01:01:08:00',
                    大地点: '现代都市'
                },
                战斗: {
                    是否战斗中: true,
                    敌方: [{ 名字: '旧敌人' }]
                },
                玩家门派: {
                    名称: '旧门派'
                },
                剧情: {
                    当前章节: {
                        标题: '当前章节',
                        当前分解组: 7,
                        原著章节标题: '旧原著章节',
                        原著推进状态: '已完成',
                        原著换章条件: ['旧换章条件'],
                        原著切换说明: ['旧切换说明']
                    },
                    历史卷宗: [{
                        标题: '旧完成章节',
                        所属分解组: 7,
                        分歧线变化: ['旧分歧线变化']
                    }]
                },
                剧情规划: {
                    当前章目标: ['现代目标']
                },
                女主剧情规划: {
                    阶段推进: [{
                        阶段名: '关系推进',
                        阶段目标: ['现代关系目标']
                    }]
                },
                世界: {
                    待执行事件: [{
                        事件名: '现代事件',
                        关联分解组: [7],
                        关联分歧线: ['旧分歧线']
                    }],
                    江湖史册: [{
                        标题: '历史记录',
                        关联分歧线: ['旧分歧线']
                    }]
                },
                任务列表: [],
                约定列表: []
            },
            gameConfig: {
                启用修炼体系: false,
                启用女主剧情规划: true
            } as any,
            memoryConfig: {} as any,
            builtinPromptEntries: [],
            worldbooks: [],
            worldEvolutionEnabled: false,
            options: {
                openingConfig: {
                    题材模式: '现代都市',
                    启用女主剧情规划: true,
                    同人融合: {
                        enabled: true,
                        作品名: '旧原著'
                    }
                } as any
            }
        });

        const activeContext = [
            result.systemPrompt,
            result.contextPieces.剧情安排,
            result.contextPieces.世界状态,
            result.contextPieces.角色状态
        ].join('\n\n');

        expect(activeContext).not.toContain('【战斗】');
        expect(activeContext).not.toContain('【玩家门派】');
        expect(activeContext).not.toContain('旧敌人');
        expect(activeContext).not.toContain('旧门派');
        expect(activeContext).not.toContain('当前分解组');
        expect(activeContext).not.toContain('原著章节标题');
        expect(activeContext).not.toContain('原著推进状态');
        expect(activeContext).not.toContain('原著换章条件');
        expect(activeContext).not.toContain('原著切换说明');
        expect(activeContext).not.toContain('所属分解组');
        expect(activeContext).not.toContain('关联分解组');
        expect(activeContext).not.toContain('关联分歧线');
        expect(activeContext).not.toContain('分歧线变化');
        expect(activeContext).not.toContain('境界层级');
        expect(activeContext).not.toContain('旧功法');
        expect(activeContext).not.toContain('旧境界');
        expect(activeContext).not.toContain('sect-old');
        expect(activeContext).not.toContain('旧职位');
        expect(activeContext).toContain('现代目标');
        expect(activeContext).toContain('现代关系目标');
        expect(activeContext).toContain('现代事件');
        expect(activeContext).toContain('世界记录');
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
        expect(gameSettings).not.toContain("{ value: '修炼'");

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

    it('removes retired cultivation style from visible builtin prompt slots', () => {
        const gameSettings = readProjectFile('utils/gameSettings.ts');
        expect(gameSettings).not.toContain("value === '修炼'");

        const builtinBook = 创建内置预设世界书();
        const builtinWorldbookEntries = builtinBook.条目 || [];
        expect(builtinWorldbookEntries.map((entry) => entry.标题)).not.toContain('叙事风格 · 修炼');
        expect(builtinWorldbookEntries.map((entry) => entry.内置槽位 || entry.id)).not.toContain('builtin_slot_style_cultivation');

        const builtinPromptEntries = 创建默认内置提示词列表();
        expect(builtinPromptEntries.map((entry) => entry.标题)).not.toContain('叙事风格 · 修炼');
        expect(builtinPromptEntries.map((entry) => entry.槽位ID)).not.toContain('builtin_slot_style_cultivation');

        const normalizedWorldbooks = 规范化世界书列表([{
            id: 'legacy_builtin_override',
            标题: '旧内置覆盖',
            条目: [{
                id: 'builtin_slot_style_cultivation',
                标题: '叙事风格 · 修炼',
                内容: '修炼风格',
                内置: true,
                内置槽位: 'builtin_slot_style_cultivation',
                内置分类: '常驻'
            }]
        }]);
        expect(normalizedWorldbooks.flatMap((book) => book.条目).map((entry) => entry.内置槽位 || entry.id))
            .not.toContain('builtin_slot_style_cultivation');

        const normalizedBuiltinPrompts = 规范化内置提示词列表([{
            id: 'builtin_slot_style_cultivation',
            槽位ID: 'builtin_slot_style_cultivation',
            标题: '叙事风格 · 修炼',
            分类: '常驻',
            内容: '修炼风格',
            启用: true
        }]);
        expect(normalizedBuiltinPrompts.map((entry) => entry.槽位ID)).not.toContain('builtin_slot_style_cultivation');
    });

    it('hides retired cultivation prompt-manager entries and avoids runtime-injection wording', () => {
        const runtimePromptStates = Object.fromEntries(默认提示词.map((prompt) => [
            prompt.id,
            {
                当前启用: prompt.id === 'core_world',
                原始启用: prompt.启用,
                受运行时接管: prompt.id === 'core_world',
                运行时注入: prompt.id === 'core_world'
            }
        ]));
        const rendered = renderToStaticMarkup(React.createElement(PromptManager, {
            prompts: 默认提示词,
            onUpdate: () => undefined,
            runtimePromptStates
        }));

        expect(rendered).not.toContain('境界体系设定');
        expect(rendered).not.toContain('功法体系');
        expect(rendered).not.toContain('累计境界修炼体系');
        expect(rendered).not.toContain('运行时接管');
        expect(rendered).not.toContain('运行时注入');
        expect(rendered).toContain('上下文状态: 已启用');
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

        const settingsPersistence = readProjectFile('hooks/useGame/config/settingsPersistenceWorkflow.ts');
        expect(settingsPersistence).not.toContain('写入APK自动更新禁用镜像');
        expect(settingsPersistence).not.toContain('appUpdatePreferences');
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
