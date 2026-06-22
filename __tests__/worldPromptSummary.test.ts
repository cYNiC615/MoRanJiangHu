import { describe, expect, it } from 'vitest';
import { 核心_世界观摘要 } from '../prompts/core/worldSummary';
import { 构建世界观摘要提示词, 生成世界观确定性摘要 } from '../prompts/runtime/worldSummary';
import { 选择主剧情世界观提示词 } from '../hooks/useGame/systemPromptBuilder';

describe('world prompt summary routing', () => {
    it('defines an independent core_world_summary prompt slot', () => {
        expect(核心_世界观摘要).toMatchObject({
            id: 'core_world_summary',
            标题: '主剧情 · 世界观摘要',
            类型: '核心设定',
            启用: true
        });
    });

    it('builds a summary prompt that preserves unique world facts instead of generic modern filler', () => {
        const prompt = 构建世界观摘要提示词([
            '镜湖市表面是普通大学城，但地下媒体同盟“白塔通讯”控制匿名爆料渠道。',
            '普通现代都市也有通勤、外卖、便利店、手机支付。',
            '失踪案与城南旧医院的封存病历有关。'
        ].join('\n'));

        expect(prompt).toContain('<世界观摘要>');
        expect(prompt).toContain('白塔通讯');
        expect(prompt).toContain('封存病历');
        expect(prompt).toContain('过滤普通现代都市废话');
    });

    it('deterministic fallback summary keeps distinctive factions, rules, conflicts, and bans generic filler', () => {
        const summary = 生成世界观确定性摘要([
            '镜湖市表面是普通大学城，普通居民每天通勤、外卖、刷手机。',
            '地下媒体同盟“白塔通讯”控制匿名爆料渠道，和城南旧医院失踪案有关。',
            '禁忌：任何人不得公开提到“灰雨档案”，否则会被校方与媒体同时封口。',
            '长期冲突：学生记者、医院旧档案、治安系统与资本方互相牵制。'
        ].join('\n'));

        expect(summary).toContain('白塔通讯');
        expect(summary).toContain('灰雨档案');
        expect(summary).toContain('长期冲突');
        expect(summary).not.toContain('每天通勤、外卖、刷手机');
    });

    it('deterministic fallback prioritizes late unique facts over early ordinary city filler', () => {
        const summary = 生成世界观确定性摘要([
            '海川市是一个中型现代城市，普通居民依靠地铁公交通勤。',
            '主流支付方式是微信、支付宝和银行卡转账。',
            '城市里有便利店、写字楼、学校、社区医院和普通小区。',
            '普通白领、实习生、兼职者每天面对租金、外卖和交通开销。',
            '城市生活以手机、招聘App、二手交易群和日常社交平台为主要信息入口。',
            '核心组织：海川理工学院是本地最大知识型人力资源集散地，校企实习合作长期制造廉价劳动力博弈。',
            '铭川实业控制建材供应链和小型商业地产，与高校就业率数据互相牵制。',
            '禁忌：任何人不得公开泄露非正规劳务中介的身份信息库，否则会触发欠薪、合同纠纷和媒体封口链条。',
            '长期冲突：学生实习、社区调解、媒体报道、劳务中介抽成和租房押金纠纷互相传导。'
        ].join('\n'), 420);

        expect(summary).toContain('海川理工学院');
        expect(summary).toContain('铭川实业');
        expect(summary).toContain('非正规劳务中介');
        expect(summary).toContain('长期冲突');
        expect(summary).not.toContain('主流支付方式是微信、支付宝和银行卡转账');
    });

    it('main story world prompt prefers core_world_summary and falls back to full core_world when empty', () => {
        const prompts = [
            { id: 'core_world', 标题: '完整世界观', 类型: '核心设定', 内容: '完整世界观：镜湖市普通现代生活废话很多。', 启用: true },
            { id: 'core_world_summary', 标题: '世界观摘要', 类型: '核心设定', 内容: '摘要：白塔通讯与灰雨档案。', 启用: true }
        ] as any[];

        expect(选择主剧情世界观提示词(prompts)).toEqual({
            content: '摘要：白塔通讯与灰雨档案。',
            source: 'summary'
        });

        expect(选择主剧情世界观提示词([
            { ...prompts[0] },
            { ...prompts[1], 内容: '' }
        ] as any[])).toEqual({
            content: '完整世界观：镜湖市普通现代生活废话很多。',
            source: 'full_fallback'
        });
    });
});
