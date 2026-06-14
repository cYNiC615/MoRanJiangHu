# MoRanJiangHu Agent Notes

This file records current collaboration rules for the homebrew fork. Keep it short and current. Long historical notes should move to docs or git history instead of staying here forever.

## Project Direction

- This fork is being reshaped into a personal homebrew AI-native RPG framework.
- Default experience should move away from wuxia/xianxia toward modern urban, with possible near-future sci-fi expansion later.
- The useful core is the SillyTavern-like harness: prompt/worldbook injection, context budgeting, memory trimming, schema/tagged AI output, local parsing, local state, and local saves.
- Do not assume the project needs mobile, APK, cloud sync, community UGC, fandom, or novel-decomposition features. Those are planned simplification targets unless the user explicitly reintroduces them.
- Do not preserve old wuxia/xianxia save compatibility unless the user explicitly asks. This fork is currently personal-use first.
- Keep the male-oriented romance/intimacy experience and the "heroine" concept. Improve it for harem-style play instead of deleting it.
- Local settings, local API configuration, local game saves, save/load, and import/export must be preserved.

## Communication

- No fixed language requirement. Use Chinese or English naturally based on the conversation.
- Code, file paths, variable names, commands, and technical identifiers should stay as-is.
- Do not add customer-facing changelogs or release-note copy unless the user explicitly asks for them.
- The project is not currently operating as a stable customer-facing release product. Do not apply customer-support or public-release standards unless the user explicitly switches into release/deploy work.

## Git And Upstream Sync

- `origin` is the user's fork. `upstream` is the original project.
- Do not directly merge `upstream/main` into `main` during homebrew work.
- Preferred upstream intake flow:
  1. `git fetch upstream`
  2. Create or switch to a temporary review branch such as `codex/review-upstream-sync`.
  3. Inspect `main..upstream/main` with `git log`, `git diff --stat`, and targeted file diffs.
  4. Classify upstream changes before applying them.
  5. Prefer `cherry-pick` or small manual patches for useful fixes.
  6. Use a full merge only after reviewing conflicts and confirming it will not revive removed product directions.
- Usually worth taking from upstream: bug fixes, AI harness improvements, prompt/runtime parser fixes, local save fixes, worldbook/memory/context improvements, performance fixes, and broadly useful UI bug fixes.
- Be cautious with upstream changes in main turn flow, prompt protocol, save schema, settings schema, and generated release metadata.
- Usually skip unless explicitly requested: mobile UI, APK/Capacitor/update code, cloud sync, GitHub/WebDAV/object-storage sync, community UGC, fandom/original-work adaptation, novel decomposition, public release automation, and customer-facing content.
- If upstream conflicts with the homebrew direction, preserve the homebrew direction and ask before taking the change.
- If a build runs `release:sync` and only touches generated release metadata, do not include those generated changes in unrelated commits unless the task is a release task.

## Deployment And Release

- Never deploy without explicit user instruction.
- Only run deployment/publish/release commands when the user clearly asks to deploy, publish, release, or go live.
- For ordinary changes, build and test locally only.
- Do not bump version numbers, edit release metadata intentionally, upload APKs, publish manifests, or verify public release entrypoints unless the user explicitly starts release work.
- Cloudflare deployment is currently undecided. Keep related code only when it still serves local/API hosting needs; do not expand release automation.

## Secrets And Environment

- Never commit API keys, OAuth secrets, GitHub tokens, object-storage credentials, image-host tokens, Discord tokens, or AI keys.
- Keep real secrets only in local env files, user environment variables, local `.dev.vars`, local `.env.*`, or platform secrets.
- Commit only safe templates such as `.env.example` files.
- Frontend `VITE_` variables are build-time public variables; do not put secrets there.
- If environment variables are added, removed, or renamed, update safe templates and clearly report the local secret changes needed.

## Local File References

- Do not use local-file Markdown links or URL links in user-facing replies.
- Use plain backticked paths, preferably absolute Windows paths with `/`, for example `J:/moranjianghu/MoRanJiangHu/App.tsx:195`.

## Shell And Windows Rules

- When reading or writing UTF-8 JSON/text on PowerShell, do not rely on default console encoding. Prefer tools and commands that preserve UTF-8.
- `powershell.exe -Command "..." | tail -N` can return empty output even when the command succeeds. Prefer capturing the full command output directly.
- Finite commands such as builds, tests, compiles, installs, and git commands should run directly.
- Infinite commands such as HTTP servers, file watchers, dev servers, `wrangler dev`, and `tail -f` must be started as background processes.
- On Windows, `command &` does not reliably detach under Git Bash/MSYS2. Prefer `Start-Process -WindowStyle Hidden` for background helpers.

## Engineering Rules

- For bug fixes, trace the root cause. Do not stop at hiding raw errors, changing display text, or masking bad state when the upstream workflow/data issue can be repaired.
- Protect user changes in a dirty worktree. Do not revert unrelated local edits.
- Keep code changes scoped to the requested simplification or feature.
- If removing a feature, remove player-visible entrypoints first, then services/models/prompts/tests in a separate pass when safer.
- When uncertain whether a feature is still needed, keep it and mark it for later review instead of deleting it.

## UI Verification Rules

- For frontend/UI changes, check day/light mode readability before treating the task as done.
- New buttons, links, panels, badges, tooltips, chart labels, and helper text need sufficient contrast in day mode as well as dark themes.
- Loading, lazy-render, suspense, skeleton, and placeholder states should not use black or near-black backgrounds by default. Prefer theme surfaces or light/warm placeholders.
- Homepage panels, sidebars, stats, release info, support links, friend links, and footer blocks must not overlap the original centered title/menu column.
- Before homepage screenshots, close or dismiss release/update modals unless the modal is the subject of the check.
- Image viewer/preview modals should have an obvious close button in the top-right of the image.
- Character portraits in equipment-style modals should use `object-contain` when the full portrait matters.

## Local UI Debug Path

When UI verification needs a real in-game view, do not block on model/API configuration first. Prefer entering from an existing save.

Preferred path:

1. Build web assets with `npm run build` or the Windows-safe equivalent.
2. Start a local preview server as a background process.
3. Open the local preview URL.
4. If a reusable save package exists, import it through the save/load UI.
5. Load a manual or auto save and confirm the app reaches `view === 'game'`.

Fallback path:

1. Extract one save JSON from a reusable save archive if available.
2. Serve or inject it locally for browser debugging.
3. Write it into IndexedDB only as a local debugging aid.
4. Reload and verify through the app UI.

Known local save/debug files:

- `components/features/SaveLoad/SaveLoadModal.tsx`
- `hooks/useGame/saveLoad/saveLoadWorkflow.ts`
- `hooks/useGame/saveCoordinator.ts`
- `services/dbService.ts`
- `services/saveArchiveService.ts`
- `hooks/useGameState.ts`
- `App.tsx`

## Current Homebrew Simplification Notes

- Worldbook, tavern preset, memory, token/context budgeting, local parsing, local saves, and local settings are core.
- Fandom/original-work adaptation and novel decomposition are planned removal targets.
- Wuxia, xianxia, sect, kungfu, old battle, weather-as-system, and festival systems are planned removal targets.
- The old battle module should be replaced later by a new lightweight, more system-driven conflict/opposition system, not by preserving the current kungfu/positioning combat model.
- Mobile UI, Capacitor, Android, APK update, and APK release flows are planned removal targets.
- GitHub sync, WebDAV sync, object-storage sync, cloud play, online presence, and community UGC are planned removal targets.
- Local mode packs/worldbook injection may be kept, but cloud workshop/community submission should be removed or disabled.
- Image generation is undecided. Do not expand it until the user confirms whether it is part of the homebrew core.
- Auction house/market is undecided. It may become a modern market/second-hand/black-market system, or it may be removed.
- Social/NPC relationships are core and may be expanded. NPC presence and location tracking are buggy and should be treated as a subsystem to disable, constrain, or redesign carefully.

## Game Logic Candidates

Good first candidates for moving from AI-driven state changes to local code logic:

- Lightweight time progression, date, and journey/day counters. Weather and festivals should not be game systems.
- Location movement, map hierarchy validity, and NPC presence/location consistency.
- Inventory, equipment, money, trading, item consumption, and item rewards.
- Action option scaffolding based on current state, with AI used for prose polish.
- Event/task scheduling after the simpler state machines are stable.

Keep AI responsible for open-ended prose, dialogue, roleplay, and creative scene writing unless the user asks for a narrower deterministic system.

## Retained Implementation Notes

Keep these until the corresponding module is removed or rewritten:

- Auction item extraction should prefer AI-based extraction when enabled, with regex as fallback. Do not force-generate auction entries when no valid items exist.
- Item image generation should be limited to one concurrent task at a time.
- Item image prompts should describe physical appearance only, not game mechanics.
- The map system should use the six-layer tree: `寰宇 -> 大地点 -> 中地点 -> 小地点 -> 区地点 -> 子地点`.
- Do not reintroduce old coordinate map fields: `世界.地图`, `世界.建筑`, `世界.地图建筑`, `世界.地图道路`, `世界.地图人物`.
- `具体地点` is an environment/location field, not a map layer. Normalize room/interior-like nodes toward `子地点` where needed.
- Map updates should remain separated from world evolution. Queue order should stay: `文章优化 -> 变量生成 -> 动态世界 -> 规划分析 -> 地图更新 -> 最终落盘`.
- NPC location matching should prefer precise location paths. Broad ownership fields are not enough to place an NPC into a specific room.
- When a social NPC is confirmed present in the current scene, local processing should maintain `当前位置`, `当前地点`, and `位置路径` where available.
- In-game time must not roll back or reset to real-world dates. `游戏初始时间` is opening-only and should not be rewritten during normal turns.
- Changing `prompts/*` may not affect runtime if IndexedDB has enabled builtin prompt overrides or saved extra worldbooks. Treat builtin prompt/worldbook reset or migration as part of prompt cleanup work.
- External AI test credentials, image-host credentials, and object-storage credentials must stay in local user environment variables only.
