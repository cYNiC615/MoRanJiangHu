import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { 构建世界书注入文本 } from '../utils/worldbook';
import { 规范化开局配置 } from '../utils/openingConfig';
import { 构建运行时世界书解析结果, 补全开局运行时世界书快照 } from '../utils/runtimeWorldbooks';
import { 构建系统提示词 } from '../hooks/useGame/systemPromptBuilder';
import { 默认提示词 } from '../prompts';
import { 默认游戏设置 } from '../utils/gameSettings';
import type { 世界书结构 } from '../types';

const 创建用户世界书 = (): 世界书结构 => ({
    id: 'user-book',
    标题: '玩家世界书',
    描述: '玩家显式世界书',
    常驻大纲: '',
    启用: true,
    内置: false,
    创建时间: 1,
    更新时间: 1,
    条目: [{
        id: 'user-main-rule',
        标题: '用户规则',
        内容: '玩家自定义世界书内容必须保留优先。',
        启用: true,
        类型: 'world_lore',
        作用域: ['main'],
        注入模式: 'always',
        优先级: 200,
        关键词: [],
        创建时间: 1,
        更新时间: 1
    }]
});

describe('Phase 3.2 runtime worldbook resolver', () => {
    it('为默认现代开局补全 mode worldbook snapshot，但不标记 UI 模式包选择', () => {
        const openingConfig = 规范化开局配置({});
        const completed = 补全开局运行时世界书快照(openingConfig);

        expect(completed.runtimeSnapshot?.modeWorldbooks?.[0]?.id).toContain('现代都市');
        expect(completed.runtimeSnapshot?.modeWorldbooks?.[0]?.标题).toContain('运行时兜底世界书');
        expect(completed.runtimeSnapshot?.modeWorldbooks?.[0]?.标题).not.toContain('模式包');
        expect(completed.runtimeSnapshot?.workshopSelection?.selectedMode).toBeUndefined();
        expect(completed.runtimeSnapshot?.workshopSelection?.selectedModules).toBeUndefined();
    });

    it('合并用户世界书和默认现代 mode worldbook，并能进入实际注入文本', () => {
        const openingConfig = 补全开局运行时世界书快照(规范化开局配置({ 题材模式: '现代都市' }));
        const result = 构建运行时世界书解析结果({
            openingConfig,
            userWorldbooks: [创建用户世界书()]
        });
        const injected = 构建世界书注入文本({
            books: result.books,
            scopes: ['main'],
            extraTexts: ['校园合租兼职关系推进']
        }).combinedText;

        expect(result.books.map((book) => book.id)).toContain('user-book');
        expect(result.modeWorldbooks.map((book) => book.id).some((id) => id.includes('现代都市'))).toBe(true);
        expect(injected).toContain('玩家自定义世界书内容必须保留优先');
        expect(injected).toContain('现代都市');
    });

    it('显式旧题材和显式模式包选择不会被现代 fallback 污染', () => {
        const explicitWuxia = 补全开局运行时世界书快照(规范化开局配置({ 题材模式: '武侠' }));
        const explicitSelection = 补全开局运行时世界书快照(规范化开局配置({
            题材模式: '现代都市',
            runtimeSnapshot: {
                workshopSelection: {
                    selectedMode: '武侠',
                    selectedModules: { topic: 'builtin:mode-package-武侠' }
                }
            }
        }));

        expect(explicitWuxia.runtimeSnapshot?.modeWorldbooks?.some((book) => book.id.includes('现代都市'))).not.toBe(true);
        expect(explicitSelection.runtimeSnapshot?.modeWorldbooks?.some((book) => book.id.includes('现代都市'))).not.toBe(true);
        expect(explicitSelection.runtimeSnapshot?.workshopSelection?.selectedMode).toBe('武侠');
    });

    it('变量生成不会为普通日常常驻注入完整名器世界书触发词', () => {
        const source = readFileSync(resolve(process.cwd(), 'hooks/useGame/variableModelWorkflow.ts'), 'utf8');
        const openingSource = readFileSync(resolve(process.cwd(), 'hooks/useGame/openingStoryWorkflow.ts'), 'utf8');

        expect(source).not.toContain('名器世界书触发词');
        expect(source).toContain('log?.content ?? log?.text');
        expect(source).toContain('responseVariablePlanText');
        expect(source).toContain('extraTexts: [params.playerInput, responseBodyText, responseVariablePlanText]');
        expect(openingSource).not.toContain('const variableWorldbookExtra');
    });

    it('非 explicit NSFW 层级会压制名器世界书 always 条目', () => {
        const mingqiBooks = JSON.parse(readFileSync(resolve(process.cwd(), 'public/worldbook-presets/mingqi-core.json'), 'utf8'));
        const injected = 构建世界书注入文本({
            books: mingqiBooks,
            scopes: ['main'],
            nsfwPromptLevel: 'beacon',
            extraTexts: ['今天去学校旁边吃早餐，顺路买了咖啡。']
        });

        expect(injected.combinedText).not.toMatch(/名器|小穴|阴蒂|蜜液|子宫/u);
        expect(injected.suppressedEntryCount).toBeGreaterThan(0);
    });

    it('系统提示构建使用独立 NSFW 判级文本，不被世界书匹配协议污染', () => {
        const mingqiBooks = JSON.parse(readFileSync(resolve(process.cwd(), 'public/worldbook-presets/mingqi-core.json'), 'utf8'));
        const result = 构建系统提示词({
            promptPool: 默认提示词,
            memoryData: { 短期记忆: [], 中期记忆: [], 长期记忆: [] } as any,
            socialData: [],
            statePayload: {
                角色: { 姓名: '沈砚' },
                环境: { 大地点: '海川市', 小地点: '便利店', 具体地点: '收银台' },
                世界: {},
                剧情: {},
                剧情规划: {},
                女主剧情规划: {},
                任务列表: []
            },
            gameConfig: {
                ...默认游戏设置,
                启用NSFW模式: true,
                启用亲密边界机制: true
            },
            memoryConfig: {} as any,
            worldbooks: mingqiBooks,
            worldEvolutionEnabled: false,
            options: {
                世界书作用域: ['opening'],
                世界书附加文本: ['开局建档规则：缺少名器档案、小穴描述、子宫档案、失贞档案时后续补齐。'],
                NSFW层级判定文本: ['今天上午去学校旁边的便利店买早餐。']
            } as any
        });

        expect(result.contextPieces.nsfwPromptLevel).toBe('beacon');
        expect(result.contextPieces.suppressedWorldbookCount).toBeGreaterThan(0);
    });

    it('explicit NSFW 层级允许名器世界书按关键词命中', () => {
        const mingqiBooks = JSON.parse(readFileSync(resolve(process.cwd(), 'public/worldbook-presets/mingqi-core.json'), 'utf8'));
        const injected = 构建世界书注入文本({
            books: mingqiBooks,
            scopes: ['main'],
            nsfwPromptLevel: 'explicit',
            extraTexts: ['她明确同意后，亲密场景进入小穴、阴蒂和蜜液描写。']
        });

        expect(injected.combinedText).toMatch(/名器|小穴|阴蒂|蜜液/u);
        expect(injected.suppressedEntryCount).toBe(0);
    });
});
