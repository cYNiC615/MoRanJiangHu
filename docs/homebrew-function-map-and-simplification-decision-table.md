# Homebrew 功能地图与精简决策表

> 日期：2026-06-15
>
> 目的：把当前代码仓库按功能域重新整理成一张可讨论、可删减、可重构的事实地图。本文不是最终执行计划，而是后续制定 homebrew 精简路线前的决策底稿。

## 1. 核心判断

这个仓库的本体更接近一个 SillyTavern-like 的 AI 角色扮演前端，而不是传统 RPG 引擎。

它真正有价值的核心链路是：

1. 前端维护本地游戏状态、设置和存档。
2. 世界书、提示词、记忆、角色状态、环境状态、历史对话等按需拼装进上下文。
3. 主剧情模型输出正文、短期记忆、变量规划、剧情规划、行动选项等协议标签。
4. 本地解析协议，把 AI 输出转成结构化响应。
5. 独立变量生成、世界演变、规划分析、地图更新等后台链路继续把自然语言规划转成状态命令。
6. 本地命令处理器应用状态变化，落盘到 IndexedDB，并刷新前端 UI。

因此第一阶段不建议砍掉世界书、酒馆预设、上下文注入、记忆裁剪、token 估算、本地存档和标签协议解析。它们就是这个项目最接近 SillyTavern 的核心能力，也是目前能长时间游玩的基础。

补充确认：

- AI 驱动角色扮演是核心体验，不丢。后续即使把一部分规则游戏化、本地代码化，也不能削弱上下文控制、世界书/提示词、schema 解析和状态回写这条主轴。
- 保留男性向、强恋爱和亲密关系内容，保留“女主”概念。现有“主推女主”在后宫模式下表现不佳，这是优化项，不是删除项。
- 不兼容旧武侠存档。这个 fork 暂时只服务个人使用，后续清理可以直接破坏旧武侠/修仙/同人/小说分解存档兼容。
- 武侠和修仙完全不要，不只是“不作为默认”。
- 旧战斗系统不要。后续需要一个新的轻量级对抗系统替代它，可能会更偏系统玩法；但不保留功法、站位、传统对打体系作为目标。
- 社交/NPC 关系是核心体验，甚至可能扩展；但当前 AI 驱动的位置管理和在场判定 bug 很多，后续要停用、强约束或重做，暂不急着拍板具体实现。
- 天气和节日不作为游戏系统。天气只作为 AI 正文里的氛围描写，写了就有，不写就没有；节日系统直接删除。Phase 1 已移除节日设置、默认节日表、天气/节日 TopBar 展示、强制上下文、prompt/schema 写入要求和自动写入环境节日的副作用。
- 时间仍可能需要保留，但应设计成轻量、低上下文占用的系统。
- 工程健康本身也是 Phase 目标。当前 `npx tsc --noEmit` 暴露了大量仓库既有类型债，最终完成整体精简后要求回到 0 error / 0 warning 的验证状态；后续每个模块删除都不能继续扩大类型债。

外部概念参照：

- SillyTavern World Info / Lorebooks: https://docs.sillytavern.app/usage/core-concepts/worldinfo/
- SillyTavern Prompt Manager: https://docs.sillytavern.app/usage/prompts/prompt-manager/

### 1.1 Phase 1 完成契约

Phase 1 的目标不是“把所有旧代码一次性删光”，而是把已明确废弃的功能族从当前可玩的 homebrew 主链路里切出去，并且给后续深删留下准确地图。

删到这里算 Phase 1 完：

1. 入口清零：主页、游戏壳、右栏、设置、新建角、创意工坊、快捷菜单、全局弹窗、移动壳等位置不再能打开已废弃功能。
2. 活跃副作用清零：启动、回合结束、保存、返回主页、定时器、心跳、后台队列和自动预加载不再替已废弃功能工作。
3. AI 写入清零：核心 prompt、schema、命令过滤和后台世界演变不再主动要求模型维护已废弃结构化状态；天气只保留正文氛围，节日、拍卖行待投放、明确绑定小说分解的章节注入等不能继续作为游戏概念写入。
4. 残留可追踪：暂时不删的服务、API、模型字段、storage key、测试、静态资源、迁移点必须登记到 `docs/homebrew-dead-feature-registry.md`，并标明 `backend_pending`、`storage_pending` 或 `prompt_copy_pending` 等状态。通用上下文“滑窗/章节窗口”不等同于小说分解；只有与同人、原著改编、小说分解绑定的口径才算退役残留。
5. 回归有保护：每个功能族至少有静态回归测试或等价验证覆盖入口和关键副作用，防止后续换 session 时只删前端、漏掉后端或 prompt。
6. 验证不退化：`npx vite build` 不能因本轮删除失败；新增/可控 warning 不得扩大。全项目最终目标仍是 0 error / 0 warning，但既有 `tsc` 类型债允许进入后续统一治理。

Phase 1 可以接受深层 `backend_pending`，尤其是旧模型字段、历史存档字段和未触达的服务文件；但不能接受玩家仍能进入、系统仍会自动触发、AI 仍被提示维护，或残留没有登记。

## 2. 仓库层级地图

| 层级 | 当前职责 | 关键位置 | 初步判断 |
| --- | --- | --- | --- |
| 应用入口 | React/Vite 入口，挂载 `App` 与错误边界 | `index.tsx`, `App.tsx` | 保留，但 `App.tsx` 过重，需要瘦身 |
| 主游戏 Hook | 汇总状态、动作、回合流程、存档、设置、后台链路 | `hooks/useGame.ts`, `hooks/useGame/*` | 核心保留，后续拆分边界 |
| AI 文本服务 | 文本模型请求、故事任务、响应解析 | `services/ai/chatCompletionClient.ts`, `services/ai/storyTasks.ts`, `services/ai/storyResponseParser.ts` | 核心保留 |
| AI 图像服务 | 角色图、场景图、物品图、NSFW/NovelAI/ComfyUI 等图像链路 | `services/ai/imageTasks.ts`, `hooks/useGame/*Image*`, `functions/api/image-*` | 暂缓/冻结，等视觉目标确认 |
| 提示词系统 | Core/runtime 提示词、输出协议、变量/世界/规划/开局链路 | `prompts/core`, `prompts/runtime` | 核心保留，但删除同人/小说分解口径 |
| 世界书/酒馆预设 | 世界书条目、预算、作用域、SillyTavern/酒馆导入、预设消息链 | `models/worldbook.ts`, `utils/worldbook.ts`, `hooks/useGame/promptRuntime.ts`, `components/features/Worldbook`, `components/features/Settings/TavernPresetSettings.tsx` | 核心保留 |
| 状态模型 | 角色、环境、世界、剧情、任务、社交、物品、地图等状态结构 | `models`, `types.ts` | 保留，但直接清理武侠/修仙/同人/战斗/节日字段，不考虑旧存档兼容 |
| 命令落地 | 变量命令校验、路径保护、状态规范化、风险拦截 | `utils/stateHelpers.ts`, `utils/variableRegistry.ts`, `hooks/useGame/responseCommandProcessor.ts` | 核心保留，真实代码化重点 |
| 本地数据 | IndexedDB、设置、存档、图片资源、ZIP 导入导出 | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` | 必须保留；解绑云同步 |
| 前端功能面 | 设置、新建、聊天、地图、社交、背包、存读档、工坊等 UI | `components/features` | 分层处理，详见决策表 |
| 云端/发布/API | Cloudflare Functions、OAuth、同步、社区、APK、图床代理 | `functions/api`, `scripts`, `wrangler.jsonc` | 大部分进入删除/暂缓；Cloudflare 托管能力暂缓 |
| Android/APK | Capacitor、Android 壳、APK 发布和更新 | `android`, `capacitor.config.ts`, `services/appUpdate.ts`, `services/nativeApkUpdater.ts` | 入口已移除/后端待删 |
| 测试 | 单测、E2E、构建验证 | `tests`, `*.test.ts`, `playwright.config.ts` | 保留测试框架，后续删掉废弃功能测试 |

## 2.1 工程健康门禁

当前项目可以通过 `npx vite build` 完成实际前端打包，但 `npx tsc --noEmit` 已暴露大量既有类型债，覆盖测试夹具、Cloudflare 类型、拍卖行、地图、存档、货币、NPC、小说分解等多个区域。

精简完成后的目标不是“能跑就行”，而是：

1. `npx tsc --noEmit` 回到 0 error。
2. 常用测试命令回到 0 failure。
3. 前端打包保留 0 fatal error；可消除的 warning 要清掉。
4. 删除废弃模块时同步删除或修正对应测试、类型、prompt、storage key，不能把废弃功能留下来继续污染类型检查。
5. 每一轮模块删除都要登记“新增验证失败 / 既有验证失败 / 已解决验证失败”，避免把旧债和新问题混在一起。

## 3. 主运行链路地图

当前主回合可以按下面理解：

1. 用户在聊天输入行动。
2. `App.tsx` 和 `hooks/useGame.ts` 把输入交给主发送流程。
3. `hooks/useGame/sendWorkflow.ts` 进入 `执行主剧情发送工作流`。
4. `hooks/useGame/systemPromptBuilder.ts` 汇总角色、环境、世界、任务、社交、地图、记忆、世界书、提示词槽位。
5. `hooks/useGame/mainStoryRequest.ts` 组装常规消息链，或在酒馆模式下走 `hooks/useGame/promptRuntime.ts` 生成酒馆预设消息链。
6. `services/ai/chatCompletionClient.ts` 请求模型。
7. `services/ai/storyResponseParser.ts` 解析 `<正文>`、`<短期记忆>`、`<变量规划>`、`<剧情规划>`、`<行动选项>`、`<命令>` 等标签。
8. `hooks/useGame/sendWorkflow.ts` 启动后台队列：文章优化、变量生成、动态世界、规划分析、地图更新。
9. `hooks/useGame/responseCommandProcessor.ts` 与 `utils/stateHelpers.ts` 应用命令并规范化状态。
10. `hooks/useGame/saveCoordinator.ts` 写入本地存档。

这里的关键结论是：项目不是“AI 直接写 UI”，而是“AI 输出协议，本地解析、校验、渲染和落盘”。这也是后续把部分功能改成真实代码逻辑的入口。

## 4. 世界书与内置提示词实际机制

当前项目里有两套容易混淆的上下文来源：

1. 内置提示词接管。
   `utils/builtinPrompts.ts` 从 `utils/worldbook.ts` 的内置槽位生成默认内置提示词，内容来源是 `prompts/*` 源码。默认条目是关闭接管的，也就是平时走代码里的 fallback。只有用户在 `components/features/Worldbook/WorldbookManagerModal.tsx` 启用接管并保存后，IndexedDB 的 `builtin_prompt_entries` 才会覆盖代码 fallback。
2. 附加世界书注入。
   `hooks/useGame/config/settingsPersistenceWorkflow.ts` 会读取 IndexedDB 的 `extra_worldbooks`，同时加载 `public/worldbook-presets/*` 的默认世界书，再按 `[默认世界书, 已保存世界书]` 合并。`utils/worldbook.ts` 里的去重规则会让后面的同 ID 本地内容覆盖前面的默认内容。

实际注入发生在 `hooks/useGame/systemPromptBuilder.ts`：

- `world_lore` 追加进世界观文本。
- `system_rule` 并入系统规则区。
- `command_rule` 与 `output_rule` 并入输出协议区。
- 不同条目还会按作用域、关键词、时间线和预算筛选。

所以仅修改 `prompts/*` 不一定能改变实际 AI 上下文。如果本地 IndexedDB 里已经保存过内置提示词接管或附加世界书，它们会继续生效。后续精简时必须把“清理/迁移 IndexedDB 里的内置提示词和世界书”作为正式步骤，尤其是删除武侠、修仙、同人、小说分解、旧内容包时。

## 5. AI 上下文与提示词骨架

| 功能 | 当前职责 | 关键位置 | 处理意见 |
| --- | --- | --- | --- |
| Core 输出协议 | 定义主剧情标签、正文/短期记忆/行动选项/变量规划/剧情规划边界 | `prompts/core/format.ts`, `services/ai/storyResponseParser.ts` | 保留 |
| 主剧情提示词 | 控制叙事风格、NoControl、COT、正文输出 | `prompts/core/story.ts`, `prompts/core/cot.ts`, `prompts/runtime/defaults.ts` | 保留并现代都市化 |
| 变量生成 | 把 `<变量规划>` 转为结构化命令 | `prompts/runtime/variableGeneration.ts`, `prompts/runtime/variableModel.ts`, `hooks/useGame/variableModelWorkflow.ts` | 保留；真实代码化时逐步减少 AI 负责的账务/状态部分 |
| 规划分析 | 把 `<剧情规划>` 转为章节/任务/镜头规划 | `prompts/runtime/planningAnalysis.ts`, `hooks/useGame/planningUpdateWorkflow.ts` | 保留；事件调度器成熟后再收窄 |
| 世界演变 | 推进世界事件、世界状态、动态线索 | `prompts/runtime/worldEvolution.ts`, `hooks/useGame/worldEvolutionWorkflow.ts` | 保留但后续可规则化 |
| 地图更新 | 根据剧情更新地点树/地图信息 | `prompts/runtime/mapRegenerate.ts`, `hooks/useGame/mapUpdateWorkflow.ts` | 保留；地点移动可优先本地化 |
| 记忆系统 | 长/中/短/即时记忆注入，记忆召回和整理 | `components/features/Memory`, `hooks/useGame/memory*`, `prompts/runtime/memoryRefine.ts`, `prompts/runtime/recall.ts` | 核心保留 |
| 世界书系统 | 按作用域、关键词、时间线、预算注入世界知识和规则 | `models/worldbook.ts`, `utils/worldbook.ts` | 核心保留 |
| 酒馆预设 | 导入 SillyTavern/酒馆预设，按预设顺序生成消息链 | `components/features/Settings/TavernPresetSettings.tsx`, `hooks/useGame/promptRuntime.ts`, `utils/tavernPreset.ts` | 核心保留 |
| 剧情规划 | 维护剧情承接、任务、镜头、后续推进 | `models/storyPlan.ts`, `prompts/runtime/planningAnalysis.ts`, `hooks/useGame/planningUpdateWorkflow.ts` | 保留，删除同人/小说分解分支 |
| 女主规划 | 支撑男性向恋爱/亲密关系体验与重要女角色推进 | `models/heroinePlan.ts`, `prompts/core/heroinePlan*.ts` | 保留并优化；后宫模式下弱化“唯一主推女主”的副作用 |
| 同人提示词 | 原著、同人、分歧线、原著角色比例等 | `prompts/runtime/fandom*.ts`, `models/fandomPlanning` | 入口和 runtime 注入已钝化/默认 always-on 标签已清/后端待删 |
| 小说分解提示词 | 小说章节拆解、滑窗、拆分 COT、工作台注入 | `prompts/runtime/novelDecomposition*.ts`, `services/novelDecomposition*` | 入口和活跃注入已移除/后端待删 |
| 武侠/修仙口径 | 默认江湖、门派、境界、修炼体系口径 | `prompts`, `data/workshopThemes`, `models/kungfu.ts`, `models/sect.ts` | 入口已移除/后端待删，不保留为默认或兼容目标 |

## 6. 前端功能地图

| 功能面 | 当前状态 | 关键位置 | 判定 | 第一刀建议 |
| --- | --- | --- | --- | --- |
| Home/Game Shell | 主页、游戏视图、面板挂载、全局弹窗 | `App.tsx`, `components/layout` | 保留但瘦身 | APK 更新/下载与更新弹窗入口已断；移动布局仍待后续 |
| Chat | 主聊天、输入、行动选项、回合队列状态 | `components/features/Chat` | 核心保留 | 保留桌面体验，删移动专用适配 |
| Settings | API、流程图、记忆、世界书、提示词、存储、模型配置等 | `components/features/Settings` | 保留但大幅瘦身 | 已移除小说分解、音乐、节日、修炼体系、APK 手动更新、社区工坊发布等入口；云/移动仍待后续 |
| NewGame | 新开局向导、主题/模式包、角色、世界、开局配置 | `components/features/NewGame`, `utils/workshopEngine.ts` | 保留但重写默认 | Phase 1 已移除桌面/移动新建角里的同人融合、角色替换、附加小说分解、手动境界提示词、境界 DIY 和开局生成门派可见入口；默认现代都市和移动向导删除仍待后续 |
| Worldbook | 世界书管理、导入、编辑 | `components/features/Worldbook` | 核心保留 | 保留本地世界书，不接社区 UGC |
| Workshop | 本地模式包、JSON 导入导出、Comfy 工作流、本地注入预览 | `components/features/Workshop`, `services/creativeWorkshop.ts`, `data/creativeWorkshopModules.ts` | 保留本地模式包，社区入口已移除 | 后续改名或重新定位为“模式包/本地扩展” |
| SaveLoad | 存档读写、导入导出 | `components/features/SaveLoad`, `services/saveArchiveService.ts` | 必须保留 | 已移除“转云端游玩”入口；保留 ZIP 导入导出、本地时间树、删除与存档保护 |
| Memory | 记忆查看、召回、整理 | `components/features/Memory`, `hooks/useGame/memory*` | 核心保留 | 增强可观测性，不删 |
| Map | 地图层级、地点浏览、NPC 位置 | `components/features/Map`, `utils/mapSpatial.ts`, `utils/mapNpcLocation.ts` | 保留但重做边界 | 地点/移动可保留；NPC 位置和在场判定暂列重做，不急着让 AI 继续写 |
| Social | NPC、关系、社交档案、立绘 | `components/features/Social`, `models/social.ts` | 核心保留并可能扩展 | 社交/关系保留；位置管理和在场判定作为问题子系统单独重做 |
| Inventory/Equipment | 背包、装备、物品、画像展示 | `components/features/Inventory`, `components/features/Equipment`, `models/item.ts` | 保留；规则化候选 | 交易、消耗、装备变更优先转本地规则 |
| AuctionHouse | 拍卖行物品投放、价格、AI/正则抽取 | `components/features/AuctionHouse`, `services/auctionHouse.ts` | 入口和副作用已移除/后端待删 | Phase 1 已删除右栏、移动快捷菜单、弹窗挂载、背包寄售入口、App 状态/补货/桥接、存档读写、世界演化写入路径和桌面世界面板展示；服务、旧组件、模型字段和测试仍待深删 |
| Battle | 旧战斗 UI 与战斗状态 | `components/features/Battle`, `models/battle.ts` | 入口已移除/后端待删 | Phase 1 已删除桌面/移动战斗面板入口、App 挂载和预加载；后续另做新的轻量级系统化对抗，不复用旧功法/站位/传统对打 |
| Sect/Kungfu/Skills | 门派、功法、修炼、技能 | `components/features/Sect`, `components/features/Kungfu`, `components/features/Skills`, `models/sect.ts`, `models/kungfu.ts` | 入口已移除/后端待删 | Phase 1 已删除 App 挂载、右栏、移动快捷菜单、设置开关、新建角手动境界/开局门派和境界 DIY 入口；组件目录、模型、prompt、命令根、存档字段和测试仍待后端清理 |
| Task/Agreement/Team | 任务、约定、队伍 | `components/features/Task`, `components/features/Agreement`, `components/features/Team` | 保留但重命名/瘦身 | 适合事件系统，先保留 |
| Music / Audio Cues | 背景音乐、播放器、音乐设置、曲库持久化、回合提示音 | `components/features/Music`, `components/features/Settings/MusicSettings.tsx`, `data/defaultMusicTracks.ts`, `utils/turnNotificationSound.ts` | 已移除 | Phase 1 已删除播放器、设置 tab、默认曲库、元数据工具、回合提示音开关、播放副作用和音频资产；旧存储数据待强迁移清理 |
| Visual/Image Manager | 视觉设置、图片资源管理 | `components/features/Settings`, `hooks/useGame/*Image*`, `components/features/Social/ImageManagerModal.tsx` | 暂缓 | 等视觉方向确认，不继续扩功能 |
| Auth | GitHub/OAuth/云同步账号 | `components/features/Auth`, `hooks/useGitHubOAuth.ts`, `functions/api/auth` | 入口已移除/后端待删 | 首页 GitHub 同步按钮和 Cloud Play 挂载已移除；未挂载 Auth 组件、OAuth hook 和 API 仍待删 |
| Online Presence/Public Ops | 在线心跳、首页在线人数、公开在线时长榜 | `App.tsx`, `components/layout/LandingPage.tsx`, `services/onlinePresence.ts`, `functions/api/admin/online` | 静态入口已移除/后端待删 | Phase 1 已删除 App 心跳、首页在线统计请求、在线图表、在线时长榜入口、公开排行榜静态页和在线管理静态页；图表 helper、服务、API 和测试仍待删 |
| NovelDecomposition | 小说分解工作台 | `components/features/NovelDecomposition`, `components/features/Settings/NovelDecompositionSettings.tsx` | 入口和活跃注入已移除/后端待删 | Phase 1 已移除顶部/侧栏/设置/创意工坊/新建角入口，并断开主剧情、开局、世界演变、规划、回档和运行时变量链路里的小说分解注入/校准；服务、模型、prompt、测试和存储键仍待后端清理 |

## 7. 服务与数据功能地图

| 服务域 | 当前职责 | 关键位置 | 判定 | 风险 |
| --- | --- | --- | --- | --- |
| IndexedDB 本地存储 | 存档、设置、图片资源、本地摘要、迁移保护 | `services/dbService.ts` | 必须保留 | 文件很大，删除云同步时不要误伤本地设置/存档 |
| ZIP 存档归档 | 存档导入导出、图片资源打包 | `services/saveArchiveService.ts` | 必须保留 | 需要保留玩家迁移数据能力 |
| 存档协调器 | 自动/手动存档、加载、保存后同步 | `hooks/useGame/saveCoordinator.ts` | 保留但已解绑云同步 | Phase 1 已移除手动/自动存档后的云端后台同步调用；后续只删云同步服务/API/storage |
| GitHub 同步 | GitHub 云存档、多设备同步 | `services/githubSync.ts`, `functions/api/github` | 入口已移除/后端待删 | 首页同步按钮已移除；服务、OAuth、API 和测试仍待删 |
| Object/WebDAV 同步 | 对象存储、WebDAV、多设备同步 | `services/objectStorageSync.ts`, `services/webdavSync.ts`, `functions/api/object-storage-proxy.ts`, `functions/api/webdav-proxy.ts` | 入口已移除/后端待删 | SaveLoad 转云端入口已移除；Auth 面板、设置键、服务和 API 仍待删 |
| Cloud Play | 云端游玩、返回主页同步 | `services/cloudPlayService.ts`, `functions/api/cloud-play.ts` | 入口和自动副作用已移除/后端待删 | `App.tsx` 不再挂载 CloudPlayModal，也不再在返回首页时等待/触发云同步；服务/API/storage 仍待删 |
| Online Presence/Public Ops | 在线心跳、公开在线统计、在线时长榜 | `services/onlinePresence.ts`, `functions/api/admin/online` | 静态入口已移除/后端待删 | `App.tsx` 不再启动心跳，首页不再请求/展示在线人数；公开排行榜和在线管理静态页已删除；服务、API、localStorage 历史和测试仍待删 |
| App Update/APK | 更新 manifest、APK 检查、原生更新 | `services/appUpdate.ts`, `services/nativeApkUpdater.ts`, `functions/api/apk`, `android` | 入口已移除/后端待删 | Phase 1 已删除 App 自动检查/下载/进度弹窗、首页 APK 下载/检查、设置开关和本地镜像写入；release scripts/API/Android 仍待删 |
| Creative Workshop Cloud | 云端投稿、下载、编辑、删除 | `services/creativeWorkshop.ts`, `functions/api/workshop` | 入口和自动列表已移除/后端待删 | `列出创意工坊模块` 不再 fetch 云端列表；保留本地模式包时后续删除 publish/edit/delete/download API |
| Novel Decomposition | 小说拆分、滑窗注入、运行时、调度、数据集 | `services/novelDecomposition*`, `services/workshopNovelDecomposition.ts` | 入口和活跃注入已断/后端待删 | 前端可见入口已断；主剧情、开局、世界演变、规划、回档和运行时变量链路不再注入/校准小说分解；服务、prompt、tests 和 IndexedDB keys 分布很广，适合后端分批删 |
| Fandom Preset | 同人预设投稿、原著融合 | `services/fandomPresetSubmission.ts`, `functions/api/fandom-presets`, `models/fandomPlanning` | 入口和 runtime 注入已钝化/默认 always-on 标签已清/后端待删 | 新建角同人配置入口已断；旧 `同人融合.enabled` 配置不再生成运行时同人提示词或世界观融合提示；默认 always-on prompt 不再暴露同人/小说分解命名标签；创意工坊、提示词文件、legacy schema 字段、设置和 API 残留后续清理 |
| Festival/Weather System | 节日配置、天气作为结构化环境字段 | `models/system.ts`, `models/environment.ts`, `hooks/useGame/systemPromptBuilder.ts`, `components/layout/TopBar.tsx` 等 | 已降级为正文氛围/模型待删 | Phase 1 已删除节日默认数据、设置入口、天气/节日 TopBar 展示、强制上下文、prompt/schema 写入要求、AI 命令写入路径和自动环境写入；`环境.节日` / `环境.天气` 模型字段和旧存档残留待强迁移 |
| Auction House | 物品抽取、投放、价格估算 | `services/auctionHouse.ts`, `data/defaultAuctionItemImages.ts`, `scripts/generate-gpt-image2-auction-images.mjs` | 入口和副作用已移除/后端待删 | 不改二手市场，不保留拍卖行；Phase 1 已断玩家入口、自动补货、存档桥接、AI 待投放写入和自动物品生图副作用，服务/图片数据/脚本/模型字段后续深删 |
| Music / Audio Cues | 背景音乐曲库、曲目信息读取、设置存储、回合提示音 | `components/features/Music`, `components/features/Settings/MusicSettings.tsx`, `data/defaultMusicTracks.ts`, `utils/musicMetadata.ts`, `utils/turnNotificationSound.ts`, `utils/settingsSchema.ts` | 已移除 | 已删除播放器、`music_tracks` 存储键、回合提示音开关、播放副作用和音频资产；历史 IndexedDB/settings 数据后续强迁移丢弃 |
| Image Host/Backend | 图床、图片后端、NovelAI/Comfy/SD 代理 | `services/imageHostService.ts`, `functions/api/image-*`, `functions/api/novelai` | 暂缓 | 如果保留图像体验，需要重构而不是直接删 |
| Diagnostic | 上下文诊断、日志、报告 | `services/diagnostic*`, `components/features/Settings/WorkflowGraphSettings.tsx` | 保留开发态 | 可从玩家 UI 隐藏，研发保留 |

## 8. 精简决策表

判定说明：

- 核心保留：短期不能删，是 AI RP harness 的骨架。
- 保留但瘦身：保留产品价值，但要减入口、减题材包袱、减横切副作用。
- 暂缓/冻结：先不删，暂停扩展，等方向确认。
- 准备移除：已和 homebrew 锚点冲突，可以进入删除计划。
- 重构候选：不是先删，而是适合把 AI 责任转成本地代码逻辑。

| 模块/能力 | 判定 | 原因 | 第一阶段动作 |
| --- | --- | --- | --- |
| AI 主剧情请求与解析 | 核心保留 | 项目本体是 AI 角色扮演壳；正文生成仍靠模型 | 保持接口，整理观察日志 |
| 标签协议解析 | 核心保留 | 本地 UI 和状态落地依赖 `<正文>`、`<短期记忆>`、规划和命令标签 | 保留并补更清楚的失败诊断 |
| 世界书/酒馆预设 | 核心保留 | 对应 SillyTavern-like 的上下文按需注入能力 | 保留本地导入、关键词命中、预算选择 |
| 内置提示词接管 | 核心保留/需治理 | 可能覆盖 `prompts/*` fallback，实际运行受 IndexedDB 影响 | 增加迁移/重置策略，避免旧接管继续生效 |
| 记忆与 token 裁剪 | 核心保留 | 长时间游玩的稳定性基础 | 保留，后续优化预算和可视化 |
| 本地设置/存档/ZIP | 核心保留 | 用户明确要求完整保留 | 删除云同步时先加保护清单 |
| 主回合后台队列 | 保留但瘦身 | 变量、规划、世界、地图都在这里运行；但流程过重 | 先文档化阶段边界，再考虑拆文件 |
| Settings 控制台 | 保留但瘦身 | API/提示词/记忆/存储有用，但 tab 太多 | 移除小说分解、云同步、移动/APK、社区相关 tab |
| NewGame 开局 | 保留但瘦身 | 需要现代都市默认体验 | 默认主题改现代都市，去武侠/同人入口 |
| 本地模式包 | 保留但瘦身 | 可作为题材/风味扩展机制 | 从“创意工坊”改为本地扩展，不接社区 |
| Cloudflare Worker | 暂缓/冻结 | 可能仍有托管/API 代理价值 | 不新增依赖；删除社区/同步/API 后再评估 |
| 图片生成 | 暂缓/冻结 | 可能提升体验，但链路很重 | 暂不扩展；等确定视觉目标 |
| 旧战斗系统 | 入口已移除/后端待删 | 不做功法、站位、传统对打体系；未来由新的轻量级对抗系统替代 | Phase 1 已删除 App/RightPanel/MobileQuickMenu 战斗入口；后续删除模型、prompt、命令根、UI 文件和旧测试 |
| 拍卖行/市场 | 入口和副作用已移除/后端待删 | 用户明确拍卖行功能整体全部删；不改成现代交易/二手市场 | Phase 1 已删除 UI 入口、Inventory 寄售入口、App 运行时桥接/补货、存档读写、世界演化待投放写入、旧市场 prompt 口径和桌面世界面板展示；后续删除服务、模型字段、题材 profile 残留和测试 |
| 武侠/修炼/功法/门派 | 入口已移除/后端待删 | 用户明确不做武侠修仙；未来组织、能力和对抗都应按现代都市/近未来方向重设 | Phase 1 已删除功法/技艺/门派面板入口、修炼体系设置、新建角手动境界与开局门派入口；后续删除模型、prompt、命令根、组件目录、存档字段和相关测试 |
| 社交/NPC 关系 | 核心保留/重构候选 | 男性向恋爱、亲密关系和重要 NPC 互动是核心体验 | 保留并扩展关系体验；位置/在场系统单独重做 |
| 地图/地点 | 保留/重构候选 | 地点和移动非常适合代码化 | 优先做本地移动/地点合法性校验 |
| 背包/装备/货币 | 保留/重构候选 | 账务最适合代码接管 | 优先规则化交易、消耗、装备穿脱 |
| 时间 | 重构候选 | 仍可能需要轻量时间轴，但不能占用过多上下文 | 单独设计轻量时间系统 |
| 音乐/音频提示 | 已移除 | 与 homebrew 核心体验无关，且增加设置、持久化、媒体资产和 UI 面板负担 | Phase 1 已删除 MusicProvider、播放器、音乐设置、默认曲库、元数据工具、回合提示音、音频资产和存储键 |
| 天气 | 已降级/模型待删 | 不作为游戏概念；AI 正文写了就有，不写就没有 | Phase 1 已移除 TopBar、强制上下文、prompt/schema 写入要求、命令写入和场景图读取旧天气；后续删除 `环境.天气` 模型字段与旧存档残留 |
| 节日 | 已降级/模型待删 | 意义小且占上下文 | Phase 1 已删除默认节日表、节日设置页、TopBar 节日卡、强制上下文、prompt/schema 写入要求、命令写入和自动写入副作用；后续删除 `环境.节日` 模型字段与旧 settings key |
| 任务/事件池 | 重构候选 | 能把“真正的游戏”感做出来 | 等时间/地点/物品规则稳定后推进 |
| 同人/原著融合 | 入口和 runtime 注入已钝化/默认 always-on 标签已清/后端待删 | 用户明确不做同人 | Phase 1 已删除新建角同人融合、角色替换和摘要入口；旧 `同人融合.enabled` 配置不再生成运行时同人提示词、世界观融合提示或女性姓名特殊保留口径；默认 always-on prompt 不再暴露同人/小说分解命名标签；后续删除模型/提示词/服务/API，并迁移 `当前分解组`、`原著*`、`关联分歧线` 等 legacy schema 字段 |
| 小说分解 | 入口和活跃注入已移除/后端待删 | 用户明确不做小说分解 | Phase 1 已移除工作台、设置、创意工坊和新建角附加小说入口，并断开主剧情、开局、世界演变、规划、回档和运行时变量链路里的小说分解注入/校准；第二批删服务、模型、prompts、tests 和 storage keys |
| 移动端 UI | 入口已移除/组件待删 | 用户明确不做移动端 | Phase 1 已删除 App 移动组件挂载、移动快捷菜单、移动专用底部 ticker、移动弹窗分支和 native back/fullscreen 壳；移动组件文件、响应式分支、Capacitor/native helper 和移动测试仍待后续深删 |
| Android/APK | 入口已移除/后端待删 | 用户明确不做 APK | Phase 1 已断玩家可见更新/下载入口；后续删除 scripts、Capacitor、android、app update、APK manifest/API |
| GitHub/WebDAV/Object 云同步 | 入口已移除/后端待删 | 用户明确不做多设备同步 | 已从首页、移动菜单、SaveLoad 入口解绑；下一步拆 saveCoordinator、服务、API、storage key |
| 社区 UGC/云工坊 | 入口已移除/后端待删 | 用户明确不做社区 UGC | 已保留本地 JSON 导入、下载 JSON、复制摘要和本地工作流保存；后续删除 workshop API、发布/编辑/删除/下载云端 helper 和旧反馈数据 |
| 云端游玩 | 入口已移除/后端待删 | 更像公共运营/多设备功能，不属于个人本地 homebrew | 已删除 CloudPlayModal 挂载、首页云端入口和 SaveLoad 转云端入口；返回主页同步副作用和相关 API 仍待删 |
| 公共在线状态/在线榜 | 静态入口已移除/后端待删 | 在线心跳、在线人数和公开时长榜是公共运营功能，不服务本地单机 AI RP 核心 | Phase 1 已删除 App 心跳、首页在线统计请求、在线图表、在线时长榜入口和公开排行榜静态页；服务/API/测试待删 |
| 管理后台/公共运营 | 静态入口已移除/后端待删 | 不服务个人 homebrew 主体验 | Phase 1 已删除 `public/admin/online.html`；管理 API 和 E2E 测试后续随在线状态后端清理 |
| 旧存档兼容 | 不保留 | 当前 fork 暂时个人使用，保兼容会拖慢精简 | 迁移只服务当前 homebrew 默认状态，不兼容旧武侠存档 |
| 全局类型债与 warning | 准备治理 | 当前 `npx tsc --noEmit` 已不可作为绿色验证；整体精简后必须回到 0 error / 0 warning | 每次删模块同步修测试和类型，最终设为硬门禁 |

## 9. 真实代码化候选表

| 领域 | 当前 AI 依赖 | 本地化收益 | 难度 | 建议顺序 |
| --- | --- | --- | --- | --- |
| 时间推进 | AI 通过正文/命令改变日期、时辰、旅程 | 防止时间跳跃、行动耗时不一致；不包含天气/节日系统 | 中 | 需单独设计 |
| 地点移动 | AI 生成位置和地图变更 | 防止瞬移、地点层级错乱、NPC 在场错误 | 中 | 第 1 批 |
| 货币/背包/装备 | AI 输出命令增删物品和金钱 | 账务可测试，减少刷钱/丢物/装备冲突 | 中 | 第 1 批 |
| 行动选项生成 | AI 给出开放选项 | 可按当前地点/任务/状态生成合法行动框架，再让 AI 润色 | 中 | 第 2 批 |
| NPC 在场/位置 | AI 维护 NPC 位置和是否在场 | 当前 bug 多；倾向停用 AI 写入或重做，但需防止 AI 输出不在场 NPC 对白 | 高 | 暂缓设计 |
| NPC 关系/亲密 | AI 维护态度、关系和亲密推进 | 核心体验，值得扩展；本地只负责一致性和状态守卫 | 中高 | 第 2 批 |
| 任务与事件池 | AI 写剧情规划和待触发事件 | 能形成可调度、可测试的游戏循环 | 高 | 第 3 批 |
| 世界事件推进 | AI 推演世界演变 | 可避免世界事件失控或忘记结算 | 高 | 第 3 批 |
| 轻量级对抗系统 | AI 描写冲突，本地代码维护关键状态和结算 | 未来替代旧战斗系统，可能更偏系统玩法，但不是功法/站位对打 | 高 | 后置另设 |
| 社交场景 | AI 负责自然语言互动 | 文学体验依赖 AI，不适合完全规则化 | 高 | 仅做状态守卫 |
| 主剧情正文 | AI 写叙事和对白 | 这是项目体验核心 | 不建议 | 保持 AI |
| 世界书/记忆注入 | 本地已经负责选择和注入 | 这是壳子的优势 | 不需要替换 | 保留并优化 |

建议第一个真实代码化试点不是战斗，而是“地点 + 物品账务”，时间单独设计。天气和节日不进入游戏规则化候选。

## 10. 推荐精简顺序

### Phase 0：文档与边界

- 保留当前 homebrew 锚点文档。
- 用本文作为功能地图和决策表。
- 后续每次删模块前，先在本文对应行更新判定。
- 明确不保留旧存档兼容，允许直接清理武侠/修仙/战斗/节日/同人/小说分解相关结构。

### Phase 1：先断入口，不急着删深层代码

- 从 `App.tsx`、`SettingsModal.tsx`、`NewGame`、`CreativeWorkshopModal.tsx` 断开小说分解、同人、云同步、社区、移动/APK、战斗、拍卖行、音乐、节日、武侠/修仙入口。
- 保证核心聊天、存档、世界书、提示词、记忆、设置仍可工作。
- 这一阶段目标是“用户看不到已废弃功能”，不是一次性删除所有文件。

#### Phase 1 作业定义

Phase 1 按“功能族”收口，不按文件夹机械清空。每个废弃功能族至少要完成三件事：

1. 玩家入口断开：主页、右栏、设置、新建角、创意工坊、快捷菜单、全局弹窗和自动打开路径都不能再触达它。
2. 活跃副作用断开：应用启动、回合结束、保存、返回主页、定时器、心跳或后台队列不能继续替废弃功能做事。
3. 残留登记清楚：暂时不删的服务、API、prompt、model、storage key、测试和静态资源必须登记到 `docs/homebrew-dead-feature-registry.md`。

单个模块在 Phase 1 算“切完”的标准：

1. 保护性测试覆盖了它的玩家入口和关键副作用，避免同类入口被加回。
2. `npx vite build` 不因为这次删除失败。
3. 如果还有 backend/prompt/storage/test 残留，registry 明确标成 `backend_pending` 或 `storage_pending`，而不是散落在代码里靠记忆追踪。
4. 如果这一刀已经把运行时代码、文件和设置键都删完，可以标成 `backend_removed`；但历史 IndexedDB/settings 迁移可以继续保留 `storage_pending`。

Phase 1 全局完成的标准：下面所有明确废弃功能族都至少达到“入口/副作用已断开，并已登记残留”；不要求 Phase 1 同时完成所有后端深删。

| 功能族 | Phase 1 目标 | 当前状态 |
| --- | --- | --- |
| 同人/小说分解 | 断开新建角、设置、工坊、全局工作台入口，并断开同人 runtime 注入、小说分解活跃注入/校准 | 已断入口、同人 runtime 注入和小说分解活跃注入；默认 always-on prompt 标签已清，后端/prompt/schema/storage 待删 |
| 云同步/云端游玩 | 断开玩家入口和保存/返回主页自动同步副作用 | 已断入口和副作用，后端/API/storage 待删 |
| 社区 UGC/云工坊 | 保留本地模式包，移除投稿、社区发布、云端编辑/删除/反馈入口 | 已断入口和自动云端列表，后端/API/storage 待删 |
| 公共在线状态/在线榜 | 删除心跳、首页在线统计和公开榜入口 | 已断入口、心跳和静态页，后端/API/测试待删 |
| 移动端 | 删除移动入口、移动布局和移动组件挂载 | App 壳入口已断，移动组件/Capacitor/测试待删 |
| Android/APK | 删除更新检查、下载、发布面板、APK 设置入口和自动检查 | 已断入口和自动效果，后端/release/android 待删 |
| 旧战斗 | 删除旧战斗面板和菜单；后续另做轻量级对抗系统 | 已断入口，后端/prompt/model 待删 |
| 拍卖行 | 删除拍卖行面板、背包寄售入口、App 自动副作用、存档桥接和 AI 待投放写入 | 已断入口和活跃副作用，后端/model/storage/test 待删 |
| 音乐/音频提示 | 删除播放器、音乐设置、曲库、提示音和播放副作用 | 已删除运行时代码，仅历史存储迁移待处理 |
| 节日 | 删除节日设置、TopBar 展示、强制上下文和自动写入副作用 | 已断入口、上下文和命令写入；模型/storage 待删 |
| 天气游戏系统 | 降级为正文氛围，不作为结构化游戏概念 | 已移除 UI、上下文、prompt/schema 和命令写入；模型/storage 待删 |
| 武侠/修仙专属入口 | 删除功法、技艺、门派、境界配置和新建角武侠专属入口 | 已断入口，后端/prompt/model 待删 |

#### Phase 1 范围边界

Phase 1 删到这里算完：

1. 已明确废弃模块不再有玩家可见入口：同人/小说分解、云同步/云端游玩、社区 UGC、公共在线状态/在线榜、移动端、APK、旧战斗、拍卖行、音乐/音频提示、节日、天气游戏系统、武侠/修仙专属入口。
2. 已明确废弃模块不再有顶层自动副作用：例如应用启动时的心跳、首页定时请求、保存后自动云同步等。
3. 对于一次删不完的模块，必须在 `docs/homebrew-dead-feature-registry.md` 写明剩余后端、prompt、storage key、测试、静态页或迁移点。
4. Phase 1 可以允许 `backend_pending`，但不允许“入口删了、残留没登记”。
5. Phase 1 不追求彻底删除所有深层模型字段；深层删除进入 Phase 2+，以防误伤 AI 上下文、存档、设置和主回合流程。

#### Phase 1 退出标准

Phase 1 完成的定义：

1. 玩家可见入口已清空：主页、右侧面板、设置页、移动快捷菜单、新建角向导、创意工坊等位置不再提供已废弃模块入口。
2. 已废弃模块至少登记到 `docs/homebrew-dead-feature-registry.md`，并明确区分 `entrypoint_removed`、`entrypoint_pending`、`backend_pending` 和后续存储迁移点。
3. 核心桌面链路仍能打包：`npx vite build` 不因入口删除失败。
4. 每一刀都有静态回归测试或等价验证，防止同类入口被悄悄加回。
5. 本阶段不要求一次性修完全仓库既有 `tsc` 类型债，但不能新增与本轮删除相关的打包错误；废弃模块测试和类型债必须进入 registry 或后续清理列表。

Phase 1 不算完成的情况：

- 只删前端入口但没有登记后端、prompt、storage key 和测试残留。
- AI prompt 仍主动要求模型写入已废弃模块的核心状态，例如拍卖行待投放、节日/天气结构化状态、明确绑定小说分解的章节注入。通用上下文窗口/滑窗口径不单独算退役功能。
- 新建角或设置页仍能配置已明确废弃的模块。
- 为了让某个删除通过而把错误静默吞掉，却没有登记迁移计划。

### Phase 2：拆云端和移动外围

- 删除 Android/Capacitor/APK 脚本和更新链路。
- 删除 GitHub/WebDAV/Object/Cloud Play 云同步后台服务、API、测试和 storage key。
- 删除剩余 GitHub/WebDAV/Object/Cloud Play 服务、API、测试和 storage key；保存后云同步副作用已在 Phase 1 移除。
- Cloudflare 只保留可能必要的托管/API 代理能力。

### Phase 3：删同人和小说分解

- 删除小说分解 UI、设置 tab、后台调度、注入快照、数据集模型、提示词。
- 删除 fandom planning 模型和 runtime prompts。
- 删除创意工坊里的同人/原著/小说分解桥接。

### Phase 4：现代都市默认化与强制迁移

- `data/workshopThemes/defaultWorkshopTheme.ts` 默认模式改现代都市。
- 新开局默认角色、世界、货币、地点、组织口径改现代都市。
- 删除或迁移 IndexedDB 中旧的默认世界书、内置提示词接管、内容包和模式包残留。
- 武侠/修仙不作为可选扩展保留。

### Phase 5：第一批真实代码化

- 地点移动与地点合法性校验。
- 物品/货币/装备账务规则。
- 时间系统单独设计，尽量少占 AI 上下文。
- AI 仍负责自然语言描述，但关键状态变化由本地规则确认或执行。

### Phase 6：验证归零

- 清理所有因废弃模块残留导致的测试、类型和 prompt 失败。
- 把 `npx tsc --noEmit` 恢复成可用硬门禁。
- 消除可控 build warning，保留的 warning 必须有明确登记和去除计划。
- 结束标准是 0 error / 0 warning，而不是只保证 Vite 能打包。

## 11. 当前最值得立即讨论的问题

1. 图片生成是否是 homebrew 核心体验，还是可以整体冻结？
2. 现代都市是否包含低玄/近未来科幻能力体系，还是先严格现实都市？
3. NPC 位置/在场系统是先停用 AI 写入，还是先加本地 guard，再整体重做？
4. 时间系统保留哪些最小字段，怎样避免挤占 AI 交互上下文？
5. 第一轮实现要选“断入口瘦 UI”，还是直接改默认现代都市并强制迁移世界书/提示词？

我的建议是：先做 Phase 1 的“断入口瘦 UI”，再做现代都市默认化。这样风险最小，也能最快让项目从“原作者大杂烩”变成“我们自己的 homebrew 外壳”。
