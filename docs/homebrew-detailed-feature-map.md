# Homebrew Detailed Feature Map

> 日期：2026-06-29
>
> 本文是当前核心事实文档，合并了旧的 AI-native 事实快照和阶段边界文档。未来计划见
> `docs/homebrew-roadmap.md`。

## 当前判断

MoRanJiangHu homebrew fork 的核心是个人用 AI-native RPG framework，不是传统 RPG 引擎，
也不是稳定客户发布产品。当前价值集中在“上下文控制 + 协议输出 + 本地落地”：

| 环节 | 当前角色 | 代表文件 |
| --- | --- | --- |
| 上下文控制 | prompt、worldbook、Tavern preset、memory、状态快照组装 | `hooks/useGame/systemPromptBuilder.ts`, `hooks/useGame/promptRuntime.ts`, `utils/worldbook.ts` |
| 协议输出 | 模型输出正文、变量规划、剧情规划、行动选项、命令 | `prompts/core`, `prompts/runtime`, `services/ai/chatCompletionClient.ts` |
| 本地解析 | tag parser、对话 sender 规范化、错误恢复 | `services/ai/storyResponseParser.ts`, `utils/dialogueLogNormalizer.ts` |
| 状态落地 | 命令路径保护、状态规范化、风险拦截、任务奖励结算 | `utils/stateHelpers.ts`, `hooks/useGame/responseCommandProcessor.ts`, `hooks/useGame/stateTransforms.ts` |
| 持久化 | IndexedDB 设置/存档/图片资源、ZIP 导入导出 | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` |

保留核心：

- 本地设置、API 配置、主聊天、PromptManager、世界书、Tavern preset、记忆、token/context 预算。
- 本地状态、协议/tagged output、命令解析、状态回写、IndexedDB/ZIP 存档。
- 男性向恋爱/亲密关系、“女主/红颜”概念和后宫玩法方向。
- 图片管理和生成能力；文生图后端以 ComfyUI 为当前边界。
- 本地模式包机制；玩家可见 copy 使用“本地模式包”。

不默认扩张：

- mobile、APK、cloud sync、社区 UGC、公网运营、release automation。
- 旧战斗、拍卖行、小说分解、同人/原作适配、天气/节日系统化。
- 外部游戏引擎接入。Godot 或其他客户端是长期愿景，不是当前架构前提。

## 阶段边界

| Phase | 状态 | 说明 |
| --- | --- | --- |
| Phase 1 | 历史完成 | 主链路与阶段边界完成初步整理。 |
| Phase 1.5 | 历史完成 | 第一轮收尾完成，文档改为当前状态。 |
| Phase 2 | 已收口 | 功能去留分流和第一轮深删完成。 |
| Phase 2.5 | 已完成 | 结构整理、命名收束、无主残留清理和验证收口完成。 |
| Phase 3 | 已收口 | 现代都市默认化、角色种子/社交 v2/红颜规划闭环、Phase 3.4 smoke 修复和最近 upstream intake 手动补丁已完成。 |
| Phase 4+ | 当前规划 | 先做导演与角色智能，再稳 prompt/runtime，之后补叙事状态底座和本地玩法系统。 |

Phase 3 当前状态见 `docs/homebrew-phase3-implementation-status.md`。后续方向见
`docs/homebrew-roadmap.md`。

## 当前功能地图

| 功能域 | 细项 | 当前入口或主要文件 | 后续方向 | 审计面 |
| --- | --- | --- | --- | --- |
| 应用壳 | 主页/桌面布局/左右栏 | `App.tsx`, `components/layout` | 稳定功能 | 入口、路由状态、按钮、布局 smoke |
| 应用壳 | 全局 modal state | `App.tsx`, `hooks/useGame.ts` | 按需重构 | 只随实际功能需求继续瘦身 |
| 主聊天 | 输入、聊天记录、行动选项、消息渲染 | `components/features/Chat`, `services/ai/storyResponseParser.ts` | 稳定功能 | history model、parser、fallback、reroll |
| 主聊天 | 回合状态与后台队列 | `hooks/useGame/sendWorkflow.ts`, `hooks/useGame.ts` | bugfix intake | loading/progress、队列展开、阶段重试入口 |
| AI 文本 | API 配置与阶段模型选择 | `utils/apiConfig.ts`, `components/features/Settings/StageModelSettings.tsx` | 稳定功能 | settings schema、默认配置、调用点 |
| AI 文本 | 主剧情请求与错误恢复 | `hooks/useGame/mainStoryRequest.ts`, `services/ai/chatCompletionClient.ts`, `utils/chatRecovery.ts` | 稳定功能 | 请求封装、stream、日志、parse recovery |
| Prompt 系统 | core/runtime prompt 与 PromptManager | `prompts`, `components/features/Settings/PromptManager.tsx`, `utils/builtinPrompts.ts` | Phase 4/5 核心 | 内置条目、用户覆盖、reset、IndexedDB |
| Tavern Preset | 导入与消息链生成 | `components/features/Settings/TavernPresetSettings.tsx`, `utils/tavernPreset.ts`, `hooks/useGame/promptRuntime.ts` | 稳定功能 | importer、storage、ordering、token count |
| 世界书 | CRUD/import/export/预算/作用域 | `components/features/Worldbook`, `utils/worldbook.ts`, `models/worldbook.ts` | Phase 4/5 核心 | UI、dbService、matcher、budget、preset assets |
| 记忆 | 短期/长期/NPC 记忆与整理 | `components/features/Memory`, `hooks/useGame/memory*`, `prompts/runtime/recall.ts` | Phase 4/5 核心 | model、prompts、workflow、预算 |
| 存档 | IndexedDB、存档树、ZIP 导入导出 | `services/dbService.ts`, `services/saveArchiveService.ts`, `components/features/SaveLoad` | 稳定功能 | stores、migration、archive service、UI |
| 新建游戏 | 新建向导、背景、天赋、开局 preset | `components/features/NewGame/NewGameWizard.tsx`, `data/newGamePresets.ts`, `utils/openingConfig.ts` | 稳定功能 / 按需优化 | 默认题材、向导 copy、opening items、tests |
| 新建游戏 | 默认世界生成与开局变量 | `hooks/useGame/worldGenerationWorkflow.ts`, `hooks/useGame/openingStoryWorkflow.ts`, `hooks/useGame/runtimeVariableWorkflow.ts` | Phase 5 性能优化 | 原始响应、max tokens、阶段重试、正文展示、开局耗时 |
| 本地模式包 | bundled/local modules 与导入导出 | `data/creativeWorkshopModules.ts`, `services/creativeWorkshop.ts`, `components/features/Workshop` | 稳定功能 | bundled data、local storage、file IO、validation |
| 本地模式包 | 模式包应用 | `utils/workshopEngine.ts`, `NewGameWizard.tsx` | 稳定功能 | apply pipeline、opening config、worldbook injection |
| 世界/环境/时间 | 世界状态、地点描述、日期时间 | `models/world.ts`, `models/environment.ts`, `hooks/useGame/timeUtils.ts` | Phase 6 | world model、env model、display、commands |
| 地图/地点 | 六层地点树、LocationBrowser、地图渲染 | `models/world.ts`, `utils/mapSpatial.ts`, `components/features/Map` | Phase 6 | validators、selection state、renderers、CSS |
| 角色 | 玩家属性、身体状态、天赋、出身、体征 | `models/character.ts`, `components/features/Character`, `NewGameWizard.tsx` | 稳定功能 | model、UI、prompts、preset data、tests |
| 社交/NPC | NPC 档案、关系、队友、头像、记忆 | `models/social.ts`, `components/features/Social`, `hooks/useGame/npc*` | Phase 4 核心 | agenda、relationship sync、image records、state |
| 社交/NPC | 位置和在场一致性 | `utils/mapNpcLocation.ts`, `hooks/useGame/npcContext.ts` | Phase 6 | local guard、map/social sync、AI constraints |
| 女主/剧情规划 | StoryModal、HeroinePlanModal、后宫规划 | `components/features/Story`, `models/storyPlan.ts`, `models/heroinePlan.ts`, `prompts/core/heroinePlan*` | Phase 4C/4D 已落地 / 继续核心 | 剧情暗线、红点条件、prompt rules、settings、UI |
| 背包/装备/货币 | 物品、装备槽、消耗品、奖励落地 | `models/item.ts`, `components/features/Inventory`, `components/features/Equipment`, `utils/taskRewards.ts` | Phase 7 / bugfix | item model、UI、command handling、金额显示 |
| 任务/队伍 | Task、Team、奖励和事件调度入口 | `components/features/Task`, `components/features/Team`, `models/task.ts`, `models/social.ts`, `utils/taskCompat.ts` | Phase 4A 已落地 / Phase 7 | task prompt 准入和旧兼容清理已完成；后续再做本地任务玩法 |
| 图片管理 | ImageManager 与各类图片归档 | `components/features/ImageManager`, `services/ai/imageTasks.ts`, `hooks/useGame/*Image*` | 稳定功能 | task types、archives、cache、retry |
| 文生图后端 | ComfyUI workflow、settings、proxy | `components/features/Settings/ImageGenerationSettings.tsx`, `services/ai/image*`, `functions/api/image-backend` | 稳定功能 | workflow schema、validators、route、env、tests |
| 诊断/开发工具 | Context/History/Variable/NPC/WorkflowGraph | `components/features/Settings`, `services/diagnostic*` | Phase 5 支撑 | modal、context builder、state edit paths |
| Cloudflare/Worker | 本地/API/图片代理辅助面 | `functions/api`, `wrangler.jsonc`, `scripts/build-worker.mjs` | 稳定辅助 | routes、env、worker build、diagnostics |
| 测试体系 | Vitest/focused suite/E2E harness | `vitest.config.ts`, `__tests__`, `tests` | 稳定功能 | config、fixtures、focused suite definitions |
| 构建脚本 | package scripts、CNB/image/worker scripts | `package.json`, `scripts`, `functions/api` | 稳定功能 | scripts、npm entries、docs、env |

## 主运行链路

1. 用户在聊天输入行动。
2. `App.tsx` / `hooks/useGame.ts` 将输入交给发送流程。
3. `hooks/useGame/sendWorkflow.ts` 执行主剧情发送。
4. `hooks/useGame/systemPromptBuilder.ts` 汇总状态、世界书、记忆、提示词和 preset。
5. `hooks/useGame/mainStoryRequest.ts` 或 `hooks/useGame/promptRuntime.ts` 组装消息链。
6. `services/ai/chatCompletionClient.ts` 请求模型。
7. `services/ai/storyResponseParser.ts` 解析协议标签。
8. 后台队列按需执行文章优化、变量生成、世界演变、规划分析、地图更新。
9. `hooks/useGame/responseCommandProcessor.ts` / `utils/stateHelpers.ts` 应用命令。
10. `hooks/useGame/saveCoordinator.ts` 落盘。

这条链路是后续所有阶段的保护线。任何结构调整都必须保留主聊天、PromptManager、世界书、
记忆、本地设置、API 配置、存档、本地模式包、图片管理和 ComfyUI 后端。

## 提示词与世界书机制

- 内置提示词接管：`utils/builtinPrompts.ts` 根据内置槽位生成默认条目，内容来自 `prompts/*`
  fallback。用户在 PromptManager/Worldbook UI 保存后，IndexedDB 的 `builtin_prompt_entries`
  可能覆盖源码 fallback。
- 附加世界书注入：`extra_worldbooks` 与默认 preset 世界书合并后，经 `utils/worldbook.ts`
  按作用域、关键词、时间线和预算筛选注入。

因此只改源码 prompt 不等于运行时一定生效。后续调整提示词和世界书相关逻辑时，需要同时考虑
IndexedDB reset/migration、内置条目隐藏、默认世界书和本地 snapshot。

### 现代世界观生成口径

- 现代世界观生成默认产物是世界事实母本，不是城市研究报告、宏观经济报告、重社会冲突舞台、
  剧情推进说明或事件触发清单。
- 默认体验偏后宫恋爱轻喜剧与都市日常；除非玩家草稿、导演配置或显式题材要求更重，否则犯罪、
  黑市、家暴、勒索、政治丑闻和商业阴谋不作为默认主舞台。
- 普通现代常识默认成立，不作为篇幅重点；篇幅优先给本局独特规则、独特规则造成的社会后果、
  关系习惯、地点差异和可长期复用的世界事实。
- 玩家自定义的独特规则必须展开到恋爱、亲密关系、家庭、日常制度、角色选择、日常场景和常见选择，
  不能只复述规则本身。例如“孕期缩短”这类规则应影响关系节奏、家庭讨论、同居/约会选择、
  育儿安排和社会习惯，而不是只作为生理设定列出。
- 生成出来的世界观正文不应出现 `DM 可用运行逻辑`、`事件联动与剧情推进逻辑` 或
  `近期可触发事件` 这类系统/规划/触发器话语；开发文档内部可以继续用 DM 概念描述后台主轴。

### NPC 命名口径

- 女性 NPC 命名不再依赖硬黑名单触发整轮重试；运行时只对占位名、重复名和明确数据问题做必要兜底。
- 新女性 NPC 默认使用现代架空都市感姓名，避免现实亲戚感、乡土感、上世纪单位通讯录感。
- 年龄、职业和成熟感通过称谓、身份、行为、语气体现，不靠老派姓名体现；中老年角色也不应为了显老而使用过时姓名。
- Prompt 只注入正向语感示例，例如 `林知夏`、`许清禾`、`顾明澜`、`高艺敏`、`刘佳玮`、
  `孙雪琳`、`徐静宜`、`李绒`、`马可欣`、`张伊丹`；不再把具体反例名字常驻注入上下文。
- 示例只用于把握语感，模型仍应结合角色家庭、职业、地区和人物气质另起新名，不直接复读示例。

## 任务列表边界

`任务列表` 是玩家可见的正式目标日志，不是 DM 后台规划，也不是所有 NPC 请求和玩家追问细节的
收纳桶。任务一旦落盘就会被主剧情反复读取，因此准入要比普通正文线索、短期记忆和剧情规划更严。

当前 Phase 4A 决策：

- 只把主线/当前章目标、重要关系或红颜阶段目标、明确委托、有明显风险/时限/代价/失败后果的事项、
  玩家要求持续追踪的目标、导演模块标记的重要目标写入 `任务列表`。
- 普通跑腿、顺路调查、低价值找物、闲聊传闻、气氛性线索、以及 AI 因玩家追问临场补出的枝节，
  默认不落任务；需要承接时放正文、短期记忆或 `剧情规划`。
- `奖励描述` 保留为可选结算输入，只在明确有报酬、贡献、货币、技艺、属性点或物品回报时使用。
  现代都市目标不强制生成奖励。
- `剧情暗线` 从任务职责中退出；隐藏叙事归 `剧情规划.剧情暗线` / `女主剧情规划`。
- `推荐境界` 不再作为现代都市默认生成字段，后续可迁移成 UI 层弱提示或删除。
- `taskCompat` 只保留通用规范化、奖励描述规范化、目标完成自动结算和必要安全去重；旧武侠/旧无限流/
  旧任务板语义兼容规则可随 Phase 4A 实施清理。

当前落地状态：

- 开局和变量 prompt 不再为了凑数强制生成主线任务；只有正式可追踪目标才进入 `任务列表`。
- `剧情暗线` 不再是任务模型字段，不再出现在任务 `<数据结构定义>`，也不再注入主剧情任务上下文；
  任务 UI 标签识别不再读取该字段。当前轻量暗线字段归 `剧情规划.剧情暗线`。
- `taskCompat` 不再根据宗门、悬榜、江湖消息、主神、任务世界、恐怖片等旧题材文本推断任务类型、
  任务世界或无限流重复任务。
- `taskCompat` 当前保留：显式合法任务类型、奖励描述规范化、目标完成自动结算、标题/发布人/
  发布地点/目标描述级别的通用精确去重。

## 剧情规划与世界演变边界

当前 Phase 4B 决策：

- `剧情规划.当前章目标` 是后台 DM 主轴，不直接暴露给玩家；它负责本章推动力、取舍标准和节奏方向。
- `剧情规划.当前章任务` 是 DM 节拍池，不等同于玩家可见 `任务列表`。
- 规划分析负责章节目标、节拍、待触发事件、镜头、切章和女主规划的最小修订。
- 世界演变负责后台后果，不负责为了“世界感”生成随机背景事件。
- 世界演变新增条目必须服务当前章目标、玩家行动后果、女主/核心 NPC、当前或近期可达地点，
  或导演模块明确压力。
- 活跃 NPC、进行中事件、已结算事件和世界镜头只保留峰值上限，不设最低常态补位目标。
- `世界.世界镜头规划` 字段职责保留，但条目可为空，不为氛围强行填充。
- 规划分析不再假设并行后处理时一定读到了本轮世界演变新命令。

当前落地状态：

- `prompts/core/story.ts` 与 `prompts/runtime/planningAnalysis.ts` 已把 `当前章目标` 明确为后台 DM 主轴。
- `models/storyPlan.ts`、`hooks/useGame/storyState.ts`、`utils/stateHelpers.ts` 与
  `hooks/useGame/systemPromptBuilder.ts` 已接入轻量 `剧情规划.剧情暗线`。
- `prompts/runtime/worldEvolution.ts`、`prompts/runtime/worldEvolutionCot.ts`、`prompts/runtime/worldDataSchema.ts`
  和 `prompts/stats/world.ts` 已移除世界事件常态补位压力。
- 当前实现仍保留既有 `剧情规划` / `世界` 数据结构，未做字段迁移。
- 若后续发现并行后处理导致规划明显落后，再单独评估 `sendWorkflow` 的后处理顺序或 prompt 输入摘要。

## 剧情暗线与女主规划边界

当前 Phase 4C / 4D 决策：

- `剧情规划.剧情暗线` 是轻量隐藏叙事池，用于信息差、伏笔和延后揭示点；它不直接暴露给玩家，
  不写入 `任务列表`，也不替代世界事件或完整剧本。
- 暗线字段保持轻：`标题 / 暗线说明 / 可见边界 / 触发条件[] / 当前状态`。没有最低数量要求；
  已揭示、失效、迁移或不再服务当前章目标时清理或改状态。
- 女主/红颜规划是恋爱与亲密体验的核心规划树，与主线 DM 规划并行对齐，不是主线任务节拍的附属说明。
- 女主规划数量目标继续留在 `prompts/core/heroinePlan.ts` 与 `prompts/core/heroinePlanCot.ts`，
  统一规划分析只引用协议，不重复写固定数字。
- 玩家把回合投入女主聊天、约会、亲密或关系谈判时，可以优先维护关系节奏；主线保留暂停点、
  等待条件或下一触发点即可。

当前落地状态：

- `prompts/runtime/storyPlanSchema.ts`、`prompts/core/story.ts` 和 `prompts/runtime/planningAnalysis.ts`
  已把 `剧情暗线` 定位为后台规划字段。
- `prompts/runtime/planUpdateReference.ts` 已让统一规划分析按女主协议审计数量、峰值和旧项占槽，
  不再在统一规划支持块里重复具体数字。
- `prompts/core/heroinePlan.ts` 与 `prompts/core/heroinePlanCot.ts` 已明确女主规划是恋爱/亲密体验核心轴。

## Closeout Guardrails

- 不用 Phase 2.5 或 Phase 3 名义新增重构方向。
- 不拆 `hooks/useGame.ts` 新模块，除非是删除已确认无消费者出口，或服务 Phase 4+ 的明确切口。
- 不移动文件夹、不引入新抽象、不新增兼容层，除非对应当前阶段目标。
- 每个后续切口先枚举相关 UI、model、prompt、command、storage、script、test、doc 面。
- 文档保持当前状态，不写客户 changelog；完成项只简短标为完成。

## 验证门禁

- focused Vitest；
- `npx tsc --noEmit --pretty false`；
- `npm run build`；
- `git diff --check`；
- 需要 UI smoke 时启动本地服务器，由玩家手动确认。
