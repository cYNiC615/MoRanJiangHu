# Homebrew Phase 3.2 Modern Urban Implementation Status

> 日期：2026-06-20
>
> 本文记录 Phase 3.2 的当前实现状态和下一步工作。设计边界和仍有效的
> 方向性决策见 `docs/homebrew-phase3.2-modern-urban-decisions.md`。

## 已完成事实

Phase 3.1 第一轮现代都市默认化已经落地：默认题材 fallback 指向现代都市，
现代都市小核心背景/天赋池已替换，默认不开组织、不生成成员、不启用初始伙伴；
`玩家剧情倾向` 已注入开局、主链、变量校准、规划分析和世界演变；
主剧情协议已支持 `<后处理信号>` 并完成 parser 基础覆盖；第 0 回合已有现代都市
首条主线牵引；活跃入口基本显示 `红颜录 / 红颜规划`，内部仍保留
`女主剧情规划` 语义。

Pre-Phase3 smoke bugfix 也已完成：市场入口展示块已移除，货币卡片不再暴露
`baseAmount`，队列假重试按钮已收紧，变量续跑不再先清空正文，红点条件已按
实际可读内容收紧。开局变量输出疑似截断未发现前端展示或阶段保存截断；
已补非流式 `finish_reason = "length"` / max tokens 截断拦截，若复现再结合
原始响应和渠道 finish reason 定位。

## 当前需要校正的实现判断

- 默认现代世界书注入还需要再审一次路径一致性。当前实现已经有现代 profile 和部分
  mode worldbook fallback，但普通直接开始、快速重开和保存预设路径是否完全一致，不能
  只按“已完成”处理。
- `<后处理信号>` 已可解析；但本地语义兜底还不是完整规则层。现在更准确的状态是：
  缺失/解析失败会走安全兜底，可靠信号判断不需要时可能跳过后处理。
- 现代默认 prompt 仍有强制势力残留，尤其是世界生成、开局变量初始化、开局世界演变、
  世界演变 schema 和世界统计说明里的 `势力列表 / 势力互动历史` 口径。
- 活跃 UI copy 已改一批，但仍存在 `江湖谱`、`江湖卷宗`、以及“主动生成红颜 NPC”
  这类需要按现代默认路径再审的文案。

## Phase 3.2 剩余工作

### 1. 默认现代 runtime / prompt 正确性

目标：让“什么都不选就是现代都市”在普通开始、快速重开、保存预设和恢复路径中一致，
并清掉现代默认链路里仍会强制组织/势力的旧规则。

要做：

- 把默认现代 mode worldbook fallback 放到共享 runtime/default normalization 路径，避免只在某个 UI 构建预设路径生效。
- 明确现代都市默认世界书的实际注入作用域；UI 不显示为已选择模式包，但 runtime snapshot 应可验证。
- 清理世界生成、开局变量初始化、开局世界演变初始化、世界演变、世界数据 schema、
  world stats 中的强制势力数量、强制势力互动历史和旧门派/家族/商会优先级。
- 让 `世界.势力列表` 在现代默认路径允许为空；只有明确组织行动、利益集团、学校/公司/社团等证据时才写入。
- 收紧默认主线和任务 prompt 质量规则：主线不是短待办，应有阶段目标、阻力、变化空间和具体锚点。
- 小范围审计活跃默认路径 copy，优先改玩家会看到的古风/组织默认口径。

主要文件面：

- `components/features/NewGame/NewGameWizard.tsx`
- `utils/openingConfig.ts`
- `utils/workshopEngine.ts`
- `utils/modeRuntimeProfile.ts`
- `data/creativeWorkshopModules.ts`
- `prompts/runtime/worldGeneration.ts`
- `prompts/runtime/openingVariableGenerationInit.ts`
- `prompts/runtime/openingWorldEvolutionInit.ts`
- `prompts/runtime/worldEvolution.ts`
- `prompts/runtime/worldDataSchema.ts`
- `prompts/stats/world.ts`

建议验证：

- 默认现代 runtime snapshot / modeWorldbooks focused tests。
- prompt string tests：现代默认不要求 `5-15` 个势力，不要求非空势力互动历史。
- 默认开局配置 normalization tests。

### 2. 后处理调度规则收口

目标：把 `<后处理信号>` 从“能解析”推进到“调度语义清楚”。

要先定：

- 是否接受当前策略：可靠信号为否时跳过，只有缺失/解析失败才全量兜底。
- 或者新增最小本地规则：主线缺失、主线完成/失效、玩家意图转向、新主要角色成立、
  关系突破/冲突升级、时间地点大跨度切换、重大事件发生时，即使信号为否也触发对应后处理。

建议实现：

- 先做小规则，不做复杂调度引擎。
- 规则命中只决定是否进入规划/世界演变，不直接生成任务或状态。
- 队列诊断里保留触发原因，方便手动 smoke。

主要文件面：

- `hooks/useGame/sendWorkflow.ts`
- `services/ai/storyResponseParser.ts`
- `prompts/core/format.ts`
- 相关 parser / workflow tests

### 3. B-lite 行为字段与红颜规划 v2

目标：让已登场、确有承接价值的女性重要角色有足够“内因材料”，供变量生成、
规划分析和女主规划生成更稳定的互动事件与镜头条件。

要做：

- 定 `B-lite` 字段名、必填/可选、旧字段兼容读取和更新时机。
- 首版字段应覆盖性格底色、核心欲望、当前 agenda、防御机制、交流风格、情感需求、
  吸引点、戒备点、亲密阻力、边界/硬锁、后宫兼容路径。
- 变量生成负责在首次形成强互动、关系阶段变化或 agenda 改变时补齐/更新。
- 规划分析读取这些字段，生成阶段、事件、镜头和推进条件。
- 女主规划 v2 只在确有可读内容或待处理更新时写入；空壳不点亮红点。
- 非在场重要角色摘要需要 token 预算，不把完整档案每回合塞入主链。

主要文件面：

- `models/social.ts`
- `models/heroinePlan.ts`
- `prompts/runtime/variableGeneration.ts`
- `prompts/core/heroinePlan*`
- `hooks/useGame/planningUpdateWorkflow.ts`
- `hooks/useGame/variableModelWorkflow.ts`
- `hooks/useGame/contextSnapshot.ts`
- `services/ai/storyTasks.ts`

建议验证：

- 社交字段 normalization / patch tests。
- 变量命令测试：能补齐行为字段，不覆盖稳定人格。
- 女主规划 prompt/context tests：只读取女性重要角色，不对空数据生成规划。
- 红点状态测试：无可读内容不亮，有待处理更新才亮。

### 4. 角色种子池与导演配置块

目标：让玩家能预设未来自然出现的女性角色素材，同时不把未登场角色提前变成
世界事实、社交档案或女主规划。

要做：

- 新增存档级导演配置块，承载 `玩家剧情倾向` 和角色种子池；如果迁移现有
  `OpeningConfig.玩家剧情倾向`，保留旧字段读取兼容。
- 设计角色种子定义结构和运行时状态结构，并保持二者分离。
- 首版 UI 建议只放新建游戏；游戏中先读取和消费，不先做完整编辑器。
- 角色种子常态只注入入口摘要；命中当前场景、玩家行动、规划或后处理原因时再展开完整卡片。
- 变量生成和规划分析在满足 NPC 建档门槛时，把种子转正到 `社交[]`，并记录 `linkedNpcId / linkedNpcName`。
- 本地层做防重复：已转正种子不再作为新 NPC 素材；高度重合的新 NPC 优先视为同一角色补档。

待定细节：

- 导演配置块字段名。
- `关系入口标签` 首版枚举。
- 种子摘要和完整卡片 prompt 文案。
- `linkedNpcId` 对应 NPC 改名、删除、恢复或合并时如何降级。
- 是否需要游戏中新增/修改种子的轻入口；若不做，需要说明改动只影响未来引入，不回改已转正 NPC。

主要文件面：

- `models/system.ts` 或新增 director model
- `hooks/useGameState.ts`
- `hooks/useGame/saveCoordinator.ts`
- `services/dbService.ts`
- `components/features/NewGame/NewGameWizard.tsx`
- prompt runtime helpers
- planning / variable workflows

建议验证：

- seed model / normalization / save snapshot tests。
- prompt 注入 tests：入口摘要常驻，完整卡片触发展开。
- 防重复 tests：已转正种子不会再次生成第二个 NPC。

## 不放进 Phase 3.2 的事

- 不做全局角色模板库、角色包导入导出或跨存档同步。
- 不做复杂触发脚本、章节锁、事件脚本或完整引入历史日志。
- 不支持玩家定制男角色、男娘或扶她角色种子。
- 不重写任务 UI、地图系统、组织系统、世界势力系统或保存结构。
- 不为了古风清零改掉可选旧题材、历史兼容字段或 PromptManager 中的协议名。

## 验证收口

- 本轮继续以 focused tests 为主。
- 需要 UI smoke 时，只启动服务器，由用户手动浏览器测试。
- 文档更新原则：完成项只在本状态文档里短记事实；剩余工作保持可执行、可删减、可继续拆任务。
