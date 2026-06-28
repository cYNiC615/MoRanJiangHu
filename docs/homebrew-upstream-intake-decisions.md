# Homebrew Upstream Intake Decisions

> 日期：2026-06-24
>
> 本文记录从 `upstream/main` 选择性吸收更新时的当前决策。它不是 changelog，也不是
> upstream 合并计划；后续只按本文确认的小项手动补丁吸收。

## 审查基线

- 当前 homebrew 基线：`main` / `origin/main` at `45c25aa`。
- 已审查 upstream：`upstream/main` at `8d9f054`。
- 审查分支：`codex/review-upstream-sync`。
- 不直接 merge `upstream/main` 到 `main`。
- 不 cherry-pick 包含大量产品方向回流的 release commit；只手动摘取明确 bugfix。

## 已完成吸收

- `663480a fix: absorb selected upstream runtime safety fixes`：吸收已确认的 runtime safety 修复。
- `45c25aa fix: preserve npc archive updates from variable commands`：吸收正文变量生成后的
  NPC 档案字段稳定写入修复；同名 NPC 合并与部分 `社交[N]` 写入不再覆盖长期档案。

这些提交没有改变“不直接 merge `upstream/main`”的 intake 规则。后续继续按候选项手动补丁，
不要把 mobile/cloud/release/product 方向回流进 homebrew 主线。

## 固定排除范围

以下 upstream 更新不吸收，除非后续明确改方向：

- mobile UI、Android、Capacitor、APK、APK update、APK release。
- cloud play、GitHub sync、WebDAV、object storage、online presence、在线人数、D1/R2 运营链路。
- 拍卖行、旧战斗、门派/功法扩张、音乐播放、小说分解、社区/投稿/公网运营页面。
- release metadata、版本号、客户 changelog、公网站点说明、上游 agent/Claude 技能目录。

## 候选决策

### 1. 存档谱系与轻量视图安全

决策：吸收，但只手动吸收数据安全层。

来源参考：

- `26734ba Release v1.0.505: 修复背包变量同步 + 手机端存档崩溃根因`
- `9ce02db fix(致命): 修复轻量视图覆盖完整存档导致所有存档历史记录被截断`

需要吸收：

- 轻量存档视图不得写回覆盖完整存档。
- 谱系校正如果检测到传入的是轻量视图，必须回退读取完整存档再写回。
- 保存/读档路径增加历史截断诊断：元数据显示历史很多，但实际历史只有 1-2 条时报警。
- 若当前代码仍有一次性读取所有完整存档的谱系扫描路径，可改为轻量探测，必要时再完整读取。

明确不吸收：

- mobile / APK 相关修复和提示。
- release metadata。
- 上游为了移动端 OOM 做的 UI 或原生环境分支扩张。

吸收方式：

- 不直接 cherry-pick。
- 在 `services/dbService.ts`、`hooks/useGame/saveCoordinator.ts` 及相关 focused tests 中手动补丁。
- 先做防御，再看是否需要轻量扫描优化。

### 2. 游戏初始时间恢复与历程天数防回滚

决策：吸收，但改动后吸收。

来源参考：

- `9da4fbd fix: stabilize and repair game initial time`
- `a8ad7eb fix: improve initial time recovery fallback`

需要吸收：

- `游戏初始时间` 缺失时，只从历史记录、回忆档案等已存在的可信游戏时间恢复。
- 恢复逻辑应选择最早可信的规范化 `gameTime`，优先开局回忆，必要时再用其他有效回忆兜底。
- 已存在的 `游戏初始时间` 不覆盖。
- 移除当前用环境当前时间补写 `游戏初始时间` 的 fallback，避免历程天数被重置或回滚。
- 增加 focused tests，覆盖已有值不覆盖、从历史恢复、开局回忆无效时回退到其他回忆。

明确不吸收：

- mobile / APK 相关入口。
- 上游设置页里更偏维护工具性质的修复 UI，除非后续明确需要桌面端高级修复按钮。
- release metadata。

吸收方式：

- 不直接 cherry-pick。
- 优先做成纯函数，放在现有时间/状态恢复边界附近。
- 在 `hooks/useGame.ts` 中替换旧 fallback，并确保不改变正常推进中的游戏时间语义。

### 3. 变量/背包命令路径归一与 `sub` 链路

决策：吸收，窄范围手动吸收。

来源参考：

- `26734ba Release v1.0.505: 修复背包变量同步 + 手机端存档崩溃根因`

需要吸收：

- 将 AI/变量模型常用的短路径 `背包`、`行囊`、`物品列表` 归一到真实路径 `角色.物品列表`。
- 同时兼容点路径与数组路径，例如 `背包.字段`、`行囊[0]`、`物品列表[0].堆叠数量`。
- 变量模型过滤层允许 `sub` 命令，避免消耗道具、扣减堆叠数量时命令被丢弃。
- 增加 focused tests，覆盖短路径 push 到真实背包、`sub` 扣减堆叠数量、变量模型结果保留 `sub`。

明确不吸收：

- 同一上游提交里的 mobile / APK 存档崩溃分支。
- mobile 诊断上报扩张。
- release metadata。
- 背包系统的新设计或额外 UI 扩张。

吸收方式：

- 不直接 cherry-pick。
- 在 `utils/stateHelpers.ts`、`hooks/useGame/variableModelWorkflow.ts` 及相关 focused tests 中手动补丁。
- 只补变量命令链路，不改变现有背包数据结构。

### 4. 社交/NPC 图片档案、香闺秘档部位档案合并与异步写回保护

决策：吸收，但改动后吸收。

来源参考：

- `da34709 fix: 修复规范化社交列表时香闺秘档部位档案被展开运算符覆盖丢失`
- `5ee8fa8 fix(香闺秘档): 修复社交Ref异步更新导致部位档案丢失`
- `c706117 fix: 修复香闺秘档部位图连续写入时社交Ref异步导致先写被后写覆盖的致命bug`
- `cc0792f fix: 主角图片档案合并函数补充香闺秘档部位档案处理`

需要吸收：

- NPC 图片档案合并时，`香闺秘档部位档案` 使用逐部位合并语义：incoming 优先、current 兜底，避免 `undefined` 覆盖已有部位图。
- 主角图片档案合并也保留 `香闺秘档部位档案`。
- 连续写入 NPC 私密部位图时，同步维护 `社交Ref.current`，避免后一次异步写入读取旧社交列表并覆盖前一次部位记录。
- 替换会影响图片档案、回档、开局社交初始化等关键路径的直接 `设置社交` 调用。
- 增加 focused tests，覆盖规范化不丢部位档案、连续写入多个部位不互相覆盖、主角图片档案合并保留部位档案。

明确不吸收：

- WIP 调试日志扩张。
- mobile / APK。
- 远端图片 URL、RPM、图片代理兼容。
- release metadata。
- 新图片后端能力或额外 UI 扩张。

吸收方式：

- 不直接 cherry-pick。
- 在 `hooks/useGame/stateTransforms.ts`、`hooks/useGame.ts` 及相关 focused tests 中手动补丁。
- 只修本地档案保真与写回一致性，保持现有图片系统边界。

### 5. Gemini Deep Research OpenAI-compatible 检测

决策：跳过。

原因：当前不需要该模型专项提示；后续如果实际配置 Gemini Deep Research 再处理。

### 7. 远端图片生成 URL / RPM / 图片代理兼容

决策：跳过。

原因：当前不扩张远端图片代理和公网辅助链路；如后续图片后端确实需要，再单独设计。

### 6. 文章优化后的对白标签保真

决策：吸收，窄范围手动吸收。

来源参考：

- `e6bfbf2 Release v1.0.508: 修复主角立绘上传 + 对话标签丢失 + 存档删除事务确认`

需要吸收：

- 文章优化正文解析支持传入已声明角色名集合。
- 执行文章优化时，从主角姓名和 `社交[].姓名` 构建声明名单，并传给所有润色、重试、续写解析路径。
- 标签协议 parser 的 fallback strip-tag 分支也传入 `declaredNames`。
- 增加 focused tests，覆盖文章优化保留已知 NPC 标签、fallback parser 保留 `<角色名单>` 中声明的人名。

明确不吸收：

- 同一提交里的主角立绘上传 UI。
- mobile character UI。
- release metadata。
- 存档删除事务确认；后续可作为 save safety 附带小修或单独确认。

吸收方式：

- 不直接 cherry-pick。
- 在 `hooks/useGame/bodyPolish.ts`、`services/ai/storyResponseParser.ts` 及相关 focused tests 中手动补丁。
- 只修正文解析保真，不改变文章优化提示词方向。

### 8. 正文变量生成后的 NPC 档案字段稳定写入

决策：已吸收，窄范围手动吸收；最新完成提交是 `45c25aa`。

来源参考：

- `8d9f054 release: publish v1.0.523`

已吸收：

- `set 社交[N]` 写入部分对象时，如果既有槽位与新值都是对象，按对象深合并，不再用半截对象覆盖整个 NPC。
- `合并保留既有NPC列表` 遇到同一 NPC 时，将本轮补充字段合并进旧档案，同时保留旧的姓名、简介、记忆等长期字段。
- 响应命令处理在 NPC 合并但未恢复缺失 NPC 时也会重新规范化并写回，避免“合并了但没有落盘”。
- 同名 NPC 规范化合并时，胸部、小穴、屁穴、肉棒、男娘、扶她、性癖、敏感点等私密档案字段优先采用本轮有效更新。
- 保留本地“新增社交整对象必须有姓名/别名”的防线，避免无名 NPC 被 push 成 `角色N` 占位。

明确不吸收：

- v1.0.523 release metadata、版本号、公网站点更新。
- Android / APK / 发布脚本更新。
- 与本条无关的 upstream agent/协作规则。

吸收方式：

- 手动补丁到 `utils/stateHelpers.ts`、`utils/npcRetentionGuard.ts`、`hooks/useGame/responseCommandProcessor.ts`、`hooks/useGame/stateTransforms.ts`。
- 增加 focused tests 覆盖部分社交槽位写入、NPC 保留合并、同名 NPC 私密档案字段更新优先级。

## 待逐项确认

- 暂无。
