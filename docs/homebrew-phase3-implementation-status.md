# Homebrew Phase 3 Status

> 日期：2026-06-24
>
> 本文是 Phase 3 的单一收口文档。旧的阶段子文档已合并到这里；不再继续维护分散文档。

## 当前结论

Phase 3 已收口，当前基线是 `main` / `origin/main` at
`45c25aa fix: preserve npc archive updates from variable commands`。

本轮没有必须留在 Phase 3 内继续处理的 blocker。后续工作进入 Phase 4+ 专项设计、
普通 bugfix queue 或 prompt hygiene backlog；不要继续用 Phase 3 名义扩张范围。

## 重要改动

- 默认现代都市路径已落地：未显式选择题材、模式包、世界书或手写覆盖时，运行时默认按
  `现代都市` 处理；显式武侠/仙侠/本地模式包/PromptManager 覆盖仍尊重用户选择。
- 默认开局不再强制组织、成员、初始伙伴或势力列表；`世界.势力列表` 证据驱动，没有明确组织结构时可以为空。
- 普通手机、钱包、银行卡、普通钥匙、笔记本电脑和普通衣物按 prompt-only 生活背景处理；
  只有剧情证据、任务道具、工作配发、加密数据、损坏状态、可交付物或明确金额现金才落为可追踪物品。
- 存档级 `导演配置` 已落地，包含 `玩家剧情倾向`、`角色种子定义[]` 和
  `角色种子运行时状态[]`；旧 `OpeningConfig.玩家剧情倾向` 只保留兼容读取。
- 角色种子池已形成单存档闭环：可在新建游戏和右侧导演配置编辑；摘要常驻，完整卡片按场景/行动/规划命中展开；
  转正、防重复、暂停/删除、linked NPC 改名/合并/消失降级都按精确 `角色种子ID` 驱动。
- `社交[]` 完成 v2 起步迁移：保留旧扁平字段，同时新增 `社交档案版本`、`行为档案`、
  `角色种子ID`；红颜规划 v2 只读取已登场、女性、重要且有承接价值的候选，空候选不生成空规划。
- 后处理调度已接入 `<后处理信号>` 和本地兜底规则；信号缺失/解析失败时仍安全执行必要规划分析和世界演变，
  可靠信号为否时也会按主线缺失/完成、关系突破、重大余波、时空跨度等本地信号强制触发。
- Prompt payload 已完成主要现代化：世界观生成使用现代母板，输出契约统一为 `<世界观>` / `<世界基底>`；
  `core_world_summary` 成为主剧情默认读取源，摘要缺失才回退完整世界观。
- NSFW 注入改为 `disabled / beacon / intimacy / explicit` 分层；普通日常不常驻完整显式规则或名器世界书。
- 地图更新已低频化：没有稳定新地点时不发起 AI 地图请求；现代根默认 `现实世界`，孤立空 `诸天万界` 可兼容清理。
- 最近 upstream intake 中的 NPC 档案保真修复已手动吸收：变量生成后的部分 `社交[N]` 写入不再覆盖完整 NPC，
  同名 NPC 合并会保留长期字段并接收本轮有效更新。

## 经验教训

- 文档保持当前状态，不写历史 changelog；阶段内的细分决策收口后应并回状态文档，避免 3.2/3.4 这类子文档继续漂移。
- 只优化默认现代路径，不做全仓旧词清零。旧题材、本地模式包、兼容字段和用户覆盖层要保留，除非明确切换方向。
- 改 `prompts/*` 不等于运行时一定生效；PromptManager / IndexedDB 的 `builtin_prompt_entries`
  和 `extra_worldbooks` 可能覆盖源码 fallback。
- `useGame.ts` 本轮只是边界收口，不是瘦身完成。后续要拆 controller/composer，而不是继续在主 hook 内堆 facade。
- 最终 API body 的短 message 形态不能直接判定 Tavern 路径；provider 兼容层可能合并连续同 role message，
  应以 payload diagnostics 的 assembly 分支和 role 序列为准。
- `<变量规划>` 是自然语言落点提醒，不是命令区。普通钥匙、校园卡、手机等现代物件即使被规划写成任务道具，
  也不应自动落库；真正要落库时必须有剧情证据或机制追踪需要。

## 未做完

- 地图摘要：Phase 3 不实现。后续地图专项应从六层地图树生成确定性摘要，突出当前大/中/小/区/子地点关系，
  避免不了解外部地图时硬拼复杂大地图。
- 变量 prompt hygiene：关闭 `启用饱腹口渴系统` 时，大部分生存字段已过滤，但变量难度速查仍可能保留
  `生理难度` 这类标题级摘要；现代默认变量示例和跨题材物品示例也可继续裁剪。
- 开局规划身份：开局规划初始化仍复用主剧情身份外壳，容易被误判为第二次主剧情；后续可改为专用
  `opening_planning` 诊断阶段和规划身份。
- 开局性能：全阶段都走 `deepseek-v4-pro` 时完整开局曾实测约 468 秒。后续应补阶段性能表，
  记录 `stage / model / channel / inputChars / outputChars / elapsedMs / retryCount / skipped`，
  再决定裁 prompt、换模型、并行或延迟。
- useGame controller 化：后续按开局/session、prompt runtime、社交/导演配置、存档、后处理、图片 runtime
  分组小步迁移；每轮只迁一组，不顺手重写业务算法。
- 导演配置导入导出、跨存档角色模板库、全局角色包同步、完整社交数据库重写均不属于 Phase 3 完成标准。

## 后续入口

- 当前核心事实和功能地图：`docs/homebrew-detailed-feature-map.md`
- 未来阶段路线：`docs/homebrew-roadmap.md`
- Upstream intake 候选：`docs/homebrew-upstream-intake-decisions.md`

## 验证原则

- 文档类收口用 `rg` 查旧引用和 `git diff --check` 验证。
- 代码或 prompt 行为变更继续使用 focused Vitest、`npm run build` 和 `git diff --check`。
- UI smoke 不做浏览器自动化；需要真实 UI 时只启动本地服务器，由玩家手动确认。
