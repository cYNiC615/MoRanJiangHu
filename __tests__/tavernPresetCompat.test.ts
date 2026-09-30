import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { 内置酒馆预设列表 } from '../data/bundledTavernPresets';
import { 规范化酒馆预设 } from '../utils/tavernPreset';

const 构建最小预设 = (regexScripts: any[]) => ({
    prompts: [
        { identifier: 'main', role: 'system', content: 'main' }
    ],
    prompt_order: [
        {
            character_id: 100001,
            order: [{ identifier: 'main', enabled: true }]
        }
    ],
    extensions: {
        regex_scripts: regexScripts
    }
});

describe('酒馆预设安全兼容元数据', () => {
    it('同时注册 Izumi 0503 和 0623，并可安全规范化新版预设', () => {
        expect(内置酒馆预设列表.map(item => item.id)).toEqual(expect.arrayContaining([
            'builtin_izumi_0503',
            'builtin_izumi_0623'
        ]));
        const entry = 内置酒馆预设列表.find(item => item.id === 'builtin_izumi_0623');
        expect(entry?.path).toBe('/tavern-presets/izumi-0623.json');
        const raw = JSON.parse(readFileSync(resolve(process.cwd(), 'public/tavern-presets/izumi-0623.json'), 'utf8'));
        const normalized = 规范化酒馆预设(raw);
        expect(normalized?.prompts.length).toBeGreaterThan(0);
        expect(normalized?.兼容性?.正则脚本总数).toBeGreaterThan(0);
    });

    it('normalizes every bundled preset and recognizes the Double Journey native option script', () => {
        for (const entry of 内置酒馆预设列表) {
            const raw = JSON.parse(readFileSync(resolve(process.cwd(), `public${entry.path}`), 'utf8'));
            expect(规范化酒馆预设(raw)?.prompts.length, entry.id).toBeGreaterThan(0);
        }
        const raw = JSON.parse(readFileSync(resolve(process.cwd(), 'public/tavern-presets/double-journey-v11.json'), 'utf8'));
        const scripts = 规范化酒馆预设(raw)?.兼容性?.已分类脚本列表 || [];
        expect(scripts.some(item => item.safetyType === 'option-render' && !item.script.disabled)).toBe(true);
    });

    it('保留 regex extensions 并区分安全清理、静态 HTML 与阻止脚本', () => {
        const preset = 规范化酒馆预设(构建最小预设([
            {
                id: 'clean',
                scriptName: '纯文本清理',
                findRegex: '/foo/g',
                replaceString: 'bar',
                placement: [2]
            },
            {
                id: 'html',
                scriptName: '静态摘要卡',
                findRegex: '/<summary>([\\s\\S]*?)<\\/summary>/g',
                replaceString: '<section class="summary-card">$1</section>',
                placement: [2]
            },
            {
                id: 'script',
                scriptName: '脚本卡片',
                findRegex: '/foo/g',
                replaceString: '<script>document.body.textContent = "bad"</script>',
                placement: [2]
            },
            {
                id: 'remote',
                scriptName: '远端图片',
                findRegex: '/foo/g',
                replaceString: '<img src="https://example.com/pixel.png">',
                placement: [2]
            }
        ]));

        expect((preset as any)?.extensions?.regex_scripts).toHaveLength(4);
        expect((preset as any)?.兼容性).toMatchObject({
            正则脚本总数: 4,
            安全清理脚本数: 1,
            HTML美化脚本数: 1,
            阻止脚本数: 2
        });
        expect((preset as any)?.兼容性?.已分类脚本列表.map((item: any) => item.safetyType)).toEqual([
            'safe-cleanup',
            'html-beautify',
            'blocked',
            'blocked'
        ]);
    });

    it('识别选项渲染脚本但不把它归入可直接执行的清理脚本', () => {
        const preset = 规范化酒馆预设(构建最小预设([
            {
                id: 'options',
                scriptName: '选项栏',
                findRegex: '/<options>([\\s\\S]*?)<\\/options>/g',
                replaceString: '<div class="option-list" data-option-text="$1"></div>',
                placement: [2]
            }
        ]));

        expect((preset as any)?.兼容性).toMatchObject({
            正则脚本总数: 1,
            安全清理脚本数: 0,
            选项渲染脚本数: 1,
            HTML美化脚本数: 0,
            阻止脚本数: 0
        });
        expect((preset as any)?.兼容性?.已分类脚本列表[0]?.safetyType).toBe('option-render');
    });

    it('选项替换串即使带交互脚本也只用于原生捕获组提取', () => {
        const preset = 规范化酒馆预设(构建最小预设([{
            id: 'interactive-options',
            scriptName: '选项栏',
            findRegex: '/<options>\\s*>选项一：([^<]+)<\\/options>/g',
            replaceString: '<div data-option-text="$1"><a href="javascript:void(0)">$1</a><script>window.parent.postMessage($1)</script></div>',
            placement: [2]
        }]));

        expect((preset as any)?.兼容性).toMatchObject({
            选项渲染脚本数: 1,
            阻止脚本数: 0
        });
        expect((preset as any)?.兼容性?.已分类脚本列表[0]?.safetyType).toBe('option-render');
    });
});
