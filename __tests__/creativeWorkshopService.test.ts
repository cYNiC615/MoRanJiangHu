import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { 导入本地创意工坊模块, 列出创意工坊模块, 本地创意工坊模块存储键, 读取本地创意工坊模块 } from '../services/creativeWorkshop';

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn(() => {
            store.clear();
        })
    };
};

const 创建旧版开局模块 = () => ({
    id: 'legacy-opening-demo',
    type: 'opening' as const,
    title: '旧版开局模板',
    subtitle: '',
    description: '旧版本地模式包开局模块',
    tags: ['旧版', '兼容'],
    payload: {
        mode: '武侠',
        content: '这是旧版开局模块正文，用来约束开局规则。',
        modeRuntimeProfile: {
            identity: {
                modeId: 'legacy-opening-demo',
                displayName: '旧版开局模板',
                baseMode: '武侠'
            },
            opening: {
                defaultBackgrounds: ['江湖散人'],
                defaultTalents: ['稳扎稳打'],
                companionTemplate: '旧版伙伴模板',
                cutInTemplates: ['雨夜入城'],
                initialQuestTemplates: ['先避风头'],
                allowedGeneratedGenders: ['女'],
                lockGeneratedGenders: true,
                defaultEquipment: {
                    武器: '青锋剑'
                }
            }
        }
    },
    injectionPreview: ['旧版开局预览'],
    source: 'local' as const
});

describe('creativeWorkshop service', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.stubGlobal('localStorage', createLocalStorageMock());
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, entries: [] }))));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('读取本地旧版 opening 模块时会清掉，不再维护旧格式升级兼容', () => {
        const legacy = 创建旧版开局模块();
        localStorage.setItem(本地创意工坊模块存储键, JSON.stringify([legacy]));
        vi.mocked(localStorage.setItem).mockClear();

        const modules = 读取本地创意工坊模块();

        expect(modules).toEqual([]);
        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        const [, rewritten] = vi.mocked(localStorage.setItem).mock.calls[0];
        expect(rewritten).toBe('[]');
    });

    it('导入旧版 opening 模块会被拒绝', () => {
        expect(() => 导入本地创意工坊模块(创建旧版开局模块() as any)).toThrow('模块 JSON 格式不完整');
    });

    it('列出本地模式包模块不会请求外部列表', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            ok: true,
            entries: [{
                id: 'external-topic-demo',
                type: 'topic',
                title: '外部重复模式',
                subtitle: 'external',
                description: '不应出现在本地 homebrew 列表里',
                tags: ['external'],
                payload: { mode: '现代都市' },
                injectionPreview: ['external entry']
            }]
        })));
        vi.stubGlobal('fetch', fetchMock);

        const modules = await 列出创意工坊模块();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(modules.some((entry) => entry.id === 'external-topic-demo')).toBe(false);
    });
});
