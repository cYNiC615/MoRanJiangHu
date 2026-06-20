import type { NPC结构, OpeningConfig, 导演配置结构, 角色种子定义结构, 角色种子运行时状态结构, 角色种子状态类型 } from '../types';

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 拆分标签 = (value: unknown): string[] => {
    const raw = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(/[\r\n,，、;；|/]+/u)
            : [];
    const seen = new Set<string>();
    const result: string[] = [];
    raw.forEach((item) => {
        const text = 读取文本(item);
        if (!text || seen.has(text)) return;
        seen.add(text);
        result.push(text);
    });
    return result.slice(0, 12);
};

const 合法种子状态 = new Set<角色种子状态类型>(['未引入', '已引入', '已转正', '暂停']);

const 规范化角色种子定义 = (raw: any, index: number): 角色种子定义结构 | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const 名称 = 读取文本(raw.名称 ?? raw.name);
    const 入口摘要 = 读取文本(raw.入口摘要 ?? raw.summary ?? raw.摘要);
    if (!名称 || !入口摘要) return null;
    const id = 读取文本(raw.id ?? raw.seedId) || `role_seed_${index}_${名称}`;
    return {
        id,
        名称,
        性别: 读取文本(raw.性别) || '女',
        是否启用: raw.是否启用 !== false && raw.enabled !== false,
        入口摘要,
        完整设定: 读取文本(raw.完整设定 ?? raw.fullCard ?? raw.设定),
        关系入口标签: 拆分标签(raw.关系入口标签 ?? raw.tags),
        默认发展方向: 读取文本(raw.默认发展方向 ?? raw.direction),
        备注: 读取文本(raw.备注)
    };
};

const 规范化种子状态 = (raw: any, seedIds: Set<string>): 角色种子运行时状态结构 | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const seedId = 读取文本(raw.seedId ?? raw.id ?? raw.角色种子ID);
    if (!seedId || (seedIds.size > 0 && !seedIds.has(seedId))) return null;
    const rawStatus = 读取文本(raw.状态 ?? raw.status) as 角色种子状态类型;
    const 状态 = 合法种子状态.has(rawStatus) ? rawStatus : '未引入';
    return {
        seedId,
        状态,
        linkedNpcId: 读取文本(raw.linkedNpcId ?? raw.npcId),
        linkedNpcName: 读取文本(raw.linkedNpcName ?? raw.npcName ?? raw.姓名),
        更新时间: 读取文本(raw.更新时间)
    };
};

export const 创建默认导演配置 = (): 导演配置结构 => ({
    玩家剧情倾向: '',
    角色种子定义: [],
    角色种子运行时状态: []
});

export const 规范化导演配置 = (
    raw?: any,
    options?: { openingConfig?: Partial<OpeningConfig> | null }
): 导演配置结构 => {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const 角色种子定义 = Array.isArray(source.角色种子定义)
        ? source.角色种子定义
            .map((item: any, index: number) => 规范化角色种子定义(item, index))
            .filter(Boolean) as 角色种子定义结构[]
        : [];
    const seedIds = new Set(角色种子定义.map((seed) => seed.id));
    const explicitStates = Array.isArray(source.角色种子运行时状态)
        ? source.角色种子运行时状态
            .map((item: any) => 规范化种子状态(item, seedIds))
            .filter(Boolean) as 角色种子运行时状态结构[]
        : [];
    const stateBySeed = new Map(explicitStates.map((state) => [state.seedId, state]));
    角色种子定义.forEach((seed) => {
        if (!stateBySeed.has(seed.id)) {
            stateBySeed.set(seed.id, { seedId: seed.id, 状态: seed.是否启用 ? '未引入' : '暂停' });
        }
    });
    return {
        玩家剧情倾向: 读取文本(source.玩家剧情倾向) || 读取文本(options?.openingConfig?.玩家剧情倾向),
        角色种子定义,
        角色种子运行时状态: Array.from(stateBySeed.values())
            .filter((state) => seedIds.has(state.seedId))
    };
};

const 关键词肯定命中 = (text: string, keyword: string): boolean => {
    if (!text || !keyword) return false;
    let fromIndex = 0;
    while (fromIndex < text.length) {
        const index = text.indexOf(keyword, fromIndex);
        if (index < 0) return false;
        const prefix = text.slice(Math.max(0, index - 12), index);
        if (!/(没有|并未|未|无需|不需要|不必|不要|不|无).{0,8}$/u.test(prefix)) {
            return true;
        }
        fromIndex = index + keyword.length;
    }
    return false;
};

const 命中角色种子 = (seed: 角色种子定义结构, triggerTexts: string[]): boolean => {
    const texts = triggerTexts.map((text) => 读取文本(text)).filter(Boolean);
    if (texts.length <= 0) return false;
    if (seed.名称 && texts.some((text) => 关键词肯定命中(text, seed.名称))) return true;
    return (seed.关系入口标签 || []).some((tag) => tag && texts.some((text) => 关键词肯定命中(text, tag)));
};

const 读取状态 = (config: 导演配置结构, seedId: string): 角色种子状态类型 => (
    config.角色种子运行时状态.find((state) => state.seedId === seedId)?.状态 || '未引入'
);

export const 构建导演配置注入文本 = (
    rawConfig?: 导演配置结构,
    options?: { stage?: 'opening' | 'main' | 'planning' | 'heroine_plan'; triggerTexts?: string[]; maxExpandedCards?: number }
): string => {
    const config = 规范化导演配置(rawConfig);
    const lines: string[] = [];
    const preference = 读取文本(config.玩家剧情倾向);
    if (preference) {
        lines.push('【导演配置：玩家剧情倾向】', preference);
    }
    const activeSeeds = config.角色种子定义
        .filter((seed) => seed.是否启用 !== false)
        .filter((seed) => {
            const status = 读取状态(config, seed.id);
            return status !== '已转正' && status !== '暂停';
        });
    if (activeSeeds.length <= 0) return lines.join('\n').trim();

    lines.push('【角色种子入口摘要】');
    activeSeeds.forEach((seed, index) => {
        const tags = (seed.关系入口标签 || []).length > 0 ? `；入口标签：${seed.关系入口标签?.join('、')}` : '';
        const direction = seed.默认发展方向 ? `；方向：${seed.默认发展方向}` : '';
        lines.push(`${index + 1}. 角色种子ID：${seed.id}；${seed.名称}：${seed.入口摘要}${tags}${direction}`);
    });
    lines.push('- 以上是可用角色素材入口，不是既定事实；未登场种子不得写入 world_prompt、剧情规划、女主剧情规划或 社交[]。');

    const triggerTexts = options?.triggerTexts || [];
    const expanded = activeSeeds
        .filter((seed) => seed.完整设定 && 命中角色种子(seed, triggerTexts))
        .slice(0, Math.max(1, Math.min(3, options?.maxExpandedCards ?? 3)));
    if (expanded.length > 0) {
        lines.push('【角色种子完整卡片】');
        expanded.forEach((seed, index) => {
            lines.push(`${index + 1}. 角色种子ID：${seed.id}；${seed.名称}：${seed.完整设定}`);
        });
    }
    return lines.join('\n').trim();
};

const 读取NPC角色种子ID = (npc: Partial<NPC结构> & Record<string, any>): string => (
    读取文本(npc?.角色种子ID ?? npc?.seedId)
);

export type 角色种子转正同步结果 = {
    socialList: Array<Partial<NPC结构> & Record<string, any>>;
    directorConfig: 导演配置结构;
    changed: boolean;
    linkedSeedIds: string[];
};

export const 同步角色种子转正并回写社交 = (
    rawConfig: Partial<导演配置结构> | null | undefined,
    socialList: Array<Partial<NPC结构> & Record<string, any>> | null | undefined
): 角色种子转正同步结果 => {
    const config = 规范化导演配置(rawConfig);
    const inputSocialList = Array.isArray(socialList) ? socialList : [];
    if (config.角色种子定义.length <= 0 || inputSocialList.length <= 0) {
        return {
            socialList: inputSocialList,
            directorConfig: config,
            changed: false,
            linkedSeedIds: []
        };
    }
    const seedsById = new Map(config.角色种子定义.map((seed) => [seed.id, seed]));
    const currentStates = new Map(config.角色种子运行时状态.map((state) => [state.seedId, { ...state }]));
    const linkedSeedIds: string[] = [];
    const linkedSeedIdSet = new Set<string>();
    let changed = false;
    const nextSocialList = inputSocialList.map((npc) => {
        const seedId = 读取NPC角色种子ID(npc);
        const name = 读取文本(npc?.姓名);
        const seed = seedId ? seedsById.get(seedId) : undefined;
        if (!seed || seed.是否启用 === false) return npc;
        const previous = currentStates.get(seed.id);
        const nextState = {
            ...previous,
            seedId: seed.id,
            状态: '已转正',
            linkedNpcId: 读取文本(npc?.id) || previous?.linkedNpcId,
            linkedNpcName: name || previous?.linkedNpcName || seed.名称
        };
        if (JSON.stringify(previous) !== JSON.stringify(nextState)) {
            changed = true;
        }
        currentStates.set(seed.id, nextState);
        if (!linkedSeedIdSet.has(seed.id)) {
            linkedSeedIdSet.add(seed.id);
            linkedSeedIds.push(seed.id);
        }
        if (npc.角色种子ID === seed.id) return npc;
        changed = true;
        return { ...npc, 角色种子ID: seed.id };
    });

    return {
        socialList: nextSocialList,
        directorConfig: {
            ...config,
            角色种子运行时状态: config.角色种子定义.map((seed) => currentStates.get(seed.id) || { seedId: seed.id, 状态: '未引入' })
        },
        changed,
        linkedSeedIds
    };
};

export const 同步角色种子转正状态 = (
    rawConfig: Partial<导演配置结构> | null | undefined,
    socialList: Array<Partial<NPC结构> & Record<string, any>> | null | undefined
): 导演配置结构 => {
    return 同步角色种子转正并回写社交(rawConfig, socialList).directorConfig;
};
