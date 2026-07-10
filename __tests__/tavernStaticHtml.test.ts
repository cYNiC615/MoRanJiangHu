import { describe, expect, it } from 'vitest';
import { 规范化可渲染对白日志 } from '../utils/dialogueLogNormalizer';
import { 提取酒馆静态HTML, 清洗酒馆静态HTML } from '../utils/tavernStaticHtml';

describe('酒馆静态 HTML 清洗', () => {
    it('保留安全的结构标签与内联样式', () => {
        const html = '<section><details><summary>摘要</summary><span style="color: red; font-weight: 700">内容</span></details></section>';

        const result = 清洗酒馆静态HTML(html);

        expect(result).toContain('<section>');
        expect(result).toContain('<details>');
        expect(result).toContain('<summary>摘要</summary>');
        expect(result).toContain('color: red');
        expect(result).toContain('内容');
    });

    it('移除脚本、嵌入资源、表单、事件处理器和 URL 属性', () => {
        const html = [
            '<section onclick="alert(1)">',
            '<script>alert(1)</script>',
            '<iframe src="https://example.com/frame"></iframe>',
            '<form action="https://example.com"><input name="x"></form>',
            '<img src="https://example.com/image.png">',
            '<a href="https://example.com">安全文本</a>',
            '</section>'
        ].join('');

        const result = 清洗酒馆静态HTML(html);

        expect(result).toContain('安全文本');
        expect(result).not.toMatch(/script|iframe|form|input|img/i);
        expect(result).not.toMatch(/onclick|href|src|action/i);
        expect(result).not.toContain('alert(1)');
    });

    it('移除 CSS 中的联网和旧式执行能力', () => {
        const html = [
            '<style>@import url("https://example.com/a.css"); .safe { color: red; } .bad { background: url(https://example.com/a.png); behavior: url(x.htc); }</style>',
            '<div style="color: blue; background-image: image-set(url(https://example.com/a.png) 1x); -moz-binding: url(x.xml#x); expression(alert(1))">内容</div>'
        ].join('');

        const result = 清洗酒馆静态HTML(html);

        expect(result).toContain('color: red');
        expect(result).toContain('color: blue');
        expect(result).not.toMatch(/@import|image-set|url\s*\(|expression\s*\(|behavior\s*:|-moz-binding/i);
    });

    it('移除可脱离渲染容器覆盖宿主页面的固定定位', () => {
        const result = 清洗酒馆静态HTML('<style>.overlay { position: fixed; inset: 0; z-index: 999999; color: red; }</style><div class="overlay">内容</div>');

        expect(result).toContain('color: red');
        expect(result).not.toMatch(/position\s*:\s*fixed|z-index\s*:/i);
    });

    it('拒绝可用于混淆危险 CSS 关键字的转义声明', () => {
        const result = 清洗酒馆静态HTML('<style>.bad { background: u\\72l(https://example.com/a.png); position: f\\69xed; z-\\69ndex: 9; color: red; }</style><div class="bad">内容</div>');

        expect(result).toContain('color: red');
        expect(result).not.toContain('\\72');
        expect(result).not.toContain('\\69');
    });

    it('解码并移除位于声明块外的转义 import', () => {
        const result = 清洗酒馆静态HTML('<style>@im\\70ort "https://example.com/x.css"; .safe { color: red; }</style><div class="safe">内容</div>');

        expect(result).toContain('color: red');
        expect(result).not.toContain('example.com');
        expect(result).not.toMatch(/@import|@im\\70ort/i);
    });

    it('移除使用 CSS 注释分隔关键字的 import', () => {
        const result = 清洗酒馆静态HTML('<style>@import/**/"https://example.com/x.css"; .safe { color: red; }</style><div class="safe">内容</div>');

        expect(result).toContain('color: red');
        expect(result).not.toContain('example.com');
        expect(result).not.toContain('@import');
    });
});

describe('酒馆静态 HTML 提取', () => {
    it('提取 html 代码块并保留其余正文', () => {
        const source = [
            '【旁白】夜色落下。',
            '```html',
            '<section><strong>状态栏</strong></section>',
            '```',
            '【林夏】我们出发吧。'
        ].join('\n');

        expect(提取酒馆静态HTML(source)).toEqual({
            text: '【旁白】夜色落下。\n【林夏】我们出发吧。',
            htmlContent: '<section><strong>状态栏</strong></section>'
        });
    });

    it('提取未包裹代码块的直接静态 HTML', () => {
        expect(提取酒馆静态HTML('<style>.card { color: red; }</style><details class="card"><summary>展开</summary><p>内容</p></details>')).toEqual({
            text: '',
            htmlContent: '<style>.card { color: red }</style><details class="card"><summary>展开</summary><p>内容</p></details>'
        });
    });

    it('对白规范化不会丢失已清洗的静态 HTML 字段', () => {
        expect(规范化可渲染对白日志([{
            sender: '旁白',
            text: '状态栏',
            htmlRenderMode: 'purify',
            htmlContent: '<section>状态栏</section>'
        }])).toEqual([{
            sender: '旁白',
            text: '状态栏',
            htmlRenderMode: 'purify',
            htmlContent: '<section>状态栏</section>'
        }]);
    });
});
