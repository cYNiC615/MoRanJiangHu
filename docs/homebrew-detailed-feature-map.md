# Homebrew Detailed Feature Map

> 日期：2026-06-16
>
> 当前状态详尽功能地图。Phase 2 的删改决策已经收口；本文记录剩余功能的结构边界、后续重构方向和已清理功能的防回归面。
> 主阶段边界与 Phase 2.5 规则见 `docs/homebrew-function-map-and-simplification-decision-table.md`。

## Current Direction Snapshot

- 应用壳、TopBar、LeftPanel、RightPanel 和当前全局 modal state 都属于 Phase 2.5 结构整理面，功能语义不变。
- AI 文本、Prompt、Tavern preset、世界书、`extra_worldbooks`、prompt snapshot、NPC 记忆、本地存档和本地设置是核心基底。
- 货币系统已收束为现代单一货币；层级货币、货币编辑器、旧三层 fallback、旧资源开关、钱包别名字段和相关模式包编辑能力已删除或迁移。
- 旧拍卖行系统已清理；题材市场口径只作为通用 `marketName`/`marketVerb` 存在，不恢复 auction/retired-market 命名。
- 本地模式包机制继续作为本地导入、注入和模式配置能力；玩家可见 UI copy 已改为“本地模式包”，内部 `creativeWorkshop`/`创意工坊模块` 兼容命名只做后续机械迁移。
- 世界/地图/时间、角色、社交/NPC、女主/后宫规划、任务、背包、装备和图片管理都是后续迭代对象，重构时不得改变当前玩法语义。
- 七部位身体系统不是简单删除项，进入身体/伤势模型专项设计；私密档案部位、装备槽和对白标签保护不归入这次删除面。
- 约定系统已删除，后续语义只在任务系统中重建。
- 文生图后端已收束为 ComfyUI-only；非 ComfyUI 后端、外部图片存储/代理链路及其设置、代理、脚本和测试已删除。
- 图片资源暂时全部留在当前资产面，即使是旧武侠题材资源也不阻塞 Phase 2.5。
- 诊断/开发工具、Cloudflare/Worker、CNB、脚本和测试只围绕 ComfyUI 后端、diagnostics 与本地/API 辅助价值存在；公共云同步/OAuth/APK/社区运营面、对象存储存档元数据和固定公开域名 route 已删除。
- 依赖 `.tmp-release-assets/WuXia_Save_Data.zip` 的旧 release/Wuxia Playwright 规格已删除；E2E 只维持仍可运行的本地回归面。
- 初始组织生成已泛化为组织/成员口径，`玩家组织` 作为通用组织状态根继续承载这块功能。
- 旧修炼/战斗专用 prompt 槽位与内部旧成长开关参数链已清理；模式包的能力体系字段暂按现有 schema 存在，后续只在模式包 schema 重构时处理。
| 功能域 | 细项 | 当前入口或主要文件 | 后续方向 | 结构边界 / 审计面 |
| --- | --- | --- | --- | --- |
| 应用壳 | 主页 | `components/layout/LandingPage.tsx`, `App.tsx` | 稳定功能 | 功能语义不变。审计面：入口、路由状态、首页按钮、相关 smoke |
| 应用壳 | 桌面布局 | `components/layout`, `App.tsx` | 稳定功能 | 功能语义不变。审计面：layout 组件、样式、props、测试 |
| 应用壳 | TopBar | `components/layout/TopBar.tsx` | 稳定功能 | 功能语义不变。审计面：顶栏入口、状态展示、主题/时间展示 |
| 应用壳 | LeftPanel | `components/layout/LeftPanel.tsx` | 专项设计后再动 | 后续只清旧字段显示。审计面：左栏状态卡、资源展示、旧字段显示 |
| 应用壳 | RightPanel | `components/layout/RightPanel.tsx` | 稳定功能 | 功能语义不变。审计面：右栏入口、modal props、快捷动作 |
| 应用壳 | 全局 modal state | `App.tsx`, `hooks/useGameState.ts`, `hooks/useGame.ts` | Phase2.5结构重构 | modal 架构重构暂缓到后续重构/功能开发前。审计面：state、lazy import、props、入口按钮 |
| 应用壳 | 主题/视觉设置 | `components/features/Settings/ThemeSettings.tsx`, `VisualSettings.tsx`, `styles` | 稳定功能 | 功能语义不变。审计面：settings schema、默认设置、UI 和存档字段 |
| 主聊天 | 聊天记录 | `components/features/Chat`, `types.ts` | 稳定功能 | 功能语义不变。审计面：history model、render、save/load |
| 主聊天 | 输入框 | `components/features/Chat`, `App.tsx` | 稳定功能 | 功能语义不变。审计面：输入组件、发送状态、快捷键 |
| 主聊天 | 行动选项 | `services/ai/storyResponseParser.ts`, `components/features/Chat` | 稳定功能 | 功能语义不变。审计面：parser、UI、prompt protocol |
| 主聊天 | 回合状态 | `hooks/useGame/sendWorkflow.ts`, `hooks/useGame.ts` | 稳定功能 | 功能语义不变。审计面：loading/progress state、后台队列 |
| 主聊天 | 消息渲染 | `components/features/Chat` | 稳定功能 | 功能语义不变。审计面：message renderer、raw view、fallback |
| 主聊天 | 正文/对白 fallback | `services/ai/storyResponseParser.ts`, `hooks/useGame/mainStoryRequest.ts` | 稳定功能 | 功能语义不变。审计面：parser fallback、错误恢复 |
| AI 文本 | OpenAI-compatible API 配置 | `utils/apiConfig.ts`, `components/features/Settings/ApiSettings.tsx` | 稳定功能 | 功能语义不变。审计面：settings schema、local mirror、UI |
| AI 文本 | 阶段模型选择 | `components/features/Settings/*ModelSettings.tsx`, `utils/apiConfig.ts` | 稳定功能 | 功能语义不变。审计面：stage settings、默认配置、调用点 |
| AI 文本 | 独立 API 模式 | `components/features/Settings/IndependentApiGptModeSettings.tsx` | 稳定功能 | 功能语义不变。审计面：设置项、UI、调用分流 |
| AI 文本 | 主剧情请求 | `hooks/useGame/mainStoryRequest.ts`, `services/ai/chatCompletionClient.ts` | 稳定功能 | 功能语义不变。审计面：请求封装、stream、日志 |
| AI 文本 | 响应 parser | `services/ai/storyResponseParser.ts` | 稳定功能 | 功能语义不变。审计面：标签 parser、测试、fallback |
| AI 文本 | 错误恢复 | `hooks/useGame/sendWorkflow.ts`, `utils/chatRecovery.ts` | 稳定功能 | 功能语义不变。审计面：parse recovery、重试、诊断 |
| Prompt 系统 | core/runtime prompt | `prompts/core`, `prompts/runtime` | 稳定功能 | 功能语义不变。审计面：prompt registry、引用、tests |
| Prompt 系统 | PromptManager | `components/features/Settings/PromptManager.tsx` | 稳定功能 | 功能语义不变。审计面：UI、内置条目、IndexedDB |
| Prompt 系统 | 内置提示词接管 | `utils/builtinPrompts.ts`, `services/dbService.ts` | 稳定功能 | 功能语义不变。审计面：builtin entries、reset、migration |
| Prompt 系统 | 本地 prompt snapshot | `hooks/useGame/saveCoordinator.ts`, `models/system.ts` | 稳定功能 | 功能语义不变。审计面：save schema、snapshot 写入、读取 |
| Prompt 系统 | prompt reset/migration | `utils/builtinPrompts.ts`, `services/dbService.ts` | 稳定功能 | 功能语义不变。审计面：migration、reset UI、本地覆盖清理 |
| Tavern Preset | 酒馆预设导入 | `components/features/Settings/TavernPresetSettings.tsx`, `utils/tavernPreset.ts` | 稳定功能 | 功能语义不变。审计面：importer、storage、UI |
| Tavern Preset | 消息链生成 | `hooks/useGame/promptRuntime.ts` | 稳定功能 | 功能语义不变。审计面：message builder、token count、tests |
| Tavern Preset | preset 顺序 | `utils/tavernPreset.ts`, `hooks/useGame/promptRuntime.ts` | 稳定功能 | 功能语义不变。审计面：ordering logic、UI |
| Tavern Preset | 世界书/提示词混合注入 | `hooks/useGame/systemPromptBuilder.ts`, `promptRuntime.ts` | 稳定功能 | 功能语义不变。审计面：injection logic、scope、tests |
| 世界书 | 世界书 CRUD | `components/features/Worldbook`, `utils/worldbook.ts` | 稳定功能 | 功能语义不变。审计面：UI、model、dbService |
| 世界书 | 导入导出 | `components/features/Worldbook`, `utils/worldbook.ts` | 稳定功能 | 功能语义不变。审计面：importer/exporter、file UI |
| 世界书 | 默认世界书 | `public/worldbook-presets`, `utils/worldbook.ts` | 稳定功能 | 功能语义不变。审计面：preset assets、dedupe、migration |
| 世界书 | 关键词/作用域/预算 | `models/worldbook.ts`, `utils/worldbook.ts` | 稳定功能 | 功能语义不变。审计面：matcher、budget、tests |
| 世界书 | `extra_worldbooks` | `services/dbService.ts`, `hooks/useGame/config` | 稳定功能 | 功能语义不变。审计面：IndexedDB key、migration、merge |
| 记忆 | 短期/长期记忆 | `hooks/useGame/memoryUtils.ts`, `models/system.ts` | 稳定功能 | 功能语义不变。审计面：model、prompts、UI、save |
| 记忆 | 记忆召回 | `prompts/runtime/recall.ts`, `hooks/useGame` | 稳定功能 | 功能语义不变。审计面：recall model settings、workflow |
| 记忆 | 记忆整理 | `prompts/runtime/memoryRefine.ts`, `components/features/Memory` | 稳定功能 | 功能语义不变。审计面：refine workflow、settings |
| 记忆 | NPC 记忆 | `hooks/useGame/npcMemorySummary.ts`, `components/features/Memory` | 稳定功能 | 功能语义不变。审计面：NPC memory prompts、UI、state |
| 记忆 | Memory UI | `components/features/Memory` | 稳定功能 | 功能语义不变。审计面：modal、settings、manual actions |
| 记忆 | token 裁剪 | `utils/tokenEstimate.ts`, `hooks/useGame/systemPromptBuilder.ts` | 稳定功能 | 功能语义不变。审计面：budget logic、diagnostics |
| 存档 | IndexedDB | `services/dbService.ts` | 稳定功能 | 功能语义不变。审计面：stores、migration、local keys |
| 存档 | 存档树 | `components/features/SaveLoad`, `services/saveArchiveService.ts` | 稳定功能 | 功能语义不变。审计面：tree model、UI、tests |
| 存档 | 手动/自动存档 | `hooks/useGame/saveCoordinator.ts` | 稳定功能 | 功能语义不变。审计面：autosave workflow、history |
| 存档 | ZIP 导入导出 | `services/saveArchiveService.ts`, `SaveLoadModal.tsx` | 稳定功能 | 功能语义不变。审计面：archive service、UI、tests |
| 存档 | StorageManager | `components/features/Settings/StorageManager.tsx` | 稳定功能 | 功能语义不变。审计面：cleanup UI、db helpers |
| 存档 | 旧字段强迁移 | `services/dbService.ts`, `hooks/useGame/saveCoordinator.ts` | 稳定功能 | 功能语义不变。审计面：normalize/migration、tests |
| 新建游戏 | 新建向导 | `components/features/NewGame/NewGameWizard.tsx` | 稳定功能 | 功能语义不变。审计面：wizard UI、opening flow |
| 新建游戏 | DIY 地图 | `utils/newGameDiy.ts`, `components/features/NewGame` | Phase2.5结构重构 | 后续随地图重构再调整。审计面：map draft model、UI、world generation |
| 新建游戏 | 性别选择 | `NewGameWizard.tsx`, `utils/openingConfig.ts` | 稳定功能 | 功能语义不变。审计面：opening config、prompt constraints |
| 新建游戏 | 货币设置 | `utils/currencyDisplay.ts`, `NewGameWizard.tsx` | 已清理护栏 | 已清理；层级货币和编辑入口；当前只使用 `角色.金钱.baseAmount`，单位为元。审计面：currency profile、settings、tests |
| 新建游戏 | 开局 preset | `data/newGamePresets.ts`, `utils/openingConfig.ts` | 专项设计后再动 | 后续功能迭代时处理题材默认。审计面：presets、mode profiles、tests |
| 新建游戏 | 初始组织生成 | `utils/openingConfig.ts`, `prompts/runtime/openingConfig.ts`, `hooks/useGame/storyState.ts` | Phase2.5结构重构 | 已完成旧题材化 schema 与 helper 命名泛化，当前以 `开局生成组织`、`开局生成成员`、`玩家组织结构` 和通用成员名录承载。审计面：组织玩法语义；后续若改模型，只迁移通用 `玩家组织` 根、prompt context、存档字段和相关测试 |
| 新建游戏 | 自定义 preset | `components/features/NewGame`, `services/dbService.ts` | 稳定功能 | 功能语义不变。审计面：storage、UI、import/export |
| 新建游戏 | 默认世界生成 | `hooks/useGame/worldGenerationWorkflow.ts`, `prompts/runtime/worldSetup.ts` | 稳定功能 | 功能语义不变。审计面：generation prompts、foundation parser |
| 本地模式包 | bundled/local modules | `data/creativeWorkshopModules.ts`, `services/creativeWorkshop.ts` | 稳定功能 | 功能语义不变。审计面：bundled data、local storage |
| 本地模式包 | JSON 导入导出 | `components/features/Workshop`, `services/creativeWorkshop.ts` | 稳定功能 | 功能语义不变。审计面：file IO、validation、tests |
| 本地模式包 | 模式包应用 | `utils/workshopEngine.ts`, `NewGameWizard.tsx` | 稳定功能 | 功能语义不变。审计面：apply pipeline、opening config |
| 本地模式包 | 旧层级货币编辑器 | `components/features/Workshop` | 已清理护栏 | 已清理；随层级货币/货币编辑功能一起移除。审计面：editor UI、旧货币 schema |
| 本地模式包 | 工坊兼容命名 | `components/features/Workshop` | Phase2.5结构重构 | 玩家可见 copy 已改为“本地模式包”；内部兼容命名暂留，后续若改只做机械迁移。审计面：UI copy、routes、docs |
| 世界/环境/时间 | 世界状态 | `models/world.ts`, `hooks/useGame/storyState.ts` | 稳定功能 | 功能语义不变。审计面：world model、prompts、save |
| 世界/环境/时间 | 地点描述 | `models/environment.ts`, `stateTransforms.ts` | 稳定功能 | 功能语义不变。审计面：env model、prompt/context |
| 世界/环境/时间 | 旅程天数 | `models/environment.ts`, `timeUtils.ts` | Phase2.5结构重构 | 后续与时间系统重构一起设计。审计面：time parser、UI、save |
| 世界/环境/时间 | 日期时间 | `hooks/useGame/timeUtils.ts`, `TopBar.tsx` | 稳定功能 | 功能语义不变。审计面：canonical time、display、commands |
| 世界/环境/时间 | 轻量时间系统设计 | 新设计 | 专项设计后再动 | 为后续设计议题，暂不实现。审计面：time model、actions、tests |
| 地图/地点 | 六层地点树 | `models/world.ts`, `utils/mapSpatial.ts` | 稳定功能 | 功能语义不变。审计面：map layers、validators、UI |
| 地图/地点 | LocationBrowser | `components/features/Map` | Phase2.5结构重构 | 后续重构设计。审计面：browser UI、selection state |
| 地图/地点 | RegionMap/GridMap | `components/features/Map` | Phase2.5结构重构 | 后续重构设计。审计面：renderers、CSS、tests |
| 地图/地点 | 地图更新 AI | `hooks/useGame/mapUpdateWorkflow.ts`, `prompts/runtime/map*` | Phase2.5结构重构 | 后续重构设计。审计面：AI map prompts、workflow |
| 地图/地点 | NPC 位置匹配 | `utils/mapNpcLocation.ts`, `hooks/useGame/npcContext.ts` | Phase2.5结构重构 | 后续做一致性专项重构。审计面：matching rules、social integration |
| 角色 | 玩家属性 | `models/character.ts`, `CharacterModal.tsx` | 稳定功能 | 功能语义不变。审计面：model、UI、prompts |
| 角色 | 身体状态 | `models/character.ts`, `models/social.ts`, `prompts/stats/body.ts`, `utils/characterVitals.ts` | 专项设计后再动 | 七部位字段横跨玩家/NPC 模型、prompt 协议、变量登记、开局初始化、NPC 补档审计、队伍/角色 UI 和测试 fixture。删除前必须先设计新的单一生命/伤势模型。审计面：health fields、prompt rules、variable registry、UI display、tests |
| 角色 | BUFF/DEBUFF | `models/character.ts`, `stateTransforms.ts` | 稳定功能 | 功能语义不变。审计面：state fields、UI、commands |
| 角色 | 天赋 | `types.ts`, `data/presets.ts`, `NewGameWizard.tsx` | 稳定功能 | 功能语义不变。审计面：preset data、UI、save |
| 角色 | 出身 | `types.ts`, `data/presets.ts`, `NewGameWizard.tsx` | 稳定功能 | 功能语义不变。审计面：backgrounds、opening items |
| 角色 | 体征 | `models/character.ts`, `CharacterProfileCard.tsx` | 稳定功能 | 功能语义不变。审计面：profile fields、image prompt |
| 角色 | 属性点 | `utils/attributePoints.ts`, `__tests__` | 稳定功能 | 功能语义不变。审计面：point logic、tests、UI |
| 角色 | 死亡判定 | `services/ai/storyResponseParser.ts`, `__tests__/death-judgment*` | 稳定功能 | 功能语义不变。审计面：parser、state guard、tests |
| 社交/NPC | NPC 档案 | `models/social.ts`, `components/features/Social` | 稳定功能 | 功能语义不变。审计面：model、UI、image archive |
| 社交/NPC | 关系/好感/亲密 | `models/social.ts`, `SocialModal.tsx` | 稳定功能 | 功能语义不变。审计面：relationship fields、prompts |
| 社交/NPC | 是否在场 | `models/social.ts`, `npcContext.ts` | Phase2.5结构重构 | 后续做一致性专项重构。审计面：presence state、AI constraints |
| 社交/NPC | 队友 | `components/features/Team`, `models/social.ts` | 稳定功能 | 功能语义不变。审计面：team UI、state、tasks |
| 社交/NPC | 头像 | `hooks/useGame/npcImage*`, `ImageManager` | 稳定功能 | 功能语义不变。审计面：image records、cache、UI |
| 社交/NPC | NPC 留存 | `utils/npcRetentionGuard.ts` | 稳定功能 | 功能语义不变。审计面：retention rules、tests |
| 社交/NPC | 位置一致性 | `mapNpcLocation.ts`, `npcContext.ts` | 专项设计后再动 | 后续专项重构。审计面：local guard、map/social sync |
| 女主/剧情规划 | StoryModal | `components/features/Story/StoryModal.tsx` | 稳定功能 | 功能语义不变。审计面：story UI、planning state |
| 女主/剧情规划 | HeroinePlanModal | `components/features/Story/HeroinePlanModal.tsx` | 稳定功能 | 功能语义不变。审计面：heroine plan model/UI |
| 女主/剧情规划 | 后宫模式 | `models/heroinePlan.ts`, `prompts/core/heroinePlan*` | 稳定功能 | 功能语义不变。审计面：prompt rules、settings |
| 女主/剧情规划 | NTL/harem style | `prompts/core/heroinePlan*`, settings | 稳定功能 | 功能语义不变。审计面：prompt/settings/UI |
| 女主/剧情规划 | 主推女主机制是否重构 | `models/heroinePlan.ts`, prompts | Phase2.5结构重构 | 后续做后宫/主推机制专项重构。审计面：model、prompt、UI |
| 背包/装备/货币 | 物品 | `models/item.ts`, `InventoryModal.tsx` | 稳定功能 | 功能语义不变。审计面：item model、UI、commands |
| 背包/装备/货币 | 装备槽 | `models/character.ts`, `EquipmentModal.tsx` | 稳定功能 | 功能语义不变。审计面：equipment state、UI |
| 背包/装备/货币 | 消耗品 | `utils/autoConsumables.ts`, `models/item.ts` | 稳定功能 | 功能语义不变。审计面：effect logic、tests |
| 背包/装备/货币 | 物品效果 | `models/item.ts`, `utils/taskRewards.ts` | 稳定功能 | 功能语义不变。审计面：effect schema、command handling |
| 背包/装备/货币 | 货币显示 | `utils/currencyDisplay.ts`, UI | 稳定功能 | 为现代单一货币显示；旧层级/自定义货币显示已删除。审计面：currency model、formatters |
| 背包/装备/货币 | 奖励落地 | `utils/taskRewards.ts`, `responseCommandProcessor.ts` | 稳定功能 | 金额奖励统一落到 `baseAmount`。审计面：reward parser、tests |
| 背包/装备/货币 | 题材市场口径 | `data/workshopThemes/topicModeThemeData.ts`, `utils/modeRuntimeProfile.ts` | 稳定功能 | 为通用 `marketName`/`marketVerb`；不恢复拍卖行系统。审计面：mode profile、mode package metadata、tests |
| 背包/装备/货币 | 拍卖行命名残留 | deleted identifiers / grep gate | 已清理护栏 | 已清理；旧市场专用命名、旧待投放 buffer 和物品图片来源旧枚举。审计面：code、tests、scripts、non-registry docs |
| 背包/装备/货币 | 账务本地化设计 | 新设计 | 稳定功能 | 为后续设计议题；不恢复多货币账本。审计面：local transaction layer、tests |
| 任务/队伍 | Task | `components/features/Task`, `models/task.ts` | 稳定功能 | 功能语义不变。审计面：task model、UI、prompts |
| 任务/队伍 | 旧约定系统 | 已删除 | 已清理护栏 | 已清理；后续语义只在任务系统中重建。审计面：UI、model、状态根、prompt/context/save/runtime/tests |
| 任务/队伍 | Team | `components/features/Team`, `models/social.ts` | 稳定功能 | 功能语义不变。审计面：team state/UI |
| 任务/队伍 | 奖励 | `utils/taskRewards.ts` | 稳定功能 | 功能语义不变。审计面：reward rules、tests |
| 任务/队伍 | 事件调度设计 | 新设计 | 专项设计后再动 | 为后续设计议题。审计面：scheduler model、prompts |
| 任务/队伍 | 队友关系 | `models/social.ts`, `TeamModal.tsx` | 稳定功能 | 功能语义不变。审计面：relationship sync、UI |
| 图片管理 | ImageManager | `components/features/ImageManager` | 稳定功能 | 功能语义不变。审计面：modal、records、settings |
| 图片管理 | 角色/NPC/玩家/场景/秘密/物品图片 | `services/ai/imageTasks.ts`, `hooks/useGame/*Image*` | 稳定功能 | 功能语义不变。审计面：task types、archives、UI |
| 图片管理 | 缓存 | `utils/imageAssets.ts`, IndexedDB | 稳定功能 | 功能语义不变。审计面：cache storage、cleanup |
| 图片管理 | 归档 | `sceneImageArchiveWorkflow.ts`, `npcImageStateWorkflow.ts` | 稳定功能 | 功能语义不变。审计面：archive rules、save |
| 图片管理 | 失败重试 | `services/ai/imageTasks.ts`, UI | 稳定功能 | 功能语义不变。审计面：retry state、diagnostics |
| 文生图后端 | ComfyUI | `services/ai/image*`, Comfy settings | 稳定功能 | 当前唯一文生图后端。审计面：settings、proxy、workflow、tests |
| 文生图后端 | 非 ComfyUI 后端与外部图片存储/代理链路 | image services/settings/proxy/scripts/tests | 已清理护栏 | 已清理；旧后端辅助脚本已删除，旧后端命名的提示词分段策略改为中性命名维持。审计面：backend enum、settings、API routes、scripts、tests |
| ComfyUI 细项 | workflow 保存 | `components/features/Settings/ImageGenerationSettings.tsx` | 稳定功能 | 功能语义不变。审计面：workflow schema、storage、UI |
| ComfyUI 细项 | workflow validation/tools | `utils/comfy*`, settings | 稳定功能 | 功能语义不变。审计面：validators、tests、UI |
| ComfyUI 细项 | Comfy proxy | `functions/api/image-backend/comfyui-proxy`, `vite.config.ts`, image services | 稳定功能 | ComfyUI/CNB 后端实际需要的代理能力。审计面：route、env、tests |
| ComfyUI 细项 | CNB sync/start scripts | `scripts/cnb-*`, `functions/api/image-backend/cnb-sync.ts` | 稳定功能 | ComfyUI 后端发现、启动与同步链路；旧后端无关脚本已删除。审计面：npm scripts、docs、env |
| 图片资源 | `public/assets/item-presets` | public assets | 稳定功能 | 功能语义不变。审计面：assets、manifest、tests |
| 图片资源 | 默认物品图 | `data/item*`, public assets | 稳定功能 | 功能语义不变。审计面：data、assets、image tasks |
| 图片资源 | 武侠物品资源是否删除或现代化 | item preset assets/data | 专项设计后再动 | 暂时不动；图片资源不阻塞本轮开发。审计面：assets、preset data、tests |
| 图片资源 | 背景图暂缓 | public/background assets | 稳定功能 | 功能语义不变。审计面：assets、CSS、homepage |
| 诊断/开发工具 | diagnostic report/log/context | `services/diagnostic*` | 稳定功能 | 功能语义不变。审计面：services、UI、settings |
| 诊断/开发工具 | ContextViewer | `components/features/Settings/ContextViewer.tsx` | 稳定功能 | 功能语义不变。审计面：modal、context builder |
| 诊断/开发工具 | HistoryViewer | `components/features/Settings/HistoryViewer.tsx` | 稳定功能 | 功能语义不变。审计面：modal、history raw |
| 诊断/开发工具 | VariableManager | `components/features/Settings/VariableManager.tsx` | 稳定功能 | 功能语义不变。审计面：UI、state edit paths |
| 诊断/开发工具 | NpcManager | `components/features/Settings/NpcManager.tsx` | 稳定功能 | 功能语义不变。审计面：UI、NPC state edit |
| 诊断/开发工具 | WorkflowGraph | `components/features/Settings/WorkflowGraphSettings.tsx` | 稳定功能 | 功能语义不变。审计面：graph UI、settings |
| Cloudflare/Worker | 本地/API/图片代理价值 | `functions/api`, `wrangler.jsonc`, `scripts/build-worker.mjs` | 稳定功能 | ComfyUI/CNB/diagnostics 需要的 API 面、R2 registry 配置和 worker functions build。审计面：routes、env、worker build |
| Cloudflare/Worker | 云同步/社区/APK/公共运营用途 | deleted paths / grep gate | 已清理护栏 | 已清理；deploy workflow/env 模板/OAuth redirect/APK assetlinks/社区公开文档、对象存储存档元数据和固定公开域名 route 已移除，worker 只承载 ComfyUI/CNB/diagnostics 需要的 API 面。审计面：any reappearing route/script/test |
| 测试体系 | Vitest | `vitest.config.ts`, `__tests__`, `tests` | 稳定功能 | 功能语义不变。审计面：config、tests |
| 测试体系 | E2E harness | `tests/*.spec.mjs`, Playwright config | 稳定功能 | 仍可运行的本地回归；依赖 `.tmp-release-assets/WuXia_Save_Data.zip` 的旧 release/Wuxia E2E 已删除。审计面：specs、helpers、fixtures |
| 测试体系 | fixture | `__tests__`, `tests/fixtures` | 稳定功能 | 清理旧武侠题材限定 fixtures；`.tmp-release-assets` 入口已删除，其余按当前功能回归价值维持。审计面：old topic fixtures、snapshots |
| 测试体系 | 已删功能测试 | deleted/grep gate | 已清理护栏 | 已清理。审计面：test files, imports, fixtures |
| 测试体系 | 核心回归测试边界 | registry, worldbook, save, parser tests | 稳定功能 | 功能语义不变。审计面：focused suite definitions |
| 构建脚本 | `package.json` scripts | `package.json` | 稳定功能 | 功能语义不变。审计面：unused scripts, docs, CI |
| 构建脚本 | CNB/image scripts | `scripts/cnb-*`, `scripts/gen-structured-item-images.mjs` | 稳定功能 | CNB 启动/同步与 ComfyUI 物品图资源维护脚本；旧后端无关脚本已删除。审计面：scripts、npm entries、tests |
| 构建脚本 | worker scripts | `scripts/build-worker.mjs`, `wrangler.jsonc` | 稳定功能 | ComfyUI/CNB/diagnostics API 需要的 worker functions build；固定公开域名 route 已删除。审计面：worker build/deploy commands |
| 构建脚本 | preset image scripts | deleted paths | 已清理护栏 | 已清理。审计面：script、npm entry、assets/tests |
| 构建脚本 | prompt stress test | `scripts/promptStressTest.js`, `npm run stress:test` | 稳定功能 | 功能语义不变。审计面：harness；若删除旧场景，只删退役 prompt/题材断言和生成输出 |
