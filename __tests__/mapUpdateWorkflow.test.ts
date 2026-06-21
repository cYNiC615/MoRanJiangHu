import { describe, expect, it } from 'vitest';
import {
    解析地图自动更新命令,
    构建地图层级替换结果,
    构建地图更新用户提示词,
    判定地图自动更新需求
} from '../hooks/useGame/mapUpdateWorkflow';

describe('地图自动更新解析', () => {
    it('兼容模型返回思考块加地点树 JSON 的全量同步格式', () => {
        const currentWorld = {
            地图层级: [
                { ID: 'DT-001', 名称: '主神空间', 层级: '寰宇', 父级ID: '', 描述: '旧描述' },
                { ID: 'DT-002', 名称: '主神广场', 层级: '大地点', 父级ID: 'DT-001', 描述: '旧描述' }
            ]
        };
        const rawText = [
            '<思考>',
            '本回合新增任务世界、封门村与东偏厅，需要同步地点树。',
            '</思考>',
            JSON.stringify({
                地点树: [
                    { 名称: '主神空间', 层级: '寰宇', 父级ID: '', 描述: '一切轮回的起点。' },
                    { 名称: '主神广场', 层级: '大地点', 父级ID: '主神空间', 描述: '主神光球所在广场。' },
                    { 名称: '任务世界<荒怨>', 层级: '大地点', 父级ID: '主神空间', 描述: '充满诡异气息的任务世界。' },
                    { 名称: '封门村区域', 层级: '中地点', 父级ID: '任务世界<荒怨>', 描述: '被雾气笼罩的荒野区域。' },
                    { 名称: '封门村', 层级: '小地点', 父级ID: '封门村区域', 描述: '死寂的诡异村落。' },
                    { 名称: '荒废古宅', 层级: '区地点', 父级ID: '封门村', 描述: '民国风破败老宅。' },
                    { 名称: '东偏厅', 层级: '子地点', 父级ID: '荒废古宅', 描述: '光线昏暗的偏厅。' }
                ]
            }, null, 2)
        ].join('\n');

        const commands = 解析地图自动更新命令(rawText, currentWorld);

        expect(commands).toHaveLength(1);
        expect(commands[0]).toMatchObject({
            action: 'set',
            key: '世界.地图层级'
        });
        expect(commands[0].value).toEqual(expect.arrayContaining([
            expect.objectContaining({ ID: 'DT-001', 名称: '主神空间', 层级: '寰宇' }),
            expect.objectContaining({ ID: 'DT-002', 名称: '主神广场', 层级: '大地点', 父级ID: 'DT-001' }),
            expect.objectContaining({ 名称: '东偏厅', 层级: '子地点' })
        ]));
    });

    it('push 命令不保留「在场人物」字段（人物显示由社交 NPC 位置驱动）', () => {
        const currentWorld = { 地图层级: [] };
        const rawText = [
            '<命令>',
            'push 世界.地图层级 = {"名称":"队伍房间","层级":"小地点","父级ID":"DT-001","描述":"小队驻地。","在场人物":["杨培强"]}',
            '</命令>'
        ].join('\n');
        const commands = 解析地图自动更新命令(rawText, currentWorld);
        expect(commands).toHaveLength(1);
        expect(commands[0].value).toMatchObject({ 名称: '队伍房间', 层级: '小地点' });
        // 方案 A：地图层级节点不应携带「在场人物」字段
        expect(commands[0].value).not.toHaveProperty('在场人物');
    });
});

describe('构建地图层级替换结果 — 不保留「在场人物」', () => {
    it('即便输入节点带「在场人物」，结果节点也不携带该字段', () => {
        const rawNodes = [
            { 名称: '主神空间', 层级: '寰宇', 父级ID: '', 描述: '', 在场人物: [] },
            { 名称: '队伍房间', 层级: '小地点', 父级ID: '主神空间', 描述: '', 在场人物: ['杨培强', '俞月荷'] }
        ];
        const result = 构建地图层级替换结果(rawNodes);
        const room = result.find(r => r.名称 === '队伍房间');
        expect(room).toBeDefined();
        expect(room.层级).toBe('小地点');
        // 方案 A：地图层级节点不应携带「在场人物」字段，人物显示走社交 NPC 位置链路
        expect(room).not.toHaveProperty('在场人物');
    });

    it('势力标签等地点属性仍正常保留', () => {
        const rawNodes = [
            { 名称: '诸天万界', 层级: '寰宇', 父级ID: '', 描述: '' },
            { 名称: '悦来客栈', 层级: '区地点', 父级ID: '诸天万界', 描述: '客栈。', 控制势力: '商会', 势力标签: ['商会', '帮会'] }
        ];
        const result = 构建地图层级替换结果(rawNodes);
        const inn = result.find(r => r.名称 === '悦来客栈');
        expect(inn).toBeDefined();
        expect(inn.控制势力).toBe('商会');
        expect(inn.势力标签).toEqual(['商会', '帮会']);
        expect(inn).not.toHaveProperty('在场人物');
    });

    it('现代自动更新提示词不再携带旧武侠地图母板', () => {
        const prompt = 构建地图更新用户提示词({
            mode: 'auto_incremental',
            环境: { 大地点: '镜湖市', 中地点: '大学城', 小地点: '合租公寓', 具体地点: '客厅' },
            世界: { 地图层级: [{ ID: 'DT-001', 名称: '现实世界', 层级: '寰宇', 父级ID: '' }] },
            currentResponse: { logs: [{ sender: '旁白', text: '他在客厅喝水，没有去新地点。' }] } as any
        });

        expect(prompt).not.toMatch(/诸天万界|九州大陆|洛阳城|华山派|悦来客栈|帮会|门派/u);
        expect(prompt).toMatch(/现实世界|镜湖市|大学城|合租公寓|写字楼|医院|社区|商圈/u);
        expect(prompt).toContain('同父级下名称唯一');
        expect(prompt).toContain('动态位置短语');
    });

    it('同名地点在不同父级下不会被自动更新解析错误合并', () => {
        const currentWorld = {
            地图层级: [
                { ID: 'DT-001', 名称: '现实世界', 层级: '寰宇', 父级ID: '' },
                { ID: 'DT-002', 名称: '镜湖市', 层级: '大地点', 父级ID: 'DT-001' },
                { ID: 'DT-003', 名称: '合租公寓', 层级: '区地点', 父级ID: 'DT-002' },
                { ID: 'DT-004', 名称: '卧室', 层级: '子地点', 父级ID: 'DT-003' },
                { ID: 'DT-005', 名称: '远洲科技', 层级: '区地点', 父级ID: 'DT-002' }
            ]
        };
        const rawText = [
            '<命令>',
            'push 世界.地图层级 = {"名称":"卧室","层级":"子地点","父级ID":"远洲科技","描述":"值班休息室旁的临时卧室。"}',
            '</命令>'
        ].join('\n');

        const commands = 解析地图自动更新命令(rawText, currentWorld);

        expect(commands).toHaveLength(1);
        expect(commands[0].value).toMatchObject({
            名称: '卧室',
            父级ID: 'DT-005'
        });
    });

    it('默认现代日常无稳定新地点时跳过地图模型请求', () => {
        const decision = 判定地图自动更新需求({
            mode: 'auto_incremental',
            环境: { 大地点: '镜湖市', 中地点: '大学城', 小地点: '合租公寓', 具体地点: '客厅' },
            世界: {
                地图层级: [
                    { ID: 'DT-001', 名称: '现实世界', 层级: '寰宇', 父级ID: '' },
                    { ID: 'DT-002', 名称: '镜湖市', 层级: '大地点', 父级ID: 'DT-001' },
                    { ID: 'DT-003', 名称: '大学城', 层级: '中地点', 父级ID: 'DT-002' },
                    { ID: 'DT-004', 名称: '合租公寓', 层级: '区地点', 父级ID: 'DT-003' },
                    { ID: 'DT-005', 名称: '客厅', 层级: '子地点', 父级ID: 'DT-004' }
                ]
            },
            currentResponse: {
                logs: [{ sender: '旁白', text: '他在家教路上给室友发了消息，随后回到客厅。' }]
            } as any
        });

        expect(decision.needed).toBe(false);
        expect(decision.reasons.join('\n')).toContain('无稳定新地点');
    });
});
