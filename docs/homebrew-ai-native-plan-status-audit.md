# Homebrew AI Native 当前事实快照

> 日期：2026-06-16
>
> 本文只记录当前架构事实和阶段边界。细粒度功能审计见
> `docs/homebrew-phase2-feature-audit-inventory.md`。

## 当前判断

MoRanJiangHu homebrew fork 的核心是 AI-native RPG harness，而不是传统
RPG 引擎。保留价值集中在：

- 本地状态、设置、存档和 UI；
- OpenAI-compatible 文本请求、响应解析、错误恢复；
- prompt、worldbook、Tavern preset、记忆、token/context 预算；
- 本地命令解析、状态回写、IndexedDB/ZIP 存档；
- 图片生成与管理，具体后端进入 Phase 2 审计。

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

Phase 2 审计应优先围绕这些环节判断一个功能到底是“核心机制的一部分”，
还是“旧题材/旧产品形态挂在机制上的包袱”。例如 PromptManager 和世界书是核心；
某个武侠/同人/小说分解 prompt 槽位不是核心。

## Homebrew 锚点

- 默认体验后续转向现代都市，可扩展近未来科幻。
- 不保留旧武侠/修仙/同人/小说分解存档兼容。
- 不做移动端、APK、云同步、社区 UGC、公共在线运营。
- 保留本地设置、API 配置、本地存档、世界书、记忆、PromptManager、
  Tavern preset、主聊天和本地模式包。
- 保留男性向恋爱/亲密关系和“女主”概念，后续优化后宫模式。
- 旧战斗 UI/model/prompt 命令面已删除，`战斗` 空状态壳仍作为 registry residue。
  未来轻量对抗设计另起模型，不复用旧功法、站位和传统对打结构。
- 天气只能作为正文氛围，节日不作为系统。
- `开局生成门派` / `开局生成同门` 这类历史命名不能仅凭字面删除；当前分别按
  “生成初始组织/归属结构”和“开局生成同行者/同伴名录”进入 Phase 2 审计。
  若要改名或重构，需保留组织与同伴功能语义。

## 当前阶段

Phase 1 已完成：废弃功能离开当前可玩主链路。

Phase 1.5 final closeout 正在收口：已明确废弃的前端、服务、资源、脚本、
prompt、model、storage/test 残留应直接删除；仍真实存在的状态壳必须登记在
dead feature registry 中，不得在 Phase 2 审计里被当成保留功能。但删除时必须
区分“旧命名”和“旧功能”：压力测试、项目总览文档、开局同伴名录等仍服务
后续工程或核心玩法的内容不应因为带有历史文本而整包删除。

Phase 2 即将开始：只审计仍留下来的功能，按细粒度逐项讨论“删除还是
迭代”。所有 Phase 2 判定为删除的功能都必须源码、资源、脚本、测试、
schema、storage 一起删。

## 当前验证门禁

- 每轮删除至少跑 registry 测试、相关 focused tests、`npm run build`、
  `git diff --check`。
- `npx tsc --noEmit` 必须记录结果。若仍有既有类型债，不把它说成绿色。
- 阶段末由用户本地 smoke：主页、开局、主聊天、设置、存档、世界书、
  PromptManager、记忆、图片管理、本地模式包。

## 参考文档

- `docs/homebrew-function-map-and-simplification-decision-table.md`
- `docs/homebrew-dead-feature-registry.md`
- `docs/homebrew-phase2-feature-audit-inventory.md`
