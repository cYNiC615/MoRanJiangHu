# Homebrew Dead Feature Registry

This registry records the current state of intentionally retired feature
families in the homebrew build. It is a working index, not a historical
changelog: keep completed work compact, and keep only the remaining surfaces
that affect cleanup decisions.

## Status Vocabulary

- `entrypoint_removed`: The feature is no longer reachable from the current
  playable desktop flow.
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
manual smoke is acceptable. Phase 1.5 is ready to start.

Phase 1.5 deletes unreachable frontend residue:

- public release/community/support homepage links;
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

## Current Phase 1 Snapshot

| Feature family | Current status | Remaining owner |
| --- | --- | --- |
| `novel_decomposition` | `entrypoint_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Later backend/model/prompt/storage cleanup |
| `new_game_fandom_entrypoints` | `entrypoint_removed`, `automatic_side_effect_removed`, `command_root_retired`, `backend_pending`, `storage_pending` | Later fandom/model/prompt cleanup |
| `music_playback` | `entrypoint_removed`, `backend_removed`, `storage_pending` | Strong storage migration only |
| `auction_house` | `entrypoint_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Phase 1.5 frontend residue, later backend/storage cleanup |
| `legacy_battle_system` | `entrypoint_removed`, `command_root_retired`, `active_prompt_schema_retired`, `backend_pending`, `storage_pending` | Phase 1.5 frontend residue, later replacement design |
| `wuxia_cultivation_system` | `entrypoint_removed`, `command_root_retired`, `active_prompt_schema_retired`, `backend_pending`, `storage_pending` | Phase 1.5 frontend residue, later model/prompt cleanup |
| `cloud_play_and_sync` | `entrypoint_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Later cloud/API/storage cleanup |
| `creative_workshop_cloud_ugc` | `entrypoint_removed`, `automatic_side_effect_removed`, `backend_pending`, `storage_pending` | Later workshop cloud/API cleanup |
| `online_presence_public_ops` | `entrypoint_removed`, `static_pages_removed`, `backend_pending`, `storage_pending` | Later operations/API/test cleanup |
| `apk_app_update_system` | `entrypoint_removed`, `backend_pending`, `storage_pending` | Later Android/APK/release cleanup |
| `mobile_frontend` | `entrypoint_removed`, `backend_pending` | Phase 1.5 frontend residue, later Capacitor/native cleanup |
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
| `prompt_manager_retired_prompts` | `components/features/Settings/PromptManager.tsx` still exposes retired prompt-pool items such as `core_realm`, and may mark them as runtime injected | First hide/archive and fix labels; later delete prompt files, models, and storage snapshots |
| `homepage_public_links` | Landing-page public release/community/support links such as changelog, tutorials, feedback, GitHub, Discord, and API-sharing copy | Keep local play, local mode packages, image manager, worldbook manager, and settings |
| `mobile_frontend` | `components/layout/MobileQuickMenu.tsx`, `components/features/NewGame/mobile/MobileNewGameWizard.tsx`, `components/features/Settings/mobile/MobileSettingsModal.tsx`, plus other unmounted mobile modals | Do not deep-delete Capacitor/native helpers in the same slice |
| `legacy_battle_system` | `components/features/Battle` and related unmounted battle UI | Future replacement is a new lightweight opposition system, not the old stance/kungfu battle model |
| `auction_house` | `components/features/AuctionHouse/AuctionHouseModal.tsx` | Leave `services/auctionHouse.ts`, model fields, storage, and tests to backend cleanup |
| `novel_decomposition` | `components/features/NovelDecomposition/NovelDecompositionWorkbenchModal.tsx` and retired settings panels | Leave services, prompt files, storage keys, and model migration to backend cleanup |
| `wuxia_cultivation_system` | `components/features/Kungfu`, `components/features/Sect`, `components/features/Skills` | Leave `models/kungfu.ts`, `models/sect.ts`, and prompt roots to model/prompt cleanup |

## Later Backend And Storage Cleanup Queue

### `novel_decomposition`

Current residue:

- `services/novelDecompositionPipeline.ts`
- `services/novelDecompositionRuntime.ts`
- `services/novelDecompositionStore.ts`
- `services/novelDecompositionInjection.ts`
- `prompts/runtime/novelDecomposition.ts`
- `prompts/runtime/novelDecompositionCot.ts`
- `models/novelDecomposition.ts`
- `functions/api/workshop/novel-decomposition.ts`
- storage keys: `novel_decomposition_datasets`,
  `novel_decomposition_tasks`, `novel_decomposition_snapshots`

Keep only generic context-window/worldbook-like injection concepts. Do not
preserve novel/fanfiction adaptation behavior.

### `new_game_fandom_entrypoints`

Current residue:

- `components/features/NewGame/NewGameWizard.tsx`
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`
- `models/fandomPlanning`
- `prompts/runtime/fandom*.ts`
- `data/creativeWorkshopModules.ts`
- `functions/api/fandom-presets`
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

Current residue:

- `components/features/Settings/PromptManager.tsx` visible retired prompt-pool
  entries such as `core_realm`
- `components/features/Kungfu`
- `components/features/Sect`
- `components/features/Skills`
- `models/kungfu.ts`
- `models/sect.ts`
- `prompts/stats/kungfu.ts`
- `prompts/core/realm.ts`
- historical save fields and legacy prompt/model surfaces

The homebrew default is modern urban with optional near-future sci-fi. Wuxia
and cultivation compatibility is not preserved.

Known current behavior: the no-change new-game path still tends to create a
wuxia world. That belongs to Phase 2 modern-urban defaultization, not Phase
1.5 frontend residue cleanup.

### `cloud_play_and_sync`

Current residue:

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

Local settings, local saves, and ZIP import/export stay.

### `creative_workshop_cloud_ugc`

Current residue:

- `components/features/Workshop/CreativeWorkshopModal.tsx`
- `components/features/Settings/ImageGenerationSettings.tsx`
- `services/creativeWorkshop.ts`
- `services/workshopNovelDecomposition.ts`
- `functions/api/workshop/modules.ts`
- `functions/api/workshop/novel-decomposition.ts`

Keep local mode packages, local JSON import/export, local ComfyUI workflow save,
and local injection preview. Delete community publishing/reporting/cloud module
paths later.

### `online_presence_public_ops`

Current residue:

- `services/onlinePresence.ts`
- `functions/api/admin/online`
- tests: `tests/online-ranking-session-regression.test.ts`,
  `tests/e2e-admin-online.spec.mjs`
- localStorage key: `moranjianghu.onlineHourlyHistory`

This is public operations surface, not part of the personal homebrew game loop.

### `apk_app_update_system`

Current residue:

- `services/appUpdate.ts`
- `services/nativeApkUpdater.ts`
- `utils/appUpdatePreferences.ts`
- `components/ui/ReleaseNotesModal.tsx`
- `functions/api/apk`
- `android`
- `capacitor.config.ts`
- APK/release package scripts in `package.json`
- localStorage key: `moranjianghu.apkAutoUpdateDisabled`

Do not keep APK compatibility as a cleanup constraint.

### `mobile_frontend`

Current residue:

- `components/layout/MobileQuickMenu.tsx`
- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`
- `components/features/Settings/mobile/MobileSettingsModal.tsx`
- other unmounted `Mobile*` feature modals
- responsive/mobile-only branches inside shared desktop files

Native/Capacitor helpers belong to the later Android/APK cleanup, not the first
Phase 1.5 frontend slice unless the dependency is already isolated.

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
