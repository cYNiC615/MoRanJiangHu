# Homebrew Dead Feature Registry

This registry records the current state of intentionally retired feature
families in the homebrew build. It is a working index, not a historical
changelog: keep completed work compact, and keep only the remaining surfaces
that affect cleanup decisions.

## Status Vocabulary

- `entrypoint_removed`: The feature is no longer reachable from the current
  playable desktop flow.
- `frontend_removed`: Retired React components, pages, modal mounts, UI state,
  props, and frontend-only tests have been deleted or disconnected.
- `automatic_side_effect_removed`: Startup, save, navigation, timer, heartbeat,
  or background jobs no longer maintain the retired feature.
- `static_pages_removed`: Direct public/admin static pages have been deleted.
- `backend_removed`: Runtime code and active data/schema handling are gone.
- `backend_pending`: Services, prompts, model fields, API routes, tests, or
  scripts still exist and belong to a later cleanup pass.
- `command_root_retired`: Active command registry or apply logic rejects/no-ops
  retired structured roots.
- `active_prompt_schema_retired`: Always-on prompt/schema surfaces no longer ask
  the model to write the retired structured state.
- `storage_pending`: Historical IndexedDB/localStorage/save data may still
  exist and can be dropped in a strong migration.
- `prose_atmosphere_only`: The concept may appear in AI prose, but is no longer
  structured game state.
- `fully_removed`: Entrypoints, side effects, backend, prompts, tests, and
  storage migration are all complete.

## Current Phase Boundary

Phase 1 retires feature families from the active game loop:

1. Player-visible entrypoints are gone or inert.
2. Top-level side effects are disconnected.
3. Active prompt/schema/command paths no longer ask AI to maintain retired
   structured state.
4. Remaining residue is tracked here as current cleanup inventory only.

Phase 1 implementation-side closeout is complete, and the user's initial
manual smoke is acceptable. Phase 1.5 is now cleaning the retired frontend and
public release residue before Phase 2 modern-urban defaultization.

Phase 1.5 deletes unreachable frontend residue:

- public release/community/support homepage links, static pages, APK/release
  scripts, release metadata, and app-update surfaces;
- retired prompt-manager entries and misleading runtime-injection labels;
- unmounted components and modals;
- mobile-only files and old panels;
- retired settings pages, lazy imports, UI state, props, styles, and frontend
  tests.

Later cleanup deletes backend services, APIs, model fields, prompt files,
storage keys, scripts, and strong migrations. Do not keep detailed old UI
history in this file.

## Project Quality Gate

The repository still has pre-existing type debt. Homebrew simplification is not
done until:

- `npx tsc --noEmit` returns 0 errors;
- routine tests return 0 failures;
- avoidable Vite/build warnings are removed or explicitly owned;
- retired feature tests, prompts, types, storage keys, and fixtures are deleted
  or migrated instead of becoming permanent debt.

## Current Phase 1.5 Snapshot

| Feature family | Current status | Remaining owner |
| --- | --- | --- |
| `novel_decomposition` | `entrypoint_removed`, `frontend_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Later backend/model/prompt/storage cleanup |
| `new_game_fandom_entrypoints` | `entrypoint_removed`, `automatic_side_effect_removed`, `command_root_retired`, `backend_pending`, `storage_pending` | Later fandom/model/prompt cleanup |
| `music_playback` | `entrypoint_removed`, `backend_removed`, `storage_pending` | Strong storage migration only |
| `auction_house` | `entrypoint_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Phase 1.5 frontend residue, later backend/storage cleanup |
| `legacy_battle_system` | `entrypoint_removed`, `command_root_retired`, `active_prompt_schema_retired`, `backend_pending`, `storage_pending` | Phase 1.5 frontend residue, later replacement design |
| `wuxia_cultivation_system` | `entrypoint_removed`, `frontend_removed`, `command_root_retired`, `active_prompt_schema_retired`, `backend_pending`, `storage_pending` | Later model/prompt/storage cleanup |
| `cloud_play_and_sync` | `entrypoint_removed`, `frontend_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Later cloud/API/storage cleanup |
| `creative_workshop_cloud_ugc` | `entrypoint_removed`, `frontend_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Later workshop API cleanup |
| `online_presence_public_ops` | `entrypoint_removed`, `frontend_removed`, `static_pages_removed`, `backend_pending`, `storage_pending` | Later operations/API/test cleanup |
| `apk_app_update_system` | `fully_removed` | None |
| `public_release_static_pages` | `fully_removed` | None |
| `mobile_frontend` | `frontend_removed` | Shared responsive branches can be simplified opportunistically |
| `festival_system` | `entrypoint_removed`, `automatic_side_effect_removed`, `active_prompt_schema_retired`, `backend_pending`, `storage_pending`, `prose_atmosphere_only` | Later environment schema/storage cleanup |
| `weather_game_system` | `entrypoint_removed`, `automatic_side_effect_removed`, `active_prompt_schema_retired`, `backend_pending`, `storage_pending`, `prose_atmosphere_only` | Later environment schema/storage cleanup |

Phase 1 implementation-side checks are green:

- retired command roots are rejected/no-op by registry/apply logic;
- active system and Tavern context no longer serialize `战斗`, `玩家门派`,
  fandom decomposition fields, or cultivation-only character fields;
- visible settings and builtin worldbook slots no longer expose the retired
  cultivation style;
- targeted registry/runtime tests and production build pass;
- browser smoke confirms the homepage, settings, game-style dropdown, and
  worldbook manager do not expose retired feature entrypoints.

Before Phase 1.5, do a user-side manual play smoke:

1. send at least one real main-story turn with the user's normal local model
   settings;
2. confirm save/load, worldbook, prompt, memory, and settings surfaces still
   fit the actual play workflow.

## Phase 1.5 Frontend Cleanup Queue

Phase 1.5 should remove unreachable frontend residue without mixing in backend
schema migrations.

| Candidate | Current frontend residue | Boundary |
| --- | --- | --- |
| `prompt_manager_retired_prompts` | Phase 1.5 frontend slice complete: `components/features/Settings/PromptManager.tsx` hides `core_realm`, `stat_kungfu`, and `stat_cultivation`, and labels prompt state as active-context state instead of runtime injection/control | Later delete prompt files, models, storage snapshots, and strong migrations |
| `homepage_public_links` | Phase 1.5 complete: landing page now keeps local play, local mode packages, image manager, worldbook manager, and settings; public changelog/tutorial/feedback/release links are gone | Later rename Creative Workshop if desired |
| `mobile_frontend` | Phase 1.5 complete for independent files: `components/layout/MobileQuickMenu.tsx`, `components/features/NewGame/mobile/MobileNewGameWizard.tsx`, `components/features/Settings/mobile/MobileSettingsModal.tsx`, and unmounted `Mobile*` feature modals were deleted | Shared responsive branches may be simplified when touching those desktop components |
| `legacy_battle_system` | `components/features/Battle` and related unmounted battle UI | Future replacement is a new lightweight opposition system, not the old stance/kungfu battle model |
| `auction_house` | `components/features/AuctionHouse/AuctionHouseModal.tsx` | Leave `services/auctionHouse.ts`, model fields, storage, and tests to backend cleanup |
| `novel_decomposition` | Phase 1.5 frontend files, runtime services, workshop bridge/API, and decomposition tests removed | Leave dormant storyTasks export, prompt files, storage keys, and model migration to backend cleanup |
| `wuxia_cultivation_system` | Phase 1.5 frontend files removed: `components/features/Kungfu`, `components/features/Sect`, `components/features/Skills`; App/Social/Task no longer pass player-sect or learn-skill props | Leave `models/kungfu.ts`, `models/sect.ts`, and prompt roots to model/prompt cleanup |

## Later Backend And Storage Cleanup Queue

### `novel_decomposition`

Phase 1.5 removed the frontend workbench, settings panels, runtime services,
workshop bridge/API, and decomposition tests:

- `components/features/NovelDecomposition/NovelDecompositionWorkbenchModal.tsx`
- `components/features/Settings/NovelDecompositionSettings.tsx`
- `components/features/Settings/NovelDecompositionApiSettings.tsx`
- `components/features/Settings/CurrentNovelDecompositionInjectionSettings.tsx`
- `services/novelDecomposition*.ts`
- `services/workshopNovelDecomposition.ts`
- `data/builtinNovelDecompositionWorkshop.ts`
- `functions/api/workshop/novel-decomposition.ts`
- `__tests__/novelDecomposition*.test.ts`
- `__tests__/workshopNovelDecomposition.test.ts`
- `tests/e2e-novel-injection*`

Current residue:

- dormant `generateNovelDecomposition` export in `services/ai/storyTasks.ts`
- `prompts/runtime/novelDecomposition.ts`
- `prompts/runtime/novelDecompositionCot.ts`
- `models/novelDecomposition.ts`
- storage keys: `novel_decomposition_datasets`,
  `novel_decomposition_tasks`, `novel_decomposition_snapshots`

Keep only generic context-window/worldbook-like injection concepts. Do not
preserve novel/fanfiction adaptation behavior.

### `new_game_fandom_entrypoints`

Current residue:

- `components/features/NewGame/NewGameWizard.tsx`
- `models/fandomPlanning`
- `prompts/runtime/fandom*.ts`
- `data/creativeWorkshopModules.ts`
- saved opening config fields such as `同人融合`

Legacy fandom config is inert in active runtime paths. Delete the residue with
the fandom/model cleanup pass.

### `music_playback`

Runtime removal is complete. Only historical settings/storage migration remains:

- storage key: `music_tracks`

### `auction_house`

Current residue:

- `components/features/AuctionHouse/AuctionHouseModal.tsx`
- `services/auctionHouse.ts`
- `data/defaultAuctionItemImages.ts`
- `scripts/generate-gpt-image2-auction-images.mjs`
- `__tests__/auctionHouse.test.ts`
- `models/world.ts`
- `models/item.ts`
- `models/imageGeneration.ts`
- `hooks/useGame/storyState.ts`

No modern market replacement is implied by this entry. Any future trade or
economy system should be designed separately.

### `legacy_battle_system`

Current residue:

- `components/features/Battle`
- `models/battle.ts`
- legacy battle prompt/model/test surfaces
- battle-related tests and fixtures
- historical save state under `战斗`

Replacement direction: build a new lightweight opposition system later. Do not
reuse the old stance/kungfu/formation battle model as the target design.

### `wuxia_cultivation_system`

Phase 1.5 removed the frontend components:

- `components/features/Kungfu`
- `components/features/Sect`
- `components/features/Skills`

Current residue:

- `models/kungfu.ts`
- `models/sect.ts`
- `prompts/stats/kungfu.ts`
- `prompts/core/realm.ts`
- historical save fields and legacy prompt/model surfaces

PromptManager no longer shows the retired cultivation prompt-pool entries
`core_realm`, `stat_kungfu`, or `stat_cultivation`; stored local snapshots can
still contain those ids until the later prompt/storage cleanup.

The homebrew default is modern urban with optional near-future sci-fi. Wuxia
and cultivation compatibility is not preserved.

Known current behavior: the no-change new-game path still tends to create a
wuxia world. That belongs to Phase 2 modern-urban defaultization, not Phase
1.5 frontend residue cleanup.

### `cloud_play_and_sync`

Phase 1.5 removed cloud/auth frontend components, OAuth hook, cloud services,
sync services, API routes, settings schema entries, and related tests:

- `components/features/Auth/CloudPlayModal.tsx`
- `components/features/Auth/GitHubSyncButton.tsx`
- `components/features/Auth/ObjectStorageSyncPanel.tsx`
- `components/features/Auth/WebDAVSyncPanel.tsx`
- `hooks/useGitHubOAuth.ts`
- `services/cloudPlayService.ts`
- `services/githubSync.ts`
- `services/objectStorageSync.ts`
- `services/webdavSync.ts`
- `functions/api/cloud-play.ts`
- `functions/api/github/*`
- `functions/api/auth/*`
- `functions/api/object-storage-proxy.ts`
- `functions/api/webdav-proxy.ts`
- `utils/settingsSchema.ts`
- storage keys such as `webdav_sync_settings`,
  `object_storage_sync_settings`, and `moranjianghu.cloudPlay.*`

Current residue: old browser localStorage/IndexedDB values only; no active
runtime service or player-visible entrypoint remains.

Local settings, local saves, and ZIP import/export stay.

### `creative_workshop_cloud_ugc`

Phase 1.5 removed cloud publishing/download helpers from
`services/creativeWorkshop.ts`; `列出创意工坊模块` now returns builtin plus local
modules only, and `下载创意工坊模块` no longer performs network fetches.

Current residue:

- `components/features/Workshop/CreativeWorkshopModal.tsx`
- `components/features/Settings/ImageGenerationSettings.tsx`
- `services/creativeWorkshop.ts`

Keep local mode packages, local JSON import/export, local ComfyUI workflow save,
and local injection preview. The remaining "workshop" name is plain UI copy and
can be renamed later with the mode-package UX pass.

### `online_presence_public_ops`

Phase 1.5 removed:

- `services/onlinePresence.ts`
- `functions/api/admin/online`
- tests: `tests/online-ranking-session-regression.test.ts`,
  `tests/e2e-admin-online.spec.mjs`
- localStorage key: `moranjianghu.onlineHourlyHistory`

Current residue: old localStorage history only; no heartbeat service, public API,
static page, or test remains.

This is public operations surface, not part of the personal homebrew game loop.

### `public_release_static_pages`

Phase 1.5 removed public release/static support pages and feedback assets:

- `public/changelog.html`
- `public/tutorials.html`
- `public/cnb-comfyui-guide.html`
- `public/cnb-model-contribution-guide.html`
- `public/multi-device-sync-guide.html`
- `public/item-preset-feedback.html`
- `public/item-preset-feedback-sw.js`
- `public/item-preset-contributions-admin.html`
- `public/assets/item-preset-feedback-data.json`
- `public/assets/tutorial`

Current residue: none. Do not reintroduce customer-facing changelog/tutorial or
public feedback pages unless the user explicitly starts release/public work.

### `apk_app_update_system`

Phase 1.5 removed APK/app-update/release runtime and release metadata:

- `services/appUpdate.ts`
- `services/nativeApkUpdater.ts`
- `utils/appUpdatePreferences.ts`
- `components/ui/ReleaseNotesModal.tsx`
- `functions/api/apk`
- `android`
- `capacitor.config.ts`
- `data/releaseInfo.ts`
- `public/release-info.json`
- APK/release package scripts in `package.json`

Current residue: none in production code. Do not keep APK compatibility as a
cleanup constraint.

### `mobile_frontend`

Phase 1.5 removed independent mobile frontend files:

- `components/layout/MobileQuickMenu.tsx`
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`
- `components/features/Settings/mobile/MobileSettingsModal.tsx`
- other unmounted `Mobile*` feature modals

Current residue:

- responsive/mobile-only branches inside shared desktop files

Native/Capacitor project files and package dependencies were removed together
with APK cleanup. Remaining shared responsive branches can be simplified when
those desktop components are next touched.

### `festival_system`

Current residue:

- `models/environment.ts`
- `models/system.ts`
- `hooks/useGame/storyState.ts`
- `hooks/useGame/stateTransforms.ts`
- prompt cleanup reference: `prompts/core/data.ts`
- context cleanup reference: `hooks/useGame/systemPromptBuilder.ts`
- historical settings key: `festivals`
- exact registry string for tests: settings key: `festivals`

Festivals should not affect game content. Existing save/settings values can be
dropped in the environment-schema migration.

### `weather_game_system`

Current residue:

- `models/environment.ts`
- `hooks/useGame/storyState.ts`
- `hooks/useGame/stateTransforms.ts`
- historical save field: `环境.天气`

Weather is `prose_atmosphere_only`: the AI may describe rain, heat, wind, or
light in prose, but weather is no longer a structured game system.
