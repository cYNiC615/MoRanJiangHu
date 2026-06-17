# Homebrew Detailed Feature Map

> 日期：2026-06-18
>
> Phase 2.5 已正式完成。本文只记录当前保留功能边界、下一步入口和手动 smoke
> 待处理项。主阶段边界见
> `docs/homebrew-function-map-and-simplification-decision-table.md`。

## Current Direction Snapshot

- 应用壳、TopBar、LeftPanel、RightPanel、主聊天、reroll、后台队列和 modal 入口继续作为当前 UI 基底。
- AI 文本、Prompt、Tavern preset、世界书、`extra_worldbooks`、prompt snapshot、NPC 记忆、本地存档和本地设置是核心基底。
- 新建游戏保留背景列表、天赋列表、开局快照、本地模式包恢复、默认世界生成和开局变量链路。
- 本地模式包机制保留官方内置、本地导入、注入和模式配置能力；玩家可见 copy 使用“本地模式包”。
- 世界/地图/时间、角色、社交/NPC、女主/后宫规划、任务、背包、装备和图片管理都是后续迭代对象，后续重构不得改变当前玩法语义。
- 文生图后端以 ComfyUI 为当前边界；图片管理、角色/NPC/玩家/场景/秘密/物品图片链路继续保留。
- 诊断/开发工具、Cloudflare/Worker、CNB、脚本和测试只围绕当前本地/API/图片代理辅助价值存在。
- Phase 3 从现代都市默认化、手动 smoke 待处理项和具体 bugfix intake 开始，不再继续扩张 Phase 2.5。

## 当前手动 Smoke 状态

- Pre-Phase3 bugfix baseline 已完成；下一步可进入 Phase 3 小切片功能迭代。
- 已修：新建游戏世界观选择界面不再展示“市场入口”、交易口径、统一换算等市场说明块。
- 已修：随身装备和随身物品货币卡片显示具体金额与玩家可读单位，不再暴露 `baseAmount`。
- 已修：队列“重新生成”按钮只在变量生成确有可执行重试入口时显示，未实现阶段级重放的队列阶段不再展示假按钮；变量续跑会先完成变量模型重解析，再用快照重建回合，避免开局正文在等待模型期间被先清空。
- 已修：右侧菜单红点按实际可读内容收紧；普通 `剧情规划` 更新归到剧情入口，红颜卷宗/女主规划只在 `女主剧情规划` 命令值确有可读内容时触发，空规划分析壳不再点亮。
- 待确认：开局变量生成输出疑似被截断；本轮未发现前端展示或阶段保存截断，已补非流式 `finish_reason = "length"` / max tokens 截断拦截。若仍复现，需要结合原始响应、流式传输日志、接口 `maxTokens` 和渠道返回的 finish reason 继续定位。

## 当前功能地图

| 功能域 | 细项 | 当前入口或主要文件 | 后续方向 | 审计面 |
| --- | --- | --- | --- | --- |
| 应用壳 | 主页/桌面布局/左右栏 | `App.tsx`, `components/layout` | 稳定功能 | 入口、路由状态、按钮、布局 smoke |
| 应用壳 | 全局 modal state | `App.tsx`, `hooks/useGame.ts` | 按需重构 | 只随实际功能需求继续瘦身，不为架构感新拆层 |
| 主聊天 | 输入、聊天记录、行动选项、消息渲染 | `components/features/Chat`, `services/ai/storyResponseParser.ts` | 稳定功能 | history model、parser、fallback、reroll |
| 主聊天 | 回合状态与后台队列 | `hooks/useGame/sendWorkflow.ts`, `hooks/useGame.ts` | bugfix intake | loading/progress、队列展开、阶段重试入口 |
| AI 文本 | API 配置与阶段模型选择 | `utils/apiConfig.ts`, `components/features/Settings/StageModelSettings.tsx` | 稳定功能 | settings schema、默认配置、调用点 |
| AI 文本 | 主剧情请求与错误恢复 | `hooks/useGame/mainStoryRequest.ts`, `services/ai/chatCompletionClient.ts`, `utils/chatRecovery.ts` | 稳定功能 | 请求封装、stream、日志、parse recovery |
| Prompt 系统 | core/runtime prompt 与 PromptManager | `prompts`, `components/features/Settings/PromptManager.tsx`, `utils/builtinPrompts.ts` | 稳定功能 | 内置条目、用户覆盖、reset、IndexedDB |
| Tavern Preset | 导入与消息链生成 | `components/features/Settings/TavernPresetSettings.tsx`, `utils/tavernPreset.ts`, `hooks/useGame/promptRuntime.ts` | 稳定功能 | importer、storage、ordering、token count |
| 世界书 | CRUD/import/export/预算/作用域 | `components/features/Worldbook`, `utils/worldbook.ts`, `models/worldbook.ts` | 稳定功能 | UI、dbService、matcher、budget、preset assets |
| 记忆 | 短期/长期/NPC 记忆与整理 | `components/features/Memory`, `hooks/useGame/memory*`, `prompts/runtime/recall.ts` | 稳定功能 | model、prompts、workflow、预算 |
| 存档 | IndexedDB、存档树、ZIP 导入导出 | `services/dbService.ts`, `services/saveArchiveService.ts`, `components/features/SaveLoad` | 稳定功能 | stores、migration、archive service、UI |
| 新建游戏 | 新建向导、背景、天赋、开局 preset | `components/features/NewGame/NewGameWizard.tsx`, `data/newGamePresets.ts`, `utils/openingConfig.ts` | Phase 3 | 默认题材、向导 copy、opening items、tests |
| 新建游戏 | 默认世界生成与开局变量 | `hooks/useGame/worldGenerationWorkflow.ts`, `hooks/useGame/openingStoryWorkflow.ts`, `hooks/useGame/runtimeVariableWorkflow.ts` | bugfix intake | 原始响应、max tokens、阶段重试、正文展示 |
| 本地模式包 | bundled/local modules 与导入导出 | `data/creativeWorkshopModules.ts`, `services/creativeWorkshop.ts`, `components/features/Workshop` | 稳定功能 | bundled data、local storage、file IO、validation |
| 本地模式包 | 模式包应用 | `utils/workshopEngine.ts`, `NewGameWizard.tsx` | 稳定功能 | apply pipeline、opening config、worldbook injection |
| 世界/环境/时间 | 世界状态、地点描述、日期时间 | `models/world.ts`, `models/environment.ts`, `hooks/useGame/timeUtils.ts` | 按需设计 | world model、env model、display、commands |
| 地图/地点 | 六层地点树、LocationBrowser、地图渲染 | `models/world.ts`, `utils/mapSpatial.ts`, `components/features/Map` | 专项设计后再动 | validators、selection state、renderers、CSS |
| 角色 | 玩家属性、身体状态、天赋、出身、体征 | `models/character.ts`, `components/features/Character`, `NewGameWizard.tsx` | 稳定功能 | model、UI、prompts、preset data、tests |
| 社交/NPC | NPC 档案、关系、队友、头像、记忆 | `models/social.ts`, `components/features/Social`, `hooks/useGame/npc*` | 稳定功能 | image records、retention、relationship sync、state |
| 社交/NPC | 位置和在场一致性 | `utils/mapNpcLocation.ts`, `hooks/useGame/npcContext.ts` | 专项设计后再动 | local guard、map/social sync、AI constraints |
| 女主/剧情规划 | StoryModal、HeroinePlanModal、后宫规划 | `components/features/Story`, `models/heroinePlan.ts`, `prompts/core/heroinePlan*` | bugfix intake | 红点条件、prompt rules、settings、UI |
| 背包/装备/货币 | 物品、装备槽、消耗品、奖励落地 | `models/item.ts`, `components/features/Inventory`, `components/features/Equipment`, `utils/taskRewards.ts` | bugfix intake | item model、UI、command handling、金额显示 |
| 任务/队伍 | Task、Team、奖励和事件调度入口 | `components/features/Task`, `components/features/Team`, `models/task.ts`, `models/social.ts` | 稳定功能 | task model、team state、reward rules、prompts |
| 图片管理 | ImageManager 与各类图片归档 | `components/features/ImageManager`, `services/ai/imageTasks.ts`, `hooks/useGame/*Image*` | 稳定功能 | task types、archives、cache、retry |
| 文生图后端 | ComfyUI workflow、settings、proxy | `components/features/Settings/ImageGenerationSettings.tsx`, `services/ai/image*`, `functions/api/image-backend` | 稳定功能 | workflow schema、validators、route、env、tests |
| 诊断/开发工具 | Context/History/Variable/NPC/WorkflowGraph | `components/features/Settings`, `services/diagnostic*` | 稳定功能 | modal、context builder、state edit paths |
| Cloudflare/Worker | 本地/API/图片代理辅助面 | `functions/api`, `wrangler.jsonc`, `scripts/build-worker.mjs` | 稳定功能 | routes、env、worker build、diagnostics |
| 测试体系 | Vitest/focused suite/E2E harness | `vitest.config.ts`, `__tests__`, `tests` | 稳定功能 | config、fixtures、focused suite definitions |
| 构建脚本 | package scripts、CNB/image/worker scripts | `package.json`, `scripts`, `functions/api` | 稳定功能 | scripts、npm entries、docs、env |
