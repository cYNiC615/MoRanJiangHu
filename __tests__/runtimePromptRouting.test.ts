import { describe, expect, it } from 'vitest';
import type { 提示词结构 } from '../types';
import { 构建世界观生成消息链 } from '../prompts/runtime/worldGeneration';
import { 获取世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../prompts/runtime/worldGenerationCot';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词, 构建世界观难度摘要 } from '../prompts/runtime/worldSetup';
import { 构建开局配置提示词 } from '../prompts/runtime/openingConfig';
import { 构建主剧情难度摘要提示词 } from '../prompts/runtime/promptOwnership';
import { 默认提示词 } from '../prompts';
import { 构建开局世界观生成提示词预览 } from '../utils/worldGenerationPromptPreview';
import { 裁剪成长体系上下文数据 } from '../utils/promptFeatureToggles';
import { 规范化导演配置, 构建世界生成导演种子弱约束提示词 } from '../utils/directorConfig';

const 现代开局配置 = { 题材模式: '现代都市' } as any;
const 现代世界配置 = {
    worldName: '镜湖市',
    worldSize: '弹丸之地',
    dynastySetting: '现代城市由大学城、社区、写字楼、医院、媒体和治安系统构成，现实压力与城市机会共同推进剧情。',
    sectDensity: '稀少',
    tianjiaoSetting: '优势来自学历、技能、人脉、信息差、资金调度和心理韧性。',
    difficulty: 'normal',
    worldExtraRequirement: ''
} as any;
const 测试角色 = {
    姓名: '沈砚',
    性别: '男',
    年龄: 22,
    出生日期: '',
    外貌: '',
    性格: '',
    力量: 5,
    敏捷: 5,
    体质: 5,
    根骨: 5,
    悟性: 5,
    福源: 5,
    天赋列表: [],
    出身背景: {}
} as any;

const 计数 = (source: string, needle: string): number => (
    source.split(needle).length - 1
);

const 构建现代世界观请求文本 = (options?: { directorSeedPrompt?: string }): string => {
    const seed = 构建世界观种子提示词(现代世界配置, 测试角色, 现代开局配置);
    const difficultySummary = 构建世界观难度摘要([
        {
            id: 'diff_game_normal',
            类型: '难度设定',
            标题: '游戏难度 正常',
            启用: true,
            内容: '<游戏难度协议>\n定位: 标准资源压力与失败代价。\n</游戏难度协议>'
        },
        {
            id: 'diff_check_normal',
            类型: '难度设定',
            标题: '判定难度 正常',
            启用: true,
            内容: '<判定难度协议>\n定位: 标准判定窗口。\n</判定难度协议>'
        },
        {
            id: 'diff_phys_normal',
            类型: '难度设定',
            标题: '生理难度 正常',
            启用: true,
            内容: '<生理难度协议>\n定位: 标准恢复压力。\n</生理难度协议>'
        }
    ] as any);
    const context = 构建世界生成任务上下文提示词(
        seed,
        'normal',
        difficultySummary,
        '',
        现代开局配置,
        options?.directorSeedPrompt || ''
    );
    const messages = 构建世界观生成消息链({
        worldContext: context,
        charData: 测试角色,
        extraPrompt: 获取世界观生成COT提示词(现代开局配置),
        cotPseudoHistoryPrompt: 世界观生成COT伪装历史消息提示词,
        config: { 生成世界基底: true, openingConfig: 现代开局配置 },
        openingConfig: 现代开局配置
    });
    return messages.map((message) => message.content).join('\n');
};

describe('runtime prompt routing and context filtering', () => {
    it('现代世界观生成 payload 只注入一份 COT，且不注入完整难度协议', () => {
        const payload = 构建现代世界观请求文本();

        expect(计数(payload, '<世界观生成思考协议>')).toBe(1);
        expect(payload).not.toContain('<游戏难度协议>');
        expect(payload).not.toContain('<判定难度协议>');
        expect(payload).not.toContain('<生理难度协议>');
        expect(payload).toContain('【当前世界观生成难度摘要】');
    });

    it('难度摘要按开关过滤生理难度，并忽略禁用条目', () => {
        const promptPool: 提示词结构[] = [
            { id: 'diff_game_normal', 类型: '难度设定', 标题: '游戏难度', 启用: true, 内容: '定位: game-risk-marker' },
            { id: 'diff_check_normal', 类型: '难度设定', 标题: '判定难度', 启用: false, 内容: '定位: disabled-check-marker' },
            { id: 'diff_phys_normal', 类型: '难度设定', 标题: '生理难度', 启用: true, 内容: '定位: recovery-pressure-marker' }
        ];
        const disabled = 构建主剧情难度摘要提示词(promptPool, {
            gameConfig: { 启用饱腹口渴系统: false }
        });
        const enabled = 构建主剧情难度摘要提示词(promptPool, {
            gameConfig: { 启用饱腹口渴系统: true }
        });

        expect(disabled).toContain('game-risk-marker');
        expect(disabled).not.toContain('disabled-check-marker');
        expect(disabled).not.toContain('recovery-pressure-marker');
        expect(enabled).toContain('recovery-pressure-marker');
        expect(enabled).not.toContain('disabled-check-marker');
    });

    it('初始世界生成可注入导演和未转正种子弱约束，但禁止当作世界观事实输出', () => {
        const config = 规范化导演配置({
            玩家剧情倾向: '慢热合租与校园关系，不急着进入主线大事件。',
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友，表面疏离但会被长期照顾打动。',
                完整设定: '新闻系研究生，家庭债务压力很重。',
                关系入口标签: ['合租', '校园'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        } as any);
        const weakPrompt = 构建世界生成导演种子弱约束提示词(config);
        const payload = 构建现代世界观请求文本({ directorSeedPrompt: weakPrompt });

        expect(weakPrompt).toContain('慢热合租与校园关系');
        expect(weakPrompt).toContain('角色种子ID：seed-roommate');
        expect(weakPrompt).not.toContain('家庭债务压力很重');
        expect(payload).toContain('角色种子ID：seed-roommate');
        expect(payload).not.toContain('家庭债务压力很重');
    });

    it('世界观提示词预览与真实请求共享同一份 COT 和消息拼装规则', () => {
        const payload = 构建现代世界观请求文本();
        const preview = 构建开局世界观生成提示词预览({
            worldConfig: 现代世界配置,
            charData: 测试角色,
            openingConfig: 现代开局配置,
            gameConfig: {},
            prompts: []
        });

        expect(计数(preview, '<世界观生成思考协议>')).toBe(1);
        expect(preview).toContain('【当前世界观生成难度摘要】');
        expect(preview).not.toContain('【额外要求提示词】');
        expect(preview).not.toContain('<游戏难度协议>');
        expect(preview).toContain(获取世界观生成COT提示词(现代开局配置));
        expect(payload).toContain(获取世界观生成COT提示词(现代开局配置));
    });

    it('世界观提示词预览与真实请求同样注入导演种子弱约束', () => {
        const 导演配置 = 规范化导演配置({
            玩家剧情倾向: '慢热合租与校园关系，不急着进入主线大事件。',
            角色种子定义: [{
                id: 'seed-roommate',
                名称: '林知夏',
                性别: '女',
                是否启用: true,
                入口摘要: '合租室友，表面疏离但会被长期照顾打动。',
                完整设定: '新闻系研究生，家庭债务压力很重。',
                关系入口标签: ['合租', '校园'],
                默认发展方向: '红颜/后宫对象'
            }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        } as any);
        const openingConfig = { ...现代开局配置, 导演配置 } as any;
        const weakPrompt = 构建世界生成导演种子弱约束提示词(导演配置);
        const seed = 构建世界观种子提示词(现代世界配置, 测试角色, openingConfig);
        const context = 构建世界生成任务上下文提示词(
            seed,
            'normal',
            构建世界观难度摘要(默认提示词),
            '',
            openingConfig,
            weakPrompt
        );
        const payload = 构建世界观生成消息链({
            worldContext: context,
            charData: 测试角色,
            extraPrompt: 获取世界观生成COT提示词(openingConfig),
            cotPseudoHistoryPrompt: 世界观生成COT伪装历史消息提示词,
            config: { 生成世界基底: true, openingConfig },
            openingConfig
        }).map((message) => message.content).join('\n');
        const preview = 构建开局世界观生成提示词预览({
            worldConfig: 现代世界配置,
            charData: 测试角色,
            openingConfig,
            gameConfig: {},
            prompts: 默认提示词
        });

        expect(payload).toContain('角色种子ID：seed-roommate');
        expect(preview).toContain('角色种子ID：seed-roommate');
        expect(payload).not.toContain('家庭债务压力很重');
        expect(preview).not.toContain('家庭债务压力很重');
    });

    it('现代默认上下文投影会裁剪旧成长体系字段', () => {
        const trimmed = 裁剪成长体系上下文数据({
            角色: {
                姓名: '沈砚',
                境界: '开脉境',
                境界层级: 1,
                当前内力: 20,
                最大内力: 30,
                修炼体系: '旧武侠'
            },
            社交: [{
                姓名: '林知夏',
                境界: '凡人',
                当前内力: 0
            }],
            任务列表: [{
                标题: '调查',
                推荐境界: '炼气'
            }]
        } as any, { 启用成长体系: false } as any);

        expect(trimmed).toEqual({
            角色: { 姓名: '沈砚' },
            社交: [{ 姓名: '林知夏' }],
            任务列表: [{ 标题: '调查' }]
        });
    });

    it('现代开局配置将输入的旧关系和切入标签映射为当前题材标签', () => {
        const prompt = 构建开局配置提示词({
            配置约束启用: true,
            题材模式: '现代都市',
            初始关系模板: '独行少系',
            关系侧重: ['师门', '利益'],
            开局切入偏好: '门派起手',
            开局生成组织: false,
            开局生成成员: false,
            允许生成性别: ['男', '女', '男娘', '扶她'],
            生成性别锁定: false,
            初始伙伴: { enabled: false }
        } as any);

        expect(prompt).toContain('开局切入偏好：组织起手');
        expect(prompt).toContain('关系侧重：职场、合作');
    });

});
