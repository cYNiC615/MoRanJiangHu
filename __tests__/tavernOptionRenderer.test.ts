import { describe, expect, it } from 'vitest';
import type { 酒馆正则脚本分类条目 } from '../models/system';
import { 提取酒馆选项, 推进零长度酒馆正则游标 } from '../utils/tavernOptionRenderer';
import { parseStoryRawText } from '../services/ai/storyResponseParser';

describe('酒馆原生选项提取', () => {
    it('keeps all ten lettered options without interpreting category labels as executable UI', () => {
        const lines = Array.from({ length: 10 }, (_, index) => `${String.fromCharCode(65 + index)}.[路线] 行动${index + 1}`);
        expect(提取酒馆选项(`<options>\n${lines.join('\n')}\n</options>`, [])).toEqual(lines.map(line => line.slice(2)));
        const response = parseStoryRawText(`<正文>【旁白】测试正文。</正文><短期记忆>记忆</短期记忆><options>\n${lines.join('\n')}\n</options>`);
        expect(response.action_options).toEqual(lines.map(line => line.slice(2)));
    });
    it('全局零长度匹配会主动推进游标', () => {
        const regex = /(?:)/g;
        const match = regex.exec('abc');
        expect(match?.[0]).toBe('');
        expect(regex.lastIndex).toBe(0);

        推进零长度酒馆正则游标(regex, match as RegExpExecArray);

        expect(regex.lastIndex).toBe(1);
    });

    it('从 options 标签中提取中英文选项并去重', () => {
        const text = [
            '<options>',
            '>选项一：谨慎观察',
            '> Option 2: 主动前进',
            '>选择三：谨慎观察',
            '</options>'
        ].join('\n');

        expect(提取酒馆选项(text, [])).toEqual(['谨慎观察', '主动前进']);
    });

    it('可使用 option-render 脚本的匹配范围提取无标签选项', () => {
        const scripts: 酒馆正则脚本分类条目[] = [{
            safetyType: 'option-render',
            script: {
                id: 'options',
                scriptName: '选项栏',
                findRegex: '/BEGIN_OPTIONS([\\s\\S]*?)END_OPTIONS/g',
                replaceString: '<div class="option-list"></div>',
                placement: [2],
                disabled: false,
                markdownOnly: false,
                promptOnly: false,
                runOnEdit: false,
                minDepth: -1,
                maxDepth: 0
            }
        }];

        expect(提取酒馆选项('BEGIN_OPTIONS\n1. 留在原地\n2. 推门查看\nEND_OPTIONS', scripts)).toEqual([
            '留在原地',
            '推门查看'
        ]);
    });
});
