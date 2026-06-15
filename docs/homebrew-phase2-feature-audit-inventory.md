# Homebrew Phase 2 Feature Audit Inventory

> 日期：2026-06-16
>
> Phase 2 逐项讨论工作台。默认状态只使用：`明确保留候选`、
> `明确删除候选`、`待讨论`。讨论结论先留空，等用户逐项确认。
> `docs/homebrew-dead-feature-registry.md` 中的 live residue 不是保留功能；
> 若在 Phase 2 开始前仍存在，应优先删除或迁移出当前主状态。

| 功能域 | 细项 | 当前入口或主要文件 | 默认状态 | Phase 2 讨论结论 | 若删除必须删到哪里 |
| --- | --- | --- | --- | --- | --- |
| 应用壳 | 主页 | `components/layout/LandingPage.tsx`, `App.tsx` | 明确保留候选 |  | 入口、路由状态、首页按钮、相关 smoke |
| 应用壳 | 桌面布局 | `components/layout`, `App.tsx` | 明确保留候选 |  | layout 组件、样式、props、测试 |
| 应用壳 | TopBar | `components/layout/TopBar.tsx` | 待讨论 |  | 顶栏入口、状态展示、主题/时间展示 |
| 应用壳 | LeftPanel | `components/layout/LeftPanel.tsx` | 待讨论 |  | 左栏状态卡、资源展示、旧字段显示 |
| 应用壳 | RightPanel | `components/layout/RightPanel.tsx` | 待讨论 |  | 右栏入口、modal props、快捷动作 |
| 应用壳 | 全局 modal state | `App.tsx`, `hooks/useGameState.ts`, `hooks/useGame.ts` | 待讨论 |  | state、lazy import、props、入口按钮 |
| 应用壳 | 主题/视觉设置 | `components/features/Settings/ThemeSettings.tsx`, `VisualSettings.tsx`, `styles` | 明确保留候选 |  | settings schema、默认设置、UI 和存档字段 |
| 主聊天 | 聊天记录 | `components/features/Chat`, `types.ts` | 明确保留候选 |  | history model、render、save/load |
| 主聊天 | 输入框 | `components/features/Chat`, `App.tsx` | 明确保留候选 |  | 输入组件、发送状态、快捷键 |
| 主聊天 | 行动选项 | `services/ai/storyResponseParser.ts`, `components/features/Chat` | 明确保留候选 |  | parser、UI、prompt protocol |
| 主聊天 | 回合状态 | `hooks/useGame/sendWorkflow.ts`, `hooks/useGame.ts` | 明确保留候选 |  | loading/progress state、后台队列 |
| 主聊天 | 消息渲染 | `components/features/Chat` | 明确保留候选 |  | message renderer、raw view、fallback |
| 主聊天 | 正文/对白 fallback | `services/ai/storyResponseParser.ts`, `hooks/useGame/mainStoryRequest.ts` | 明确保留候选 |  | parser fallback、错误恢复 |
| AI 文本 | OpenAI-compatible API 配置 | `utils/apiConfig.ts`, `components/features/Settings/ApiSettings.tsx` | 明确保留候选 |  | settings schema、local mirror、UI |
| AI 文本 | 阶段模型选择 | `components/features/Settings/*ModelSettings.tsx`, `utils/apiConfig.ts` | 明确保留候选 |  | stage settings、默认配置、调用点 |
| AI 文本 | 独立 API 模式 | `components/features/Settings/IndependentApiGptModeSettings.tsx` | 待讨论 |  | 设置项、UI、调用分流 |
| AI 文本 | 主剧情请求 | `hooks/useGame/mainStoryRequest.ts`, `services/ai/chatCompletionClient.ts` | 明确保留候选 |  | 请求封装、stream、日志 |
| AI 文本 | 响应 parser | `services/ai/storyResponseParser.ts` | 明确保留候选 |  | 标签 parser、测试、fallback |
| AI 文本 | 错误恢复 | `hooks/useGame/sendWorkflow.ts`, `utils/chatRecovery.ts` | 明确保留候选 |  | parse recovery、重试、诊断 |
| Prompt 系统 | core/runtime prompt | `prompts/core`, `prompts/runtime` | 明确保留候选 |  | prompt registry、引用、tests |
| Prompt 系统 | PromptManager | `components/features/Settings/PromptManager.tsx` | 明确保留候选 |  | UI、内置条目、IndexedDB |
| Prompt 系统 | 内置提示词接管 | `utils/builtinPrompts.ts`, `services/dbService.ts` | 明确保留候选 |  | builtin entries、reset、migration |
| Prompt 系统 | 本地 prompt snapshot | `hooks/useGame/saveCoordinator.ts`, `models/system.ts` | 待讨论 |  | save schema、snapshot 写入、读取 |
| Prompt 系统 | prompt reset/migration | `utils/builtinPrompts.ts`, `services/dbService.ts` | 明确保留候选 |  | migration、reset UI、本地覆盖清理 |
| Tavern Preset | 酒馆预设导入 | `components/features/Settings/TavernPresetSettings.tsx`, `utils/tavernPreset.ts` | 明确保留候选 |  | importer、storage、UI |
| Tavern Preset | 消息链生成 | `hooks/useGame/promptRuntime.ts` | 明确保留候选 |  | message builder、token count、tests |
| Tavern Preset | preset 顺序 | `utils/tavernPreset.ts`, `hooks/useGame/promptRuntime.ts` | 待讨论 |  | ordering logic、UI |
| Tavern Preset | 世界书/提示词混合注入 | `hooks/useGame/systemPromptBuilder.ts`, `promptRuntime.ts` | 明确保留候选 |  | injection logic、scope、tests |
| 世界书 | 世界书 CRUD | `components/features/Worldbook`, `utils/worldbook.ts` | 明确保留候选 |  | UI、model、dbService |
| 世界书 | 导入导出 | `components/features/Worldbook`, `utils/worldbook.ts` | 明确保留候选 |  | importer/exporter、file UI |
| 世界书 | 默认世界书 | `public/worldbook-presets`, `utils/worldbook.ts` | 待讨论 |  | preset assets、dedupe、migration |
| 世界书 | 关键词/作用域/预算 | `models/worldbook.ts`, `utils/worldbook.ts` | 明确保留候选 |  | matcher、budget、tests |
| 世界书 | `extra_worldbooks` | `services/dbService.ts`, `hooks/useGame/config` | 待讨论 |  | IndexedDB key、migration、merge |
| 记忆 | 短期/长期记忆 | `hooks/useGame/memoryUtils.ts`, `models/system.ts` | 明确保留候选 |  | model、prompts、UI、save |
| 记忆 | 记忆召回 | `prompts/runtime/recall.ts`, `hooks/useGame` | 明确保留候选 |  | recall model settings、workflow |
| 记忆 | 记忆整理 | `prompts/runtime/memoryRefine.ts`, `components/features/Memory` | 明确保留候选 |  | refine workflow、settings |
| 记忆 | NPC 记忆 | `hooks/useGame/npcMemorySummary.ts`, `components/features/Memory` | 待讨论 |  | NPC memory prompts、UI、state |
| 记忆 | Memory UI | `components/features/Memory` | 明确保留候选 |  | modal、settings、manual actions |
| 记忆 | token 裁剪 | `utils/tokenEstimate.ts`, `hooks/useGame/systemPromptBuilder.ts` | 明确保留候选 |  | budget logic、diagnostics |
| 存档 | IndexedDB | `services/dbService.ts` | 明确保留候选 |  | stores、migration、local keys |
| 存档 | 存档树 | `components/features/SaveLoad`, `services/saveArchiveService.ts` | 明确保留候选 |  | tree model、UI、tests |
| 存档 | 手动/自动存档 | `hooks/useGame/saveCoordinator.ts` | 明确保留候选 |  | autosave workflow、history |
| 存档 | ZIP 导入导出 | `services/saveArchiveService.ts`, `SaveLoadModal.tsx` | 明确保留候选 |  | archive service、UI、tests |
| 存档 | StorageManager | `components/features/Settings/StorageManager.tsx` | 明确保留候选 |  | cleanup UI、db helpers |
| 存档 | 旧字段强迁移 | `services/dbService.ts`, `hooks/useGame/saveCoordinator.ts` | 明确保留候选 |  | normalize/migration、tests |
| 新建游戏 | 新建向导 | `components/features/NewGame/NewGameWizard.tsx` | 明确保留候选 |  | wizard UI、opening flow |
| 新建游戏 | DIY 地图 | `utils/newGameDiy.ts`, `components/features/NewGame` | 待讨论 |  | map draft model、UI、world generation |
| 新建游戏 | 性别选择 | `NewGameWizard.tsx`, `utils/openingConfig.ts` | 明确保留候选 |  | opening config、prompt constraints |
| 新建游戏 | 货币设置 | `utils/currencyDisplay.ts`, `NewGameWizard.tsx` | 待讨论 |  | currency profile、settings、tests |
| 新建游戏 | 开局 preset | `data/newGamePresets.ts`, `utils/openingConfig.ts` | 待讨论 |  | presets、mode profiles、tests |
| 新建游戏 | 初始组织生成 | `utils/openingConfig.ts`, `prompts/runtime/openingConfig.ts`, `hooks/useGame/storyState.ts` | 待讨论 |  | 保留组织玩法语义；若重构，旧 `开局生成门派` 字段、玩家组织 schema、prompt context 和存档字段一起迁移或删除 |
| 新建游戏 | 自定义 preset | `components/features/NewGame`, `services/dbService.ts` | 待讨论 |  | storage、UI、import/export |
| 新建游戏 | 默认世界生成 | `hooks/useGame/worldGenerationWorkflow.ts`, `prompts/runtime/worldSetup.ts` | 明确保留候选 |  | generation prompts、foundation parser |
| 本地模式包 | bundled/local modules | `data/creativeWorkshopModules.ts`, `services/creativeWorkshop.ts` | 明确保留候选 |  | bundled data、local storage |
| 本地模式包 | JSON 导入导出 | `components/features/Workshop`, `services/creativeWorkshop.ts` | 明确保留候选 |  | file IO、validation、tests |
| 本地模式包 | 模式包应用 | `utils/workshopEngine.ts`, `NewGameWizard.tsx` | 明确保留候选 |  | apply pipeline、opening config |
| 本地模式包 | CurrencySystemEditor | `components/features/Workshop` | 待讨论 |  | editor UI、currency schema |
| 本地模式包 | 工坊命名是否保留 | `components/features/Workshop` | 待讨论 |  | UI copy、routes、docs |
| 世界/环境/时间 | 世界状态 | `models/world.ts`, `hooks/useGame/storyState.ts` | 明确保留候选 |  | world model、prompts、save |
| 世界/环境/时间 | 地点描述 | `models/environment.ts`, `stateTransforms.ts` | 明确保留候选 |  | env model、prompt/context |
| 世界/环境/时间 | 旅程天数 | `models/environment.ts`, `timeUtils.ts` | 待讨论 |  | time parser、UI、save |
| 世界/环境/时间 | 日期时间 | `hooks/useGame/timeUtils.ts`, `TopBar.tsx` | 明确保留候选 |  | canonical time、display、commands |
| 世界/环境/时间 | 轻量时间系统候选 | 新设计 | 待讨论 |  | time model、actions、tests |
| 地图/地点 | 六层地点树 | `models/world.ts`, `utils/mapSpatial.ts` | 明确保留候选 |  | map layers、validators、UI |
| 地图/地点 | LocationBrowser | `components/features/Map` | 待讨论 |  | browser UI、selection state |
| 地图/地点 | RegionMap/GridMap | `components/features/Map` | 待讨论 |  | renderers、CSS、tests |
| 地图/地点 | 地图更新 AI | `hooks/useGame/mapUpdateWorkflow.ts`, `prompts/runtime/map*` | 待讨论 |  | AI map prompts、workflow |
| 地图/地点 | NPC 位置匹配 | `utils/mapNpcLocation.ts`, `hooks/useGame/npcContext.ts` | 待讨论 |  | matching rules、social integration |
| 角色 | 玩家属性 | `models/character.ts`, `CharacterModal.tsx` | 明确保留候选 |  | model、UI、prompts |
| 角色 | 身体状态 | `models/character.ts`, `prompts/stats/body.ts` | 待讨论 |  | health fields、prompt rules |
| 角色 | BUFF/DEBUFF | `models/character.ts`, `stateTransforms.ts` | 待讨论 |  | state fields、UI、commands |
| 角色 | 天赋 | `types.ts`, `data/presets.ts`, `NewGameWizard.tsx` | 待讨论 |  | preset data、UI、save |
| 角色 | 出身 | `types.ts`, `data/presets.ts`, `NewGameWizard.tsx` | 待讨论 |  | backgrounds、opening items |
| 角色 | 体征 | `models/character.ts`, `CharacterProfileCard.tsx` | 待讨论 |  | profile fields、image prompt |
| 角色 | 属性点 | `utils/attributePoints.ts`, `__tests__` | 待讨论 |  | point logic、tests、UI |
| 角色 | 死亡判定 | `services/ai/storyResponseParser.ts`, `__tests__/death-judgment*` | 待讨论 |  | parser、state guard、tests |
| 社交/NPC | NPC 档案 | `models/social.ts`, `components/features/Social` | 明确保留候选 |  | model、UI、image archive |
| 社交/NPC | 关系/好感/亲密 | `models/social.ts`, `SocialModal.tsx` | 明确保留候选 |  | relationship fields、prompts |
| 社交/NPC | 是否在场 | `models/social.ts`, `npcContext.ts` | 待讨论 |  | presence state、AI constraints |
| 社交/NPC | 队友 | `components/features/Team`, `models/social.ts` | 待讨论 |  | team UI、state、tasks |
| 社交/NPC | 头像 | `hooks/useGame/npcImage*`, `ImageManager` | 明确保留候选 |  | image records、cache、UI |
| 社交/NPC | NPC 留存 | `utils/npcRetentionGuard.ts` | 待讨论 |  | retention rules、tests |
| 社交/NPC | 位置一致性 | `mapNpcLocation.ts`, `npcContext.ts` | 待讨论 |  | local guard、map/social sync |
| 女主/剧情规划 | StoryModal | `components/features/Story/StoryModal.tsx` | 待讨论 |  | story UI、planning state |
| 女主/剧情规划 | HeroinePlanModal | `components/features/Story/HeroinePlanModal.tsx` | 明确保留候选 |  | heroine plan model/UI |
| 女主/剧情规划 | 后宫模式 | `models/heroinePlan.ts`, `prompts/core/heroinePlan*` | 明确保留候选 |  | prompt rules、settings |
| 女主/剧情规划 | NTL/harem style | `prompts/core/heroinePlan*`, settings | 明确保留候选 |  | prompt/settings/UI |
| 女主/剧情规划 | 主推女主机制是否重构 | `models/heroinePlan.ts`, prompts | 待讨论 |  | model、prompt、UI |
| 背包/装备/货币 | 物品 | `models/item.ts`, `InventoryModal.tsx` | 明确保留候选 |  | item model、UI、commands |
| 背包/装备/货币 | 装备槽 | `models/character.ts`, `EquipmentModal.tsx` | 明确保留候选 |  | equipment state、UI |
| 背包/装备/货币 | 消耗品 | `utils/autoConsumables.ts`, `models/item.ts` | 待讨论 |  | effect logic、tests |
| 背包/装备/货币 | 物品效果 | `models/item.ts`, `utils/taskRewards.ts` | 待讨论 |  | effect schema、command handling |
| 背包/装备/货币 | 货币显示 | `utils/currencyDisplay.ts`, UI | 明确保留候选 |  | currency model、formatters |
| 背包/装备/货币 | 奖励落地 | `utils/taskRewards.ts`, `responseCommandProcessor.ts` | 待讨论 |  | reward parser、tests |
| 背包/装备/货币 | 账务本地化候选 | 新设计 | 明确保留候选 |  | local transaction layer、tests |
| 任务/约定/队伍 | Task | `components/features/Task`, `models/task.ts` | 待讨论 |  | task model、UI、prompts |
| 任务/约定/队伍 | Agreement | `components/features/Agreement`, `models/task.ts` | 待讨论 |  | agreement model/UI |
| 任务/约定/队伍 | Team | `components/features/Team`, `models/social.ts` | 待讨论 |  | team state/UI |
| 任务/约定/队伍 | 奖励 | `utils/taskRewards.ts` | 待讨论 |  | reward rules、tests |
| 任务/约定/队伍 | 事件调度候选 | 新设计 | 待讨论 |  | scheduler model、prompts |
| 任务/约定/队伍 | 队友关系 | `models/social.ts`, `TeamModal.tsx` | 待讨论 |  | relationship sync、UI |
| 轻量对抗 | 旧战斗状态壳 | `hooks/useGame.ts`, `hooks/useGame/storyState.ts`, `saveCoordinator.ts`, `stateHelpers.ts` | 明确删除候选 |  | `战斗` state root、empty helpers、save/load plumbing、variable registry、tests；未来对抗系统另起模型 |
| 图片管理 | ImageManager | `components/features/ImageManager` | 明确保留候选 |  | modal、records、settings |
| 图片管理 | 角色/NPC/玩家/场景/秘密/物品图片 | `services/ai/imageTasks.ts`, `hooks/useGame/*Image*` | 明确保留候选 |  | task types、archives、UI |
| 图片管理 | 缓存 | `utils/imageAssets.ts`, IndexedDB | 明确保留候选 |  | cache storage、cleanup |
| 图片管理 | 归档 | `sceneImageArchiveWorkflow.ts`, `npcImageStateWorkflow.ts` | 明确保留候选 |  | archive rules、save |
| 图片管理 | 失败重试 | `services/ai/imageTasks.ts`, UI | 待讨论 |  | retry state、diagnostics |
| 文生图后端 | ComfyUI | `services/ai/image*`, Comfy settings | 明确保留候选 |  | settings、proxy、workflow、tests |
| 文生图后端 | NovelAI | `functions/api/novelai`, image services | 明确删除候选 |  | API route、settings、tests、PNG parser dependencies |
| 文生图后端 | OpenAI/GPT image | `services/ai/imageTasks.ts`, settings | 明确删除候选 |  | backend enum、settings、tests |
| 文生图后端 | pucoding | image backend settings/proxy | 明确删除候选 |  | backend registry、settings、scripts |
| 文生图后端 | image-host/S3 | `services/imageHost*`, `functions/api/image-*` | 明确删除候选 |  | services、API、settings、tests |
| 文生图后端 | preset-image proxy | `functions/api/preset-image*`, scripts | 明确删除候选 |  | proxy route、scripts、tests |
| ComfyUI 细项 | workflow 保存 | `components/features/Settings/ImageGenerationSettings.tsx` | 明确保留候选 |  | workflow schema、storage、UI |
| ComfyUI 细项 | workflow validation/tools | `utils/comfy*`, settings | 明确保留候选 |  | validators、tests、UI |
| ComfyUI 细项 | Comfy proxy | `functions/api/comfy*`, image services | 待讨论 |  | route、env、tests |
| ComfyUI 细项 | CNB sync/start scripts | `scripts/cnb-*` | 待讨论 |  | npm scripts、docs、env |
| 图片资源 | `public/assets/item-presets` | public assets | 待讨论 |  | assets、manifest、tests |
| 图片资源 | 默认物品图 | `data/item*`, public assets | 待讨论 |  | data、assets、image tasks |
| 图片资源 | 武侠物品资源是否删除或现代化 | item preset assets/data | 明确删除候选 |  | assets、preset data、tests |
| 图片资源 | 背景图暂缓 | public/background assets | 待讨论 |  | assets、CSS、homepage |
| 诊断/开发工具 | diagnostic report/log/context | `services/diagnostic*` | 待讨论 |  | services、UI、settings |
| 诊断/开发工具 | ContextViewer | `components/features/Settings/ContextViewer.tsx` | 明确保留候选 |  | modal、context builder |
| 诊断/开发工具 | HistoryViewer | `components/features/Settings/HistoryViewer.tsx` | 明确保留候选 |  | modal、history raw |
| 诊断/开发工具 | VariableManager | `components/features/Settings/VariableManager.tsx` | 待讨论 |  | UI、state edit paths |
| 诊断/开发工具 | NpcManager | `components/features/Settings/NpcManager.tsx` | 待讨论 |  | UI、NPC state edit |
| 诊断/开发工具 | WorkflowGraph | `components/features/Settings/WorkflowGraphSettings.tsx` | 待讨论 |  | graph UI、settings |
| Cloudflare/Worker | 本地/API/图片代理价值 | `functions/api`, `wrangler.jsonc` | 待讨论 |  | routes、env、worker build |
| Cloudflare/Worker | 云同步/社区/APK/公共运营用途 | deleted paths / grep gate | 明确删除候选 |  | any reappearing route/script/test |
| 测试体系 | Vitest | `vitest.config.ts`, `__tests__`, `tests` | 明确保留候选 |  | config、tests |
| 测试体系 | E2E harness | `tests/*.spec.mjs`, Playwright config | 待讨论 |  | specs、helpers、fixtures |
| 测试体系 | fixture | `__tests__`, `tests/fixtures` | 待讨论 |  | old topic fixtures、snapshots |
| 测试体系 | 已删功能测试 | deleted/grep gate | 明确删除候选 |  | test files, imports, fixtures |
| 测试体系 | 核心回归测试边界 | registry, worldbook, save, parser tests | 明确保留候选 |  | focused suite definitions |
| 构建脚本 | `package.json` scripts | `package.json` | 明确保留候选 |  | unused scripts, docs, CI |
| 构建脚本 | CNB/image scripts | `scripts/cnb-*`, image scripts | 待讨论 |  | scripts、npm entries、tests |
| 构建脚本 | worker scripts | `scripts/build-worker.mjs`, `wrangler.jsonc` | 待讨论 |  | worker build/deploy commands |
| 构建脚本 | preset image scripts | `scripts/generate-preset-item-images.mjs` | 明确删除候选 |  | script、npm entry、assets/tests |
| 构建脚本 | prompt stress test | `scripts/promptStressTest.js`, `npm run stress:test` | 明确保留候选 |  | 保留 harness；若删除旧场景，只删退役 prompt/题材断言和生成输出 |
