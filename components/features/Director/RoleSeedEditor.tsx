import React from 'react';
import type { 导演配置结构, 角色种子定义结构, 角色种子运行时状态结构 } from '../../../types';
import { 删除未转正角色种子, 设置角色种子暂停状态, 规范化导演配置 } from '../../../utils/directorConfig';

type Props = {
    config?: Partial<导演配置结构> | null;
    onChange: (config: 导演配置结构) => void;
    compact?: boolean;
    showLinkedInfo?: boolean;
};

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 默认发展方向选项 = ['红颜/后宫对象', '非红颜/普通配角'] as const;

const 规范化默认发展方向 = (value: unknown): string => {
    const text = 读取文本(value);
    return 默认发展方向选项.includes(text as typeof 默认发展方向选项[number])
        ? text
        : '红颜/后宫对象';
};

const 生成种子ID = () => `seed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const 创建空种子 = (): 角色种子定义结构 => ({
    id: 生成种子ID(),
    名称: '',
    性别: '女',
    是否启用: true,
    入口摘要: '',
    完整设定: '',
    关系入口标签: [],
    默认发展方向: '红颜/后宫对象'
});

const 解析标签 = (text: string): string[] => text
    .split(/[\r\n,，、;；|/]+/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

const 标签文本 = (seed: 角色种子定义结构): string => (seed.关系入口标签 || []).join('、');

const 准备编辑种子 = (raw: any, index: number): 角色种子定义结构 => ({
    id: 读取文本(raw?.id ?? raw?.seedId) || `role_seed_draft_${index}_${Date.now()}`,
    名称: 读取文本(raw?.名称 ?? raw?.name),
    性别: 读取文本(raw?.性别) || '女',
    是否启用: raw?.是否启用 !== false && raw?.enabled !== false,
    入口摘要: 读取文本(raw?.入口摘要 ?? raw?.summary ?? raw?.摘要),
    完整设定: 读取文本(raw?.完整设定 ?? raw?.fullCard ?? raw?.设定),
    关系入口标签: Array.isArray(raw?.关系入口标签)
        ? raw.关系入口标签.map(读取文本).filter(Boolean)
        : 解析标签(读取文本(raw?.tags)),
    默认发展方向: 规范化默认发展方向(raw?.默认发展方向 ?? raw?.direction),
    备注: 读取文本(raw?.备注)
});

const 准备编辑配置 = (raw?: Partial<导演配置结构> | null): 导演配置结构 => {
    const normalized = 规范化导演配置(raw);
    const rawSeeds = Array.isArray(raw?.角色种子定义) ? raw?.角色种子定义 : normalized.角色种子定义;
    const 角色种子定义 = rawSeeds.map((item: any, index: number) => 准备编辑种子(item, index));
    const stateBySeed = new Map<string, 角色种子运行时状态结构>(
        (Array.isArray(raw?.角色种子运行时状态) ? raw?.角色种子运行时状态 : normalized.角色种子运行时状态)
            .filter((item: any) => item && typeof item === 'object')
            .map((item: any) => [读取文本(item.seedId ?? item.id ?? item.角色种子ID), {
                seedId: 读取文本(item.seedId ?? item.id ?? item.角色种子ID),
                状态: 读取文本(item.状态 ?? item.status) as any,
                linkedNpcId: 读取文本(item.linkedNpcId ?? item.npcId),
                linkedNpcName: 读取文本(item.linkedNpcName ?? item.npcName ?? item.姓名),
                更新时间: 读取文本(item.更新时间)
            }])
            .filter(([seedId]) => Boolean(seedId)) as Array<[string, 角色种子运行时状态结构]>
    );
    角色种子定义.forEach((seed) => {
        if (!stateBySeed.has(seed.id)) {
            stateBySeed.set(seed.id, { seedId: seed.id, 状态: seed.是否启用 ? '未引入' : '暂停' });
        }
    });
    return {
        玩家剧情倾向: normalized.玩家剧情倾向,
        角色种子定义,
        角色种子运行时状态: 角色种子定义.map((seed) => stateBySeed.get(seed.id) || { seedId: seed.id, 状态: seed.是否启用 ? '未引入' : '暂停' })
    };
};

const RoleSeedEditor: React.FC<Props> = ({ config, onChange, compact = false, showLinkedInfo = true }) => {
    const draft = React.useMemo(() => 准备编辑配置(config), [config]);

    const emit = (next: 导演配置结构) => onChange(next);

    const updateSeed = (seedId: string, updater: (seed: 角色种子定义结构) => 角色种子定义结构) => {
        emit({
            ...draft,
            角色种子定义: draft.角色种子定义.map((seed) => seed.id === seedId ? updater(seed) : seed)
        });
    };

    const addSeed = () => {
        const seed = 创建空种子();
        emit({
            ...draft,
            角色种子定义: [...draft.角色种子定义, seed],
            角色种子运行时状态: [...draft.角色种子运行时状态, { seedId: seed.id, 状态: '未引入' }]
        });
    };

    const setPaused = (seedId: string, paused: boolean) => {
        emit(设置角色种子暂停状态(draft, seedId, paused));
    };

    const removeSeed = (seedId: string) => {
        emit(删除未转正角色种子(draft, seedId));
    };

    return (
        <section className={compact ? 'space-y-3' : 'space-y-3'}>
            {!compact && (
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">角色种子池</h3>
                    <button type="button" className="rounded border border-wuxia-gold/40 px-3 py-1 text-sm text-wuxia-gold hover:bg-wuxia-gold/10" onClick={addSeed}>新增种子</button>
                </div>
            )}
            {compact && (
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-200">首批角色种子</h3>
                        <div className="mt-1 text-[11px] text-gray-500">只作为开局人物素材入口，不会直接写成既定社交关系。</div>
                    </div>
                    <button type="button" className="shrink-0 rounded border border-wuxia-gold/40 px-3 py-1 text-xs text-wuxia-gold hover:bg-wuxia-gold/10" onClick={addSeed}>新增</button>
                </div>
            )}

            {draft.角色种子定义.length === 0 ? (
                <div className="border border-dashed border-gray-700 p-4 text-sm text-gray-500">暂无角色种子</div>
            ) : (
                <div className="space-y-3">
                    {draft.角色种子定义.map((seed) => {
                        const status = draft.角色种子运行时状态.find((item) => item.seedId === seed.id) || { seedId: seed.id, 状态: seed.是否启用 ? '未引入' : '暂停' };
                        const promoted = status.状态 === '已转正';
                        return (
                            <div key={seed.id} className="border border-gray-800 bg-white/[0.02] p-3">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_120px]">
                                    <input
                                        value={seed.名称}
                                        placeholder="名称"
                                        disabled={promoted}
                                        onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 名称: event.target.value }))}
                                        className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <select
                                        value={seed.是否启用 && status.状态 !== '暂停' ? 'on' : 'off'}
                                        disabled={promoted}
                                        onChange={(event) => setPaused(seed.id, event.target.value !== 'on')}
                                        className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="on">启用</option>
                                        <option value="off">暂停</option>
                                    </select>
                                    <div className="rounded-sm border border-gray-800 px-3 py-2 text-sm text-gray-400">{status.状态}</div>
                                </div>
                                {promoted && showLinkedInfo && (
                                    <div className="mt-2 rounded-sm border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200">
                                        已转正为 NPC：{status.linkedNpcName || '未知'}{status.linkedNpcId ? `（${status.linkedNpcId}）` : ''}
                                    </div>
                                )}
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <textarea
                                        value={seed.入口摘要}
                                        placeholder="入口摘要"
                                        disabled={promoted}
                                        onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 入口摘要: event.target.value }))}
                                        className="min-h-20 resize-y rounded-sm border border-gray-700 bg-black/30 p-3 text-sm outline-none focus:border-wuxia-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <textarea
                                        value={seed.完整设定 || ''}
                                        placeholder="完整设定"
                                        disabled={promoted}
                                        onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 完整设定: event.target.value }))}
                                        className="min-h-20 resize-y rounded-sm border border-gray-700 bg-black/30 p-3 text-sm outline-none focus:border-wuxia-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <input
                                        value={标签文本(seed)}
                                        placeholder="关系入口标签"
                                        disabled={promoted}
                                        onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 关系入口标签: 解析标签(event.target.value) }))}
                                        className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <select
                                        value={规范化默认发展方向(seed.默认发展方向)}
                                        disabled={promoted}
                                        onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 默认发展方向: event.target.value }))}
                                        className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {默认发展方向选项.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        className="rounded border border-red-900/60 px-3 py-1 text-sm text-red-300 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={promoted}
                                        onClick={() => removeSeed(seed.id)}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default RoleSeedEditor;
