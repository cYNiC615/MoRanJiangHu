# Homebrew AI Native 当前事实快照

> 日期：2026-06-18
>
> 本文只记录当前架构事实和阶段边界。细粒度功能地图见
> `docs/homebrew-detailed-feature-map.md`。

## 当前判断

MoRanJiangHu homebrew fork 的核心是 AI-native RPG harness，而不是传统 RPG
引擎。当前价值集中在：

- 本地状态、设置、存档和 UI；
- OpenAI-compatible 文本请求、响应解析、错误恢复；
- prompt、worldbook、Tavern preset、记忆、token/context 预算；
- 本地命令解析、状态回写、IndexedDB/ZIP 存档；
- 图片生成与管理，文生图后端以 ComfyUI 为当前边界。

AI 仍负责开放叙事、对白和角色扮演。本地代码后续优先接管地点、时间、
物品/货币/装备账务、任务调度、NPC 在场一致性和新的轻量对抗系统。

当前主轴可概括为“上下文控制 + 协议输出 + 本地落地”：

| 环节 | 当前角色 | 代表文件 |
| --- | --- | --- |
| 上下文控制 | prompt、worldbook、Tavern preset、memory、状态快照组装 | `hooks/useGame/systemPromptBuilder.ts`, `hooks/useGame/promptRuntime.ts`, `utils/worldbook.ts` |
| 协议输出 | 模型输出正文、短期记忆、变量规划、剧情规划、行动选项、命令 | `prompts/core`, `prompts/runtime`, `services/ai/chatCompletionClient.ts` |
| 本地解析 | tag parser、对话 sender 规范化、错误恢复 | `services/ai/storyResponseParser.ts`, `utils/dialogueLogNormalizer.ts` |
| 状态落地 | 命令路径保护、状态规范化、风险拦截、任务奖励结算 | `utils/stateHelpers.ts`, `hooks/useGame/responseCommandProcessor.ts`, `hooks/useGame/stateTransforms.ts` |
| 持久化 | IndexedDB 设置/存档/图片资源、ZIP 导入导出 | `services/dbService.ts`, `services/saveArchiveService.ts`, `hooks/useGame/saveCoordinator.ts` |

## Homebrew 锚点

- 默认体验后续转向现代都市，可扩展近未来科幻。
- 本地设置、API 配置、本地存档、世界书、记忆、PromptManager、Tavern preset、主聊天和本地模式包是当前基底。
- 男性向恋爱/亲密关系和“女主”概念继续存在，后续优化后宫模式。
- 初始组织/成员生成功能继续存在，`玩家组织` 作为通用组织状态根继续承载这块功能。
- 后续代码化优先从地点、时间、账务、任务、NPC 在场一致性和轻量对抗切入。

## 当前阶段

Phase 2.5 已正式完成。当前下一步是 Phase 3：现代都市默认化、手动 smoke 待处理项、
以及具体功能迭代/bugfix intake。

当前阶段入口：

- 主阶段边界：`docs/homebrew-function-map-and-simplification-decision-table.md`
- 详尽功能地图与 smoke 待处理项：`docs/homebrew-detailed-feature-map.md`

## 当前验证门禁

Phase 2.5 closeout 使用以下门禁收口：

- focused Vitest；
- `npx tsc --noEmit --pretty false`；
- `npm run build`；
- `git diff --check`；
- 用户手动 smoke。

后续工作如果属于新玩法设计、现代默认化或更好架构，进入 Phase 3 或以后；如果属于
当前 broken path，则按具体 bugfix 处理。
