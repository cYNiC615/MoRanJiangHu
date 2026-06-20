# Homebrew Phase 3.2 Modern Urban Implementation Status

> 日期：2026-06-20
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

存档级 `导演配置` 已落地，包含 `玩家剧情倾向`、`角色种子定义[]` 和
`角色种子运行时状态[]`。旧 `OpeningConfig.玩家剧情倾向` 保留兼容读取，新存档优先写入
`导演配置.玩家剧情倾向`。右侧系统区已有 `导演配置` 编辑入口，可编辑剧情倾向和女性角色种子。

角色种子池已接入运行时注入：入口摘要常驻，完整卡片只在当前场景、玩家行动、规划或
后处理文本肯定命中时展开 1-3 张。摘要和完整卡片都会输出 `角色种子ID`；变量 prompt
要求种子 NPC 写入该 ID，本地同步也只认有效 seed id，不再用同名 NPC 自动消费种子。

`社交[]` 已开始 v2 迁移：新增 `社交档案版本`、`行为档案`、`角色种子ID`，旧扁平字段继续读写。
`socialDirectorSync` 统一执行社交规范化、主角同名过滤、B-lite 行为档案补齐、种子 ID 回写和
导演状态同步。红颜规划 v2 只读取已登场、女性、重要且有承接价值的候选；空候选不生成空规划。

规划分析保留完整 `社交[]` 给普通剧情规划读取，但 `女主剧情规划.*` 命令已有本地 guard：
空候选时全部拦截，候选存在时只允许候选 ID/姓名目标。拦截结果进入规划分析诊断/说明。

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

- Phase 3.3 接手角色种子、社交 v2 和红颜规划完整闭环。
- Phase 3.4 接手手动 smoke、查漏补缺和 closeout。

收口标准：

- 当前 runtime/director/seeds 分支验证通过并推送。
- 后处理调度最小本地规则和 focused tests 保持通过。
- 文档明确 Phase 3.3 / 3.4 接手内容。

### Phase 3.3 功能开发

Phase 3.3 负责角色种子和社交 v2 / 红颜规划完整闭环。目标是玩法体验上达到
`B-full` 承接效果，但实现继续采用 `社交[] + v2 子档案`，不拆成独立社交数据库。

下一步：

- 角色种子补齐新建游戏入口、游戏内编辑、暂停/删除、转正、防重复和存档读写。
- 角色种子常驻摘要、触发展开、`角色种子ID` 建档、`linkedNpcId / linkedNpcName`
  同步规则继续保持精确 ID 驱动，不回退到同名匹配。
- 变量生成只在重要女性首次强互动、关系阶段变化或 agenda 改变时补齐/更新行为档案。
- 扩展命令保护：可补齐缺失 B-lite 字段，但不得覆盖稳定人格、稳定边界与已确认硬锁。
- 规划分析减少对完整 `社交[]` 的直接依赖，把非在场重要角色摘要纳入 token 预算。
- 明确 NPC 改名、删除、合并或恢复时 `角色种子ID / linkedNpcId` 的降级策略。
- 红颜规划 v2 只消费已登场、女性、重要且有承接价值的候选；空候选不生成空规划。

不纳入 Phase 3.3：

- 导演配置导入/导出。
- 跨存档角色模板库。
- 全局角色包同步。
- 完整社交数据库重写。

### Phase 3.4 Smoke 与查漏补缺

Phase 3.4 不做新功能，负责手动 smoke、修小问题、文档 closeout 和记忆更新。

建议 smoke：

- 默认现代新档：不选题材/模式包时走现代 runtime worldbook fallback。
- 导演配置：剧情倾向和角色种子能创建、保存、读档恢复。
- 角色种子：摘要常驻、命中展开、转正后防重复。
- 社交 v2 / 红颜规划：女性重要角色有行为档案，空候选不点亮/不生成空规划。
- 后处理队列：信号为否但本地规则命中时能触发对应后处理，并显示原因。
- 活跃 copy：默认现代路径不出现明显旧门派/组织强制口径。

查漏补缺原则：

- 只修 smoke 发现的 broken path、明显 prompt 滑坡和文档不一致。
- 不做全仓字符串替换，不删旧题材兼容字段，不展开新系统。
- Phase 3.4 结束后，Phase 3 文档应只保留完成事实和 Phase 4 候选方向。

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
