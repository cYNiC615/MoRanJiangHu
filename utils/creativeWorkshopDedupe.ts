import type { 创意工坊模块条目 } from '../data/creativeWorkshopModules';

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };
type CreativeWorkshopFingerprintEntry = Pick<创意工坊模块条目, 'type' | 'title' | 'subtitle' | 'description' | 'tags' | 'payload' | 'injectionPreview' | 'preset' | 'formatVersion' | 'workshopKind' | 'contentBlocks' | 'usagePrompt' | 'safetyNotes'>;

const sortValue = (value: unknown): JsonLike => {
    if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
        return value as JsonLike;
    }
    if (Array.isArray(value)) {
        return value.map(sortValue);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, JsonLike>>((acc, key) => {
            const raw = (value as Record<string, unknown>)[key];
            const sorted = sortValue(raw);
            if (sorted !== undefined && raw !== undefined && raw !== null) acc[key] = sorted;
            return acc;
        }, {});
    }
    return null;
};

const normalizeText = (value: unknown): string => String(value ?? '').trim().replace(/\s+/g, ' ');

const normalizeList = (value: unknown): string[] => Array.isArray(value)
    ? value.map(normalizeText).filter(Boolean)
    : [];

export const buildCreativeWorkshopContentFingerprint = (entry: CreativeWorkshopFingerprintEntry): string => {
    return JSON.stringify(sortValue({
        type: entry.type,
        formatVersion: entry.formatVersion || null,
        workshopKind: entry.workshopKind || null,
        title: normalizeText(entry.title),
        subtitle: normalizeText(entry.subtitle),
        description: normalizeText(entry.description),
        tags: normalizeList(entry.tags),
        payload: entry.payload || {},
        contentBlocks: entry.contentBlocks || [],
        usagePrompt: normalizeText(entry.usagePrompt),
        safetyNotes: normalizeList(entry.safetyNotes),
        injectionPreview: normalizeList(entry.injectionPreview),
        preset: entry.preset || null
    }));
};

export const isOfficialCreativeWorkshopDuplicate = (
    entry: CreativeWorkshopFingerprintEntry,
    officialEntries: CreativeWorkshopFingerprintEntry[]
): boolean => {
    const fingerprint = buildCreativeWorkshopContentFingerprint(entry);
    return officialEntries.some((official) => buildCreativeWorkshopContentFingerprint(official) === fingerprint);
};

export const filterCreativeWorkshopDuplicates = (entries: 创意工坊模块条目[]): 创意工坊模块条目[] => {
    const seen = new Set<string>();
    return entries.filter((entry) => {
        const fingerprint = buildCreativeWorkshopContentFingerprint(entry);
        if (seen.has(fingerprint)) return false;
        seen.add(fingerprint);
        return true;
    });
};
