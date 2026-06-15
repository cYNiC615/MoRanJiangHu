# Homebrew 功能地图与精简决策表

> 日期：2026-06-16
>
> 本文维护当前阶段边界。详细 Phase 2 工作台见
> `docs/homebrew-phase2-feature-audit-inventory.md`。

## 核心判断

这个 fork 正在被整理成个人 homebrew AI-native RPG framework。真正要保留
并迭代的是 SillyTavern-like harness：

- 本地设置、API 配置、主聊天和响应解析；
- prompt/worldbook/Tavern preset 注入；
- context budgeting、token 估算、记忆整理和召回；
- 本地状态、命令落地、IndexedDB 存档、ZIP 导入导出；
- 图片管理和生成能力，后端细节进入 Phase 2 审计；
- 男性向恋爱/亲密关系、“女主”概念和后宫玩法方向。

旧武侠/修仙、同人/原著融合、小说分解、拍卖行、旧战斗、移动/APK、
云同步、社区/公共运营和结构化天气/节日不再作为保留功能。
但“生成初始组织”和“生成初始同行者/同伴”是可现代化的通用玩法语义，
不能仅因旧字段名带有“门派/同门”就删除；Phase 2 只审计其命名、schema
和默认口径如何重构。

更具体地说，当前仓库不是“AI 直接写 UI”，也不是传统 RPG 引擎。它的
稳定基底是：

1. 前端维护本地游戏状态、设置、UI 和存档。
2. 世界书、提示词、Tavern preset、记忆、角色、环境、世界、历史对话按需拼装进上下文。
3. 主剧情模型输出 `<正文>`、`<短期记忆>`、`<变量规划>`、`<剧情规划>`、`<行动选项>` 等协议标签。
4. 本地 parser 把模型输出转成结构化响应。
5. 变量生成、世界演变、规划分析、地图更新等后台链路把自然语言规划转成命令或补丁。
6. 命令处理器校验并应用状态变化，写入 IndexedDB，并刷新前端 UI。

所以 Phase 2 审计不能把 prompt/worldbook/memory/parser/save 这些基底误判
为旧功能。后续代码化应优先从地点、时间、物品/货币/装备账务、任务调度、
NPC 在场一致性和新的轻量对抗系统切入；AI 仍负责开放叙事、对白、角色扮演
和场景创造。

## 仓库层级地图

| 层级 | 当前职责 | 关键位置 | Phase 2 审计注意 |
| --- | --- | --- | --- |
| 应用入口 | React/Vite 入口、全局 modal state、桌面布局 | `index.tsx`, `App.tsx`, `components/layout` | 保留壳，继续瘦 `App.tsx` 和旧 modal state |
| 主游戏 Hook | 状态、动作、回合、存档、设置、后台队列汇总 | `hooks/useGame.ts`, `hooks/useGame/*` | 核心保留，但必须拆掉已退役状态根和横切依赖 |
| AI 文本服务 | 请求、故事任务、响应解析、错误恢复 | `services/ai/chatCompletionClient.ts`, `services/ai/storyTasks.ts`, `services/ai/storyResponseParser.ts` | 保留主链；小说分解/同人/旧战斗专用出口已删或退役 |
| 提示词系统 | core/runtime/stats 提示词和内置槽位 | `prompts`, `utils/builtinPrompts.ts` | 保留机制；删退役题材、旧 schema 和误导状态 |
| 世界书/酒馆预设 | 世界书 CRUD、预算、作用域、preset 消息链 | `components/features/Worldbook`, `utils/worldbook.ts`, `hooks/useGame/promptRuntime.ts` | 核心保留 |
| 状态模型 | 角色、环境、世界、剧情、社交、任务、物品、图片 | `models`, `types.ts` | 保留当前仍用模型；退役字段按功能族删，不保旧存档兼容 |
| 命令落地 | 命令解析、路径保护、状态规范化、风险拦截 | `utils/stateHelpers.ts`, `hooks/useGame/responseCommandProcessor.ts` | 核心保留；退役根要 no-op 或删除 |
| 本地数据 | IndexedDB、设置、存档、图片资源、ZIP | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` | 必须保留；旧字段强迁移丢弃 |
| 前端功能面 | 设置、新建、聊天、地图、社交、背包、存档、模式包 | `components/features` | 逐项审计去留，避免误伤桌面主体验 |
| 图像服务 | 角色/场景/物品图片、Comfy/NovelAI 等后端 | `services/ai/image*`, `components/features/Image*`, `functions/api/image-*` | 功能保留到 Phase 2 审计；非 Comfy 后端是删除候选 |
| Cloudflare/Worker | API/图片代理/worker 构建 | `functions/api`, `scripts/build-worker.mjs`, `wrangler.jsonc` | 只评估本地/API/图片代理价值，不恢复公共运营 |

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

这条链路是 Phase 2 的保护线。删除旧功能时，目标是让旧字段不再被主动生成、
注入、保存或回写，而不是削弱主聊天和状态回写机制本身。

## 世界书与提示词机制

有两套容易混淆的上下文来源：

1. 内置提示词接管：`utils/builtinPrompts.ts` 根据内置槽位生成默认条目，
   内容来自 `prompts/*` fallback。用户在 PromptManager/Worldbook UI 保存后，
   IndexedDB 的 `builtin_prompt_entries` 可能覆盖代码 fallback。
2. 附加世界书注入：`extra_worldbooks` 与默认 preset 世界书合并后，经
   `utils/worldbook.ts` 按作用域、关键词、时间线和预算筛选注入。

因此只删源码 prompt 不等于运行时一定干净。Phase 2 删除提示词和世界书相关
旧口径时，需要同时考虑 IndexedDB reset/migration、内置条目隐藏、默认世界书
和本地 snapshot。

## 阶段边界

| Phase | 状态 | 说明 |
| --- | --- | --- |
| Phase 1 | 历史完成 | 废弃功能离开当前可玩主链路：玩家入口不可达、顶层副作用断开、active prompt/schema/命令维护停止。 |
| Phase 1.5 | 最终删除收尾 | 已明确废弃功能直接删完，不再留给 Phase 2；文档改成当前状态。 |
| Phase 2 | 功能审计准备/即将开始 | 审计删除后仍留下来的所有功能，逐项判定“留、删、迭代”。 |
| Phase 3 | 后续 | 现代都市默认化：默认新建、题材、世界观、货币、组织、地点和模式包口径同步转向现代都市。 |
| Phase 4+ | 后续 | 地点/时间/物品账务/任务/NPC/轻量对抗等代码化和系统化迭代。 |

## 当前保留骨架

| 功能域 | 当前判断 | 关键位置 |
| --- | --- | --- |
| 应用壳和主聊天 | 保留，Phase 2 细分审计 UI 和 modal state | `App.tsx`, `components/layout`, `components/features/Chat`, `hooks/useGame.ts` |
| AI 文本链路 | 保留，继续瘦身旧提示词口径 | `services/ai/chatCompletionClient.ts`, `services/ai/storyTasks.ts`, `services/ai/storyResponseParser.ts` |
| Prompt / Tavern preset | 核心保留，审计旧槽位、snapshot、reset/migration | `prompts`, `hooks/useGame/promptRuntime.ts`, `components/features/Settings` |
| 世界书 | 核心保留，本地 CRUD/import/export/budget/scope | `components/features/Worldbook`, `utils/worldbook.ts`, `models/worldbook.ts` |
| 记忆 | 核心保留，后续优化可观测性和预算 | `components/features/Memory`, `hooks/useGame/memory*` |
| 存档 | 必须保留；旧字段迁移可直接丢弃 | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` |
| 新建游戏/本地模式包 | 保留但重审默认、题材、模式包边界 | `components/features/NewGame`, `components/features/Workshop`, `utils/workshopEngine.ts` |
| 世界/地图/地点/时间 | 保留候选；地点和轻量时间适合代码化 | `models/world.ts`, `models/environment.ts`, `components/features/Map` |
| 角色/社交/NPC/女主规划 | 核心体验候选；NPC 位置和在场一致性需重做 | `models/character.ts`, `models/social.ts`, `models/heroinePlan.ts` |
| 背包/装备/货币/任务/队伍 | 保留候选；账务和调度适合本地规则 | `models/item.ts`, `models/task.ts`, `components/features` |
| 图片管理/文生图 | 功能保留，后端和代理细项 Phase 2 审计 | `components/features/Image*`, `services/ai/image*`, `functions/api/image-*` |
| 诊断/开发工具 | 待讨论：玩家 UI 可隐藏，开发能力可能保留 | `components/features/Settings`, `services/diagnostic*` |
| Cloudflare/Worker | 待讨论：只审计本地/API/图片代理价值 | `functions/api`, `scripts/build-worker.mjs`, `wrangler.jsonc` |

## Phase 1.5 收官判定

已明确删除的功能不再出现在当前 registry 历史表中。当前仍真实存在的退役
residue 只登记在 `docs/homebrew-dead-feature-registry.md`，不得伪装成已完成。
若发现新的残留，直接作为 bug 修掉：

- public release/APK/update/static pages；
- cloud sync/cloud play/community publishing/online ops；
- story export/novel decomposition/original-work adaptation；
- auction house；
- old battle UI/model/prompt command surface；`战斗` 空状态壳仍在 registry 中登记；
- sect/kungfu/skill/cultivation/realm；
- mobile/native/APK-only code；
- structured weather/festival command surface；字段空壳仍在 registry 中登记。

## Phase 2 工作方式

Phase 2 只处理留下来的功能清单：

1. 逐项讨论默认状态：`明确保留候选`、`明确删除候选`、`待讨论`。
2. 对删除项，源码、资源、脚本、测试、schema、storage 一起删。
3. 对保留项，记录迭代方向和最小验证。
4. 每一刀后跑 registry/focused tests/build/diff check，并记录 `tsc` 结果。

详细表：`docs/homebrew-phase2-feature-audit-inventory.md`。
