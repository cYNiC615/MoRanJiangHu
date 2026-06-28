# Homebrew Roadmap

> 日期：2026-06-29
>
> 本文只记录未来阶段方向，不展开实现计划。当前事实以
> `docs/homebrew-detailed-feature-map.md` 为准。

## 总方向

项目目标从“酒馆前端壳”逐步演进为 AI-native RPG framework。短中期继续使用当前 React
前端；Godot 或其他外部游戏引擎只作为长期表现层愿景，不作为当前阶段前提。

优先级：`C 导演/NPC/红颜体验核心 -> D prompt/runtime 工程稳定 -> A 叙事状态底座 -> B 本地玩法系统`。

## Phase 4：导演与角色智能

目标：让重要女性角色、红颜/后宫关系、剧情推进和玩家偏好形成稳定闭环。

方向：

- 重要 NPC / 红颜拥有更稳定的 agenda、欲望、顾虑、边界、主动性和关系阻力。
- 导演层决定本回合更该推进谁、制造什么压力、保留什么悬念、触发什么后处理。
- 红颜/女主规划是恋爱与亲密体验的并行核心轴，不是主线 DM 的附属说明；它要变成可读、可续、
  可阻断、可自然推进的关系轨道。
- 事件池先以 prompt + 轻结构承接，不急着做复杂本地规则。
- 后宫兼容路径要能表达嫉妒、边界、公开/私密、多人关系推进节奏。

### Phase 4A：任务列表边界

任务列表保留为中等复杂度的玩家可见目标日志，不降成 1-3 条极简待办，也不继续当成传统
RPG 任务板。核心问题是“落盘即升权”：一旦某件小事进入 `任务列表`，它就会被每回合重新
注入主剧情，AI 会自然把它当成重要内容。

当前决策：

- `任务列表` 只记录值得持续提醒玩家和 AI 的正式目标。
- 可进入任务列表的内容包括：主线/当前章目标、重要关系或红颜阶段目标、明确委托或报酬事项、
  有风险/时限/代价/失败后果的目标、玩家明确要求持续追踪的目标、导演模块明确标记的重要目标。
- 普通小事默认不进任务列表：闲聊中提到的跑腿、顺路看看、低价值找物、随口打听、气氛性传闻、
  以及玩家追问细节时由 AI 临场生成的枝节，都只在正文或短期记忆里自然承接。
- 新增任务不应强制生成奖励；现代都市里很多目标的回报是关系、信息、机会、缓和压力或后续选择。
- `剧情暗线` 不应继续承担任务字段职责。隐藏叙事应进入 `剧情规划.剧情暗线` 或女主规划，而不是混进
  玩家可见任务。
- `推荐境界` 不再作为现代都市默认任务字段生成；现有 UI 可暂时用“建议能力/风险”弱承接，后续再
  做字段减法。
- `任务类型` 先不做大迁移；prompt 层减少对 `门派/悬赏/传闻/奇遇` 的依赖，后续可收束为更通用的
  `主线/关系/委托/线索/可选` 之类分类。
- `taskCompat` 里只为旧题材兼容、旧无限流去重或旧武侠语义服务的规则可以在 Phase 4A 实施时清理；
  但通用奖励描述规范化、目标完成自动结算和安全去重仍应保留。

Phase 4A 的实现重点是 prompt 准入、主剧情注入裁剪和旧兼容规则清理，不在这一阶段重做完整本地
任务引擎。任务阶段、目标判定、奖励结算、失败/超时等更系统化玩法仍放到 Phase 7。

### Phase 4B：剧情规划与世界演变边界

`剧情规划.当前章目标` 保留并强化为不直接暴露给玩家的后台 DM 主轴。它不是玩家任务，也不是
完整剧本，而是当前章的推动力、取舍标准和节奏方向。`剧情规划.当前章任务` 更接近 DM 节拍池，
只有值得玩家持续追踪的正式目标才进入 `任务列表`。

当前决策：

- `当前章目标` 优先于世界背景补位、随机传闻和普通支线细节。
- 规划分析负责章节目标、节拍、待触发事件、镜头、切章和女主规划的最小修订。
- 世界演变负责后台后果，不负责为了“世界感”生成随机背景事件。
- 世界演变新增条目必须至少命中一项：当前章目标、玩家行动后果、女主/核心 NPC、当前或近期可达地点、
  或导演模块明确压力。
- 世界事件、活跃 NPC 和世界镜头只保留峰值上限，不设最低常态补位目标；条目少是合法状态。
- `世界.世界镜头规划` 字段职责保留，但条目可为空，不为氛围强行填充。
- 若世界演变与规划分析并行执行，规划分析不能假设自己已经读到本轮世界演变新命令；应以正文事实、
  当前章节和已落地状态为准。

Phase 4B 先通过 prompt、COT 和注入边界收紧实现，不做 `剧情规划` / `世界` 数据结构大迁移。
后续若发现并行链路确实导致规划落后，再单独评估是否调整后处理顺序。

### Phase 4C：剧情节奏与暗线承接

目标：让 DM 可以在自由追问和日常聊天中保留后台推动力，但不把普通枝节升格成玩家任务。

当前决策：

- `剧情规划.剧情暗线` 是轻量隐藏叙事池，只记录信息差、伏笔和延后揭示点。
- 暗线不直接暴露给玩家，不写入 `任务列表`，也不承担完整剧本、任务板或世界事件池职责。
- 每条暗线只需要 `标题 / 暗线说明 / 可见边界 / 触发条件[] / 当前状态`，避免重型结构。
- 暗线没有最低数量要求；已揭示、已失效、已迁移或不再服务当前章目标时应清理或改状态。
- 切章时，仍属于旧章的暗线必须清理、迁移或明确允许带走，不能混进新章残留。

### Phase 4D：女主规划核心体验

目标：把女主/红颜规划明确为恋爱与亲密体验的核心规划树，和主线 DM 规划并行对齐。

当前决策：

- 女主规划不是“关系节奏工具”的附属层，而是项目核心体验之一。
- 固定数量目标继续保留在女主协议/女主 COT 内，用于防止 AI 偷懒；统一规划分析只引用协议，不重复写数字。
- 玩家长时间投入女主聊天、约会、亲密或关系谈判时，可以优先维护关系节奏；主线保留暂停点、等待条件或后续触发点即可。
- 女主规划仍受正文证据、红颜候选、社交档案、角色独立性、拒绝权和现实边界约束。
- 女主推进后，若已经形成主线承接点，再同步检查 `剧情.*` / `剧情规划.*` 是否需要最小落点；不强行抢走关系场景。

## Phase 4 落地记录

### 2026-06-27：Phase 4A 任务边界落地

改动原因：任务一旦写入 `任务列表` 就会被每回合注入主剧情，普通跑腿、随口打听和 AI 临场补出的
枝节会被错误升权，拖慢 DM 节奏。

改前状态：

- 开局和变量 prompt 会倾向于保留至少一条主线任务。
- `任务列表` 字段说明仍包含 `剧情暗线?`，隐藏叙事可能混进玩家可见任务。
- `taskCompat` 会根据宗门、悬榜、江湖消息等旧题材文本推断类型。
- `taskCompat` 还有无限流专用任务世界提取和生存任务吞重规则。
- 主剧情上下文注入任务时会把 `剧情暗线` 一起注入。

改后状态：

- 开局不再为了凑数强制生成任务；只有形成正式可追踪目标时才写 `任务列表`。
- `剧情暗线` 从任务职责中退出，隐藏叙事由 `剧情规划` / `女主剧情规划` 承接。
- `models/task.ts` 与 `<数据结构定义>` 不再把 `剧情暗线` 列为任务字段；旧存档额外字段不作为新结构职责维护。
- `taskCompat` 只保留显式合法类型、奖励描述规范化、目标完成自动结算和通用精确去重。
- 任务世界只读取显式字段，不再从主神/任务世界/恐怖片文本中推断。
- 主剧情任务注入不再包含 `剧情暗线`。

验证：

- `npx vitest run __tests__/taskCompat.test.ts __tests__/planningPrompts.test.ts __tests__/modernPromptGuardrails.test.ts --reporter=dot`
- `npx vitest run __tests__/taskCompat.test.ts __tests__/planningPrompts.test.ts __tests__/modernPromptGuardrails.test.ts __tests__/reportedIssuesE2E.test.ts __tests__/phase32RuntimeWorldbooks.test.ts --reporter=dot`

补充清理：

- 原因：任务链 prompt、任务兼容测试和本地默认任务里仍残留 `主神任务倒计时`、`任务世界<荒怨>`、
  `无限流团队任务` 等专属示例。文档可以保留历史说明，但代码侧继续携带这些例子会让 Phase 4A
  的任务边界显得像兼容旧题材，而不是当前正向规则。
- 改前：开局任务 prompt、开局变量 prompt、变量模型 prompt、变量 COT 会直接讲无限流团队任务、
  主神任务、任务世界字段；`taskCompat` / E2E 测试用荒怨生存任务当样例；`storyState.ts`
  对显式无限流开局硬生成 `主神任务倒计时`。
- 改后：任务 prompt 只保留通用任务准入、字段、奖励和去重规则；测试样例改为现代/中性任务；
  `storyState.ts` 的显式无限流开局默认任务改成中性的 `确认眼前处境`，不再硬塞主神、任务世界或倒计时模板。
  显式无限流模式包、资源文案、地图/正文解析样例暂不作为本轮完整退休范围处理。
- 验证：`npx vitest run __tests__/taskCompat.test.ts __tests__/reportedIssuesE2E.test.ts __tests__/modernPromptGuardrails.test.ts __tests__/qualityAndDirectiveFixes.test.ts __tests__/planningPrompts.test.ts __tests__/phase32RuntimeWorldbooks.test.ts --reporter=dot`

### 2026-06-27：Phase 4B 规划主轴与世界演变压噪落地

改动原因：玩家追问细节是自由度来源，但 DM 应该把控节奏。旧世界演变 prompt 有常态数量压力，
容易把和当前章、玩家、女主或当前地点无关的背景事件写入世界树，再被每回合重新注入主剧情。

改前状态：

- `剧情规划.当前章目标` 已存在，但 prompt 没有明确把它定义为后台 DM 主轴。
- 规划分析假设当前世界状态一定已经是世界演变后的最新状态，但并行后处理时不一定成立。
- 世界演变要求活跃 NPC、进行中事件、已结算事件维持常态数量。
- 世界镜头规划被描述为必须保留的世界氛围池。

改后状态：

- `当前章目标` 被明确为不直接暴露给玩家的后台 DM 主轴。
- `当前章目标` 优先于世界背景补位、随机传闻和普通支线细节。
- 规划分析说明并行时可能读取的是同轮基线世界树，不能假设已有本轮世界演变新命令。
- 世界演变只保留峰值上限，不设最低常态补位目标。
- 世界事件、NPC 后台行动和世界镜头必须服务当前章目标、玩家行动后果、女主/核心 NPC、当前地点或导演压力。
- 世界镜头字段职责保留，但条目可空，不为了世界感强行填充。

验证：

- `npx vitest run __tests__/taskCompat.test.ts __tests__/planningPrompts.test.ts __tests__/modernPromptGuardrails.test.ts --reporter=dot`
- `npx vitest run __tests__/taskCompat.test.ts __tests__/planningPrompts.test.ts __tests__/modernPromptGuardrails.test.ts __tests__/reportedIssuesE2E.test.ts __tests__/phase32RuntimeWorldbooks.test.ts --reporter=dot`

最终验证补充：

- `git diff --check` 通过；仅出现 Git 工作区换行提示。
- `npm run build` 通过；保留现有 Vite 提示：`paper-texture.png` 运行时解析，以及 `prompts <-> game-runtime` circular chunk。
- `npx tsc --noEmit --pretty false` 仍失败，报错集中在既有测试夹具类型、opening workflow prompt union、social behavior、dbService 等旧类型债；本轮未出现 `剧情暗线` 或 Phase 4A/4B 新边界相关类型错误。

### 2026-06-28：Phase 4C / 4D 剧情暗线与女主规划收口

改动原因：隐藏叙事已经从 `任务列表` 退出，但还需要一个轻量规划落点；女主规划也需要明确保持为恋爱/亲密体验核心轴，而不是被统一规划分析当作附属补位池。

改后状态：

- `剧情规划.剧情暗线` 成为正式轻量字段，字段为 `标题 / 暗线说明 / 可见边界 / 触发条件[] / 当前状态`。
- `剧情暗线` 相对路径命令会落到 `剧情规划.剧情暗线`；主剧情上下文会把该字段注入到 `剧情安排.当前规划`。
- 剧情推动、规划分析和规划结构参考都明确：暗线不直接暴露给玩家，不进入 `任务列表`，需要维护信息边界。
- 统一规划分析支持块不再重复写女主规划数量数字；具体数量和峰值留在女主协议/女主 COT 内。
- 女主协议明确女主规划是恋爱/亲密体验核心规划树，与主线 DM 规划并行；关系场景可以优先维护关系节奏，主线只保留暂停点或后续触发条件。

验证：

- `npx vitest run __tests__/planningPrompts.test.ts __tests__/responseCommandProcessor.test.ts --reporter=dot`
- `npx vitest run __tests__/planningPrompts.test.ts __tests__/responseCommandProcessor.test.ts __tests__/modernPromptGuardrails.test.ts __tests__/socialBehaviorLite.test.ts --reporter=dot`
- `npx vitest run __tests__/taskCompat.test.ts __tests__/reportedIssuesE2E.test.ts __tests__/qualityAndDirectiveFixes.test.ts __tests__/planningPrompts.test.ts __tests__/responseCommandProcessor.test.ts __tests__/modernPromptGuardrails.test.ts __tests__/socialBehaviorLite.test.ts __tests__/phase32RuntimeWorldbooks.test.ts --reporter=dot`
- `npm run build` 通过；仍保留既有 Vite 提示：`paper-texture.png` 运行时解析，以及 `prompts <-> game-runtime` circular chunk。
- `git diff --check` 通过；仅出现 Git 工作区换行提示。
- `npx tsc --noEmit --pretty false` 仍失败，报错集中在既有测试夹具类型、opening workflow prompt union、social behavior、dbService 等旧类型债；本轮未出现 `剧情暗线` 新字段相关类型错误。

### 2026-06-28：现代世界观生成口径收口

改动原因：现代世界观生成已经从宏观经济报告收回到可玩世界母本，但默认仍容易把区域钩子写成
犯罪、黑市、家暴、勒索、政治丑闻或商业阴谋，和“后宫恋爱轻喜剧 / 都市日常”默认体验偏离。
同时，玩家自定义的独特规则容易被模型复述，而不是展开其对关系、家庭、亲密和日常制度的深层影响。
进一步讨论后明确：`world_prompt` 只应是世界事实母本，不负责剧情推进、触发事件或后续规划说明。

改后状态：

- 世界观正文结构不再要求输出 `DM 可用运行逻辑`、`事件联动与剧情推进逻辑` 或 `近期可触发事件`；
  这些职责分别交给开局、规划分析、世界演变和女主规划。
- 现代默认体验明确偏后宫恋爱轻喜剧与都市日常；除非玩家草稿、导演配置或显式题材要求更重，
  否则社会冲突保持低烈度、可回避、可转化为关系互动。
- 玩家自定义独特规则必须展开到恋爱、亲密关系、家庭、日常制度、角色选择、日常场景和常见选择，
  不得只复述规则本身，也不写成任务或触发器。
- 内置现代都市预设同步收轻，避免默认 `worldExtraRequirement` 把城市写成重社会冲突舞台。

验证：

- `npx vitest run __tests__/modernPromptGuardrails.test.ts --reporter=dot`
- `npx vitest run __tests__/modernPromptGuardrails.test.ts __tests__/newGameTopicRealmPriority.test.ts __tests__/newGameDiy.test.ts __tests__/creativeWorkshopModules.test.ts --reporter=dot`
- `npm run build` 通过；仍保留既有 Vite 提示：`paper-texture.png` 运行时解析，以及 `prompts <-> game-runtime` circular chunk。
- `git diff --check` 通过；仅出现 Git 工作区换行提示。

### 2026-06-29：女性 NPC 命名策略收口

改动原因：女性 NPC 名字过度模板化、古早或像现实长辈熟人，会破坏现代都市/恋爱游戏沉浸感。
原本按硬黑名单触发整轮重试成本偏高，而且把反例名常驻注入 prompt 有污染上下文的风险。

改后状态：

- 女性 NPC 模板名不再触发整轮变量/主剧情重试；命名审美主要交给 prompt 侧正向风格约束。
- `【女性 NPC 命名风格】` 只注入现代正向语感示例，不常驻注入具体反例名。
- 年龄、职业和成熟感要求通过称谓、身份、行为和语气体现，不靠老派姓名体现；中老年角色也适用。
- NPC 变量生成提示同步要求女性姓名自检：真实姓名、同档不重复、符合现代架空都市感。

验证：

- `npx vitest run __tests__\femaleNameSelector.test.ts __tests__\aiReturnedNameE2E.test.ts __tests__\npcNamingPrompt.test.ts __tests__\modernPromptGuardrails.test.ts __tests__\variableModelPrompts.test.ts __tests__\runtimeVariableWorkflow.test.ts --reporter=dot`
- `npm run build` 通过；仍保留既有 Vite 提示：`paper-texture.png` 运行时解析，以及 `prompts <-> game-runtime` circular chunk。
- `git diff --check` 通过；仅出现 Git 工作区换行提示。
- `npx tsc --noEmit` 仍失败，集中在既有类型债；本轮命名相关文件没有新增类型错误。

## Phase 5：Prompt / Runtime 稳定化

目标：把 prompt 主链和诊断框架稳定下来，之后长期少改。

方向：

- 明确主剧情、变量生成、规划分析、世界演变、地图、文章优化、开局规划各自职责。
- 清理重复注入、身份混淆和 payload 误判。
- 稳定 director config、角色种子、社交摘要、world summary、NSFW 层级等输入接口。
- 强化 prompt snapshot / payload diagnostics，便于手动 smoke 和问题定位。
- 逐步拆分 `useGame.ts` 的 controller/composer 边界，但不顺手重写业务算法。

## Phase 6：叙事状态底座

目标：让剧情事实更稳定地被本地状态承接。

方向：

- 地点和地图摘要。
- 当前场景、当前位置、NPC 在场一致性。
- 时间推进、约定、日程和任务期限。
- NPC 被安排去做事后的状态承接。
- 当前镜头、远端事件和后台世界演变的边界。

## Phase 7：本地玩法系统

目标：在导演和叙事底座稳定后，再扩展附属玩法。

方向：

- 任务阶段、目标判定、奖励结算、失败/超时。
- 背包、装备、金钱、交易、消耗品和任务物品。
- 轻量冲突/阻力/代价系统，替代旧战斗模型。
- 本地 action scaffolding，AI 负责 prose polish。

## 长期愿景

长期可以把核心拆成 RPG runtime、AI orchestration、presentation client 和 authoring/debug tools。
到那时 React、Godot 或其他客户端都只是表现层选择；当前不为外部引擎提前重写架构。
