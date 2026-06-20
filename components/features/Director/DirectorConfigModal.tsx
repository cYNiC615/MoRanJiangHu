import React from 'react';
import type { 导演配置结构, 角色种子定义结构 } from '../../../types';
import { 规范化导演配置 } from '../../../utils/directorConfig';

type Props = {
    config?: 导演配置结构;
    onSave: (config: 导演配置结构) => void;
    onClose: () => void;
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

const 标签文本 = (seed: 角色种子定义结构): string => (seed.关系入口标签 || []).join('、');

const 解析标签 = (text: string): string[] => text
    .split(/[\r\n,，、;；|/]+/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

const DirectorConfigModal: React.FC<Props> = ({ config, onSave, onClose }) => {
    const [draft, setDraft] = React.useState<导演配置结构>(() => 规范化导演配置(config));

    React.useEffect(() => {
        setDraft(规范化导演配置(config));
    }, [config]);

    const updateSeed = (seedId: string, updater: (seed: 角色种子定义结构) => 角色种子定义结构) => {
        setDraft((prev) => ({
            ...prev,
            角色种子定义: prev.角色种子定义.map((seed) => seed.id === seedId ? updater(seed) : seed)
        }));
    };

    const removeSeed = (seedId: string) => {
        setDraft((prev) => ({
            ...prev,
            角色种子定义: prev.角色种子定义.filter((seed) => seed.id !== seedId),
            角色种子运行时状态: prev.角色种子运行时状态.filter((state) => state.seedId !== seedId)
        }));
    };

    const addSeed = () => {
        const seed = 创建空种子();
        setDraft((prev) => ({
            ...prev,
            角色种子定义: [...prev.角色种子定义, seed],
            角色种子运行时状态: [...prev.角色种子运行时状态, { seedId: seed.id, 状态: '未引入' }]
        }));
    };

    const save = () => {
        onSave(规范化导演配置(draft));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden border border-wuxia-gold/30 bg-gray-950 text-gray-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-wuxia-gold/20 px-5 py-3">
                    <div>
                        <h2 className="text-lg font-bold tracking-[0.16em] text-wuxia-gold">导演配置</h2>
                        <p className="text-xs text-gray-500">Director Config</p>
                    </div>
                    <button className="rounded border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-white/10" onClick={onClose}>关闭</button>
                </div>

                <div className="max-h-[calc(90vh-112px)] overflow-y-auto p-5 space-y-5">
                    <section className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">玩家剧情倾向</label>
                        <textarea
                            value={draft.玩家剧情倾向 || ''}
                            onChange={(event) => setDraft((prev) => ({ ...prev, 玩家剧情倾向: event.target.value }))}
                            className="min-h-24 w-full resize-y rounded-sm border border-gray-700 bg-black/30 p-3 text-sm leading-6 text-gray-100 outline-none focus:border-wuxia-gold/60"
                        />
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-300">角色种子池</h3>
                            <button className="rounded border border-wuxia-gold/40 px-3 py-1 text-sm text-wuxia-gold hover:bg-wuxia-gold/10" onClick={addSeed}>新增种子</button>
                        </div>

                        {draft.角色种子定义.length === 0 ? (
                            <div className="border border-dashed border-gray-700 p-4 text-sm text-gray-500">暂无角色种子</div>
                        ) : (
                            <div className="space-y-3">
                                {draft.角色种子定义.map((seed) => {
                                    const status = draft.角色种子运行时状态.find((item) => item.seedId === seed.id)?.状态 || '未引入';
                                    return (
                                        <div key={seed.id} className="border border-gray-800 bg-white/[0.02] p-3">
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_120px]">
                                                <input
                                                    value={seed.名称}
                                                    placeholder="名称"
                                                    onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 名称: event.target.value }))}
                                                    className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60"
                                                />
                                                <select
                                                    value={seed.是否启用 ? 'on' : 'off'}
                                                    onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 是否启用: event.target.value === 'on' }))}
                                                    className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60"
                                                >
                                                    <option value="on">启用</option>
                                                    <option value="off">暂停</option>
                                                </select>
                                                <div className="rounded-sm border border-gray-800 px-3 py-2 text-sm text-gray-400">{status}</div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <textarea
                                                    value={seed.入口摘要}
                                                    placeholder="入口摘要"
                                                    onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 入口摘要: event.target.value }))}
                                                    className="min-h-20 resize-y rounded-sm border border-gray-700 bg-black/30 p-3 text-sm outline-none focus:border-wuxia-gold/60"
                                                />
                                                <textarea
                                                    value={seed.完整设定 || ''}
                                                    placeholder="完整设定"
                                                    onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 完整设定: event.target.value }))}
                                                    className="min-h-20 resize-y rounded-sm border border-gray-700 bg-black/30 p-3 text-sm outline-none focus:border-wuxia-gold/60"
                                                />
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <input
                                                    value={标签文本(seed)}
                                                    placeholder="关系入口标签"
                                                    onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 关系入口标签: 解析标签(event.target.value) }))}
                                                    className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60"
                                                />
                                                <input
                                                    value={seed.默认发展方向 || ''}
                                                    placeholder="默认发展方向"
                                                    onChange={(event) => updateSeed(seed.id, (current) => ({ ...current, 默认发展方向: event.target.value }))}
                                                    className="rounded-sm border border-gray-700 bg-black/30 px-3 py-2 text-sm outline-none focus:border-wuxia-gold/60"
                                                />
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button className="rounded border border-red-900/60 px-3 py-1 text-sm text-red-300 hover:bg-red-950/30" onClick={() => removeSeed(seed.id)}>删除</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-800 px-5 py-3">
                    <button className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-white/10" onClick={onClose}>取消</button>
                    <button className="rounded border border-wuxia-gold/50 bg-wuxia-gold/10 px-4 py-2 text-sm text-wuxia-gold hover:bg-wuxia-gold/20" onClick={save}>保存</button>
                </div>
            </div>
        </div>
    );
};

export default DirectorConfigModal;
