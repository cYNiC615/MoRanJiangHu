# Homebrew 功能地图与阶段边界

> 日期：2026-06-18
>
> 本文维护当前阶段边界和主功能地图。细粒度功能地图见
> `docs/homebrew-detailed-feature-map.md`。

## 当前判断

这个 fork 正在被整理成个人 homebrew AI-native RPG framework。真正的核心不是
传统 RPG 引擎，而是 SillyTavern-like harness：

- 本地设置、API 配置、主聊天和响应解析；
- prompt/worldbook/Tavern preset 注入；
- context budgeting、token 估算、记忆整理和召回；
- 本地状态、命令落地、IndexedDB 存档、ZIP 导入导出；
- 图片管理和生成能力，文生图后端以 ComfyUI 为当前边界；
- 男性向恋爱/亲密关系、“女主”概念和后宫玩法方向。

Phase 2.5 已正式完成。当前工作不再继续扩张 2.5 重构范围；下一步从
Phase 3 功能迭代或已记录的具体 bugfix/smoke 问题开始。

## 阶段边界

| Phase | 状态 | 说明 |
| --- | --- | --- |
| Phase 1 | 历史完成 | 主链路与阶段边界完成初步整理。 |
| Phase 1.5 | 历史完成 | 第一轮收尾完成，文档改为当前状态。 |
| Phase 2 | 已收口 | 功能去留分流和第一轮深删完成。 |
| Phase 2.5 | 已完成 | 结构整理、命名收束、无主残留清理和验证收口完成；不再新增 2.5 重构方向。 |
| Phase 3 | 当前下一阶段 | 现代都市默认化、手动 smoke 待处理项、以及具体功能迭代/bugfix intake。 |
| Phase 4+ | 后续 | 地点、时间、账务、任务、NPC 在场一致性、轻量对抗等系统化迭代。 |

## 当前功能骨架

| 功能域 | 当前判断 | 关键位置 |
| --- | --- | --- |
| 应用壳和主聊天 | 保留核心入口、布局、聊天、reroll 和后台队列展示 | `App.tsx`, `components/layout`, `components/features/Chat`, `hooks/useGame.ts` |
| AI 文本链路 | OpenAI-compatible 请求、阶段模型选择、响应解析和错误恢复 | `services/ai/chatCompletionClient.ts`, `services/ai/storyTasks.ts`, `services/ai/storyResponseParser.ts` |
| Prompt / Tavern preset | 上下文核心机制，支持内置槽位、用户覆盖、preset 消息链 | `prompts`, `hooks/useGame/promptRuntime.ts`, `utils/builtinPrompts.ts` |
| 世界书 | 本地 CRUD/import/export/budget/scope，支持 PromptManager 保存链路 | `components/features/Worldbook`, `utils/worldbook.ts`, `models/worldbook.ts` |
| 记忆 | 短期/长期/NPC 记忆、整理、召回和预算 | `components/features/Memory`, `hooks/useGame/memory*` |
| 存档 | 本地必需能力：手动/自动存档、ZIP 导入导出、IndexedDB | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` |
| 新建游戏/本地模式包 | 背景、天赋、开局快照、模式包恢复和本地导入导出 | `components/features/NewGame`, `components/features/Workshop`, `services/creativeWorkshop.ts`, `utils/openingConfig.ts` |
| 世界/地图/地点/时间 | 当前状态继续保留，后续按具体系统设计推进代码化 | `models/world.ts`, `models/environment.ts`, `components/features/Map` |
| 角色/社交/NPC/女主规划 | 核心体验面，后续围绕后宫玩法和 NPC 一致性继续迭代 | `models/character.ts`, `models/social.ts`, `models/heroinePlan.ts` |
| 背包/装备/货币/任务/队伍 | 当前 UI 与命令落地保留；账务、本地规则和展示 bug 进入后续 bugfix | `models/item.ts`, `models/task.ts`, `components/features` |
| 图片管理/文生图 | 图片管理保留；ComfyUI 后端、workflow 和相关代理是当前边界 | `components/features/Image*`, `services/ai/image*`, `functions/api/image-*` |
| 诊断/开发工具 | 保留本地调试、context/history/variable/NPC 管理与 workflow graph | `components/features/Settings`, `services/diagnostic*` |
| Cloudflare/Worker | 只服务当前本地/API/图片代理辅助价值，不扩张发布运营面 | `functions/api`, `scripts/build-worker.mjs`, `wrangler.jsonc` |

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

这条链路是 Phase 3 和后续 bugfix 的保护线。后续任何结构调整都必须保留主聊天、
PromptManager、世界书、记忆、本地设置、API 配置、存档、本地模式包、图片管理和
ComfyUI 后端。

## 世界书与提示词机制

有两套容易混淆的上下文来源：

1. 内置提示词接管：`utils/builtinPrompts.ts` 根据内置槽位生成默认条目，
   内容来自 `prompts/*` fallback。用户在 PromptManager/Worldbook UI 保存后，
   IndexedDB 的 `builtin_prompt_entries` 可能覆盖代码 fallback；主剧情、开局、
   变量生成、记忆精炼和地图更新等内置槽位消费者都从这里读取。
2. 附加世界书注入：`extra_worldbooks` 与默认 preset 世界书合并后，经
   `utils/worldbook.ts` 按作用域、关键词、时间线和预算筛选注入。

因此只改源码 prompt 不等于运行时一定生效。后续调整提示词和世界书相关逻辑时，
需要同时考虑 IndexedDB reset/migration、内置条目隐藏、默认世界书和本地 snapshot。

## Phase 2.5 Closeout

Phase 2.5 收尾后不再新增重构方向：

1. 不拆 `hooks/useGame.ts` 新模块，除非是删除已确认无消费者出口。
2. 不移动文件夹、不引入新抽象、不新增兼容层。
3. 后续只围绕 Phase 3 功能迭代、具体 bugfix 或明确的系统设计继续动代码。
4. 每个后续切口仍需先枚举相关 UI、model、prompt、command、storage、script、test、doc 面。

Closeout 验证门禁：

- focused Vitest；
- `npx tsc --noEmit --pretty false`；
- `npm run build`；
- `git diff --check`；
- 用户手动 smoke 记录到 `docs/homebrew-detailed-feature-map.md`。
