import { describe, expect, it } from 'vitest';
import type { 酒馆正则脚本分类条目 } from '../models/system';
import { 执行酒馆安全正则 } from '../utils/tavernRegexEngine';

const script = (
    id: string,
    findRegex: string,
    replaceString: string,
    safetyType: 酒馆正则脚本分类条目['safetyType'] = 'safe-cleanup',
    patch: Partial<酒馆正则脚本分类条目['script']> = {}
): 酒馆正则脚本分类条目 => ({
    safetyType,
    script: {
        id,
        scriptName: id,
        findRegex,
        replaceString,
        placement: [2],
        disabled: false,
        markdownOnly: false,
        promptOnly: false,
        runOnEdit: false,
        minDepth: -1,
        maxDepth: 0,
        ...patch
    }
});

describe('酒馆安全正则引擎', () => {
    it('按顺序执行安全清理和静态 HTML 替换并支持捕获组', () => {
        const result = 执行酒馆安全正则('foo <summary>内容</summary>', [
            script('clean', '/foo/g', 'bar'),
            script('html', '/<summary>([\\s\\S]*?)<\\/summary>/g', '<section>$1</section>', 'html-beautify')
        ], { placement: 2, isMarkdown: true });

        expect(result).toBe('bar <section>内容</section>');
    });

    it('绝不执行 blocked、option-render、disabled 或 placement 不匹配的脚本', () => {
        const result = 执行酒馆安全正则('foo', [
            script('blocked', '/foo/g', 'blocked', 'blocked'),
            script('option', '/foo/g', 'option', 'option-render'),
            script('disabled', '/foo/g', 'disabled', 'safe-cleanup', { disabled: true }),
            script('wrong-placement', '/foo/g', 'wrong', 'safe-cleanup', { placement: [1] })
        ], { placement: 2 });

        expect(result).toBe('foo');
    });

    it('坏正则与深度不匹配不会破坏正文', () => {
        expect(执行酒馆安全正则('foo', [
            script('invalid', '/(/g', 'bad'),
            script('depth', '/foo/g', 'deep', 'safe-cleanup', { minDepth: 3 })
        ], { placement: 2, chatDepth: 1 })).toBe('foo');
    });
});
