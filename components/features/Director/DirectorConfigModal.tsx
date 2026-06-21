import React from 'react';
import type { 导演配置结构 } from '../../../types';
import { 规范化导演配置 } from '../../../utils/directorConfig';
import RoleSeedEditor from './RoleSeedEditor';

type Props = {
    config?: 导演配置结构;
    onSave: (config: 导演配置结构) => void;
    onClose: () => void;
};

const DirectorConfigModal: React.FC<Props> = ({ config, onSave, onClose }) => {
    const [draft, setDraft] = React.useState<导演配置结构>(() => 规范化导演配置(config));

    React.useEffect(() => {
        setDraft(规范化导演配置(config));
    }, [config]);

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

                    <RoleSeedEditor config={draft} onChange={setDraft} />
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
