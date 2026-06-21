# Homebrew Phase 3 Implementation Status

> 日期：2026-06-21
>
> 本文只记录当前状态和后续方向。仍约束后续实现的设计决策见
> `docs/homebrew-phase3.2-modern-urban-decisions.md`。

## 当前状态

Phase 3.2 已进入“默认现代都市主链校准 + 角色/社交长期承接”阶段。默认开局、
快速重开、保存预设恢复、主链 prompt、变量校准、规划分析和世界演变都已接入共享
runtime worldbook resolver；无显式选择时注入现代都市 fallback，UI 不显示为已选模式包。

现代默认 prompt 已允许 `世界.势力列表` 为空，不再要求 `5-15` 个势力、非空势力列表
或每轮势力互动。世界生成固定 JSON 示例已改成 `"势力列表": []`，势力对象只作为
有学校、公司、社团、利益集团、治安机构等明确组织证据时的示例。

现代默认世界观生成 payload 已完成 Phase 3.4 第一轮收口：现代都市直接使用现代母板，不再先注入
旧题材母板再追加替换规则；`<世界观生成思考协议>` 保留但按题材获取，真实请求和预览共用同一
消息链拼装 helper；世界观阶段只注入短难度摘要，不再注入完整游戏/判定/生理难度协议。普通手机、
钱包、银行卡、钥匙、笔记本电脑和普通衣物按 prompt-only 规则处理为生活背景，不进入背包或装备栏；
剧情证据、任务道具、工作配发、加密数据、损坏状态、可交付物和明确金额现金仍可作为可追踪物品落地。
Smoke payload 复查后，世界观生成又完成了导演/seed 弱约束接入、输出标签契约统一和难度摘要现代化。

存档级 `导演配置` 已落地，包含 `玩家剧情倾向`、`角色种子定义[]` 和
`角色种子运行时状态[]`。旧 `OpeningConfig.玩家剧情倾向` 保留兼容读取，新存档优先写入
`导演配置.玩家剧情倾向`。右侧系统区已有 `导演配置` 编辑入口；新建游戏入口也可配置首批角色种子。

角色种子池已接入运行时注入：入口摘要常驻，完整卡片只在当前场景、玩家行动、规划或
后处理文本肯定命中时展开 1-3 张。摘要和完整卡片都会输出 `角色种子ID`；变量 prompt
要求种子 NPC 写入该 ID，本地同步也只认有效 seed id，不再用同名 NPC 自动消费种子。
未转正种子可编辑、暂停和删除；已转正种子只读显示 linked NPC。暂停/禁用 seed 不会被
AI 输出的 `角色种子ID` 消费转正；同步时会清除这类无效社交 seed 链接。已引入但未转正
的种子暂停后再恢复时保留 `已引入` 状态，不回退成全新素材。NPC 改名或合并时按
`角色种子ID` 刷新 `linkedNpcId / linkedNpcName`；linked NPC 消失时降级为 `已引入`，后续
同 ID 重新出现会再次转正。重复 seed ID 落到多个 NPC 时只保留第一个有效链接。

`社交[]` 已开始 v2 迁移：新增 `社交档案版本`、`行为档案`、`角色种子ID`，旧扁平字段继续读写。
`socialDirectorSync` 统一执行社交规范化、主角同名过滤、B-lite 行为档案补齐、种子 ID 回写和
导演状态同步。变量生成可补齐 v2 行为档案和 seed 链接，但合并时保留稳定人格、稳定交流风格、
稳定边界和已确认硬锁。红颜规划 v2 只读取已登场、女性、重要且有承接价值的候选；空候选不生成空规划。

规划分析读取预算内社交摘要：在场角色保留，非在场重要角色以摘要承接，避免直接把完整
`社交[]` 作为无界上下文输入。`女主剧情规划.*` 命令在规划分析和主回复命令处理两侧都有本地
guard：空候选时全部拦截，候选存在时只允许候选 ID/姓名目标。

后处理调度最小本地规则已接入 `sendWorkflow`：`postprocess_signal` 缺失或解析失败时继续
安全兜底执行规划分析和世界演变；可靠信号为否时，仍会根据 `dynamic_world`、主线任务缺失/
完成/失效、明确承接词、新主要角色成立、重大世界余波、时间/地点大跨度切换和组织行动等
本地信号强制触发对应后处理。调度规则只决定是否进入规划分析/世界演变，不直接写任务或状态；
队列诊断会显示模型理由或本地强制原因。

## 重构判断

本轮 `useGame.ts` 重构达成的是边界收口，不是文件瘦身。

已改善：

- 系统 prompt 构建从 `useGame.ts` 的散装 payload 组装移到 `promptRuntimeFacade`。
- 社交、导演配置和角色种子转正从主 hook 内联逻辑移到 `socialDirectorSync` 纯函数路径。
- 开局/session 和世界生成 workflow 支持 `state/services/effects` grouped facades，后续不必继续扩张单个平面 deps 对象。

未达到：

- `useGame.ts` 行数没有明显下降，仍是巨型 composition root。
- grouped facades 目前是兼容适配层，workflow 内部仍主要展开为旧字段名执行。
- 图片、存档、记忆、开局、后处理、社交、prompt runtime 等生命周期仍集中在同一个 hook 创建点。

当前判断：这轮重构有助于阻止 Phase 3.2 新链路继续散落，但不能算真正完成
`useGame.ts` 瘦身。后续若继续处理代码质量，应以拆 composer/controller 为目标，而不是继续在
`useGame.ts` 内堆更多 facade 对象。

## Phase 3 后续规划

### Phase 3.2 完成状态

Phase 3.2 代码工作已收口：runtime/director/seeds 分支和后处理调度最小规则已落地。
本阶段不再继续扩张角色种子、社交 v2 或 useGame 重构范围。

完成记录：

- Focused tests、`npm run build` 和 `git diff --check` 已通过。
- 当前分支已提交并推送：`f6f4954 feat: close phase 3.2 postprocess scheduling`。

后续接手：

- Phase 3.3 已接手并完成角色种子、社交 v2 和红颜规划完整闭环。
- Phase 3.4 接手手动 smoke、查漏补缺和 closeout。

收口标准：

- 当前 runtime/director/seeds 分支验证通过并推送。
- 后处理调度最小本地规则和 focused tests 保持通过。
- 文档明确 Phase 3.3 完成事实和 Phase 3.4 接手内容。

### Phase 3.3 完成状态

Phase 3.3 已完成角色种子和社交 v2 / 红颜规划完整闭环。实现继续采用
`社交[] + v2 子档案`，没有拆独立社交数据库。

完成记录：

- 新建游戏入口可配置首批角色种子，游戏内导演配置可编辑未转正/未来种子。
- 暂停会同步定义启用状态；未引入种子暂停时运行时状态为 `暂停`，已引入但未转正种子暂停时保留 `已引入`，删除只允许未转正种子；已转正种子只读并显示 linked NPC。
- 种子转正、防重复和 linked NPC 改名/合并/消失降级均按 `角色种子ID` 驱动；同名无 ID 不消费种子。
- 禁用或运行时暂停的种子即使被 AI 写入 `角色种子ID`，也会在同步转正入口被拒绝并清掉无效链接。
- 顶层 `导演配置` 在保存、读取和导入清洗中保留，运行时存档值仍是权威快照。
- 社交 v2 行为档案合并保留稳定人格、稳定边界和硬锁；变量生成可补齐 `角色种子ID`、`社交档案版本` 和 `行为档案.*`。
- 规划分析使用预算内社交摘要承接非在场重要角色，红颜规划候选仍只来自正式 `社交[]` 记录。
- 主回复命令处理和规划分析都复用红颜候选 guard；空候选或非候选目标不会生成空女主规划。

不纳入 Phase 3.3：

- 导演配置导入/导出。
- 跨存档角色模板库。
- 全局角色包同步。
- 完整社交数据库重写。

### Phase 3.4 Smoke 与查漏补缺

Phase 3.4 不做新功能，负责手动 smoke、修小问题、文档 closeout 和记忆更新。
当前 smoke / payload 审查暴露的问题已新起修复队列记录在
`docs/homebrew-phase3.4-fix-plan.md`；该文档现在只保留简化后的完成摘要和下一轮迭代队列。

本轮 Phase 3.4 修复已完成代码收口：

- 现代默认主剧情、变量生成和地图 prompt 不再主动暴露旧 `境界 / 内力 / 修炼` 成长字段；运行时模式配置摘要已把 `修炼=否` 改为 `特殊成长=否`，奖励展示文案不再使用 `属性点或境界变化`。
- 现代默认开局移除了本地空泛任务 fallback，避免 prompt 指令型任务显示给玩家。
- 主剧情 payload 改为分段 assembly：题材模式、玩家剧情倾向、导演配置、运行时状态、输出契约和 `turn_directives` 分离；Tavern 与非 Tavern 路径共享同一语义来源，字数、人称、重试和免责声明只从最终硬约束分段注入。
- 导演配置和角色种子入口摘要进入真实主剧情 payload；世界演变和规划分析已改为使用“开局配置 + 顶层导演配置覆盖”的有效运行时配置，确保右侧导演配置新改内容也进入后处理边界；规划链路仍只把正式 `社交[]` 候选作为红颜规划候选。
- 变量生成去掉重复 extra prompt 注入，补充虚构本地 RPG 状态同步框架，普通 `子宫.状态 = "正常"` / `宫口状态 = "闭合"` 不再被审计为每回合补档缺口。
- Context routing 第二轮收口：新增 `core_world_summary` 提示词槽，开局完整世界观生成后会用主剧情 API 生成摘要并写入摘要槽；主剧情 `world_prompt` 默认读取摘要，摘要缺失时回退 `core_world`，世界演变、开局生成和后台规划仍保留完整世界观读取能力。
- Runtime NSFW extra prompt 改为 `disabled / beacon / intimacy / explicit` 分层：普通日常只带成人内容能力轻信标，暧昧/私密/高关系场景加入亲密推进和边界，明确成人场景才注入完整显式规则。
- NSFW 世界书第一轮路由收口：`构建世界书注入文本` 支持 `nsfwPromptLevel`，非 explicit 层压制完整名器/显式身体表并返回 `suppressedEntryCount`；explicit 层仍按作用域和关键词命中。
- 变量生成普通日常不再因 NSFW 总开关强制补私密/名器/子宫类档案；亲密或 explicit 层才启用完整私密档案审计，既有私密字段默认保留。
- 默认写作文风和文章优化提示去掉常驻显式成人词汇表、古风小说参考和固定现代道具清单；相邻活跃写作守门清理 `传功 / 拔剑 / 江湖传言 / 术法追踪 / 命牌 / 血引` 等旧锚点。
- 主剧情 payload 诊断补充 `worldPromptSource`、`nsfwPromptLevel`、`suppressedWorldbookCount`，继续只记录结构摘要，不记录完整 prompt 内容。
- 普通现代随身物继续 prompt-only 收口，例外物品和明确金额现金仍允许落档。
- 角色种子 UI 的 `默认发展方向` 改为固定选择，默认仍为 `红颜/后宫对象`，旧字符串兼容读取。
- 地图自动更新改为默认低频：没有稳定新地点时不发起 AI 地图请求；现代地图 prompt 清理旧武侠母板，同名不同父级地点按父级路径区分。
- 右侧功能页恢复为原 modal 直接弹窗，移除桌面右侧伸出详情栏容器和 CSS override。
- 主剧情请求诊断增加 payload 分段摘要，记录 id、role、category 和字符数，不记录完整正文。
- `<时间推进法则>` 改为现代时间口径，不再注入古法换算表；默认 `write_style` 和文章优化 prompt 已替换为现代都市中性叙事参考。
- 主剧情、女主、开局、判定、润色 COT 与输出格式完成第一轮现代中性措辞收口，默认现代真实 payload 可见的 `武力梯度 / 招式 / 礼法 / 武侠能力 / 境界推进 / 门派与任务初始化` 等旧词已移除。
- 初始世界生成已接入导演偏好和未转正角色种子弱约束；该摘要只影响世界容纳度、职业/关系入口和地点氛围，不强制角色登场，不把 seed ID、完整角色卡或未登场事实写入 `<世界观>`。
- 世界观生成输出契约已统一：需要世界基底时明确 `<世界观>` 后接 `<世界基底>`；不需要世界基底时只输出 `<世界观>`。世界观阶段难度摘要已从旧武侠/生理协议口径改成资源压力、失败代价、风险生态和日常压力摘要。
- 主剧情 payload 诊断已补强：请求开始日志记录 Tavern 开关、实际 assembly 分支和安全分段摘要；service 结果记录 runtime requirements 注入前后 message 数与 role 序列、provider protocol，以及 DeepSeek/Claude 兼容归一化后的结构变化。
- 现代地图状态已收口：现代世界基底缺根时默认补 `现实世界`，孤立空 `诸天万界` 根会被兼容清理，非空旧地图不自动改名或删除；通用地图 schema 不再把寰宇名称固定为 `诸天万界`。
- 新游戏第六步确认页已改为顶部起始的滚动安全布局，避免超高内容被 `h-full + justify-center` 截掉顶部。

Smoke 后新增待办：

- NSFW 分层触发需要手动 smoke 观察：普通日常是否足够轻，暧昧/私密场景是否足够主动，explicit 触发是否只在明确成人场景出现。
- 世界观摘要需要手动 payload 复查：摘要应保留本局独特规则、势力、禁忌、资源、冲突和社会结构，不常驻普通现代生活废话。
- 地图摘要暂不实现；后续 Phase 重构地图功能时，再从六层地图树生成确定性摘要，避免不了解外部地图时把当前地图硬拼进复杂大地图。

当前仍不做浏览器自动化测试；需要 UI smoke 时只启动本地服务器，由玩家手动确认。

本轮验证已通过：

- `npx vitest run __tests__/nsfwImageGeneration.test.ts __tests__/worldPromptSummary.test.ts __tests__/phase32RuntimeWorldbooks.test.ts __tests__/variableModelPrompts.test.ts __tests__/storyLengthValidation.test.ts --pool=threads`
- `npx vitest run __tests__/modernPromptGuardrails.test.ts __tests__/nsfwImageGeneration.test.ts __tests__/variableModelPrompts.test.ts __tests__/phase32RuntimeWorldbooks.test.ts`
- `npx vitest run __tests__/openingConfigNormalization.test.ts __tests__/responseCommandProcessor.test.ts __tests__/autoConsumables.test.ts __tests__/worldPromptSummary.test.ts __tests__/storyLengthValidation.test.ts`
- `npx vitest run __tests__/directorConfigAndSeeds.test.ts __tests__/openingConfigNormalization.test.ts __tests__/responseCommandProcessor.test.ts __tests__/socialBehaviorLite.test.ts __tests__/variableRegistry.test.ts __tests__/dbServiceDirectorConfig.test.ts __tests__/phase32RuntimeWorldbooks.test.ts __tests__/postprocessScheduler.test.ts __tests__/storyLengthValidation.test.ts __tests__/variableModelPrompts.test.ts __tests__/mapUpdateWorkflow.test.ts __tests__/rightPanelModal.test.ts __tests__/newGameWizardCopy.test.ts`
- `npx vitest run __tests__/modernPromptGuardrails.test.ts __tests__/openingConfigNormalization.test.ts __tests__/responseCommandProcessor.test.ts __tests__/autoConsumables.test.ts`
- `npx vitest run __tests__/directorConfigAndSeeds.test.ts __tests__/openingConfigNormalization.test.ts __tests__/responseCommandProcessor.test.ts __tests__/socialBehaviorLite.test.ts __tests__/variableRegistry.test.ts __tests__/dbServiceDirectorConfig.test.ts __tests__/phase32RuntimeWorldbooks.test.ts __tests__/postprocessScheduler.test.ts __tests__/storyLengthValidation.test.ts __tests__/variableModelPrompts.test.ts __tests__/mapUpdateWorkflow.test.ts __tests__/rightPanelModal.test.ts __tests__/newGameWizardCopy.test.ts`
- `npx vitest run __tests__/worldGenerationParser.test.ts __tests__/modernUrbanDefaults.test.ts`
- `git diff --check`
- `npm run build`

建议 smoke：

- 默认现代新档：不选题材/模式包时走现代 runtime worldbook fallback。
- 导演配置：剧情倾向和角色种子能创建、保存、读档恢复。
- 角色种子：摘要常驻、命中展开、转正后防重复；右侧导演配置新改 seed/倾向应同时进入主剧情、规划分析和世界演变。
- 社交 v2 / 红颜规划：女性重要角色有行为档案，空候选不点亮/不生成空规划。
- 后处理队列：信号为否但本地规则命中时能触发对应后处理，并显示原因。
- 活跃 copy：默认现代路径不出现明显旧门派/组织强制口径。
- Prompt payload：世界观生成预览与真实请求不重复注入 COT / extraPrompt；继续确认题材模式不重复、难度摘要无旧武侠措辞、输出标签不冲突。
- 开局规划 payload：普通现代日常不注入完整亲密名器表；配置 seed/director 时只出现受限摘要和必要 ID。
- 首回合主剧情 payload：酒馆预设关闭时诊断应明确显示非 Tavern 分支；现代默认 system / COT / format 不再带旧武侠文风锚点。
- 物品落地：普通手机、钱包、银行卡、钥匙、笔记本电脑和普通衣物不默认进入背包；证据、任务、工作配发或明确现金金额例外仍可追踪。

查漏补缺原则：

- 只修 smoke 发现的 broken path、明显 prompt 滑坡和文档不一致。
- 不做全仓字符串替换，不删旧题材兼容字段，不展开新系统。
- Phase 3.4 结束后，Phase 3 文档应只保留完成事实和 Phase 4 候选方向。

### Phase 3.4 Prompt Payload 收口记录

已修复 smoke 前发现的 prompt payload 问题：现代都市世界观生成不再携带默认旧题材 system 母板；
`extraPrompt` 在世界观请求中只作为 `【最终输出附加要求】` 注入一次；预览和真实请求共用
`构建世界观生成消息链`；`构建世界观难度摘要` 只提炼资源压力、失败代价、风险生态和日常压力。
本轮没有改 Prompt 协议标签名、IndexedDB schema 或本地状态删除逻辑。

Smoke 后复查新增 prompt 待办中，现代运行时 copy、默认文风、时间推进法则和 COT / format 旧词已完成第一轮收口。
世界观生成已补上导演/角色种子弱约束边界，输出契约不再同时要求“只输出 `<世界观>`”和“追加 `<世界基底>`”，难度摘要也已改为现代风险/资源/日常压力口径。
Context routing 第二轮已完成：主剧情默认使用 `core_world_summary`，NSFW runtime extra prompt 和世界书注入按 `disabled / beacon / intimacy / explicit` 分层，普通日常不再常驻完整显式成人规则或名器表。
仍待后续 Phase 处理的是地图摘要与地图功能重构；本轮只记录方案，不改地图链路。

首回合主剧情 payload 复查修正了一个链路判断：在酒馆预设开关关闭时，最终 API body 的
短 message 形态仍可来自非 Tavern 主剧情链路。原因是本地分段 assembly 先生成多段 ordered messages，
provider 兼容层随后可能合并连续同角色 message。现在诊断会同时记录实际 assembly 分支、
runtime requirements 注入前后结构和 provider 兼容归一化后的 role 序列，避免仅凭最终 role 序列误判 Tavern。
已审 payload 的主要滑坡根因不是 Tavern，而是默认现代主剧情旧 `write_style` 锚点
以及 COT / format / opening / stats prompt 中可见的旧体系措辞；这些已完成第一轮现代中性收口。
`无界叙事官·玄霄` 暂记为低优先级观察项，本轮不改。

普通现代随身物采用 prompt-only 收口：开局初始化、开局变量生成和常规变量生成都明确将普通手机、
钱包、银行卡、钥匙、笔记本电脑、普通衣物视作生活背景，不默认写入 `角色.物品列表` 或装备栏。
例外仍保留为剧情证据、任务道具、工作配发、加密数据、损坏状态、可交付物、当前要操作/交付的对象、
明确金额现金；金钱继续统一落到 `角色.金钱.baseAmount`。若 Phase 3.4 smoke 后仍频繁生成普通物品，
再单独评估更窄口径的命令守门。

### Phase 3.3 代码质量审查记录

Phase 3.3 -> 3.4 代码收口审计已修复两处阻塞级种子状态问题：暂停/禁用 seed 不再能被
AI 输出的 `角色种子ID` 转正；已引入但未转正 seed 的暂停/恢复不再丢失 `已引入` 状态。
`RoleSeedEditor` 的暂停/删除动作已改为复用 `utils/directorConfig.ts` 纯函数，红颜规划命令
识别和候选守门集中在 `utils/socialBehavior.ts`。修复后未发现新的阻塞级功能质量问题，也未
发现显式 `TODO/FIXME/HACK`、临时脚手架、浏览器自动化或 dev-server 残留。以下仅作为
Phase 3.4 smoke 稳定后的重构观察点，不作为 Phase 3.4 的立即修复范围：

- `RoleSeedEditor` 为了支持未完成草稿，暂时保留了独立的编辑态归一化；后续可把
  draft normalization 和 persisted normalization 明确拆成共享纯函数，顺手清理随机 fallback ID
  与少量 `as any` 状态兜底。
- `NewGameWizard.tsx` 仍是大型入口组件，新建游戏角色种子入口只是最小接入；后续如继续拆
  opening/session controller，可把角色种子编辑入口一起下沉到更小的组件边界。
- `responseCommandProcessor.ts` 和 `planningUpdateWorkflow.ts` 仍承载较多命令 guard 与 payload
  拼装逻辑；后续新增命令校验或规划上下文时，优先抽小型 validation/context builder，避免继续扩张
  主循环。
- `services/dbService.ts` 为 focused test 暴露了导入清洗 helper；如果存档清洗规则继续增加，
  可迁到独立纯模块后再由 dbService 与测试共同引用。
- 规划社交上下文已为非在场重要角色做预算摘要；在场角色目前仍保留较完整记录。若后续 smoke
  或日志显示 token 膨胀，再增加在场社交记录字段投影。

## Phase 3 后置候选

### useGame 边界继续重构

目标不是单纯减少几行，而是让 `useGame.ts` 只保留状态汇总和返回 API。

建议切分：

- `useOpeningSessionController`：普通开始、快速重开、开局进度、开局瞬态重置。
- `usePromptRuntimeController`：系统 prompt/context snapshot/runtime worldbook 输入。
- `useSocialDirectorController`：社交提交、导演配置同步、NPC 记忆队列。
- `useSaveRuntimeController`：保存、读取、恢复后的 transient reset。
- `usePostprocessController`：变量生成、规划分析、世界演变、地图更新调度。
- `useImageRuntimeController`：主角/NPC/场景图片任务、scope reset、ComfyUI 触发。

执行原则：

- 每轮只迁一组 controller，并保留 focused tests。
- 先迁创建点和依赖边界，不重写业务算法。
- 已经抽出的 `promptRuntimeFacade` 和 `socialDirectorSync` 继续作为后续拆分锚点。

### 现代默认 copy 与 prompt 继续细审

继续压低默认现代路径里的古风语感，但不删除可选旧题材、历史兼容字段或 PromptManager 协议名。

下一步：

- 审计玩家默认会看到的空态、面板标题、设置说明和 fallback 文案。
- 保留武侠/仙侠/旧题材数据包里的题材文案，不做全仓字符串替换。
- 若 UI smoke 发现现代默认仍出现旧门派/组织口径，再按具体入口最小修。

### 导演配置导入导出

导入导出、跨存档模板库和角色包复用先后置。个人使用场景下，角色种子的 Phase 3
完成标准是单存档内完整闭环，不要求跨存档迁移。

## 验证原则

- 本阶段继续以 focused tests、`npm run build`、`git diff --check` 收口。
- 不做浏览器自动化；需要 UI smoke 时只启动服务器，由用户手动浏览器测试。
- 文档保持当前状态，不写客户 changelog。
