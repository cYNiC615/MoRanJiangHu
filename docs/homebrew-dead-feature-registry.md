# Homebrew Dead Feature Registry

This registry tracks the current state of features intentionally retired from
the homebrew build. It is not a historical changelog. Keep each entry focused
on what is currently unreachable, what still exists, and which later phase owns
the remaining cleanup.

## Status Vocabulary

- `entrypoint_removed`: User-facing route/menu/modal access has been removed.
- `entrypoint_pending`: A visible path still exists, usually because it is tied
  to a larger feature family that should be removed in a separate pass.
- `automatic_side_effect_removed`: Startup, save, navigation, timer, heartbeat,
  or background side effects for a retired feature have been disconnected from
  active player flows.
- `static_pages_removed`: Static public/admin HTML pages for a retired feature
  have been deleted from `public/`, so they are no longer direct URL entrypoints.
- `backend_removed`: Runtime files, services, model fields, storage schema
  readers, or tests for the feature have been deleted from active code paths.
- `backend_pending`: Services, prompts, models, API routes, storage keys, or
  tests still exist and should be deleted or migrated later.
- `storage_pending`: Historical local data may still exist in IndexedDB or old
  saves, but active code no longer reads or writes it.
- `prose_atmosphere_only`: The concept may appear in generated prose or visual
  descriptions, but is no longer maintained as structured game state.
- `prompt_copy_pending`: Retired feature language still exists in prompt text
  that should be rewritten or deleted before the owning cleanup phase closes.
- `fully_removed`: Entrypoints, backend code, prompt references, tests, and
  local data migration are complete.

## Current-State Rule

For each retired feature:

1. Keep only current reachability, side-effect, backend, prompt, storage, and
   test status here.
2. Do not preserve a detailed record of every removed button or old UI shape.
3. Only mark `fully_removed` after typecheck/tests pass, avoidable build
   warnings are gone, and the registry entry no longer lists pending surfaces.

Phase split:

- Phase 1: retired features are no longer reachable from the current playable
  flow, no longer run top-level side effects, and are no longer actively
  maintained by AI prompt/schema/command paths.
- Phase 1.5: unreachable frontend components, modals, mobile files, props,
  lazy imports, and frontend tests are deleted.
- Later phases: backend services, APIs, models, prompt files, storage keys, and
  strong migrations are removed.

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
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`.

### Current Retired Entrypoints

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

### Current Retired New-Game Entrypoints

- `components/features/NewGame/NewGameWizard.tsx`: no longer exposes
  `Fandom Blend`, `启用同人融合`, `启用同人角色替换`, or
  `启用附加小说分解`, and no longer loads novel-decomposition datasets for
  the new-game wizard.
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`: removed the
  same visible new-game path. Mobile itself remains a larger removal target,
  but the retired fandom/novel injection controls are no longer player-visible.

### Current Disconnected Injection Side Effects

- `hooks/useGame/mainStoryRequest.ts`: no longer accepts or pushes a
  novel-decomposition prompt into main-story request messages.
- `hooks/useGame/contextSnapshot.ts`: no longer reads active
  novel-decomposition injection while previewing request context.
- `hooks/useGame/sendWorkflow.ts`: no longer fetches the active
  novel-decomposition injection or applies novel-decomposition time calibration
  after the main story command pipeline.
- `hooks/useGame/openingStoryWorkflow.ts`: no longer injects opening
  novel-decomposition anchors into the opening story, opening world-evolution,
  or opening planning-analysis requests.
- `hooks/useGame/planningUpdateWorkflow.ts` and
  `hooks/useGame/worldEvolutionWorkflow.ts`: no longer add active
  novel-decomposition text to independent planning/world extra prompts.
- `hooks/useGame/runtimeVariableWorkflow.ts` and
  `hooks/useGame/historyTurnWorkflow.ts`: no longer call
  novel-decomposition calibration when writing or rebuilding story state.

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

### Prompt And Schema Notes

Default always-on prompt surfaces no longer expose the retired fandom /
novel-decomposition feature labels (`同人模式`, `小说分解`, `小说拆分`,
`原著章节锚点`, `原著硬约束`, etc.). Generic context-window wording such as
`滑窗`, `章节窗口`, or `【当前章节内容】 / 【下一章节内容】` is not itself retired;
it may describe the same context-budgeting / worldbook-like injection technique
used by the core AI harness.

Later backend cleanup should still delete retired prompt files and conditional
branches in:

- `prompts/runtime/fandom*.ts`
- `prompts/runtime/opening*.ts`
- `prompts/runtime/planningAnalysis.ts`
- `prompts/runtime/planUpdateReference.ts`
- `prompts/runtime/worldEvolution*.ts`
- `prompts/core/cot*.ts`
- `prompts/core/data.ts`

The active schema still contains legacy fields such as `剧情.当前章节.当前分解组`,
`剧情.当前章节.原著章节标题`, `世界.*.关联分解组`, and `世界.*.关联分歧线`.
They are tracked as `backend_pending` model/storage migration work. Do not
rename these paths only in prompt text before the model, command filters,
normalizers, UI, and migration plan are updated together.

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
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`.

### Current Retired Entrypoints

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

### Current Disconnected Runtime Injection

- `prompts/runtime/fandom.ts`: legacy `同人融合.enabled` opening configs no
  longer enable the runtime fandom prompt bundle. The realm-mapping helper
  behavior remains intact for now because other legacy cultivation/realm code
  still depends on it until the broader wuxia cleanup.
- `prompts/runtime/openingConfig.ts`: world-generation no longer emits
  `同人融合世界观要求` even if a historical opening config still contains
  fandom fields.
- `utils/femaleNameSelector.ts`: the active female-name guard prompt no longer
  tells the model to preserve original-work/fandom/novel-decomposition names as
  a special class.

### Remaining Active-Code Residue

- Several workflows still carry `同人剧情规划` /
  `同人女主剧情规划` state plumbing and type dependencies while the deeper model
  deletion is pending. The runtime fandom prompt bundle is disabled, but these
  fields should still be deleted during the backend/model cleanup.
- Default always-on prompt copy has been cleaned of retired fandom /
  novel-decomposition feature labels. Remaining references are deeper
  backend/model/prompt files or legacy schema field names that require a
  coordinated migration.

## Feature: `music_playback`

- Decision: retire.
- Reason: Background music, playlist management, and turn-completion audio cues
  are not part of the homebrew core loop. They add UI, IndexedDB state, media
  metadata parsing, media assets, and mobile drawer complexity without helping
  the AI-RPG engine direction.
- Current status: `entrypoint_removed`, `backend_removed`, `storage_pending`.

### Current Retired Entrypoints

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
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`.

### Current Retired Entrypoints

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

### Current Disconnected Automatic Side Effects

- `App.tsx`: no longer imports auction-house service helpers, owns auction
  state/scope, reads or saves auction-house state on startup, listens for
  `moranjianghu:auction-house-loaded`, or restocks auction items after assistant
  messages.
- `App.tsx`: no longer bridges `世界.拍卖行待投放物品` into auction-house records.
- `App.tsx`: no longer feeds auction-house item images into the image manager
  history or automatic item-image generation queue.
- `hooks/useGame/saveCoordinator.ts`: no longer stores `拍卖行` in new save
  payloads, restores old auction-house state on load, saves auction-house
  state separately, or dispatches the auction-house load event.
- `hooks/useGame/worldEvolutionUtils.ts`: world-evolution commands targeting
  `世界.拍卖行待投放物品` are no longer allowed or summarized as player-visible
  world news.
- `utils/stateHelpers.ts`: relative `拍卖行待投放物品` commands no longer normalize
  into `gameState.世界.*`.
- `prompts/stats/world.ts`, `prompts/runtime/worldEvolution.ts`,
  `prompts/runtime/worldEvolutionCot.ts`,
  `prompts/runtime/openingWorldEvolutionInit.ts`, and
  `prompts/runtime/worldDataSchema.ts`: no longer ask AI world evolution to
  write the retired pending-auction buffer.
- Opening/world-generation/runtime reference prompts no longer use the old
  auction/market runtime profile wording as an AI-facing system concept.
- `prompts/core/data.ts`: currency instructions no longer describe auction
  settlement as a structured program concept.
- `components/features/World/WorldModal.tsx`: no longer shows the retired
  pending-auction/market-rumor list inside the active desktop world panel.
- `components/features/Settings/ImageGenerationSettings.tsx`: item automatic
  image generation copy now only describes bag items.

### Backend And Data Pending

- `components/features/AuctionHouse/AuctionHouseModal.tsx`
- `services/auctionHouse.ts`
- `data/defaultAuctionItemImages.ts`
- `scripts/generate-gpt-image2-auction-images.mjs`
- `__tests__/auctionHouse.test.ts`
- `models/world.ts` field: `拍卖行待投放物品`
- `models/item.ts` source type: `拍卖行`
- `models/imageGeneration.ts` source location: `拍卖行`
- `hooks/useGame/storyState.ts` still initializes and normalizes the retired
  world field for historical save shapes.
- `components/features/World/MobileWorldModal.tsx` still contains the old
  mobile-only display residue; the mobile frontend is already unmounted and is
  tracked by `mobile_frontend`.
- `data/workshopThemes/topicModeThemeData.ts` auction/market labels
- Image manager source-location references in social image management can be
  removed once auction item image generation is gone.

### Storage And Migration Notes

- Existing auction-house state can be dropped in a strong migration.
- Active AI-writable paths for `世界.拍卖行待投放物品` have been removed from the
  world-evolution prompts and command filters; the remaining model/save residue
  can be dropped during the strong schema migration.
- Inventory sell-to-auction actions should disappear with the feature, not be
  silently redirected into a new economy system.

## Feature: `legacy_battle_system`

- Decision: retire and replace later.
- Reason: The homebrew project will not keep the old battle UI, kungfu/realm
  combat math, stance-like tactical panel, or traditional wuxia confrontation
  loop. A future lightweight opposition system can be designed separately and
  should not inherit this legacy battle surface by default.
- Current status: `entrypoint_removed`, `backend_pending`.

### Current Retired Entrypoints

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

### Current Retired Entrypoints

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
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`.

### Current Retired Entrypoints

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

### Current Disconnected Automatic Side Effects

- `App.tsx`: returning home after auto-save no longer waits for cloud sync or
  pushes a background cloud-sync retry notification.
- `App.tsx`: return-home saving copy now describes only local save completion.
- `hooks/useGame/saveCoordinator.ts`: manual saves no longer call
  `后台同步存档到云端`.
- `hooks/useGame/saveCoordinator.ts`: automatic saves no longer call
  `后台同步存档到云端`.

### Entrypoints Still Pending

These are adjacent cloud/community surfaces and should be removed in later
focused passes:

- `components/features/Settings/NovelDecompositionSettings.tsx`: still contains
  novel-decomposition workshop publishing code. It belongs to the later
  novel-decomposition cleanup pass.
- `components/features/Auth/GitHubSyncButton.tsx`
- `components/features/Auth/WebDAVSyncPanel.tsx`
- `components/features/Auth/ObjectStorageSyncPanel.tsx`
- `components/features/Auth/CloudPlayModal.tsx`

### Backend And Data Pending

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

## Feature: `creative_workshop_cloud_ugc`

- Decision: retire cloud/community publishing, keep local mode packages.
- Reason: The homebrew project will not support community UGC, cloud workshop
  publishing, account-owned module editing, or public feedback/report flows.
  Local built-in modules, local JSON import/export, local ComfyUI workflow
  saving, and local injection preview remain useful.
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`.

### Current Retired Entrypoints And Automatic Effects

- `components/features/Workshop/CreativeWorkshopModal.tsx`: no longer imports
  cloud-play session state, reads a cloud username, exposes a cloud source
  filter, or shows community publish/edit/delete/report buttons.
- `components/features/Workshop/CreativeWorkshopModal.tsx`: keeps only local
  JSON import, local module creation, local save, read-only injection preview,
  JSON download, and summary copy.
- `components/features/Settings/ImageGenerationSettings.tsx`: no longer tries
  to publish the current ComfyUI workflow to the community workshop. The action
  now validates the workflow and saves it as a local workshop module only.
- `services/creativeWorkshop.ts`: `列出创意工坊模块` no longer fetches
  `/api/workshop/modules` or merges cloud entries into active UI lists. New-game
  and settings consumers now receive only built-in and local modules.

### Backend, API, And Data Pending

- `services/creativeWorkshop.ts`: publish/edit/delete/download helpers,
  cloud-account payload helpers, and cloud normalization branches still exist
  for a later backend deletion pass.
- `functions/api/workshop/modules.ts`
- `functions/api/workshop/novel-decomposition.ts` belongs primarily to the
  retired novel-decomposition feature, but it is also part of the old workshop
  API surface and can be removed when that backend is deleted.
- `services/workshopNovelDecomposition.ts` still contains retired workshop
  publishing/downloading behavior tied to novel decomposition.
- `components/features/Settings/NovelDecompositionSettings.tsx` still contains
  novel-decomposition workshop publishing code; remove it with the broader
  novel-decomposition backend cleanup.

### Storage And Migration Notes

- Historical local feedback reports under `moranjianghu.workshop.reports.*`
  can be dropped in a strong migration.
- Historical local workshop modules remain valid if they are built-in/local
  module JSON. Cloud-only server entries are no longer listed by active code.
- If a saved new-game preset references a cloud-sourced workshop module key, a
  later migration may drop that selection because this fork does not preserve
  community UGC compatibility.

## Feature: `online_presence_public_ops`

- Decision: retire.
- Reason: Public online heartbeat, online player counts, and online-duration
  ranking are public-operations/community surfaces, not part of the local
  homebrew AI-RPG core loop.
- Current status: `entrypoint_removed`, `static_pages_removed`,
  `backend_pending`, `storage_pending`.

### Current Retired Entrypoints

- `App.tsx`: no longer imports `services/onlinePresence` or starts the global
  online heartbeat.
- `components/layout/LandingPage.tsx`: no longer fetches public online stats,
  stores homepage online history state, renders the online-count chart, or links
  to the public online-duration ranking page.
- Deleted `public/online-ranking.html`, the direct public online-duration
  ranking page.
- Deleted `public/admin/online.html`, the direct admin dashboard page for online
  presence.

### Frontend Code Still Pending

- `components/layout/LandingPage.tsx`: dead online-chart helper code still
  exists but is not rendered and no longer fetches online data. Delete it with
  the backend cleanup pass.

### Backend, API, And Data Pending

- `services/onlinePresence.ts`
- `functions/api/admin/online`
- localStorage key: `moranjianghu.onlineHourlyHistory`
- Any release/homepage copy that still treats public online stats as a product
  surface should be removed during the same pass.

### Tests Still Pending

- `tests/online-ranking-session-regression.test.ts`
- `tests/e2e-admin-online.spec.mjs`
- Any worker/API tests that target public online presence, admin online
  dashboards, or public ranking endpoints should be deleted with the backend
  pass.

### Storage And Migration Notes

- Existing homepage online-history localStorage can be dropped in a strong
  migration.
- Online presence currently overlaps with cloud-play session and public
  operations code. Remove it after the cloud/sync backend pass identifies which
  session helpers are no longer needed.

## Feature: `apk_app_update_system`

- Decision: retire.
- Reason: The homebrew project will not ship an Android APK or maintain an
  in-app updater. Version publishing, APK download UX, native update progress,
  and update-manifest checks are release infrastructure for the old public
  product, not part of the local desktop-first AI-RPG loop.
- Current status: `entrypoint_removed`, `backend_pending`, `storage_pending`.

### Current Retired Entrypoints And Automatic Effects

- `App.tsx`: no longer imports `services/appUpdate`, checks for app updates,
  subscribes to app-update progress, listens for native foreground update
  checks, or renders the app-update progress modal.
- `App.tsx`: removed the automatic release-notes/update modal and its APK
  download action. The homepage no longer wires a release-notes modal through
  the app shell.
- `components/layout/LandingPage.tsx`: removed APK update checking, APK
  download action, native-only update button, APK code display, and Web/APK
  unified-version copy.
- `components/features/Settings/GameSettings.tsx`: removed the player-facing
  "manual APK update only" toggle.
- `hooks/useGameState.ts`: no longer mirrors the APK auto-update preference
  into localStorage during settings load.

### Backend, Release, And Data Pending

- `services/appUpdate.ts`
- `services/nativeApkUpdater.ts`
- `utils/appUpdatePreferences.ts`
- `components/ui/ReleaseNotesModal.tsx`
- `services/diagnosticReport.ts` current-app-release dependency
- `data/releaseInfo.ts` APK fields and update-manifest fields
- `public/release-info.json` APK fields and update-manifest fields
- `functions/api/apk`
- `android`
- `capacitor.config.ts`
- `package.json` scripts: `build:apk`, `apk:sync`, `apk:debug`,
  `apk:release`, `apk:signature`, `e2e:apk-download`,
  `release:benchmark-apk`, `signing:upload`, and `signing:restore`
- APK/release scripts:
  - `scripts/benchmark-apk-providers.mjs`
  - `scripts/e2e-apk-download.mjs`
  - `scripts/inspect-apk-signature.mjs`
  - `scripts/prune-apk-assets.mjs`
  - `scripts/publish-release-r2.mjs`
  - `scripts/publish-release-s3.mjs`
  - `scripts/run-gradle.mjs`
  - `scripts/sync-android-signing-bundle.mjs`
  - `scripts/sync-release.mjs` Android/Gradle update path

### Storage And Migration Notes

- localStorage key: `moranjianghu.apkAutoUpdateDisabled`
- Game settings field: `禁用APK自动更新`
- Release metadata may still contain `versionCode`, `apkDownloadUrl`,
  `updateManifestUrl`, `apkSha256`, and `apkSize` until the release metadata
  pass removes APK publishing.
- Capacitor packages remain in `package.json` while native/mobile cleanup is
  pending because other code still imports native helpers. Delete them with the
  broader mobile/Capacitor pass, not as a hidden side effect of this slice.

## Feature: `mobile_frontend`

- Decision: retire.
- Reason: The homebrew project is desktop-first and will not support mobile UI
  or APK-oriented shell behavior.
- Current status: `entrypoint_removed`, `backend_pending`.

### Current Retired Entrypoints

- `App.tsx`: no longer imports, preloads, or mounts mobile-only components.
- `App.tsx`: no longer renders `MobileQuickMenu`.
- `App.tsx`: no longer renders mobile-only bottom ticker layout.
- `App.tsx`: no longer branches settings, new-game, image manager, memory
  summary, NPC memory summary, inventory, character, social, team, world, map,
  task, agreement, story, heroine-plan, or memory panels through mobile
  component variants.
- `App.tsx`: removed the mobile browser-history trap, native back-button
  listener, and fullscreen state used by the old mobile shell.

### Deeper Deletion Pending

- `components/layout/MobileQuickMenu.tsx`
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`
- `components/features/Settings/mobile/MobileSettingsModal.tsx`
- `components/features/Character/MobileCharacter.tsx`
- `components/features/Inventory/MobileInventoryModal.tsx`
- `components/features/Social/MobileSocial.tsx`
- `components/features/Social/mobile/MobileImageManagerModal.tsx`
- `components/features/Social/mobile/MobileCustomSelect.tsx`
- `components/features/Social/mobile/MobileFileUploader.tsx`
- `components/features/Team/MobileTeamModal.tsx`
- `components/features/World/MobileWorldModal.tsx`
- `components/features/Map/MobileMapModal.tsx`
- `components/features/Task/MobileTask.tsx`
- `components/features/Agreement/MobileAgreementModal.tsx`
- `components/features/Story/MobileStory.tsx`
- `components/features/Story/MobileHeroinePlanModal.tsx`
- `components/features/Memory/MobileMemory.tsx`
- `components/features/Memory/MemorySummaryFlowMobileModal.tsx`
- `components/features/Memory/NpcMemorySummaryFlowMobileModal.tsx`
- Responsive/mobile-only branches still inside shared desktop files such as
  `components/layout/TopBar.tsx`, `components/layout/LandingPage.tsx`,
  `components/features/Settings/SettingsModal.tsx`, and global CSS.
- Mobile-specific tests, E2E scripts, and visual verification notes should be
  deleted or rewritten with the deeper mobile/Capacitor pass.

### Backend, Native, And Storage Notes

- App-shell entrypoints are gone, but native/Capacitor helpers remain across
  save/load, image prefetch, OAuth, sync, diagnostics, AI streaming, and Android
  build files. Delete those with the broader Android/APK/Capacitor cleanup pass.
- No new migration is needed for the removed App-shell branches themselves.

## Feature: `festival_system`

- Decision: retire.
- Reason: Festivals should not be a game system in this homebrew fork. If a
  scene wants seasonal flavor, the AI can mention it in prose without a
  structured festival config, top-bar card, or automatic state effect.
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`, `prose_atmosphere_only`.

### Current Retired Entrypoints, Context, And Runtime Effects

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
- `hooks/useGame/systemPromptBuilder.ts`: no longer serializes `环境.节日` into
  active AI context.
- `utils/stateHelpers.ts`: no longer treats relative `节日` as an environment
  command target, and ignores commands targeting `环境.节日`.
- `utils/variableRegistry.ts`: rejects variable commands targeting
  `环境.节日`.
- `prompts/core/data.ts`, `prompts/core/cotOpening.ts`,
  `prompts/runtime/opening.ts`, and
  `prompts/runtime/openingVariableGenerationInit.ts`: no longer ask the AI to
  initialize structured festival state.

### Backend And Model Residue Pending

- `models/environment.ts`: still contains `环境节日信息结构` and
  `环境信息结构.节日`.
- `models/system.ts`: still exports `节日结构`.
- `hooks/useGame/storyState.ts`: still initializes `环境.节日`.
- `hooks/useGame/stateTransforms.ts`: still normalizes incoming `节日`.

### Storage And Migration Notes

- Historical IndexedDB settings key: `festivals`.
- The old settings key can be deleted during the strong migration pass.
- `环境.节日` can be dropped or normalized during the strong environment-schema
  migration because active prompts and command processing no longer maintain it.

## Feature: `weather_game_system`

- Decision: downgrade to prose atmosphere only.
- Reason: Weather should not be a structured game concept in this homebrew
  fork. If rain, heat, wind, or light matter in a scene, the AI can describe
  them in prose without maintaining a weather object, top-bar card, or expiry
  timestamp.
- Current status: `entrypoint_removed`, `automatic_side_effect_removed`,
  `backend_pending`, `storage_pending`, `prose_atmosphere_only`.

### Current Retired Entrypoints, Context, And Runtime Effects

- `components/layout/TopBar.tsx`: removed the weather card, detail panel,
  mobile info button, fullscreen detail, and desktop divider slot.
- `hooks/useGame/systemPromptBuilder.ts`: no longer serializes `环境.天气` into
  active AI context.
- `utils/stateHelpers.ts`: no longer treats relative `天气` as an environment
  command target, and ignores commands targeting `环境.天气`.
- `utils/variableRegistry.ts`: rejects variable commands targeting
  `环境.天气`.
- `hooks/useGame/worldEvolutionUtils.ts`: world evolution no longer allows
  `环境.天气` as a writable prefix.
- `prompts/core/data.ts`, `prompts/core/cotOpening.ts`,
  `prompts/runtime/opening.ts`,
  `prompts/runtime/openingVariableGenerationInit.ts`,
  `prompts/runtime/worldEvolution.ts`,
  `prompts/runtime/worldEvolutionCot.ts`,
  `prompts/runtime/variableCot.ts`,
  `prompts/stats/recovery.ts`, `prompts/stats/others.ts`, and
  `prompts/difficulty/physiology.ts`: no longer ask the AI to initialize,
  update, or use structured weather state.
- `hooks/useGame/sceneImageTriggerWorkflow.ts`: no longer reads stale
  `环境.天气` into the scene fingerprint or image context.
- `utils/visualSettings.ts` and
  `components/features/Settings/VariableManager.tsx`: copy no longer presents
  weather as a managed UI/status field.

### Backend And Model Residue Pending

- `models/environment.ts`: still contains `天气信息结构` and
  `环境信息结构.天气`.
- `hooks/useGame/storyState.ts`: still initializes `环境.天气`.
- `hooks/useGame/stateTransforms.ts`: still normalizes incoming `天气`.
- Historical saves may still contain `环境.天气`.
- Parser or diagnostic text may still mention weather as ordinary prose or
  leakage-filter vocabulary; those mentions do not make weather an active game
  system.

### Storage And Migration Notes

- Existing weather objects in saves can be dropped or ignored during the strong
  environment-schema migration.
- Do not add a replacement local weather generator in Phase 1. Future scene
  atmosphere can stay prose-only unless a later design explicitly reintroduces
  a lightweight environmental pressure system.
