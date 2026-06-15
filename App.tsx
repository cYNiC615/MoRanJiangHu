import React from 'react';
import TopBar from './components/layout/TopBar';
import LeftPanel from './components/layout/LeftPanel';
import RightPanel from './components/layout/RightPanel';
import ChatList from './components/features/Chat/ChatList';
import InputArea from './components/features/Chat/InputArea';
import LandingPage from './components/layout/LandingPage';
import InAppConfirmModal, { ConfirmOptions } from './components/ui/InAppConfirmModal';
import { useGame } from './hooks/useGame';
import { use图片资源回源预取 } from './hooks/useImageAssetPrefetch';
import { 环境时间转标准串 } from './hooks/useGame/timeUtils';
import { 获取主剧情接口配置, 获取文生图接口配置, 获取生图词组转化器接口配置, 获取记忆精炼接口配置, 接口配置是否可用 } from './utils/apiConfig';
import { 请求模型文本 } from './services/ai/chatCompletionClient';
import { 记忆精炼系统提示词 } from './prompts/runtime/memoryRefine';
import { 同人运行时模式已启用 } from './prompts/runtime/fandom';
import { 获取内置世界书槽位内容 } from './utils/worldbook';
import { 生成地图更新 } from './hooks/useGame/mapUpdateWorkflow';
import { 构建字体注入样式文本, 构建UI文字CSS变量 } from './utils/visualSettings';
import { 获取图片资源文本地址, 读取远程图片兜底资源ID } from './utils/imageAssets';
import { 生成物品图标 } from './services/ai/itemImageGeneration';
import { 合并物品图片档案, 获取物品图标复用Key, 物品已有可用图标, 获取物品已选图标地址 } from './utils/itemImage';
import { 生图最大自动重试次数, 执行生图模型调用带重试, 读取生图错误文本 } from './utils/imageGenerationRetry';
import { 丢弃背包物品, 是否杂物类物品 } from './utils/inventoryActions';
import { isDynamicImportFetchError, lazyImportWithReload } from './utils/lazyImportWithReload';
import { RELEASE_INFO } from './data/releaseInfo';
import { 获取题材界面文案 } from './utils/resourceLabels';
import { 获取题材顶部时间显示格式 } from './utils/modeRuntimeProfile';
import { 整理世界状态客户可见大事 } from './hooks/useGame/worldEvolutionUtils';
import { 分配角色属性点, type 可分配六维属性键 } from './utils/characterAttributePoints';
import { getDiagnosticLogs, recordDiagnosticLog, subscribeDiagnosticLogs } from './services/diagnosticLog';
import { 获取本地图片图床迁移状态, 启动旧存档谱系迁移, 读取旧存档谱系迁移状态, 读取图片资源兜底地址, 订阅旧存档谱系迁移状态, 订阅本地图片图床迁移状态, 执行延迟上传队列, type 旧存档谱系迁移状态, type 本地图片图床迁移状态 } from './services/dbService';
import './services/diagnosticLog';
import type { 物品生图结果 } from './types';
import type { 游戏物品 } from './models/item';

const DESKTOP_DETAIL_WIDTHS_STORAGE_KEY = 'moranjianghu.desktopRightDetailWidths.v3';
const DESKTOP_DETAIL_MIN_WIDTH = 520;
const DESKTOP_DETAIL_MAX_WIDTH = 1160;
const DESKTOP_DETAIL_RIGHT_GAP = 12;
const ITEM_AUTO_IMAGE_RETRY_INTERVAL = 10 * 60 * 1000;
const ITEM_AUTO_IMAGE_AFTER_CHARACTER_SCENE_IDLE_DELAY = 2500;
const ITEM_AUTO_IMAGE_RECENT_SUCCESS_TTL = 10 * 60 * 1000;
const ITEM_AUTO_IMAGE_BACKEND_FAILURE_COOLDOWN_MS = 15 * 60 * 1000;
const DIAGNOSTIC_ERROR_TOAST_COOLDOWN_MS = 90 * 1000;
const getDesktopDetailDefaultWidth = (_panelId: string | null): number => {
    return DESKTOP_DETAIL_MAX_WIDTH;
};

const 获取物品自动生图Key = (item: any): string => 获取物品图标复用Key(item);

const 是同类物品图标复用目标 = (left: any, right: any): boolean => (
    获取物品图标复用Key(left) === 获取物品图标复用Key(right)
);

const 复用物品图片档案 = (targetItem: 游戏物品, sourceItem: 游戏物品): 游戏物品 => ({
    ...(targetItem as any),
    图片档案: sourceItem.图片档案
});

const 是生图后端不可用错误文本 = (message: string): boolean => (
    /ComfyUI\s*未返回\s*prompt_id|ComfyUI\s*连接失败|不是可用的\s*ComfyUI|HTTP\s*200.*text\/html|Content-Type:\s*text\/html|服务端返回的是\s*HTML|地址已失效|地址失效|工作区休眠|登录页|代理页面|错误页面|CNB\s*8188/i.test(message)
);

type 物品自动生图近期结果 = {
    completedAt: number;
    recordId: string;
    nextItem: 游戏物品;
};

type 本回合变化区域 = '角色' | '背包' | '装备' | '战斗' | '队伍' | '社交' | '功法' | '地图' | '玩家门派' | '任务列表' | '约定列表' | '世界' | '剧情' | '剧情规划' | '记忆系统';

const 旧图迁移阶段文案: Record<本地图片图床迁移状态['stage'], string> = {
    idle: '等待扫描',
    scanning: '正在扫描',
    running: '正在迁移',
    completed: '迁移完成',
    partial_failed: '部分完成',
    failed: '迁移失败'
};

const 旧图迁移提示条: React.FC<{
    status: 本地图片图床迁移状态;
    onClose: () => void;
}> = ({ status, onClose }) => {
    const total = Math.max(0, Number(status.totalAssets) || 0);
    const processed = Math.min(total, Math.max(0, Number(status.processedAssets) || 0));
    const percent = total > 0 ? Math.round((processed / total) * 100) : (status.stage === 'completed' ? 100 : 0);
    const isActive = status.stage === 'scanning' || status.stage === 'running';
    const isFailed = status.stage === 'failed' || status.stage === 'partial_failed';
    const title = isActive ? '旧存档图片正在自动迁移' : isFailed ? '旧存档图片迁移需要重试' : '旧存档图片迁移完成';
    const message = isActive
        ? '系统正在后台把旧存档本地图片上传到图床。可以关闭此提示并继续使用；如果关闭网页，未完成部分会在下次打开时继续扫描和重试。'
        : isFailed
            ? '部分图片暂时未迁移成功，原图会保留，后续会自动重试。已迁移成功的内容重新加载存档后会切换为图床链接。'
            : '图片来源已写回本地存档。请重新加载当前存档，游戏内图片才会完整切换为图床链接。';

    return (
        <div className="fixed left-1/2 top-4 z-[10020] w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 pointer-events-auto">
            <div className={`rounded-xl border px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-md ${
                isFailed
                    ? 'border-amber-500/50 bg-amber-950/90 text-amber-50'
                    : isActive
                        ? 'border-sky-500/50 bg-sky-950/90 text-sky-50'
                        : 'border-emerald-500/50 bg-emerald-950/90 text-emerald-50'
            }`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold" style={{ fontSize: 'var(--ui-compact-font-size, 14px)' }}>{title}</div>
                            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] opacity-90">{旧图迁移阶段文案[status.stage]}</span>
                        </div>
                        <div className="mt-1 opacity-90" style={{ fontSize: 'var(--ui-compact-font-size, 14px)', lineHeight: '1.55' }}>{message}</div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] opacity-85">
                                <span>{status.lastMessage || '正在等待迁移进度更新'}</span>
                                <span>{total > 0 ? `${processed}/${total}` : `${percent}%`}</span>
                            </div>
                            <div className="h-2 rounded-full bg-black/45 border border-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isFailed ? 'bg-amber-300' : isActive ? 'bg-sky-300' : 'bg-emerald-300'} ${isActive ? 'animate-pulse' : ''}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] opacity-80">
                                <span>已迁移 {status.migratedAssets} 张</span>
                                <span>更新存档 {status.updatedSaves} 个</span>
                                {status.failedAssets > 0 && <span>失败 {status.failedAssets} 张</span>}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded border border-white/20 px-2 py-1 text-xs opacity-75 hover:opacity-100 hover:bg-white/10"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

const 旧存档谱系迁移提示条: React.FC<{
    status: 旧存档谱系迁移状态;
    onClose: () => void;
}> = ({ status, onClose }) => {
    const total = Math.max(0, Number(status.legacySaves) || 0);
    const done = Math.min(total, Math.max(0, Number(status.convertedSaves || 0) + Number(status.failedSaves || 0)));
    const percent = total > 0 ? Math.round((done / total) * 100) : (status.stage === 'completed' ? 100 : 0);
    const isActive = status.stage === 'scanning' || status.stage === 'running';
    const isFailed = status.stage === 'failed';

    return (
        <div className="fixed left-1/2 top-4 z-[10025] w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 pointer-events-auto">
            <div className={`rounded-xl border px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-md ${
                isFailed
                    ? 'border-amber-500/50 bg-amber-950/90 text-amber-50'
                    : isActive
                        ? 'border-sky-500/50 bg-sky-950/90 text-sky-50'
                        : 'border-emerald-500/50 bg-emerald-950/90 text-emerald-50'
            }`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold" style={{ fontSize: 'var(--ui-compact-font-size, 14px)' }}>旧存档正在转换为新谱系</div>
                            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] opacity-90">{status.stage === 'scanning' ? '扫描中' : status.stage === 'running' ? '转换中' : status.stage === 'completed' ? '已完成' : '需重试'}</span>
                        </div>
                        <div className="mt-1 opacity-90" style={{ fontSize: 'var(--ui-compact-font-size, 14px)', lineHeight: '1.55' }}>
                            旧存档会保留原文件，只补上时间树谱系信息。可以关闭提示继续使用；未完成部分下次进入会继续转换，也可在“重入江湖”页面查看进度。
                        </div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] opacity-85">
                                <span>{status.lastMessage || '正在等待转换进度更新'}</span>
                                <span>{total > 0 ? `${done}/${total}` : `${percent}%`}</span>
                            </div>
                            <div className="h-2 rounded-full bg-black/45 border border-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isFailed ? 'bg-amber-300' : isActive ? 'bg-sky-300' : 'bg-emerald-300'} ${isActive ? 'animate-pulse' : ''}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] opacity-80">
                                <span>旧存档 {status.legacySaves} 个</span>
                                <span>已转换 {status.convertedSaves} 个</span>
                                {status.failedSaves > 0 && <span>待重试 {status.failedSaves} 个</span>}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded border border-white/20 px-2 py-1 text-xs opacity-75 hover:opacity-100 hover:bg-white/10"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

const 提取本回合变化区域 = (commands: any[]): 本回合变化区域[] => {
    const areas = new Set<本回合变化区域>();
    (Array.isArray(commands) ? commands : []).forEach((cmd) => {
        const key = typeof cmd?.key === 'string' ? cmd.key : '';
        if (!key) return;
        if (key.includes('角色.物品列表')) areas.add('背包');
        if (key.includes('角色.装备')) areas.add('装备');
        if (key.includes('角色.功法列表')) areas.add('功法');
        if (key.includes('角色.当前坐标') || key.includes('世界.地图')) areas.add('地图');
        if (key.includes('角色.') || key.startsWith('角色.')) areas.add('角色');
        if (key.includes('战斗')) areas.add('战斗');
        if (key.includes('社交')) areas.add('社交');
        if (key.includes('队伍') || key.includes('是否队友')) areas.add('队伍');
        if (key.includes('玩家门派')) areas.add('玩家门派');
        if (key.includes('任务列表')) areas.add('任务列表');
        if (key.includes('约定列表')) areas.add('约定列表');
        if (key.includes('世界')) areas.add('世界');
        if (key.includes('剧情规划') || key.includes('女主剧情规划') || key.includes('同人剧情规划') || key.includes('同人女主剧情规划')) {
            areas.add('剧情规划');
        } else if (key.includes('剧情')) {
            areas.add('剧情');
        }
        if (key.includes('记忆')) areas.add('记忆系统');
    });
    return [...areas];
};

const 是同一个物品 = (left: any, right: any): boolean => {
    const leftId = typeof left?.ID === 'string' ? left.ID.trim() : '';
    const rightId = typeof right?.ID === 'string' ? right.ID.trim() : '';
    if (leftId && rightId) return leftId === rightId;
    return Boolean(left?.名称 && right?.名称 && left.名称 === right.名称);
};

const clampDesktopDetailWidth = (value: number): number => {
    const viewportLimit = typeof window === 'undefined'
        ? DESKTOP_DETAIL_MAX_WIDTH
        : Math.max(DESKTOP_DETAIL_MIN_WIDTH, window.innerWidth - 200);
    return Math.round(Math.max(
        DESKTOP_DETAIL_MIN_WIDTH,
        Math.min(value, DESKTOP_DETAIL_MAX_WIDTH, viewportLimit)
    ));
};

const readDesktopDetailWidths = (): Record<string, number> => {
    if (typeof window === 'undefined') return {};
    try {
        const parsed = JSON.parse(window.localStorage.getItem(DESKTOP_DETAIL_WIDTHS_STORAGE_KEY) || '{}');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return Object.entries(parsed).reduce<Record<string, number>>((acc, [key, value]) => {
            const numeric = Number(value);
            if (Number.isFinite(numeric)) acc[key] = clampDesktopDetailWidth(numeric);
            return acc;
        }, {});
    } catch {
        return {};
    }
};

type 可预加载组件<T extends React.ComponentType<any>> = React.LazyExoticComponent<T> & {
    preload?: () => Promise<unknown>;
    importKey: string;
};

const 创建可预加载懒组件 = <T extends React.ComponentType<any>>(
    importKey: string,
    loader: () => Promise<{ default: T }>
): 可预加载组件<T> => {
    const wrappedLoader = () => lazyImportWithReload(importKey, loader);
    const Component = React.lazy(wrappedLoader) as 可预加载组件<T>;
    Component.preload = wrappedLoader;
    Component.importKey = importKey;
    return Component;
};

const CharacterModal = 创建可预加载懒组件('character-modal', () => import('./components/features/Character/CharacterModal'));
const NewGameWizard = 创建可预加载懒组件('new-game-wizard', () => import('./components/features/NewGame/NewGameWizard'));
const SettingsModal = 创建可预加载懒组件('settings-modal', () => import('./components/features/Settings/SettingsModal'));
const InventoryModal = 创建可预加载懒组件('inventory-modal', () => import('./components/features/Inventory/InventoryModal'));
const EquipmentModal = 创建可预加载懒组件('equipment-modal', () => import('./components/features/Equipment/EquipmentModal'));
const SocialModal = 创建可预加载懒组件('social-modal', () => import('./components/features/Social/SocialModal'));
const ImageManagerModal = 创建可预加载懒组件('image-manager-modal', () => import('./components/features/Social/ImageManagerModal'));
const WorldbookManagerModal = 创建可预加载懒组件('worldbook-manager-modal', () => import('./components/features/Worldbook/WorldbookManagerModal'));
const TeamModal = 创建可预加载懒组件('team-modal', () => import('./components/features/Team/TeamModal'));
const WorldModal = 创建可预加载懒组件('world-modal', () => import('./components/features/World/WorldModal'));
const MapModal = 创建可预加载懒组件('map-modal', () => import('./components/features/Map/MapModal'));
const TaskModal = 创建可预加载懒组件('task-modal', () => import('./components/features/Task/TaskModal'));
const AgreementModal = 创建可预加载懒组件('agreement-modal', () => import('./components/features/Agreement/AgreementModal'));
const StoryModal = 创建可预加载懒组件('story-modal', () => import('./components/features/Story/StoryModal'));
const HeroinePlanModal = 创建可预加载懒组件('heroine-plan-modal', () => import('./components/features/Story/HeroinePlanModal'));
const NovelExportModal = 创建可预加载懒组件('novel-export-modal', () => import('./components/features/Story/NovelExportModal'));
const MemoryModal = 创建可预加载懒组件('memory-modal', () => import('./components/features/Memory/MemoryModal'));
const MemorySummaryFlowModal = 创建可预加载懒组件('memory-summary-flow-modal', () => import('./components/features/Memory/MemorySummaryFlowModal'));
const NpcMemorySummaryFlowModal = 创建可预加载懒组件('npc-memory-summary-flow-modal', () => import('./components/features/Memory/NpcMemorySummaryFlowModal'));
const SaveLoadModal = 创建可预加载懒组件('save-load-modal', () => import('./components/features/SaveLoad/SaveLoadModal'));


type 可选网络信息 = {
    downlink?: number;
    effectiveType?: string;
    saveData?: boolean;
};

const 桌面轻量预热目标 = [
    CharacterModal,
    SettingsModal,
    InventoryModal,
    EquipmentModal,
    TeamModal,
    SocialModal,
    WorldModal,
    MapModal,
    TaskModal,
    AgreementModal,
    StoryModal,
    HeroinePlanModal,
    MemoryModal,
    SaveLoadModal,
    NovelExportModal
] as const;

const 网络较慢或节省流量 = (connection?: 可选网络信息 | null): boolean => {
    if (!connection) return false;
    if (connection.saveData) return true;
    const effectiveType = typeof connection.effectiveType === 'string'
        ? connection.effectiveType.toLowerCase()
        : '';
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return true;
    if (typeof connection.downlink === 'number' && Number.isFinite(connection.downlink) && connection.downlink < 1.5) {
        return true;
    }
    return false;
};
const 懒加载占位: React.FC = () => (
    <div className="lazy-scroll-loading pointer-events-none fixed inset-0 z-[260] flex items-center justify-center bg-[#f8f4e8]/70 px-6 py-10 text-center backdrop-blur-[2px]">
        <div
            className="lazy-scroll-shell rounded-2xl border border-wuxia-gold/35 bg-[#fffaf0]/95 px-6 py-5 text-[#7a4a1f] shadow-[0_18px_42px_rgba(120,82,38,0.18)]"
            style={{ fontSize: 'var(--ui-compact-font-size, 14px)' }}
        >
            <div className="lazy-scroll-title tracking-[0.22em]">卷轴展开中…</div>
            <div className="lazy-scroll-skeleton mt-5 grid gap-3 text-left" aria-hidden="true">
                <div className="h-4 w-28 rounded-full bg-wuxia-gold/20" />
                <div className="h-20 rounded-xl border border-wuxia-gold/20 bg-white/60" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-lg border border-wuxia-gold/15 bg-white/55" />
                    <div className="h-16 rounded-lg border border-wuxia-gold/15 bg-white/55" />
                </div>
            </div>
        </div>
    </div>
);

const 懒加载边界: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <React.Suspense fallback={<懒加载占位 />}>{children}</React.Suspense>
);


class ModalErrorBoundary extends React.Component<
    { children: React.ReactNode; title: string; onClose?: () => void },
    { error: Error | null }
> {
    state: { error: Error | null } = { error: null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error('Modal render failed:', error);
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        const isLazyImportError = isDynamicImportFetchError(this.state.error);
        return (
            <div className="fixed inset-0 z-[280] flex items-center justify-center bg-black/88 px-5 py-8">
                <div className="w-full max-w-md rounded-2xl border border-red-500/45 bg-[#120909] p-5 text-red-100 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                    <div className="text-base font-semibold tracking-[0.12em] text-red-200">{this.props.title}</div>
                    <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-red-100/90">
                        {this.state.error.message || '界面渲染失败'}
                    </div>
                    <div className="mt-4 text-xs leading-5 text-red-200/70">
                        {isLazyImportError
                            ? '检测到页面资源已经更新，但当前页面还停留在旧版本。点击下面按钮刷新后，通常就能直接恢复。'
                            : '这次错误已写入运行日志。可打开“设置 → 运行日志”查看详情、复制诊断或点击“上报日志”提交给维护人员。'}
                    </div>
                    {isLazyImportError && (
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-wuxia-gold/35 bg-wuxia-gold/10 px-4 text-sm text-wuxia-gold"
                        >
                            刷新重试
                        </button>
                    )}
                    {this.props.onClose && (
                        <button
                            type="button"
                            onClick={this.props.onClose}
                            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-red-300/40 bg-red-950/40 px-4 text-sm text-red-50"
                        >
                            关闭
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

const App: React.FC = () => {
    const { state, meta, setters, actions } = useGame();
    const safeGameConfig = state.gameConfig ?? ({} as typeof state.gameConfig);
    const safeCharacter = state.角色 ?? ({} as typeof state.角色);
    const safeShowSaveLoad = state.showSaveLoad ?? { show: false, mode: 'save' as const };
    const latestCharacterRef = React.useRef(state.角色);
    React.useEffect(() => {
        latestCharacterRef.current = state.角色;
    }, [state.角色]);
    const [showCharacter, setShowCharacter] = React.useState(false);
    const [showImageManager, setShowImageManager] = React.useState(false);
    const [showWorldbookManager, setShowWorldbookManager] = React.useState(false);
    const [showNovelExport, setShowNovelExport] = React.useState(false);
    const [mapRegenerateRawText, setMapRegenerateRawText] = React.useState('');
    const [chatContentHidden, setChatContentHidden] = React.useState(false);
    const [sceneQuickGenHint, setSceneQuickGenHint] = React.useState(false);
    const [sceneQuickGenToastVisible, setSceneQuickGenToastVisible] = React.useState(false);
    const [contextSnapshot, setContextSnapshot] = React.useState<Awaited<ReturnType<typeof actions.getContextSnapshot>> | undefined>(undefined);
    const [returnHomeSaving, setReturnHomeSaving] = React.useState(false);
    const [legacyImageMigrationStatus, setLegacyImageMigrationStatus] = React.useState(() => 获取本地图片图床迁移状态());
    const [legacyImageMigrationNoticeClosed, setLegacyImageMigrationNoticeClosed] = React.useState(false);
    const [legacySaveLineageMigrationStatus, setLegacySaveLineageMigrationStatus] = React.useState(() => 读取旧存档谱系迁移状态());
    const [legacySaveLineageMigrationNoticeClosed, setLegacySaveLineageMigrationNoticeClosed] = React.useState(false);
    const [selectedSocialNpcId, setSelectedSocialNpcId] = React.useState<string | null>(null);
    const [inventoryInitialItemRef, setInventoryInitialItemRef] = React.useState('');
    const [desktopDetailFullscreen, setDesktopDetailFullscreen] = React.useState(false);
    const [desktopDetailWidths, setDesktopDetailWidths] = React.useState<Record<string, number>>(() => readDesktopDetailWidths());
    const [viewportWidth, setViewportWidth] = React.useState<number>(() => {
        if (typeof window === 'undefined') return 1280;
        return window.innerWidth;
    });
    const autoItemImageRunningRef = React.useRef<Set<string>>(new Set());
    const autoItemImageScheduledRef = React.useRef<Set<string>>(new Set());
    const autoItemImageRecentSuccessRef = React.useRef<Map<string, 物品自动生图近期结果>>(new Map());
    const autoItemImageFailedAtRef = React.useRef<Map<string, number>>(new Map());
    const autoItemImageBackendCooldownUntilRef = React.useRef(0);
    const autoItemImageWakeTimerRef = React.useRef<number | null>(null);
    const [autoItemImageWakeTick, setAutoItemImageWakeTick] = React.useState(0);
    const 最近运行报错提示IDRef = React.useRef('');
    const 最近运行报错提示时间Ref = React.useRef(0);
    const legacyImageMigrationNoticeStageRef = React.useRef(legacyImageMigrationStatus.stage);
    const legacySaveLineageMigrationNoticeStageRef = React.useRef(legacySaveLineageMigrationStatus.stage);
    const 唤醒物品自动生图扫描 = React.useCallback((delayMs = 0) => {
        if (typeof window === 'undefined') return;
        if (autoItemImageWakeTimerRef.current !== null) {
            window.clearTimeout(autoItemImageWakeTimerRef.current);
            autoItemImageWakeTimerRef.current = null;
        }
        autoItemImageWakeTimerRef.current = window.setTimeout(() => {
            autoItemImageWakeTimerRef.current = null;
            setAutoItemImageWakeTick((value) => (value + 1) % 1_000_000);
        }, Math.max(0, delayMs));
    }, []);
    React.useEffect(() => () => {
        if (autoItemImageWakeTimerRef.current !== null) {
            window.clearTimeout(autoItemImageWakeTimerRef.current);
            autoItemImageWakeTimerRef.current = null;
        }
    }, []);
    React.useEffect(() => {
        const handleImageError = (event: Event) => {
            const target = event.target;
            if (!(target instanceof HTMLImageElement)) return;
            if (target.dataset.moranjianghuFallbackApplied === '1') return;
            const sourceUrl = target.currentSrc || target.src;
            const fallbackAssetId = 读取远程图片兜底资源ID(sourceUrl);
            if (!fallbackAssetId) return;
            target.dataset.moranjianghuFallbackApplied = '1';
            void 读取图片资源兜底地址(fallbackAssetId).then((fallbackSrc) => {
                if (fallbackSrc) target.src = fallbackSrc;
            });
        };
        window.addEventListener('error', handleImageError, true);
        return () => {
            window.removeEventListener('error', handleImageError, true);
        };
    }, []);
    React.useEffect(() => 订阅本地图片图床迁移状态((status) => {
        setLegacyImageMigrationStatus(status);
        if (legacyImageMigrationNoticeStageRef.current !== status.stage) {
            legacyImageMigrationNoticeStageRef.current = status.stage;
            setLegacyImageMigrationNoticeClosed(false);
        }
    }), []);
    React.useEffect(() => 订阅旧存档谱系迁移状态((status) => {
        setLegacySaveLineageMigrationStatus(status);
        if (legacySaveLineageMigrationNoticeStageRef.current !== status.stage) {
            legacySaveLineageMigrationNoticeStageRef.current = status.stage;
            setLegacySaveLineageMigrationNoticeClosed(false);
        }
    }), []);
    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            void 启动旧存档谱系迁移();
        }, 900);
        return () => window.clearTimeout(timer);
    }, []);
    React.useEffect(() => {
        const subscribedAt = Date.now();
        const unsubscribe = subscribeDiagnosticLogs(() => {
            const latestError = getDiagnosticLogs().find((entry) => {
                if (entry.level !== 'error') return false;
                const entryTime = Date.parse(entry.time);
                return Number.isFinite(entryTime) && entryTime >= subscribedAt;
            });
            if (!latestError || 最近运行报错提示IDRef.current === latestError.id) return;
            const now = Date.now();
            if (now - 最近运行报错提示时间Ref.current < DIAGNOSTIC_ERROR_TOAST_COOLDOWN_MS) {
                最近运行报错提示IDRef.current = latestError.id;
                return;
            }
            最近运行报错提示IDRef.current = latestError.id;
            最近运行报错提示时间Ref.current = now;
            actions.pushNotification({
                title: '运行报错已记录',
                message: '可打开“设置 → 运行日志”查看详情、复制诊断或点击“上报日志”提交给维护人员。',
                tone: 'error'
            });
        });
        return unsubscribe;
    }, [actions]);
    React.useEffect(() => {
        const shouldBuildSnapshot = state.showSettings
            && (state.activeTab === 'context' || state.activeTab === 'prompt');
        if (!shouldBuildSnapshot) {
            setContextSnapshot(undefined);
            return;
        }
        if (typeof window === 'undefined') {
            void actions.getContextSnapshot().then((snapshot) => {
                setContextSnapshot(snapshot);
            });
            return;
        }

        let cancelled = false;
        const idleWindow = window as typeof window & {
            requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        let idleId: number | null = null;
        let timerId: number | null = null;

        const buildSnapshot = async () => {
            if (cancelled) return;
            const nextSnapshot = await actions.getContextSnapshot();
            if (!cancelled) {
                setContextSnapshot(nextSnapshot);
            }
        };

        if (typeof idleWindow.requestIdleCallback === 'function') {
            idleId = idleWindow.requestIdleCallback(() => buildSnapshot(), { timeout: 180 });
        } else {
            timerId = window.setTimeout(buildSnapshot, 0);
        }

        return () => {
            cancelled = true;
            if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
                idleWindow.cancelIdleCallback(idleId);
            }
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
        };
    }, [
        state.showSettings,
        state.activeTab,
        state.apiConfig,
        state.gameConfig,
        state.memoryConfig,
        state.prompts,
        state.历史记录,
        state.记忆系统,
        state.社交,
        state.角色,
        state.环境,
        state.世界,
        state.战斗,
        state.玩家门派,
        state.任务列表,
        state.约定列表,
        state.剧情,
        state.女主剧情规划,
        state.开局配置,
        meta.builtinPromptEntries,
        meta.worldbooks
    ]);
    React.useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const previousHtmlBackground = html.style.backgroundColor;
        const previousBodyBackground = body.style.backgroundColor;

        html.style.backgroundColor = '#0e0d0b';
        body.style.backgroundColor = '#0e0d0b';

        return () => {
            html.style.backgroundColor = previousHtmlBackground;
            body.style.backgroundColor = previousBodyBackground;
        };
    }, []);
    const confirmResolverRef = React.useRef<((value: boolean) => void) | null>(null);
    const [confirmState, setConfirmState] = React.useState<(ConfirmOptions & { open: boolean })>({
        open: false,
        title: '请确认',
        message: '',
        confirmText: '确认',
        cancelText: '取消',
        danger: false
    });

    const requestConfirm = React.useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            confirmResolverRef.current = resolve;
            setConfirmState({
                open: true,
                title: options.title || '请确认',
                message: options.message,
                confirmText: options.confirmText || '确认',
                cancelText: options.cancelText || '取消',
                danger: options.danger || false
            });
        });
    }, []);

    const resolveConfirm = React.useCallback((accepted: boolean) => {
        if (confirmResolverRef.current) {
            confirmResolverRef.current(accepted);
            confirmResolverRef.current = null;
        }
        setConfirmState((prev) => ({ ...prev, open: false }));
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const update = () => setViewportWidth(window.innerWidth);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    React.useEffect(() => {
        if (state.view !== 'game' || typeof window === 'undefined') return;

        let cancelled = false;
        const connection = (
            navigator as Navigator & {
                connection?: 可选网络信息;
                mozConnection?: 可选网络信息;
                webkitConnection?: 可选网络信息;
            }
        ).connection
            || (navigator as Navigator & { mozConnection?: 可选网络信息 }).mozConnection
            || (navigator as Navigator & { webkitConnection?: 可选网络信息 }).webkitConnection
            || null;
        const preloadTargets = 网络较慢或节省流量(connection)
            ? []
            : 桌面轻量预热目标;
        const idleWindow = window as typeof window & {
            requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        let idleId: number | null = null;
        let timerId: number | null = null;

        const warmup = () => {
            if (cancelled || preloadTargets.length === 0) return;
            const priorityCount = 9;
            preloadTargets.forEach((target, index) => {
                const delay = index < priorityCount
                    ? 240 + index * 140
                    : 1800 + (index - priorityCount) * 320;
                window.setTimeout(() => {
                    if (cancelled) return;
                    void target.preload?.().catch((error) => {
                        if (isDynamicImportFetchError(error)) {
                            console.warn('Lazy module warmup skipped after version update:', target.importKey, error);
                            return;
                        }
                        console.warn('Lazy module warmup failed:', target.importKey, error);
                    });
                }, delay);
            });
        };

        if (typeof idleWindow.requestIdleCallback === 'function') {
            idleId = idleWindow.requestIdleCallback(() => warmup(), { timeout: 900 });
        } else {
            timerId = window.setTimeout(warmup, 700);
        }

        return () => {
            cancelled = true;
            if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
                idleWindow.cancelIdleCallback(idleId);
            }
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
        };
    }, [state.view]);

    const parseActionOptionText = (option: unknown): string => {
        if (typeof option === 'string') return option.trim();
        if (typeof option === 'number' || typeof option === 'boolean') return String(option);
        if (option && typeof option === 'object') {
            const obj = option as Record<string, unknown>;
            const candidates = [obj.text, obj.label, obj.action, obj.name, obj.id];
            for (const candidate of candidates) {
                if (typeof candidate === 'string' && candidate.trim().length > 0) {
                    return candidate.trim();
                }
            }
        }
        return '';
    };

    const tickerEvents = React.useMemo(() => {
        return 整理世界状态客户可见大事(state.世界, state.worldEvents);
    }, [state.世界, state.worldEvents]);

    const 启用同人模式 = React.useMemo(
        () => 同人运行时模式已启用(state.开局配置),
        [state.开局配置]
    );
    const 当前剧情规划 = 启用同人模式 ? state.同人剧情规划 : state.剧情规划;
    const 当前女主剧情规划 = 启用同人模式 ? state.同人女主剧情规划 : state.女主剧情规划;

    const renderTickerItems = React.useCallback((items: string[], keyPrefix: string) => (
        items.map((e, i) => (
            <span key={`${keyPrefix}-${i}`} className="mx-5 inline-block">{e}</span>
        ))
    ), []);

    const currentEnvTime = React.useMemo(
        () => 环境时间转标准串(state.环境) || state.环境?.时间 || '未知时间',
        [state.环境]
    );
    const effectiveVisualConfig = state.visualConfig;
    const effectiveTopBarTimeFormat = React.useMemo<'传统' | '数字'>(() => {
        const configured = effectiveVisualConfig?.时间显示格式;
        if (configured === '传统' || configured === '数字') return configured;
        return 获取题材顶部时间显示格式(state.开局配置?.modeRuntimeProfile, state.开局配置?.题材模式);
    }, [effectiveVisualConfig?.时间显示格式, state.开局配置?.modeRuntimeProfile, state.开局配置?.题材模式]);
    use图片资源回源预取(state.角色, effectiveVisualConfig?.背景图片);
    const 当前背景图片地址 = React.useMemo(() => 获取图片资源文本地址(effectiveVisualConfig?.背景图片), [effectiveVisualConfig?.背景图片]);
    const 玩家头像地址 = React.useMemo(() => {
        const archive = state.角色?.图片档案;
        const selectedAvatarId = typeof archive?.已选头像图片ID === 'string' ? archive.已选头像图片ID.trim() : '';
        const selectedAvatar = (Array.isArray(archive?.生图历史) ? archive!.生图历史 : []).find((item: any) => item?.id === selectedAvatarId)
            || (archive?.最近生图结果?.id === selectedAvatarId ? archive.最近生图结果 : null);
        return 获取图片资源文本地址(selectedAvatar?.本地路径 || selectedAvatar?.图片URL || state.角色?.头像图片URL);
    }, [state.角色]);
    const 主角锚点 = React.useMemo(
        () => actions.getPlayerCharacterAnchor?.() || null,
        [actions, state.apiConfig]
    );
    const playerProfile = React.useMemo(
        () => ({
            姓名: state.角色?.姓名,
            头像图片URL: 玩家头像地址,
            天赋列表: Array.isArray(state.角色?.天赋列表) ? state.角色.天赋列表 : [],
            出身背景: state.角色?.出身背景
        }),
        [state.角色?.姓名, 玩家头像地址, state.角色?.天赋列表, state.角色?.出身背景]
    );
    const fontFaceStyleText = React.useMemo(() => 构建字体注入样式文本(effectiveVisualConfig), [effectiveVisualConfig]);
    const uiTextStyleVars = React.useMemo(() => 构建UI文字CSS变量(effectiveVisualConfig), [effectiveVisualConfig]);
    const appUiStyleVars = React.useMemo(() => {
        const runtimeSafeAreaVars = {
            ['--app-safe-top' as any]: 'env(safe-area-inset-top, 0px)',
            ['--app-safe-bottom' as any]: 'env(safe-area-inset-bottom, 0px)'
        };
        return { ...uiTextStyleVars, ...runtimeSafeAreaVars };
    }, [uiTextStyleVars]);
    const hideBottomTicker = effectiveVisualConfig?.底部滚动关闭显示 === true;
    const runtimeStateSections = React.useMemo(() => ({
        角色: state.角色,
        环境: state.环境,
        社交: state.社交,
        世界: state.世界,
        战斗: state.战斗,
        剧情: state.剧情,
        女主剧情规划: state.女主剧情规划,
        玩家门派: state.玩家门派,
        任务列表: state.任务列表,
        约定列表: state.约定列表,
        记忆系统: state.记忆系统
    }), [state.角色, state.环境, state.社交, state.世界, state.战斗, state.剧情, state.女主剧情规划, state.玩家门派, state.任务列表, state.约定列表, state.记忆系统]);

    const latestAssistantMessage = React.useMemo(
        () => [...state.历史记录]
            .reverse()
            .find((item) => item?.role === 'assistant' && item?.structuredResponse),
        [state.历史记录]
    );
    const currentOptions = React.useMemo(
        () => (latestAssistantMessage?.role === 'assistant' && Array.isArray(latestAssistantMessage.structuredResponse?.action_options))
            ? latestAssistantMessage.structuredResponse.action_options
                .map(parseActionOptionText)
                .filter(item => item.length > 0)
            : [],
        [latestAssistantMessage]
    );
    const latestChangedSections = React.useMemo(() => {
        const structuredResponse = latestAssistantMessage?.structuredResponse;
        const areas = new Set<本回合变化区域>(提取本回合变化区域(structuredResponse?.tavern_commands || []));
        if (
            structuredResponse?.planning_analysis_updated === true
            || (Array.isArray(structuredResponse?.planning_analysis_commands) && structuredResponse.planning_analysis_commands.length > 0)
        ) {
            areas.add('剧情规划');
        }
        if (!Array.isArray(state.约定列表) || state.约定列表.length === 0) {
            areas.delete('约定列表');
        }
        if (!Array.isArray(state.角色?.功法列表) || state.角色.功法列表.length === 0) {
            areas.delete('功法');
        }
        if (!Array.isArray(state.任务列表) || state.任务列表.length === 0) {
            areas.delete('任务列表');
        }
        return Array.from(areas);
    }, [latestAssistantMessage, state.约定列表]);
    const itemImageSequence = React.useMemo(() => {
        const bagRecords = (Array.isArray(state.角色?.物品列表) ? state.角色.物品列表 : []).flatMap((item: any) => {
            const history = Array.isArray(item?.图片档案?.生图历史) ? item.图片档案.生图历史 : [];
            return history.map((record: any, index: number) => ({
                ...record,
                id: `${item?.ID || item?.名称 || 'item'}_${record?.id || record?.生成时间 || index}`,
                原记录ID: record?.id,
                物品名称: item?.名称 || '未命名物品',
                物品类型: item?.类型,
                物品品质: item?.品质,
                生成时间: record?.生成时间,
                状态: record?.状态 || 'success',
                构图: record?.构图,
                来源位置: '背包' as const,
                错误信息: typeof record?.错误信息 === 'string' ? record.错误信息.trim() : '',
                调试链路: Array.isArray(record?.调试链路) ? record.调试链路 : undefined,
                图片URL: record?.图片URL,
                本地路径: record?.本地路径,
                最终正向提示词: record?.最终正向提示词,
                最终负向提示词: record?.最终负向提示词
            }));
        });
        return bagRecords;
    }, [state.角色?.物品列表]);

    React.useEffect(() => {
        const feature = state.apiConfig?.功能模型占位;
        if (state.view !== 'game' || !feature?.文生图功能启用 || !feature?.物品生图启用) return;
        const imageApi = 获取文生图接口配置(state.apiConfig);
        if (!接口配置是否可用(imageApi)) return;
        // 限制物品生图并发数量，避免一次性提交所有任务
        const MAX_CONCURRENT_ITEM_IMAGE_TASKS = 1;
        if (autoItemImageRunningRef.current.size >= MAX_CONCURRENT_ITEM_IMAGE_TASKS) return;

        const now = Date.now();
        if (autoItemImageBackendCooldownUntilRef.current > now) {
            唤醒物品自动生图扫描(autoItemImageBackendCooldownUntilRef.current - now + 250);
            return;
        }
        autoItemImageRecentSuccessRef.current.forEach((value, key) => {
            if (now - value.completedAt > ITEM_AUTO_IMAGE_RECENT_SUCCESS_TTL) {
                autoItemImageRecentSuccessRef.current.delete(key);
            }
        });

        const bagItems = Array.isArray(state.角色?.物品列表) ? state.角色.物品列表 : [];
        const candidates: Array<{
            key: string;
            item: 游戏物品;
            sourceLocation: '背包';
        }> = [];

        bagItems.forEach((item: 游戏物品) => {
            if (!item) return;
            if (物品已有可用图标(item)) return;
            candidates.push({
                key: 获取物品自动生图Key(item),
                item,
                sourceLocation: '背包'
            });
        });

        const candidate = candidates.find((entry) => {
            if (autoItemImageScheduledRef.current.has(entry.key)) return false;
            if (autoItemImageRunningRef.current.has(entry.key)) return false;
            const failedAt = autoItemImageFailedAtRef.current.get(entry.key) || 0;
            return now - failedAt > ITEM_AUTO_IMAGE_RETRY_INTERVAL;
        });
        if (!candidate) {
            const retryDelays = candidates
                .map((entry) => {
                    const failedAt = autoItemImageFailedAtRef.current.get(entry.key) || 0;
                    return failedAt ? (failedAt + ITEM_AUTO_IMAGE_RETRY_INTERVAL) - now : 0;
                })
                .filter((delay) => delay > 0);
            if (retryDelays.length > 0) {
                唤醒物品自动生图扫描(Math.min(...retryDelays) + 250);
            }
            return;
        }

        autoItemImageScheduledRef.current.add(candidate.key);
        let cancelled = false;
        const 写回候选物品 = (nextItem: 游戏物品, shouldSave: boolean) => {
            if (candidate.sourceLocation === '背包') {
                const latestCharacter = latestCharacterRef.current as any;
                const latestBagItems = Array.isArray(latestCharacter?.物品列表) ? latestCharacter.物品列表 : [];
                const nextItems = latestBagItems.map((item: 游戏物品) => {
                    if (是同一个物品(item, candidate.item)) return nextItem;
                    if (物品已有可用图标(item)) return item;
                    return 是同类物品图标复用目标(item, candidate.item)
                        ? 复用物品图片档案(item, nextItem)
                        : item;
                });
                const changed = nextItems.some((item: 游戏物品, index: number) => item !== latestBagItems[index]);
                if (changed) {
                    const nextCharacter = { ...(latestCharacter || state.角色), 物品列表: nextItems };
                    setters.setCharacter(nextCharacter);
                    if (shouldSave) {
                        void actions.performAutoSave?.({ role: nextCharacter, force: true });
                    }
                }
                return;
            }
        };

        const idleTimer = window.setTimeout(() => {
            if (cancelled) return;
            const startedAt = Date.now();
            autoItemImageScheduledRef.current.delete(candidate.key);
            if (autoItemImageRunningRef.current.size >= MAX_CONCURRENT_ITEM_IMAGE_TASKS) return;
            if (autoItemImageRunningRef.current.has(candidate.key)) return;
            const recentSuccess = autoItemImageRecentSuccessRef.current.get(candidate.key);
            if (recentSuccess && startedAt - recentSuccess.completedAt <= ITEM_AUTO_IMAGE_RECENT_SUCCESS_TTL) {
                const recentHasImage = 物品已有可用图标(recentSuccess.nextItem);
                if (recentHasImage) {
                    recordDiagnosticLog('info', '[物品自动生图] 复用近期生成结果，跳过重复提交', {
                        key: candidate.key,
                        recordId: recentSuccess.recordId,
                        sourceLocation: candidate.sourceLocation,
                        itemName: candidate.item?.名称 || '无名物品',
                        ageMs: startedAt - recentSuccess.completedAt
                    });
                    写回候选物品(复用物品图片档案(candidate.item, recentSuccess.nextItem), true);
                    return;
                }
                autoItemImageRecentSuccessRef.current.delete(candidate.key);
                recordDiagnosticLog('warn', '[物品自动生图] 近期结果无可用图片，清除缓存并重新生成', {
                    key: candidate.key,
                    recordId: recentSuccess.recordId
                });
            }

        const recordId = `item_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const modelName = imageApi.model || imageApi.图片后端类型 || 'image-model';
        const 画风 = (feature?.自动物品生图画风 || '写实') as 物品生图结果['画风'];
        const 渲染风格 = (feature?.自动物品生图渲染风格 || '写实道具') as 物品生图结果['渲染风格'];
        const 尺寸 = (typeof feature?.自动物品生图分辨率 === 'string' && feature.自动物品生图分辨率.trim()) || '1024x1024';
        const 读取错误调试链路 = (error: any) => (
            Array.isArray(error?.生图调试链路) ? error.生图调试链路 : undefined
        );
        const 写回物品生图记录 = (status: 物品生图结果['状态'], errorMessage?: string, debugTrace?: 物品生图结果['调试链路']) => {
            const record: 物品生图结果 = {
                id: recordId,
                图片URL: undefined,
                本地路径: undefined,
                生图词组: '',
                原始描述: JSON.stringify(candidate.item ?? {}, null, 2),
                使用模型: modelName,
                生成时间: Date.now(),
                构图: '物品图标',
                画风,
                渲染风格,
                尺寸,
                状态: status,
                错误信息: errorMessage,
                来源: 'generated',
                调试链路: debugTrace
            };
            const nextArchive = 合并物品图片档案(candidate.item, record);
            recordDiagnosticLog(status === 'failed' ? 'warn' : 'info', '[物品自动生图] 写回占位/失败记录', {
                recordId,
                status,
                sourceLocation: candidate.sourceLocation,
                itemName: candidate.item?.名称 || '无名物品',
                historyCount: Array.isArray(nextArchive?.生图历史) ? nextArchive.生图历史.length : 0,
                recentId: nextArchive?.最近生图结果?.id || '',
                hasError: Boolean(errorMessage),
                errorMessage: errorMessage || '',
                debugTraceCount: Array.isArray(debugTrace) ? debugTrace.length : 0
            });
            写回候选物品({
                ...(candidate.item as any),
                图片档案: nextArchive
            }, status === 'failed');
        };

        autoItemImageRunningRef.current.add(candidate.key);
        recordDiagnosticLog('info', '[物品自动生图] 开始生成', {
            key: candidate.key,
            recordId,
            sourceLocation: candidate.sourceLocation,
            itemName: candidate.item?.名称 || '无名物品',
            candidateCount: candidates.length,
            runningCount: autoItemImageRunningRef.current.size
        });
        写回物品生图记录('pending');
        actions.pushNotification({
            title: '物品自动生图',
            message: `正在为「${candidate.item?.名称 || '无名物品'}」生成写实图标。`,
            tone: 'info'
        });
        void (async () => {
            try {
                const result = await 执行生图模型调用带重试(
                    () => 生成物品图标(candidate.item, state.apiConfig, {
                        source: 'auto',
                        sourceLocation: candidate.sourceLocation,
                        imageApi,
                        recordId
                    }),
                    {
                        onAttempt: (attempt, totalAttempts) => {
                            if (attempt > 1) {
                                写回物品生图记录('pending', `正在自动重试物品生图（第 ${attempt}/${totalAttempts} 次尝试）。`);
                            }
                        },
                        onRetry: (attempt, totalAttempts, errorMessage) => {
                            写回物品生图记录('pending', `第 ${attempt}/${totalAttempts} 次生成失败：${errorMessage}；正在自动重试。`);
                        }
                    }
                );
                const successHistory = Array.isArray(result.nextItem?.图片档案?.生图历史)
                    ? result.nextItem.图片档案.生图历史
                    : [];
                写回候选物品(result.nextItem, true);
                const verifyArchive = result.nextItem?.图片档案;
                const verifyRecent = verifyArchive?.最近生图结果;
                const verifySelected = 获取物品已选图标地址(result.nextItem);
                recordDiagnosticLog('info', '[物品自动生图] 成功结果写回候选物品', {
                    recordId,
                    resultRecordId: result.imageRecord?.id || '',
                    sourceLocation: candidate.sourceLocation,
                    itemName: result.nextItem?.名称 || candidate.item?.名称 || '无名物品',
                    historyCount: successHistory.length,
                    recentId: verifyRecent?.id || '',
                    hasImageUrl: Boolean(result.imageRecord?.图片URL),
                    hasLocalPath: Boolean(result.imageRecord?.本地路径),
                    imageUrlPrefix: typeof result.imageRecord?.图片URL === 'string' ? result.imageRecord.图片URL.slice(0, 60) : '',
                    localPathPrefix: typeof result.imageRecord?.本地路径 === 'string' ? result.imageRecord.本地路径.slice(0, 60) : '',
                    verifySelectedUrl: verifySelected || '(empty)',
                    verifyRecentHasUrl: Boolean(verifyRecent?.图片URL),
                    verifyRecentHasPath: Boolean(verifyRecent?.本地路径)
                });
                autoItemImageRecentSuccessRef.current.set(candidate.key, {
                    completedAt: Date.now(),
                    recordId,
                    nextItem: result.nextItem
                });
                autoItemImageFailedAtRef.current.delete(candidate.key);
                actions.pushNotification({
                    title: '物品图标已生成',
                    message: `「${result.nextItem?.名称 || candidate.item?.名称 || '无名物品'}」图标已自动写入。`,
                    tone: 'success'
                });
                console.info('[物品自动生图] 已生成物品图标', candidate.sourceLocation, result.nextItem?.名称 || candidate.item?.名称);
            } catch (error) {
                const errorMessage = 读取生图错误文本(error, '物品自动生图失败');
                写回物品生图记录('failed', errorMessage, 读取错误调试链路(error));
                autoItemImageFailedAtRef.current.set(candidate.key, Date.now());
                console.warn('[物品自动生图] 生成失败', candidate.sourceLocation, candidate.item?.名称, error);
                if (是生图后端不可用错误文本(errorMessage)) {
                    autoItemImageBackendCooldownUntilRef.current = Date.now() + ITEM_AUTO_IMAGE_BACKEND_FAILURE_COOLDOWN_MS;
                    recordDiagnosticLog('warn', '[物品自动生图] 当前 ComfyUI 后端不可用，已暂停自动提交以等待后端恢复', {
                        cooldownMs: ITEM_AUTO_IMAGE_BACKEND_FAILURE_COOLDOWN_MS,
                        sourceLocation: candidate.sourceLocation,
                        itemName: candidate.item?.名称 || '无名物品',
                        errorMessage
                    });
                }
                actions.pushNotification({
                    title: '物品图标生成失败',
                    message: 是生图后端不可用错误文本(errorMessage)
                        ? '当前 ComfyUI 后端不可用，已暂停自动提交，稍后会自动重试。'
                        : `「${candidate.item?.名称 || '无名物品'}」已自动重试 ${生图最大自动重试次数} 次，仍未成功。`,
                    tone: 'error'
                });
            } finally {
                autoItemImageRunningRef.current.delete(candidate.key);
                唤醒物品自动生图扫描(250);
            }
        })();
        }, ITEM_AUTO_IMAGE_AFTER_CHARACTER_SCENE_IDLE_DELAY);
        return () => {
            cancelled = true;
            autoItemImageScheduledRef.current.delete(candidate.key);
            window.clearTimeout(idleTimer);
        };
    }, [state.view, state.apiConfig, state.角色, setters, actions, autoItemImageWakeTick, 唤醒物品自动生图扫描]);

    const 题材界面文案 = React.useMemo(
        () => 获取题材界面文案(state.开局配置?.题材模式, state.开局配置?.modeRuntimeProfile),
        [state.开局配置?.题材模式, state.开局配置?.modeRuntimeProfile]
    );
    const activeDetailPanelId =
        showCharacter ? 'character' :
        state.showEquipment ? 'equipment' :
        state.showInventory ? 'inventory' :
        state.showSocial ? 'social' :
        state.showWorld ? 'world' :
        state.showMap ? 'map' :
        state.showTeam ? 'team' :
        state.showTask ? 'task' :
        state.showAgreement ? 'agreement' :
        state.showStory ? 'story' :
        state.showHeroinePlan ? 'plan' :
        state.showMemory ? 'memory' :
        showNovelExport ? 'export_novel' :
        showImageManager ? 'image_manager' :
        safeShowSaveLoad.show ? (safeShowSaveLoad.mode === 'save' ? 'save' : 'load') :
        state.showSettings ? 'settings' :
        null;

    const desktopRightDetailPanelOpen = state.view === 'game' && (
        showCharacter
        || state.showEquipment
        || state.showInventory
        || state.showSocial
        || state.showTeam
        || state.showWorld
        || state.showMap
        || state.showTask
        || state.showAgreement
        || state.showStory
        || state.showHeroinePlan
        || state.showMemory
        || showNovelExport
        || showImageManager
        || safeShowSaveLoad.show
        || state.showSettings
    );
    const desktopRightDetailId = activeDetailPanelId || 'detail';
    const desktopRightDetailClass = state.view === 'game'
        ? `desktop-right-detail-modal desktop-right-detail-modal--${desktopRightDetailId}${desktopDetailFullscreen ? ' desktop-right-detail-modal--fullscreen' : ''}`
        : undefined;
    const mainStoryApiInfo = React.useMemo(() => {
        const config = 获取主剧情接口配置(state.apiConfig);
        return {
            channelName: String(config?.名称 || config?.供应商 || '未配置渠道').trim(),
            modelName: String(config?.model || '未选择模型').trim()
        };
    }, [state.apiConfig]);
    const mainStoryApiLabel = `主剧情：${mainStoryApiInfo.channelName} / ${mainStoryApiInfo.modelName}`;
    const desktopRightDetailWidth = React.useMemo(() => clampDesktopDetailWidth(
        desktopDetailWidths[desktopRightDetailId] ?? getDesktopDetailDefaultWidth(desktopRightDetailId)
    ), [desktopDetailWidths, desktopRightDetailId, viewportWidth]);
    const appRootStyleVars = React.useMemo(() => ({
        ...appUiStyleVars,
        ['--desktop-right-detail-width' as any]: `${desktopRightDetailWidth}px`
    }), [appUiStyleVars, desktopRightDetailWidth]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(DESKTOP_DETAIL_WIDTHS_STORAGE_KEY, JSON.stringify(desktopDetailWidths));
    }, [desktopDetailWidths]);

    const resetDesktopDetailWidth = React.useCallback(() => {
        setDesktopDetailWidths(prev => {
            const next = { ...prev };
            delete next[desktopRightDetailId];
            return next;
        });
    }, [desktopRightDetailId]);

    const startDesktopDetailResize = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (desktopDetailFullscreen) return;
        event.preventDefault();
        const panelId = desktopRightDetailId;
        const updateWidth = (clientX: number) => {
            const nextWidth = clampDesktopDetailWidth(window.innerWidth - clientX - DESKTOP_DETAIL_RIGHT_GAP);
            setDesktopDetailWidths(prev => ({ ...prev, [panelId]: nextWidth }));
        };
        updateWidth(event.clientX);
        const handlePointerMove = (moveEvent: PointerEvent) => updateWidth(moveEvent.clientX);
        const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            document.body.classList.remove('desktop-detail-resizing');
        };
        document.body.classList.add('desktop-detail-resizing');
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, { once: true });
    }, [desktopDetailFullscreen, desktopRightDetailId]);

    const closeAllPanels = React.useCallback(() => {
        setDesktopDetailFullscreen(false);
        setShowCharacter(false);
        setters.setShowInventory(false);
        setters.setShowEquipment(false);
        setters.setShowTeam(false);
        setters.setShowSocial(false);
        setters.setShowWorld(false);
        setters.setShowMap(false);
        setters.setShowTask(false);
        setters.setShowAgreement(false);
        setters.setShowStory(false);
        setters.setShowHeroinePlan(false);
        setters.setShowMemory(false);
        setShowNovelExport(false);
        setShowImageManager(false);
        setters.setShowSaveLoad({ show: false, mode: 'save' });
        setters.setShowSettings(false);
    }, [setters]);

    React.useEffect(() => {
        if (state.view === 'game') return;
        setDesktopDetailFullscreen(false);
        document.body.classList.remove('desktop-detail-resizing');
    }, [state.view]);

    const collapseDesktopDetailToInitial = React.useCallback(() => {
        setDesktopDetailFullscreen(false);
        closeAllPanels();
    }, [closeAllPanels]);

    const exitDesktopDetailFullscreen = React.useCallback(() => {
        setDesktopDetailFullscreen(false);
        resetDesktopDetailWidth();
    }, [resetDesktopDetailWidth]);

    const openCharacter = React.useCallback(() => {
        closeAllPanels();
        setShowCharacter(true);
    }, [closeAllPanels]);
    const openSettings = React.useCallback(() => {
        closeAllPanels();
        setters.setShowSettings(true);
    }, [closeAllPanels, setters]);
    const openVariableManager = React.useCallback(() => {
        closeAllPanels();
        setters.setActiveTab('variable_manager');
        setters.setShowSettings(true);
    }, [closeAllPanels, setters]);
    const openInventory = React.useCallback(() => {
        setInventoryInitialItemRef('');
        closeAllPanels();
        setters.setShowInventory(true);
    }, [closeAllPanels, setters]);
    const openInventoryItemFromChat = React.useCallback((itemRef: string) => {
        const normalizedRef = typeof itemRef === 'string' ? itemRef.trim() : '';
        if (!normalizedRef) return;
        closeAllPanels();
        setInventoryInitialItemRef(normalizedRef);
        setters.setShowInventory(true);
    }, [closeAllPanels, setters]);
    const openEquipment = React.useCallback(() => {
        closeAllPanels();
        setters.setShowEquipment(true);
    }, [closeAllPanels, setters]);
    const openTeam = React.useCallback(() => {
        closeAllPanels();
        setters.setShowTeam(true);
    }, [closeAllPanels, setters]);
    const openSocial = React.useCallback(() => {
        closeAllPanels();
        setters.setShowSocial(true);
    }, [closeAllPanels, setters]);
    const openNpcDetailFromChat = React.useCallback((npcId: string) => {
        if (!npcId) return;
        closeAllPanels();
        if (npcId === '__player__') {
            setShowCharacter(true);
            return;
        }
        setSelectedSocialNpcId(npcId);
        setters.setShowSocial(true);
    }, [closeAllPanels, setters]);
    const openNpcDetailFromRecord = React.useCallback((record: any) => {
        const candidateTexts = [
            record?.id,
            record?.ID,
            record?.关联NPC,
            record?.关联人物,
            record?.姓名,
            record?.名称,
        ].map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
        if (candidateTexts.length === 0) return;
        const normalized = (value: string) => value.replace(/\s+/g, '').toLowerCase();
        const npc = (Array.isArray(state.社交) ? state.社交 : []).find((item: any) => {
            const npcTexts = [item?.id, item?.ID, item?.姓名, item?.名称]
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter(Boolean);
            return candidateTexts.some((candidate) => npcTexts.some((npcText) => (
                normalized(candidate) === normalized(npcText)
                || normalized(candidate).includes(normalized(npcText))
                || normalized(npcText).includes(normalized(candidate))
            )));
        });
        closeAllPanels();
        setSelectedSocialNpcId(npc?.id || null);
        setters.setShowSocial(true);
        if (!npc) {
            actions.pushNotification?.({
                title: '已打开角色列表',
                message: '未在同门名录里找到对应角色档案。',
                tone: 'info'
            });
        }
    }, [actions, closeAllPanels, setters, state.社交]);
    const openWorld = React.useCallback(() => {
        closeAllPanels();
        setters.setShowWorld(true);
    }, [closeAllPanels, setters]);
    const openMap = React.useCallback(() => {
        closeAllPanels();
        setters.setShowMap(true);
    }, [closeAllPanels, setters]);
    const [chatDraftRequest, setChatDraftRequest] = React.useState<{ text: string; token: number } | null>(null);
    const chatDraftTokenRef = React.useRef(0);
    const insertChatDraft = React.useCallback((text: string) => {
        const draft = String(text || '').trim();
        if (!draft) return;
        chatDraftTokenRef.current += 1;
        setChatDraftRequest({ text: draft, token: chatDraftTokenRef.current });
        actions.pushNotification({ title: '已写入输入框', message: '行动文本已放入对话框，可直接发送或继续编辑。', tone: 'success' });
    }, [actions]);
    const handleLearnNpcSkill = React.useCallback((npc: any, skill: any) => {
        const npcName = String(npc?.姓名 || npc?.名称 || '该人物').trim();
        const skillName = String(skill?.名称 || '技艺').trim();
        const skillLevel = String(skill?.等级 || '未入门').trim();
        const proficiency = Number(skill?.熟练度 ?? 0);
        if (!npcName || !skillName || !Number.isFinite(proficiency)) return;
        const playerSkill = (Array.isArray(state.角色?.技艺) ? state.角色.技艺 : [])
            .find((item: any) => item?.名称 === skillName);
        const playerSkillText = playerSkill
            ? `主角当前${skillName}：${playerSkill.等级 || '未入门'}，熟练度${Number(playerSkill.熟练度 || 0)}。`
            : `主角当前尚未稳定记录${skillName}技艺。`;
        actions.appendSystemMessage?.(
            `[学艺请求] 玩家已选择向${npcName}学习${skillName}技艺。对方当前${skillName}：${skillLevel}，熟练度${Math.max(0, Math.floor(proficiency))}。${playerSkillText}下一回合 AI 必须在正文中反馈请教过程、对方态度、学习条件与阶段结果；若学习有效，在<变量规划>中更新角色.技艺里${skillName}的熟练度/等级/描述，并按事实同步${npcName}的记忆、好感或关系状态。`,
            { position: 'after_last_turn' }
        );
        actions.pushNotification({
            title: '学艺请求已记录',
            message: `下回合将向${npcName}请教「${skillName}」。`,
            tone: 'success'
        });
    }, [actions, state.角色?.技艺]);
    const handleStealFromNpc = React.useCallback((npc: any, target?: string) => {
        const npcName = String(npc?.姓名 || npc?.名称 || '目标').trim();
        const targetText = String(target || '随机随身物品').trim() || '随机随身物品';
        const isPrivateTarget = /内衣|贴身|亵衣|肚兜|抹胸|袜|香囊|信物/u.test(targetText);
        insertChatDraft(`[偷窃尝试] 我尝试趁机从「${npcName}」身上偷取「${targetText}」。请根据现场环境、目标警觉与实力、双方关系、我的身法/机关/鉴定/偷窃/潜行等相关技艺、装备与风险进行判定；偷窃技艺越高，越可以尝试更隐蔽或更贴身的目标${isPrivateTarget ? '，但贴身衣物或私密物件必须额外考虑接近难度、触碰风险、目标反应和失败后果' : ''}。若成功请写明偷到什么并更新双方背包；若失败请给出被察觉、关系下降、冲突或名声后果。`);
        setters.setShowSocial(false);
    }, [insertChatDraft, setters]);
    const openTask = React.useCallback(() => {
        closeAllPanels();
        setters.setShowTask(true);
    }, [closeAllPanels, setters]);
    const openAgreement = React.useCallback(() => {
        closeAllPanels();
        setters.setShowAgreement(true);
    }, [closeAllPanels, setters]);
    const openStory = React.useCallback(() => {
        closeAllPanels();
        setters.setShowStory(true);
    }, [closeAllPanels, setters]);
    const openHeroinePlan = React.useCallback(() => {
        closeAllPanels();
        setters.setShowHeroinePlan(true);
    }, [closeAllPanels, setters]);
    const openMemory = React.useCallback(() => {
        closeAllPanels();
        setters.setShowMemory(true);
    }, [closeAllPanels, setters]);
    const handleDiscardBagItem = React.useCallback((itemId: string) => {
        const result = 丢弃背包物品(state.角色, itemId);
        if (!result.ok) {
            actions.pushNotification({ title: '丢弃失败', message: result.message, tone: 'error' });
            return { ok: false as const, message: result.message };
        }
        setters.setCharacter(result.nextCharacter);
        void actions.performAutoSave?.({ role: result.nextCharacter, force: true });
        actions.pushNotification({ title: '已丢弃物品', message: result.message, tone: 'success' });
        return { ok: true as const, message: result.message };
    }, [actions, setters, state.角色]);
    const handleDiscardAllMiscItems = React.useCallback(() => {
        const sourceItems = Array.isArray(state.角色?.物品列表) ? state.角色.物品列表 : [];
        const miscItems = sourceItems.filter(是否杂物类物品);
        if (miscItems.length <= 0) {
            const message = '背包中没有可一键丢弃的杂物。';
            actions.pushNotification({ title: '没有杂物', message, tone: 'info' });
            return { ok: false as const, message };
        }
        let nextCharacter: any = state.角色;
        let removedCount = 0;
        for (const item of miscItems) {
            const itemId = String(item?.ID || '');
            const count = Math.max(1, Math.trunc(Number(item?.堆叠数量) || 1));
            if (!itemId) continue;
            const result = 丢弃背包物品(nextCharacter, itemId, Number.POSITIVE_INFINITY);
            if (!result.ok) continue;
            nextCharacter = result.nextCharacter;
            removedCount += count;
        }
        setters.setCharacter(nextCharacter);
        void actions.performAutoSave?.({ role: nextCharacter, force: true });
        const message = `已丢弃 ${removedCount || miscItems.length} 件杂物。`;
        actions.pushNotification({ title: '杂物已丢弃', message, tone: 'success' });
        return { ok: true as const, message };
    }, [actions, setters, state.角色]);
    const handleRegenerateBagItemImage = React.useCallback(async (targetItem: 游戏物品, extraPrompt?: string) => {
        const itemRef = String((targetItem as any)?.ID || (targetItem as any)?.名称 || '');
        if (!itemRef) return;
        const sourceItems = Array.isArray(state.角色?.物品列表) ? state.角色.物品列表 : [];
        const freshItem = sourceItems.find((item: any) => item?.ID === itemRef || item?.名称 === itemRef) || targetItem;
        actions.pushNotification({
            title: '物品重生图',
            message: `正在为「${(freshItem as any)?.名称 || '无名物品'}」重新生成图标。`,
            tone: 'info'
        });
        try {
            const result = await 生成物品图标(freshItem, state.apiConfig, {
                source: 'manual',
                sourceLocation: '背包',
                force: true,
                extraPrompt
            });
            const history = Array.isArray(result.nextItem?.图片档案?.生图历史)
                ? result.nextItem.图片档案.生图历史
                : [];
            const nextItems = sourceItems.map((item: any) => (
                item?.ID === itemRef || item?.名称 === itemRef ? result.nextItem : item
            ));
            const nextCharacter = { ...state.角色, 物品列表: nextItems };
            setters.setCharacter(nextCharacter);
            void actions.performAutoSave?.({ role: nextCharacter, force: true });
            recordDiagnosticLog('info', '[物品手动生图] 成功写入背包物品档案', {
                itemRef,
                recordId: result.imageRecord?.id || '',
                itemName: (result.nextItem as any)?.名称 || (freshItem as any)?.名称 || '无名物品',
                historyCount: history.length,
                recentId: result.nextItem?.图片档案?.最近生图结果?.id || '',
                hasImageUrl: Boolean(result.imageRecord?.图片URL),
                hasLocalPath: Boolean(result.imageRecord?.本地路径)
            });
            actions.pushNotification({
                title: '物品图标已更新',
                message: `「${(result.nextItem as any)?.名称 || (freshItem as any)?.名称 || '无名物品'}」的新图标已写入背包。`,
                tone: 'success'
            });
        } catch (error) {
            const message = 读取生图错误文本(error, '物品重生图失败');
            recordDiagnosticLog('warn', '[物品手动生图] 生成或写回失败', {
                itemRef,
                itemName: (freshItem as any)?.名称 || '无名物品',
                errorMessage: message
            });
            actions.pushNotification({ title: '物品重生图失败', message, tone: 'error' });
            throw error;
        }
    }, [actions, setters, state.apiConfig, state.角色]);
    const handleDeleteMemory = React.useCallback((round: number) => {
        const prevMemorySystem = state.记忆系统;
        if (!prevMemorySystem) return;

        const nextMemorySystem = {
            ...prevMemorySystem,
            回忆档案: (Array.isArray(prevMemorySystem.回忆档案) ? prevMemorySystem.回忆档案 : [])
                .filter(item => item?.回合 !== round),
            即时记忆: (Array.isArray(prevMemorySystem.即时记忆) ? prevMemorySystem.即时记忆 : [])
                .filter((_, index) => index + 1 !== round),
            短期记忆: (Array.isArray(prevMemorySystem.短期记忆) ? prevMemorySystem.短期记忆 : [])
                .filter((_, index) => index + 1 !== round)
        };

        actions.updateMemorySystem(nextMemorySystem);
        void actions.performAutoSave?.({ memory: nextMemorySystem, force: true });
        actions.pushNotification({ title: '记忆已删除', message: `回合 ${round} 的回忆档案已被移除。`, tone: 'success' });
    }, [actions, setters, state.记忆系统]);
    const handleRefineMemories = React.useCallback(async (rounds: number[]): Promise<boolean> => {
        const prevMemorySystem = state.记忆系统;
        if (!prevMemorySystem) return false;
        const sortedRounds = [...new Set(rounds.filter((round) => Number.isFinite(round)))].sort((a, b) => a - b);
        const allArchives = Array.isArray(prevMemorySystem.回忆档案) ? prevMemorySystem.回忆档案 : [];
        const selectedRoundSet = new Set(sortedRounds);
        const selectedEntries = allArchives
            .filter(item => selectedRoundSet.has(typeof item?.回合 === 'number' ? item.回合 : 0))
            .sort((a, b) => (a.回合 ?? 0) - (b.回合 ?? 0));
        if (selectedEntries.length < 2) {
            actions.pushNotification({ title: '精炼取消', message: '至少需要选择 2 条记忆。', tone: 'info' });
            return false;
        }
        actions.pushNotification({ title: '正在精炼', message: `正在对 ${selectedEntries.length} 条记忆进行 AI 精炼总结...`, tone: 'info' });

        const memoryRefineApi = 获取记忆精炼接口配置(apiConfigRef.current);
        if (!接口配置是否可用(memoryRefineApi)) {
            actions.pushNotification({ title: '精炼失败', message: '记忆精炼接口未配置，请先在设置中配置。', tone: 'error' });
            return false;
        }

        const entriesText = selectedEntries.map((item) => {
            const round = typeof item?.回合 === 'number' ? item.回合 : 0;
            const name = typeof item?.名称 === 'string' ? item.名称 : `【回忆${round || '?'}】`;
            const summary = typeof item?.概括 === 'string' ? item.概括 : '';
            const raw = typeof item?.原文 === 'string' ? item.原文 : '';
            return `${name}\n概括：${summary}\n原文：${raw}\n---`;
        }).join('\n');

        const systemPrompt = 获取内置世界书槽位内容({
            books: meta.worldbooks,
            slotId: 'builtin_memory_refine_system_prompt',
            fallback: 记忆精炼系统提示词
        });
        const sortedEntryTimes = selectedEntries
            .map(item => typeof item?.记录时间 === 'string' ? item.记录时间.trim() : '')
            .filter(Boolean);
        const timeRangeHint = sortedEntryTimes.length >= 2
            ? `\n时间范围：${sortedEntryTimes[0]} 至 ${sortedEntryTimes[sortedEntryTimes.length - 1]}`
            : '';
        const userPrompt = `请精炼总结以下 ${selectedEntries.length} 条记忆${timeRangeHint}，生成一份可用于后续剧情检索的历史纪要：\n\n${entriesText}`;

        try {
            const refinedText = await 请求模型文本(
                memoryRefineApi,
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                { temperature: 0.7 }
            );
            if (!refinedText || refinedText.trim().length < 20) {
                throw new Error('AI 返回内容过短');
            }
            const minRound = sortedRounds[0];
            const maxRound = sortedRounds[sortedRounds.length - 1];
            const rawText = refinedText.trim();
            // 优先匹配新格式 <<<TIME>>> / <<<SUMMARY>>> / <<<BODY>>>（兼容新旧顺序）
            const newTimeMatch = rawText.match(/<<<TIME>>>\s*([\s\S]*?)(?=<<<SUMMARY>>>|<<<BODY>>>)/);
            const newSummaryMatch = rawText.match(/<<<SUMMARY>>>\s*([\s\S]*?)(?=<<<TIME>>>|<<<BODY>>>)/);
            const newBodyMatch = rawText.match(/<<<BODY>>>\s*([\s\S]*)/);
            // 兼容旧格式 概况摘要：/ 正文：
            const oldSummaryMatch = rawText.match(/概况摘要[：:]\s*([\s\S]*?)(?=\n\s*正文[：:])/);
            const oldBodyMatch = rawText.match(/正文[：:]\s*([\s\S]*)/);
            const summaryText = (newSummaryMatch ? newSummaryMatch[1].trim() : '') || (oldSummaryMatch ? oldSummaryMatch[1].trim() : '');
            let timeRangeText = newTimeMatch ? newTimeMatch[1].trim() : '';
            // 兜底：AI 没输出 <<<TIME>>> 时，从概况摘要首尾行自动提取时间
            if (!timeRangeText && summaryText) {
                const summaryLines = summaryText.split('\n').filter(line => /^\s*-/.test(line));
                if (summaryLines.length > 0) {
                    const timePat = /\d+:\d+:\d+:\d+:\d+/g;
                    const firstTimes = summaryLines[0].match(timePat);
                    const lastTimes = summaryLines[summaryLines.length - 1].match(timePat);
                    if (firstTimes && lastTimes) {
                        const startTime = firstTimes[0];
                        const endTime = lastTimes[lastTimes.length - 1];
                        timeRangeText = startTime !== endTime ? `${startTime} - ${endTime}` : startTime;
                    }
                }
            }
            const bodyText = (newBodyMatch ? newBodyMatch[1].trim() : '') || (oldBodyMatch ? oldBodyMatch[1].trim() : '') || rawText;
            const timePrefix = timeRangeText ? `时间跨度：${timeRangeText}\n\n` : '';
            const cleanSummary = timePrefix + (summaryText || bodyText.slice(0, 800));
            const refinedNameSuffix = timeRangeText ? ` (${timeRangeText})` : '';
            const refinedEntry = {
                名称: `【精炼纪要 ${minRound}-${maxRound}】${refinedNameSuffix}`,
                概括: cleanSummary,
                原文: bodyText,
                回合: maxRound,
                记录时间: selectedEntries[selectedEntries.length - 1]?.记录时间 || '未知时间',
                时间戳: selectedEntries[selectedEntries.length - 1]?.时间戳 || new Date().toISOString()
            };
            const remainingArchives = allArchives.filter(item => !sortedRounds.includes(typeof item?.回合 === 'number' ? item.回合 : 0));
            const nextArchives = [refinedEntry, ...remainingArchives].sort((a, b) => (b.回合 ?? 0) - (a.回合 ?? 0));

            const nextMemorySystem = {
                ...prevMemorySystem,
                回忆档案: nextArchives
            };
            actions.updateMemorySystem(nextMemorySystem);
            void actions.performAutoSave?.({ memory: nextMemorySystem, force: true });
            actions.pushNotification({ title: '精炼完成', message: `${selectedEntries.length} 条记忆已精炼为 1 条纪要（回合 ${minRound}-${maxRound}）。`, tone: 'success' });
            return true;
        } catch (error: any) {
            const errorMsg = error?.message || '未知错误';
            actions.pushNotification({ title: '精炼失败', message: `AI 精炼失败：${errorMsg}`, tone: 'error' });
            return false;
        }
    }, [actions, meta.worldbooks, state.记忆系统]);
    const handleRegenerateMapFromMemory = React.useCallback(async (onDelta: (delta: string) => void): Promise<{ ok: boolean; message: string }> => {
        const memory = state.记忆系统;
        const memoryCount = [
            Array.isArray(memory?.回忆档案) ? memory.回忆档案.length : 0,
            Array.isArray(memory?.即时记忆) ? memory.即时记忆.length : 0,
            Array.isArray(memory?.短期记忆) ? memory.短期记忆.length : 0,
            Array.isArray(memory?.中期记忆) ? memory.中期记忆.length : 0,
            Array.isArray(memory?.长期记忆) ? memory.长期记忆.length : 0
        ].reduce((sum, count) => sum + count, 0);
        if (memoryCount <= 0) {
            return { ok: false, message: '当前存档没有可用于解析地图的回忆内容。' };
        }
        try {
            setMapRegenerateRawText('');
            const result = await 生成地图更新({
                mode: 'memory_regenerate',
                apiSettings: apiConfigRef.current,
                环境: state.环境,
                世界: state.世界,
                社交: state.社交,
                角色: safeCharacter,
                gameConfig: state.gameConfig,
                记忆系统: memory,
                worldbooks: meta.worldbooks,
                onDelta: (delta: string) => {
                    setMapRegenerateRawText((prev: string) => prev + delta);
                    onDelta(delta);
                }
            });
            if (!result.ok || !Array.isArray(result.newLayers) || result.newLayers.length === 0) {
                throw new Error(result.statusText || '未生成有效地图节点');
            }

            const nextWorld: any = { ...(state.世界 || {}) };
            nextWorld.地图 = [];
            nextWorld.建筑 = [];
            nextWorld.地图建筑 = [];
            nextWorld.地图道路 = [];
            nextWorld.地图人物 = [];
            nextWorld.地图层级 = result.newLayers;
            setters.setWorld(nextWorld);
            worldRef.current = nextWorld;
            setMapRegenerateRawText(result.rawText || '');
            void actions.performAutoSave?.({ world: nextWorld, force: true });
            return { ok: true, message: `已清除旧地图，并从回忆库重建 ${result.newLayers.length} 个地点节点。` };
        } catch (error: any) {
            const errorMsg = error?.message || '未知错误';
            return { ok: false, message: errorMsg };
        }
    }, [actions, meta.worldbooks, safeCharacter, setters, state.世界, state.环境, state.社交, state.记忆系统, state.gameConfig]);
    const handleRegenerateMap = React.useCallback(async (): Promise<boolean> => {
        actions.pushNotification({ title: '开始回忆解析', message: '正在从回忆库重建新版地图。', tone: 'info' });
        const result = await handleRegenerateMapFromMemory(() => undefined);
        actions.pushNotification({
            title: result.ok ? '回忆解析完成' : '回忆解析失败',
            message: result.message,
            tone: result.ok ? 'success' : 'error'
        });
        return result.ok;
    }, [actions, handleRegenerateMapFromMemory]);
    const openNovelExport = React.useCallback(() => {
        closeAllPanels();
        setShowNovelExport(true);
    }, [closeAllPanels]);
    const openSave = React.useCallback(() => {
        closeAllPanels();
        setters.setShowSaveLoad({ show: true, mode: 'save' });
    }, [closeAllPanels, setters]);
    const openLoad = React.useCallback(() => {
        closeAllPanels();
        setters.setShowSaveLoad({ show: true, mode: 'load' });
    }, [closeAllPanels, setters]);
    const closeSettings = React.useCallback(() => setters.setShowSettings(false), [setters]);
    const closeNovelExport = React.useCallback(() => setShowNovelExport(false), []);
    const handleAllocateAttributePoint = React.useCallback((key: 可分配六维属性键) => {
        const nextCharacter = 分配角色属性点(state.角色, key);
        if (nextCharacter === state.角色) return;
        setters.setCharacter(nextCharacter);
        void actions.performAutoSave?.({ role: nextCharacter, force: true });
        actions.pushNotification({
            title: '属性点已分配',
            message: `${key} +1，剩余可分配属性点 ${Number((nextCharacter as any).可分配属性点 || 0)}。`,
            tone: 'success'
        });
    }, [actions, setters, state.角色]);
    const closeSaveLoad = React.useCallback(() => setters.setShowSaveLoad({ show: false, mode: 'save' }), [setters]);
    const closeWorldbookManager = React.useCallback(() => setShowWorldbookManager(false), []);
    const openWorldbookManager = React.useCallback(() => setShowWorldbookManager(true), []);
    const handleStartFromLanding = React.useCallback(() => actions.handleStartNewGameWizard(), [actions]);
    const handleReturnToHomeWithAutoSave = React.useCallback(async () => {
        if (returnHomeSaving) return;
        setReturnHomeSaving(true);
        actions.pushNotification({
            title: '正在保存存档',
            message: '正在保存当前进度，请稍候。',
            tone: 'info'
        });
        try {
            await actions.performAutoSave({ force: true });
            closeAllPanels();
            void 执行延迟上传队列();
            actions.handleReturnToHome();
            setters.setShowSettings(false);
        } catch (error: any) {
            window.alert(`本地保存失败，暂不能返回首页：${error?.message || '未知错误'}`);
        } finally {
            setReturnHomeSaving(false);
        }
    }, [actions, closeAllPanels, returnHomeSaving, setters]);
    const handleReturnToHomeFromSettings = React.useCallback(async () => {
        const ok = await requestConfirm({
            title: '返回首页',
            message: '返回首页前会自动保存当前进度。确定保存并返回吗？',
            confirmText: '保存并返回',
            cancelText: '继续游玩',
            danger: true
        });
        if (!ok) return;
        await handleReturnToHomeWithAutoSave();
    }, [handleReturnToHomeWithAutoSave, requestConfirm]);
    const openPolishSettings = React.useCallback(() => {
        closeAllPanels();
        setters.setActiveTab('polish');
        setters.setShowSettings(true);
    }, [closeAllPanels, setters]);

    const openImageManagerWithCheck = React.useCallback(async () => {
        const imageApi = 获取文生图接口配置(state.apiConfig);
        if (接口配置是否可用(imageApi) && imageApi.图片后端类型 === 'novelai') {
            const promptApi = 获取生图词组转化器接口配置(state.apiConfig);
            if (!接口配置是否可用(promptApi)) {
                const accepted = await requestConfirm({
                    title: 'NovelAI 缺少词组转化器',
                    message: 'NovelAI 模式必须绑定可用的词组转化器接口。是否立即跳转到“文生图”设置页？',
                    confirmText: '前往设置',
                    cancelText: '稍后再说'
                });
                if (accepted) {
                    closeAllPanels();
                    setters.setActiveTab('image_generation');
                    setters.setShowSettings(true);
                }
                return;
            }
        }

        closeAllPanels();
        setShowImageManager(true);
    }, [closeAllPanels, requestConfirm, setters, state.apiConfig]);

    const apiConfigRef = React.useRef(state.apiConfig);
    apiConfigRef.current = state.apiConfig;
    const worldRef = React.useRef(state.世界);
    worldRef.current = state.世界;

    const legacyImageMigrationNoticeVisible = !legacyImageMigrationNoticeClosed && (
        legacyImageMigrationStatus.stage === 'scanning'
        || legacyImageMigrationStatus.stage === 'running'
        || (
            (legacyImageMigrationStatus.stage === 'completed' || legacyImageMigrationStatus.stage === 'partial_failed' || legacyImageMigrationStatus.stage === 'failed')
            && (legacyImageMigrationStatus.totalAssets > 0 || legacyImageMigrationStatus.migratedAssets > 0 || legacyImageMigrationStatus.failedAssets > 0)
        )
    );
    const legacySaveLineageMigrationNoticeVisible = !legacySaveLineageMigrationNoticeClosed && (
        legacySaveLineageMigrationStatus.stage === 'scanning'
        || legacySaveLineageMigrationStatus.stage === 'running'
        || (
            (legacySaveLineageMigrationStatus.stage === 'completed' || legacySaveLineageMigrationStatus.stage === 'failed')
            && (legacySaveLineageMigrationStatus.legacySaves > 0 || legacySaveLineageMigrationStatus.convertedSaves > 0 || legacySaveLineageMigrationStatus.failedSaves > 0)
        )
    );

    return (
        <>
            <div className={`h-screen w-screen max-w-full min-w-0 bg-ink-black relative flex flex-col transition-colors duration-500 ${state.view === 'home' ? 'overflow-x-hidden overflow-y-auto' : 'overflow-hidden'} p-3`} style={appRootStyleVars}>
                {fontFaceStyleText && <style>{fontFaceStyleText}</style>}
                {legacyImageMigrationNoticeVisible && (
                    <旧图迁移提示条
                        status={legacyImageMigrationStatus}
                        onClose={() => setLegacyImageMigrationNoticeClosed(true)}
                    />
                )}
                {legacySaveLineageMigrationNoticeVisible && (
                    <旧存档谱系迁移提示条
                        status={legacySaveLineageMigrationStatus}
                        onClose={() => setLegacySaveLineageMigrationNoticeClosed(true)}
                    />
                )}
            
            {/* View Switching */}
            {state.view === 'home' && (
                <LandingPage 
                    onStart={handleStartFromLanding}
                    onLoad={openLoad}
                    onImageManager={openImageManagerWithCheck}
                    onWorldbookManager={openWorldbookManager}
                    onSettings={openSettings}
                    currentTheme={state.currentTheme}
                    onThemeChange={setters.setCurrentTheme}
                    hasSave={state.hasSave}
                />
            )}

            {state.view === 'new_game' && (
                <懒加载边界>
                    <NewGameWizard
                        onComplete={(worldConfig, charData, openingConfig, mode, openingStreaming, openingExtraPrompt, activeModuleExtraRules) =>
                            actions.handleGenerateWorld(worldConfig, charData, openingConfig, mode, openingStreaming, openingExtraPrompt, undefined, activeModuleExtraRules)
                        }
                        onCancel={() => { state.setView('home'); }}
                        loading={state.loading}
                        apiConfig={state.apiConfig}
                        requestConfirm={requestConfirm}
                        isStreamingDefault={!(state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.主剧情非流式输出)}
                    />
                </懒加载边界>
            )}

            {state.view === 'game' && (
                <ModalErrorBoundary title="主界面渲染失败">
                {/* Main Game Frame Container */}
                <div className="relative flex-1 flex flex-col w-full h-full overflow-hidden bg-ink-black rounded-2xl shadow-2xl">
                    {/* 顶部导航栏 */}
                    <div className="shrink-0 z-40 bg-ink-black/90 border-b border-wuxia-gold/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-visible rounded-t-xl mx-1 mt-1">
                        <TopBar 
                            环境={state.环境} 
                            游戏初始时间={state.游戏初始时间}
                            timeFormat={effectiveTopBarTimeFormat}
                            visualConfig={effectiveVisualConfig}
                        />
                    </div>

                    {/* 中间主要互动区域 */}
                    <div className="flex-1 flex overflow-hidden relative z-10 mx-1 mb-1">
                        
                        {/* 左侧栏 */}
                        <div className="hidden md:block w-[14.285714%] h-full relative z-20 bg-ink-black/95 border-r border-wuxia-gold/20 flex flex-col shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
                            <LeftPanel
                                角色={state.角色}
                                onOpenCharacter={openCharacter}
                                onOpenVariableManager={openVariableManager}
                                onUploadAvatar={actions.updatePlayerAvatar}
                                visualConfig={effectiveVisualConfig}
                                gameConfig={state.gameConfig}
                                openingConfig={state.开局配置}
                                latestCommands={latestAssistantMessage?.structuredResponse?.tavern_commands || []}
                            />
                        </div>

                        {/* 中间栏 - Chat Area */}
                        <div className="flex-1 flex flex-col relative z-0 min-w-0 transition-colors duration-500">
                            {当前背景图片地址 && (
                                <div
                                    className={`absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-opacity duration-300 ${
                                        chatContentHidden ? 'opacity-100' : 'opacity-35'
                                    }`}
                                    style={{ backgroundImage: `url(${当前背景图片地址})` }}
                                ></div>
                            )}
                            <div
                                className={`absolute inset-0 z-0 bg-gradient-to-b from-white/12 via-white/5 to-white/12 pointer-events-none transition-opacity duration-300 ${
                                    chatContentHidden ? 'opacity-0' : 'opacity-100'
                                }`}
                            ></div>
                              <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
                                  <div
                                      className="hidden max-w-[360px] items-center truncate rounded-full border border-wuxia-gold/40 bg-black/65 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-wuxia-gold shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur sm:inline-flex"
                                      title={mainStoryApiLabel}
                                  >
                                      <span className="truncate">{mainStoryApiLabel}</span>
                                  </div>
                                  {chatContentHidden && (
                                      <button
                                          type="button"
                                          onClick={() => {
                                              setSceneQuickGenHint(true);
                                              setSceneQuickGenToastVisible(true);
                                              window.setTimeout(() => setSceneQuickGenHint(false), 1200);
                                              window.setTimeout(() => setSceneQuickGenToastVisible(false), 2000);
                                              void actions.generateSceneImageManually();
                                          }}
                                          className={`inline-flex h-[27px] w-[27px] items-center justify-center rounded-full border bg-black/55 backdrop-blur-sm transition-colors hover:text-white ${sceneQuickGenHint ? 'border-emerald-300 text-emerald-100 ring-2 ring-emerald-300/60 animate-pulse' : 'border-emerald-600/60 text-emerald-100 hover:border-emerald-400'}`}
                                          title="一键生成当前场景"
                                          aria-label="一键生成当前场景"
                                      >
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[14px] w-[14px]">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5 8.5 16 19 5.5" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 12h4" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v4" />
                                          </svg>
                                      </button>
                                  )}
                                  <button
                                      type="button"
                                      onClick={() => setChatContentHidden(prev => !prev)}
                                      className="inline-flex h-[27px] w-[27px] items-center justify-center rounded-full border border-sky-700/60 bg-black/55 text-sky-100 backdrop-blur-sm transition-colors hover:border-sky-400 hover:text-white"
                                      title={chatContentHidden ? '显示正文内容' : '隐藏正文内容，仅查看壁纸'}
                                      aria-label={chatContentHidden ? '显示正文内容' : '隐藏正文内容，仅查看壁纸'}
                                  >
                                      {chatContentHidden ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-[14px] w-[14px]">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
                                              <circle cx="12" cy="12" r="2.75" />
                                          </svg>
                                      ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-[14px] w-[14px]">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5c2.2 2.5 5.24 3.75 9 3.75s6.8-1.25 9-3.75" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.5 7 12.7" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 15.5-2.5-2.8" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 16.5 10 13" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 16.5-.5-3.5" />
                                          </svg>
                                      )}
                                  </button>
                              </div>
                            <div
                                className={`relative z-10 flex min-h-0 flex-1 flex-col transition-opacity duration-300 ${
                                    chatContentHidden ? 'pointer-events-none select-none opacity-0' : 'opacity-100'
                                }`}
                                aria-hidden={chatContentHidden}
                            >
                                <ChatList 
                                    history={state.历史记录} 
                                    loading={state.loading} 
                                    scrollRef={state.scrollRef}
                                    onUpdateHistory={actions.updateHistoryItem} 
                                    onPolishTurn={actions.handlePolishTurn}
                                    visualConfig={effectiveVisualConfig}
                                    socialList={state.社交}
                                    playerProfile={playerProfile}
                                    onOpenNpcDetail={openNpcDetailFromChat}
                                    inventoryItems={Array.isArray(state.角色?.物品列表) ? state.角色.物品列表 : []}
                                    onOpenInventoryItem={openInventoryItemFromChat}
                                    renderCount={effectiveVisualConfig.渲染层数}
                                    suppressAutoScrollToken={meta.chatScrollSuppressToken}
                                    forceScrollToken={meta.chatForceScrollToken}
                                    variableGenerationRunning={meta.variableGenerationRunning}
                                />
                                <InputArea 
                                    onSend={actions.handleSend} 
                                    onStop={actions.handleStop}
                                    onCancelVariableGeneration={actions.handleCancelVariableGeneration}
                                    onRetryLatestVariableGeneration={actions.handleRetryLatestVariableGeneration}
                                    onRegenerate={actions.handleRegenerate}
                                    onRecoverParseErrorRaw={actions.handleRecoverFromParseErrorRaw}
                                    onQuickRestart={actions.handleQuickRestart}
                                    requestConfirm={requestConfirm}
                                    loading={state.loading} 
                                    variableGenerationRunning={meta.variableGenerationRunning}
                                    postStoryQueueRunning={meta.postStoryQueueRunning}
                                    canReroll={meta.canRerollLatest}
                                    reRollCount={meta.reRollCount}
                                    canRetryLatestVariableGeneration={meta.canRetryLatestVariableGeneration}
                                    canQuickRestart={meta.canQuickRestart}
                                     openingWorldEvolutionProgress={meta.openingWorldEvolutionProgress}
                                     openingPlanningProgress={meta.openingPlanningProgress}
                                     openingVariableGenerationProgress={meta.openingVariableGenerationProgress}
                                     openingPolishProgress={meta.openingPolishProgress}
                                     openingMainStoryProgress={meta.openingMainStoryProgress}
                                     openingMapUpdateProgress={meta.openingMapUpdateProgress}
                                     mainStoryModelInfo={mainStoryApiInfo}
                                     externalDraft={chatDraftRequest}
                                     options={currentOptions}
                                     isStreamingDefault={!(state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.主剧情非流式输出)}
                                     stageStreamMode={{
                                         main: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.主剧情非流式输出 ? 'non-stream' : 'stream',
                                         polish: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.文章优化非流式输出 ? 'non-stream' : 'stream',
                                         variable: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.变量计算非流式输出 ? 'non-stream' : 'stream',
                                         world: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.世界演变非流式输出 ? 'non-stream' : 'stream',
                                         planning: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.规划分析非流式输出 ? 'non-stream' : 'stream',
                                         map: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.地图自动更新非流式输出 ? 'non-stream' : 'stream',
                                         recall: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.剧情回忆非流式输出 ? 'non-stream' : 'stream',
                                         summary: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.记忆总结非流式输出 ? 'non-stream' : 'stream',
                                         refine: state.gameConfig?.启用非流式输出 || state.apiConfig?.功能模型占位?.记忆精炼非流式输出 ? 'non-stream' : 'stream',
                                     }}
                                 />
                            </div>
                            {sceneQuickGenToastVisible && (
                                <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                                    <div
                                        className="rounded-xl border border-emerald-400/40 bg-black/75 px-4 py-2 font-semibold tracking-[0.18em] text-emerald-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur"
                                        style={{ fontSize: 'var(--ui-compact-font-size, 14px)' }}
                                    >
                                        已提交场景生图请求
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 右侧栏 */}
                        <div className="hidden md:block h-full w-[var(--desktop-side-menu-width)] shrink-0 relative z-20 bg-ink-black/95 border-l border-wuxia-gold/20 flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
                            <RightPanel 
                                onOpenSettings={openSettings} 
                                onOpenInventory={openInventory}
                                onOpenEquipment={openEquipment} 
                                onOpenTeam={openTeam}
                                onOpenSocial={openSocial}
                                onOpenWorld={openWorld}
                                onOpenMap={openMap}
                                onOpenTask={openTask} 
                                onOpenAgreement={openAgreement} 
                                onOpenStory={openStory}
                                onOpenHeroinePlan={openHeroinePlan}
                                onOpenMemory={openMemory}
                                onOpenNovelExport={openNovelExport}
                                uiLabels={题材界面文案}
                                onOpenImageManager={openImageManagerWithCheck}
                                worldEvolutionEnabled={meta.worldEvolutionEnabled}
                                worldEvolutionUpdating={meta.worldEvolutionUpdating}
                                enableWorldPanel={state.apiConfig?.功能模型占位?.世界演变功能启用 !== false}
                                enableHeroinePlan={safeGameConfig?.启用女主剧情规划 === true}
                                enablePlanningPanel={state.apiConfig?.功能模型占位?.规划分析功能启用 !== false}
                                onSave={openSave}
                                onLoad={openLoad}
                                onReturnToHome={() => { void handleReturnToHomeWithAutoSave(); }}
                                returnHomeSaving={returnHomeSaving}
                                visualConfig={effectiveVisualConfig}
                                latestChangedSections={latestChangedSections}
                            />
                        </div>

                        {desktopRightDetailPanelOpen && (
                            <div
                                className="hidden md:block h-full shrink-0 border-l border-wuxia-gold/20 bg-black/40"
                                style={{ width: 'var(--desktop-right-detail-width)' }}
                                aria-hidden="true"
                            />
                        )}
                    </div>

                    {desktopRightDetailPanelOpen && (
                        <>
                            {!desktopDetailFullscreen && (
                                <div
                                    className="desktop-detail-resize-handle"
                                    role="separator"
                                    aria-label="拖拽调整详情栏宽度"
                                    title="拖拽调整详情栏宽度，双击恢复本页默认宽度"
                                    onPointerDown={startDesktopDetailResize}
                                    onDoubleClick={resetDesktopDetailWidth}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => desktopDetailFullscreen ? exitDesktopDetailFullscreen() : setDesktopDetailFullscreen(true)}
                                className={`desktop-detail-expand-toggle${desktopDetailFullscreen ? ' desktop-detail-expand-toggle--fullscreen' : ''}`}
                                aria-label={desktopDetailFullscreen ? '退出详情全屏' : '向左展开详情'}
                                title={desktopDetailFullscreen ? '退出详情全屏' : '向左展开详情'}
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    {desktopDetailFullscreen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
                                    )}
                                </svg>
                            </button>
                            {!desktopDetailFullscreen && (
                                <button
                                    type="button"
                                    onClick={collapseDesktopDetailToInitial}
                                    className="desktop-detail-collapse-toggle"
                                    aria-label="回到初始状态"
                                    title="回到初始状态"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}

                    {returnHomeSaving && (
                        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-[#f8f4e8]/72 px-6 py-10 text-center text-stone-900 backdrop-blur-[2px]">
                            <div className="max-w-sm rounded-lg border border-amber-900/20 bg-[#fff9ec]/95 px-6 py-5 shadow-[0_18px_50px_rgba(70,45,15,0.22)]">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-900/25 border-t-amber-800" aria-hidden="true" />
                                <div className="font-serif text-lg font-bold text-amber-950">正在保存存档中</div>
                                <div className="mt-2 text-sm leading-6 text-stone-700">正在保存当前进度，完成后会自动返回首页。</div>
                            </div>
                        </div>
                    )}

                    {meta.notifications && meta.notifications.length > 0 && (
                        <div className="fixed right-4 bottom-16 md:bottom-14 z-[10000] flex flex-col gap-2 pointer-events-none">
                            {meta.notifications.map((toast) => (
                                <div
                                    key={toast.id}
                                    className={`pointer-events-auto w-[280px] rounded-xl border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md ${
                                        toast.tone === 'success'
                                            ? 'border-emerald-600/50 bg-emerald-950/85 text-emerald-100'
                                            : toast.tone === 'error'
                                                ? 'border-red-600/50 bg-red-950/85 text-red-100'
                                                : 'border-sky-600/50 bg-sky-950/85 text-sky-100'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {toast.previewUrl && (
                                            <div className="shrink-0 h-16 w-16 overflow-hidden rounded-lg border border-white/20 bg-black/25">
                                                <img
                                                    src={toast.previewUrl}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold" style={{ fontSize: 'var(--ui-compact-font-size, 14px)' }}>{toast.title}</div>
                                            <div className="mt-1 opacity-90" style={{ fontSize: 'var(--ui-compact-font-size, 14px)', lineHeight: '1.55' }}>{toast.message}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => actions.dismissNotification(toast.id)}
                                            className="shrink-0 opacity-70 hover:opacity-100"
                                            style={{ fontSize: 'var(--ui-micro-font-size, 12px)' }}
                                        >
                                            关闭
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!hideBottomTicker && (
                        <div
                            className="hidden md:flex shrink-0 h-[37px] bg-ink-black/90 border-t border-wuxia-gold/20 justify-between px-4 items-center font-mono text-wuxia-gold-dark z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.8)] relative rounded-b-xl mx-1 mb-1 overflow-hidden"
                            style={{ fontSize: 'var(--ui-compact-mono-font-size, 12px)' }}
                        >
                            <button type="button" onClick={openWorld} className="shrink-0 text-wuxia-gold font-bold mr-2 z-20 bg-ink-black/90 px-2 flex items-center h-full border-r border-gray-800 text-transparent relative hover:bg-wuxia-gold/10 transition-colors cursor-pointer">
                                <span className="absolute inset-0 flex items-center px-2 text-wuxia-gold">【世界大事】</span>
                                【世界大事】
                            </button>

                            <div className="flex-1 overflow-hidden relative h-full flex items-center mx-2">
                                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-ink-black to-transparent z-10 pointer-events-none"></div>
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-ink-black to-transparent z-10 pointer-events-none"></div>

                                {tickerEvents && tickerEvents.length > 0 ? (
                                    <div className="w-full overflow-hidden">
                                        <div
                                            className="flex items-center gap-10 whitespace-nowrap min-w-max animate-marquee-linear text-wuxia-gold/70 font-mono tracking-wider"
                                            style={{ ['--marquee-duration' as any]: '36s', fontSize: 'var(--ui-compact-mono-font-size, 12px)' }}
                                        >
                                            <div className="flex items-center gap-10">
                                                {renderTickerItems(tickerEvents, 'd')}
                                            </div>
                                            <div className="flex items-center gap-10" aria-hidden>
                                                {renderTickerItems(tickerEvents, 'd-dup')}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full text-center text-gray-700 font-mono tracking-widest text-transparent relative" style={{ fontSize: 'var(--ui-compact-mono-font-size, 12px)' }}>
                                        <span className="absolute inset-0 flex items-center justify-center text-gray-700">江湖平静，暂时无大事发生...</span>
                                        江湖平静，暂无大事发生...
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 text-wuxia-gold font-bold ml-2 z-20 bg-ink-black/90 px-2 flex items-center h-full border-l border-gray-800 text-transparent relative">
                                <span className="absolute inset-0 flex items-center px-2 text-wuxia-gold">【V{RELEASE_INFO.versionName}】</span>
                                【V{RELEASE_INFO.versionName}】
                            </div>
                        </div>
                    )}
                </div>
                </ModalErrorBoundary>
            )}

            {/* Global Golden Border Frame */}
            <div className="global-golden-frame pointer-events-none fixed inset-3 z-[100] border-4 border-double border-wuxia-gold/40 rounded-2xl shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                {/* Corner Ornaments */}
                <div className="global-golden-frame-corner absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-wuxia-gold rounded-tl-xl shadow-[-2px_-2px_5px_rgba(0,0,0,0.5)]"></div>
                <div className="global-golden-frame-corner absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-wuxia-gold rounded-tr-xl shadow-[2px_-2px_5px_rgba(0,0,0,0.5)]"></div>
                <div className="global-golden-frame-corner absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-wuxia-gold rounded-bl-xl shadow-[-2px_2px_5px_rgba(0,0,0,0.5)]"></div>
                <div className="global-golden-frame-corner absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-wuxia-gold rounded-br-xl shadow-[2px_2px_5px_rgba(0,0,0,0.5)]"></div>
                
                {/* Mid-point Accents */}
                <div className="global-golden-frame-accent absolute top-1/2 left-0 w-1 h-12 -translate-y-1/2 bg-wuxia-gold/60"></div>
                <div className="global-golden-frame-accent absolute top-1/2 right-0 w-1 h-12 -translate-y-1/2 bg-wuxia-gold/60"></div>
            </div>

            {/* Save/Load Modal */}
            {safeShowSaveLoad.show && (
                <div className={desktopRightDetailClass}>
                <懒加载边界>
                    <SaveLoadModal 
                        onClose={closeSaveLoad}
                        onLoadGame={actions.handleLoadGame}
                        onSaveGame={actions.handleSaveGame}
                        mode={safeShowSaveLoad.mode}
                        requestConfirm={requestConfirm}
                    />
                </懒加载边界>
                </div>
            )}

            {/* Settings Modal */}
            {state.showSettings && (
                <div className={desktopRightDetailClass}>
                <懒加载边界>
                    <SettingsModal
                            activeTab={state.activeTab}
                            onTabChange={setters.setActiveTab}
                            onClose={closeSettings}
                            apiConfig={state.apiConfig}
                            visualConfig={state.visualConfig}
                            gameConfig={state.gameConfig}
                            memoryConfig={state.memoryConfig}
                            prompts={state.prompts}
                            currentTheme={state.currentTheme}
                            history={state.历史记录}
                            memorySystem={state.记忆系统}
                            socialList={state.社交}
                            runtimeState={runtimeStateSections}
                            currentStory={state.剧情}
                            openingConfig={state.开局配置}
                            contextSnapshot={contextSnapshot}
                            onSaveApi={actions.saveSettings}
                            onSaveVisual={actions.saveVisualSettings}
                            onSaveGame={actions.saveGameSettings}
                            onSaveMemory={actions.saveMemorySettings}
                            onDeleteMemory={handleDeleteMemory}
                            onRefineMemories={handleRefineMemories}
                            onRegenerateMapFromMemory={handleRegenerateMapFromMemory}
                            onCreateNpc={actions.createNpcManually}
                            onSaveNpc={actions.updateNpcManually}
                            onDeleteNpc={actions.deleteNpcManually}
                            onRestoreNpcBackup={actions.restoreNpcVariableBackup}
                            onStartNpcMemorySummary={actions.handleQueueManualNpcMemorySummary}
                            onUploadNpcImage={actions.uploadNpcImageToSlot}
                            onReplaceVariableSection={actions.updateRuntimeVariableSection}
                            onApplyVariableCommand={actions.applyRuntimeVariableCommand}
                            onUpdatePrompts={actions.updatePrompts}
                            onThemeChange={setters.setCurrentTheme}
                            requestConfirm={requestConfirm}
                            onReturnToHome={handleReturnToHomeFromSettings}
                            isHome={state.view === 'home'}
                            returnHomeSaving={returnHomeSaving}
                        />
                </懒加载边界>
                </div>
            )}

            {showWorldbookManager && (
                <懒加载边界>
                    <WorldbookManagerModal
                        builtinPromptEntries={meta.builtinPromptEntries}
                        worldbooks={meta.worldbooks}
                        worldbookPresetGroups={meta.worldbookPresetGroups}
                        onSaveBuiltinPromptEntries={actions.saveBuiltinPromptEntries}
                        onSaveWorldbooks={actions.saveWorldbooks}
                        onSaveWorldbookPresetGroups={actions.saveWorldbookPresetGroups}
                        onClose={() => setShowWorldbookManager(false)}
                        requestConfirm={requestConfirm}
                    />
                </懒加载边界>
            )}

            <InAppConfirmModal
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                danger={confirmState.danger}
                onConfirm={() => resolveConfirm(true)}
                onCancel={() => resolveConfirm(false)}
            />

            {state.view === 'game' && meta.memorySummaryOpen && (
                <懒加载边界>
                    <MemorySummaryFlowModal
                        open={true}
                        stage={(meta.memorySummaryStage || 'remind') as 'remind' | 'processing' | 'review'}
                        task={meta.memorySummaryTask || null}
                        draft={meta.memorySummaryDraft || ''}
                        error={meta.memorySummaryError || ''}
                        onStart={() => { void actions.handleStartMemorySummary(); }}
                        onCancel={actions.handleCancelMemorySummary}
                        onBack={actions.handleBackToMemorySummaryRemind}
                        onDraftChange={actions.handleUpdateMemorySummaryDraft}
                        onApply={actions.handleApplyMemorySummary}
                    />
                </懒加载边界>
            )}

            {state.view === 'game' && !meta.memorySummaryOpen && meta.npcMemorySummaryOpen && (
                <懒加载边界>
                    <NpcMemorySummaryFlowModal
                        open={true}
                        stage={(meta.npcMemorySummaryStage || 'remind') as 'remind' | 'processing' | 'review'}
                        task={meta.npcMemorySummaryTask || null}
                        queueLength={meta.npcMemorySummaryQueueLength || 0}
                        draft={meta.npcMemorySummaryDraft || ''}
                        error={meta.npcMemorySummaryError || ''}
                        onStart={() => { void actions.handleStartNpcMemorySummary(); }}
                        onCancel={actions.handleCancelNpcMemorySummary}
                        onBack={actions.handleBackToNpcMemorySummaryRemind}
                        onDraftChange={actions.handleUpdateNpcMemorySummaryDraft}
                        onApply={actions.handleApplyNpcMemorySummary}
                    />
                </懒加载边界>
            )}

            {showImageManager && (
                <div className={desktopRightDetailClass}>
                <懒加载边界>
                    <ImageManagerModal
                            socialList={state.社交}
                            playerCharacter={state.角色}
                            cultivationSystemEnabled={false}
                            itemImageSequence={itemImageSequence}
                            queue={meta.imageGenerationQueue || []}
                            sceneArchive={meta.sceneImageArchive || {}}
                            sceneQueue={meta.sceneImageQueue || []}
                            apiConfig={state.apiConfig}
                            imageManagerConfig={state.imageManagerConfig}
                            femboyNsfwEnabled={safeGameConfig?.启用NSFW模式 === true && safeGameConfig?.启用男娘NSFW内容 !== false}
                            currentPersistentWallpaper={state.visualConfig?.常驻壁纸 || ''}
                            onSaveApiConfig={actions.saveSettings}
                            onSaveImageManagerConfig={actions.saveImageManagerSettings}
                            onGenerateImage={actions.generateNpcImageManually}
                            onGenerateSecretPartImage={actions.generateNpcSecretPartImage}
                            onRetryImage={actions.retryNpcImageGeneration}
                            onGenerateSceneImage={actions.generateSceneImageManually}
                            onSelectAvatarImage={actions.selectNpcAvatarImage}
                            onSelectPortraitImage={actions.selectNpcPortraitImage}
                            onSelectBackgroundImage={actions.selectNpcBackgroundImage}
                            onClearAvatarImage={actions.clearNpcAvatarImage}
                            onClearPortraitImage={actions.clearNpcPortraitImage}
                            onClearBackgroundImage={actions.clearNpcBackgroundImage}
                            onDeleteImageRecord={actions.removeNpcImageRecord}
                            onClearImageHistory={actions.clearNpcImageHistory}
                            onDeleteQueueTask={actions.removeNpcImageQueueTask}
                            onClearQueue={actions.clearNpcImageQueue}
                            onSaveImageLocally={actions.saveNpcImageLocally}
                            onSelectPlayerAvatarImage={actions.selectPlayerAvatarImage}
                            onClearPlayerAvatarImage={actions.clearPlayerAvatarImage}
                            onSelectPlayerPortraitImage={actions.selectPlayerPortraitImage}
                            onClearPlayerPortraitImage={actions.clearPlayerPortraitImage}
                            onRemovePlayerImageRecord={actions.removePlayerImageRecord}
                            onApplySceneWallpaper={actions.applySceneImageWallpaper}
                            onClearSceneWallpaper={actions.clearSceneWallpaper}
                            onDeleteSceneImage={actions.removeSceneImageRecord}
                            onClearSceneHistory={actions.clearSceneImageHistory}
                            onDeleteSceneQueueTask={actions.removeSceneImageQueueTask}
                            onClearSceneQueue={actions.clearSceneImageQueue}
                            onClearItemImageHistory={actions.clearItemImageHistory}
                            onSaveSceneImageLocally={actions.saveSceneImageLocally}
                            onSetPersistentWallpaper={actions.setPersistentWallpaper}
                            onClearPersistentWallpaper={actions.clearPersistentWallpaper}
                            onSavePngStylePreset={actions.savePngStylePreset}
                            onDeletePngStylePreset={actions.deletePngStylePreset}
                            onSetCurrentPngStylePreset={actions.setCurrentPngStylePreset}
                            onParsePngStylePreset={actions.parsePngStylePreset}
                            onExportPngStylePresets={actions.exportPngStylePresets}
                            onImportPngStylePresets={actions.importPngStylePresets}
                            onSaveCharacterAnchor={actions.saveCharacterAnchor}
                            onDeleteCharacterAnchor={actions.deleteCharacterAnchor}
                            onExtractCharacterAnchor={actions.extractCharacterAnchor}
                            onClose={() => setShowImageManager(false)}
                        />
                </懒加载边界>
                </div>
            )}

            {/* In-Game Modals */}
            {state.view === 'game' && (
                <div className={desktopRightDetailClass}>
                    {state.showInventory && (
                        <懒加载边界>
                            <InventoryModal
                                character={state.角色}
                                openingConfig={state.开局配置}
                                initialSelectedItemRef={inventoryInitialItemRef}
                                onCharacterChange={(nextCharacter: any) => {
                                    setters.setCharacter(nextCharacter);
                                    void actions.performAutoSave?.({ role: nextCharacter, force: true });
                                }}
                                onDiscardItem={handleDiscardBagItem}
                                onDiscardAllMisc={handleDiscardAllMiscItems}
                                onRegenerateItemImage={handleRegenerateBagItemImage}
                                onClose={() => setters.setShowInventory(false)}
                            />
                        </懒加载边界>
                    )}

                    {showCharacter && (
                        <懒加载边界>
                             <CharacterModal
                                character={state.角色}
                                onClose={() => setShowCharacter(false)}
                                visualConfig={effectiveVisualConfig}
                                apiConfig={state.apiConfig}
                                playerAnchor={主角锚点}
                                nsfwEnabled={safeGameConfig?.启用NSFW模式 === true}
                                femboyNsfwEnabled={safeGameConfig?.启用男娘NSFW内容 !== false}
                                onGeneratePlayerImage={actions.generatePlayerImageManually}
                                onGeneratePlayerSecretPartImage={actions.generatePlayerSecretPartImage}
                                onExtractPlayerAnchor={actions.extractPlayerCharacterAnchor}
                                onSavePlayerAnchor={actions.saveCharacterAnchor}
                                onDeletePlayerAnchor={actions.deleteCharacterAnchor}
                                onSelectPlayerAvatarImage={actions.selectPlayerAvatarImage}
                                onClearPlayerAvatarImage={actions.clearPlayerAvatarImage}
                                onSelectPlayerPortraitImage={actions.selectPlayerPortraitImage}
                                onClearPlayerPortraitImage={actions.clearPlayerPortraitImage}
                                onRemovePlayerImageRecord={actions.removePlayerImageRecord}
                                onAllocateAttributePoint={handleAllocateAttributePoint}
                            />
                        </懒加载边界>
                    )}

                    {state.showEquipment && (
                        <懒加载边界>
                            <EquipmentModal 
                                character={state.角色} 
                                openingConfig={state.开局配置}
                                onCharacterChange={(nextCharacter: any) => {
                                    setters.setCharacter(nextCharacter);
                                    void actions.performAutoSave?.({ role: nextCharacter, force: true });
                                }}
                                onClose={() => setters.setShowEquipment(false)} 
                            />
                        </懒加载边界>
                    )}

                    {state.showTeam && (
                        <懒加载边界>
                            <TeamModal
                                character={state.角色}
                                teammates={state.社交}
                                openingConfig={state.开局配置}
                                onClose={() => setters.setShowTeam(false)}
                            />
                        </懒加载边界>
                    )}

                    {state.showSocial && (
                        <懒加载边界>
                            <SocialModal
                                socialList={state.社交}
                                cultivationSystemEnabled={false}
                                openingConfig={state.开局配置}
                                onClose={() => setters.setShowSocial(false)}
                                selectedNpcId={selectedSocialNpcId}
                                onSelectedNpcIdChange={setSelectedSocialNpcId}
                                playerName={safeCharacter?.姓名 || ''}
                                nsfwEnabled={safeGameConfig?.启用NSFW模式 === true}
                                femboyNsfwEnabled={safeGameConfig?.启用男娘NSFW内容 !== false}
                                onToggleMajorRole={actions.updateNpcMajorRole}
                                onTogglePresence={actions.updateNpcPresence}
                                onDeleteNpc={actions.removeNpc}
                                onLearnSkill={handleLearnNpcSkill}
                                onStealFromNpc={handleStealFromNpc}
                                onRetryImage={actions.retryNpcImageGeneration}
                                playerSect={state.玩家门派}
                            />
                        </懒加载边界>
                    )}

                    {state.showWorld && (
                        <懒加载边界>
                            <WorldModal
                                world={state.世界}
                                worldEvolutionEnabled={meta.worldEvolutionEnabled}
                                worldEvolutionUpdating={meta.worldEvolutionUpdating}
                                worldEvolutionStatus={meta.worldEvolutionStatus}
                                worldEvolutionLastUpdatedAt={meta.worldEvolutionLastUpdatedAt}
                                worldEvolutionLastSummary={meta.worldEvolutionLastSummary}
                                worldEvolutionLastRawText={meta.worldEvolutionLastRawText}
                                onForceUpdate={actions.handleForceWorldEvolutionUpdate}
                                onClose={() => setters.setShowWorld(false)}
                                social={state.社交}
                                playerLocation={state.环境?.具体地点 || state.环境?.当前位置 || ''}
                                playerLocationPath={state.环境?.位置路径 || ''}
                            />
                        </懒加载边界>
                    )}

                    {state.showMap && (
                        <懒加载边界>
                            <MapModal
                                world={state.世界}
                                env={state.环境}
                                socialList={state.社交}
                                playerName={safeCharacter?.姓名 || ''}
                                uiLabels={题材界面文案}
                                debugEnabled={(state.gameConfig as any)?.启用研发诊断模式 === true}
                                onOpenPerson={openNpcDetailFromRecord}
                                onRegenerateMap={handleRegenerateMap}
                                onInsertCommand={insertChatDraft}
                                rawResponse={mapRegenerateRawText}
                                onClose={() => setters.setShowMap(false)}
                            />
                        </懒加载边界>
                    )}

                    {state.showTask && (
                        <懒加载边界>
                            <TaskModal
                                tasks={state.任务列表}
                                onDeleteTask={actions.removeTask}
                                playerSect={state.玩家门派}
                                topicMode={state.开局配置?.题材模式}
                                uiLabels={题材界面文案}
                                onClose={() => setters.setShowTask(false)}
                            />
                        </懒加载边界>
                    )}

                    {state.showAgreement && (
                        <懒加载边界>
                            <AgreementModal
                                agreements={state.约定列表}
                                onDeleteAgreement={actions.removeAgreement}
                                onClose={() => setters.setShowAgreement(false)}
                            />
                        </懒加载边界>
                    )}

                    {state.showStory && (
                        <懒加载边界>
                            <StoryModal
                                story={state.剧情}
                                storyPlan={当前剧情规划}
                                isFandomMode={启用同人模式}
                                onClose={() => setters.setShowStory(false)}
                            />
                        </懒加载边界>
                    )}

                    {showNovelExport && (
                        <懒加载边界>
                            <NovelExportModal
                                isOpen={showNovelExport}
                                onClose={closeNovelExport}
                                history={state.历史记录}
                                apiSettings={state.apiConfig}
                                onOpenPolishSettings={openPolishSettings}
                            />
                        </懒加载边界>
                    )}

                    {state.showHeroinePlan && safeGameConfig?.启用女主剧情规划 === true && (
                        <懒加载边界>
                            <HeroinePlanModal
                                plan={当前女主剧情规划}
                                isFandomMode={启用同人模式}
                                onClose={() => setters.setShowHeroinePlan(false)}
                            />
                        </懒加载边界>
                    )}

                    {state.showMemory && (
                        <懒加载边界>
                            <MemoryModal
                                history={state.历史记录}
                                memorySystem={state.记忆系统}
                                onClose={() => setters.setShowMemory(false)}
                                currentTime={currentEnvTime}
                                onSaveMemory={actions.updateMemorySystem}
                                onStartMemorySummary={actions.handleStartManualMemorySummary}
                            />
                        </懒加载边界>
                    )}
                </div>
            )}
        </div>
    </>
    );
};

export default App;
