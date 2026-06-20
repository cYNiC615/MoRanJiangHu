import { describe, expect, it } from 'vitest';
import { 构建世界书注入文本 } from '../utils/worldbook';
import { 规范化开局配置 } from '../utils/openingConfig';
import { 构建运行时世界书解析结果, 补全开局运行时世界书快照 } from '../utils/runtimeWorldbooks';
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
});
