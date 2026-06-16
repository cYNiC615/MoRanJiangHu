# Homebrew AI Native 当前事实快照

> 日期：2026-06-17
>
> 本文只记录当前架构事实和阶段边界。细粒度功能地图见
> `docs/homebrew-detailed-feature-map.md`。

## 当前判断

MoRanJiangHu homebrew fork 的核心是 AI-native RPG harness，而不是传统
RPG 引擎。当前价值集中在：

- 本地状态、设置、存档和 UI；
- OpenAI-compatible 文本请求、响应解析、错误恢复；
- prompt、worldbook、Tavern preset、记忆、token/context 预算；
- 本地命令解析、状态回写、IndexedDB/ZIP 存档；
- 图片生成与管理；文生图后端已完成 ComfyUI-only 收束。

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

Phase 2 审计已经收口。后续进入 Phase 2.5：只做结构重构和残留清理，不做
功能删除、新增或玩家可见玩法语义调整。

## Homebrew 锚点

- 默认体验后续转向现代都市，可扩展近未来科幻。
- 不做旧武侠/修仙/同人/小说分解存档兼容。
- 不做移动端、APK、云同步、社区 UGC、公共在线运营。
- 本地设置、API 配置、本地存档、世界书、记忆、PromptManager、Tavern preset、主聊天和本地模式包是当前基底。
- 男性向恋爱/亲密关系和“女主”概念继续存在，后续优化后宫模式。
- 旧战斗 UI/model/prompt 命令面和 `战斗` 状态根已删除。未来轻量对抗设计另起模型，不复用旧功法、站位和传统对打结构。
- 天气只能作为正文氛围，节日不作为系统。
- 初始组织/成员生成功能继续存在；旧题材化 schema、helper 和 synthetic id 命名已泛化为组织口径，`玩家组织` 作为通用组织状态根继续存在。

## 当前阶段

Phase 1 已完成：废弃功能离开当前可玩主链路。

Phase 1.5 final closeout 已完成：已明确废弃的前端、服务、资源、脚本、
prompt、model、storage/test 残留不再留给 Phase 2。

Phase 2 已收口：剩余功能的去留分流和第一轮深删完成。原 Phase 2 inventory
已改为 `docs/homebrew-detailed-feature-map.md`，作为后续详尽功能地图使用。

Phase 2.5 是下一阶段：不做功能删除、新增或玩法语义调整，只按未来方向重构
当前代码结构，并在这个过程中清理确认无主的残存问题。旧 dead feature registry
已并回主阶段文档的护栏段。

## 当前验证门禁

- 每轮结构重构至少跑相关 focused tests、`npm run build`、`git diff --check`。
- `npx tsc --noEmit` 必须记录结果。若仍有既有类型债，不把它说成绿色。
- 阶段末由用户本地 smoke：主页、开局、主聊天、设置、存档、世界书、
  PromptManager、记忆、图片管理、本地模式包。

## 参考文档

- `docs/homebrew-function-map-and-simplification-decision-table.md`
- `docs/homebrew-detailed-feature-map.md`
