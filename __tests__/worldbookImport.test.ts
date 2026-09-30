import { describe, expect, it } from 'vitest';
import { 构建世界书注入文本, 解析世界书导入数据, 解析世界书关键词, 构建主剧情世界书作用域 } from '../utils/worldbook';

describe('SillyTavern 世界书导入', () => {
    it('converts object-shaped World Info entries', () => {
        const books = 解析世界书导入数据({
            entries: {
                0: {
                    key: ['青云门'],
                    keysecondary: [],
                    comment: '门派设定',
                    content: '青云门是测试门派。',
                    constant: false,
                    selective: true,
                    order: 100,
                    disable: false,
                    uid: 7
                },
                1: {
                    key: [],
                    keysecondary: [],
                    comment: '常驻规则',
                    content: '这是常驻规则。',
                    constant: true,
                    selective: true,
                    order: 90,
                    disable: false,
                    uid: 8
                }
            },
            originalData: {}
        });

        expect(books).toHaveLength(1);
        expect(books[0].条目).toHaveLength(2);
        expect(books[0].条目[0]).toMatchObject({
            id: '7',
            标题: '门派设定',
            内容: '青云门是测试门派。',
            注入模式: 'match_any',
            关键词: ['青云门'],
            作用域: ['all'],
            启用: true
        });
        expect(books[0].条目[1]).toMatchObject({
            id: '8',
            标题: '常驻规则',
            注入模式: 'always',
            关键词: []
        });
    });
});

describe('世界书注入选择', () => {
    it('matches original structured history, splits keywords and keeps matched budget separate from always entries', () => {
        expect(解析世界书关键词(['档案，医院', '医院;线索\n图书馆'])).toEqual(['档案', '医院', '线索', '图书馆']);
        const entry = (id: string, content: string, mode: string, keywords: string[]) => ({
            id, 标题: id, 内容: content, 类型: 'world_lore', 作用域: ['main'],
            注入模式: mode, 关键词: keywords, 启用: true
        });
        const books: any[] = [{ id: 'book', 启用: true, 条目: [
            entry('always', 'A'.repeat(20000), 'always', []),
            entry('matched', 'archive-marker', 'match_any', ['档案，医院']),
            entry('display-only', 'must-not-match', 'match_any', ['展示替换'])
        ] }];
        const history: any[] = [{ role: 'assistant', content: '', structuredResponse: {
            logs: [{ sender: '旁白', text: '展示替换' }],
            body_original_logs: [{ sender: '旁白', text: '去医院查档案' }]
        } }];
        const scopes = 构建主剧情世界书作用域(true);
        expect(scopes).toEqual(['main', 'tavern']);
        const result = 构建世界书注入文本({ books, scopes, history });
        expect(result.selectedEntries.map(e => e.id)).toEqual(['always', 'matched']);
        expect(构建世界书注入文本({ books, scopes, history, maxChars: 0 }).selectedEntries).toEqual([]);
        expect(构建世界书注入文本({ books, scopes, history, maxChars: 1 }).selectedEntries).toEqual([]);
    });
    it('默认不会因为预算裁掉命中作用域的始终注入条目', () => {
        const books: any[] = [{
            id: 'always-book',
            标题: '始终注入测试',
            启用: true,
            条目: [
                {
                    id: 'always-a',
                    标题: '始终条目A',
                    内容: 'A'.repeat(90),
                    类型: 'world_lore',
                    作用域: ['main'],
                    注入模式: 'always',
                    关键词: [],
                    优先级: 100,
                    启用: true
                },
                {
                    id: 'always-b',
                    标题: '始终条目B',
                    内容: 'B'.repeat(90),
                    类型: 'world_lore',
                    作用域: ['main'],
                    注入模式: 'always',
                    关键词: [],
                    优先级: 99,
                    启用: true
                }
            ]
        }];

        const result = 构建世界书注入文本({ books, scopes: ['main'], maxChars: undefined });

        expect(result.selectedEntries.map((entry) => entry.id)).toEqual(['always-a', 'always-b']);
    });

    it('显式 maxChars 仍可作为硬预算限制始终注入条目', () => {
        const books: any[] = [{
            id: 'always-book',
            标题: '始终注入测试',
            启用: true,
            条目: [
                {
                    id: 'always-a',
                    标题: '始终条目A',
                    内容: 'A'.repeat(90),
                    类型: 'world_lore',
                    作用域: ['main'],
                    注入模式: 'always',
                    关键词: [],
                    优先级: 100,
                    启用: true
                },
                {
                    id: 'always-b',
                    标题: '始终条目B',
                    内容: 'B'.repeat(90),
                    类型: 'world_lore',
                    作用域: ['main'],
                    注入模式: 'always',
                    关键词: [],
                    优先级: 99,
                    启用: true
                }
            ]
        }];

        const result = 构建世界书注入文本({ books, scopes: ['main'], maxChars: 120 });

        expect(result.selectedEntries.map((entry) => entry.id)).toEqual(['always-a']);
    });
});
