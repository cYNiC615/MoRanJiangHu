import { describe, expect, it } from 'vitest';
import { 获取世界观生成系统提示词, 构建世界观生成消息链 } from '../prompts/runtime/worldGeneration';
import { 获取世界观生成COT提示词, 世界观生成COT伪装历史消息提示词 } from '../prompts/runtime/worldGenerationCot';
import { 构建世界观种子提示词, 构建世界生成任务上下文提示词, 构建世界观难度摘要 } from '../prompts/runtime/worldSetup';
import { 开局变量生成附加提示词 } from '../prompts/runtime/openingVariableGenerationInit';
import { 开局世界演变初始化附加提示词 } from '../prompts/runtime/openingWorldEvolutionInit';
import { 开场初始化任务提示词 } from '../prompts/runtime/opening';
import { 构建变量模型职责提示词 } from '../prompts/runtime/variableModel';
import { 构建世界演变系统提示词 } from '../prompts/runtime/worldEvolution';
import { 世界数据结构参考 } from '../prompts/runtime/worldDataSchema';
import { 数值_世界演化 } from '../prompts/stats/world';
import { 构建开局世界观生成提示词预览 } from '../utils/worldGenerationPromptPreview';

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

const 构建现代世界观请求文本 = (): string => {
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
        现代开局配置
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

describe('modern urban prompt guardrails', () => {
    it('现代默认 prompt 不强制生成势力数量或每轮势力互动', () => {
        const combined = [
            获取世界观生成系统提示词({ topicMode: '现代都市', 生成世界基底: true } as any),
            构建世界观种子提示词({
                worldName: '镜湖市',
                worldSize: '单城',
                dynastySetting: '现代城市',
                sectDensity: '低',
                tianjiaoSetting: '现实资源与心理韧性',
                difficulty: 'normal',
                worldExtraRequirement: ''
            } as any, {
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
            } as any, { 题材模式: '现代都市' } as any),
            开局变量生成附加提示词,
            开局世界演变初始化附加提示词,
            开场初始化任务提示词,
            构建变量模型职责提示词(),
            构建世界演变系统提示词({ topicMode: '现代都市' } as any),
            世界数据结构参考,
            数值_世界演化.内容
        ].join('\n');

        expect(combined).not.toMatch(/生成\s*5-15\s*个势力/u);
        expect(combined).not.toContain('必须保证 `世界.势力列表` 不为空');
        expect(combined).not.toContain('每次世界演化至少产生 1 个势力互动事件');
        expect(combined).toContain('"势力列表": []');
        expect(combined).not.toContain('"势力列表": [\n      {"ID":"FCT-001"');
        expect(combined).toContain('没有明确组织行动或势力结构时，允许 `世界.势力列表` 为空');
        expect(combined).toMatch(/学校|公司|社团|利益集团/u);
        expect(combined).toContain('主线不是短待办');
        expect(combined).toContain('角色种子ID');
    });

    it('现代世界观生成 payload 只注入一份 COT，且不注入完整难度协议', () => {
        const payload = 构建现代世界观请求文本();

        expect(计数(payload, '<世界观生成思考协议>')).toBe(1);
        expect(payload).not.toContain('<游戏难度协议>');
        expect(payload).not.toContain('<判定难度协议>');
        expect(payload).not.toContain('<生理难度协议>');
        expect(payload).toContain('【当前世界观生成难度摘要】');
    });

    it('现代世界观生成 payload 不携带旧武侠默认触发词', () => {
        const payload = 构建现代世界观请求文本();

        expect(payload).not.toMatch(/WuXia|武侠口径|江湖叙事|门派|宗门|朝廷|诸天万界|九州/u);
        expect(payload).toMatch(/城市制度|职业压力|家庭关系|现实资源|组织\/圈层|法律后果/u);
    });

    it('显式武侠题材仍保留武侠世界观能力，不受现代禁词断言约束', () => {
        const systemPrompt = 获取世界观生成系统提示词(
            { 生成世界基底: true } as any,
            { 题材模式: '武侠' } as any
        );

        expect(systemPrompt).toMatch(/武侠|江湖|门派/u);
    });

    it('开局与变量 prompt 明确普通现代随身物不进背包，并保留可追踪例外', () => {
        const combined = [
            开场初始化任务提示词,
            开局变量生成附加提示词,
            构建变量模型职责提示词()
        ].join('\n');

        expect(combined).toContain('普通手机、钱包、银行卡、钥匙、笔记本电脑、普通衣物');
        expect(combined).toContain('默认只作为生活背景');
        expect(combined).toContain('不得写入 `角色.物品列表` 或装备栏');
        expect(combined).toMatch(/剧情证据|任务道具|工作配发|加密数据|损坏状态|可交付物|明确金额现金/u);
        expect(combined).toContain('角色.金钱.baseAmount');
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
});
