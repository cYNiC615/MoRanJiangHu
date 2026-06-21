
import {
    角色数据结构,
    环境信息结构,
    聊天记录结构,
    提示词结构,
    视觉设置结构,
    GameResponse,
    游戏设置结构,
    记忆系统结构,
    WorldGenConfig,
    世界数据结构,
    玩家组织结构,
    剧情系统结构,
    剧情规划结构,
    女主剧情规划结构,
    OpeningConfig,
    NPC结构,
    场景图片档案,
    场景生图任务记录,
    NPC生图任务记录,
    生图任务来源类型,
    香闺秘档部位类型,
    图片管理设置结构,
    内置提示词条目结构,
    世界书结构,
    世界书预设组结构,
    导演配置结构
} from '../types';
import { useEffect, useRef, useState } from 'react';
import * as dbService from '../services/dbService';
import * as textAIService from '../services/ai/text';
import { 终止全部ComfyUI生图任务 } from '../services/ai/image';
import { recordDiagnosticLog } from '../services/diagnosticLog';
import { useGameState } from './useGameState';
import { 规范化接口设置, 获取记忆总结接口配置, 获取变量计算接口配置, 获取世界演变接口配置, 获取文生图接口配置, 获取场景文生图接口配置, 获取NSFW文生图接口配置, 获取生图词组转化器接口配置, 获取生图画师串预设, 获取词组转化器预设提示词, 接口配置是否可用, 刷新已发现ComfyUI后端缓存, 变量校准功能已启用 as 变量生成功能已启用 } from '../utils/apiConfig';
import type { 当前可用接口结构 } from '../utils/apiConfig';
import {
    规范化记忆系统,
    规范化记忆配置,
    构建即时记忆条目,
    构建短期记忆条目,
    写入四段记忆,
    构建待处理记忆压缩任务,
    构建手动记忆压缩任务,
    应用记忆压缩结果,
    记忆压缩任务结构
} from './useGame/memoryUtils';
import { 执行主剧情发送工作流 } from './useGame/sendWorkflow';
import { 执行正文润色 as 执行正文润色工作流 } from './useGame/bodyPolish';
import { 构建上下文快照数据 } from './useGame/contextSnapshot';
import { 执行响应命令处理 } from './useGame/responseCommandProcessor';
import { 创建会话生命周期工作流 } from './useGame/sessionLifecycleWorkflow';
import type { 运行时提示词状态 } from './useGame/systemPromptBuilder';
import {
    创建开场基础状态,
    创建开场命令基态,
    构建前端清空开场状态,
    创建开场空白剧情,
    创建开场空白环境,
    创建开场空白世界,
    创建空剧情规划,
    创建空组织状态,
    创建空记忆系统,
    规范化世界状态,
    规范化组织状态,
    同步角色与组织状态,
    规范化剧情状态,
    规范化剧情规划状态,
    规范化女主剧情规划状态,
    按回合窗口裁剪历史
} from './useGame/storyState';
// ponytail: use storyState normalizers directly; local wrappers only hid the same functions.
import { 执行世界演变更新工作流 } from './useGame/worldEvolutionWorkflow';
import { 创建图片预设工作流, 提取NPC生图基础数据附带私密描述 } from './useGame/imagePresetWorkflow';
import { 创建设置持久化工作流 } from './useGame/config/settingsPersistenceWorkflow';
import { 创建历史回合工作流 } from './useGame/historyTurnWorkflow';
import { 创建存读档工作流 } from './useGame/saveLoad/saveLoadWorkflow';
import { 创建规划更新工作流 } from './useGame/planningUpdateWorkflow';
import { 创建NPC图片状态工作流, 合并NPC图片档案, 生成NPC生图记录ID } from './useGame/npcImageStateWorkflow';
import { 创建场景图片档案工作流, 按场景图上限裁剪档案, 生成场景生图记录ID, 规范化场景图片档案 } from './useGame/sceneImageArchiveWorkflow';
import { 创建场景生图触发工作流 } from './useGame/sceneImageTriggerWorkflow';
import { 创建手动图片动作工作流 } from './useGame/image/manualImageActionsWorkflow';
import { 创建手动NPC工作流 } from './useGame/manualNpcWorkflow';
import { 创建主角图片工作流 } from './useGame/playerImageWorkflow';
import { 创建运行时变量工作流 } from './useGame/runtimeVariableWorkflow';
import { 创建变量校准协调器 as 创建变量生成协调器 } from './useGame/variableCalibrationCoordinator';
import { use世界演变控制 } from './useGame/worldEvolutionControl';
import { normalizeCanonicalGameTime, 环境时间转标准串 } from './useGame/timeUtils';
import { 提取NPC生图基础数据, 提取NPC香闺秘档部位生图数据, 提取主角生图基础数据 } from './useGame/npcContext';
import { 应用NPC记忆总结, 构建手动NPC记忆总结候选, 构建自动NPC记忆总结候选, 构建NPC记忆总结回退文案 } from './useGame/npcMemorySummary';
import { 规范化游戏设置 } from '../utils/gameSettings';
import { 规范化视觉设置 } from '../utils/visualSettings';
import { 默认图片管理设置, 规范化图片管理设置 } from '../utils/imageManagerSettings';
import { 规范化可选开局配置 } from '../utils/openingConfig';
import { 规范化导演配置 } from '../utils/directorConfig';
import { 修复开局伙伴社交列表 } from '../utils/openingCompanion';
import { 构建文生图运行时额外提示词 } from '../prompts/runtime/nsfw';
import { 构建题材生图额外要求 } from '../utils/topicImageGuidance';
import {
    规范化环境信息,
    构建完整地点文本,
    规范化角色物品容器映射,
    规范化社交列表
} from './useGame/stateTransforms';
import { 按世界演变分流净化响应 } from './useGame/storyResponseGuards';
import { 执行变量自动校准 } from './useGame/variableCalibration';
import { 执行变量模型校准工作流 } from './useGame/variableModelWorkflow';
import { 合并变量校准结果到响应 as 合并变量生成结果到响应 } from './useGame/variableCalibrationMerge';
import { 获取图片展示地址, 图片资源记录含可恢复地址 } from '../utils/imageAssets';
import { 设置键 } from '../utils/settingsSchema';
import { countOpenAIChatMessagesTokens, countOpenAITextTokens } from '../utils/tokenEstimate';
import { 保存NPC变量本地备份, 自动备份NPC变量 } from '../services/npcVariableBackup';
import { 合并保留既有NPC列表 } from '../utils/npcRetentionGuard';
import { 设置默认技艺运行时配置 } from './useGame/stateTransforms';
import { 最新AI消息可继续变量生成 } from '../utils/chatRecovery';
import { 规范化并同步社交导演状态, 过滤主角同名NPC } from './useGame/socialDirectorSync';
import { 创建PromptRuntimeFacade } from './useGame/promptRuntimeFacade';

const 加载图片AI服务 = () => import('../services/ai/image/runtime');
const 加载NPC生图工作流 = () => import('./useGame/npcImageWorkflow');
const 加载NPC香闺秘档生图工作流 = () => import('./useGame/npcSecretImageWorkflow');
const 加载场景生图工作流 = () => import('./useGame/sceneImageWorkflow');

type 回合快照结构 = {
    玩家输入: string;
    游戏时间: string;
    回档前状态: {
        角色: 角色数据结构;
        环境: 环境信息结构;
        社交: any[];
        世界: 世界数据结构;
        玩家组织: 玩家组织结构;
        任务列表: any[];
        剧情: 剧情系统结构;
        剧情规划: 剧情规划结构;
        女主剧情规划?: 女主剧情规划结构;
        记忆系统: 记忆系统结构;
    };
    回档前持久态: {
        视觉设置: 视觉设置结构;
        场景图片档案: 场景图片档案;
    };
    回档前历史: 聊天记录结构[];
};

type 最近开局配置结构 = {
    worldConfig: WorldGenConfig;
    charData: 角色数据结构;
    openingConfig?: OpeningConfig;
    openingStreaming: boolean;
    openingExtraPrompt: string;
};

type 开局独立阶段进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 上下文段 = {
    id: string;
    title: string;
    category: string;
    order: number;
    content: string;
    uploadTokens: number;
};

type 上下文快照 = {
    sections: 上下文段[];
    fullText: string;
    uploadTokens: number;
    runtimePromptStates: Record<string, 运行时提示词状态>;
};

type 发送结果 = {
    cancelled?: boolean;
    attachedRecallPreview?: string;
    preparedRecallTag?: string;
    needRecallConfirm?: boolean;
    needRerollConfirm?: boolean;
    parseErrorMessage?: string;
    parseErrorDetail?: string;
    parseErrorRawText?: string;
    errorDetail?: string;
    errorTitle?: string;
};

const 自动重试最大次数 = 3;

// ponytail: pure helpers live outside the hook; renders should not rebuild constants.
const 显式NPC生图性别集合 = new Set(['男', '女', '男娘', '扶她']);

const NPC生图性别是否显式 = (value: string): boolean => 显式NPC生图性别集合.has(value);

const 游戏时间转排序值 = (input?: string): number | null => {
    const canonical = normalizeCanonicalGameTime(input || '');
    if (!canonical) return null;
    const matched = canonical.match(/^(\d{1,6}):(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (!matched) return null;
    return (((Number(matched[1]) * 100 + Number(matched[2])) * 100 + Number(matched[3])) * 100 + Number(matched[4])) * 100 + Number(matched[5]);
};

const 当前时间已达到 = (currentTime?: string, targetTime?: string): boolean => {
    const currentSort = 游戏时间转排序值(currentTime);
    const targetSort = 游戏时间转排序值(targetTime);
    return currentSort !== null && targetSort !== null && currentSort >= targetSort;
};

type 回忆检索进度 = {
    phase: 'start' | 'stream' | 'done' | 'error';
    text?: string;
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 正文润色进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 变量生成进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 独立阶段标识 = 'polish' | 'world' | 'planning' | 'variable' | 'map';
type 独立阶段失败决策 = 'retry' | 'skip';
type 独立阶段失败决策参数 = {
    stageId: 独立阶段标识;
    stageLabel: string;
    errorText: string;
    manualAttempt?: number;
};

type 规划分析进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 世界演变进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 地图更新进度 = {
    phase: 'start' | 'done' | 'error' | 'skipped' | 'cancelled';
    text?: string;
    rawText?: string;
    commandTexts?: string[];
    channelName?: string;
    modelName?: string;
    startedAt?: number;
    finishedAt?: number;
    elapsedMs?: number;
};

type 变量生成上下文缓存项 = {
    回合: number;
    玩家输入: string;
    正文: string;
    本回合命令: string[];
    校准说明: string[];
    校准命令: string[];
};

type 发送选项 = {
    onRecallProgress?: (progress: 回忆检索进度) => void;
    onPolishProgress?: (progress: 正文润色进度) => void;
    onWorldEvolutionProgress?: (progress: 世界演变进度) => void;
    onPlanningProgress?: (progress: 规划分析进度) => void;
    onVariableGenerationProgress?: (progress: 变量生成进度) => void;
    onMapUpdateProgress?: (progress: 地图更新进度) => void;
    onStageFailureDecision?: (params: 独立阶段失败决策参数) => Promise<独立阶段失败决策> | 独立阶段失败决策;
};

type 记忆总结阶段类型 = 'idle' | 'remind' | 'processing' | 'review';
type NPC记忆总结任务结构 = {
    id: string;
    类型: 'npc_memory';
    npcId: string;
    npcName: string;
    批次: string[];
    批次条数: number;
    起始索引: number;
    结束索引: number;
    起始时间: string;
    结束时间: string;
    提示词模板: string;
    触发方式: 'auto' | 'manual';
    预留原始条数: number;
};
type 右下角提示结构 = {
    id: string;
    title: string;
    message: string;
    tone?: 'info' | 'success' | 'error';
    previewUrl?: string;
};

export const useGame = () => {
    const gameState = useGameState();
    const {
        view, setView,
        setHasSave,
        角色, 设置角色,
        环境, 设置环境,
        社交, 设置社交,
        世界, 设置世界,
        玩家组织, 设置玩家组织,
        任务列表, 设置任务列表,
        剧情, 设置剧情,
        剧情规划, 设置剧情规划,
        女主剧情规划, 设置女主剧情规划,
        开局配置, 设置开局配置,
        导演配置, 设置导演配置,
        游戏初始时间, 设置游戏初始时间,
        历史记录, 设置历史记录,
        记忆系统, 设置记忆系统,
        loading, setLoading,
        setWorldEvents,
        setShowSettings,
        setShowInventory,
        setShowEquipment,
        setShowSocial,
        setShowTeam,
        setShowWorld,
        setShowMap,
        setShowTask,
        setShowStory,
        setShowHeroinePlan,
        setShowDirectorConfig,
        setShowMemory,
        setShowSaveLoad,
        setActiveTab,
        
        apiConfig, setApiConfig,
        visualConfig, setVisualConfig,
        imageManagerConfig, setImageManagerConfig,
        gameConfig, setGameConfig,
        memoryConfig, setMemoryConfig,
        prompts, setPrompts,
        ensurePromptsLoaded,
        setCurrentTheme,
        scrollRef, abortControllerRef, recallAbortControllerRef, variableGenerationAbortControllerRef
    } = gameState;
    const 回合快照栈Ref = useRef<回合快照结构[]>([]);
    const 最近自动存档时间戳Ref = useRef<number>(0);
    const 最近自动存档签名Ref = useRef<string>('');
    const [可重Roll计数, set可重Roll计数] = useState(0);
    const [最近开局配置, 设置最近开局配置] = useState<最近开局配置结构 | null>(null);
    const apiConfigRef = useRef(apiConfig);
    const 社交Ref = useRef<any[]>(Array.isArray(社交) ? 社交 : []);
    const visualConfigRef = useRef(visualConfig);
    const imageManagerConfigRef = useRef<图片管理设置结构>(imageManagerConfig || 默认图片管理设置);
    const [世界演变更新中, set世界演变更新中] = useState(false);
    const [世界演变状态文本, set世界演变状态文本] = useState('世界演变待命');
    // 世界演变“最近更新时间”应使用游戏内时间戳（用于展示/归档），而非现实时间。
    const [世界演变最近更新时间, set世界演变最近更新时间State] = useState<string | null>(null);
    // 仍然需要一个现实时间戳用于前端去抖/冷启动保护（避免依赖抖动导致 auto_due 连续触发）。
    const 世界演变最近现实更新时间戳Ref = useRef<number>(0);
    const set世界演变最近更新时间 = (value: string | null) => {
        set世界演变最近更新时间State(value);
        世界演变最近现实更新时间戳Ref.current = Date.now();
    };
    const [世界演变最近摘要, set世界演变最近摘要] = useState<string[]>([]);
    const [世界演变最近原始消息, set世界演变最近原始消息] = useState('');
    const [待处理记忆总结任务, set待处理记忆总结任务] = useState<记忆压缩任务结构 | null>(null);
    const [记忆总结阶段, set记忆总结阶段] = useState<记忆总结阶段类型>('idle');
    const [记忆总结草稿, set记忆总结草稿] = useState('');
    const [记忆总结错误, set记忆总结错误] = useState('');
    const [待处理NPC记忆总结队列, set待处理NPC记忆总结队列] = useState<NPC记忆总结任务结构[]>([]);
    const [NPC记忆总结阶段, setNPC记忆总结阶段] = useState<记忆总结阶段类型>('idle');
    const [NPC记忆总结草稿, setNPC记忆总结草稿] = useState('');
    const [NPC记忆总结错误, setNPC记忆总结错误] = useState('');
    const 自动记忆总结暂停Ref = useRef(false);
    const 开局社交刚初始化Ref = useRef(false);
    const 上下文快照缓存Ref = useRef<{
        value: 上下文快照;
        refs: unknown[];
    } | null>(null);
    const 世界演变进行中Ref = useRef(false);
    const 世界演变去重签名Ref = useRef('');
    const 规划分析进行中Ref = useRef(false);
    const 前台发送序号Ref = useRef(0);
    const 最近变量生成上下文Ref = useRef<变量生成上下文缓存项[]>([]);
    const NPC生图进行中Ref = useRef<Set<string>>(new Set());
    const 主角生图进行中Ref = useRef<Set<string>>(new Set());
    const 主角自动生图处理器Ref = useRef<(player: 角色数据结构) => void>(() => undefined);
    const 主角每回合生图检查器Ref = useRef<(player: 角色数据结构) => void>(() => undefined);
    const NPC香闺秘档生图进行中Ref = useRef<Set<string>>(new Set());
    const NPC自动生图签名Ref = useRef<Set<string>>(new Set());
    const NPC自动香闺秘档生图签名Ref = useRef<Set<string>>(new Set());
    const 角色锚点补全进行中Ref = useRef<Set<string>>(new Set());
    const NPC性别补正生图签名Ref = useRef('');
    const 主要角色资源补全签名Ref = useRef('');
    const 全部NPC头像补全签名Ref = useRef('');
    const 全部NPC头像补全进行中Ref = useRef(false);
    const 生图存档作用域Ref = useRef(`image_scope_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const 生图存档AbortControllerRef = useRef<AbortController>(new AbortController());
    const [NPC生图任务队列, setNPC生图任务队列] = useState<NPC生图任务记录[]>([]);
    const 场景生图自动应用任务Ref = useRef('');
    const 场景图片档案Ref = useRef<场景图片档案>({});
    const [场景图片档案, set场景图片档案] = useState<场景图片档案>({});
    const [场景生图任务队列, set场景生图任务队列] = useState<场景生图任务记录[]>([]);
    const 后台手动生图监控Ref = useRef<Array<{ npcId: string; since: number; npcName: string; 构图: '头像' | '半身' | '立绘' }>>([]);
    const 已提示后台生图任务Ref = useRef<Set<string>>(new Set());
    const 后台私密生图监控Ref = useRef<Array<{ npcId: string; since: number; npcName: string; 部位: 香闺秘档部位类型 }>>([]);
    const 已提示后台私密生图任务Ref = useRef<Set<string>>(new Set());
    const 后台场景生图监控Ref = useRef<Array<{ since: number; 摘要: string }>>([]);
    const 已提示后台场景生图任务Ref = useRef<Set<string>>(new Set());
    const 切换生图存档作用域 = () => {
        生图存档AbortControllerRef.current.abort();
        void 终止全部ComfyUI生图任务();
        生图存档AbortControllerRef.current = new AbortController();
        生图存档作用域Ref.current = `image_scope_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        场景生图自动应用任务Ref.current = '';
        NPC生图进行中Ref.current.clear();
        主角生图进行中Ref.current.clear();
        NPC香闺秘档生图进行中Ref.current.clear();
        NPC自动生图签名Ref.current.clear();
        NPC自动香闺秘档生图签名Ref.current.clear();
        角色锚点补全进行中Ref.current.clear();
        NPC性别补正生图签名Ref.current = '';
        全部NPC头像补全签名Ref.current = '';
        全部NPC头像补全进行中Ref.current = false;
        setNPC生图任务队列([]);
        set场景生图任务队列([]);
        后台手动生图监控Ref.current = [];
        后台私密生图监控Ref.current = [];
        后台场景生图监控Ref.current = [];
        已提示后台生图任务Ref.current.clear();
        已提示后台私密生图任务Ref.current.clear();
        已提示后台场景生图任务Ref.current.clear();
    };
    const [右下角提示列表, set右下角提示列表] = useState<右下角提示结构[]>([]);
    const [聊天区自动滚动抑制令牌, set聊天区自动滚动抑制令牌] = useState(0);
    const [聊天区强制置底令牌, set聊天区强制置底令牌] = useState(0);
    const [变量生成中, set变量生成中] = useState(false);
    const [后台队列处理中, set后台队列处理中] = useState(false);
    const [开局主剧情进度, set开局主剧情进度] = useState<开局独立阶段进度 | null>(null);
    const [开局文章优化进度, set开局文章优化进度] = useState<开局独立阶段进度 | null>(null);
    const [开局变量生成进度, set开局变量生成进度] = useState<开局独立阶段进度 | null>(null);
    const [开局世界演变进度, set开局世界演变进度] = useState<开局独立阶段进度 | null>(null);
    const [开局规划进度, set开局规划进度] = useState<开局独立阶段进度 | null>(null);
    const [开局地图更新进度, set开局地图更新进度] = useState<开局独立阶段进度 | null>(null);
    const [内置提示词列表, set内置提示词列表] = useState<内置提示词条目结构[]>([]);
    const [世界书列表, set世界书列表] = useState<世界书结构[]>([]);
    const [世界书预设组列表, set世界书预设组列表] = useState<世界书预设组结构[]>([]);

    useEffect(() => {
        apiConfigRef.current = apiConfig;
    }, [apiConfig]);

    useEffect(() => {
        社交Ref.current = Array.isArray(社交) ? 社交 : [];
    }, [社交]);

    useEffect(() => {
        visualConfigRef.current = visualConfig;
    }, [visualConfig]);

    useEffect(() => {
        imageManagerConfigRef.current = 规范化图片管理设置(imageManagerConfig);
    }, [imageManagerConfig]);

    useEffect(() => {
        if (开局配置) {
            设置默认技艺运行时配置(开局配置.题材模式, 开局配置.modeRuntimeProfile);
        }
    }, [开局配置]);

    useEffect(() => {
        刷新NPC记忆总结队列(Array.isArray(社交) ? 社交 : [], { 静默: NPC记忆总结阶段 === 'processing' || NPC记忆总结阶段 === 'review' });
    }, [社交, memoryConfig]);

    // --- Actions ---
    const 深拷贝 = <T,>(data: T): T => {
        if (data === undefined || data === null) {
            return data;
        }
        if (typeof structuredClone === 'function') {
            return structuredClone(data);
        }
        return JSON.parse(JSON.stringify(data)) as T;
    };
    const 重置自动存档状态 = () => {
        最近自动存档时间戳Ref.current = 0;
        最近自动存档签名Ref.current = '';
    };
    const 删除最近自动存档并重置状态 = async (): Promise<void> => {
        try {
            await dbService.删除最近自动存档();
        } catch (error) {
            console.error('删除最近自动存档失败', error);
        } finally {
            重置自动存档状态();
        }
    };
    const 推送右下角提示 = (toast: Omit<右下角提示结构, 'id'>) => {
        const nextId = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set右下角提示列表(prev => [...prev, { id: nextId, ...toast }].slice(-4));
        window.setTimeout(() => {
            set右下角提示列表(prev => prev.filter(item => item.id !== nextId));
        }, 4200);
    };
    const 应用视觉设置到状态 = (value: Partial<视觉设置结构> | null | undefined) => {
        const normalized = 规范化视觉设置(value || {});
        visualConfigRef.current = normalized;
        setVisualConfig(normalized);
        void dbService.保存设置(设置键.视觉设置, normalized);
    };
    const 应用图片管理设置到状态 = (value: Partial<图片管理设置结构> | null | undefined) => {
        const normalized = 规范化图片管理设置(value || 默认图片管理设置);
        imageManagerConfigRef.current = normalized;
        setImageManagerConfig(normalized);
        void dbService.保存设置(设置键.图片管理设置, normalized);
    };
    const 应用场景图片档案到状态 = (value: 场景图片档案 | null | undefined) => {
        const normalized = 按场景图上限裁剪档案(value || {}, 获取场景图历史上限()).档案;
        场景图片档案Ref.current = normalized;
        set场景图片档案(normalized);
        void dbService.保存设置(设置键.场景图片档案, normalized);
    };
    const 关闭右下角提示 = (toastId: string) => {
        if (!toastId) return;
        set右下角提示列表(prev => prev.filter(item => item.id !== toastId));
    };

    const 构建NPC记忆总结任务 = (
        npc: NPC结构,
        trigger: 'auto' | 'manual'
    ): NPC记忆总结任务结构 | null => {
        const candidate = trigger === 'manual'
            ? 构建手动NPC记忆总结候选(npc?.记忆, memoryConfig)
            : 构建自动NPC记忆总结候选(npc?.记忆, memoryConfig);
        if (!candidate || !npc?.id) return null;
        const promptTemplate = (规范化记忆配置(memoryConfig).NPC记忆总结提示词 || '').trim();
        return {
            id: `npc_memory_${npc.id}_${candidate.起始原始索引}_${candidate.结束原始索引}_${candidate.批次条数}_${trigger}`,
            类型: 'npc_memory',
            npcId: npc.id,
            npcName: npc.姓名 || npc.id,
            批次: candidate.批次.map((item, index) => `[${index}] [${item.时间 || '未知时间'}] ${item.内容}`),
            批次条数: candidate.批次条数,
            起始索引: candidate.起始原始索引,
            结束索引: candidate.结束原始索引,
            起始时间: candidate.起始时间,
            结束时间: candidate.结束时间,
            提示词模板: promptTemplate,
            触发方式: trigger,
            预留原始条数: candidate.预留原始条数
        };
    };

    const 构建NPC记忆总结用户提示词 = (task: NPC记忆总结任务结构): string => {
        const lines = [
            `请将以下 NPC 原始记忆压缩为一条总结记忆。`,
            `NPC：${task.npcName}`,
            `索引范围：${task.起始索引} - ${task.结束索引}`,
            `时间范围：${task.起始时间} - ${task.结束时间}`,
            `条目数量：${task.批次条数}`,
            `总结后仍保留的较新原始记忆条数：${task.预留原始条数}`,
            '输入条目如下：',
            ...task.批次
        ];
        return lines.join('\n');
    };

    const 清空NPC记忆总结流程 = (options?: { 保留队列?: boolean }) => {
        if (!options?.保留队列) {
            set待处理NPC记忆总结队列([]);
        }
        setNPC记忆总结阶段('idle');
        setNPC记忆总结草稿('');
        setNPC记忆总结错误('');
    };

    const 刷新NPC记忆总结队列 = (
        socialData: NPC结构[],
        options?: { 静默?: boolean }
    ) => {
        const normalizedList = 规范化社交列表安全(socialData, { 合并同名: false });
        const rebuiltQueue = normalizedList
            .map((npc) => 构建NPC记忆总结任务(npc, 'auto'))
            .filter((item): item is NPC记忆总结任务结构 => Boolean(item));

        set待处理NPC记忆总结队列((prev) => {
            const activeId = prev[0]?.id;
            if (!activeId) return rebuiltQueue;
            const activeTask = rebuiltQueue.find((item) => item.id === activeId);
            const rest = rebuiltQueue.filter((item) => item.id !== activeId);
            return activeTask ? [activeTask, ...rest] : rebuiltQueue;
        });

        if (rebuiltQueue.length === 0) {
            清空NPC记忆总结流程();
            return;
        }
        if (自动记忆总结暂停Ref.current) {
            setNPC记忆总结阶段('idle');
            return;
        }
        if (!options?.静默 && NPC记忆总结阶段 === 'idle') {
            setNPC记忆总结阶段('remind');
        }
    };

    /** 过滤社交列表中与主角同名的NPC条目 */
    const 应用同名NPC过滤 = (list: NPC结构[], playerName?: string): NPC结构[] => {
        return 过滤主角同名NPC(list as any[], playerName) as NPC结构[];
    };

    const 应用并同步社交列表 = (
        nextSocial: NPC结构[],
        options?: { 静默NPC总结提示?: boolean }
    ): NPC结构[] => {
        const synced = 规范化并同步社交导演状态({
            nextSocial: nextSocial as any[],
            currentDirectorConfig: 导演配置,
            playerName: 角色?.姓名,
            normalizeSocialList: 规范化社交列表安全 as any
        });
        const normalized = synced.social as NPC结构[];
        if (synced.directorChanged) {
            设置导演配置(synced.directorConfig);
        }
        设置社交(normalized);
        刷新NPC记忆总结队列(normalized, { 静默: options?.静默NPC总结提示 === true });
        void performAutoSave({ social: normalized, directorConfig: synced.directorConfig, history: 历史记录, force: true });
        return normalized;
    };

    const 清空记忆总结流程 = (options?: { 保留任务?: boolean }) => {
        if (!options?.保留任务) {
            set待处理记忆总结任务(null);
        }
        set记忆总结阶段('idle');
        set记忆总结草稿('');
        set记忆总结错误('');
    };

    const 刷新记忆总结任务 = (
        memoryData: 记忆系统结构,
        options?: { 静默?: boolean }
    ) => {
        const nextTask = 构建待处理记忆压缩任务(
            规范化记忆系统(memoryData),
            规范化记忆配置(memoryConfig)
        );
        if (!nextTask) {
            清空记忆总结流程();
            return;
        }
        const sameTask = 待处理记忆总结任务?.id === nextTask.id;
        set待处理记忆总结任务(nextTask);
        if (sameTask && (记忆总结阶段 === 'processing' || 记忆总结阶段 === 'review')) {
            return;
        }
        if (!sameTask) {
            set记忆总结草稿('');
            set记忆总结错误('');
        }
        if (自动记忆总结暂停Ref.current) {
            set记忆总结阶段('idle');
            return;
        }
        if (!options?.静默) {
            set记忆总结阶段('remind');
        }
    };

    const 应用并同步记忆系统 = (
        nextMemory: 记忆系统结构,
        options?: { 静默总结提示?: boolean }
    ): 记忆系统结构 => {
        const normalized = 规范化记忆系统(nextMemory);
        设置记忆系统(normalized);
        刷新记忆总结任务(normalized, { 静默: options?.静默总结提示 === true });
        return normalized;
    };

    const 同步重Roll计数 = () => {
        set可重Roll计数(回合快照栈Ref.current.length);
    };

    const 清空重Roll快照 = () => {
        回合快照栈Ref.current = [];
        同步重Roll计数();
    };

    const 推入重Roll快照 = (snapshot: 回合快照结构) => {
        回合快照栈Ref.current.push(snapshot);
        同步重Roll计数();
    };

    const 弹出重Roll快照 = (): 回合快照结构 | null => {
        const snapshot = 回合快照栈Ref.current.pop() || null;
        同步重Roll计数();
        return snapshot;
    };

    const 回档到快照 = (
        snapshot: 回合快照结构,
        options?: { 保留图片状态?: boolean }
    ) => {
        const snapshotEnv = 规范化环境信息(深拷贝(snapshot.回档前状态.环境));
        设置角色(规范化角色物品容器映射(深拷贝(snapshot.回档前状态.角色), { 当前时间: snapshotEnv }));
        设置环境(snapshotEnv);
        设置社交(应用同名NPC过滤(规范化社交列表(深拷贝(snapshot.回档前状态.社交)), 角色?.姓名));
        设置世界(规范化世界状态(深拷贝(snapshot.回档前状态.世界)));
        设置玩家组织(深拷贝(snapshot.回档前状态.玩家组织));
        设置任务列表(深拷贝(snapshot.回档前状态.任务列表));
        设置剧情(规范化剧情状态(深拷贝(snapshot.回档前状态.剧情)));
        设置剧情规划(规范化剧情规划状态(深拷贝(snapshot.回档前状态.剧情规划)));
        设置女主剧情规划(规范化女主剧情规划状态(深拷贝(snapshot.回档前状态.女主剧情规划)));
        应用并同步记忆系统(深拷贝(snapshot.回档前状态.记忆系统));
        设置历史记录(深拷贝(snapshot.回档前历史));
        if (options?.保留图片状态 !== true) {
            应用视觉设置到状态(深拷贝(snapshot.回档前持久态?.视觉设置 || {}));
            应用场景图片档案到状态(深拷贝(snapshot.回档前持久态?.场景图片档案 || {}));
        }
    };

    useEffect(() => {
        if (游戏初始时间) return;
        const 占位开局时间 = '1:01:01:00:00';
        const 规范化可用起始时间 = (value?: string | null): string | null => {
            const canonical = normalizeCanonicalGameTime((value || '').trim());
            if (!canonical || canonical === 占位开局时间) return null;
            return canonical;
        };

        const currentTime = 规范化可用起始时间(环境时间转标准串(环境));
        if (currentTime) {
            设置游戏初始时间(currentTime);
            return;
        }

        const 回忆档案 = Array.isArray(记忆系统?.回忆档案) ? 记忆系统.回忆档案 : [];
        const 开局回忆 = 回忆档案.find((item) => item?.回合 === 1 || item?.名称 === '【回忆001】') || 回忆档案[0];
        const 回忆开局时间 = 规范化可用起始时间(开局回忆?.记录时间)
            || 规范化可用起始时间(开局回忆?.时间戳);
        if (!回忆开局时间) return;
        设置游戏初始时间(回忆开局时间);
    }, [环境, 游戏初始时间, 记忆系统, 设置游戏初始时间]);

    const 获取原始AI消息 = (rawText: string): string => (typeof rawText === 'string' ? rawText : '');
    const 计算回复耗时秒 = (startedAt: number, endedAt: number = Date.now()): number => {
        if (!Number.isFinite(startedAt) || startedAt <= 0) return 0;
        const elapsed = endedAt - startedAt;
        if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
        return Math.max(1, Math.round(elapsed / 1000));
    };
    const 估算消息Token = (
        messages: Array<{ role?: string; content?: string; name?: string }>,
        model?: string
    ): number => countOpenAIChatMessagesTokens(messages, model);
    const 估算AI输出Token = (rawText: string, model?: string): number => (
        countOpenAITextTokens(typeof rawText === 'string' ? rawText : '', model)
    );
    const 提取响应完整正文文本 = (response?: GameResponse): string => {
        const logs = Array.isArray(response?.logs) ? response.logs : [];
        return logs
            .map((item) => `${item?.sender || '旁白'}：${item?.text || ''}`.trim())
            .filter(Boolean)
            .join('\n')
            .trim();
    };
    type 最近正文回合结构 = {
        玩家输入: string;
        游戏时间: string;
        正文: string;
    };
    const 收集最近完整正文回合 = (params: {
        history: 聊天记录结构[];
        currentPlayerInput?: string;
        currentGameTime?: string;
        currentResponse?: GameResponse;
        maxTurns?: number;
    }): 最近正文回合结构[] => {
        const maxTurns = Math.max(1, Number(params.maxTurns) || 3);
        const collected: 最近正文回合结构[] = [];
        const pushTurn = (item: 最近正文回合结构) => {
            if (!item.正文.trim()) return;
            const signature = `${item.游戏时间}__${item.玩家输入}__${item.正文}`;
            if (collected.some((existing) => `${existing.游戏时间}__${existing.玩家输入}__${existing.正文}` === signature)) {
                return;
            }
            collected.push(item);
        };

        const currentBody = 提取响应完整正文文本(params.currentResponse);
        if (currentBody) {
            pushTurn({
                玩家输入: params.currentPlayerInput || '',
                游戏时间: params.currentGameTime || '',
                正文: currentBody
            });
        }

        const history = Array.isArray(params.history) ? params.history : [];
        for (let i = history.length - 1; i >= 0 && collected.length < maxTurns; i -= 1) {
            const item = history[i];
            if (item?.role !== 'assistant' || !item?.structuredResponse) continue;
            const body = 提取响应完整正文文本(item.structuredResponse);
            if (!body) continue;
            let playerInput = '';
            for (let j = i - 1; j >= 0; j -= 1) {
                if (history[j]?.role === 'user') {
                    playerInput = typeof history[j]?.content === 'string' ? history[j].content : '';
                    break;
                }
            }
            pushTurn({
                玩家输入: playerInput,
                游戏时间: item.gameTime || '',
                正文: body
            });
        }

        return collected.slice(0, maxTurns).reverse();
    };
    const 构建最近完整正文上下文 = (rounds: 最近正文回合结构[]): string => (
        (Array.isArray(rounds) ? rounds : [])
            .map((item, index) => [
                `【正文片段${index + 1}】`,
                item.游戏时间 ? `游戏时间：${item.游戏时间}` : '游戏时间：未知',
                item.玩家输入 ? `玩家输入：${item.玩家输入}` : '玩家输入：',
                '完整正文：',
                item.正文
            ].join('\n'))
            .join('\n\n')
            .trim()
    );
    const 去重文本数组 = (items: string[]): string[] => {
        const result: string[] = [];
        (Array.isArray(items) ? items : []).forEach((item) => {
            const text = typeof item === 'string' ? item.trim() : '';
            if (text && !result.includes(text)) result.push(text);
        });
        return result;
    };
    const 收集剧情规划时间触发原因 = (planLike?: 剧情规划结构, envLike?: 环境信息结构): string[] => {
        const currentTime = 环境时间转标准串(envLike);
        if (!currentTime) return [];
        const normalizedPlan = 规范化剧情规划状态(planLike);
        const reasons: string[] = [];
        (Array.isArray(normalizedPlan?.待触发事件) ? normalizedPlan.待触发事件 : []).forEach((item: any) => {
            const name = typeof item?.事件名 === 'string' ? item.事件名.trim() : '未命名事件';
            [item?.计划触发时间, item?.最早触发时间, item?.最晚触发时间].forEach((time) => {
                if (当前时间已达到(currentTime, time)) {
                    reasons.push(`剧情待触发事件「${name}」已到时间点 ${time}`);
                }
            });
        });
        (Array.isArray(normalizedPlan?.当前章任务) ? normalizedPlan.当前章任务 : []).forEach((item: any) => {
            const name = typeof item?.标题 === 'string' ? item.标题.trim() : '未命名任务';
            [item?.计划执行时间, item?.最早执行时间, item?.最晚执行时间].forEach((time) => {
                if (当前时间已达到(currentTime, time)) {
                    reasons.push(`剧情任务「${name}」已到执行时间 ${time}`);
                }
            });
        });
        return 去重文本数组(reasons);
    };
    const 收集女主规划时间触发原因 = (planLike?: 女主剧情规划结构, envLike?: 环境信息结构): string[] => {
        const currentTime = 环境时间转标准串(envLike);
        if (!currentTime) return [];
        const normalizedPlan = 规范化女主剧情规划状态(planLike);
        if (!normalizedPlan) return [];
        const reasons: string[] = [];
        (Array.isArray(normalizedPlan?.女主互动事件) ? normalizedPlan.女主互动事件 : []).forEach((item: any) => {
            const eventId = typeof item?.事件名 === 'string' ? item.事件名.trim() : '未知排期';
            const heroineName = typeof item?.女主姓名 === 'string' ? item.女主姓名.trim() : '未知女主';
            [item?.计划触发时间, item?.最早触发时间, item?.最晚触发时间].forEach((time) => {
                if (当前时间已达到(currentTime, time)) {
                    reasons.push(`女主互动事件「${heroineName}/${eventId}」已到时间点 ${time}`);
                }
            });
        });
        return 去重文本数组(reasons);
    };
    const 收集剧情正文命中原因 = (
        storyLike?: 剧情系统结构,
        planLike?: 剧情规划结构,
        latestBodyText?: string
    ): string[] => {
        const body = typeof latestBodyText === 'string' ? latestBodyText.trim() : '';
        if (!body) return [];
        const normalizedStory = 规范化剧情状态(storyLike);
        const normalizedPlan = 规范化剧情规划状态(planLike);
        const keywords = 去重文本数组([
            normalizedStory?.当前章节?.标题 || '',
            ...(Array.isArray(normalizedPlan?.待触发事件) ? normalizedPlan.待触发事件.map((item: any) => item?.事件名 || '') : []),
            ...(Array.isArray(normalizedPlan?.当前章任务) ? normalizedPlan.当前章任务.map((item: any) => item?.标题 || '') : [])
        ]).filter((item) => item.length >= 2);
        return keywords
            .filter((keyword) => body.includes(keyword))
            .map((keyword) => `最近正文命中剧情线索「${keyword}」`);
    };
    const 收集女主正文命中原因 = (planLike?: 女主剧情规划结构, latestBodyText?: string): string[] => {
        const body = typeof latestBodyText === 'string' ? latestBodyText.trim() : '';
        if (!body) return [];
        const normalizedPlan = 规范化女主剧情规划状态(planLike);
        if (!normalizedPlan) return [];
        const keywords = 去重文本数组([
            ...(Array.isArray(normalizedPlan?.女主条目) ? normalizedPlan.女主条目.map((item: any) => item?.女主姓名 || '') : [])
        ]).filter((item) => item.length >= 2);
        return keywords
            .filter((keyword) => body.includes(keyword))
            .map((keyword) => `最近正文命中女主线索「${keyword}」`);
    };
    const 提取原始报错详情 = (error: any): string => {
        const raw = error?.detail ?? error?.message ?? error ?? '未知错误';
        if (typeof raw === 'string') return raw;
        try {
            return JSON.stringify(raw, null, 2);
        } catch {
            return String(raw);
        }
    };
    const 格式化错误详情 = (error: any): string => {
        if (!error) return '未知错误';
        if (typeof error === 'string') return error;
        const lines: string[] = [];
        if (error?.name) lines.push(`Name: ${error.name}`);
        if (typeof error?.status === 'number') lines.push(`Status: ${error.status}`);
        if (typeof error?.message === 'string' && error.message.trim()) {
            lines.push(`Message: ${error.message}`);
        }
        const detail = error?.detail ?? error?.parseDetail;
        if (detail) {
            const detailText = typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2);
            lines.push('Detail:');
            lines.push(detailText);
        }
        if (lines.length > 0) return lines.join('\n');
        try {
            return JSON.stringify(error, null, 2);
        } catch {
            return String(error);
        }
    };
    const 提取解析失败原始信息 = (error: any): string => {
        if (!error) return '返回内容不符合标签协议';
        if (typeof error === 'string' && error.trim().length > 0) return error.trim();
        if (typeof error?.parseDetail === 'string' && error.parseDetail.trim().length > 0) {
            return error.parseDetail.trim();
        }
        if (typeof error?.message === 'string' && error.message.trim().length > 0) {
            return error.message.trim();
        }
        return '返回内容不符合标签协议';
    };

    const 构建记忆总结用户提示词 = (task: 记忆压缩任务结构): string => {
        const sourceLabel = task.来源层 === '短期' ? '短期记忆' : '中期记忆';
        const targetLabel = task.目标层 === '中期' ? '中期记忆' : '长期记忆';
        const lines = [
            `请将以下${sourceLabel}压缩为${targetLabel}。`,
            `时间范围：${task.起始时间} - ${task.结束时间}`,
            `条目数量：${task.批次条数}`,
            '输入条目如下：',
            ...task.批次.map((item, index) => `[${index + 1}] ${item}`),
            '再次强调：若无重要内容，输出空字符串。'
        ];
        return lines.join('\n');
    };

    const 清理记忆总结输出 = (rawText: string): string => {
        let text = (rawText || '').trim();
        if (!text) return '';
        text = text
            .replace(/^```(?:text|markdown)?\s*/i, '')
            .replace(/```$/i, '')
            .trim();
        if (!text) return '';
        if (/^(?:无|暂无|无重要内容|无需输出|空|空字符串|无重要事件)[。！!？?]*$/i.test(text)) {
            return '';
        }
        return text;
    };

    const handleStartMemorySummary = async (): Promise<void> => {
        if (!待处理记忆总结任务) return;
        const summaryApi = 获取记忆总结接口配置(apiConfig);
        if (!接口配置是否可用(summaryApi)) {
            set记忆总结错误('未配置可用接口，无法执行记忆总结。');
            set记忆总结阶段('review');
            return;
        }
        const task = 待处理记忆总结任务;
        set记忆总结阶段('processing');
        set记忆总结错误('');
        try {
            const 记忆总结非流式输出 = gameConfig?.启用非流式输出 || apiConfig.功能模型占位?.记忆总结非流式输出 === true;
            const raw = await textAIService.generateMemoryRecall(
                task.提示词模板,
                构建记忆总结用户提示词(task),
                summaryApi,
                undefined,
                记忆总结非流式输出 ? undefined : { stream: true }
            );
            set记忆总结草稿(清理记忆总结输出(raw));
            set记忆总结阶段('review');
        } catch (error: any) {
            set记忆总结草稿('');
            set记忆总结错误(提取原始报错详情(error) || '记忆总结失败。');
            set记忆总结阶段('review');
        }
    };

    const handleCancelMemorySummary = () => {
        清空记忆总结流程({ 保留任务: true });
    };

    const handleBackToMemorySummaryRemind = () => {
        if (!待处理记忆总结任务) return;
        set记忆总结阶段('remind');
        set记忆总结错误('');
    };

    const handleUpdateMemorySummaryDraft = (nextDraft: string) => {
        set记忆总结草稿(nextDraft);
    };

    const handleStartManualMemorySummary = (
        来源层: '短期' | '中期',
        起始索引: number,
        结束索引: number
    ) => {
        const task = 构建手动记忆压缩任务(
            规范化记忆系统(记忆系统),
            规范化记忆配置(memoryConfig),
            来源层,
            起始索引,
            结束索引
        );
        if (!task) {
            return;
        }
        set待处理记忆总结任务(task);
        set记忆总结草稿('');
        set记忆总结错误('');
        set记忆总结阶段('remind');
    };

    const handleApplyMemorySummary = () => {
        if (!待处理记忆总结任务) return;
        const nextMemory = 应用记忆压缩结果(
            规范化记忆系统(记忆系统),
            待处理记忆总结任务,
            记忆总结草稿
        );
        set记忆总结阶段('idle');
        set记忆总结草稿('');
        set记忆总结错误('');
        const appliedMemory = 应用并同步记忆系统(nextMemory);
        void performAutoSave({ memory: appliedMemory });
    };

    const handleStartNpcMemorySummary = async (): Promise<void> => {
        const currentTask = 待处理NPC记忆总结队列[0];
        if (!currentTask) return;
        const summaryApi = 获取记忆总结接口配置(apiConfig);
        if (!接口配置是否可用(summaryApi)) {
            setNPC记忆总结错误('未配置可用接口，无法执行 NPC 记忆总结。');
            setNPC记忆总结阶段('review');
            return;
        }
        setNPC记忆总结阶段('processing');
        setNPC记忆总结错误('');
        try {
            const 记忆总结非流式输出 = gameConfig?.启用非流式输出 || apiConfig.功能模型占位?.记忆总结非流式输出 === true;
            const raw = await textAIService.generateMemoryRecall(
                currentTask.提示词模板,
                构建NPC记忆总结用户提示词(currentTask),
                summaryApi,
                undefined,
                记忆总结非流式输出 ? undefined : { stream: true }
            );
            const cleaned = 清理记忆总结输出(raw);
            setNPC记忆总结草稿(cleaned || 构建NPC记忆总结回退文案(
                currentTask.批次.map((item) => {
                    const match = item.match(/^\[\d+\]\s+\[(.*?)\]\s+(.*)$/);
                    return {
                        时间: match?.[1] || '未知时间',
                        内容: match?.[2] || item
                    };
                })
            ));
            setNPC记忆总结阶段('review');
        } catch (error: any) {
            setNPC记忆总结草稿('');
            setNPC记忆总结错误(提取原始报错详情(error) || 'NPC 记忆总结失败。');
            setNPC记忆总结阶段('review');
        }
    };

    const handleCancelNpcMemorySummary = () => {
        清空NPC记忆总结流程({ 保留队列: true });
    };

    const handleBackToNpcMemorySummaryRemind = () => {
        if (!待处理NPC记忆总结队列[0]) return;
        setNPC记忆总结阶段('remind');
        setNPC记忆总结错误('');
    };

    const handleUpdateNpcMemorySummaryDraft = (nextDraft: string) => {
        setNPC记忆总结草稿(nextDraft);
    };

    const handleQueueManualNpcMemorySummary = (npcId: string) => {
        const targetNpc = (Array.isArray(社交) ? 社交 : []).find((npc) => npc?.id === npcId);
        if (!targetNpc) return;
        const manualTask = 构建NPC记忆总结任务(targetNpc, 'manual');
        if (!manualTask) return;
        set待处理NPC记忆总结队列((prev) => {
            const rest = prev.filter((item) => item.id !== manualTask.id);
            return [manualTask, ...rest];
        });
        setNPC记忆总结草稿('');
        setNPC记忆总结错误('');
        setNPC记忆总结阶段('remind');
    };

    const handleApplyNpcMemorySummary = () => {
        const currentTask = 待处理NPC记忆总结队列[0];
        if (!currentTask) return;
        const targetNpc = (Array.isArray(社交) ? 社交 : []).find((npc) => npc?.id === currentTask.npcId);
        if (!targetNpc) {
            刷新NPC记忆总结队列(Array.isArray(社交) ? 社交 : [], { 静默: true });
            清空NPC记忆总结流程({ 保留队列: true });
            return;
        }
        const candidate = currentTask.触发方式 === 'manual'
            ? 构建手动NPC记忆总结候选(targetNpc.记忆, memoryConfig)
            : 构建自动NPC记忆总结候选(targetNpc.记忆, memoryConfig);
        if (!candidate) {
            刷新NPC记忆总结队列(Array.isArray(社交) ? 社交 : [], { 静默: true });
            setNPC记忆总结阶段('idle');
            setNPC记忆总结草稿('');
            setNPC记忆总结错误('');
            return;
        }
        const nextNpc = 应用NPC记忆总结(targetNpc, candidate, NPC记忆总结草稿);
        const nextSocial = (Array.isArray(社交) ? 社交 : []).map((npc) => npc?.id === targetNpc.id ? nextNpc : npc);
        应用并同步社交列表(nextSocial);
        setNPC记忆总结阶段('idle');
        setNPC记忆总结草稿('');
        setNPC记忆总结错误('');
    };

    useEffect(() => {
        if (!待处理记忆总结任务) return;
        if (记忆总结阶段 !== 'remind') return;
        void handleStartMemorySummary();
    }, [待处理记忆总结任务, 记忆总结阶段]);

    useEffect(() => {
        if (!待处理记忆总结任务) return;
        if (记忆总结阶段 !== 'review') return;
        if (记忆总结错误) return;
        handleApplyMemorySummary();
    }, [待处理记忆总结任务, 记忆总结阶段, 记忆总结错误, 记忆总结草稿]);

    useEffect(() => {
        if (待处理记忆总结任务) return;
        if (!待处理NPC记忆总结队列[0]) return;
        if (NPC记忆总结阶段 !== 'remind') return;
        void handleStartNpcMemorySummary();
    }, [待处理记忆总结任务, 待处理NPC记忆总结队列, NPC记忆总结阶段]);

    useEffect(() => {
        if (待处理记忆总结任务) return;
        if (!待处理NPC记忆总结队列[0]) return;
        if (NPC记忆总结阶段 !== 'review') return;
        if (NPC记忆总结错误) return;
        handleApplyNpcMemorySummary();
    }, [待处理记忆总结任务, 待处理NPC记忆总结队列, NPC记忆总结阶段, NPC记忆总结错误, NPC记忆总结草稿]);

    const 构建标签解析选项 = (config: 游戏设置结构) => ({
        validateTagCompleteness: config?.启用标签检测完整性 === true,
        enableTagRepair: config?.启用标签修复 !== false,
        requireActionOptionsTag: config?.启用行动选项 !== false
    });

    const 追加系统消息 = (content: string, options?: { position?: 'tail' | 'after_last_turn' }) => {
        const text = (content || '').trim();
        if (!text) return;
        const position = options?.position || 'tail';
        const now = Date.now();
        const systemMsg: 聊天记录结构 = {
            role: 'system',
            content: text,
            timestamp: now
        };

        设置历史记录((prev) => {
            const history = Array.isArray(prev) ? [...prev] : [];
            if (position !== 'after_last_turn') {
                return [...history, systemMsg];
            }

            // 插入到“最近一个已完成回合（assistant structuredResponse）”的下方，避免落在玩家输入下方。
            let lastTurnIndex = -1;
            for (let i = history.length - 1; i >= 0; i -= 1) {
                const item = history[i];
                if (item?.role === 'assistant' && item?.structuredResponse) {
                    lastTurnIndex = i;
                    break;
                }
            }
            if (lastTurnIndex < 0) {
                return [...history, systemMsg];
            }

            // 放在该回合之后、下一条 user 消息之前。
            let insertAt = lastTurnIndex + 1;
            while (insertAt < history.length && history[insertAt]?.role !== 'user') {
                insertAt += 1;
            }
            history.splice(insertAt, 0, systemMsg);
            return history;
        });
    };

    const 获取场景图历史上限 = (): number => (
        规范化图片管理设置(imageManagerConfigRef.current || imageManagerConfig || 默认图片管理设置).场景图历史上限
    );

    const {
        加载场景图片档案,
        写入场景图片档案,
        应用场景图片为壁纸,
        清除场景壁纸,
        设置常驻壁纸,
        清除常驻壁纸,
        应用常驻壁纸为背景,
        删除场景图片记录,
        清空场景图片历史,
        保存场景图片本地副本
    } = 创建场景图片档案工作流({
        获取场景图历史上限,
        读取场景图片档案设置: () => dbService.读取设置(设置键.场景图片档案),
        保存场景图片档案设置: (archive) => dbService.保存设置(设置键.场景图片档案, archive),
        同步场景图片档案: (archive) => {
            场景图片档案Ref.current = archive;
            set场景图片档案(archive);
        },
        获取当前场景图片档案: () => 场景图片档案Ref.current || {},
        清理未引用图片资源: dbService.清理未引用图片资源,
        获取当前视觉设置: () => visualConfigRef.current || visualConfig,
        应用视觉设置到状态,
        深拷贝,
        加载图片AI服务
    });

    const {
        loadBuiltinPromptEntries,
        loadWorldbooks,
        loadWorldbookPresetGroups,
        saveSettings,
        saveBuiltinPromptEntries,
        saveWorldbooks,
        saveWorldbookPresetGroups,
        saveVisualSettings,
        saveImageManagerSettings,
        updateApiConfig,
        saveGameSettings,
        saveMemorySettings,
        updatePrompts
    } = 创建设置持久化工作流({
        获取接口配置: () => apiConfigRef.current,
        同步接口配置: (config) => {
            apiConfigRef.current = config;
            setApiConfig(config);
            const feature = (config as any)?.功能模型占位;
            const registryUrl = feature?.图片后端注册表地址;
            const registryConnectToken = feature?.图片后端自动连接口令;
            if (registryUrl || registryConnectToken) {
                刷新已发现ComfyUI后端缓存(registryUrl, registryConnectToken).then((backends) => {
                    if (!backends?.length) return;
                    const normalizeUrl = (value: unknown) => String(value || '').trim().replace(/\/+$/, '');
                    const bestUrl = normalizeUrl(backends[0]?.url);
                    if (!bestUrl) return;
                    const cur = apiConfigRef.current as any;
                    const f = cur?.功能模型占位;
                    if (!f) return;
                    const isCnbUrl = (value: string) => /\.cnb\.run(?:[/:]|$)/i.test(value);
                    let nextFeature = f;
                    const syncComfyDiscoveredUrl = (
                        enabled: boolean,
                        backendType: unknown,
                        idKey: string,
                        urlKey: string
                    ) => {
                        if (!enabled || backendType !== 'comfyui') return;
                        const currentUrl = normalizeUrl(nextFeature?.[urlKey]);
                        const selectedId = String(nextFeature?.[idKey] || '').trim();
                        const matched = selectedId ? backends.find((item) => item.id === selectedId) : null;
                        const nextUrl = normalizeUrl(matched?.url || (!currentUrl || isCnbUrl(currentUrl) ? bestUrl : ''));
                        if (!nextUrl || nextUrl === currentUrl) return;
                        nextFeature = {
                            ...nextFeature,
                            [urlKey]: nextUrl,
                            ...(matched?.id ? { [idKey]: matched.id } : {})
                        };
                    };

                    syncComfyDiscoveredUrl(true, f.文生图后端类型, '当前图片后端发现ID', '文生图模型API地址');
                    syncComfyDiscoveredUrl(Boolean(f.场景生图独立接口启用), f.场景生图后端类型, '当前场景图片后端发现ID', '场景生图模型API地址');
                    syncComfyDiscoveredUrl(Boolean(f.NSFW生图独立接口启用), f.NSFW生图后端类型, '当前NSFW图片后端发现ID', 'NSFW生图模型API地址');

                    if (nextFeature !== f) {
                        const next = { ...cur, 功能模型占位: nextFeature };
                        apiConfigRef.current = next;
                        setApiConfig(next);
                        dbService.保存设置(设置键.API配置, next).catch(() => {});
                    }
                }).catch(() => {});
            }
        },
        设置内置提示词列表: set内置提示词列表,
        设置世界书列表: set世界书列表,
        设置世界书预设组列表: set世界书预设组列表,
        应用视觉设置到状态,
        应用图片管理设置到状态,
        获取当前场景图片档案: () => 场景图片档案Ref.current || {},
        同步场景图片档案: (archive) => {
            场景图片档案Ref.current = archive;
            set场景图片档案(archive);
        },
        获取场景图历史上限,
        设置游戏设置: setGameConfig,
        设置记忆配置: setMemoryConfig,
        设置提示词池: setPrompts
    });

    useEffect(() => {
        void 加载场景图片档案();
    }, []);

    useEffect(() => {
        void loadBuiltinPromptEntries();
    }, []);

    useEffect(() => {
        void loadWorldbooks();
    }, []);

    useEffect(() => {
        void loadWorldbookPresetGroups();
    }, []);

    const 场景模式已开启 = (): boolean => {
        const feature = apiConfig?.功能模型占位 as any;
        return Boolean(
            feature?.文生图功能启用
            && feature?.场景生图启用
        );
    };

    const 创建场景生图任务 = (params: {
        source: 生图任务来源类型;
        modelName: string;
        画风?: 当前可用接口结构['画风'];
        画师串?: string;
        来源回合?: number;
        摘要?: string;
    }): 场景生图任务记录 => ({
        id: `scene_image_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        目标类型: 'scene',
        来源: params.source,
        状态: 'queued',
        创建时间: Date.now(),
        使用模型: params.modelName,
        构图: '场景',
        画风: params.画风,
        画师串: params.画师串,
        进度阶段: 'queued',
        进度文本: '任务已入队，等待生成场景壁纸。',
        来源回合: params.来源回合,
        摘要: params.摘要,
        已应用为壁纸: false
    });

    const 追加场景生图任务 = (task: 场景生图任务记录) => {
        set场景生图任务队列(prev => [task, ...(Array.isArray(prev) ? prev : [])].slice(0, 100));
    };

    const 更新场景生图任务 = (taskId: string, updater: (task: 场景生图任务记录) => 场景生图任务记录) => {
        set场景生图任务队列(prev => (Array.isArray(prev) ? prev : []).map((task) => (
            task.id === taskId ? updater(task) : task
        )));
    };

    const 删除场景生图任务 = (taskId: string) => {
        if (!taskId) return;
        set场景生图任务队列(prev => (Array.isArray(prev) ? prev : []).filter((task) => task?.id !== taskId));
    };

    const 清空场景生图任务队列 = (mode: 'all' | 'completed' = 'all') => {
        set场景生图任务队列(prev => {
            const baseList = Array.isArray(prev) ? prev : [];
            if (mode === 'all') return [];
            return baseList.filter((task) => task?.状态 === 'queued' || task?.状态 === 'running');
        });
    };

    const 清空物品图片历史 = () => {
        设置角色(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            if (Array.isArray(next.物品列表)) {
                next.物品列表 = next.物品列表.map((item: any) => {
                    if (!item?.图片档案) return item;
                    return { ...item, 图片档案: { ...item.图片档案, 生图历史: [] } };
                });
            }
            return next;
        });
    };

    const 获取NPC唯一标识 = (npc: any, index?: number): string => {
        const id = typeof npc?.id === 'string' ? npc.id.trim() : '';
        if (id) return `id:${id}`;
        const name = typeof npc?.姓名 === 'string' ? npc.姓名.trim() : '';
        if (name) return `name:${name}`;
        return `index:${index ?? -1}`;
    };

    const {
        更新NPC最近生图结果,
        写入NPC图片历史记录,
        更新NPC香闺秘档部位结果,
        写入NPC香闺秘档部位记录,
        创建NPC生图任务,
        追加NPC生图任务,
        更新NPC生图任务,
        删除NPC生图任务,
        清空NPC生图任务队列,
        删除NPC图片记录,
        清空NPC图片历史,
        选择NPC头像图片,
        清除NPC头像图片,
        选择NPC立绘图片,
        清除NPC立绘图片,
        选择NPC背景图片,
        清除NPC背景图片,
        保存NPC图片本地副本
    } = 创建NPC图片状态工作流({
        设置社交,
        规范化社交列表: 规范化社交列表安全,
        执行社交自动存档: (socialSnapshot) => {
            void performAutoSave({ social: socialSnapshot, history: 历史记录 });
        },
        获取社交列表: () => 社交Ref.current,
        获取NPC唯一标识,
        设置NPC生图任务队列: setNPC生图任务队列,
        加载图片AI服务
    });

    const 读取文生图功能配置 = () => {
        const feature = apiConfig?.功能模型占位 as any;
        const 场景横竖屏 = feature?.自动场景生图横竖屏 === '竖屏' ? '竖屏' : '横屏';
        const 场景尺寸 = typeof feature?.自动场景生图分辨率 === 'string' && feature.自动场景生图分辨率.trim()
            ? feature.自动场景生图分辨率.trim()
            : (场景横竖屏 === '竖屏' ? '576x1024' : '1024x576');
        const 自动任务已开启 = Boolean(
            feature?.NPC生图启用
            || feature?.物品自动生图启用
            || feature?.自动场景生图启用
        );
        return {
            总开关: Boolean(feature?.文生图功能启用 || 自动任务已开启),
            NPC开关: Boolean(feature?.NPC生图启用),
            使用词组转化器: feature?.NPC生图使用词组转化器 !== false,
            性别筛选: feature?.NPC生图性别筛选 === '男' || feature?.NPC生图性别筛选 === '女' || feature?.NPC生图性别筛选 === '全部'
                ? feature.NPC生图性别筛选
                : '全部',
            重要性筛选: feature?.NPC生图重要性筛选 === '仅重要' || feature?.NPC生图重要性筛选 === '全部'
                ? feature.NPC生图重要性筛选
                : '全部',
            NPC画风: feature?.自动NPC生图画风 === '二次元' || feature?.自动NPC生图画风 === '写实' || feature?.自动NPC生图画风 === '国风'
                ? feature.自动NPC生图画风
                : '通用',
            场景画风: feature?.自动场景生图画风 === '二次元' || feature?.自动场景生图画风 === '写实' || feature?.自动场景生图画风 === '国风'
                ? feature.自动场景生图画风
                : '通用',
            场景构图要求: feature?.自动场景生图构图要求 === '故事快照' || feature?.自动场景生图构图要求 === '剧照'
                ? feature.自动场景生图构图要求
                : '纯场景',
            场景横竖屏,
            场景尺寸
        } as const;
    };

    const NPC符合自动生图条件 = (npc: any): boolean => {
        const config = 读取文生图功能配置();
        if (!config.总开关 || !config.NPC开关) return false;
        if (npc?.是否玩家本人 === true || npc?.来源 === '玩家组织.重要成员.玩家本人') return false;
        if (npc?.自动生图禁用 === true) return false;
        if (config.性别筛选 !== '全部') {
            const gender = typeof npc?.性别 === 'string' ? npc.性别.trim() : '';
            if (gender !== config.性别筛选) return false;
        }
        if (config.重要性筛选 === '仅重要' && npc?.是否主要角色 !== true) {
            return false;
        }
        return true;
    };

    const 提取新增NPC列表 = (beforeList: any[], afterList: any[]): any[] => {
        const beforeIdentitySet = new Set(
            (Array.isArray(beforeList) ? beforeList : []).map((npc) => {
                const id = typeof npc?.id === 'string' ? npc.id.trim() : '';
                const name = typeof npc?.姓名 === 'string' ? npc.姓名.trim() : '';
                return `${id}::${name}`;
            })
        );
        return (Array.isArray(afterList) ? afterList : []).filter((npc, index) => {
            const id = typeof npc?.id === 'string' ? npc.id.trim() : '';
            const name = typeof npc?.姓名 === 'string' ? npc.姓名.trim() : '';
            const identity = `${id}::${name}`;
            if (id || name) {
                return !beforeIdentitySet.has(identity);
            }
            return !Array.isArray(beforeList) || index >= beforeList.length;
        });
    };

    // ponytail: one completion scanner keeps the three background image toasts from drifting.
    const 刷新后台生图完成提示 = <
        TMonitor,
        TTask extends { id: string; 状态?: string; 错误信息?: string }
    >(
        monitorsRef: { current: TMonitor[] },
        notifiedRef: { current: Set<string> },
        tasks: TTask[],
        findTask: (monitor: TMonitor, tasks: TTask[]) => TTask | undefined,
        buildToast: (monitor: TMonitor, task: TTask) => Omit<右下角提示结构, 'id'>
    ) => {
        if (!monitorsRef.current.length) return;
        monitorsRef.current = monitorsRef.current.filter((monitor) => {
            const matchedTask = findTask(monitor, tasks);
            if (!matchedTask || (matchedTask.状态 !== 'success' && matchedTask.状态 !== 'failed')) {
                return true;
            }
            if (notifiedRef.current.has(matchedTask.id)) {
                return false;
            }
            notifiedRef.current.add(matchedTask.id);
            推送右下角提示(buildToast(monitor, matchedTask));
            return false;
        });
    };
    const 应用导演配置 = (value: Partial<导演配置结构> | null | undefined) => {
        const normalized = 规范化导演配置(value, { openingConfig: 开局配置 });
        设置导演配置(normalized);
        void performAutoSave({ directorConfig: normalized, force: true });
    };

    useEffect(() => {
        刷新后台生图完成提示(
            后台手动生图监控Ref,
            已提示后台生图任务Ref,
            NPC生图任务队列,
            (monitor, tasks) => tasks.find((task) => (
                (task?.NPC标识 === monitor.npcId || task?.NPC标识 === `id:${monitor.npcId}`)
                && (task?.来源 === 'manual' || task?.来源 === 'retry')
                && (task?.创建时间 || 0) >= monitor.since
            )),
            (monitor, task) => ({
                title: task.状态 === 'success' ? '手动生图完成' : '手动生图失败',
                message: task.状态 === 'success'
                    ? `${monitor.npcName}的${monitor.构图}已生成完成。`
                    : `${monitor.npcName}的${monitor.构图}生成失败：${task.错误信息 || '未知错误'}`,
                tone: task.状态 === 'success' ? 'success' : 'error',
                previewUrl: task.状态 === 'success' ? 获取图片展示地址(task) : undefined
            })
        );
    }, [NPC生图任务队列]);

    useEffect(() => {
        刷新后台生图完成提示(
            后台私密生图监控Ref,
            已提示后台私密生图任务Ref,
            NPC生图任务队列,
            (monitor, tasks) => tasks.find((task) => (
                (task?.NPC标识 === monitor.npcId || task?.NPC标识 === `id:${monitor.npcId}`)
                && task?.来源 === 'manual'
                && task?.构图 === '部位特写'
                && task?.部位 === monitor.部位
                && (task?.创建时间 || 0) >= monitor.since
            )),
            (monitor, task) => ({
                title: task.状态 === 'success' ? '私密特写完成' : '私密特写失败',
                message: task.状态 === 'success'
                    ? `${monitor.npcName}的${monitor.部位}特写已生成完成。`
                    : `${monitor.npcName}的${monitor.部位}特写生成失败：${task.错误信息 || '未知错误'}`,
                tone: task.状态 === 'success' ? 'success' : 'error',
                previewUrl: task.状态 === 'success' ? 获取图片展示地址(task) : undefined
            })
        );
    }, [NPC生图任务队列]);

    useEffect(() => {
        刷新后台生图完成提示(
            后台场景生图监控Ref,
            已提示后台场景生图任务Ref,
            场景生图任务队列,
            (monitor, tasks) => tasks.find((task) => (
                task?.来源 === 'manual'
                && (task?.创建时间 || 0) >= monitor.since
            )),
            (monitor, task) => ({
                title: task.状态 === 'success' ? '场景生图完成' : '场景生图失败',
                message: task.状态 === 'success'
                    ? `${monitor.摘要 || '当前正文场景'}已生成完成。`
                    : `${monitor.摘要 || '当前正文场景'}生成失败：${task.错误信息 || '未知错误'}`,
                tone: task.状态 === 'success' ? 'success' : 'error',
                previewUrl: task.状态 === 'success' ? 获取图片展示地址(task) : undefined
            })
        );
    }, [场景生图任务队列]);

    const 构建文生图额外要求 = (extra?: string): string => {
        const runtimeGameConfig = 规范化游戏设置(gameConfig);
        const runtimeImageExtraPrompt = 构建文生图运行时额外提示词(runtimeGameConfig.额外提示词 || '', runtimeGameConfig);
        const topicImageGuidance = 构建题材生图额外要求(开局配置?.题材模式, 开局配置?.modeRuntimeProfile);
        return [(extra || '').trim(), runtimeImageExtraPrompt, topicImageGuidance].filter(Boolean).join('\n\n').trim();
    };
    const {
        触发场景自动生图,
        生成场景壁纸
    } = 创建场景生图触发工作流({
        获取环境: () => 环境,
        获取角色: () => 角色,
        获取社交列表: () => 社交Ref.current,
        获取历史记录: () => 历史记录,
        获取接口配置: () => apiConfig,
        规范化环境信息,
        深拷贝,
        环境时间转标准串,
        构建完整地点文本,
        成长体系已启用: () => false,
        提取NPC生图基础数据,
        读取文生图功能配置,
        场景模式已开启,
        构建文生图额外要求,
        加载场景生图工作流,
        获取场景文生图接口配置,
        获取生图词组转化器接口配置,
        获取生图画师串预设,
        获取当前PNG画风预设: (presetId?: string) => 获取当前PNG画风预设摘要(presetId, 'scene'),
        获取场景角色锚点: (...args) => 提取场景角色锚点(...args),
        获取词组转化器预设提示词,
        接口配置是否可用,
        创建场景生图任务,
        生成场景生图记录ID,
        追加场景生图任务,
        更新场景生图任务,
        更新场景图片档案: 写入场景图片档案,
        应用场景图片为壁纸,
        获取当前自动应用任务ID: () => 场景生图自动应用任务Ref.current,
        设置当前自动应用任务ID: (requestId) => {
            场景生图自动应用任务Ref.current = requestId;
        },
        获取当前生图存档作用域: () => 生图存档作用域Ref.current,
        生图存档作用域仍然有效: (scope) => Boolean(scope) && scope === 生图存档作用域Ref.current,
        获取生图AbortSignal: () => 生图存档AbortControllerRef.current.signal,
        记录后台场景监控: (item) => {
            后台场景生图监控Ref.current.push(item);
        },
        推送右下角提示
    });

    const 序列化变量校准命令 = (cmd: any): string => {
        const action = typeof cmd?.action === 'string' ? cmd.action : 'set';
        const key = typeof cmd?.key === 'string' ? cmd.key : '';
        if (action === 'delete') return `delete ${key}`;
        try {
            return `${action} ${key} = ${JSON.stringify(cmd?.value ?? null)}`;
        } catch {
            return `${action} ${key} = ${String(cmd?.value ?? null)}`;
        }
    };

    const 提取响应正文文本 = (response: any): string => {
        const logs = Array.isArray(response?.logs) ? response.logs : [];
        const lines = logs
            .map((log: any) => {
                const sender = typeof log?.sender === 'string' ? log.sender.trim() : '旁白';
                const text = typeof log?.text === 'string' ? log.text.trim() : '';
                return text ? `【${sender}】${text}` : '';
            })
            .filter(Boolean);
        return lines.join('\n');
    };

    const 清空变量生成上下文缓存 = () => {
        最近变量生成上下文Ref.current = [];
    };

    const 记录变量生成上下文 = (params: { playerInput: string; response: any }) => {
        const response = params.response;
        if (!response || typeof response !== 'object') return;
        const 正文 = 提取响应正文文本(response);
        const 本回合命令 = Array.isArray(response?.tavern_commands)
            ? response.tavern_commands.map(序列化变量校准命令).filter(Boolean)
            : [];
        const 校准说明 = Array.isArray(response?.variable_calibration_report)
            ? response.variable_calibration_report.map((entry: any) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)
            : [];
        const 校准补充命令 = Array.isArray(response?.variable_calibration_commands)
            ? response.variable_calibration_commands.map(序列化变量校准命令).filter(Boolean)
            : [];
        const 校准命令 = [...校准补充命令].filter(Boolean);
        if (!(params.playerInput || '').trim() && !正文 && 本回合命令.length <= 0 && 校准说明.length <= 0 && 校准命令.length <= 0) {
            return;
        }
        const entry: 变量生成上下文缓存项 = {
            回合: 最近变量生成上下文Ref.current.length + 1,
            玩家输入: (params.playerInput || '').trim(),
            正文,
            本回合命令,
            校准说明,
            校准命令
        };
        最近变量生成上下文Ref.current = [...最近变量生成上下文Ref.current, entry].slice(-2);
    };

    const 收集最近变量生成上下文 = (history: any[], limit = 2) => {
        const safeLimit = Math.max(0, Math.min(3, limit));
        if (最近变量生成上下文Ref.current.length > 0) {
            return 最近变量生成上下文Ref.current.slice(-safeLimit).map((item) => 深拷贝(item));
        }
        if (safeLimit <= 0 || !Array.isArray(history)) return [];
        let assistantTurn = 0;
        let latestUserInput = '';
        const records: Array<{
            回合: number;
            玩家输入: string;
            正文: string;
            本回合命令: string[];
            校准说明: string[];
            校准命令: string[];
        }> = [];
        history.forEach((item) => {
            if (item?.role === 'user') {
                latestUserInput = typeof item?.content === 'string' ? item.content.trim() : '';
                return;
            }
            if (item?.role !== 'assistant' || !item?.structuredResponse) return;
            assistantTurn += 1;
            const response = item.structuredResponse;
            const 校准说明 = Array.isArray(response?.variable_calibration_report)
                ? response.variable_calibration_report.map((entry: any) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)
                : [];
            const 校准补充命令 = Array.isArray(response?.variable_calibration_commands)
                ? response.variable_calibration_commands.map(序列化变量校准命令).filter(Boolean)
                : [];
            const 校准命令 = [...校准补充命令].filter(Boolean);
            const 本回合命令 = Array.isArray(response?.tavern_commands)
                ? response.tavern_commands.map(序列化变量校准命令).filter(Boolean)
                : [];
            const 正文 = 提取响应正文文本(response);
            if (!latestUserInput && !正文 && 本回合命令.length <= 0 && 校准说明.length <= 0 && 校准命令.length <= 0) return;
            records.push({
                回合: assistantTurn,
                玩家输入: latestUserInput,
                正文,
                本回合命令,
                校准说明,
                校准命令
            });
        });
        return records.slice(-safeLimit);
    };

    const 自动角色锚点已启用 = (): boolean => (
        规范化接口设置(apiConfigRef.current).功能模型占位.自动角色锚点启用 !== false
    );

    const 确保NPC生图前角色锚点 = async (npc: any) => {
        if (!自动角色锚点已启用()) return;
        const npcId = typeof npc?.id === 'string' ? npc.id.trim() : '';
        if (!npcId || 按NPC读取角色锚点(npcId) || 角色锚点补全进行中Ref.current.has(npcId)) return;
        角色锚点补全进行中Ref.current.add(npcId);
        try {
            const 锚点等待上限 = 20_000;
            await Promise.race([
                提取角色锚点(npcId, { 名称: typeof npc?.姓名 === 'string' ? npc.姓名.trim() : '' }),
                new Promise((_, reject) => {
                    window.setTimeout(() => reject(new Error('角色锚点提取超时，已跳过前置锚点继续生图。')), 锚点等待上限);
                })
            ]);
        } catch (error) {
            console.warn('生图前置角色锚点提取失败，继续使用基础资料生图', npcId, error);
        } finally {
            角色锚点补全进行中Ref.current.delete(npcId);
        }
    };

    const 执行单个NPC生图 = async (npc: any, options?: { force?: boolean; source?: 生图任务来源类型; 构图?: '头像' | '半身' | '立绘'; 画风?: 当前可用接口结构['画风']; 画师串?: string; 画师串预设ID?: string; PNG画风预设ID?: string; 额外要求?: string; 尺寸?: string }) => {
        await 确保NPC生图前角色锚点(npc);
        const { 执行NPC生图工作流 } = await 加载NPC生图工作流();
        return 执行NPC生图工作流(npc, {
            ...options,
            signal: 生图存档AbortControllerRef.current.signal,
            额外要求: 构建文生图额外要求(options?.额外要求)
        }, {
            apiConfig,
            获取NPC唯一标识,
            获取社交列表: () => 社交Ref.current,
            获取文生图接口配置,
            获取生图词组转化器接口配置,
            获取生图画师串预设,
            获取当前PNG画风预设: (presetId?: string) => 获取当前PNG画风预设摘要(presetId, 'npc'),
            获取NPC角色锚点: (npcId: string) => {
                const anchor = 按NPC读取角色锚点(npcId);
                // “生成时默认附加”关闭时：NPC 单图（含自动/手动）不应自动注入锚点。
                if (!anchor || anchor.生成时默认附加 !== true) return null;
                return anchor;
            },
            获取词组转化器预设提示词,
            接口配置是否可用,
            读取文生图功能配置,
            NPC符合自动生图条件,
            NPC生图进行中集合: NPC生图进行中Ref.current,
            提取NPC生图基础数据: 提取NPC生图基础数据附带私密描述,
            创建NPC生图任务,
            生成NPC生图记录ID,
            追加NPC生图任务,
            更新NPC生图任务,
            更新NPC最近生图结果
        });
    };

    const 执行NPC香闺秘档部位生图 = async (
        npc: any,
        part: 香闺秘档部位类型,
        options?: { source?: 生图任务来源类型; 画风?: 当前可用接口结构['画风']; 画师串?: string; 画师串预设ID?: string; PNG画风预设ID?: string; 额外要求?: string; 尺寸?: string }
    ) => {
        if ((part === '肉棒' || (part === '屁穴' && NPC是否男性或男娘(npc))) && !男娘NSFW内容已启用()) {
            throw new Error('男娘 / 扶她相关 NSFW 内容未启用，已阻止男性/男娘/扶她私密特写生成。');
        }
        await 确保NPC生图前角色锚点(npc);
        const { 执行NPC香闺秘档部位生图工作流 } = await 加载NPC香闺秘档生图工作流();
        return 执行NPC香闺秘档部位生图工作流(npc, part, {
            ...options,
            signal: 生图存档AbortControllerRef.current.signal,
            额外要求: 构建文生图额外要求(options?.额外要求)
        }, {
            apiConfig,
            获取NPC唯一标识,
            获取文生图接口配置: 获取NSFW文生图接口配置,
            获取生图词组转化器接口配置,
            获取生图画师串预设,
            获取当前PNG画风预设: (presetId?: string) => 获取当前PNG画风预设摘要(presetId, 'npc'),
            获取NPC角色锚点: 按NPC读取角色锚点,
            获取词组转化器预设提示词,
            接口配置是否可用,
            读取文生图功能配置,
            NPC私密部位生图进行中集合: NPC香闺秘档生图进行中Ref.current,
            提取NPC香闺秘档部位生图数据,
            创建NPC生图任务,
            生成NPC生图记录ID,
            追加NPC生图任务,
            更新NPC生图任务,
            写入NPC图片历史记录,
            更新NPC香闺秘档部位结果,
            写入NPC香闺秘档部位记录
        });
    };

    const 读取NPC图片记录列表 = (npc: any): any[] => {
        if (!npc || typeof npc !== 'object') return [];
        const archive = npc?.图片档案;
        const history = Array.isArray(archive?.生图历史) ? archive.生图历史.filter((item: any) => item && typeof item === 'object') : [];
        const recent = archive?.最近生图结果 && typeof archive.最近生图结果 === 'object'
            ? archive.最近生图结果
            : (npc?.最近生图结果 && typeof npc.最近生图结果 === 'object' ? npc.最近生图结果 : undefined);
        const merged = recent ? [recent, ...history] : history;
        return merged.filter((item: any, index: number, list: any[]) => {
            const itemId = typeof item?.id === 'string' ? item.id.trim() : '';
            return !itemId || list.findIndex((candidate: any) => candidate?.id === itemId) === index;
        });
    };

    const NPC是否已有成功构图 = (npc: any, 构图列表: Array<'头像' | '半身' | '立绘'>): boolean => {
        const allowed = new Set(构图列表);
        const hasSuccessfulHistory = 读取NPC图片记录列表(npc).some((item: any) => (
            item?.状态 === 'success'
            && typeof item?.构图 === 'string'
            && allowed.has(item.构图)
            && 图片资源记录含可恢复地址(item)
        ));
        if (hasSuccessfulHistory) return true;

        if (allowed.has('头像')) {
            const avatarUrl = typeof npc?.头像图片URL === 'string' ? npc.头像图片URL.trim() : '';
            if (avatarUrl) {
                return true;
            }
        }

        return false;
    };

    const 读取NPC最近成功构图记录 = (npc: any, 构图: '头像' | '半身' | '立绘'): any | null => {
        const records = 读取NPC图片记录列表(npc);
        return records.find((item: any) => (
            item?.状态 === 'success'
            && item?.构图 === 构图
            && 图片资源记录含可恢复地址(item)
        )) || null;
    };

    const 读取NPC需性别补正构图列表 = (npc: any): Array<'头像' | '半身' | '立绘'> => {
        const currentGender = 读取NPC文本字段(npc, '性别');
        if (!NPC生图性别是否显式(currentGender)) return [];
        return (['头像', '半身', '立绘'] as const).filter((构图) => {
            const record = 读取NPC最近成功构图记录(npc, 构图);
            if (!record) return false;
            const previousGender = typeof record?.NPC性别 === 'string' ? record.NPC性别.trim() : '';
            return !NPC生图性别是否显式(previousGender) || previousGender !== currentGender;
        });
    };

    const NPC性别已明确可补正构图 = (npc: any): boolean => {
        if (!npc || typeof npc !== 'object') return false;
        if (!NPC符合自动生图条件(npc)) return false;
        const gender = 读取NPC文本字段(npc, '性别');
        if (!NPC生图性别是否显式(gender)) return false;
        return 读取NPC需性别补正构图列表(npc).length > 0;
    };

    const NPC自动生图调试已启用 = (): boolean => {
        try {
            return typeof window !== 'undefined' && window.localStorage?.getItem('DEBUG_NPC_AUTO_IMAGE') === '1';
        } catch {
            return false;
        }
    };

    const 输出NPC自动生图调试 = (message: string, payload?: any) => {
        if (!NPC自动生图调试已启用()) return;
        console.info(`[NPC_AUTO_IMAGE] ${message}`, payload ?? '');
    };

    const 读取NPC文本字段 = (npc: any, key: string): string => (
        typeof npc?.[key] === 'string' ? npc[key].trim() : ''
    );

    const NPC是否男性或男娘 = (npc: any): boolean => {
        const gender = 读取NPC文本字段(npc, '性别');
        return gender === '男'
            || gender === '男性'
            || gender.includes('男娘')
            || gender.includes('扶她')
            || Boolean(读取NPC文本字段(npc, '男娘设定'))
            || Boolean(读取NPC文本字段(npc, '扶她设定'));
    };

    const NPC是否扶她 = (npc: any): boolean => {
        const gender = 读取NPC文本字段(npc, '性别');
        return gender.includes('扶她') || Boolean(读取NPC文本字段(npc, '扶她设定'));
    };

    const NPC是否女性 = (npc: any): boolean => (
        读取NPC文本字段(npc, '性别') === '女'
    );

    const 男娘NSFW内容已启用 = (): boolean => (
        gameConfig?.启用NSFW模式 === true
        && gameConfig?.启用男娘NSFW内容 !== false
    );

    const 构建NPC自动构图签名列表 = (npc: any, 构图: '头像' | '半身' | '立绘'): string[] => {
        const id = 读取NPC文本字段(npc, 'id');
        const name = 读取NPC文本字段(npc, '姓名');
        const gender = 读取NPC文本字段(npc, '性别');
        return [
            id ? `id:${id}::${构图}` : '',
            name ? `name:${gender}:${name}::${构图}` : ''
        ].filter(Boolean);
    };

    const 标记NPC自动构图签名 = (npc: any, 构图: '头像' | '半身' | '立绘'): string[] | null => {
        const signatures = 构建NPC自动构图签名列表(npc, 构图);
        if (signatures.length <= 0) return null;
        if (signatures.some((signature) => NPC自动生图签名Ref.current.has(signature))) return null;
        signatures.forEach((signature) => NPC自动生图签名Ref.current.add(signature));
        return signatures;
    };

    const 清除NPC自动构图签名 = (signatures: string[] | null) => {
        (signatures || []).forEach((signature) => NPC自动生图签名Ref.current.delete(signature));
    };

    const 执行NPC自动构图任务 = async (
        npc: any,
        构图: '头像' | '半身' | '立绘',
        options?: { force?: boolean }
    ): Promise<boolean> => {
        const npcKey = 获取NPC唯一标识(npc);
        const npcName = 读取NPC文本字段(npc, '姓名') || 读取NPC文本字段(npc, '名称') || npcKey;
        if (!npcKey) {
            输出NPC自动生图调试('跳过：缺少 NPC 标识', { npcName, 构图 });
            return false;
        }
        if (NPC生图进行中Ref.current.has(npcKey)) {
            输出NPC自动生图调试('跳过：NPC 生图进行中', { npcKey, npcName, 构图 });
            return false;
        }
        if (!NPC符合自动生图条件(npc)) {
            输出NPC自动生图调试('跳过：不符合自动生图条件', { npcKey, npcName, 构图 });
            return false;
        }
        if (!options?.force && NPC是否已有成功构图(npc, [构图])) {
            输出NPC自动生图调试('跳过：已有成功构图', { npcKey, npcName, 构图 });
            return false;
        }

        const signatures = 标记NPC自动构图签名(npc, 构图);
        if (!signatures) {
            输出NPC自动生图调试('跳过：自动构图签名已存在', { npcKey, npcName, 构图 });
            return false;
        }
        try {
            输出NPC自动生图调试('开始执行自动构图任务', { npcKey, npcName, 构图 });
            await 执行单个NPC生图(npc, {
                source: 'auto',
                构图
            });
            输出NPC自动生图调试('自动构图任务结束', { npcKey, npcName, 构图 });
            return true;
        } catch (error) {
            输出NPC自动生图调试('自动构图任务异常', { npcKey, npcName, 构图, error });
            throw error;
        } finally {
            清除NPC自动构图签名(signatures);
        }
    };

    const 女性香闺秘档自动部位列表: 香闺秘档部位类型[] = ['胸部', '小穴', '屁穴'];
    const 男性香闺秘档自动部位列表: 香闺秘档部位类型[] = ['肉棒', '屁穴'];
    const 扶她香闺秘档自动部位列表: 香闺秘档部位类型[] = ['胸部', '小穴', '屁穴', '肉棒'];

    const NPC是否成人女性主要角色 = (npc: any): boolean => (
        npc?.是否主要角色 === true
        && NPC是否女性(npc)
    );

    const NPC是否成人男性主要角色 = (npc: any): boolean => (
        男娘NSFW内容已启用()
        && npc?.是否主要角色 === true
        && NPC是否男性或男娘(npc)
    );

    const NPC是否已有成功香闺秘档部位 = (npc: any, part: 香闺秘档部位类型): boolean => {
        const result = npc?.图片档案?.香闺秘档部位档案?.[part];
        return result?.状态 === 'success' && 图片资源记录含可恢复地址(result);
    };

    const 读取NPC香闺秘档缺失部位 = (npc: any): 香闺秘档部位类型[] => {
        if (gameConfig?.启用NSFW模式 !== true) return [];
        const parts = NPC是否扶她(npc)
            ? (npc?.是否主要角色 === true && 男娘NSFW内容已启用() ? 扶她香闺秘档自动部位列表 : [])
            : NPC是否成人女性主要角色(npc)
            ? 女性香闺秘档自动部位列表
            : NPC是否成人男性主要角色(npc)
                ? 男性香闺秘档自动部位列表
                : [];
        return parts.filter((part) => {
            const field = part === '胸部' ? '胸部描述' : part === '小穴' ? '小穴描述' : part === '肉棒' ? '肉棒描述' : '屁穴描述';
            return Boolean(读取NPC文本字段(npc, field)) && !NPC是否已有成功香闺秘档部位(npc, part);
        });
    };

    const 构建NPC自动香闺秘档签名列表 = (npc: any, part: 香闺秘档部位类型): string[] => {
        const id = 读取NPC文本字段(npc, 'id');
        const name = 读取NPC文本字段(npc, '姓名');
        const gender = 读取NPC文本字段(npc, '性别');
        return [
            id ? `id:${id}::secret:${part}` : '',
            name ? `name:${gender}:${name}::secret:${part}` : ''
        ].filter(Boolean);
    };

    const 标记NPC自动香闺秘档签名 = (npc: any, part: 香闺秘档部位类型): string[] | null => {
        const signatures = 构建NPC自动香闺秘档签名列表(npc, part);
        if (signatures.length <= 0) return null;
        if (signatures.some((signature) => NPC自动香闺秘档生图签名Ref.current.has(signature))) return null;
        signatures.forEach((signature) => NPC自动香闺秘档生图签名Ref.current.add(signature));
        return signatures;
    };

    const 清除NPC自动香闺秘档签名 = (signatures: string[] | null) => {
        (signatures || []).forEach((signature) => NPC自动香闺秘档生图签名Ref.current.delete(signature));
    };

    const 执行NPC自动香闺秘档部位任务 = async (npc: any, part: 香闺秘档部位类型): Promise<boolean> => {
        if (!读取NPC香闺秘档缺失部位(npc).includes(part)) return false;
        const npcKey = 获取NPC唯一标识(npc);
        if (!npcKey || NPC生图进行中Ref.current.has(npcKey) || NPC香闺秘档生图进行中Ref.current.has(`${npcKey}::${part}`)) return false;

        const signatures = 标记NPC自动香闺秘档签名(npc, part);
        if (!signatures) return false;
        try {
            await 执行NPC香闺秘档部位生图(npc, part, { source: 'auto' });
            return true;
        } catch (error) {
            清除NPC自动香闺秘档签名(signatures);
            throw error;
        }
    };

    const 自动补齐NPC香闺秘档部位 = async (npc: any) => {
        const npcKey = 获取NPC唯一标识(npc);
        if (npcKey && NPC生图进行中Ref.current.has(npcKey)) return;
        const missingParts = 读取NPC香闺秘档缺失部位(npc);
        for (const part of missingParts) {
            try {
                await 执行NPC自动香闺秘档部位任务(npc, part);
            } catch (error) {
                console.warn('主要角色香闺秘档自动补全失败', 读取NPC文本字段(npc, 'id') || 读取NPC文本字段(npc, '姓名'), part, error);
            }
        }
    };

    const 触发新增NPC自动生图 = (newNpcList: any[]) => {
        const npcList = Array.isArray(newNpcList) ? newNpcList : [];
        if (npcList.length === 0) return;
        window.setTimeout(() => {
            npcList.forEach((npc) => {
                void 执行NPC自动构图任务(npc, '头像').catch((error) => {
                    recordDiagnosticLog('warn', ['NPC自动生图失败', {
                        npc: 读取NPC文本字段(npc, 'id') || 读取NPC文本字段(npc, '姓名'),
                        composition: '头像',
                        message: error?.message || '',
                        stack: typeof error?.stack === 'string' ? error.stack : undefined
                    }]);
                    console.warn('新增 NPC 头像自动生图失败', 读取NPC文本字段(npc, 'id') || 读取NPC文本字段(npc, '姓名'), error);
                });
            });
        }, 500);
    };

    const 触发对白NPC头像补全 = (npcListRaw: any[]) => {
        const config = 读取文生图功能配置();
        if (!config.总开关 || !config.NPC开关) return;
        const npcList = (Array.isArray(npcListRaw) ? npcListRaw : [])
            .filter((npc: any) => npc?.对白登场 === true || npc?.自动补全头像 === true);
        if (npcList.length === 0) return;
        npcList.forEach((npc) => {
            void 执行NPC自动构图任务(npc, '头像').catch(() => undefined);
        });
    };

    const 构建全部NPC头像缺口签名 = (npcListRaw: any[]): string => {
        const config = 读取文生图功能配置();
        if (!config.总开关 || !config.NPC开关 || config.重要性筛选 !== '全部') return '';
        return (Array.isArray(npcListRaw) ? npcListRaw : [])
            .filter((npc: any) => NPC符合自动生图条件(npc))
            .filter((npc: any) => !NPC是否已有成功构图(npc, ['头像']))
            .map((npc: any, index: number) => 获取NPC唯一标识(npc, index))
            .filter(Boolean)
            .join('|');
    };

    const 自动补全全部NPC头像 = async (targetNpcList?: any[]) => {
        const config = 读取文生图功能配置();
        if (!config.总开关 || !config.NPC开关 || config.重要性筛选 !== '全部') return;
        if (全部NPC头像补全进行中Ref.current) {
            输出NPC自动生图调试('跳过：全部 NPC 头像补全仍在进行中');
            return;
        }
        const 单个NPC自动补全等待上限 = 90_000;
        const 当前社交列表 = Array.isArray(社交Ref.current) ? 社交Ref.current : [];
        const 原始列表 = 当前社交列表.length > 0
            ? 当前社交列表
            : (Array.isArray(targetNpcList) ? targetNpcList : []);
        const npcList = 原始列表
            .filter((npc: any) => NPC符合自动生图条件(npc))
            .filter((npc: any) => !NPC是否已有成功构图(npc, ['头像']))
            .map((npc: any, index: number) => ({ npc, npcId: 获取NPC唯一标识(npc, index) }))
            .filter(({ npcId }) => Boolean(npcId));
        if (npcList.length === 0) return;
        输出NPC自动生图调试('全部 NPC 头像补全候选', {
            total: 原始列表.length,
            candidates: npcList.map(({ npc, npcId }) => ({
                npcId,
                姓名: 读取NPC文本字段(npc, '姓名'),
                性别: 读取NPC文本字段(npc, '性别'),
                已成功: NPC是否已有成功构图(npc, ['头像']),
                符合条件: NPC符合自动生图条件(npc)
            }))
        });

        const workerCount = Math.min(3, Math.max(1, npcList.length));
        let cursor = 0;
        const runOne = async ({ npc, npcId }: { npc: any; npcId: string }) => {
            try {
                const finished = await Promise.race([
                    执行NPC自动构图任务(npc, '头像'),
                    new Promise<boolean>((resolve) => {
                        window.setTimeout(() => resolve(false), 单个NPC自动补全等待上限);
                    })
                ]);
                if (finished === false) {
                    输出NPC自动生图调试(`单个 NPC 头像补全超过 ${单个NPC自动补全等待上限}ms，已跳过并继续后续 NPC`, { npcId });
                }
            } catch (error) {
                console.warn('全部NPC头像自动补全失败', npcId, error);
            }
        };
        全部NPC头像补全进行中Ref.current = true;
        try {
            await Promise.all(Array.from({ length: workerCount }, async () => {
                while (cursor < npcList.length) {
                    const current = npcList[cursor];
                    cursor += 1;
                    if (current) await runOne(current);
                }
            }));
        } finally {
            全部NPC头像补全进行中Ref.current = false;
        }
    };

    const 构建主要角色资源缺口签名 = (npcList: any[]): string => {
        return (Array.isArray(npcList) ? npcList : [])
            .filter((npc) => npc?.是否主要角色 === true && typeof npc?.id === 'string' && npc.id.trim())
            .map((npc) => {
                const npcId = npc.id.trim();
                const missingParts: string[] = [];
                if (自动角色锚点已启用() && !按NPC读取角色锚点(npcId)) {
                    missingParts.push('anchor');
                }
                if (!NPC是否已有成功构图(npc, ['头像'])) {
                    missingParts.push('avatar');
                }
                if ((NPC是否女性(npc) || (男娘NSFW内容已启用() && NPC是否男性或男娘(npc))) && !NPC是否已有成功构图(npc, ['半身', '立绘'])) {
                    missingParts.push('portrait');
                }
                const missingSecretParts = 读取NPC香闺秘档缺失部位(npc);
                if (missingSecretParts.length > 0) {
                    missingParts.push(`secret:${missingSecretParts.join(',')}`);
                }
                return missingParts.length > 0 ? `${npcId}:${missingParts.join(',')}` : '';
            })
            .filter(Boolean)
            .join('|');
    };

    const 自动补全主要角色图片与锚点 = async (targetNpcList?: any[]) => {
        const npcList = (Array.isArray(targetNpcList) ? targetNpcList : 社交)
            .filter((npc: any) => npc?.是否主要角色 === true && typeof npc?.id === 'string' && npc.id.trim());
        if (npcList.length === 0) return;
        const config = 读取文生图功能配置();
        const 自动补图已启用 = config.总开关 && config.NPC开关;

        for (const npc of npcList) {
            const npcId = typeof npc?.id === 'string' ? npc.id.trim() : '';
            if (!npcId) continue;

            await 确保NPC生图前角色锚点(npc);
            if (!自动补图已启用) continue;

            if (!NPC是否已有成功构图(npc, ['头像'])) {
                try {
                    await 执行NPC自动构图任务(npc, '头像');
                } catch (error) {
                    console.warn('主要角色头像自动补全失败', npcId, error);
                }
            }

            if ((NPC是否女性(npc) || (男娘NSFW内容已启用() && NPC是否男性或男娘(npc))) && !NPC是否已有成功构图(npc, ['半身', '立绘'])) {
                try {
                    await 执行NPC自动构图任务(npc, '半身');
                } catch (error) {
                    console.warn('主要角色展示图自动补全失败', npcId, error);
                }
            }

            await 自动补齐NPC香闺秘档部位(npc);
        }

    };

    useEffect(() => {
        const missingSignature = 构建主要角色资源缺口签名(社交);
        if (!missingSignature) return;

        const feature = apiConfig?.功能模型占位 as any;
        const resourceSignature = [
            gameConfig?.启用NSFW模式 === true ? 'nsfw:on' : 'nsfw:off',
            gameConfig?.启用男娘NSFW内容 !== false ? 'femboy:on' : 'femboy:off',
            feature?.文生图功能启用 === true ? 'image:on' : 'image:off',
            feature?.NSFW生图独立接口启用 === true ? 'nsfw-api:on' : 'nsfw-api:shared',
            feature?.NSFW生图后端类型 || feature?.图片后端类型 || '',
            feature?.NSFW生图模型使用模型 || feature?.文生图模型使用模型 || '',
            feature?.NSFW生图模型API地址 || feature?.文生图模型API地址 || '',
            missingSignature
        ].join('__');
        if (主要角色资源补全签名Ref.current === resourceSignature) return;
        主要角色资源补全签名Ref.current = resourceSignature;

        const timerId = window.setTimeout(() => {
            void 自动补全主要角色图片与锚点(社交);
        }, 300);
        return () => window.clearTimeout(timerId);
    }, [社交, gameConfig?.启用NSFW模式, gameConfig?.启用男娘NSFW内容, apiConfig]);

    useEffect(() => {
        const feature = apiConfig?.功能模型占位 as any;
        const missingSignature = 构建全部NPC头像缺口签名(社交);
        if (!missingSignature) return;
        const resourceSignature = [
            feature?.文生图功能启用 === true ? 'image:on' : 'image:off',
            feature?.NPC生图启用 === true ? 'npc:on' : 'npc:off',
            feature?.NPC生图重要性筛选 || '',
            feature?.NPC生图性别筛选 || '',
            feature?.文生图后端类型 || feature?.图片后端类型 || '',
            feature?.文生图模型使用模型 || '',
            feature?.文生图模型API地址 || '',
            missingSignature
        ].join('__');
        if (全部NPC头像补全签名Ref.current === resourceSignature) return;
        全部NPC头像补全签名Ref.current = resourceSignature;

        const timerId = window.setTimeout(() => {
            void 自动补全全部NPC头像();
        }, 500);
        return () => window.clearTimeout(timerId);
    }, [社交, apiConfig]);

    useEffect(() => {
        const candidateList = (Array.isArray(社交) ? 社交 : []).filter((npc: any) => NPC性别已明确可补正构图(npc));
        if (candidateList.length <= 0) return;
        const signature = candidateList
            .map((npc: any, index: number) => {
                const npcId = 获取NPC唯一标识(npc, index);
                const gender = 读取NPC文本字段(npc, '性别');
                const 构图列表 = 读取NPC需性别补正构图列表(npc);
                return `${npcId}:${构图列表.join(',')}->${gender}`;
            })
            .filter(Boolean)
            .join('|');
        if (!signature || NPC性别补正生图签名Ref.current === signature) return;
        NPC性别补正生图签名Ref.current = signature;

        const timerId = window.setTimeout(() => {
            candidateList.forEach((npc: any) => {
                const 构图列表 = 读取NPC需性别补正构图列表(npc);
                console.info('[npc.image.gender-refresh.trigger]', {
                    npcId: 读取NPC文本字段(npc, 'id') || 获取NPC唯一标识(npc),
                    npcName: 读取NPC文本字段(npc, '姓名'),
                    gender: 读取NPC文本字段(npc, '性别'),
                    layouts: 构图列表
                });
                构图列表.forEach((构图) => {
                    void 执行NPC自动构图任务(npc, 构图, { force: true }).catch((error) => {
                        recordDiagnosticLog('warn', ['NPC补正生图失败', {
                            npc: 读取NPC文本字段(npc, 'id') || 读取NPC文本字段(npc, '姓名'),
                            composition: 构图,
                            message: error?.message || '',
                            stack: typeof error?.stack === 'string' ? error.stack : undefined
                        }]);
                        console.warn('NPC 性别明确后的补正生图失败', 读取NPC文本字段(npc, 'id') || 读取NPC文本字段(npc, '姓名'), 构图, error);
                    });
                });
            });
        }, 500);
        return () => window.clearTimeout(timerId);
    }, [社交, apiConfig]);

    const 世界演变功能已开启 = (): boolean => {
        const feature = apiConfig?.功能模型占位 as any;
        return Boolean(
            feature?.世界演变功能启用 !== false
            && feature?.世界演变独立模型开关
            && typeof feature?.世界演变使用模型 === 'string'
            && feature.世界演变使用模型.trim().length > 0
        );
    };

    const 文章优化功能已开启 = (): boolean => {
        const feature = apiConfig?.功能模型占位 as any;
        return Boolean(
            feature?.文章优化独立模型开关
            && typeof feature?.文章优化使用模型 === 'string'
            && feature.文章优化使用模型.trim().length > 0
        );
    };

    const 已进入主剧情回合 = (): boolean => {
        return Array.isArray(历史记录)
            && 历史记录.some(item => item?.role === 'user' && typeof item?.content === 'string' && item.content.trim().length > 0);
    };

    const 替换流式草稿为失败提示 = (history: 聊天记录结构[], errorMessage: string): 聊天记录结构[] => {
        const next = Array.isArray(history) ? [...history] : [];
        const failureText = `【生成失败】${errorMessage || '未知错误'}`;
        for (let i = next.length - 1; i >= 0; i -= 1) {
            const item = next[i];
            if (item?.role === 'assistant' && !item?.structuredResponse) {
                next[i] = {
                    ...item,
                    content: failureText
                };
                return next;
            }
        }
        return [
            ...next,
            {
                role: 'assistant',
                content: failureText,
                timestamp: Date.now()
            }
        ];
    };

    const 更新流式草稿为自动重试提示 = (
        history: 聊天记录结构[],
        attempt: number,
        maxAttempts: number,
        reason?: string
    ): 聊天记录结构[] => {
        const next = Array.isArray(history) ? [...history] : [];
        const retryText = `【自动重试中】第 ${attempt} / ${maxAttempts} 次${reason ? `：${reason}` : ''}`;
        for (let i = next.length - 1; i >= 0; i -= 1) {
            const item = next[i];
            if (item?.role === 'assistant' && !item?.structuredResponse) {
                next[i] = {
                    ...item,
                    content: retryText
                };
                return next;
            }
        }
        return [
            ...next,
            {
                role: 'assistant',
                content: retryText,
                timestamp: Date.now()
            }
        ];
    };

    const 游戏设置启用自动重试 = (config?: Partial<游戏设置结构> | null): boolean => {
        return config?.启用自动重试 === true;
    };

    const 提取自动重试原因 = (error: any): string => {
        if (error instanceof textAIService.StoryResponseParseError || error?.name === 'StoryResponseParseError') {
            return '解析失败，正在重新生成';
        }
        if (typeof error?.message === 'string' && error.message.trim()) {
            return error.message.trim();
        }
        if (typeof error === 'string' && error.trim()) {
            return error.trim();
        }
        return '请求失败，正在重试';
    };

    const 是否可自动重试错误 = (error: any): boolean => {
        if (!error) return false;
        if (error?.name === 'AbortError') return false;
        return error instanceof textAIService.StoryResponseParseError
            || error?.name === 'StoryResponseParseError'
            || true;
    };

    const 执行带自动重试的生成请求 = async <T,>(params: {
        enabled: boolean;
        action: (attempt: number, lastError?: any) => Promise<T>;
        onRetry?: (attempt: number, maxAttempts: number, reason: string) => void;
    }): Promise<T> => {
        const maxAttempts = params.enabled ? 自动重试最大次数 : 1;
        let lastError: any = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                return await params.action(attempt, lastError);
            } catch (error: any) {
                lastError = error;
                if (!params.enabled || attempt >= maxAttempts || !是否可自动重试错误(error)) {
                    throw error;
                }
                const reason = 提取自动重试原因(error);
                params.onRetry?.(attempt + 1, maxAttempts, reason);
            }
        }
        throw lastError;
    };
    const 执行正文润色 = async (
        baseResponse: GameResponse,
        rawText: string,
        options?: { manual?: boolean; playerInput?: string; signal?: AbortSignal; allowExpansionForLength?: boolean; minLength?: number; onDelta?: (delta: string, accumulated: string) => void }
    ): Promise<{ response: GameResponse; applied: boolean; error?: string; rawText?: string }> => 执行正文润色工作流(
        baseResponse,
        rawText,
        {
            apiConfig,
            gameConfig,
            prompts,
            环境,
            剧情,
            社交,
            角色,
            文章优化已开启: 文章优化功能已开启(),
            深拷贝,
            onDelta: options?.onDelta
        },
        options
    );

    function 规范化社交列表安全(raw?: any[], options?: { 合并同名?: boolean; 保留非姓名库主要女性名?: boolean }) {
        const list = Array.isArray(raw) ? raw : [];
        return 规范化社交列表(list, {
            ...options,
            保留非姓名库主要女性名: options?.保留非姓名库主要女性名 === true
        });
    }

    const 构建组织成员社交档案 = (member: any, index: number, organizationText: string) => {
        const semantic = String((玩家组织 as any)?.组织语义 || (玩家组织 as any)?.组织类型 || (玩家组织 as any)?.题材组织类型 || '').trim();
        const isInfiniteMode = semantic === '轮回小队' || /主神|轮回|奖励点|支线剧情|基因锁|主神空间|恐怖片|轮回者/u.test(organizationText);
        const isApocalypseMode = !isInfiniteMode && /末日|丧尸|营地|避难|安全点|据点|车队|搜救|后勤|巡逻|物资|燃油|口粮|弹药|尸群/u.test(organizationText);
        const memberLabel = isInfiniteMode ? '队友' : isApocalypseMode ? '同伴' : '同门';
        const orgLabel = isInfiniteMode ? '轮回小队' : isApocalypseMode ? '营地' : '门派';
        const formatRelation = (value?: string) => {
            const text = String(value || '').trim() || memberLabel;
            if (isInfiniteMode) return text.replace(/同门/g, '队友').replace(/门派成员/g, '轮回小队成员').replace(/营地成员/g, '轮回小队成员');
            return isApocalypseMode ? text.replace(/同门/g, '同伴').replace(/门派成员/g, '营地成员') : text;
        };
        return {
            id: typeof member?.id === 'string' && member.id.trim()
                ? member.id.trim()
                : `organization_member_${玩家组织?.ID || 'unknown'}_${index}`,
            姓名: typeof member?.姓名 === 'string' && member.姓名.trim() ? member.姓名.trim() : `${memberLabel}${index + 1}`,
            性别: typeof member?.性别 === 'string' ? member.性别 : '未知',
            年龄: Number.isFinite(Number(member?.年龄)) ? Number(member.年龄) : undefined,
            境界: typeof member?.境界 === 'string' && member.境界.trim() ? member.境界.trim() : '未知境界',
            身份: typeof member?.身份 === 'string' && member.身份.trim()
                ? `${玩家组织?.名称 || orgLabel} · ${formatRelation(member.身份.trim())}`
                : `${玩家组织?.名称 || orgLabel}${memberLabel}`,
            是否在场: typeof member?.是否在场 === 'boolean' ? member.是否在场 : false,
            是否队友: false,
            是否主要角色: false,
            是否玩家本人: member?.是否玩家本人 === true,
            好感度: Number.isFinite(Number(member?.好感度)) ? Number(member.好感度) : 0,
            关系状态: formatRelation(member?.关系状态),
            简介: typeof member?.简介 === 'string' && member.简介.trim()
                ? formatRelation(member.简介.trim())
                : `${玩家组织?.名称 || orgLabel}名录中的${memberLabel}。`,
            头像图片URL: typeof member?.头像图片URL === 'string' ? member.头像图片URL : undefined,
            图片档案: member?.图片档案 && typeof member.图片档案 === 'object' ? member.图片档案 : undefined,
            天赋列表: Array.isArray(member?.天赋列表) ? member.天赋列表 : [],
            出身背景: member?.出身背景 && typeof member.出身背景 === 'object' ? member.出身背景 : undefined,
            力量: Number.isFinite(Number(member?.力量)) ? Number(member.力量) : undefined,
            敏捷: Number.isFinite(Number(member?.敏捷)) ? Number(member.敏捷) : undefined,
            体质: Number.isFinite(Number(member?.体质)) ? Number(member.体质) : undefined,
            根骨: Number.isFinite(Number(member?.根骨)) ? Number(member.根骨) : undefined,
            悟性: Number.isFinite(Number(member?.悟性)) ? Number(member.悟性) : undefined,
            福源: Number.isFinite(Number(member?.福源)) ? Number(member.福源) : undefined,
            境界层级: Number.isFinite(Number(member?.境界层级)) ? Number(member.境界层级) : undefined,
            保留开局伙伴设定属性: member?.保留开局伙伴设定属性 === true,
            记忆: Array.isArray(member?.记忆) ? member.记忆 : [],
            来源: '玩家组织.重要成员'
        };
    };

    useEffect(() => {
        if (开局社交刚初始化Ref.current) { 开局社交刚初始化Ref.current = false; return; }
        const members = Array.isArray(玩家组织?.重要成员) ? 玩家组织.重要成员 : [];
        if (!玩家组织 || 玩家组织.ID === 'none' || 玩家组织.名称 === '无门无派' || members.length === 0) return;
        const currentSocial = Array.isArray(社交) ? 社交 : [];
        const normalizedKey = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, '').toLowerCase() : '');
        const known = new Set(currentSocial.flatMap((npc: any) => [npc?.id, npc?.ID, npc?.姓名, npc?.名称].map(normalizedKey)).filter(Boolean));
        const organizationText = JSON.stringify(玩家组织 || {});
        const missing = members
            .filter((member: any) => member?.是否玩家本人 !== true)
            .map((member: any, index: number) => 构建组织成员社交档案(member, index, organizationText))
            .filter((npc: any) => {
                const keys = [npc?.id, npc?.姓名].map(normalizedKey).filter(Boolean);
                return keys.length > 0 && keys.every((key) => !known.has(key));
            });
        if (missing.length === 0) return;
        应用并同步社交列表([...currentSocial, ...missing], { 静默NPC总结提示: true });
        触发新增NPC自动生图(missing);
    }, [玩家组织, 社交, 历史记录]);

    const 应用开场基态 = (openingBase: ReturnType<typeof 创建开场基础状态>) => {
        const openingBaseConfig = (openingBase as any)?.开局配置 || 开局配置;
        设置角色(规范化角色物品容器映射(openingBase.角色, {
            启用饱腹口渴系统: gameConfig?.启用饱腹口渴系统,
            题材模式: openingBaseConfig?.题材模式
        }));
        设置环境(规范化环境信息(openingBase.环境));
        设置游戏初始时间(openingBase.游戏初始时间 || '');
        开局社交刚初始化Ref.current = true;
        设置社交(应用同名NPC过滤(规范化社交列表(openingBase.社交), 角色?.姓名));
        设置世界(openingBase.世界);
        设置玩家组织(openingBase.玩家组织);
        设置任务列表(openingBase.任务列表 || []);
        设置剧情(规范化剧情状态(openingBase.剧情));
        设置剧情规划(规范化剧情规划状态(openingBase.剧情规划 || 创建空剧情规划()));
        设置女主剧情规划(openingBase.女主剧情规划);
        设置导演配置(规范化导演配置(openingBaseConfig?.导演配置, { openingConfig: openingBaseConfig }));
        应用并同步记忆系统(创建空记忆系统(), { 静默总结提示: true });
        设置历史记录([]);
        清空变量生成上下文缓存();
        setWorldEvents([]);
    };

    const promptRuntimeFacade = 创建PromptRuntimeFacade({
        获取导演配置: () => 导演配置,
        获取游戏设置: () => gameConfig,
        获取记忆配置: () => memoryConfig,
        获取玩家姓名: () => 角色?.姓名,
        获取内置提示词列表: () => 内置提示词列表,
        获取世界书列表: () => 世界书列表,
        世界演变功能已开启
    });

    const 构建系统提示词 = promptRuntimeFacade.构建系统提示词;

    const processResponseCommands = (
        response: GameResponse,
        baseState?: {
            角色: typeof 角色;
            环境: typeof 环境;
            社交: typeof 社交;
            世界: typeof 世界;
            玩家组织?: 玩家组织结构;
            任务列表?: any[];
            剧情: typeof 剧情;
            剧情规划: typeof 剧情规划;
            女主剧情规划?: 女主剧情规划结构;
        },
        options?: {
            applyState?: boolean;
            heroinePlanEnabled?: boolean;
        }
    ) => {
        const normalizedRuntimeConfig = 规范化游戏设置(gameConfig);
        const heroinePlanEnabled = 开局配置?.启用女主剧情规划 !== undefined
            ? 开局配置.启用女主剧情规划 === true
            : normalizedRuntimeConfig.启用女主剧情规划 === true;
        return 执行响应命令处理(
            response,
            {
                角色,
                环境,
                社交,
                世界,
                玩家组织,
                任务列表,
                剧情,
                剧情规划,
                女主剧情规划
            },
            {
                规范化环境信息,
                规范化社交列表: 规范化社交列表安全,
                规范化世界状态,
                规范化组织状态,
                规范化剧情状态,
                规范化剧情规划状态,
                规范化女主剧情规划状态,
                规范化角色物品容器映射,
                角色规范化选项: {
                    启用饱腹口渴系统: gameConfig?.启用饱腹口渴系统,
                    题材模式: 开局配置?.题材模式
                },
                设置角色,
                设置环境,
                设置社交,
                设置世界,
                设置玩家组织,
                设置任务列表,
                设置剧情,
                设置剧情规划,
                设置女主剧情规划,
                命令后校准: (nextState) => {
                    const 清理题材物品 = (state: typeof nextState): typeof nextState => ({
                        ...state,
                        角色: 规范化角色物品容器映射(state.角色 || 角色, {
                            启用饱腹口渴系统: gameConfig?.启用饱腹口渴系统,
                            题材模式: 开局配置?.题材模式
                        })
                    });
                    const 修复开局伙伴 = (state: typeof nextState): typeof nextState => ({
                        ...state,
                        社交: 修复开局伙伴社交列表(state.社交, 开局配置, state.角色 || 角色)
                    });
                    const finalizeState = (state: typeof nextState): typeof nextState => (
                        同步角色与组织状态(修复开局伙伴(清理题材物品(state))) as typeof nextState
                    );
                    if (!变量生成功能已启用(apiConfig)) {
                        return finalizeState(nextState);
                    }
                    const calibrated = 执行变量自动校准(nextState, {
                        规范化环境信息,
                        规范化社交列表: 规范化社交列表安全,
                        规范化世界状态,
                        规范化组织状态,
                        规范化剧情状态,
                        规范化剧情规划状态,
                        规范化女主剧情规划状态,
                        规范化角色物品容器映射: (raw?: any, calibrationOptions?: any) => 规范化角色物品容器映射(raw, {
                            ...calibrationOptions,
                            启用饱腹口渴系统: gameConfig?.启用饱腹口渴系统,
                            题材模式: 开局配置?.题材模式
                        })
                    });
                    return {
                        ...calibrated,
                        state: finalizeState(calibrated.state)
                    };
                }
            },
            baseState,
            {
                ...options,
                heroinePlanEnabled: options?.heroinePlanEnabled ?? heroinePlanEnabled
            }
        );
    };

    const 执行世界演变更新 = async (params?: {
        来源?: 'manual' | 'auto_due' | 'story_dynamic' | 'story_dynamic_and_due';
        动态世界线索?: string[];
        到期摘要?: string[];
        force?: boolean;
        currentResponse?: GameResponse;
        signal?: AbortSignal;
        stateBase?: {
            角色: typeof 角色;
            环境: typeof 环境;
            社交: typeof 社交;
            世界: typeof 世界;
            剧情: typeof 剧情;
            剧情规划: typeof 剧情规划;
            女主剧情规划?: 女主剧情规划结构;
        };
    }) => 执行世界演变更新工作流(
        params,
        {
            apiSettings: apiConfig,
            gameConfig,
            角色,
            环境,
            世界,
            剧情,
            记忆系统,
            历史记录,
            prompts,
            开局配置,
            导演配置,
            worldbooks: 世界书列表,
            世界演变进行中Ref,
            世界演变去重签名Ref,
            已进入主剧情回合,
            按回合窗口裁剪历史,
            规范化环境信息,
            规范化世界状态,
            规范化剧情状态,
            processResponseCommands,
            setWorldEvents,
            set世界演变更新中,
            set世界演变状态文本,
            set世界演变最近更新时间,
            set世界演变最近摘要,
            set世界演变最近原始消息,
            追加系统消息
        }
    );

    const {
        后台执行统一规划分析
    } = 创建规划更新工作流({
        apiConfig,
        gameConfig,
        角色,
        环境,
        世界,
        玩家组织,
        任务列表,
        历史记录,
        规划分析进行中Ref,
        开局配置,
        导演配置,
        prompts,
        worldbooks: 世界书列表,
        规范化环境信息,
        规范化社交列表: 规范化社交列表安全,
        规范化世界状态,
        规范化组织状态,
        规范化剧情状态,
        规范化剧情规划状态,
        规范化女主剧情规划状态,
        深拷贝,
        收集最近完整正文回合,
        构建最近完整正文上下文,
        去重文本数组,
        收集女主规划时间触发原因,
        收集女主正文命中原因,
        收集剧情规划时间触发原因,
        收集剧情正文命中原因,
        提取响应完整正文文本,
        设置剧情,
        设置剧情规划,
        设置女主剧情规划,
        performAutoSave: (...args) => performAutoSave(...args)
    });

    const { handleForceWorldEvolutionUpdate } = use世界演变控制({
        view,
        loading,
        apiConfig,
        环境,
        世界,
        世界演变更新中,
        变量生成中: 变量生成中,
        世界演变状态文本,
        世界演变最近更新时间,
        世界演变最近现实更新时间戳Ref,
        世界演变去重签名Ref,
        世界演变功能已开启,
        已进入主剧情回合,
        set世界演变状态文本,
        规范化世界状态,
        执行世界演变更新
    });

    const 等待世界演变空闲 = async (signal?: AbortSignal, timeoutMs = 20000): Promise<void> => {
        const startedAt = Date.now();
        while (世界演变进行中Ref.current) {
            if (signal?.aborted) {
                throw new DOMException('变量生成已取消', 'AbortError');
            }
            if (Date.now() - startedAt >= timeoutMs) {
                const timeoutError = new Error(`等待世界演变完成超时（${Math.max(1, Math.ceil(timeoutMs / 1000))} 秒）`);
                timeoutError.name = 'TimeoutError';
                throw timeoutError;
            }
            await new Promise<void>((resolve) => {
                window.setTimeout(resolve, 80);
            });
        }
    };

    let 执行重解析变量生成委托 = async (params: {
        snapshot: any;
        playerInput: string;
        parsedResponse: GameResponse;
    }): Promise<GameResponse> => params.parsedResponse;

    const {
        使用快照重建解析回合,
        updateHistoryItem,
        handleRegenerate,
        handleRetryLatestVariableGeneration,
        handleRecoverFromParseErrorRaw,
        handlePolishTurn
    } = 创建历史回合工作流({
        历史记录,
        记忆系统,
        memoryConfig,
        gameConfig,
        prompts,
        内置提示词列表,
        世界书列表,
        loading,
        变量生成中: 变量生成中,
        记忆总结阶段,
        社交,
        visualConfig,
        visualConfigRef,
        场景图片档案Ref,
        scrollRef,
        获取最新快照: () => 回合快照栈Ref.current[回合快照栈Ref.current.length - 1] || null,
        回档到快照,
        弹出重Roll快照,
        删除最近自动存档并重置状态,
        深拷贝,
        环境时间转标准串,
        规范化记忆配置,
        规范化记忆系统,
        规范化社交列表: 规范化社交列表安全,
        规范化视觉设置,
        规范化场景图片档案,
        normalizeCanonicalGameTime,
        构建即时记忆条目,
        构建短期记忆条目,
        写入四段记忆,
        估算AI输出Token,
        提取解析失败原始信息,
        提取原始报错详情,
        构建标签解析选项,
        parseStoryRawText: textAIService.parseStoryRawText,
        执行正文润色,
        规范化游戏设置,
        processResponseCommands,
        按世界演变分流净化响应,
        世界演变功能已开启,
        执行重解析变量生成: (params) => 执行重解析变量生成委托(params),
        应用并同步记忆系统,
        performAutoSave: (...args) => performAutoSave(...args),
        设置剧情,
        设置历史记录,
        设置玩家组织,
        设置任务列表,
        设置社交,
        记录变量生成上下文,
        set聊天区自动滚动抑制令牌,
        获取NPC唯一标识,
        合并NPC图片档案
    });

    const {
        后台执行变量校准: 后台执行变量生成,
        执行变量校准并合并响应: 执行变量生成并合并响应,
        执行重解析变量校准: 执行重解析变量生成
    } = 创建变量生成协调器({
        apiConfig,
        gameConfig,
        prompts,
        开局配置,
        内置提示词列表,
        世界书列表,
        世界演变进行中Ref,
        variableGenerationAbortControllerRef,
        set变量生成中: set变量生成中,
        深拷贝,
        世界演变功能已开启,
        等待世界演变空闲,
        收集最近变量生成上下文,
        执行变量模型校准工作流,
        合并变量生成结果到响应,
        变量生成功能已启用,
        获取变量计算接口配置,
        接口配置是否可用,
        序列化变量生成命令: 序列化变量校准命令,
        使用快照重建解析回合
    });
    执行重解析变量生成委托 = 执行重解析变量生成;

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (recallAbortControllerRef.current) {
            recallAbortControllerRef.current.abort();
        }
        if (variableGenerationAbortControllerRef.current) {
            variableGenerationAbortControllerRef.current.abort();
        }
    };

    const handleCancelVariableGeneration = () => {
        if (variableGenerationAbortControllerRef.current) {
            variableGenerationAbortControllerRef.current.abort();
        }
    };

    const buildContextSnapshot = async (): Promise<上下文快照> => {
        const currentRefs = [
            apiConfig,
            gameConfig,
            memoryConfig,
            prompts,
            内置提示词列表,
            世界书列表,
            记忆系统,
            历史记录,
            社交,
            角色,
            环境,
            世界,
            玩家组织,
            任务列表,
            剧情,
            剧情规划,
            女主剧情规划,
            开局配置,
            导演配置
        ];
        const cached = 上下文快照缓存Ref.current;
        if (
            cached
            && cached.refs.length === currentRefs.length
            && cached.refs.every((item, index) => item === currentRefs[index])
        ) {
            return cached.value;
        }

        const nextSnapshot = await 构建上下文快照数据({
            apiConfig,
            gameConfig,
            memoryConfig,
            prompts,
            内置提示词列表,
            世界书列表,
            记忆系统,
            历史记录,
            社交,
            角色,
            环境,
            世界,
            玩家组织,
            任务列表,
            剧情,
            剧情规划,
            女主剧情规划,
            开局配置,
            导演配置,
            规范化环境信息,
            规范化剧情状态,
            规范化剧情规划状态,
            规范化女主剧情规划状态,
            按回合窗口裁剪历史,
            构建系统提示词
        });
        上下文快照缓存Ref.current = {
            value: nextSnapshot,
            refs: currentRefs
        };
        return nextSnapshot;
    };

    // --- Core Send Logic ---
    const handleSend = async (
        content: string,
        isStreaming: boolean = true,
        options?: 发送选项
    ): Promise<发送结果> => {
        set开局主剧情进度(null);
        set开局文章优化进度(null);
        set开局变量生成进度(null);
        set开局世界演变进度(null);
        set开局规划进度(null);
        set开局地图更新进度(null);
        if (variableGenerationAbortControllerRef.current) {
            variableGenerationAbortControllerRef.current.abort();
        }
        const promptPool = (Array.isArray(prompts) && prompts.length > 0) ? prompts : await ensurePromptsLoaded();
        return 执行主剧情发送工作流(
            content,
            isStreaming,
            {
                历史记录,
                记忆系统,
                角色,
                环境,
                社交,
                世界,
                玩家组织,
                任务列表,
                剧情,
                剧情规划,
                女主剧情规划,
                开局配置,
                游戏初始时间,
                loading,
                gameConfig,
                apiConfig,
                memoryConfig,
                visualConfig,
                sceneImageArchive: 场景图片档案,
                prompts: promptPool,
                内置提示词列表,
                世界书列表
            },
            {
                abortControllerRef,
                recallAbortControllerRef,
                前台发送序号Ref,
                setLoading,
                set后台队列处理中,
                setShowSettings,
                设置剧情,
                设置历史记录,
                应用并同步记忆系统,
                构建系统提示词,
                processResponseCommands,
                performAutoSave,
                执行NPC变量自动备份: (socialSnapshot, options) => {
                    void 自动备份NPC变量(socialSnapshot, options).catch((error) => {
                        recordDiagnosticLog('warn', ['NPC变量自动备份失败', {
                            message: error?.message || '',
                            stack: typeof error?.stack === 'string' ? error.stack : undefined
                        }]);
                        console.warn('NPC变量自动备份失败', error);
                    });
                },
                执行正文润色,
                执行世界演变更新,
                触发新增NPC自动生图,
                触发对白NPC头像补全,
                检查主角每回合生图: (player) => {
                    const handler = 主角每回合生图检查器Ref.current;
                    if (typeof handler !== 'function') return;
                    try {
                        handler(player);
                    } catch (error) {
                        console.warn('主角每回合生图检查器异常，已避免打断主线流程', error);
                    }
                },
                触发场景自动生图,
                应用常驻壁纸为背景,
                提取新增NPC列表,
                推入重Roll快照,
                弹出重Roll快照: () => 弹出重Roll快照() || undefined,
                回档到快照,
                深拷贝,
                按回合窗口裁剪历史,
                规范化环境信息,
                规范化剧情状态,
                规范化剧情规划状态,
                规范化女主剧情规划状态,
                规范化世界状态,
                游戏设置启用自动重试,
                执行带自动重试的生成请求,
                更新流式草稿为自动重试提示,
                提取解析失败原始信息,
                提取原始报错详情,
                格式化错误详情,
                获取原始AI消息,
                估算消息Token,
                估算AI输出Token,
                计算回复耗时秒,
                文章优化功能已开启,
                后台执行统一规划分析,
                后台执行变量生成,
                执行变量生成并合并响应
            },
            options
        );
    };

    const {
        savePngStylePreset: 保存PNG画风预设,
        deletePngStylePreset: 删除PNG画风预设,
        setCurrentPngStylePreset: 设置当前PNG画风预设,
        getCurrentPngStylePreset: 获取当前PNG画风预设摘要,
        parsePngStylePreset,
        exportPngStylePresets: 导出PNG画风预设,
        importPngStylePresets: 导入PNG画风预设,
        saveCharacterAnchor: 保存角色锚点,
        deleteCharacterAnchor: 删除角色锚点,
        getCharacterAnchorByNpcId: 按NPC读取角色锚点,
        getPlayerCharacterAnchor: 读取主角角色锚点,
        getSceneCharacterAnchors: 提取场景角色锚点,
        extractCharacterAnchor: 提取角色锚点,
        extractPlayerCharacterAnchor: 提取主角角色锚点
    } = 创建图片预设工作流({
        获取接口配置: () => apiConfigRef.current,
        更新接口配置: updateApiConfig,
        加载图片AI服务,
        推送右下角提示,
        保存图片资源: dbService.保存图片资源,
        获取社交列表: () => 社交Ref.current,
        获取角色: () => 角色
    });

    const updateMemorySystem = (nextMemory: 记忆系统结构) => {
        const normalized = 规范化记忆系统(nextMemory);
        应用并同步记忆系统(normalized);
    };

    const 存档格式版本 = 3;
    const 自动存档最小间隔毫秒 = 30000;
    const 重置读档瞬态状态 = () => {
        自动记忆总结暂停Ref.current = true;
        清空变量生成上下文缓存();
        世界演变进行中Ref.current = false;
        世界演变去重签名Ref.current = '';
        set世界演变更新中(false);
        set世界演变状态文本('世界演变待命');
        set世界演变最近更新时间(null);
        世界演变最近现实更新时间戳Ref.current = 0;
        set世界演变最近摘要([]);
        set世界演变最近原始消息('');
        set待处理记忆总结任务(null);
        set记忆总结阶段('idle');
        set记忆总结草稿('');
        set记忆总结错误('');
        set待处理NPC记忆总结队列([]);
        setNPC记忆总结阶段('idle');
        setNPC记忆总结草稿('');
        setNPC记忆总结错误('');
    };

    const 读档后重置上下文 = () => {
        清空变量生成上下文缓存();
        自动记忆总结暂停Ref.current = false;
    };

    const {
        handleSaveGame,
        performAutoSave,
        handleLoadGame
    } = 创建存读档工作流({
        存档格式版本,
        自动存档最小间隔毫秒,
        深拷贝,
        历史记录,
        角色,
        环境,
        社交,
        世界,
        玩家组织,
        任务列表,
        剧情,
        剧情规划,
        女主剧情规划,
        记忆系统,
        openingConfig: 开局配置,
        directorConfig: 导演配置,
        提示词池: prompts,
        游戏初始时间,
        gameConfig,
        memoryConfig,
        获取当前视觉设置快照: () => 规范化视觉设置(深拷贝(visualConfigRef.current || visualConfig)),
        获取当前场景图片档案快照: () => 规范化场景图片档案(深拷贝(场景图片档案Ref.current || 场景图片档案)),
        获取角色锚点列表: () => 规范化接口设置(apiConfigRef.current).功能模型占位.角色锚点列表,
        获取当前角色锚点ID: () => 规范化接口设置(apiConfigRef.current).功能模型占位.当前角色锚点ID,
        构建完整地点文本,
        规范化环境信息,
        规范化世界状态,
        规范化组织状态,
        规范化剧情状态,
        规范化剧情规划状态,
        规范化女主剧情规划状态,
        规范化记忆系统,
        规范化可选开局配置,
        规范化导演配置,
        规范化记忆配置,
        规范化游戏设置,
        规范化视觉设置,
        规范化场景图片档案,
        规范化角色物品容器映射,
        规范化社交列表: 规范化社交列表安全,
        获取当前提示词池: () => prompts,
        创建开场空白环境,
        创建开场空白世界,
        创建空组织状态,
        创建开场空白剧情,
        应用并同步记忆系统,
        setHasSave,
        setGameConfig,
        setMemoryConfig,
        设置视觉设置: 应用视觉设置到状态,
        设置场景图片档案: 应用场景图片档案到状态,
        设置游戏初始时间,
        设置角色锚点列表: (value) => {
            void updateApiConfig(config => ({
                ...config,
                功能模型占位: {
                    ...config.功能模型占位,
                    角色锚点列表: Array.isArray(value) ? value : []
                }
            }));
        },
        设置当前角色锚点ID: (value) => {
            void updateApiConfig(config => ({
                ...config,
                功能模型占位: {
                    ...config.功能模型占位,
                    当前角色锚点ID: typeof value === 'string' ? value : ''
                }
            }));
        },
        setView,
        setShowSaveLoad,
        设置最近开局配置,
        设置角色,
        设置环境,
        设置社交,
        设置世界,
        设置玩家组织,
        设置任务列表,
        设置剧情,
        设置剧情规划,
        设置女主剧情规划,
        设置开局配置,
        设置导演配置,
        设置提示词池: setPrompts,
        设置历史记录,
        清空重Roll快照,
        推入重Roll快照,
        重置自动存档状态,
        切换生图存档作用域,
        最近自动存档时间戳Ref,
        最近自动存档签名Ref,
        读档前重置瞬态状态: 重置读档瞬态状态,
        读档后重置上下文,
        读档后定位到最新回合: () => set聊天区强制置底令牌(prev => prev + 1)
    });

    const 设置会话角色锚点列表 = (value: any) => {
        void updateApiConfig(config => ({
            ...config,
            功能模型占位: {
                ...config.功能模型占位,
                角色锚点列表: Array.isArray(value) ? value : []
            }
        }));
    };
    const 设置会话当前角色锚点ID = (value: any) => {
        void updateApiConfig(config => ({
            ...config,
            功能模型占位: {
                ...config.功能模型占位,
                当前角色锚点ID: typeof value === 'string' ? value : ''
            }
        }));
    };
    const 开局会话StateFacade = {
        gameConfig,
        memoryConfig,
        view,
        prompts,
        历史记录,
        记忆系统,
        社交,
        环境,
        角色,
        世界,
        玩家组织,
        任务列表,
        剧情,
        剧情规划,
        女主剧情规划,
        开局配置,
        内置提示词列表,
        世界书列表,
        loading,
        最近开局配置,
        设置游戏设置: setGameConfig,
        setPrompts,
        设置历史记录,
        设置最近开局配置,
        设置角色,
        设置环境,
        设置游戏初始时间,
        设置社交,
        设置世界,
        设置玩家组织,
        设置任务列表,
        设置剧情,
        设置剧情规划,
        设置女主剧情规划,
        设置开局配置,
        设置导演配置,
        设置场景图片档案: 应用场景图片档案到状态,
        设置角色锚点列表: 设置会话角色锚点列表,
        设置当前角色锚点ID: 设置会话当前角色锚点ID
    };
    const 开局会话ServicesFacade = {
        apiConfig,
        abortControllerRef,
        ensurePromptsLoaded,
        应用并同步记忆系统,
        清空变量生成上下文缓存,
        创建开场基础状态,
        构建前端清空开场状态,
        创建开场命令基态,
        创建开场空白环境,
        创建开场空白世界,
        创建空组织状态,
        创建开场空白剧情,
        创建空剧情规划,
        创建空记忆系统,
        应用开场基态,
        替换流式草稿为失败提示,
        记录变量生成上下文,
        深拷贝,
        performAutoSave,
        构建系统提示词,
        processResponseCommands,
        规范化导演配置,
        规范化环境信息,
        规范化剧情状态,
        规范化剧情规划状态,
        规范化女主剧情规划状态,
        规范化角色物品容器映射,
        规范化社交列表: 规范化社交列表安全,
        规范化世界状态,
        规范化组织状态,
        游戏设置启用自动重试,
        执行带自动重试的生成请求,
        更新流式草稿为自动重试提示,
        提取解析失败原始信息,
        获取原始AI消息,
        估算消息Token,
        估算AI输出Token,
        计算回复耗时秒,
        文章优化功能已开启,
        执行正文润色,
        提取新增NPC列表,
        获取当前视觉设置快照: () => 规范化视觉设置(深拷贝(visualConfigRef.current || visualConfig)),
        获取当前场景图片档案快照: () => 规范化场景图片档案(深拷贝(场景图片档案Ref.current || 场景图片档案))
    };
    const 开局会话EffectsFacade = {
        setView,
        setLoading,
        setShowSettings,
        清空重Roll快照,
        推入重Roll快照,
        重置自动存档状态,
        设置开局主剧情进度: set开局主剧情进度,
        设置开局文章优化进度: set开局文章优化进度,
        设置开局变量生成进度: set开局变量生成进度,
        设置开局世界演变进度: set开局世界演变进度,
        设置开局规划进度: set开局规划进度,
        设置开局地图更新进度: set开局地图更新进度,
        setWorldEvents,
        追加系统消息,
        触发新增NPC自动生图,
        触发主角自动生图: (player: 角色数据结构) => {
            const handler = 主角自动生图处理器Ref.current;
            if (typeof handler !== 'function') return;
            try {
                handler(player);
            } catch (error) {
                console.warn('主角自动生图处理器异常，已避免打断开局流程', error);
            }
        },
        触发场景自动生图,
        切换生图存档作用域
    };

    const {
        handleStartNewGameWizard,
        handleGenerateWorld,
        handleReturnToHome,
        handleQuickRestart
    } = 创建会话生命周期工作流({
        state: 开局会话StateFacade,
        services: 开局会话ServicesFacade,
        effects: 开局会话EffectsFacade
    });

    const {
        createNpcManually,
        updateNpcManually,
        deleteNpcManually,
        uploadNpcImageToSlot,
        updateNpcMajorRole,
        updateNpcPresence,
        removeNpc
    } = 创建手动NPC工作流({
        获取环境: () => 环境,
        环境时间转标准串,
        规范化社交列表: 规范化社交列表安全,
        设置社交,
        获取玩家组织: () => 玩家组织,
        设置玩家组织,
        执行社交自动存档: (socialSnapshot, organizationSnapshot) => {
            void performAutoSave({ social: socialSnapshot, sect: organizationSnapshot, history: 历史记录, force: true });
        },
        执行NPC变量本地备份: (socialSnapshot, options) => {
            void 保存NPC变量本地备份(socialSnapshot, {
                来源: 'before_manual_delete',
                标签: options?.标签
            }).catch((error) => {
                recordDiagnosticLog('warn', ['删除NPC前本地备份失败', {
                    message: error?.message || '',
                    stack: typeof error?.stack === 'string' ? error.stack : undefined
                }]);
                console.warn('删除 NPC 前本地备份失败', error);
            });
        },
        保存图片资源: dbService.保存图片资源
    });

    const restoreNpcVariableBackup = (backupSocialList: NPC结构[]) => {
        const retained = 合并保留既有NPC列表(backupSocialList, 社交, 角色?.姓名);
        const restored = 应用并同步社交列表(retained.列表, { 静默NPC总结提示: true });
        推送右下角提示({
            title: 'NPC 变量已恢复',
            message: retained.恢复数量 > 0
                ? `已从本地备份恢复 ${retained.恢复数量} 个缺失 NPC。`
                : '当前 NPC 列表已与备份对齐，没有发现缺失角色。',
            tone: 'success'
        });
        return restored;
    };

    const {
        updateRuntimeVariableSection,
        applyRuntimeVariableCommand,
        removeTask
    } = 创建运行时变量工作流({
        获取历史记录: () => 历史记录,
        深拷贝,
        获取当前状态: () => ({
            角色,
            环境,
            社交,
            世界,
            剧情,
            剧情规划,
            女主剧情规划,
            玩家组织,
            任务列表,
            记忆系统
        }),
        规范化角色物品容器映射,
        规范化环境信息,
        规范化社交列表: 规范化社交列表安全,
        规范化世界状态,
        规范化剧情状态,
        规范化剧情规划状态,
        规范化女主剧情规划状态,
        规范化组织状态,
        规范化记忆系统,
        设置角色,
        设置环境,
        设置社交,
        设置世界,
        设置剧情,
        设置剧情规划,
        设置女主剧情规划,
        设置玩家组织,
        设置任务列表,
        应用并同步记忆系统,
        performAutoSave,
        女主规划已启用: () => {
            const normalizedRuntimeConfig = 规范化游戏设置(gameConfig);
            return 开局配置?.启用女主剧情规划 !== undefined
                ? 开局配置.启用女主剧情规划 === true
                : normalizedRuntimeConfig.启用女主剧情规划 === true;
        }
    });

    const {
        generateNpcImageManually,
        generateNpcSecretPartImage,
        retryNpcImageGeneration
    } = 创建手动图片动作工作流({
        获取社交列表: () => 社交Ref.current,
        NSFW模式已启用: () => gameConfig?.启用NSFW模式 === true,
        男娘NSFW内容已启用,
        记录后台手动生图监控: (payload) => {
            后台手动生图监控Ref.current.push(payload);
        },
        记录后台私密生图监控: (payload) => {
            后台私密生图监控Ref.current.push(payload);
        },
        推送右下角提示,
        执行单个NPC生图,
        执行NPC香闺秘档部位生图
    });

    const {
        updatePlayerAvatar: 更新玩家头像,
        selectPlayerAvatarImage: 选择主角头像图片,
        clearPlayerAvatarImage: 清除主角头像图片,
        selectPlayerPortraitImage: 选择主角立绘图片,
        clearPlayerPortraitImage: 清除主角立绘图片,
        removePlayerImageRecord: 删除主角图片记录,
        generatePlayerImageManually: 生成主角图片,
        generatePlayerImagesAutomatically: 自动生成主角图片,
        ensurePlayerAvatarEachTurn: 检查主角每回合头像,
        generatePlayerSecretPartImage: 生成主角私密部位图片
    } = 创建主角图片工作流({
        获取角色: () => 角色,
        设置角色,
        规范化角色物品容器映射,
        执行自动存档: performAutoSave,
        获取历史记录: () => 历史记录,
        推送右下角提示,
        加载NPC生图工作流,
        apiConfig,
        获取文生图接口配置,
        获取生图词组转化器接口配置,
        获取生图画师串预设,
        获取当前PNG画风预设: (presetId?: string) => 获取当前PNG画风预设摘要(presetId, 'npc'),
        读取主角角色锚点,
        提取主角角色锚点,
        自动角色锚点已启用,
        获取词组转化器预设提示词,
        接口配置是否可用,
        读取文生图功能配置,
        主角生图进行中集合: 主角生图进行中Ref.current,
        提取主角生图基础数据,
        创建NPC生图任务,
        生成NPC生图记录ID,
        追加NPC生图任务,
        更新NPC生图任务,
        构建文生图额外要求
    });
    主角自动生图处理器Ref.current = (player: 角色数据结构) => {
        if (typeof 自动生成主角图片 !== 'function') {
            console.warn('主角自动生图方法尚未就绪，跳过本次自动触发');
            return;
        }
        void 自动生成主角图片(player).catch(() => undefined);
    };
    主角每回合生图检查器Ref.current = (player: 角色数据结构) => {
        if (typeof 检查主角每回合头像 !== 'function') {
            console.warn('主角每回合头像检查方法尚未就绪，跳过本次自动触发');
            return;
        }
        void 检查主角每回合头像(player).catch(() => undefined);
    };

    const 最新AI回合可继续变量生成 = 最新AI消息可继续变量生成(历史记录);

    return {
        state: gameState,
        meta: {
            canRerollLatest: 可重Roll计数 > 0,
            reRollCount: 可重Roll计数,
            canRetryLatestVariableGeneration: 可重Roll计数 > 0 && 最新AI回合可继续变量生成,
            canQuickRestart: Boolean(最近开局配置),
            worldEvolutionEnabled: 已进入主剧情回合() && apiConfig?.功能模型占位?.世界演变功能启用 !== false && 接口配置是否可用(获取世界演变接口配置(apiConfig)),
            worldEvolutionUpdating: 世界演变更新中,
            worldEvolutionStatus: 世界演变状态文本,
            worldEvolutionLastUpdatedAt: 世界演变最近更新时间,
            worldEvolutionLastSummary: 世界演变最近摘要,
            worldEvolutionLastRawText: 世界演变最近原始消息,
            memorySummaryOpen: Boolean(待处理记忆总结任务) && 记忆总结阶段 === 'review' && Boolean(记忆总结错误),
            memorySummaryTask: 待处理记忆总结任务,
            memorySummaryDraft: 记忆总结草稿,
            memorySummaryError: 记忆总结错误,
            npcMemorySummaryOpen: !Boolean(待处理记忆总结任务) && Boolean(待处理NPC记忆总结队列[0]) && NPC记忆总结阶段 === 'review' && Boolean(NPC记忆总结错误),
            npcMemorySummaryTask: 待处理NPC记忆总结队列[0] || null,
            npcMemorySummaryDraft: NPC记忆总结草稿,
            npcMemorySummaryError: NPC记忆总结错误,
            npcMemorySummaryQueueLength: 待处理NPC记忆总结队列.length,
            imageGenerationQueue: NPC生图任务队列,
            sceneImageArchive: 场景图片档案,
            sceneImageQueue: 场景生图任务队列,
            variableGenerationRunning: 变量生成中,
            postStoryQueueRunning: 后台队列处理中,
            openingMainStoryProgress: 开局主剧情进度,
            openingPolishProgress: 开局文章优化进度,
            openingWorldEvolutionProgress: 开局世界演变进度,
            openingPlanningProgress: 开局规划进度,
            openingVariableGenerationProgress: 开局变量生成进度,
            openingMapUpdateProgress: 开局地图更新进度,
            builtinPromptEntries: 内置提示词列表,
            worldbooks: 世界书列表,
            worldbookPresetGroups: 世界书预设组列表,
            notifications: 右下角提示列表,
            chatScrollSuppressToken: 聊天区自动滚动抑制令牌,
            chatForceScrollToken: 聊天区强制置底令牌
        },
        setters: {
            setShowSettings, setShowInventory, setShowEquipment, setShowSocial, setShowTeam, setShowWorld, setShowMap, setShowTask, setShowStory, setShowHeroinePlan, setShowDirectorConfig, setShowMemory, setShowSaveLoad,
            setActiveTab, setCurrentTheme,
            setCharacter: 设置角色,
            setWorld: 设置世界
        },
        actions: {
            handleSend,
            handleStop,
            handleCancelVariableGeneration,
            handleRegenerate,
            handleRetryLatestVariableGeneration,
            handlePolishTurn,
            handleRecoverFromParseErrorRaw,
            saveSettings, saveVisualSettings, saveImageManagerSettings, saveGameSettings, saveMemorySettings,
            saveBuiltinPromptEntries,
            saveWorldbooks, saveWorldbookPresetGroups,
            updatePrompts,
            handleSaveGame, handleLoadGame, performAutoSave,
            updateHistoryItem,
            updateMemorySystem,
            updateDirectorConfig: 应用导演配置,
            createNpcManually,
            updateNpcManually,
            deleteNpcManually,
            restoreNpcVariableBackup,
            uploadNpcImageToSlot,
            updateRuntimeVariableSection,
            applyRuntimeVariableCommand,
            handleStartNewGameWizard,
            handleGenerateWorld,
            handleQuickRestart,
            handleReturnToHome,
            updateNpcMajorRole,
            updateNpcPresence,
            removeNpc,
            removeTask,
            generateNpcImageManually,
            generateNpcSecretPartImage,
            retryNpcImageGeneration,
            updatePlayerAvatar: 更新玩家头像,
            generatePlayerImageManually: 生成主角图片,
            generatePlayerSecretPartImage: 生成主角私密部位图片,
            selectPlayerAvatarImage: 选择主角头像图片,
            clearPlayerAvatarImage: 清除主角头像图片,
            selectPlayerPortraitImage: 选择主角立绘图片,
            clearPlayerPortraitImage: 清除主角立绘图片,
            removePlayerImageRecord: 删除主角图片记录,
            generateSceneImageManually: 生成场景壁纸,
            selectNpcAvatarImage: 选择NPC头像图片,
            selectNpcPortraitImage: 选择NPC立绘图片,
            selectNpcBackgroundImage: 选择NPC背景图片,
            clearNpcAvatarImage: 清除NPC头像图片,
            clearNpcPortraitImage: 清除NPC立绘图片,
            clearNpcBackgroundImage: 清除NPC背景图片,
            removeNpcImageRecord: 删除NPC图片记录,
            clearNpcImageHistory: 清空NPC图片历史,
            removeNpcImageQueueTask: 删除NPC生图任务,
            clearNpcImageQueue: 清空NPC生图任务队列,
            saveNpcImageLocally: 保存NPC图片本地副本,
            applySceneImageWallpaper: 应用场景图片为壁纸,
            clearSceneWallpaper: 清除场景壁纸,
            removeSceneImageRecord: 删除场景图片记录,
            clearSceneImageHistory: 清空场景图片历史,
            removeSceneImageQueueTask: 删除场景生图任务,
            clearSceneImageQueue: 清空场景生图任务队列,
            clearItemImageHistory: 清空物品图片历史,
            saveSceneImageLocally: 保存场景图片本地副本,
            dismissNotification: 关闭右下角提示,
            handleForceWorldEvolutionUpdate,
            getContextSnapshot: buildContextSnapshot,
            handleStartMemorySummary,
            handleCancelMemorySummary,
            handleBackToMemorySummaryRemind,
            handleUpdateMemorySummaryDraft,
            handleStartManualMemorySummary,
            handleApplyMemorySummary,
            handleStartNpcMemorySummary,
            handleCancelNpcMemorySummary,
            handleBackToNpcMemorySummaryRemind,
            handleUpdateNpcMemorySummaryDraft,
            handleQueueManualNpcMemorySummary,
            handleApplyNpcMemorySummary,
            saveCharacterAnchor: 保存角色锚点,
            deleteCharacterAnchor: 删除角色锚点,
            getPlayerCharacterAnchor: 读取主角角色锚点,
            extractCharacterAnchor: 提取角色锚点,
            extractPlayerCharacterAnchor: 提取主角角色锚点,
            savePngStylePreset: 保存PNG画风预设,
            deletePngStylePreset: 删除PNG画风预设,
            setCurrentPngStylePreset: 设置当前PNG画风预设,
            parsePngStylePreset,
            exportPngStylePresets: 导出PNG画风预设,
            importPngStylePresets: 导入PNG画风预设,
            setPersistentWallpaper: 设置常驻壁纸,
            clearPersistentWallpaper: 清除常驻壁纸,
            pushNotification: 推送右下角提示
        }
    };
};
