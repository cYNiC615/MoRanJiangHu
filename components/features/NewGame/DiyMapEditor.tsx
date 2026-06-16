import React, { useMemo, useRef, useState } from 'react';
import type {
    WorldMapDiyDraft,
    WorldMapDiyFeature,
    WorldMapDiyFeatureType,
    WorldMapDiyGeometry,
    WorldMapDiyLayerType,
    WorldMapDiyNode,
    WorldMapDiyPoint,
} from '../../../types';
import {
    createDiyId,
    normalizeWorldMapDraft,
    世界地图DIY层级选项,
    世界地图DIY要素标签,
} from '../../../utils/newGameDiy';

type ToolMode = 'select' | 'region' | 'point' | WorldMapDiyFeatureType;
type Selection = { kind: 'node'; id: string } | { kind: 'feature'; id: string };

type Props = {
    draft?: WorldMapDiyDraft | null;
    compact?: boolean;
    aiAvailable?: boolean;
    aiBusy?: boolean;
    aiMessage?: string;
    onChange: (draft: WorldMapDiyDraft) => void;
    onImportReferenceImage: (file?: File) => void;
    onAiAssist?: (target: Selection, action: 'complete' | 'polish' | 'check') => Promise<void>;
};

const toolOptions: Array<{ id: ToolMode; label: string; title: string }> = [
    { id: 'select', label: '选择', title: '选择和移动锚点' },
    { id: 'region', label: '区域', title: '绘制封闭区域' },
    { id: 'point', label: '点位', title: '放置城市、地点或建筑点位' },
    { id: 'mountain', label: '山脉', title: '绘制山脉、峡谷、高原边界或灵脉' },
    { id: 'river', label: '河流', title: '绘制河流、水系或魔力潮汐' },
    { id: 'road', label: '道路', title: '绘制官道、商路或山路' },
    { id: 'waterway', label: '水路', title: '绘制运河、航线或海流' },
    { id: 'portal', label: '传送', title: '绘制传送网络或灵脉交通' },
];

const connectionToolHint: Partial<Record<WorldMapDiyFeatureType, string>> = {
    river: '水系可以跨大陆、国家或城市边界，建议挂在能完整容纳它的最高层级；支流可另画一条河流并在说明里写明汇入关系。',
    road: '道路可以跨大陆、国家或城市边界，建议挂在能完整容纳它的最高层级；分叉可另画一条道路并在说明里写明连接关系。',
    waterway: '航线和水路通常属于跨区域交通，建议挂在海域、世界或大陆级父级；支线可另画并标明分叉。',
    route: '交通网络可作为多段线路绘制；分支建议拆成多条同组路线，便于 AI 理解节点关系。',
    portal: '传送网络可跨层级连接地点；建议在连接地点里写明入口、出口和使用条件。',
};

const nodeFieldGroups: Record<WorldMapDiyLayerType, Array<{ key: string; label: string; placeholder: string }>> = {
    寰宇: [
        { key: 'worldSummary', label: '世界简介', placeholder: '诸天、位面、宏观秩序' },
        { key: 'calendar', label: '时间历法', placeholder: '纪元、昼夜、季节机制' },
        { key: 'powerSystem', label: '超凡体系', placeholder: '力量来源与边界' },
    ],
    大地点: [
        { key: 'worldSummary', label: '世界简介', placeholder: '星球/世界整体设定' },
        { key: 'civilization', label: '文明', placeholder: '主要文明与时代阶段' },
        { key: 'race', label: '种族', placeholder: '人族、妖族、异族等' },
        { key: 'climateRules', label: '气候规律', placeholder: '昼夜、季节、天象规律' },
    ],
    中地点: [
        { key: 'geography', label: '地理特征', placeholder: '山川、海岸、地貌骨架' },
        { key: 'climateZone', label: '气候带', placeholder: '湿热、寒带、荒漠等' },
        { key: 'history', label: '历史概况', placeholder: '兴衰、战争、迁徙' },
        { key: 'resources', label: '资源分布', placeholder: '矿脉、灵植、水源' },
    ],
    小地点: [
        { key: 'capital', label: '首都/中心', placeholder: '政治或区域中心' },
        { key: 'government', label: '政体', placeholder: '王朝、宗门、城邦等' },
        { key: 'military', label: '军事', placeholder: '兵力、边防、武备' },
        { key: 'economy', label: '经济体系', placeholder: '税赋、商贸、产业' },
        { key: 'security', label: '治安程度', placeholder: '稳定/混乱/战乱' },
    ],
    区地点: [
        { key: 'cityLayout', label: '城市布局', placeholder: '坊市、城门、街区、地标' },
        { key: 'industry', label: '主要产业', placeholder: '炼器、贸易、农桑等' },
        { key: 'classStructure', label: '阶级结构', placeholder: '官府、门派、商会、平民' },
        { key: 'sectForces', label: '门派势力', placeholder: '本地势力与冲突' },
    ],
    子地点: [
        { key: 'environment', label: '环境描述', placeholder: '室内/洞府/秘境细节' },
        { key: 'residentNpcs', label: '常驻NPC', placeholder: '常驻人物或守卫' },
        { key: 'eventPool', label: '事件池', placeholder: '可能触发的事件' },
        { key: 'hiddenInfo', label: '隐藏信息', placeholder: '机关、秘密、线索' },
    ],
};

const featureFieldGroups: Record<WorldMapDiyFeatureType, Array<{ key: string; label: string; placeholder: string }>> = {
    mountain: [
        { key: '海拔', label: '海拔', placeholder: '低山/高原/万丈雪峰' },
        { key: '危险等级', label: '危险等级', placeholder: '低/中/高/禁地' },
        { key: '特产资源', label: '特产资源', placeholder: '矿脉、灵草、妖兽材料' },
        { key: '交通阻断程度', label: '阻断程度', placeholder: '可绕行/难以翻越/绝境' },
        { key: '超凡异常', label: '超凡异常', placeholder: '灵压、风暴、阵法残留' },
    ],
    river: [
        { key: '流向', label: '流向', placeholder: '自西北向东南' },
        { key: '流量', label: '流量', placeholder: '季节性/丰沛/枯水' },
        { key: '航运能力', label: '航运能力', placeholder: '竹筏/商船/禁航' },
        { key: '洪灾风险', label: '洪灾风险', placeholder: '低/中/高' },
        { key: '文明依赖度', label: '文明依赖度', placeholder: '农业、饮水、祭祀依赖' },
    ],
    road: [
        { key: '类型', label: '类型', placeholder: '官道/商路/山路' },
        { key: '通行难度', label: '通行难度', placeholder: '平坦/泥泞/险峻' },
        { key: '旅行速度', label: '旅行速度', placeholder: '较快/普通/缓慢' },
        { key: '安全性', label: '安全性', placeholder: '安全/盗匪/战乱' },
        { key: '当前状态', label: '当前状态', placeholder: '畅通/封锁/战乱' },
    ],
    waterway: [
        { key: '类型', label: '类型', placeholder: '运河/海流/航线' },
        { key: '航运能力', label: '航运能力', placeholder: '小舟/商船/巨舰' },
        { key: '安全性', label: '安全性', placeholder: '平稳/暗礁/海兽' },
        { key: '商贸流量', label: '商贸流量', placeholder: '低/中/高' },
    ],
    route: [
        { key: '类型', label: '类型', placeholder: '地下通道/灵脉交通' },
        { key: '旅行速度', label: '旅行速度', placeholder: '快速/不稳定' },
        { key: '情报传播速度', label: '情报传播', placeholder: '慢/普通/极快' },
        { key: '常见危险', label: '常见危险', placeholder: '塌方、巡检、劫道' },
    ],
    portal: [
        { key: '类型', label: '类型', placeholder: '传送阵/灵脉节点' },
        { key: '通行难度', label: '通行难度', placeholder: '需令牌/需权限/不稳定' },
        { key: '旅行速度', label: '旅行速度', placeholder: '瞬达/半日/随机' },
        { key: '安全性', label: '安全性', placeholder: '稳定/偏移/反噬' },
    ],
};

const colors: Record<WorldMapDiyFeatureType, string> = {
    mountain: '#7a5a2f',
    river: '#1d7fb8',
    road: '#9b6a2f',
    waterway: '#2366d1',
    route: '#6d5bd0',
    portal: '#b23893',
};

const inputClass = 'w-full rounded border border-[#d8c8aa] bg-[#fffaf0] px-2 py-1.5 text-xs text-[#243047] outline-none focus:border-[#9b5a17]';
const labelClass = 'text-[11px] font-bold text-[#6f4216]';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const polygonPoints = (points: WorldMapDiyPoint[]) => points.map((point) => `${point.x},${point.y}`).join(' ');
const pathD = (points: WorldMapDiyPoint[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

const getSvgPoint = (event: { clientX: number; clientY: number }, svg: SVGSVGElement, draft: WorldMapDiyDraft): WorldMapDiyPoint => {
    const rect = svg.getBoundingClientRect();
    const width = draft.canvas?.width || 1600;
    const height = draft.canvas?.height || 1000;
    return {
        x: clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * width, 0, width),
        y: clamp(((event.clientY - rect.top) / Math.max(1, rect.height)) * height, 0, height),
    };
};

const isFeatureMode = (mode: ToolMode): mode is WorldMapDiyFeatureType => (
    ['mountain', 'river', 'road', 'waterway', 'route', 'portal'].includes(mode)
);

const patchNodeById = (draft: WorldMapDiyDraft, id: string, patch: Partial<WorldMapDiyNode>): WorldMapDiyDraft => ({
    ...draft,
    nodes: draft.nodes.map((node) => node.id === id ? { ...node, ...patch } : node),
    updatedAt: Date.now(),
});

const patchFeatureById = (draft: WorldMapDiyDraft, id: string, patch: Partial<WorldMapDiyFeature>): WorldMapDiyDraft => ({
    ...draft,
    features: (draft.features || []).map((feature) => feature.id === id ? { ...feature, ...patch } : feature),
    updatedAt: Date.now(),
});

const DiyMapEditor: React.FC<Props> = ({
    draft,
    compact = false,
    aiAvailable = false,
    aiBusy = false,
    aiMessage = '',
    onChange,
    onImportReferenceImage,
    onAiAssist,
}) => {
    const normalized = useMemo(() => normalizeWorldMapDraft(draft), [draft]);
    const [tool, setTool] = useState<ToolMode>('select');
    const [selection, setSelection] = useState<Selection>({ kind: 'node', id: normalized.nodes[0]?.id || '' });
    const [drawingPoints, setDrawingPoints] = useState<WorldMapDiyPoint[]>([]);
    const draggingRef = useRef<{ kind: 'node' | 'feature'; id: string; pointIndex: number } | null>(null);
    const composingTextRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const selectedNode = selection.kind === 'node' ? normalized.nodes.find((node) => node.id === selection.id) || null : null;
    const selectedFeature = selection.kind === 'feature' ? (normalized.features || []).find((feature) => feature.id === selection.id) || null : null;
    const parentOptions = normalized.nodes.filter((node) => node.id !== selectedNode?.id);

    const commit = (next: WorldMapDiyDraft) => onChange(normalizeWorldMapDraft({ ...next, updatedAt: Date.now() }));

    const finishDrawing = () => {
        if (tool === 'region') {
            if (drawingPoints.length < 3) return;
            const node: WorldMapDiyNode = {
                id: createDiyId('map'),
                name: `未命名区域${normalized.nodes.length}`,
                layer: '中地点',
                parentId: normalized.nodes[0]?.id || '',
                description: '',
                geometry: { type: 'polygon', points: drawingPoints, closed: true },
                scaleFields: {},
                tags: [],
            };
            commit({ ...normalized, enabled: true, nodes: [...normalized.nodes, node] });
            setSelection({ kind: 'node', id: node.id });
            setDrawingPoints([]);
            setTool('select');
            return;
        }
        if (isFeatureMode(tool)) {
            if (drawingPoints.length < 2) return;
            const defaultParentId = normalized.nodes.find((node) => node.layer === '寰宇')?.id || normalized.nodes[0]?.id || '';
            const feature: WorldMapDiyFeature = {
                id: createDiyId('feature'),
                type: tool,
                name: `未命名${世界地图DIY要素标签[tool]}`,
                parentId: selectedNode?.id || defaultParentId,
                connectedNodeIds: [],
                points: drawingPoints,
                description: '',
                fields: {},
                tags: [],
            };
            commit({ ...normalized, enabled: true, features: [...(normalized.features || []), feature] });
            setSelection({ kind: 'feature', id: feature.id });
            setDrawingPoints([]);
            setTool('select');
        }
    };

    const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const point = getSvgPoint(event, svgRef.current, normalized);
        if (tool === 'point') {
            const node: WorldMapDiyNode = {
                id: createDiyId('map'),
                name: `未命名地点${normalized.nodes.length}`,
                layer: '区地点',
                parentId: selectedNode?.id || normalized.nodes[0]?.id || '',
                description: '',
                geometry: { type: 'point', points: [point] },
                scaleFields: {},
                tags: [],
            };
            commit({ ...normalized, enabled: true, nodes: [...normalized.nodes, node] });
            setSelection({ kind: 'node', id: node.id });
            setTool('select');
            return;
        }
        if (tool === 'region' || isFeatureMode(tool)) {
            setDrawingPoints((prev) => [...prev, point]);
        }
    };

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current || !svgRef.current) return;
        const point = getSvgPoint(event, svgRef.current, normalized);
        const drag = draggingRef.current;
        if (drag.kind === 'node') {
            const target = normalized.nodes.find((node) => node.id === drag.id);
            if (!target?.geometry) return;
            const geometry: WorldMapDiyGeometry = {
                ...target.geometry,
                points: target.geometry.points.map((item, index) => index === drag.pointIndex ? point : item),
            };
            commit(patchNodeById(normalized, drag.id, { geometry }));
        } else {
            const target = (normalized.features || []).find((feature) => feature.id === drag.id);
            if (!target) return;
            commit(patchFeatureById(normalized, drag.id, {
                points: target.points.map((item, index) => index === drag.pointIndex ? point : item),
            }));
        }
    };

    const deleteSelection = () => {
        if (selection.kind === 'node') {
            if (normalized.nodes.length <= 1) return;
            const nextNodes = normalized.nodes.filter((node) => node.id !== selection.id);
            commit({
                ...normalized,
                nodes: nextNodes,
                features: (normalized.features || []).map((feature) => ({
                    ...feature,
                    parentId: feature.parentId === selection.id ? '' : feature.parentId,
                    connectedNodeIds: (feature.connectedNodeIds || []).filter((id) => id !== selection.id),
                })),
            });
            setSelection({ kind: 'node', id: nextNodes[0]?.id || '' });
        } else {
            const nextFeatures = (normalized.features || []).filter((feature) => feature.id !== selection.id);
            commit({ ...normalized, features: nextFeatures });
            setSelection({ kind: 'node', id: normalized.nodes[0]?.id || '' });
        }
    };

    const updateSelectedNode = (patch: Partial<WorldMapDiyNode>) => {
        if (!selectedNode) return;
        commit(patchNodeById(normalized, selectedNode.id, patch));
    };

    const updateSelectedFeature = (patch: Partial<WorldMapDiyFeature>) => {
        if (!selectedFeature) return;
        commit(patchFeatureById(normalized, selectedFeature.id, patch));
    };

    const setNodeScaleField = (key: string, value: string) => {
        if (!selectedNode) return;
        updateSelectedNode({ scaleFields: { ...(selectedNode.scaleFields || {}), [key]: value } });
    };

    const setFeatureField = (key: string, value: string) => {
        if (!selectedFeature) return;
        updateSelectedFeature({ fields: { ...(selectedFeature.fields || {}), [key]: value } });
    };

    const textEditProps = <Element extends HTMLInputElement | HTMLTextAreaElement>(apply: (value: string) => void) => ({
        onCompositionStart: () => {
            composingTextRef.current = true;
        },
        onCompositionEnd: (event: React.CompositionEvent<Element>) => {
            composingTextRef.current = false;
            apply(event.currentTarget.value);
        },
        onChange: (event: React.ChangeEvent<Element>) => {
            if (composingTextRef.current || (event.nativeEvent as any).isComposing) return;
            apply(event.currentTarget.value);
        },
    });

    const toggleEnabled = () => commit({ ...normalized, enabled: !normalized.enabled });

    return (
        <div className="overflow-hidden rounded-xl border border-[#d8c8aa] bg-[#f8f1df] text-[#243047] shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8c8aa] bg-[#fff8e9] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={`rounded border px-3 py-1.5 text-xs font-bold ${normalized.enabled ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[#d8c8aa] bg-white text-[#6f4216]'}`} onClick={toggleEnabled}>
                        {normalized.enabled ? '已启用' : '未启用'}
                    </button>
                    {toolOptions.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            title={item.title}
                            className={`rounded border px-2.5 py-1.5 text-xs ${tool === item.id ? 'border-[#9b5a17] bg-[#9b5a17] text-white' : 'border-[#d8c8aa] bg-white text-[#6f4216] hover:border-[#9b5a17]'}`}
                            onClick={() => {
                                setTool(item.id);
                                setDrawingPoints([]);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {(tool === 'region' || isFeatureMode(tool)) && (
                        <>
                            <button type="button" className="rounded border border-[#9b5a17] bg-white px-3 py-1.5 text-xs font-bold text-[#6f4216]" onClick={finishDrawing} disabled={drawingPoints.length < (tool === 'region' ? 3 : 2)}>
                                完成绘制
                            </button>
                            <button type="button" className="rounded border border-[#d8c8aa] bg-white px-3 py-1.5 text-xs text-[#6f4216]" onClick={() => setDrawingPoints([])}>
                                撤销草线
                            </button>
                        </>
                    )}
                    <label className="rounded border border-[#d8c8aa] bg-white px-3 py-1.5 text-xs text-[#6f4216] hover:border-[#9b5a17]">
                        导入参考图
                        <input type="file" accept="image/*" className="hidden" onChange={event => onImportReferenceImage(event.target.files?.[0])} />
                    </label>
                    <button type="button" className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 disabled:opacity-50" onClick={deleteSelection} disabled={!selection.id || (selection.kind === 'node' && normalized.nodes.length <= 1)}>
                        删除
                    </button>
                </div>
            </div>

            <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]'}`}>
                <aside className="max-h-[720px] space-y-3 overflow-y-auto border-r border-[#d8c8aa] bg-[#fffaf0] p-3">
                    <div className="space-y-2">
                        <div className={labelClass}>地点层级</div>
                        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                            {normalized.nodes.map((node) => (
                                <button
                                    key={node.id}
                                    type="button"
                                    className={`w-full rounded border px-2 py-1.5 text-left text-xs ${selection.kind === 'node' && selection.id === node.id ? 'border-[#9b5a17] bg-[#f4dfb6]' : 'border-[#eadcc2] bg-white hover:border-[#9b5a17]'}`}
                                    onClick={() => setSelection({ kind: 'node', id: node.id })}
                                >
                                    <span className="font-bold">{node.name || '未命名地点'}</span>
                                    <span className="ml-2 text-[#876444]">{世界地图DIY层级选项.find((item) => item.value === node.layer)?.label || node.layer}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className={labelClass}>地理连接</div>
                        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                            {(normalized.features || []).length === 0 && <div className="rounded border border-dashed border-[#d8c8aa] p-2 text-xs text-[#876444]">暂无山脉、河流或道路。</div>}
                            {(normalized.features || []).map((feature) => (
                                <button
                                    key={feature.id}
                                    type="button"
                                    className={`w-full rounded border px-2 py-1.5 text-left text-xs ${selection.kind === 'feature' && selection.id === feature.id ? 'border-[#9b5a17] bg-[#f4dfb6]' : 'border-[#eadcc2] bg-white hover:border-[#9b5a17]'}`}
                                    onClick={() => setSelection({ kind: 'feature', id: feature.id })}
                                >
                                    <span className="font-bold">{feature.name || '未命名要素'}</span>
                                    <span className="ml-2 text-[#876444]">{世界地图DIY要素标签[feature.type]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedNode && (
                        <div className="space-y-2 border-t border-[#eadcc2] pt-3">
                            <div className={labelClass}>属性编辑</div>
                            <input className={inputClass} value={selectedNode.name} placeholder="名称" {...textEditProps<HTMLInputElement>((value) => updateSelectedNode({ name: value }))} />
                            <select className={inputClass} value={selectedNode.layer} onChange={event => updateSelectedNode({ layer: event.target.value as WorldMapDiyLayerType })}>
                                {世界地图DIY层级选项.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                            <select className={inputClass} value={selectedNode.parentId} onChange={event => updateSelectedNode({ parentId: event.target.value })}>
                                <option value="">无父级</option>
                                {parentOptions.map((node) => <option key={node.id} value={node.id}>{node.name || node.id}</option>)}
                            </select>
                            <textarea className={`${inputClass} min-h-20 resize-y`} value={selectedNode.description} placeholder="简介 / 描述" {...textEditProps<HTMLTextAreaElement>((value) => updateSelectedNode({ description: value }))} />
                            <textarea
                                className={`${inputClass} min-h-24 resize-y`}
                                value={selectedNode.narrativeCore || (selectedNode.scaleFields as any)?.narrativeCore || ''}
                                placeholder="舞台/叙事核心：这里长期驱动什么矛盾、倒计时、人物关系或区域事件？"
                                {...textEditProps<HTMLTextAreaElement>((value) => updateSelectedNode({
                                    narrativeCore: value,
                                    scaleFields: { ...(selectedNode.scaleFields || {}), narrativeCore: value }
                                }))}
                            />
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-1">
                                <input className={inputClass} value={selectedNode.climate || ''} placeholder="气候" {...textEditProps<HTMLInputElement>((value) => updateSelectedNode({ climate: value }))} />
                                <input className={inputClass} value={selectedNode.population || ''} placeholder="人口/规模" {...textEditProps<HTMLInputElement>((value) => updateSelectedNode({ population: value }))} />
                                <input className={inputClass} value={selectedNode.culture || ''} placeholder="风土人情" {...textEditProps<HTMLInputElement>((value) => updateSelectedNode({ culture: value }))} />
                                <input className={inputClass} value={selectedNode.transport || ''} placeholder="道路交通" {...textEditProps<HTMLInputElement>((value) => updateSelectedNode({ transport: value }))} />
                            </div>
                            <div className="space-y-2">
                                {(nodeFieldGroups[selectedNode.layer] || []).map((field) => (
                                    <label key={field.key} className="block space-y-1">
                                        <span className={labelClass}>{field.label}</span>
                                        <input className={inputClass} value={(selectedNode.scaleFields as any)?.[field.key] || ''} placeholder={field.placeholder} {...textEditProps<HTMLInputElement>((value) => setNodeScaleField(field.key, value))} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedFeature && (
                        <div className="space-y-2 border-t border-[#eadcc2] pt-3">
                            <div className={labelClass}>连接型地理要素</div>
                            <input className={inputClass} value={selectedFeature.name} placeholder="名称" {...textEditProps<HTMLInputElement>((value) => updateSelectedFeature({ name: value }))} />
                            <select className={inputClass} value={selectedFeature.type} onChange={event => updateSelectedFeature({ type: event.target.value as WorldMapDiyFeatureType })}>
                                {Object.entries(世界地图DIY要素标签).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <select className={inputClass} value={selectedFeature.parentId || ''} onChange={event => updateSelectedFeature({ parentId: event.target.value })}>
                                <option value="">不指定所在区域 / 全局交通</option>
                                {normalized.nodes.map((node) => <option key={node.id} value={node.id}>{node.name || node.id}</option>)}
                            </select>
                            {connectionToolHint[selectedFeature.type] && (
                                <div className="rounded border border-[#d8c8aa] bg-white p-2 text-[11px] leading-5 text-[#6f4216]">
                                    {connectionToolHint[selectedFeature.type]}
                                </div>
                            )}
                            <textarea className={`${inputClass} min-h-20 resize-y`} value={selectedFeature.description || ''} placeholder="地理说明" {...textEditProps<HTMLTextAreaElement>((value) => updateSelectedFeature({ description: value }))} />
                            {(featureFieldGroups[selectedFeature.type] || []).map((field) => (
                                <label key={field.key} className="block space-y-1">
                                    <span className={labelClass}>{field.label}</span>
                                    <input className={inputClass} value={(selectedFeature.fields || {})[field.key] || ''} placeholder={field.placeholder} {...textEditProps<HTMLInputElement>((value) => setFeatureField(field.key, value))} />
                                </label>
                            ))}
                        </div>
                    )}

                    {selection.id && (
                        <div className="space-y-2 border-t border-[#eadcc2] pt-3">
                            <div className={labelClass}>AI 辅助</div>
                            <div className="grid grid-cols-3 gap-2">
                                {(['complete', 'polish', 'check'] as const).map((action) => (
                                    <button
                                        key={action}
                                        type="button"
                                        className="rounded border border-[#d8c8aa] bg-white px-2 py-1.5 text-xs text-[#6f4216] disabled:opacity-50"
                                        disabled={!aiAvailable || aiBusy || !onAiAssist}
                                        onClick={() => void onAiAssist?.(selection, action)}
                                    >
                                        {action === 'complete' ? '补完' : action === 'polish' ? '润色' : '检查'}
                                    </button>
                                ))}
                            </div>
                            {aiMessage && <div className="rounded border border-[#d8c8aa] bg-white p-2 text-[11px] leading-5 text-[#6f4216]">{aiMessage}</div>}
                        </div>
                    )}
                </aside>

                <main className="min-h-[460px] bg-[#efe4cf] p-3">
                    <div className="relative overflow-hidden rounded-lg border border-[#c8a56b] bg-[#fdf8ee]">
                        <svg
                            ref={svgRef}
                            className="h-[460px] w-full touch-none"
                            viewBox={`0 0 ${normalized.canvas?.width || 1600} ${normalized.canvas?.height || 1000}`}
                            onClick={handleCanvasClick}
                            onPointerMove={handlePointerMove}
                            onPointerUp={() => { draggingRef.current = null; }}
                            onPointerLeave={() => { draggingRef.current = null; }}
                            onDoubleClick={finishDrawing}
                        >
                            <defs>
                                <pattern id="diy-map-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#eadcc2" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#diy-map-grid)" />
                            {normalized.referenceImage && (
                                <image
                                    href={normalized.referenceImage}
                                    x={normalized.referenceTransform?.x || 0}
                                    y={normalized.referenceTransform?.y || 0}
                                    width={(normalized.canvas?.width || 1600) * (normalized.referenceTransform?.scale || 1)}
                                    height={(normalized.canvas?.height || 1000) * (normalized.referenceTransform?.scale || 1)}
                                    opacity={normalized.referenceOpacity ?? 0.35}
                                    transform={`rotate(${normalized.referenceTransform?.rotation || 0})`}
                                    preserveAspectRatio="xMidYMid meet"
                                />
                            )}
                            {normalized.nodes.map((node) => {
                                const selected = selection.kind === 'node' && selection.id === node.id;
                                const geometry = node.geometry;
                                if (!geometry) return null;
                                if (geometry.type === 'point') {
                                    const point = geometry.points[0];
                                    return (
                                        <g key={node.id} onClick={(event) => {
                                            if (tool !== 'select') return;
                                            event.stopPropagation();
                                            setSelection({ kind: 'node', id: node.id });
                                        }}>
                                            <circle cx={point.x} cy={point.y} r={selected ? 11 : 8} fill={selected ? '#b91c1c' : '#9b5a17'} stroke="#fffaf0" strokeWidth="4" />
                                            <text x={point.x + 14} y={point.y - 10} className="select-none fill-[#243047] text-[28px] font-bold">{node.name || '未命名'}</text>
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r={18}
                                                fill="transparent"
                                                onPointerDown={(event) => {
                                                    if (tool !== 'select') return;
                                                    event.stopPropagation();
                                                    setSelection({ kind: 'node', id: node.id });
                                                    draggingRef.current = { kind: 'node', id: node.id, pointIndex: 0 };
                                                }}
                                            />
                                        </g>
                                    );
                                }
                                return (
                                        <g key={node.id} onClick={(event) => {
                                            if (tool !== 'select') return;
                                            event.stopPropagation();
                                            setSelection({ kind: 'node', id: node.id });
                                        }}>
                                        <polygon points={polygonPoints(geometry.points)} fill={selected ? 'rgba(196,92,45,0.34)' : 'rgba(72,145,204,0.28)'} stroke={selected ? '#b91c1c' : '#2f6f95'} strokeWidth={selected ? 5 : 3} />
                                        {geometry.points.map((point, index) => (
                                            <circle
                                                key={`${node.id}-${index}`}
                                                cx={point.x}
                                                cy={point.y}
                                                r={selected ? 8 : 5}
                                                fill={selected ? '#b91c1c' : '#2f6f95'}
                                                onPointerDown={(event) => {
                                                    if (tool !== 'select') return;
                                                    event.stopPropagation();
                                                    setSelection({ kind: 'node', id: node.id });
                                                    draggingRef.current = { kind: 'node', id: node.id, pointIndex: index };
                                                }}
                                            />
                                        ))}
                                        {geometry.points.length > 0 && (
                                            <text x={geometry.points[0].x + 18} y={geometry.points[0].y + 28} className="select-none fill-[#243047] text-[30px] font-bold">{node.name || '未命名'}</text>
                                        )}
                                    </g>
                                );
                            })}
                            {(normalized.features || []).map((feature) => {
                                const selected = selection.kind === 'feature' && selection.id === feature.id;
                                return (
                                    <g key={feature.id} onClick={(event) => {
                                        if (tool !== 'select') return;
                                        event.stopPropagation();
                                        setSelection({ kind: 'feature', id: feature.id });
                                    }}>
                                        <path d={pathD(feature.points)} fill="none" stroke={colors[feature.type]} strokeWidth={selected ? 8 : 5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={feature.type === 'portal' ? '18 12' : undefined} />
                                        {feature.points.map((point, index) => (
                                            <circle
                                                key={`${feature.id}-${index}`}
                                                cx={point.x}
                                                cy={point.y}
                                                r={selected ? 8 : 5}
                                                fill={colors[feature.type]}
                                                stroke="#fffaf0"
                                                strokeWidth="3"
                                                onPointerDown={(event) => {
                                                    if (tool !== 'select') return;
                                                    event.stopPropagation();
                                                    setSelection({ kind: 'feature', id: feature.id });
                                                    draggingRef.current = { kind: 'feature', id: feature.id, pointIndex: index };
                                                }}
                                            />
                                        ))}
                                        {feature.points[0] && <text x={feature.points[0].x + 16} y={feature.points[0].y - 12} className="select-none fill-[#243047] text-[24px] font-bold">{feature.name || 世界地图DIY要素标签[feature.type]}</text>}
                                    </g>
                                );
                            })}
                            {drawingPoints.length > 0 && (
                                <g>
                                    <path d={pathD(drawingPoints)} fill={tool === 'region' && drawingPoints.length > 2 ? 'rgba(185,28,28,0.12)' : 'none'} stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                                    {drawingPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="8" fill="#ef4444" />)}
                                </g>
                            )}
                        </svg>
                        <div className="absolute bottom-2 left-2 rounded border border-[#d8c8aa] bg-[#fffaf0]/95 px-2 py-1 text-[11px] text-[#6f4216]">
                            {tool === 'select' ? '选择对象后可拖动锚点。' : '在画布点击添加锚点，双击或点“完成绘制”结束。'}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DiyMapEditor;
