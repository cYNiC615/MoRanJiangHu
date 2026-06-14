import React, { useMemo, useState } from 'react';
import type { 接口设置结构, OpeningConfig, WorldGenConfig, WorldMapDiyDraft, WorldMapDiyFeature, WorldMapDiyNode, 角色数据结构 } from '../../../types';
import { generateWorldData } from '../../../services/ai/text';
import { 获取主剧情接口配置, 接口配置是否可用 } from '../../../utils/apiConfig';
import {
    buildWorldMapLayersFromDraft,
    buildWorldMapPromptFromDraft,
    normalizeWorldMapDraft,
} from '../../../utils/newGameDiy';
import DiyMapEditor from './DiyMapEditor';

type Props = {
    worldConfig: WorldGenConfig;
    charData?: 角色数据结构;
    openingConfig?: OpeningConfig;
    apiConfig?: 接口设置结构;
    onChange: React.Dispatch<React.SetStateAction<WorldGenConfig>>;
    compact?: boolean;
};

const panelClass = 'rounded-2xl border border-wuxia-gold/20 bg-black/25 p-4';
const inputClass = 'w-full rounded border border-gray-700 bg-black/50 px-2 py-2 text-xs text-white outline-none focus:border-wuxia-gold';
const textAreaClass = `${inputClass} min-h-[72px] resize-y`;
const smallButtonClass = 'rounded border border-wuxia-gold/25 bg-wuxia-gold/10 px-3 py-1.5 text-xs text-wuxia-gold hover:bg-wuxia-gold/20 disabled:opacity-50';

const buildWorldContext = (worldConfig: WorldGenConfig): string => [
    `世界名称：${worldConfig.worldName || '未命名世界'}`,
    `世界版图：${worldConfig.worldSize}`,
    `宗门密度：${worldConfig.sectDensity}`,
    `王朝局势：${worldConfig.dynastySetting || '待生成'}`,
    `天骄/战力设定：${worldConfig.tianjiaoSetting || '待生成'}`,
    worldConfig.worldExtraRequirement ? `玩家额外要求：${worldConfig.worldExtraRequirement}` : '',
    '请优先根据玩家填写的作品、题材、世界名称和关键词生成专属世界观，不要默认套用武侠修仙语汇。'
].filter(Boolean).join('\n');

const patchMapNode = (node: WorldMapDiyNode): WorldMapDiyNode => ({
    ...node,
    description: node.description || `${node.name || '该地点'}是本局可长期抵达的${node.layer}，后续剧情、势力和任务可围绕此处展开。`,
    narrativeCore: node.narrativeCore || (node.scaleFields as any)?.narrativeCore || `${node.name || '该区域'}存在可长期发酵的矛盾、资源压力或人物关系，可由 AI 继续补完为故事钩子。`,
    scaleFields: {
        ...(node.scaleFields || {}),
        narrativeCore: node.narrativeCore || (node.scaleFields as any)?.narrativeCore || `${node.name || '该区域'}存在可长期发酵的矛盾、资源压力或人物关系，可由 AI 继续补完为故事钩子。`,
    },
    climate: node.climate || '气候由地形、纬度和世界观设定共同决定',
    population: node.population || ((node.layer === '小地点' || node.layer === '区地点') ? '人口规模按城镇/建筑定位估算' : '人口分布按区域层级估算'),
    culture: node.culture || '风土人情可由 AI 根据题材补完',
    transport: node.transport || '道路、水路、山道或传送路径按地点层级补完'
});

const patchMapFeature = (feature: WorldMapDiyFeature): WorldMapDiyFeature => ({
    ...feature,
    description: feature.description || `${feature.name || '该地理要素'}会影响周边气候、交通、贸易、势力活动和随机事件生成。`,
    fields: {
        ...(feature.fields || {}),
        类型: feature.fields?.类型 || (feature.type === 'road' ? '官道/商路' : feature.type === 'river' ? '河流' : ''),
        通行难度: feature.fields?.通行难度 || (feature.type === 'mountain' ? '较难通行' : '普通'),
        旅行速度: feature.fields?.旅行速度 || (feature.type === 'portal' ? '极快但需条件' : '普通'),
        安全性: feature.fields?.安全性 || '随剧情局势变化',
        当前状态: feature.fields?.当前状态 || '畅通',
        分叉结构: feature.fields?.分叉结构 || ((feature.type === 'river' || feature.type === 'road' || feature.type === 'waterway') ? '可按支流/支路拆成多条同组线路，并在说明中标明汇入或分叉关系' : ''),
    },
});

const NewGameDiyTools: React.FC<Props> = ({ worldConfig, charData, openingConfig, apiConfig, onChange, compact = false }) => {
    const [mapOpen, setMapOpen] = useState(false);
    const [aiStatus, setAiStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
    const mapDraft = useMemo(() => normalizeWorldMapDraft(worldConfig.mapDiyDraft), [worldConfig.mapDiyDraft]);

    const currentApi = useMemo(() => apiConfig ? 获取主剧情接口配置(apiConfig) : null, [apiConfig]);
    const aiAvailable = 接口配置是否可用(currentApi);

    const updateMapDraft = (draft: WorldMapDiyDraft) => {
        onChange(prev => ({ ...prev, mapDiyDraft: { ...normalizeWorldMapDraft(draft), updatedAt: Date.now() } }));
    };

    const applyMapPrompt = () => {
        const normalized = normalizeWorldMapDraft(worldConfig.mapDiyDraft);
        const prompt = buildWorldMapPromptFromDraft(normalized);
        onChange(prev => ({
            ...prev,
            mapDiyDraft: { ...normalized, enabled: true },
            worldExtraRequirement: [prev.worldExtraRequirement.trim(), prompt].filter(Boolean).join('\n\n')
        }));
    };

    const runMapAiAssist = async (
        target: { kind: 'node'; id: string } | { kind: 'feature'; id: string },
        action: 'complete' | 'polish' | 'check'
    ) => {
        if (!接口配置是否可用(currentApi)) {
            setAiStatus({ type: 'error', message: '请先在设置中配置可用的主剧情 API。' });
            return;
        }
        const normalized = normalizeWorldMapDraft(worldConfig.mapDiyDraft);
        const object = target.kind === 'node'
            ? normalized.nodes.find((node) => node.id === target.id)
            : (normalized.features || []).find((feature) => feature.id === target.id);
        if (!object) {
            setAiStatus({ type: 'error', message: '未找到当前选中的地图对象。' });
            return;
        }
        const actionLabel = action === 'complete' ? '补完字段' : action === 'polish' ? '润色扩写' : '逻辑检查';
        setAiStatus({ type: 'loading', message: `正在对「${object.name || '未命名对象'}」进行${actionLabel}...` });
        try {
            const mapContext = buildWorldMapPromptFromDraft(normalized);
            const prompt = [
                `你是游戏开局 DIY 地图设定助手。当前操作：${actionLabel}。`,
                `目标类型：${target.kind === 'node' ? '区域/地点层级' : '连接型地理要素'}`,
                `目标对象JSON：${JSON.stringify(object)}`,
                `全局地图草稿：\n${mapContext}`,
                action === 'check'
                    ? '请只输出简短逻辑检查建议，指出层级、父级、地理关系、交通、水文、叙事核心或设定矛盾，不要改写原对象。'
                    : '请输出一段可直接写入该对象“描述”的中文设定文本，补足地理、文明、交通、资源、风险、区域核心矛盾和剧情用途，避免输出 JSON。'
            ].join('\n\n');
            const result = await generateWorldData(
                prompt,
                charData || {},
                currentApi,
                undefined,
                `【DIY地图${actionLabel}】请保持简洁，聚焦当前对象。`,
                undefined,
                { openingConfig }
            );
            const content = (result || '').trim();
            if (!content) throw new Error('AI 输出为空');
            if (action === 'check') {
                setAiStatus({ type: 'success', message: content.slice(0, 900) });
                return;
            }
            if (target.kind === 'node') {
                updateMapDraft({
                    ...normalized,
                    nodes: normalized.nodes.map((node) => node.id === target.id
                        ? { ...(action === 'complete' ? patchMapNode(node) : node), description: content }
                        : node
                    )
                });
            } else {
                updateMapDraft({
                    ...normalized,
                    features: (normalized.features || []).map((feature) => feature.id === target.id
                        ? { ...patchMapFeature(feature), description: content }
                        : feature
                    )
                });
            }
            setAiStatus({ type: 'success', message: `${actionLabel}完成，已写入当前地图对象。` });
        } catch (error: any) {
            setAiStatus({ type: 'error', message: `地图 AI 辅助失败：${error?.message || '未知错误'}` });
        }
    };

    const generateWorldPromptWithAI = async () => {
        if (!接口配置是否可用(currentApi)) {
            setAiStatus({ type: 'error', message: '请先在设置中配置 API 地址、密钥和主剧情模型。' });
            return;
        }
        setAiStatus({ type: 'loading', message: '正在生成世界观提示词...' });
        try {
            const prompt = await generateWorldData(
                buildWorldContext(worldConfig),
                charData || {},
                currentApi,
                undefined,
                worldConfig.worldExtraRequirement,
                undefined,
                { openingConfig }
            );
            onChange(prev => ({ ...prev, manualWorldPrompt: prompt }));
            setAiStatus({ type: 'success', message: '已生成世界观提示词，并写入手动世界观。' });
        } catch (error: any) {
            setAiStatus({ type: 'error', message: `世界观生成失败：${error?.message || '未知错误'}` });
        }
    };

    const importReferenceImage = (file?: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            onChange(prev => ({
                ...prev,
                mapDiyDraft: {
                    ...normalizeWorldMapDraft(prev.mapDiyDraft),
                    referenceImage: typeof reader.result === 'string' ? reader.result : '',
                    updatedAt: Date.now()
                }
            }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className={`${panelClass} space-y-3`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="text-sm font-bold text-wuxia-cyan">DIY 辅助</div>
                    <div className="text-[11px] leading-5 text-gray-500">
                        用表单或内置 AI 先保存世界观和地图草稿，再回写到现有开局提示词流程。
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={smallButtonClass} onClick={() => void generateWorldPromptWithAI()} disabled={!aiAvailable || aiStatus.type === 'loading'}>
                        AI 生成世界观
                    </button>
                    <button type="button" className={smallButtonClass} onClick={() => setMapOpen(prev => !prev)}>
                        {mapOpen ? '收起地图 DIY' : '世界地图 DIY'}
                    </button>
                </div>
            </div>
            {aiStatus.message && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${
                    aiStatus.type === 'error'
                        ? 'border-red-400/30 bg-red-950/20 text-red-200'
                        : aiStatus.type === 'success'
                            ? 'border-emerald-400/30 bg-emerald-950/20 text-emerald-200'
                            : 'border-wuxia-cyan/25 bg-wuxia-cyan/10 text-wuxia-cyan'
                }`}>
                    {aiStatus.message}
                </div>
            )}
            {!aiAvailable && (
                <div className="text-[11px] leading-5 text-amber-200/80">
                    AI 辅助会复用主剧情接口；当前未检测到可用 API 配置，仍可先手动填写或使用表单草稿。
                </div>
            )}

            {mapOpen && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div className="text-xs font-bold text-wuxia-gold">世界地图 DIY 画布</div>
                            <div className="mt-1 text-[11px] leading-5 text-gray-400">
                                绘制区域、点位、山脉、水路和道路；开启后会在开局时转化为 AI 可读取的地图层级。
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" className={smallButtonClass} onClick={() => updateMapDraft({
                                ...mapDraft,
                                enabled: true,
                                nodes: mapDraft.nodes.map(patchMapNode),
                                features: (mapDraft.features || []).map(patchMapFeature)
                            })}>补完空项</button>
                            <button type="button" className={smallButtonClass} onClick={applyMapPrompt}>写入世界观要求</button>
                        </div>
                    </div>
                    <DiyMapEditor
                        draft={mapDraft}
                        compact={compact}
                        aiAvailable={aiAvailable}
                        aiBusy={aiStatus.type === 'loading'}
                        aiMessage={aiStatus.message}
                        onChange={updateMapDraft}
                        onImportReferenceImage={importReferenceImage}
                        onAiAssist={runMapAiAssist}
                    />
                    <div className="text-[11px] text-gray-500">当前可生成 {buildWorldMapLayersFromDraft({ ...mapDraft, enabled: true }).length} 个正式地图层级节点；道路、河流和山脉会写入相关地点描述。</div>
                </div>
            )}
        </div>
    );
};

export default NewGameDiyTools;
