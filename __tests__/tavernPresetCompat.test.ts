import { describe, expect, it } from 'vitest';
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
});
