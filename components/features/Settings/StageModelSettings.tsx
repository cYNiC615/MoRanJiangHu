import React, { useEffect, useMemo, useState } from 'react';
import { 默认文章优化提示词 } from '../../../prompts/runtime/defaults';
import { 接口设置结构, 单接口配置结构, 功能模型占位配置结构 } from '../../../types';
import { 规范化接口设置 } from '../../../utils/apiConfig';
import GameButton from '../../ui/GameButton';
import ToggleSwitch from '../../ui/ToggleSwitch';
import StageApiModelSelector from './StageApiModelSelector';

type PlaceholderKey = keyof 功能模型占位配置结构;
export type ProfileId = 'memory_summary' | 'memory_refine' | 'polish' | 'world_evolution' | 'variable_model' | 'planning_model';

type StageProfile = {
    title: string;
    subtitle?: string;
    info: string;
    modelTitle: string;
    toggleLabel: string;
    independentKey: PlaceholderKey;
    modelKey: PlaceholderKey;
    channelKey: PlaceholderKey;
    baseUrlKey: PlaceholderKey;
    apiKeyKey: PlaceholderKey;
    validateMessage: string;
    disabledStatus?: string;
    disabledPlaceholder?: string;
    clearModelWhenDisabled?: boolean;
    fallbackFromActiveConfig?: boolean;
    accent?: 'gold' | 'cyan';
    feature?: {
        key: PlaceholderKey;
        title: string;
        description: string;
        disabledPlaceholder: string;
        disabledStatus: string;
    };
    tips?: {
        title: string;
        lines: string[];
    };
    note?: string;
    polishPrompt?: boolean;
};

// ponytail: one profile table replaces six copy-pasted model setting pages.
const stageProfiles: Record<ProfileId, StageProfile> = {
    memory_summary: {
        title: '记忆总结模型',
        info: '该设置同时作用于“短期转中期”“中期转长期”以及 NPC 记忆总结流程；留空时复用主配置。',
        modelTitle: '记忆总结',
        toggleLabel: '开启记忆总结独立模型',
        independentKey: '记忆总结独立模型开关',
        modelKey: '记忆总结使用模型',
        channelKey: '记忆总结渠道ID',
        baseUrlKey: '记忆总结API地址',
        apiKeyKey: '记忆总结API密钥',
        validateMessage: '已开启记忆总结独立模型，请先获取列表并选择模型。',
        disabledStatus: '当前状态：跟随剧情回忆接口，若剧情回忆未启用则回退主剧情接口。'
    },
    memory_refine: {
        title: '记忆精炼模型',
        info: '该设置作用于“互动历史”中的 AI 精炼总结功能；留空时回退记忆总结接口。',
        modelTitle: '记忆精炼',
        toggleLabel: '开启记忆精炼独立模型',
        independentKey: '记忆精炼独立模型开关',
        modelKey: '记忆精炼使用模型',
        channelKey: '记忆精炼渠道ID',
        baseUrlKey: '记忆精炼API地址',
        apiKeyKey: '记忆精炼API密钥',
        validateMessage: '已开启记忆精炼独立模型，请先获取列表并选择模型。',
        disabledStatus: '当前状态：跟随记忆总结接口，若记忆总结未配置则回退主剧情接口。',
        disabledPlaceholder: '跟随记忆总结模型（回退主剧情）',
        tips: {
            title: '提示',
            lines: [
                '1. 该功能仅针对回忆条目过多（如 500+）时使用，正常游玩无需开启。模型使用 3 Flash 即可。',
                '2. 精炼为手动操作：在设置 → 互动历史中勾选需要压缩的回忆条目，点击“AI 精炼总结”即可。',
                '3. 推荐每次精炼 15 条左右，条目过多可能导致概况内容不全。',
                '4. 精炼前请确认勾选的条目中不包含已精炼的内容（如“精炼纪要”），避免重复精炼导致信息失真。'
            ]
        }
    },
    polish: {
        title: '文章优化模型',
        info: '开启后才会自动润色 <正文>；可单独指定 Base URL 与 API Key，留空时复用主配置。',
        modelTitle: '文章优化',
        toggleLabel: '开启文章优化独立模型',
        independentKey: '文章优化独立模型开关',
        modelKey: '文章优化使用模型',
        channelKey: '文章优化渠道ID',
        baseUrlKey: '文章优化API地址',
        apiKeyKey: '文章优化API密钥',
        validateMessage: '已开启文章优化独立模型，请先获取列表并选择模型。',
        disabledStatus: '当前状态：自动润色关闭',
        polishPrompt: true
    },
    world_evolution: {
        title: '世界演变模型',
        info: '可为世界演变单独指定 Base URL 与 API Key；留空时复用主配置。',
        modelTitle: '世界演变',
        toggleLabel: '开启世界演变独立模型',
        independentKey: '世界演变独立模型开关',
        modelKey: '世界演变使用模型',
        channelKey: '世界演变渠道ID',
        baseUrlKey: '世界演变API地址',
        apiKeyKey: '世界演变API密钥',
        validateMessage: '已开启世界演变独立模型，请先获取列表并选择模型。',
        disabledStatus: '当前状态：世界演变自动更新关闭',
        feature: {
            key: '世界演变功能启用',
            title: '开启动态世界功能',
            description: '关闭后，开局和正文后的世界推演都会跳过，存档内“世界”入口也会隐藏。',
            disabledPlaceholder: '动态世界功能未开启',
            disabledStatus: '当前状态：动态世界功能未开启，开局和正文后世界推演会跳过。'
        }
    },
    variable_model: {
        title: '变量生成',
        subtitle: '统一管理变量生成总开关、模型与接口。这里的开关只影响本地确定性修正和独立变量生成链路，不再向主剧情正文上下文注入旧式变量命令协议。',
        info: '开启后，会启用本地确定性修正与独立变量生成链路；关闭后，两者都会停用，但不会影响主剧情正文上下文。',
        modelTitle: '变量生成',
        toggleLabel: '启用变量生成',
        independentKey: '变量计算独立模型开关',
        modelKey: '变量计算使用模型',
        channelKey: '变量计算渠道ID',
        baseUrlKey: '变量计算API地址',
        apiKeyKey: '变量计算API密钥',
        validateMessage: '已开启变量独立模型，请先获取列表并选择模型。',
        clearModelWhenDisabled: false,
        fallbackFromActiveConfig: true,
        accent: 'cyan',
        note: '返回内容只用于变量更新，不参与正文生成。变量模型失败时，会自动回退为“主剧情命令 + 本地变量修正”。'
    },
    planning_model: {
        title: '规划分析',
        subtitle: '统一负责剧情规划与女主规划的每回合分析修订，失败时回退为主流程状态。',
        info: '',
        modelTitle: '规划分析',
        toggleLabel: '启用规划分析独立模型',
        independentKey: '规划分析独立模型开关',
        modelKey: '规划分析使用模型',
        channelKey: '规划分析渠道ID',
        baseUrlKey: '规划分析API地址',
        apiKeyKey: '规划分析API密钥',
        validateMessage: '已开启规划分析独立模型，请先获取列表并选择模型。',
        clearModelWhenDisabled: false,
        fallbackFromActiveConfig: true,
        accent: 'cyan',
        feature: {
            key: '规划分析功能启用',
            title: '开启规划分析功能',
            description: '关闭后，开局和正文后的规划分析都会跳过，存档内“规划”入口也会隐藏。',
            disabledPlaceholder: '规划分析功能未开启',
            disabledStatus: '当前状态：规划分析功能未开启，开局和正文后规划分析会跳过。'
        }
    }
};

interface Props {
    profile: ProfileId;
    settings: 接口设置结构;
    onSave: (settings: 接口设置结构) => void;
}

const readText = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

const StageModelSettings: React.FC<Props> = ({ profile, settings, onSave }) => {
    const config = stageProfiles[profile];
    const [form, setForm] = useState<接口设置结构>(() => 规范化接口设置(settings));
    const [message, setMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setForm(规范化接口设置(settings));
    }, [settings]);

    const activeConfig = useMemo<单接口配置结构 | null>(() => {
        if (!form.configs.length) return null;
        return form.configs.find((cfg) => cfg.id === form.activeConfigId) || form.configs[0] || null;
    }, [form.activeConfigId, form.configs]);

    const mainModel = readText(form.功能模型占位.主剧情使用模型);
    const fallbackModel = config.fallbackFromActiveConfig
        ? readText(activeConfig?.model) || mainModel
        : mainModel;
    const featureEnabled = config.feature
        ? form.功能模型占位[config.feature.key] !== false
        : true;
    const independentEnabled = Boolean(form.功能模型占位[config.independentKey]);
    const modelEnabled = featureEnabled && independentEnabled;
    const accent = config.accent === 'cyan' ? 'cyan' : 'gold';
    const headingBorderClass = accent === 'cyan' ? 'border-cyan-500/30' : 'border-wuxia-gold/30';
    const headingTextClass = accent === 'cyan' ? 'text-cyan-200' : 'text-wuxia-gold';
    const panelClass = accent === 'cyan'
        ? 'rounded-md border border-cyan-500/20 bg-cyan-950/10 p-4 space-y-4'
        : 'rounded-md border border-wuxia-gold/20 bg-black/25 p-4 space-y-4';
    const inputFocusClass = accent === 'cyan' ? 'focus:border-cyan-400' : 'focus:border-wuxia-gold';
    const footerBorderClass = accent === 'cyan' ? 'border-cyan-500/20' : 'border-wuxia-gold/20';
    const messageClass = accent === 'cyan' ? 'text-xs text-cyan-300 animate-pulse' : 'text-xs text-wuxia-cyan animate-pulse';

    const updatePlaceholder = <K extends PlaceholderKey>(key: K, value: 功能模型占位配置结构[K]) => {
        setForm((prev) => ({
            ...prev,
            功能模型占位: {
                ...prev.功能模型占位,
                [key]: value
            }
        }));
    };

    const handleToggleIndependent = (checked: boolean) => {
        setForm((prev) => {
            const currentModel = readText(prev.功能模型占位[config.modelKey]);
            const shouldClear = config.clearModelWhenDisabled !== false;
            return {
                ...prev,
                功能模型占位: {
                    ...prev.功能模型占位,
                    [config.independentKey]: checked,
                    [config.modelKey]: checked || !shouldClear ? (currentModel || fallbackModel || '') : ''
                } as 功能模型占位配置结构
            };
        });
    };

    const handleSave = () => {
        if (independentEnabled && !readText(form.功能模型占位[config.modelKey])) {
            setMessage(config.validateMessage);
            return;
        }
        const normalized = 规范化接口设置(form);
        onSave(normalized);
        setForm(normalized);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const statusText = !featureEnabled && config.feature
        ? config.feature.disabledStatus
        : (!independentEnabled ? config.disabledStatus : '');
    const apiInputClass = `w-full border p-2 text-white rounded-md outline-none ${
        modelEnabled
            ? `bg-black/50 border-gray-700 ${inputFocusClass}`
            : 'bg-black/30 border-gray-800 text-gray-400'
    }`;
    const promptValue = readText(form.功能模型占位.文章优化提示词)
        ? form.功能模型占位.文章优化提示词
        : 默认文章优化提示词;

    return (
        <div className="space-y-6 text-sm animate-fadeIn">
            <div className={`flex items-center justify-between border-b ${headingBorderClass} pb-3 mb-6`}>
                <div>
                    <h3 className={`${headingTextClass} font-serif font-bold text-xl`}>{config.title}</h3>
                    {config.subtitle && <div className="mt-1 text-xs text-gray-400">{config.subtitle}</div>}
                </div>
            </div>

            <div className={panelClass}>
                <div className="text-[11px] text-gray-400">
                    当前启用接口配置：{activeConfig?.名称 || '未配置'}。{config.info}
                </div>

                {config.tips && (
                    <div className="rounded border border-wuxia-gold/20 bg-wuxia-gold/5 p-3 space-y-1.5 text-[11px]">
                        <div className="text-wuxia-gold font-bold text-xs">{config.tips.title}</div>
                        {config.tips.lines.map((line) => (
                            <div key={line} className="text-gray-300">{line}</div>
                        ))}
                    </div>
                )}

                {config.feature && (
                    <label className={`flex items-center justify-between gap-3 text-xs text-gray-300 rounded-md border ${accent === 'cyan' ? 'border-cyan-500/10' : 'border-wuxia-gold/10'} bg-black/25 p-3`}>
                        <span>
                            <span className={`${headingTextClass} block font-bold`}>{config.feature.title}</span>
                            <span className="mt-1 block text-[11px] text-gray-500">{config.feature.description}</span>
                        </span>
                        <ToggleSwitch
                            checked={featureEnabled}
                            onChange={(checked) => updatePlaceholder(config.feature!.key, checked as any)}
                            ariaLabel={`切换${config.feature.title}`}
                        />
                    </label>
                )}

                <label className="flex items-center justify-between gap-3 text-xs text-gray-300">
                    <span>{config.toggleLabel}</span>
                    <ToggleSwitch
                        checked={independentEnabled}
                        onChange={handleToggleIndependent}
                        disabled={!featureEnabled}
                        ariaLabel={`切换${config.modelTitle}独立模型`}
                    />
                </label>

                <StageApiModelSelector
                    form={form}
                    enabled={modelEnabled}
                    title={config.modelTitle}
                    modelKey={config.modelKey}
                    channelKey={config.channelKey}
                    baseUrlKey={config.baseUrlKey}
                    apiKeyKey={config.apiKeyKey}
                    fallbackModel={fallbackModel}
                    disabledPlaceholder={!featureEnabled && config.feature ? config.feature.disabledPlaceholder : config.disabledPlaceholder}
                    onChange={updatePlaceholder}
                />

                <div className="space-y-1">
                    <label className="text-xs text-gray-300">{config.modelTitle}独立 API 地址（可选）</label>
                    <input
                        type="text"
                        value={readText(form.功能模型占位[config.baseUrlKey])}
                        onChange={(event) => updatePlaceholder(config.baseUrlKey, event.target.value as any)}
                        placeholder={activeConfig?.baseUrl || '留空则复用主剧情 Base URL'}
                        disabled={!modelEnabled}
                        className={apiInputClass}
                    />
                    <div className="text-[11px] text-gray-500">留空则复用主剧情 Base URL；填写后仅{config.modelTitle}请求改用此地址。</div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-gray-300">{config.modelTitle}独立 API 密钥（可选）</label>
                    <input
                        type="password"
                        value={readText(form.功能模型占位[config.apiKeyKey])}
                        onChange={(event) => updatePlaceholder(config.apiKeyKey, event.target.value as any)}
                        placeholder={activeConfig?.apiKey ? '留空则复用主剧情 API Key' : 'sk-...'}
                        disabled={!modelEnabled}
                        className={apiInputClass}
                    />
                    <div className="text-[11px] text-gray-500">留空则复用主剧情 API Key；填写后{config.modelTitle}请求优先使用该密钥。</div>
                </div>

                {statusText && <div className="text-[11px] text-gray-400">{statusText}</div>}
                {config.note && (
                    <div className={`rounded-md border ${accent === 'cyan' ? 'border-cyan-500/20' : 'border-wuxia-gold/20'} bg-black/25 p-3 text-[11px] leading-5 text-gray-400`}>
                        {config.note}
                    </div>
                )}
            </div>

            {config.polishPrompt && (
                <div className="rounded-md border border-wuxia-cyan/25 bg-black/20 p-4 space-y-3">
                    <div className="text-xs text-wuxia-cyan font-bold">润色提示词</div>
                    <textarea
                        value={promptValue}
                        onChange={(event) => updatePlaceholder('文章优化提示词', event.target.value)}
                        className="w-full h-44 bg-black/50 border border-gray-700 p-3 text-white rounded-md outline-none focus:border-wuxia-gold custom-scrollbar resize-none text-xs leading-relaxed"
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => updatePlaceholder('文章优化提示词', 默认文章优化提示词)}
                            className="px-3 py-1.5 text-[11px] rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                        >
                            恢复默认提示词
                        </button>
                    </div>
                </div>
            )}

            {message && <p className={messageClass}>{message}</p>}

            <div className={`pt-6 border-t ${footerBorderClass} mt-8`}>
                <GameButton onClick={handleSave} variant="primary" className="w-full">
                    {showSuccess ? '✔ 配置已保存' : '保存设置'}
                </GameButton>
            </div>
        </div>
    );
};

export default StageModelSettings;
