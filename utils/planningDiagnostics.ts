import type { 导演配置结构, 剧情规划结构 } from '../types';

export type 规划人物诊断 = { path: string; name: string };

export const 收集未登记规划人物 = (
    plan: Partial<剧情规划结构> | null | undefined,
    social: any[],
    playerName: string,
    director?: Partial<导演配置结构>
): 规划人物诊断[] => {
    const normalize = (value: unknown) => typeof value === 'string' ? value.replace(/\s+/g, '').toLowerCase() : '';
    const known = new Set<string>();
    const add = (value: unknown) => {
        const values = Array.isArray(value) ? value : [value];
        values.map(normalize).filter(Boolean).forEach(name => known.add(name));
    };
    add(playerName);
    for (const npc of Array.isArray(social) ? social : []) {
        add(npc?.姓名); add(npc?.曾用名); add(npc?.别名); add(npc?.称号);
    }
    for (const seed of Array.isArray(director?.角色种子定义) ? director.角色种子定义 : []) {
        add(seed?.id); add(seed?.名称);
    }
    const missing: 规划人物诊断[] = [];
    for (const field of ['当前章任务', '镜头规划'] as const) {
        const entries = plan?.[field];
        if (!Array.isArray(entries)) continue;
        entries.forEach((entry, index) => {
            const seen = new Set<string>();
            for (const name of Array.isArray(entry?.关联人物) ? entry.关联人物 : []) {
                const key = normalize(name);
                if (!key || known.has(key) || seen.has(key)) continue;
                seen.add(key);
                missing.push({ path: `${field}[${index}].关联人物`, name: name.trim() });
            }
        });
    }
    return missing;
};
