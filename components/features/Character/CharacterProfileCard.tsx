import React, { useMemo } from 'react';
import { OpeningConfig, 角色数据结构, 视觉设置结构 } from '../../../types';
import { 构建区域文字样式 } from '../../../utils/visualSettings';
import { 格式化月日, 计算角色总气血 } from '../../../utils/characterVitals';
import { 读取可分配属性点, type 可分配六维属性键 } from '../../../utils/characterAttributePoints';
import { 获取题材资源文案 } from '../../../utils/resourceLabels';
interface Props {
    character: 角色数据结构;
    visualConfig?: 视觉设置结构;
    openingConfig?: OpeningConfig;
    onAllocateAttributePoint?: (key: 可分配六维属性键) => void;
}

const 获取档案题材文案 = (openingConfig?: OpeningConfig) => {
    const mode = openingConfig?.题材模式;
    if (mode === '无限流') {
        return {
            档案题头: '主神空间档案',
            编号: '档案编号',
            信息: '轮回者信息',
            背景: '入队背景',
            生辰: '登记日',
            性格: '性格侧写',
            外貌: '外观记录',
            出身: '背景备注',
            天赋: '能力倾向',
            六维: '基础六维',
            部位: '身体状态'
        };
    }
    if (mode === '末日丧尸') {
        return {
            档案题头: '幸存者档案',
            编号: '档案编号',
            信息: '幸存者信息',
            背景: '灾前背景',
            生辰: '出生日期',
            性格: '性格侧写',
            外貌: '外观记录',
            出身: '背景备注',
            天赋: '生存倾向',
            六维: '基础六维',
            部位: '身体状态'
        };
    }
    if (mode === '现代都市' || mode === '灵气复苏' || mode === '都市修仙') {
        return {
            档案题头: '角色档案',
            编号: '档案编号',
            信息: '人物信息',
            背景: '身份背景',
            生辰: '出生日期',
            性格: '性格侧写',
            外貌: '外观记录',
            出身: '背景备注',
            天赋: '天赋记录',
            六维: '基础六维',
            部位: '身体状态'
        };
    }
    return {
        档案题头: mode === '仙侠' ? '修行身份文牒' : mode === '西方奇幻' ? '冒险者档案' : '江湖身份文牒',
        编号: '身份编号',
        信息: '人物信息',
        背景: '背景',
        生辰: '生辰',
        性格: '性格',
        外貌: mode === '西方奇幻' ? '外观记录' : '外貌描摹',
        出身: mode === '西方奇幻' ? '背景备注' : '出身批注',
        天赋: mode === '西方奇幻' ? '天赋记录' : '天赋卷宗',
        六维: '基础六维',
        部位: mode === '西方奇幻' ? '身体状态' : '部位状态'
    };
};

const CharacterProfileCard: React.FC<Props> = ({ character, visualConfig, openingConfig, onAllocateAttributePoint }) => {
    const 天赋列表 = Array.isArray(character.天赋列表) ? character.天赋列表 : [];
    const 文案 = 获取档案题材文案(openingConfig);
    const 资源文案 = 获取题材资源文案(openingConfig?.题材模式, openingConfig?.modeRuntimeProfile);
    const areaStyle = 构建区域文字样式(visualConfig, '角色档案');
    const profileFontStyle = {
        fontFamily: areaStyle.fontFamily,
        fontStyle: areaStyle.fontStyle,
    };
    const 总气血 = useMemo(() => 计算角色总气血(character), [character]);
    const 部位状态列表 = useMemo(() => ([
        { 名称: '头部', 当前: character.头部当前血量, 最大: character.头部最大血量, 状态: character.头部状态 },
        { 名称: '胸部', 当前: character.胸部当前血量, 最大: character.胸部最大血量, 状态: character.胸部状态 },
        { 名称: '腹部', 当前: character.腹部当前血量, 最大: character.腹部最大血量, 状态: character.腹部状态 },
        { 名称: '左手', 当前: character.左手当前血量, 最大: character.左手最大血量, 状态: character.左手状态 },
        { 名称: '右手', 当前: character.右手当前血量, 最大: character.右手最大血量, 状态: character.右手状态 },
        { 名称: '左腿', 当前: character.左腿当前血量, 最大: character.左腿最大血量, 状态: character.左腿状态 },
        { 名称: '右腿', 当前: character.右腿当前血量, 最大: character.右腿最大血量, 状态: character.右腿状态 },
    ]).map((part) => {
        const current = Number(part.当前 || 0);
        const max = Math.max(0, Number(part.最大 || 0));
        const ratio = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
        const status = String(part.状态 || '未知').trim() || '未知';
        return { ...part, 当前: current, 最大: max, 比例: ratio, 状态: status };
    }), [character]);

    const 六维说明: Record<string, string> = {
        力: '力量：影响攻势、近战伤害、负重与破防压力。',
        敏: '敏捷：影响身法、移动预算、闪避与远程/突进节奏。',
        体: '体质：影响气血承受、近战/远程物理守势与续航稳定性。',
        根: '根骨：影响法术守势、内力承载、抗性与内功根基。',
        悟: '悟性：影响能力理解、修炼效率、术法/技能加成判定。',
        福: '福源：影响机缘、掉落、随机事件倾向与逢凶化吉概率。',
    };
    const 可用属性点 = 读取可分配属性点(character);
    const attributes: Array<{ key: string; attributeKey: 可分配六维属性键; val: number; title: string }> = [
        { key: '力', attributeKey: '力量', val: character.力量, title: 六维说明.力 },
        { key: '敏', attributeKey: '敏捷', val: character.敏捷, title: 六维说明.敏 },
        { key: '体', attributeKey: '体质', val: character.体质, title: 六维说明.体 },
        { key: '根', attributeKey: '根骨', val: character.根骨, title: 六维说明.根 },
        { key: '悟', attributeKey: '悟性', val: character.悟性, title: 六维说明.悟 },
        { key: '福', attributeKey: '福源', val: character.福源, title: 六维说明.福 },
    ];
    const 读取文本字段 = (key: string): string => {
        const value = (character as any)?.[key];
        return typeof value === 'string' ? value.trim() : '';
    };
    const 读取数字字段 = (key: string): number => {
        const value = Number((character as any)?.[key]);
        return Number.isFinite(value) ? value : 0;
    };
    const 仙侠文本字段 = [
        { label: '灵根', value: 读取文本字段('灵根') },
        { label: '资质', value: 读取文本字段('灵根资质') },
        { label: '丹田', value: 读取文本字段('丹田状态') },
        { label: '道基', value: 读取文本字段('道基状态') },
    ];
    const 仙侠数值字段 = [
        { label: '灵力', value: `${读取数字字段('当前灵力')}/${读取数字字段('最大灵力')}` },
        { label: '神识', value: `${读取数字字段('当前神识')}/${读取数字字段('最大神识')}` },
        { label: '心魔', value: 读取数字字段('心魔值') },
        { label: '功德', value: 读取数字字段('功德') },
        { label: '业力', value: 读取数字字段('业力') },
    ];
    const 显示仙侠档案 = 仙侠文本字段.some((item) => item.value)
        || ['当前灵力', '最大灵力', '当前神识', '最大神识', '心魔值', '功德', '业力'].some((key) => 读取数字字段(key) !== 0);

    return (
        <div className="character-profile-card w-full max-w-5xl overflow-hidden rounded-2xl border border-[#c7a56a]/55 bg-[#fffaf0] text-[#4f2d16] shadow-[0_18px_50px_rgba(92,57,24,0.16)]" style={profileFontStyle}>
            <div className="relative border-b border-[#c7a56a]/45 bg-[linear-gradient(180deg,rgba(196,157,92,0.2),rgba(255,250,240,0))] px-6 py-5 md:px-8 md:py-6">
                <div className="text-[10px] uppercase tracking-[0.45em] text-[#9b5a22]">{文案.档案题头}</div>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0 pr-0 md:pr-4">
                        <h3 className="text-2xl font-bold tracking-[0.2em] text-[#7a3f12] md:text-3xl" style={{ fontFamily: areaStyle.fontFamily, fontStyle: areaStyle.fontStyle }}>{character.姓名}</h3>
                        <p className="mt-1 text-sm text-[#5f3a1e] md:text-base">{character.称号 || '无称号'} · {character.境界}</p>
                    </div>
                    <div className="relative z-10 inline-flex max-w-full flex-wrap items-center gap-2 self-start rounded-sm border border-[#df8f7d]/45 bg-[#fff4eb] px-3 py-1.5 text-xs tracking-[0.12em] text-[#b42318] md:self-auto">
                        <span>{文案.编号}</span>
                        <span className="font-mono text-[#7a3f12]">{character.姓名}-{character.年龄}</span>
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_center,rgba(196,157,92,0.16),transparent_70%)]"></div>
            </div>

            <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                    <div className="border border-[#c7a56a]/35 bg-[#fffdf6] p-4">
                        <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#9b5a22]">{文案.信息}</div>
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <div className="border border-[#d8c4a2] bg-[#fffaf0] px-3 py-2">
                                <div className="text-[10px] tracking-[0.25em] text-[#8a5a2f]">{文案.背景}</div>
                                <div className="mt-1 text-[#7a3f12]">{character.出身背景?.名称 || '无'}</div>
                            </div>
                            <div className="border border-[#d8c4a2] bg-[#fffaf0] px-3 py-2">
                                <div className="text-[10px] tracking-[0.25em] text-[#8a5a2f]">年龄</div>
                                <div className="mt-1">{character.年龄} 岁</div>
                            </div>
                            <div className="border border-[#d8c4a2] bg-[#fffaf0] px-3 py-2">
                                <div className="text-[10px] tracking-[0.25em] text-[#8a5a2f]">{文案.生辰}</div>
                                <div className="mt-1">{格式化月日(character.出生日期) || '未知'}</div>
                            </div>
                            <div className="border border-[#d8c4a2] bg-[#fffaf0] px-3 py-2">
                                <div className="text-[10px] tracking-[0.25em] text-[#8a5a2f]">总{资源文案.气血}</div>
                                <div className={`mt-1 font-mono ${总气血.已死亡 ? 'text-[#b42318]' : 'text-[#7a3f12]'}`}>{总气血.当前}/{总气血.最大}</div>
                            </div>
                            <div className="border border-[#d8c4a2] bg-[#fffaf0] px-3 py-2 sm:col-span-2">
                                <div className="text-[10px] tracking-[0.25em] text-[#8a5a2f]">{文案.性格}</div>
                                <div className="mt-1">{character.性格 || '暂无性格记录'}</div>
                            </div>
                        </div>
                    </div>

                    {显示仙侠档案 && (
                        <div className="border border-[#b7d6d2]/70 bg-[#f4fffb] p-4">
                            <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#0f766e]">修真档案</div>
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                {仙侠文本字段.map((item) => (
                                    <div key={item.label} className="border border-[#b7d6d2] bg-[#fbfffc] px-3 py-2">
                                        <div className="text-[10px] tracking-[0.25em] text-[#0f766e]">{item.label}</div>
                                        <div className="mt-1 text-[#14532d]">{item.value || '未记录'}</div>
                                    </div>
                                ))}
                                {仙侠数值字段.map((item) => (
                                    <div key={item.label} className="border border-[#b7d6d2] bg-[#fbfffc] px-3 py-2">
                                        <div className="text-[10px] tracking-[0.25em] text-[#0f766e]">{item.label}</div>
                                        <div className="mt-1 font-mono text-[#14532d]">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border border-[#c7a56a]/35 bg-[#fffdf6] p-4">
                        <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#9b5a22]">{文案.外貌}</div>
                        <p className="text-sm leading-7 text-[#4f2d16]">{character.外貌 || '暂无外貌记录。'}</p>
                    </div>

                    <div className="border border-[#c7a56a]/35 bg-[#fffdf6] p-4">
                        <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#9b5a22]">{文案.出身}</div>
                        <p className="text-sm leading-7 text-[#4f2d16]">{character.出身背景?.描述 || '暂无背景描述。'}</p>
                        {character.出身背景?.效果 && <div className="mt-3 border-l-2 border-[#c7a56a] pl-3 text-xs leading-6 text-[#7a3f12]">{character.出身背景.效果}</div>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="border border-[#df8f7d]/45 bg-[#fff6f1] p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-[#b42318]">{文案.天赋}</div>
                            <div className="text-[10px] text-[#8a5a2f]">共 {天赋列表.length} 项</div>
                        </div>
                        <div className="space-y-3">
                            {天赋列表.length > 0 ? (
                                天赋列表.map((talent, index) => (
                                    <div key={`${talent.名称}-${index}`} className="border border-[#efb0a2]/70 bg-[#fffaf0] p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-semibold tracking-[0.12em] text-[#7a3f12]">{talent.名称}</span>
                                            <span className="text-[10px] text-[#b42318]">天赋 {index + 1}</span>
                                        </div>
                                        <p className="mt-2 text-xs leading-6 text-[#4f2d16]">{talent.描述 || '暂无描述。'}</p>
                                        {talent.效果 && <div className="mt-2 rounded-sm border border-[#d8c4a2] bg-[#fffdf6] px-2.5 py-2 text-[11px] leading-5 text-[#7a3f12]">{talent.效果}</div>}
                                    </div>
                                ))
                            ) : (
                                <div className="border border-dashed border-[#d8c4a2] px-3 py-6 text-center text-sm text-[#8a5a2f]">暂无天赋记录</div>
                            )}
                        </div>
                    </div>

                    <div className="border border-[#c7a56a]/35 bg-[#fffdf6] p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-[#9b5a22]" title="悬浮每个六维格可查看具体影响">{文案.六维}</div>
                            {可用属性点 > 0 && (
                                <div className="rounded-sm border border-[#c7a56a]/55 bg-[#fff4df] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#7a3f12]">
                                    可分配 {可用属性点}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {attributes.map((attr) => (
                                <div key={`detail-${attr.key}`} title={attr.title} className="relative cursor-help border border-[#d8c4a2] bg-[#fffaf0] px-2 py-3 text-center">
                                    <div className="text-[10px] tracking-[0.2em] text-[#8a5a2f]">{attr.key}</div>
                                    <div className="mt-1 text-lg font-mono font-bold text-[#7a3f12]">{attr.val}</div>
                                    {可用属性点 > 0 && onAllocateAttributePoint && (
                                        <button
                                            type="button"
                                            onClick={() => onAllocateAttributePoint(attr.attributeKey)}
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#c7a56a]/70 bg-[#7a3f12] text-sm font-bold leading-none text-[#fffaf0] shadow-sm transition-transform hover:scale-105 hover:bg-[#9b5a22]"
                                            aria-label={`分配1点到${attr.attributeKey}`}
                                            title={`分配1点到${attr.attributeKey}`}
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border border-[#c7a56a]/35 bg-[#fffdf6] p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-[#9b5a22]">{文案.部位}</div>
                            <div className={`text-[10px] ${总气血.已死亡 ? 'text-[#b42318]' : 'text-[#8a5a2f]'}`}>总{资源文案.气血} {总气血.当前}/{总气血.最大}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {部位状态列表.map((part) => {
                                const danger = part.状态 !== '正常' || (part.最大 > 0 && part.比例 <= 35);
                                return (
                                    <div key={part.名称} className="border border-[#d8c4a2] bg-[#fffaf0] px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold tracking-[0.16em] text-[#7a3f12]">{part.名称}</span>
                                            <span className={`text-[11px] ${danger ? 'text-[#b42318]' : 'text-[#198754]'}`}>{part.状态}</span>
                                        </div>
                                        <div className="mt-2 h-3 overflow-hidden rounded-full border border-[#c5ad86] bg-[#eadcc0] shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-[width] ${danger ? 'bg-gradient-to-r from-[#d92d20] to-[#b42318]' : 'bg-gradient-to-r from-[#16a34a] to-[#047857] shadow-[0_0_8px_rgba(22,163,74,0.28)]'}`}
                                                style={{ width: `${part.比例}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 font-mono text-[11px] text-[#8a5a2f]">{part.当前}/{part.最大}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CharacterProfileCard;
