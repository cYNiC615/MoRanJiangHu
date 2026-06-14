# Homebrew Dead Feature Registry

This registry tracks features that are intentionally retired during the
homebrew simplification pass. It exists so an entrypoint-only removal does not
hide backend code, stored data, prompts, or tests that still need a later pass.

## Status Vocabulary

- `entrypoint_removed`: User-facing route/menu/modal access has been removed.
- `entrypoint_pending`: A visible path still exists, usually because it is tied
  to a larger feature family that should be removed in a separate pass.
- `backend_removed`: Runtime files, services, model fields, storage schema
  readers, or tests for the feature have been deleted from active code paths.
- `backend_pending`: Services, prompts, models, API routes, storage keys, or
  tests still exist and should be deleted or migrated later.
- `storage_pending`: Historical local data may still exist in IndexedDB or old
  saves, but active code no longer reads or writes it.
- `fully_removed`: Entrypoints, backend code, prompt references, tests, and
  local data migration are complete.

## Removal Rule

For each retired feature:

1. Remove or disable the visible entrypoint first.
2. Register all remaining backend/storage/prompt/test surfaces here.
3. Only mark `fully_removed` after typecheck/tests pass, avoidable build
   warnings are gone, and the registry entry no longer lists pending surfaces.

## Project Quality Gate

The repository currently has substantial pre-existing type debt: `npx tsc
--noEmit` reports many errors across tests, Cloudflare worker types, auction
house, map/location, save/sync, currency, NPC, and novel decomposition code.

Final homebrew simplification is not complete until:

- `npx tsc --noEmit` is back to 0 errors.
- Routine tests are back to 0 failures.
- Vite/build warnings that are under project control are either removed or
  explicitly tracked with a removal plan.
- Retired feature tests, prompts, types, storage keys, and fixtures are deleted
  or migrated instead of left behind as permanent type debt.

## Feature: `novel_decomposition`

- Decision: retire.
- Reason: The homebrew project will not support fanfiction/original-work
  adaptation, novel decomposition, or novel-decomposition workshop sharing.
- Current status: `entrypoint_removed`, `backend_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer lazy-loads or mounts
  `NovelDecompositionWorkbenchModal`.
- `App.tsx`: no longer subscribes to `小说拆分后台调度服务` for global background
  error toasts.
- `App.tsx`: no longer handles `novel_decomposition` / `小说分解` menu actions.
- `components/layout/LandingPage.tsx`: no longer passes a novel decomposition
  launcher into the workshop modal.
- `components/features/Workshop/CreativeWorkshopModal.tsx`: removed the
  top-level `小说分解模块` workbench button.
- `components/layout/RightPanel.tsx`: removed `分解工坊`.
- `components/layout/MobileQuickMenu.tsx`: removed the `novel_decomposition`
  quick menu item.
- `components/features/Settings/SettingsModal.tsx`: removed
  `小说分解接口` and `当前小说分解注入` tabs.
- `components/features/Settings/mobile/MobileSettingsModal.tsx`: removed the
  mobile settings tabs for the same feature.
- `components/features/Settings/WorkflowGraphSettings.tsx`: removed the
  workflow graph stage and settings jump for novel decomposition.
- `components/features/Settings/IndependentApiGptModeSettings.tsx`: removed the
  per-stage GPT-mode toggle for novel decomposition.
- `hooks/useGameState.ts`: removed the deleted settings tabs from `activeTab`.

### New-Game Entrypoints Removed In This Pass

- `components/features/NewGame/NewGameWizard.tsx`: no longer exposes
  `Fandom Blend`, `启用同人融合`, `启用同人角色替换`, or
  `启用附加小说分解`, and no longer loads novel-decomposition datasets for
  the new-game wizard.
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`: removed the
  same visible new-game path. Mobile itself remains a larger removal target,
  but the retired fandom/novel injection controls are no longer player-visible.

### Backend And Data Still Pending

Keep these visible in future cleanup work:

- `components/features/NovelDecomposition/NovelDecompositionWorkbenchModal.tsx`
- `components/features/Settings/NovelDecompositionSettings.tsx`
- `components/features/Settings/NovelDecompositionApiSettings.tsx`
- `components/features/Settings/CurrentNovelDecompositionInjectionSettings.tsx`
- `models/novelDecomposition.ts`
- `types.ts` export of `models/novelDecomposition`
- `services/novelStructureHeuristics.ts`
- `services/novelDecompositionCalibration.ts`
- `services/novelDecompositionInjection.ts`
- `services/novelDecompositionPipeline.ts`
- `services/novelDecompositionRuntime.ts`
- `services/novelDecompositionScheduler.ts`
- `services/novelDecompositionStore.ts`
- `services/novelDecompositionTime.ts`
- `services/novelDecompositionTimelineConstraints.ts`
- `services/novelDecompositionWorkshopBridge.ts`
- `services/workshopNovelDecomposition.ts`
- `services/ai/storyTasks.ts` novel decomposition generator/parser sections
- `services/ai/text/index.ts` novel decomposition export
- `prompts/runtime/novelDecomposition.ts`
- `prompts/runtime/novelDecompositionCot.ts`
- `data/builtinNovelDecompositionWorkshop.ts`
- `functions/api/workshop/novel-decomposition.ts`
- `utils/apiConfig.ts` novel decomposition defaults/normalization/API resolver
- `utils/settingsSchema.ts` keys:
  `novel_decomposition_datasets`, `novel_decomposition_tasks`,
  `novel_decomposition_snapshots`
- `services/dbService.ts` setting-store handling for the same keys
- `models/system.ts` feature/model settings fields for `小说拆分*`

### Prompt References Still Pending

Later fanfiction removal should clear prompt references to novel decomposition
in:

- `prompts/runtime/fandom*.ts`
- `prompts/runtime/opening*.ts`
- `prompts/runtime/planningAnalysis.ts`
- `prompts/runtime/planUpdateReference.ts`
- `prompts/runtime/worldEvolution*.ts`
- `prompts/core/cot*.ts`
- `prompts/core/data.ts`

### Tests And Scripts Still Pending

- `__tests__/novelDecomposition*.test.ts`
- `__tests__/workshopNovelDecomposition.test.ts`
- `tests/novel-opening-stream-regression.test.ts`
- `tests/e2e-novel-injection*.mjs`
- `tests/e2e-novel-injection-preseed-browser.js`
- `scripts/novelai-proxy.ps1` is NovelAI image/proxy related, not the retired
  decomposition module. Do not remove it in the novel decomposition pass unless
  a later image-backend decision also removes NovelAI.

### Storage And Migration Notes

- Existing IndexedDB data under `novel_decomposition_datasets`,
  `novel_decomposition_tasks`, and `novel_decomposition_snapshots` can be
  deleted in a strong migration because this homebrew fork does not preserve old
  compatibility.
- Before deleting storage keys, make sure no active prompt injection path can
  still read them through `services/novelDecompositionInjection.ts`.
- Disable/normalize `功能模型占位.小说拆分*` settings to inert defaults before
  deleting UI and storage readers.

### Not Part Of This Entry

- `components/features/Story/NovelExportModal.tsx` exports play history as prose.
  It is not a novel decomposition/fanfiction ingestion path. Decide separately
  whether this remains useful for the homebrew project.

## Feature: `new_game_fandom_entrypoints`

- Decision: retire.
- Reason: The homebrew project will not support fanfiction/original-work
  adaptation or fandom blending as a new-game configuration path.
- Current status: `entrypoint_removed`, `backend_pending`.

### Entrypoints Removed In This Pass

- `components/features/NewGame/NewGameWizard.tsx`: removed the desktop
  new-game fandom/fanfiction configuration panel, role-replacement controls,
  novel-decomposition dataset selector, visible summary rows, and dataset store
  loading.
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`: removed the
  same mobile new-game fandom/fanfiction configuration path.
- `services/novelDecompositionStore.ts`: no longer imported by the desktop or
  mobile new-game wizard for dataset listing.

### Backend, Prompt, And Data Pending

- `models/fandomPlanning`
- `prompts/runtime/fandom*.ts`
- `prompts/runtime/opening*.ts` fandom and novel-injection branches
- `prompts/runtime/planningAnalysis.ts`
- `prompts/runtime/worldEvolution*.ts`
- `data/creativeWorkshopModules.ts`
- `utils/openingConfig.ts` normalization helpers and `OpeningConfig.同人融合`
  handling
- `models/system.ts` fandom configuration structures
- `services/fandomPresetSubmission.ts`
- `functions/api/fandom-presets`

### Storage And Migration Notes

- Existing custom new-game presets or saved opening configs may still contain
  `同人融合` fields. A later strong migration can drop them because this fork
  does not preserve old fandom/novel-decomposition compatibility.
- Before removing the backend fields, make sure no prompt path still reads old
  `同人融合` values from custom presets, workshop modules, or saved runtime
  snapshots.

## Feature: `music_playback`

- Decision: retire.
- Reason: Background music, playlist management, and turn-completion audio cues
  are not part of the homebrew core loop. They add UI, IndexedDB state, media
  metadata parsing, media assets, and mobile drawer complexity without helping
  the AI-RPG engine direction.
- Current status: `entrypoint_removed`, `backend_removed`, `storage_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer wraps the app in `MusicProvider`, owns
  `showMobileMusic`, opens `MobileMusicPlayer`, or handles the `music` /
  `音乐` menu action.
- `components/layout/RightPanel.tsx`: no longer imports `useMusic` or
  `MusicPlayerUI`.
- `components/layout/MobileQuickMenu.tsx`: no longer exposes the `music` quick
  menu item.
- `components/features/Settings/SettingsModal.tsx`: removed the `music`
  settings tab.
- `components/features/Settings/mobile/MobileSettingsModal.tsx`: removed the
  mobile `music` settings tab.
- `components/features/Settings/GameSettings.tsx`: removed the turn-completion
  notification sound toggle.

### Runtime And Data Removed

- Deleted `components/features/Music/MusicProvider.tsx`.
- Deleted `components/features/Music/MusicPlayerUI.tsx`.
- Deleted `components/features/Music/mobile/MobileMusicPlayer.tsx`.
- Deleted `components/features/Settings/MusicSettings.tsx`.
- Deleted `data/defaultMusicTracks.ts`.
- Deleted `utils/musicMetadata.ts`.
- Deleted `utils/turnNotificationSound.ts`.
- Deleted `public/sounds/turn-notify.mp3`.
- Removed `hooks/useGame.ts` turn-completion audio playback side effect.
- Removed `utils/settingsSchema.ts` key: `music_tracks`.
- Removed `services/dbService.ts` summary handling for `music_tracks`.
- Removed `utils/gameSettings.ts` default turn notification setting.
- Removed `models/system.ts` music settings fields, turn notification setting,
  and `MusicTrack`.
- Removed `hooks/useGameState.ts` `activeTab` union entry: `music`.

### Storage And Migration Notes

- Existing IndexedDB `music_tracks` data can be dropped in a strong migration.
- Old visual settings fields for background music may remain in historical
  saves/settings JSON until the strong migration pass, but active code no
  longer reads them.
- Old `启用回合提示音` game settings may remain in historical settings JSON until
  the strong migration pass, but active code no longer reads them.

## Feature: `auction_house`

- Decision: retire.
- Reason: The homebrew project will not keep auction-house gameplay, nor
  convert it into a modern market in this pass. A future lightweight trade or
  opposition economy can be designed separately if needed.
- Current status: `entrypoint_removed`, `backend_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer lazy-loads or mounts `AuctionHouseModal`.
- `App.tsx`: no longer handles the `auction_house` mobile menu action.
- `App.tsx`: no longer passes auction open handlers into `RightPanel`.
- `App.tsx`: no longer passes sell-to-auction handlers into desktop or mobile
  inventory.
- `components/layout/RightPanel.tsx`: removed the auction/market action.
- `components/layout/MobileQuickMenu.tsx`: removed the `auction_house` quick
  menu item.
- `components/features/Inventory/InventoryModal.tsx`: removed individual
  sell-to-auction and bulk misc sell controls.
- `components/features/Inventory/MobileInventoryModal.tsx`: removed the same
  mobile controls.

### Backend And Data Pending

- `App.tsx`: still imports auction service helpers, owns auction state/scope,
  processes world pending auction items, and feeds auction items into item
  image generation history. This is no longer player-visible, but must be
  removed with the backend/prompt pass.
- `components/features/AuctionHouse/AuctionHouseModal.tsx`
- `services/auctionHouse.ts`
- `data/defaultAuctionItemImages.ts`
- `scripts/generate-gpt-image2-auction-images.mjs`
- `__tests__/auctionHouse.test.ts`
- `models/world.ts` field: `拍卖行待投放物品`
- `models/item.ts` source type: `拍卖行`
- `models/imageGeneration.ts` source location: `拍卖行`
- `utils/stateHelpers.ts` world root field: `拍卖行待投放物品`
- `data/workshopThemes/topicModeThemeData.ts` auction/market labels
- `components/features/Settings/ImageGenerationSettings.tsx` auto item image
  copy that mentions auction-house items.
- Image manager source-location references in social image management can be
  removed once auction item image generation is gone.

### Prompt References Pending

- `prompts/runtime/worldDataSchema.ts`
- `prompts/runtime/worldGeneration.ts`
- `prompts/runtime/variableCalibrationReference.ts`
- `prompts/runtime/worldEvolution.ts`
- `prompts/runtime/worldEvolutionCot.ts`

### Storage And Migration Notes

- Existing auction-house state can be dropped in a strong migration.
- Remove `世界.拍卖行待投放物品` from AI-writable world state before deleting
  bridge code in `App.tsx`, otherwise world evolution may continue to emit
  unused auction payloads.
- Inventory sell-to-auction actions should disappear with the feature, not be
  silently redirected into a new economy system.

## Feature: `legacy_battle_system`

- Decision: retire and replace later.
- Reason: The homebrew project will not keep the old battle UI, kungfu/realm
  combat math, stance-like tactical panel, or traditional wuxia confrontation
  loop. A future lightweight opposition system can be designed separately and
  should not inherit this legacy battle surface by default.
- Current status: `entrypoint_removed`, `backend_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer lazy-loads or mounts `BattleModal` /
  `MobileBattleModal`.
- `App.tsx`: no longer handles the `battle` / `战斗` menu action or owns an
  `openBattle` UI callback.
- `components/layout/RightPanel.tsx`: removed the desktop battle system menu
  button.
- `components/layout/MobileQuickMenu.tsx`: removed the mobile battle quick-menu
  item and icon.

### Backend, Model, Prompt, And Test Residue Pending

- `components/features/Battle`
- `models/battle.ts`
- `types.ts` export of battle state structures
- `hooks/useGameState.ts` `showBattle` / `setShowBattle` UI state residue
- `hooks/useGame.ts` battle state initialization, save/load, command
  application, and auto-clear paths
- `hooks/useGame/storyState.ts` battle normalization and empty battle helpers
- `hooks/useGame/systemPromptBuilder.ts` battle context serialization
- `hooks/useGame/responseCommandProcessor.ts` battle command application
- `hooks/useGame/variableModelWorkflow.ts` battle state payload and command
  surface
- `utils/rulebook.ts` battle visualization helpers
- `prompts/runtime` combat, variable, world-generation, and calibration
  references that ask the AI to maintain `战斗`
- `prompts/core` command/write rules that list `战斗` as an active writable root
- `prompts/stats/combat.ts`
- `__tests__/*battle*.test.ts`
- `tests/battle-order-display.spec.mjs`

### Replacement Direction

- Do not convert this old system into the new design in place.
- Later design a new lightweight opposition system around modern-urban
  conflicts, danger pressure, social/physical stakes, and local-state
  settlement. It may still let AI narrate the scene, but the code should own the
  critical counters and resolution gates.

### Storage And Migration Notes

- Existing save data under root `战斗` can be dropped or normalized to an inert
  empty object during a later strong migration.
- Before deleting the model field, remove `战斗` from AI-writable command roots
  and prompt schemas so new turns stop producing legacy battle commands.

## Feature: `wuxia_cultivation_system`

- Decision: retire.
- Reason: The homebrew project will not keep wuxia/cultivation/realm/kungfu or
  sect-specific gameplay. Future organization, abilities, and opposition
  systems should be redesigned for the modern-urban / near-future direction
  instead of inheriting the old cultivation surface.
- Current status: `entrypoint_removed`, `backend_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer lazy-loads, preloads, opens, or mounts
  `KungfuModal`, `MobileKungfuModal`, `SkillsPanel`,
  `MobileSkillsPanel`, `SectModal`, or `MobileSect`.
- `App.tsx`: removed the `kungfu`, `skills`, `sect`, `功法`, `技艺`, and
  `门派` menu handling paths.
- `App.tsx`: removed front-end sect book learning, sect exchange, monthly
  stipend, and NPC recruitment-to-sect handlers.
- `components/layout/RightPanel.tsx`: removed the desktop kungfu and sect menu
  buttons.
- `components/layout/MobileQuickMenu.tsx`: removed the mobile `kungfu`,
  `skills`, and `sect` quick-menu ids and icons.
- `components/features/Settings/GameSettings.tsx`: removed the player-facing
  cultivation-system toggle.
- `components/features/NewGame/NewGameWizard.tsx`: removed the desktop manual
  realm prompt UI and the start-with-sect toggle.
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`: removed the
  same mobile new-game entrypoints.
- `components/features/NewGame/NewGameDiyTools.tsx`: removed realm DIY and AI
  realm generation tools.

### Backend, Model, Prompt, And Test Residue Pending

- `components/features/Kungfu`
- `components/features/Sect`
- `components/features/Skills`
- `models/kungfu.ts`
- `models/sect.ts`
- `models/character.ts` kungfu, realm, and sect-related character fields
- `models/system.ts` cultivation and opening-organization configuration fields
- `types.ts` exported cultivation/sect/new-game structures
- `hooks/useGameState.ts` `showKungfu`, `showSkills`, and `showSect` UI state
  residue
- `hooks/useGame.ts` save/load and command-application paths that still carry
  cultivation, kungfu, realm, and sect state
- `utils/newGameDiy.ts` realm draft helpers
- `utils/openingConfig.ts` start-with-organization normalization and copy
- `utils/topicRealmDefaults.ts`
- `utils/worldGenerationPromptPreview.ts`
- `data/workshopThemes/*` wuxia/cultivation labels and defaults
- `data/presets.ts` cultivation defaults
- `prompts/stats/kungfu.ts`
- `prompts/core/realm.ts`
- `prompts/core/cotCombat.ts`
- `prompts/runtime/worldGeneration.ts`
- Other `prompts/core` and `prompts/runtime` references that ask AI to maintain
  realms, kungfu lists, sects, inner power, or cultivation progress

### Storage And Migration Notes

- Existing saves and custom new-game presets may still contain `玩家门派`,
  character kungfu lists, realm fields, manual realm prompt data, and opening
  organization settings.
- This fork does not preserve old wuxia/cultivation save compatibility, so a
  later strong migration can drop or normalize these fields after prompts and
  command roots stop producing them.
- Remove AI-writable paths for cultivation and sect state before deleting the
  models, otherwise the variable-generation and world-generation prompts may
  continue to emit unused commands.

## Feature: `cloud_play_and_sync`

- Decision: retire.
- Reason: The homebrew project does not need cloud play, GitHub/WebDAV/Object
  multi-device sync, account-based sync entrypoints, or public sync workflows.
  Local settings, local saves, and ZIP import/export stay intact.
- Current status: `entrypoint_removed`, `backend_pending`, `storage_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer lazy-loads, preloads, opens, or mounts
  `CloudPlayModal`.
- `App.tsx`: no longer exposes `cloud_play` as an active mobile/detail window.
- `App.tsx`: removed the in-game cloud/local play-mode badge and the direct
  dependency on `读取云端游玩存储模式`.
- `components/layout/LandingPage.tsx`: removed the `云端游玩` primary action.
- `components/layout/LandingPage.tsx`: removed `GitHubSyncButton` from the
  homepage top bar.
- `components/layout/LandingPage.tsx`: removed the cloud-play login bridge used
  by the workshop modal.
- `components/layout/MobileQuickMenu.tsx`: removed the `cloud_play` quick-menu
  id and metadata.
- `components/features/SaveLoad/SaveLoadModal.tsx`: removed all
  "convert local save to cloud play" buttons, cloud-play status copy, and direct
  imports of cloud/object-storage sync services.

### Entrypoints Still Pending

These are adjacent cloud/community surfaces and should be removed in later
focused passes:

- `components/features/Workshop/CreativeWorkshopModal.tsx`: still imports
  `读取云端游玩会话` and exposes community contribution/publish concepts.
- `components/features/Settings/NovelDecompositionSettings.tsx`: still contains
  novel-decomposition workshop publishing code. It belongs to the later
  novel-decomposition cleanup pass.
- `components/features/Auth/GitHubSyncButton.tsx`
- `components/features/Auth/WebDAVSyncPanel.tsx`
- `components/features/Auth/ObjectStorageSyncPanel.tsx`
- `components/features/Auth/CloudPlayModal.tsx`

### Backend And Data Pending

- `App.tsx`: return-home flow still calls
  `等待云端后台同步完成`, `确保本地存档已同步到云端`, and
  `确保最新本地存档已同步到云端`.
- `hooks/useGame/saveCoordinator.ts`: still imports and calls
  `后台同步存档到云端`.
- `services/cloudPlayService.ts`
- `services/githubSync.ts`
- `services/objectStorageSync.ts`
- `services/webdavSync.ts`
- `utils/cloudPlayStorageMode.ts`
- `utils/cloudPlaySaveTree.ts`
- `hooks/useGitHubOAuth.ts`
- `functions/api/cloud-play.ts`
- `functions/api/github/*`
- `functions/api/auth/*`
- `functions/api/object-storage-proxy.ts`
- `functions/api/webdav-proxy.ts`
- `functions/api/workshop/*` cloud/community publishing paths
- `services/onlinePresence.ts`: still reads cloud-play session state.
- `services/creativeWorkshop.ts`: still reads cloud-play session state for
  community contribution ownership.
- `services/workshopNovelDecomposition.ts`: still reads cloud-play session
  state for retired workshop publishing.

### Tests And Scripts Still Pending

- `tests/object-storage-save-tree-order.test.ts`
- Any sync/API tests under `tests` or `__tests__` that target GitHub, WebDAV,
  object storage, cloud play, or OAuth should be deleted with the backend pass.

### Storage And Migration Notes

- Existing localStorage keys under `moranjianghu.cloudPlay.*` can be dropped in
  a strong migration.
- Existing IndexedDB settings keys can be dropped after no active code reads
  them:
  - `utils/settingsSchema.ts`: `webdav_sync_settings`
  - `utils/settingsSchema.ts`: `object_storage_sync_settings`
- `services/dbService.ts` setting management and backups may still expose these
  keys until the storage migration pass.
- Save metadata fields written for object-storage sync can be deleted during
  the save-schema cleanup, but local save content and ZIP import/export must
  remain supported.

## Feature: `online_presence_public_ops`

- Decision: retire.
- Reason: Public online heartbeat, online player counts, and online-duration
  ranking are public-operations/community surfaces, not part of the local
  homebrew AI-RPG core loop.
- Current status: `entrypoint_removed`, `backend_pending`, `storage_pending`.

### Entrypoints Removed In This Pass

- `App.tsx`: no longer imports `services/onlinePresence` or starts the global
  online heartbeat.
- `components/layout/LandingPage.tsx`: no longer fetches public online stats,
  stores homepage online history state, renders the online-count chart, or links
  to the public online-duration ranking page.

### Frontend Code Still Pending

- `components/layout/LandingPage.tsx`: dead online-chart helper code still
  exists but is not rendered and no longer fetches online data. Delete it with
  the backend/static-page cleanup pass.

### Backend, Static Pages, And Data Pending

- `services/onlinePresence.ts`
- `functions/api/online-presence.ts`
- `public/online-ranking.html`
- localStorage key: `moranjianghu.onlineHourlyHistory`
- Any release/homepage copy that still treats public online stats as a product
  surface should be removed during the same pass.

### Tests Still Pending

- `tests/online-ranking-session-regression.test.ts`
- Any worker/API tests that target public online presence or public ranking
  endpoints should be deleted with the backend pass.

### Storage And Migration Notes

- Existing homepage online-history localStorage can be dropped in a strong
  migration.
- Online presence currently overlaps with cloud-play session and public
  operations code. Remove it after the cloud/sync backend pass identifies which
  session helpers are no longer needed.

## Feature: `festival_system`

- Decision: retire.
- Reason: Festivals should not be a game system in this homebrew fork. If a
  scene wants seasonal flavor, the AI can mention it in prose without a
  structured festival config, top-bar card, or automatic state effect.
- Current status: `entrypoint_removed`, `backend_pending`, `storage_pending`.

### Entrypoints And Runtime Effects Removed In This Pass

- Deleted `data/world.ts`, the default festival list.
- Deleted `components/features/Settings/WorldSettings.tsx`, the festival
  editor.
- `components/features/Settings/SettingsModal.tsx`: removed the desktop
  `世界设定` / festival settings tab and festival props.
- `components/features/Settings/mobile/MobileSettingsModal.tsx`: removed the
  same mobile settings path.
- `App.tsx`: no longer passes festival props into `TopBar` or settings modals.
- `components/layout/TopBar.tsx`: no longer renders the festival card, detail
  panel, mobile info button, or festival highlight.
- `hooks/useGameState.ts`: no longer initializes `festivals` from default data
  or reads saved festival settings.
- `hooks/useGame.ts`: removed the automatic date-to-festival effect that wrote
  `环境.节日`.
- `hooks/useGame/config/settingsPersistenceWorkflow.ts`: no longer exposes
  `updateFestivals`.
- `utils/settingsSchema.ts` and `services/dbService.ts`: no longer list or
  summarize the active festival setting.

### Backend, Model, And Prompt Residue Pending

- `models/environment.ts`: still contains `环境节日信息结构` and
  `环境信息结构.节日`.
- `models/system.ts`: still exports `节日结构`.
- `hooks/useGame/storyState.ts`: still initializes `环境.节日`.
- `hooks/useGame/stateTransforms.ts`: still normalizes incoming `节日`.
- `hooks/useGame/systemPromptBuilder.ts`: still serializes `环境.节日` into AI
  context.
- `utils/stateHelpers.ts`: still allows `环境.节日` as a command target.
- `prompts/core/data.ts`
- `prompts/core/cotOpening.ts`
- `prompts/runtime/opening.ts`
- `prompts/runtime/openingVariableGenerationInit.ts`

### Storage And Migration Notes

- Historical IndexedDB settings key: `festivals`.
- The old settings key can be deleted during the strong migration pass.
- Before removing `环境.节日` from models and prompts, clear prompt references
  so the AI no longer attempts to initialize or update structured festival
  state.
