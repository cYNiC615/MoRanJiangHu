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
- Current status: `entrypoint_removed` for top-level access,
  `entrypoint_pending` for new-game fandom injection UI,
  `backend_pending` overall.

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

### Entrypoints Still Pending

These are intentionally left for a later fanfiction/new-game cleanup pass:

- `components/features/NewGame/NewGameWizard.tsx`: still exposes
  `启用附加小说分解` inside the broader `同人融合` configuration.
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`: same mobile
  path. Mobile itself is a larger removal target, so do not spend extra effort
  polishing this path before the mobile deletion pass.

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

## Feature: `music_playback`

- Decision: retire.
- Reason: Background music and playlist management are not part of the
  homebrew core loop. They add UI, IndexedDB state, media metadata parsing, and
  mobile drawer complexity without helping the AI-RPG engine direction.
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

### Runtime And Data Removed

- Deleted `components/features/Music/MusicProvider.tsx`.
- Deleted `components/features/Music/MusicPlayerUI.tsx`.
- Deleted `components/features/Music/mobile/MobileMusicPlayer.tsx`.
- Deleted `components/features/Settings/MusicSettings.tsx`.
- Deleted `data/defaultMusicTracks.ts`.
- Deleted `utils/musicMetadata.ts`.
- Removed `utils/settingsSchema.ts` key: `music_tracks`.
- Removed `services/dbService.ts` summary handling for `music_tracks`.
- Removed `models/system.ts` music settings fields and `MusicTrack`.
- Removed `hooks/useGameState.ts` `activeTab` union entry: `music`.

### Storage And Migration Notes

- Existing IndexedDB `music_tracks` data can be dropped in a strong migration.
- Old visual settings fields for background music may remain in historical
  saves/settings JSON until the strong migration pass, but active code no
  longer reads them.

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
