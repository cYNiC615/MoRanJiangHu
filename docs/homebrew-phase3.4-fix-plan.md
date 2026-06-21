# Homebrew Phase 3.4 Fix Plan

> 日期：2026-06-21
> 本文是 Phase 3.4 当前修复队列。已完成项只保留结果记录；详细状态见 `docs/homebrew-phase3-implementation-status.md`。

## 边界

- 不改 Prompt 协议标签名。
- 不恢复旧武侠/仙侠默认体验。
- 不把本轮变成新功能迭代。
- 不主动改存档结构，除非修复明确需要且兼容读取。
- 不做浏览器自动化 UI 测试；需要 UI smoke 时只启动本地服务器，由玩家手动测。

## 已完成记录

- 现代默认主链已移除主要 `境界 / 内力 / 修炼` 暴露面、本地空泛任务和普通现代随身物落包倾向。
- 主剧情 prompt assembly 已同源化；字数、人称、重试、免责声明去重；payload 分段诊断已加入。
- 主剧情 payload 诊断已补强：记录 Tavern 开关、实际 assembly 分支、runtime requirements 注入前后 message 结构、provider protocol 与 DeepSeek/Claude 兼容归一化后的 role 序列；诊断仍只写结构摘要，不写完整正文。
- 导演配置与角色种子已进入主剧情、规划分析、世界演变边界；后处理使用顶层导演配置覆盖开局快照。
- 初始世界生成已接入导演偏好和未转正角色种子弱约束：只影响世界容纳度、职业/关系入口和地点氛围，不强制登场，不把 seed ID、完整卡片或未登场事实写入 `<世界观>`。
- 世界观生成输出契约已统一：需要世界基底时明确 `<世界观>` 后接 `<世界基底>`；不需要时只输出 `<世界观>`。难度摘要已改为现代风险/资源/日常压力口径。
- 变量生成已修复 extra prompt 重复注入、本地 RPG 框架虚构、普通子宫档案反复补档；变量链路不再因 NSFW 总开关强制注入完整名器表。
- 角色种子 UI 已把 `红颜/后宫对象` 改为枚举入口；右侧功能页已恢复直接弹窗。
- 地图更新已低频化；现代地图 prompt 已清理旧武侠母板；现代世界基底默认根改为 `现实世界`，孤立空 `诸天万界` 根会被兼容清理，非空旧地图不自动删除。
- 新游戏第六步确认页已改为顶部起始的滚动安全布局，避免超高内容被 `h-full + justify-center` 截掉顶部。
- 现代时间法则、默认文风、文章优化、COT / format / runtime copy 已完成第一轮现代中性收口。
- 本轮 focused tests、`git diff --check` 和 `npm run build` 已通过。

## 未完成队列

1. 规划分析 / 开局规划亲密世界书收口
   - 普通日常、开局规划、无亲密语义场景不得常驻完整名器/后庭/臀部类大表。
   - 只允许短规则边界或摘要进入普通规划链路；完整条目由明确亲密/NSFW 场景触发。
   - 继续保留红颜候选守门：未登场 seed 不得直接变成红颜规划候选。

2. Runtime NSFW extra prompt 边界讨论
   - 普通 SFW 主剧情是否继续携带 runtime NSFW extra prompt 先不改实现。
   - 待确认方向：只在明确亲密/NSFW 场景触发，或至少避免作为独立 user message 常驻普通日常回合。

## 验证记录

- `npx vitest run __tests__/modernPromptGuardrails.test.ts __tests__/openingConfigNormalization.test.ts __tests__/responseCommandProcessor.test.ts __tests__/autoConsumables.test.ts`
- `npx vitest run __tests__/directorConfigAndSeeds.test.ts __tests__/openingConfigNormalization.test.ts __tests__/responseCommandProcessor.test.ts __tests__/socialBehaviorLite.test.ts __tests__/variableRegistry.test.ts __tests__/dbServiceDirectorConfig.test.ts __tests__/phase32RuntimeWorldbooks.test.ts __tests__/postprocessScheduler.test.ts __tests__/storyLengthValidation.test.ts __tests__/variableModelPrompts.test.ts __tests__/mapUpdateWorkflow.test.ts __tests__/rightPanelModal.test.ts __tests__/newGameWizardCopy.test.ts`
- `npx vitest run __tests__/worldGenerationParser.test.ts __tests__/modernUrbanDefaults.test.ts`
- `git diff --check`
- `npm run build`

## 手动 Smoke

- 初始世界生成：现代 payload 无旧武侠地图模板、旧成长字段和输出标签冲突；seed/director 只作为弱约束。
- 开局规划：普通日常不常驻完整名器类世界书；seed/director 只出现受限摘要和必要 ID。
- 主剧情：酒馆预设关闭时诊断明确显示非 Tavern 分支；现代 system / COT / format 不带旧武侠文风锚点。
- UI：右侧功能页直接弹窗；新游戏第六步顶部可见且可滚动。
