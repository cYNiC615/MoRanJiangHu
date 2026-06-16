# 墨色江湖：无尽武林（个人定制版）

> 此仓库是个人 homebrew fork，仅用于私人定制开发，不做公开发布或 PR 合并。

当前方向是把原项目收束为本地优先的 AI-native RPG 工作台：保留长上下文文本游戏、提示词/世界书注入、变量落地、本地状态、本地存档、图片管理与 ComfyUI 文生图链路；删除云同步、移动/APK、社区 UGC、公共运营和旧题材专用功能。

## 当前状态

- 数据默认保存在浏览器本地 IndexedDB。
- 存档导入导出使用本地 ZIP/JSON，不再接入 GitHub Release 或 WebDAV 等云同步。
- 文生图后端收束为 ComfyUI；其它图片后端、图床代理和外部图片存储链路已退役。
- Cloudflare/Worker 代码只保留 ComfyUI 代理、后端发现和诊断这类本地/API 辅助价值，不保留部署发布流程。
- 旧武侠/修仙、小说分解、同人/原著融合、旧战斗、拍卖行、移动端/APK、公共同步/社区功能都不是当前保留方向。

## 核心能力

- 回合式互动叙事、开局生成、世界初始化与世界演变。
- AI 文本链路、提示词池、Tavern preset、世界书和运行时提示词拼装。
- 变量生成、变量校准、本地命令落地和状态规范化。
- 角色、NPC、社交、任务、背包、装备、地图、记忆等本地功能面。
- 本地存档、ZIP 导入导出、图片资源归档和 IndexedDB 图片缓存。
- ComfyUI 普通/NPC/场景/NSFW/物品图片生成、工作流保存和后端自动发现。

## 技术栈

- `React 19`
- `TypeScript`
- `Vite 6`
- `Tailwind CSS`
- `IndexedDB`
- `fflate`
- `Cloudflare Pages Functions`（仅用于保留的 ComfyUI/诊断 API）

## 快速开始

```bash
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

常用命令：

```bash
npm run build
npm run preview
npm run test:run
npm run stress:test
```

如果需要构建本地 worker functions：

```bash
npm run worker:build
```

## 本地配置

大多数模型、接口地址、分流策略、提示词开关、世界书和图片设置都在应用内设置页管理。

安全模板：

- `.env.production.example`：本地生产构建和 worker 本地调试可参考的非真实值模板。
- `.dev.vars.example`：本地 Wrangler 调试可参考的运行时变量模板。

不要提交真实 API key、worker token、CNB token 或其它个人凭据。

## ComfyUI / CNB 后端发现

只做地址发现与上报：

```bash
npm run cnb:sync
```

只调用 CNB OpenAPI 启动指定 workspace 并等待可访问：

```bash
npm run cnb:workspace -- --repo owner/repo --branch main
```

启动后端并自动发现后上报：

```bash
npm run cnb:start -- "python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header '*'"
```

常用变量：

```env
CNB_VSCODE_PROXY_URI=https://xxxx-{{port}}.cnb.run
CNB_IMAGE_BACKEND_PORT=8188
CNB_IMAGE_BACKEND_URL=
CNB_OPENAPI_BASE=https://api.cnb.cool
CNB_TOKEN=
CNB_REPO=
CNB_BRANCH=main
CNB_START_WORKSPACE=false
CNB_SYNC_WEBHOOK_URL=
CNB_SYNC_WEBHOOK_TOKEN=
CNB_SYNC_CUSTOMER_ID=local
CNB_SYNC_BACKEND_TYPE=comfyui
```

可选 Pages Function：

- `functions/api/image-backend/cnb-sync.ts`
- `functions/api/image-backend/comfyui-proxy/[[path]].ts`
- `functions/api/image-backend/probe.ts`
- `functions/api/diagnostics/report.ts`

## 目录结构

```text
components/   UI、弹窗、功能面板与布局组件
data/         内置预设与静态数据
docs/         设计、重构与当前状态文档
functions/    保留的 Pages Functions API
hooks/        业务工作流与 React hooks
models/       领域模型与类型定义
prompts/      提示词系统
scripts/      开发辅助脚本
services/     AI、数据库、本地存档与任务服务
styles/       全局样式与主题
utils/        配置、状态与通用工具函数
```

## 开发提示

- 当前不是稳定公开发行产品，不做部署、发布、APK 或公共运营流程。
- 旧存档兼容不是默认目标；本地存档、导入导出和当前可玩链路才是保留边界。
- 排查旧数据残留时优先检查 IndexedDB、内置 prompt override 和本地 extra worldbooks。
- 新增代码优先遵循所在模块现有风格，不做无关重命名。
