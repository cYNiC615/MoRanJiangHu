# Homebrew 功能地图与精简决策表

> 日期：2026-06-17
>
> 本文维护当前阶段边界、主功能地图和已退役功能护栏。细粒度功能地图见
> `docs/homebrew-detailed-feature-map.md`。

## 核心判断

这个 fork 正在被整理成个人 homebrew AI-native RPG framework。真正的
核心不是传统 RPG 引擎，而是 SillyTavern-like harness：

- 本地设置、API 配置、主聊天和响应解析；
- prompt/worldbook/Tavern preset 注入；
- context budgeting、token 估算、记忆整理和召回；
- 本地状态、命令落地、IndexedDB 存档、ZIP 导入导出；
- 图片管理和生成能力，文生图后端已收束为 ComfyUI-only；
- 男性向恋爱/亲密关系、“女主”概念和后宫玩法方向。

旧武侠/修仙、同人/原著融合、小说分解、拍卖行、旧战斗、移动/APK、
云同步、社区/公共运营和结构化天气/节日已经不再作为当前产品方向维护。
“生成初始组织”和“生成初始同行者/同伴”作为可现代化的通用玩法语义继续存在；
旧题材化 schema、helper 和 synthetic id 命名已泛化，`玩家组织` 作为通用
组织状态根继续承载这块功能。

## Phase 2 收口后的当前状态

- 货币系统已收束为现代单一货币；旧三层/层级货币、货币编辑器、旧资源开关、钱包别名字段和相关模式包编辑入口已删除或迁移。
- 旧拍卖行系统已删除；题材市场口径只作为通用 `marketName`/`marketVerb` 存在，旧 auction/retired-market 命名已从代码清掉。
- “工坊”主命名已在玩家可见 UI 改为“本地模式包”；模式包机制继续存在，内部兼容命名只作为 Phase 2.5 的机械迁移面。
- 七部位身体系统已审计为非简单删除项，进入身体/伤势模型专项重构；装备槽、私密档案部位和对白标签保护不归入这次删除面。
- 约定系统已从当前代码删除，后续语义只在任务系统中重建。
- 图片管理继续作为当前功能面；文生图后端只使用 ComfyUI，其他后端、代理、设置、测试和旧图床辅助脚本已删除，旧后端命名的图片词组策略已中性化。
- 图片资源暂时不动，不因旧题材资源阻塞 Phase 2.5。
- 开发/诊断工具继续存在；Worker/CNB/脚本仅围绕 ComfyUI 后端实际需要的部分，固定公开域名 route 已删除。
- 依赖 `.tmp-release-assets/WuXia_Save_Data.zip` 的旧 release/Wuxia Playwright 规格已删除；E2E 只维持仍可运行的本地回归。

更具体地说，当前仓库不是“AI 直接写 UI”，也不是传统 RPG 引擎。它的
稳定基底是：

1. 前端维护本地游戏状态、设置、UI 和存档。
2. 世界书、提示词、Tavern preset、记忆、角色、环境、世界、历史对话按需拼装进上下文。
3. 主剧情模型输出 `<正文>`、`<短期记忆>`、`<变量规划>`、`<剧情规划>`、`<行动选项>` 等协议标签。
4. 本地 parser 把模型输出转成结构化响应。
5. 变量生成、世界演变、规划分析、地图更新等后台链路把自然语言规划转成命令或补丁。
6. 命令处理器校验并应用状态变化，写入 IndexedDB，并刷新前端 UI。

后续代码化应优先从地点、时间、物品/货币/装备账务、任务调度、NPC 在场一致性
和新的轻量对抗系统切入；AI 仍负责开放叙事、对白、角色扮演和场景创造。

## 仓库层级地图

| 层级 | 当前职责 | 关键位置 | 后续注意 |
| --- | --- | --- | --- |
| 应用入口 | React/Vite 入口、全局 modal state、桌面布局 | `index.tsx`, `App.tsx`, `components/layout` | Phase 2.5 优先瘦 `App.tsx` 和旧 modal state |
| 主游戏 Hook | 状态、动作、回合、存档、设置、后台队列汇总 | `hooks/useGame.ts`, `hooks/useGame/*` | 拆掉横切依赖，避免恢复已退役状态根 |
| AI 文本服务 | 请求、故事任务、响应解析、错误恢复 | `services/ai/chatCompletionClient.ts`, `services/ai/storyTasks.ts`, `services/ai/storyResponseParser.ts` | 主链稳定，旧题材专用出口不得恢复 |
| 提示词系统 | core/runtime/stats 提示词和内置槽位 | `prompts`, `utils/builtinPrompts.ts` | 继续清旧题材口径、旧 schema 和误导状态 |
| 世界书/酒馆预设 | 世界书 CRUD、预算、作用域、preset 消息链 | `components/features/Worldbook`, `utils/worldbook.ts`, `hooks/useGame/promptRuntime.ts` | 属于上下文核心机制 |
| 状态模型 | 角色、环境、世界、剧情、社交、任务、物品、图片 | `models`, `types.ts` | 当前仍用模型按功能域重构，不做旧存档兼容负担 |
| 命令落地 | 命令解析、路径保护、状态规范化、风险拦截 | `utils/stateHelpers.ts`, `hooks/useGame/responseCommandProcessor.ts` | 已退役根应 no-op 或删除 |
| 本地数据 | IndexedDB、设置、存档、图片资源、ZIP | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` | 旧字段强迁移可直接丢弃 |
| 前端功能面 | 设置、新建、聊天、地图、社交、背包、存档、本地模式包 | `components/features` | Phase 2.5 只做结构整理，不改玩法语义 |
| 图像服务 | 角色/场景/物品图片、ComfyUI 后端 | `services/ai/image*`, `components/features/Image*`, `functions/api/image-*` | ComfyUI-only 是当前边界 |
| Cloudflare/Worker | API/图片代理/worker 构建 | `functions/api`, `scripts/build-worker.mjs`, `wrangler.jsonc` | 只承载 ComfyUI/CNB/diagnostics 与本地/API 辅助价值 |

## 主运行链路

当前主回合可按下面追踪：

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

这条链路是 Phase 2.5 的保护线。结构重构的目标是让旧字段不再被主动生成、
注入、保存或回写，同时不削弱主聊天和状态回写机制本身。

## 世界书与提示词机制

有两套容易混淆的上下文来源：

1. 内置提示词接管：`utils/builtinPrompts.ts` 根据内置槽位生成默认条目，
   内容来自 `prompts/*` fallback。用户在 PromptManager/Worldbook UI 保存后，
   IndexedDB 的 `builtin_prompt_entries` 可能覆盖代码 fallback。
2. 附加世界书注入：`extra_worldbooks` 与默认 preset 世界书合并后，经
   `utils/worldbook.ts` 按作用域、关键词、时间线和预算筛选注入。

因此只删源码 prompt 不等于运行时一定干净。后续清理提示词和世界书相关
旧口径时，需要同时考虑 IndexedDB reset/migration、内置条目隐藏、默认世界书
和本地 snapshot。

## 阶段边界

| Phase | 状态 | 说明 |
| --- | --- | --- |
| Phase 1 | 历史完成 | 废弃功能离开当前可玩主链路：玩家入口不可达、顶层副作用断开、active prompt/schema/命令维护停止。 |
| Phase 1.5 | 历史完成 | 已明确废弃功能完成最终删除收尾，文档改成当前状态。 |
| Phase 2 | 已收口 | 完成留下功能的去留分流和第一轮深删；详尽功能地图改为当前结构地图。 |
| Phase 2.5 | 下一阶段 | 不做功能删除、新增或玩法语义调整；只做面向未来方向的代码结构整理，并在重构中清掉确认无主的残留。 |
| Phase 3 | 后续 | 现代都市默认化：默认新建、题材、世界观、货币、组织、地点和模式包口径同步转向现代都市。 |
| Phase 4+ | 后续 | 地点/时间/物品账务/任务/NPC/轻量对抗等代码化和系统化迭代。 |

## 当前功能骨架

| 功能域 | 当前判断 | 关键位置 |
| --- | --- | --- |
| 应用壳和主聊天 | Phase 2.5 优先结构整理 UI 和 modal state | `App.tsx`, `components/layout`, `components/features/Chat`, `hooks/useGame.ts` |
| AI 文本链路 | 继续瘦身旧提示词口径 | `services/ai/chatCompletionClient.ts`, `services/ai/storyTasks.ts`, `services/ai/storyResponseParser.ts` |
| Prompt / Tavern preset | 上下文核心机制，重点审计旧槽位、snapshot、reset/migration | `prompts`, `hooks/useGame/promptRuntime.ts`, `components/features/Settings` |
| 世界书 | 本地 CRUD/import/export/budget/scope | `components/features/Worldbook`, `utils/worldbook.ts`, `models/worldbook.ts` |
| 记忆 | 后续优化可观测性和预算 | `components/features/Memory`, `hooks/useGame/memory*` |
| 存档 | 本地必需能力；旧字段迁移可直接丢弃 | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` |
| 新建游戏/本地模式包 | 重审默认、题材、模式包边界 | `components/features/NewGame`, `components/features/Workshop`, `utils/workshopEngine.ts` |
| 世界/地图/地点/时间 | 地点和轻量时间适合代码化 | `models/world.ts`, `models/environment.ts`, `components/features/Map` |
| 角色/社交/NPC/女主规划 | 核心体验面；NPC 位置和在场一致性需重做 | `models/character.ts`, `models/social.ts`, `models/heroinePlan.ts` |
| 背包/装备/货币/任务/队伍 | 账务和调度适合本地规则 | `models/item.ts`, `models/task.ts`, `components/features` |
| 图片管理/文生图 | ComfyUI-only；其他后端和代理不得恢复 | `components/features/Image*`, `services/ai/image*`, `functions/api/image-*` |
| 诊断/开发工具 | 玩家 UI 是否隐藏留到后续 UI 重构 | `components/features/Settings`, `services/diagnostic*` |
| Cloudflare/Worker | 仅承载 ComfyUI/CNB/diagnostics 需要的本地/API/图片代理价值 | `functions/api`, `scripts/build-worker.mjs`, `wrangler.jsonc` |

## 已退役功能护栏

旧 dead feature registry 已合并回本文，不再作为单独文档维护。
当前没有已知 live retired-feature residue。No live retired-feature residue is
currently tracked in a separate registry.

如果后续审计发现真实残留，处理顺序固定：

1. 先枚举所有可能相关的 UI、model、prompt、command、storage、script、test 和 doc 面。
2. 能直接删除就同一轮删干净，不接受只断开入口。
3. 不能立刻删除时，临时登记到本文或 `docs/homebrew-detailed-feature-map.md` 的当前状态段，直到清理完成。

退役功能族不得恢复为运行时代码、状态根、prompt 协议、测试 fixture 或玩家入口：

- public release/APK/update/static pages；
- cloud sync/cloud play/community publishing/online ops；
- story export/novel decomposition/original-work adaptation；
- auction house；
- old battle UI/model/prompt command surface and old `战斗` state root；
- sect/kungfu/skill/cultivation/realm；
- mobile/native/APK-only code；
- structured weather/festival command surface and environment field shell；
- non-ComfyUI image backends and external image-host proxy/storage chain；
- agreement system as an independent feature family.

## Phase 2.5 工作方式

Phase 2.5 是结构重构期，不是功能删改期：

1. 不做功能删除、新增或玩家可见玩法语义调整。
2. 每次动手前先罗列相关入口、模型、prompt、命令、storage、脚本、测试和文档面。
3. 优先整理 `App.tsx`/modal state、`hooks/useGame` 横切依赖、设置/模式包命名、测试护栏和文档结构。
4. 重构中发现确认无主的残留，可以按已退役功能护栏清理；不确定的先放回详尽功能地图，不硬拆。
5. 每轮结束跑 focused tests、`npm run build`、`git diff --check`；`npx tsc --noEmit` 若仍受既有类型债影响，必须如实记录。

详细表：`docs/homebrew-detailed-feature-map.md`。
