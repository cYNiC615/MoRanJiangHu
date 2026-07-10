import DOMPurify from 'dompurify';

const 允许标签 = new Set([
    'article', 'aside', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup',
    'dd', 'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'kbd', 'li', 'main',
    'mark', 'nav', 'ol', 'p', 'pre', 's', 'section', 'small', 'span', 'strong',
    'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
    'thead', 'tr', 'u', 'ul'
]);

const 禁止标签 = [
    'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'button',
    'select', 'option', 'textarea', 'img', 'svg', 'math', 'canvas', 'video',
    'audio', 'source', 'track', 'link', 'meta', 'base', 'template'
];

const 允许属性 = new Set([
    'aria-label', 'aria-hidden', 'class', 'colspan', 'data-label', 'id', 'open',
    'role', 'rowspan', 'style', 'title'
]);

const CSS危险能力正则 = /(?:url\s*\(|image-set\s*\(|@import\b|expression\s*\(|behavior\s*:|-moz-binding\s*:|position\s*:\s*fixed\b|z-index\s*:)/i;

const 解码CSS转义 = (css: string): string => String(css || '')
    .replace(/\\([0-9a-f]{1,6})(?:\r\n|[ \n\r\t\f])?/gi, (_match, hex: string) => {
        const codePoint = Number.parseInt(hex, 16);
        return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '\uFFFD';
    })
    .replace(/\\(?:\r\n|[\n\r\f])/g, '')
    .replace(/\\([^\n\r\f])/g, '$1');

const 规范化CSS词法 = (css: string): string => 解码CSS转义(css)
    .replace(/\/\*[\s\S]*?\*\//g, '');

const 清洗CSS声明 = (css: string): string => 规范化CSS词法(css)
    .split(';')
    .map(item => item.trim())
    .filter(item => item && !item.includes('\\') && !CSS危险能力正则.test(item))
    .join('; ');

const 清洗样式块 = (css: string): string => {
    const withoutImports = 规范化CSS词法(css).replace(/@import\b[^;{}]*(?:;|$)/gi, '');
    return withoutImports.replace(/([^{}]+)\{([^{}]*)\}/g, (_match, selector: string, declarations: string) => {
        const safeDeclarations = 清洗CSS声明(declarations);
        return safeDeclarations ? `${selector.trim()} { ${safeDeclarations} }` : '';
    });
};

const 移除危险标签 = (html: string): string => {
    let result = html;
    for (const tag of 禁止标签) {
        result = result
            .replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '')
            .replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
    }
    return result;
};

const 保守清洗HTML = (html: string): string => {
    const withoutDangerousTags = 移除危险标签(String(html || ''));
    const withoutUnknownTags = withoutDangerousTags.replace(/<\/?([a-z][\w:-]*)\b[^>]*>/gi, (tag, rawName: string) => (
        允许标签.has(rawName.toLowerCase()) ? tag : ''
    ));
    const withoutUnsafeAttributes = withoutUnknownTags.replace(/<([a-z][\w:-]*)(\s[^<>]*?)?>/gi, (_tag, rawName: string, rawAttrs = '') => {
        const name = rawName.toLowerCase();
        if (!允许标签.has(name)) return '';
        const attrs: string[] = [];
        const attributeRegex = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let match: RegExpExecArray | null = null;
        while ((match = attributeRegex.exec(rawAttrs)) !== null) {
            const attrName = match[1].toLowerCase();
            if (!允许属性.has(attrName)) continue;
            let value = match[2] ?? match[3] ?? match[4] ?? '';
            if (attrName === 'style') value = 清洗CSS声明(value);
            if (!value && attrName !== 'open') continue;
            attrs.push(value ? `${attrName}="${value.replace(/"/g, '&quot;')}"` : attrName);
        }
        return `<${name}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`;
    });
    return withoutUnsafeAttributes
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_match, css: string) => {
            const safeCss = 清洗样式块(css);
            return safeCss ? `<style>${safeCss}</style>` : '';
        })
        .trim();
};

export const 清洗酒馆静态HTML = (html: string): string => {
    const source = String(html || '').trim();
    if (!source) return '';

    const purifier = DOMPurify as typeof DOMPurify & { sanitize?: (dirty: string, config?: Record<string, unknown>) => string };
    const structurallySanitized = typeof purifier.sanitize === 'function'
        ? String(purifier.sanitize(source, {
            ALLOWED_TAGS: [...允许标签],
            ALLOWED_ATTR: [...允许属性],
            ALLOW_DATA_ATTR: false,
            FORBID_TAGS: 禁止标签,
            FORBID_ATTR: ['action', 'formaction', 'href', 'poster', 'src', 'srcset', 'xlink:href']
        }))
        : source;

    return 保守清洗HTML(structurallySanitized);
};

export interface 酒馆静态HTML提取结果 {
    text: string;
    htmlContent?: string;
}

export const 提取酒馆静态HTML = (value: string): 酒馆静态HTML提取结果 => {
    const htmlBlocks: string[] = [];
    let text = String(value || '')
        .replace(/```(?:html)?\s*\n([\s\S]*?)```/gi, (match, html: string) => {
            if (!/<(?:style|article|aside|blockquote|details|div|section|span|table|htmlcontent)\b/i.test(html)) return match;
            const sanitized = 清洗酒馆静态HTML(html);
            if (sanitized) htmlBlocks.push(sanitized);
            return '';
        })
        .replace(/\n{2,}/g, '\n')
        .trim();
    if (/<(?:style|article|aside|blockquote|details|div|section|span|table|htmlcontent)\b/i.test(text)) {
        const sanitized = 清洗酒馆静态HTML(text);
        if (sanitized) {
            htmlBlocks.push(sanitized);
            text = '';
        }
    }
    const htmlContent = htmlBlocks.join('\n').trim();
    return htmlContent ? { text, htmlContent } : { text };
};
