import React from 'react';
import { ThemePreset } from '../../types';
import CreativeWorkshopModal from '../features/Workshop/CreativeWorkshopModal';
import GameButton from '../ui/GameButton';

interface Props {
    onStart: () => void;
    onLoad: () => void;
    onImageManager: () => void;
    onWorldbookManager: () => void;
    onSettings: () => void;
    currentTheme: ThemePreset;
    onThemeChange: (theme: ThemePreset) => void;
    hasSave: boolean;
}

const HOME_BACKGROUND_ASSETS = [
    '/assets/home/wuxia-bg-rain-gate.webp',
    '/assets/home/wuxia-bg-mountain-mist.webp',
    '/assets/home/wuxia-bg-snow-inn.webp'
];

const actionButtonStyle: React.CSSProperties = {
    fontFamily: 'var(--ui-按钮-font-family, inherit)',
    fontSize: 'var(--ui-按钮-font-size, 14px)',
    lineHeight: 'var(--ui-按钮-line-height, 1.2)'
};

const hasFullscreenElement = () => {
    const doc = document as Document & {
        webkitFullscreenElement?: Element;
        msFullscreenElement?: Element;
    };

    return !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
    );
};

const requestBrowserFullscreen = async () => {
    const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
        msExitFullscreen?: () => Promise<void> | void;
    };

    const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
    };

    if (!hasFullscreenElement()) {
        const enter = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
        if (!enter) return;
        try {
            await Promise.resolve(enter.call(root));
        } catch (err: unknown) {
            console.error('进入全屏失败:', err);
        }
        return;
    }

    const exit = document.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!exit) return;
    try {
        await Promise.resolve(exit.call(document));
    } catch (err: unknown) {
        console.error('退出全屏失败:', err);
    }
};

const LandingPage: React.FC<Props> = ({
    onStart,
    onLoad,
    onImageManager,
    onWorldbookManager,
    onSettings,
    currentTheme,
    onThemeChange,
    hasSave
}) => {
    const [localPlayOpen, setLocalPlayOpen] = React.useState(false);
    const [workshopOpen, setWorkshopOpen] = React.useState(false);
    const [backgroundIndex, setBackgroundIndex] = React.useState(0);

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setBackgroundIndex((current) => (current + 1) % HOME_BACKGROUND_ASSETS.length);
        }, 16000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="landing-page relative z-40 flex min-h-full w-full max-w-full min-w-0 flex-col items-center rounded-xl bg-black px-4 pt-[max(var(--app-safe-top,env(safe-area-inset-top,0px)),12px)] pb-[calc(var(--app-safe-bottom,env(safe-area-inset-bottom,0px))+16px)]">
            <div className="landing-bg absolute inset-0" aria-hidden="true">
                <div
                    className="landing-bg-art absolute inset-0"
                    style={{ '--landing-bg-image': `url("${HOME_BACKGROUND_ASSETS[backgroundIndex]}")` } as React.CSSProperties}
                />
                <div className="landing-bg-ink absolute inset-0" />
                <div className="landing-bg-vignette absolute inset-0" />
                <div className="landing-bg-grid absolute inset-x-0 bottom-0" />
            </div>

            <div className="landing-topbar relative z-20 mb-3 flex w-full max-w-full min-w-0 flex-wrap items-center justify-center gap-2 pt-2 sm:max-w-6xl sm:justify-end md:mb-4">
                <button
                    type="button"
                    onClick={() => onThemeChange(currentTheme === 'day' ? 'ink' : 'day')}
                    className="landing-topbar-button min-h-[40px] border border-wuxia-cyan/40 bg-black/60 px-3 py-2 text-xs font-serif tracking-[0.18em] text-wuxia-cyan transition-colors hover:bg-black/80 md:text-sm"
                    style={actionButtonStyle}
                    title={currentTheme === 'day' ? '切换到黑夜模式' : '切换到白天模式'}
                >
                    {currentTheme === 'day' ? '黑夜模式' : '白天模式'}
                </button>

                <button
                    type="button"
                    onClick={() => { void requestBrowserFullscreen(); }}
                    className="landing-topbar-button min-h-[40px] border border-wuxia-gold/40 bg-black/60 px-3 py-2 text-xs font-serif tracking-[0.2em] text-wuxia-gold transition-colors hover:bg-black/80 md:text-sm"
                    style={actionButtonStyle}
                    title="切换全屏"
                >
                    全屏
                </button>
            </div>

            <div className="landing-stage relative z-10 flex w-full max-w-full min-w-0 flex-1 flex-col items-center justify-center gap-6 overflow-visible pb-2 lg:max-w-[2200px]">
                <section className="landing-hero-section relative z-20 flex w-full max-w-full min-w-0 flex-col items-center justify-center overflow-x-hidden animate-fadeIn">
                    <div className="relative mb-7 flex w-full max-w-full min-w-0 flex-col items-center">
                        <div className="landing-title-glow absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-wuxia-gold/5 blur-3xl" />

                        <h1
                            onClick={() => { void requestBrowserFullscreen(); }}
                            className="landing-title mb-4 cursor-pointer select-none bg-gradient-to-b from-gray-100 to-gray-500 bg-clip-text text-center font-serif text-7xl font-black tracking-[0.1em] text-transparent drop-shadow-2xl md:text-9xl"
                            style={{
                                fontFamily: 'var(--ui-页面标题-font-family, inherit)',
                                fontSize: 'var(--ui-页面标题-font-size, clamp(3rem,8vw,6rem))',
                                lineHeight: 'var(--ui-页面标题-line-height, 1.2)',
                                fontStyle: 'var(--ui-页面标题-font-style, normal)'
                            }}
                            title="点击切换全屏"
                        >
                            墨色江湖
                        </h1>

                        <div className="landing-subtitle-row flex w-full max-w-full min-w-0 items-center justify-center gap-3 opacity-90 sm:gap-6">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-wuxia-red" />
                            <h2
                                className="text-shadow-sm text-xl font-bold uppercase tracking-[0.5em] text-wuxia-red md:text-2xl"
                                style={{
                                    fontFamily: 'var(--ui-分组标题-font-family, inherit)',
                                    lineHeight: 'var(--ui-分组标题-line-height, 1.35)'
                                }}
                            >
                                却又不止江湖
                            </h2>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-wuxia-red" />
                        </div>

                        <div className="landing-edition-card mt-7 w-full max-w-full border-2 border-amber-400/70 bg-amber-950/35 px-4 py-4 text-center shadow-[0_0_28px_rgba(251,191,36,0.16)] sm:max-w-2xl">
                            <div className="landing-edition-kicker text-sm font-bold tracking-[0.24em] text-amber-200 md:text-base">
                                个人 Homebrew 版本
                            </div>
                            <div className="mt-2 text-xs leading-6 text-amber-50/90 md:text-sm">
                                本地存档、本地设置、世界书、记忆、提示词和图片管理都保留在当前设备内使用。
                            </div>
                        </div>
                    </div>

                    <div className="landing-action-group flex w-[min(16rem,calc(100vw-2rem))] max-w-full flex-col gap-3 animate-slide-in delay-100">
                        <GameButton onClick={() => setLocalPlayOpen(true)} variant="primary" className="py-4 text-lg shadow-lg">
                            本地游玩
                        </GameButton>

                        <GameButton onClick={() => setWorkshopOpen(true)} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-95 shadow-lg hover:opacity-100">
                            本地模式包
                        </GameButton>

                        <GameButton onClick={onImageManager} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-90 shadow-lg hover:opacity-100">
                            图片管理
                        </GameButton>

                        <GameButton onClick={onWorldbookManager} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-90 shadow-lg hover:opacity-100">
                            世界书管理
                        </GameButton>

                        <GameButton onClick={onSettings} variant="secondary" className="border-opacity-50 py-4 text-lg opacity-80 shadow-lg hover:opacity-100">
                            设置
                        </GameButton>
                    </div>
                </section>
            </div>

            {localPlayOpen && (
                <div className="fixed inset-0 z-[430] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm animate-fadeIn" onClick={() => setLocalPlayOpen(false)}>
                    <div
                        className="w-full max-w-md rounded-2xl border border-wuxia-gold/25 bg-[linear-gradient(180deg,rgba(28,20,10,0.98),rgba(6,6,6,0.98))] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.65)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <div className="text-lg font-serif font-bold tracking-[0.18em] text-wuxia-gold">
                                    本地游玩
                                </div>
                                <div className="mt-2 text-sm leading-6 text-amber-50/75">
                                    新开一段故事，或读取本机已有存档继续游玩。
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLocalPlayOpen(false)}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-black/30 text-xl text-amber-100 transition-colors hover:border-amber-300/50 hover:text-white"
                                aria-label="关闭本地游玩选择"
                                title="关闭"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <GameButton
                                onClick={() => {
                                    setLocalPlayOpen(false);
                                    onStart();
                                }}
                                variant="primary"
                                className="py-4 text-lg shadow-lg"
                            >
                                踏入江湖
                            </GameButton>
                            <GameButton
                                onClick={() => {
                                    if (!hasSave) return;
                                    setLocalPlayOpen(false);
                                    onLoad();
                                }}
                                variant="secondary"
                                className={`py-4 text-lg shadow-lg ${!hasSave ? 'cursor-not-allowed grayscale opacity-50' : ''}`}
                                disabled={!hasSave}
                            >
                                重入江湖
                            </GameButton>
                        </div>
                    </div>
                </div>
            )}

            <CreativeWorkshopModal
                open={workshopOpen}
                onClose={() => setWorkshopOpen(false)}
            />
        </div>
    );
};

export default LandingPage;
