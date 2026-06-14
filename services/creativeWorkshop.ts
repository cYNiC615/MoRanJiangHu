import { 创意工坊模块列表, 整合创意工坊模式包, type 创意工坊模块条目, type 创意工坊模块类型 } from '../data/creativeWorkshopModules';
import { RELEASE_INFO } from '../data/releaseInfo';
import { buildCreativeWorkshopContentFingerprint, filterCreativeWorkshopDuplicates, isOfficialCreativeWorkshopDuplicate } from '../utils/creativeWorkshopDedupe';
import { isNativeCapacitorEnvironment } from '../utils/nativeRuntime';
import { 规范化模式运行时配置 } from '../utils/modeRuntimeProfile';
import { 规范化ComfyUI工作流JSON } from './ai/comfyWorkflowTools';
import { 读取云端游玩会话 } from './cloudPlayService';

export const 已启用创意工坊模块存储键 = 'creative_workshop_enabled_modules';
export const 本地创意工坊模块存储键 = 'creative_workshop_local_modules';

export interface 发布创意工坊模块参数 {
    module: 创意工坊模块条目;
    contributor?: string;
    anonymous?: boolean;
}

export interface 编辑创意工坊模块参数 {
    id: string;
    patch: Partial<Pick<创意工坊模块条目, 'title' | 'subtitle' | 'description' | 'tags' | 'contributor'>>;
    anonymous?: boolean;
}

const API_PATH = '/api/workshop/modules';
const HTML_FALLBACK_ERROR = '创意工坊接口没有命中服务端函数，当前请求被网站首页兜底处理。请刷新页面或更新到最新版本后重试。';

const 看起来像HTML页面 = (text: string): boolean => /^\s*<!doctype\s+html\b/i.test(text) || /^\s*<html\b/i.test(text);

export const 获取创意工坊API基础地址 = (): string => {
    if (typeof window !== 'undefined' && /^https?:$/i.test(window.location.protocol) && !isNativeCapacitorEnvironment()) {
        return window.location.origin.replace(/\/+$/, '');
    }
    const configured = typeof RELEASE_INFO.websiteUrl === 'string' ? RELEASE_INFO.websiteUrl.trim() : '';
    return (configured || 'https://msjh.bacon159.pp.ua').replace(/\/+$/, '');
};

const 构建创意工坊API地址 = (search = ''): string => {
    const base = 获取创意工坊API基础地址();
    const suffix = search ? `${API_PATH}${search.startsWith('?') ? search : `?${search}`}` : API_PATH;
    return `${base}${suffix}`;
};

const 读取响应JSON = async (response: Response): Promise<any> => {
    const text = await response.text();
    if (看起来像HTML页面(text)) return { ok: false, error: HTML_FALLBACK_ERROR };
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        const preview = text.trim().slice(0, 200);
        return { ok: false, error: preview ? `创意工坊接口返回了非 JSON 内容：${preview}` : '创意工坊接口返回了空响应' };
    }
};

const 构建账号载荷 = (anonymous?: boolean) => {
    const session = (() => {
        try {
            return 读取云端游玩会话();
        } catch {
            return null;
        }
    })();
    if (!session?.username || !session.password) return {};
    return {
        auth: {
            username: session.username,
            password: session.password
        },
        anonymous: anonymous === true
    };
};

const 构建必需账号载荷 = (anonymous?: boolean) => {
    const payload = 构建账号载荷(anonymous);
    if (!payload.auth) {
        throw new Error('请先登录联机账号再发布、编辑或删除创意工坊投稿。匿名发布只隐藏显示署名，仍需要账号绑定用于后续管理。');
    }
    return payload;
};

const 规范化下载地址 = (value: unknown, id: string): string => {
    const fallback = 构建创意工坊API地址(`action=download&id=${encodeURIComponent(id || '')}`);
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return fallback;
    try {
        return new URL(raw, 获取创意工坊API基础地址()).toString();
    } catch {
        return fallback;
    }
};

const 提取模块正文 = (entry: 创意工坊模块条目): string => {
    const payload = entry.payload as any;
    const directContent = typeof payload?.content === 'string' ? payload.content.trim() : '';
    if (directContent) return directContent;
    if (entry.contentBlocks?.length) {
        const merged = entry.contentBlocks
            .map((block) => block?.content?.trim() || '')
            .filter(Boolean)
            .join('\n\n');
        if (merged) return merged;
    }
    return entry.injectionPreview.join('\n').trim();
};

const 规范化世界细节生成配置 = (raw: any): 创意工坊模块条目['worldDetailGeneration'] | undefined => {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw)
        ? raw
        : undefined;
    if (!source) return undefined;
    return {
        aiGenerate: source.aiGenerate !== false,
        importantPeople: typeof source.importantPeople === 'string' ? source.importantPeople.trim() : '',
        importantFactions: typeof source.importantFactions === 'string' ? source.importantFactions.trim() : '',
        mapDesign: typeof source.mapDesign === 'string' ? source.mapDesign.trim() : '',
        mapDiyDraft: source.mapDiyDraft && typeof source.mapDiyDraft === 'object' && !Array.isArray(source.mapDiyDraft)
            ? source.mapDiyDraft
            : undefined
    };
};

const 升级旧版开局模块 = (entry: 创意工坊模块条目): 创意工坊模块条目 => {
    if (entry.type !== 'opening') return entry;
    const payload = entry.payload as any;
    const suiteId = typeof payload?.suiteId === 'string' && payload.suiteId.trim()
        ? payload.suiteId.trim()
        : `legacy-opening-${entry.id}`;
    const suiteTitle = typeof payload?.suiteTitle === 'string' && payload.suiteTitle.trim()
        ? payload.suiteTitle.trim()
        : entry.title;
    const mode = typeof payload?.mode === 'string'
        ? payload.mode
        : typeof payload?.value === 'string'
            ? payload.value
            : entry.preset?.openingConfig?.题材模式 || entry.modeRuntimeProfile?.identity?.baseMode || '武侠';
    const runtimeProfile = (() => {
        const rawProfile = entry.modeRuntimeProfile || payload?.modeRuntimeProfile;
        if (!rawProfile || typeof rawProfile !== 'object' || Array.isArray(rawProfile)) return undefined;
        return 规范化模式运行时配置(rawProfile, mode);
    })();
    const content = 提取模块正文(entry);
    const contentBlocks = (entry.contentBlocks?.length
        ? entry.contentBlocks.map((block, index) => ({
            ...block,
            id: String(block.id || `${entry.id}-legacy-${index}`).trim(),
            title: String(block.title || '开局规则').trim(),
            purpose: String(block.purpose || entry.description || '旧版开局模块自动迁移内容。').trim(),
            injectionTarget: block.injectionTarget && block.injectionTarget !== 'referenceOnly'
                ? block.injectionTarget
                : 'manualWorldPrompt'
        }))
        : [{
            id: `${entry.id}-legacy-opening`,
            title: '开局规则',
            purpose: entry.description || '旧版开局模块自动迁移内容。',
            injectionTarget: 'manualWorldPrompt' as const,
            content
        }]) as NonNullable<创意工坊模块条目['contentBlocks']>;
    const usagePrompt = entry.usagePrompt?.trim() || '该模块由旧版开局模块自动升级；当前版本会按题材规则模块读取并兼容旧内容。';
    const safetyNotes = entry.safetyNotes?.length
        ? entry.safetyNotes
        : ['该模块由旧版开局模块自动迁移而来，建议在创意工坊中复核题材口径、开局规则与生成约束。'];
    return {
        ...entry,
        type: 'topic',
        subtitle: entry.subtitle || '旧版开局模块已自动升级',
        tags: Array.from(new Set([...entry.tags, '旧版兼容', '开局迁移'])).slice(0, 12),
        formatVersion: 2,
        workshopKind: 'standard_module',
        modeRuntimeProfile: runtimeProfile || entry.modeRuntimeProfile,
        contentBlocks,
        usagePrompt,
        safetyNotes,
        injectionPreview: entry.injectionPreview.length > 0
            ? entry.injectionPreview
            : [
                '标准格式：v2 / legacy-opening-migrated',
                `题材模式：${mode}`,
                `内容摘要：${content.slice(0, 120)}`
            ].filter(Boolean),
        preset: entry.preset
            ? {
                ...entry.preset,
                worldConfig: entry.preset.worldConfig
                    ? {
                        ...entry.preset.worldConfig,
                        modeRuntimeProfile: runtimeProfile || entry.preset.worldConfig.modeRuntimeProfile,
                        manualWorldPrompt: entry.preset.worldConfig.manualWorldPrompt || content
                    }
                    : entry.preset.worldConfig,
                openingConfig: entry.preset.openingConfig
                    ? {
                        ...entry.preset.openingConfig,
                        modeRuntimeProfile: runtimeProfile || entry.preset.openingConfig.modeRuntimeProfile
                    }
                    : entry.preset.openingConfig,
                openingExtraRequirement: entry.preset.openingExtraRequirement || content
            }
            : entry.preset,
        payload: {
            ...payload,
            schema: 'moranjianghu-creative-workshop-standard-module',
            version: 2,
            legacyType: 'opening',
            migratedFromLegacyOpening: true,
            suiteId,
            suiteTitle,
            mode,
            modeRuntimeProfile: runtimeProfile || payload?.modeRuntimeProfile,
            content,
            contentBlocks,
            usagePrompt,
            safetyNotes,
            manualWorldPrompt: typeof payload?.manualWorldPrompt === 'string' && payload.manualWorldPrompt.trim()
                ? payload.manualWorldPrompt.trim()
                : content
        }
    };
};

const 规范化当前模块 = (raw: any, source: 创意工坊模块条目['source']): 创意工坊模块条目 | null => {
    const normalized = 规范化模块(raw, source);
    if (!normalized) return null;
    return 升级旧版开局模块(normalized);
};

const 规范化模块 = (raw: any, source: 创意工坊模块条目['source']): 创意工坊模块条目 | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    const type = raw.type as 创意工坊模块类型;
    if (!id || !['topic', 'world_rules', 'opening', 'ability', 'comfy_workflow'].includes(type)) return null;
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) return null;
    return {
        id,
        type,
        title,
        subtitle: typeof raw.subtitle === 'string' ? raw.subtitle.trim() : '',
        description: typeof raw.description === 'string' ? raw.description.trim() : '',
        tags: Array.isArray(raw.tags) ? raw.tags.map((item: unknown) => String(item || '').trim()).filter(Boolean).slice(0, 12) : [],
        payload: raw.payload && typeof raw.payload === 'object' && !Array.isArray(raw.payload) ? raw.payload : {},
        worldDetailGeneration: 规范化世界细节生成配置(raw.worldDetailGeneration || raw.payload?.worldDetailGeneration),
        modeWorldbooks: Array.isArray(raw.modeWorldbooks)
            ? raw.modeWorldbooks
            : Array.isArray(raw.payload?.modeWorldbooks)
                ? raw.payload.modeWorldbooks
                : undefined,
        modeRuntimeProfile: raw.modeRuntimeProfile && typeof raw.modeRuntimeProfile === 'object' && !Array.isArray(raw.modeRuntimeProfile)
            ? raw.modeRuntimeProfile
            : raw.payload?.modeRuntimeProfile && typeof raw.payload.modeRuntimeProfile === 'object' && !Array.isArray(raw.payload.modeRuntimeProfile)
                ? raw.payload.modeRuntimeProfile
                : undefined,
        injectionPreview: Array.isArray(raw.injectionPreview) ? raw.injectionPreview.map((item: unknown) => String(item || '').trim()).filter(Boolean).slice(0, 12) : [],
        formatVersion: Number(raw.formatVersion) === 2 ? 2 : undefined,
        workshopKind: raw.workshopKind === 'standard_module' ? 'standard_module' : undefined,
        contentBlocks: Array.isArray(raw.contentBlocks)
            ? raw.contentBlocks.map((block: any) => ({
                id: String(block?.id || '').trim(),
                title: String(block?.title || '').trim(),
                purpose: String(block?.purpose || '').trim(),
                content: String(block?.content || '').trim(),
                injectionTarget: ['manualWorldPrompt', 'worldExtraRequirement', 'manualRealmPrompt', 'openingExtraRequirement', 'imageWorkflow', 'referenceOnly'].includes(block?.injectionTarget) ? block.injectionTarget : undefined
            })).filter((block: any) => block.id && block.title && block.content).slice(0, 24)
            : undefined,
        usagePrompt: typeof raw.usagePrompt === 'string' ? raw.usagePrompt.trim() : '',
        safetyNotes: Array.isArray(raw.safetyNotes) ? raw.safetyNotes.map((item: unknown) => String(item || '').trim()).filter(Boolean).slice(0, 12) : [],
        preset: raw.preset && typeof raw.preset === 'object' ? raw.preset : undefined,
        source,
        contributor: typeof raw.contributor === 'string' ? raw.contributor.trim() : '',
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
        downloadUrl: 规范化下载地址(raw.downloadUrl, id),
        sha256: typeof raw.sha256 === 'string' ? raw.sha256 : '',
        ownerUserId: typeof raw.ownerUserId === 'string' ? raw.ownerUserId : undefined,
        ownerUsername: typeof raw.ownerUsername === 'string' ? raw.ownerUsername : undefined,
        anonymous: raw.anonymous === true
    };
};

export const 读取本地创意工坊模块 = (): 创意工坊模块条目[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
        const parsed = JSON.parse(localStorage.getItem(本地创意工坊模块存储键) || '[]');
        if (!Array.isArray(parsed)) return [];
        const modules = parsed.map((item) => 规范化当前模块(item, 'local')).filter(Boolean) as 创意工坊模块条目[];
        const nextSerialized = JSON.stringify(modules);
        if (localStorage.getItem(本地创意工坊模块存储键) !== nextSerialized) {
            localStorage.setItem(本地创意工坊模块存储键, nextSerialized);
        }
        return modules;
    } catch {
        return [];
    }
};

export const 保存本地创意工坊模块 = (modules: 创意工坊模块条目[]): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(本地创意工坊模块存储键, JSON.stringify(modules));
};

export const 导入本地创意工坊模块 = (module: 创意工坊模块条目): 创意工坊模块条目 => {
    const normalized = 规范化当前模块({ ...module, id: module.id || `local-${Date.now()}` }, 'local');
    if (!normalized) throw new Error('模块 JSON 格式不完整');
    const next = [normalized, ...读取本地创意工坊模块().filter((item) => item.id !== normalized.id)].slice(0, 100);
    保存本地创意工坊模块(next);
    return normalized;
};

export const 列出创意工坊模块 = async (): Promise<创意工坊模块条目[]> => {
    const seen = new Set<string>();
    return filterCreativeWorkshopDuplicates(整合创意工坊模式包([...创意工坊模块列表, ...读取本地创意工坊模块()])
        .map((entry) => ({ ...entry, source: entry.source || 'builtin' }))
        .filter((entry) => {
            const key = `${entry.source}:${entry.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }));
};

export const 发布创意工坊模块 = async (params: 发布创意工坊模块参数): Promise<创意工坊模块条目> => {
    if (isOfficialCreativeWorkshopDuplicate(params.module, 创意工坊模块列表)) {
        throw new Error('该模块与官方预设完全一致，无需重复贡献社区。');
    }
    const response = await fetch(构建创意工坊API地址(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            module: params.module,
            contributor: params.contributor || params.module.contributor || '',
            officialFingerprints: 创意工坊模块列表.map(buildCreativeWorkshopContentFingerprint),
            ...构建必需账号载荷(params.anonymous)
        })
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `发布创意工坊失败：${response.status}`);
    }
    const entry = 规范化当前模块(payload.entry, 'cloud');
    if (!entry) throw new Error('发布创意工坊失败：服务端没有返回模块信息');
    return entry;
};

export const 编辑创意工坊模块 = async (params: 编辑创意工坊模块参数): Promise<创意工坊模块条目> => {
    const response = await fetch(构建创意工坊API地址(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            action: 'update',
            id: params.id,
            patch: params.patch,
            ...构建必需账号载荷(params.anonymous)
        })
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `编辑创意工坊失败：${response.status}`);
    }
    const entry = 规范化当前模块(payload.entry, 'cloud');
    if (!entry) throw new Error('编辑创意工坊失败：服务端没有返回模块信息');
    return entry;
};

export const 删除创意工坊模块 = async (id: string): Promise<void> => {
    const response = await fetch(构建创意工坊API地址(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            action: 'delete',
            id,
            ...构建必需账号载荷(false)
        })
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `删除创意工坊失败：${response.status}`);
    }
};

export const 下载创意工坊模块 = async (entry: 创意工坊模块条目): Promise<创意工坊模块条目> => {
    if (entry.source !== 'cloud') return entry;
    const response = await fetch(entry.downloadUrl || 构建创意工坊API地址(`action=download&id=${encodeURIComponent(entry.id)}`));
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `下载创意工坊模块失败：${response.status}`);
    }
    const module = 规范化当前模块(payload.module || payload.entry || payload, 'cloud');
    if (!module) throw new Error('下载创意工坊模块失败：模块内容不完整');
    return module;
};

export const 提取ComfyUI工作流模块JSON = (entry: 创意工坊模块条目): string => {
    if (entry.type !== 'comfy_workflow') return '';
    const payload = entry.payload || {};
    const raw = (payload as any).workflowJson || (payload as any).ComfyUI工作流JSON || (payload as any).workflow || (payload as any).apiWorkflow;
    if (typeof raw === 'string') return 规范化ComfyUI工作流JSON(JSON.parse(raw));
    return 规范化ComfyUI工作流JSON(raw);
};

export const 构建ComfyUI工作流创意工坊模块 = (params: {
    title: string;
    workflowJson: string;
    scope?: 'main' | 'scene' | 'nsfw' | 'all';
    style?: string;
    contributor?: string;
}): 创意工坊模块条目 => {
    const normalized = 规范化ComfyUI工作流JSON(JSON.parse(params.workflowJson));
    const parsed = JSON.parse(normalized);
    const nodeCount = Object.keys(parsed || {}).length;
    const scope = params.scope || 'main';
    const title = (params.title || '').trim() || `ComfyUI 工作流 ${new Date().toLocaleString()}`;
    const style = (params.style || '').trim() || '通用写实';
    return {
        id: `local-comfy-${Date.now()}`,
        type: 'comfy_workflow',
        title,
        subtitle: `${style} · ${scope === 'nsfw' ? 'NSFW 生图工作流' : scope === 'scene' ? '场景生图工作流' : scope === 'all' ? '通用生图工作流' : '普通生图工作流'}`,
        description: `玩家贡献的 ${style} ComfyUI API workflow，可在文生图设置中通过下拉框切换使用。`,
        tags: ['ComfyUI', 'Workflow', style, scope],
        payload: {
            workflowJson: normalized,
            scope,
            style,
            nodeCount
        },
        injectionPreview: [
            `适用范围：${scope}`,
            `风格：${style}`,
            `节点数量：${nodeCount}`,
            '注入方式：选择后写入对应 ComfyUI Workflow JSON，并关闭“使用默认工作流”。',
            '占位符：会继续支持 __PROMPT__、__NEGATIVE_PROMPT__、__WIDTH__、__HEIGHT__。'
        ],
        source: 'local',
        contributor: params.contributor || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};
