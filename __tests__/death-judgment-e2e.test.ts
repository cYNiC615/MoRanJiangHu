import { describe, expect, it } from 'vitest';
import { 执行响应命令处理 } from '../hooks/useGame/responseCommandProcessor';
import {
    规范化环境信息,
    规范化社交列表,
    规范化角色物品容器映射
} from '../hooks/useGame/stateTransforms';
import { 请求模型文本, type 通用消息 } from '../services/ai/chatCompletionClient';
import type { 当前可用接口结构 } from '../utils/apiConfig';

const 读取端到端AI配置 = () => {
    const baseUrl = process.env.MORAN_E2E_AI_BASE_URL?.trim();
    const apiKey = process.env.MORAN_E2E_AI_API_KEY?.trim();
    const model = process.env.MORAN_E2E_AI_MODEL?.trim();
    return baseUrl && apiKey && model ? { baseUrl, apiKey, model } : null;
};

const 构建测试用AI配置 = (config: NonNullable<ReturnType<typeof 读取端到端AI配置>>): 当前可用接口结构 => ({
    id: 'e2e-test',
    名称: 'E2E测试接口',
    供应商: 'openai_compatible',
    协议覆盖: 'auto',
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model
});

describe('死亡判定端到端测试', () => {
    const aiConfig = 读取端到端AI配置();

    it('张杰杀怪不应判定张杰死亡', async () => {
        if (!aiConfig) {
            console.log('跳过：未配置 MORAN_E2E_AI_BASE_URL/MORAN_E2E_AI_API_KEY/MORAN_E2E_AI_MODEL');
            return;
        }

        // 模拟张杰和怪物的社交列表
        const socialList = 规范化社交列表([
            {
                id: 'npc_zhang_jie',
                姓名: '张杰',
                性别: '男',
                年龄: 25,
                身份: '江湖侠客',
                是否在场: true,
                是否队友: true,
                当前血量: 100,
                最大血量: 100,
                状态: '正常'
            },
            {
                id: 'npc_monster',
                姓名: '巨蟒',
                性别: '未知',
                年龄: 0,
                身份: '野兽',
                是否在场: true,
                是否队友: false,
                当前血量: 50,
                最大血量: 50,
                状态: '正常'
            }
        ], { 合并同名: false });

        // 模拟AI响应：张杰杀死巨蟒
        const mockResponse = {
            logs: [
                { sender: '旁白', text: '张杰拔剑冲向巨蟒，一剑刺穿它的要害，巨蟒当场死亡。' }
            ],
            tavern_commands: [
                { action: 'set' as const, key: '社交[1].当前血量', value: 0 },
                { action: 'set' as const, key: '社交[1].状态', value: '死亡' },
                { action: 'set' as const, key: '社交[1].生死状态', value: '死亡' },
                { action: 'set' as const, key: '社交[1].死亡时间', value: '1:01:01:08:00' },
                { action: 'set' as const, key: '社交[1].死亡描述', value: '被张杰一剑刺穿要害，当场死亡。' }
            ]
        };

        const result = 执行响应命令处理(
            mockResponse,
            {
                角色: 规范化角色物品容器映射({ 姓名: '测试主角', 装备: {}, 物品列表: [] }),
                环境: 规范化环境信息({ 时间: '1:01:01:08:00', 大地点: '测试州', 具体地点: '前厅' }),
                社交: socialList,
                世界: { 地图层级: [] } as any,
                战斗: {} as any,
                玩家组织: {} as any,
                任务列表: [],
                约定列表: [],
                剧情: {} as any,
                剧情规划: {} as any
            },
            {
                规范化环境信息,
                规范化社交列表: (raw?: any[], options?: { 合并同名?: boolean }) => 规范化社交列表(raw || [], options),
                规范化世界状态: (raw?: any) => raw || { 地图层级: [] },
                规范化战斗状态: (raw?: any) => raw || {},
                规范化门派状态: (raw?: any) => raw || {},
                规范化剧情状态: (raw?: any) => raw || {},
                规范化剧情规划状态: (raw?: any) => raw || {},
                规范化女主剧情规划状态: (raw?: any) => raw,
                规范化角色物品容器映射,
                战斗结束自动清空: (battle: any) => battle
            },
            undefined,
            { applyState: false }
        );

        const zhangJie = result.社交.find((npc: any) => npc.姓名 === '张杰');
        const monster = result.社交.find((npc: any) => npc.姓名 === '巨蟒');

        // 张杰应该活着
        expect(zhangJie).toBeDefined();
        expect(zhangJie?.状态).not.toBe('死亡');
        expect(zhangJie?.当前血量).toBe(100);

        // 巨蟒应该死亡
        expect(monster).toBeDefined();
        expect(monster?.状态).toBe('死亡');
        expect(monster?.当前血量).toBe(0);
    });

    it('AI直接调用测试：发送战斗消息验证死亡判定', { timeout: 90000 }, async () => {
        if (!aiConfig) {
            console.log('跳过：未配置 MORAN_E2E_AI_BASE_URL/MORAN_E2E_AI_API_KEY/MORAN_E2E_AI_MODEL');
            return;
        }

        const testConfig = 构建测试用AI配置(aiConfig);

        const messages: 通用消息[] = [
            {
                role: 'system',
                content: `你是一个武侠小说AI。请根据用户输入生成一段武侠战斗故事。
要求：
1. 如果用户描述杀死敌人，敌人应该死亡，主角应该存活
2. 输出格式：先写故事正文，然后输出变量命令

变量命令格式：
<命令>
set 社交[i].当前血量 = 0
set 社交[i].状态 = 死亡
set 社交[i].死亡时间 = 当前时间
set 社交[i].死亡描述 = 死亡原因
</命令>`
            },
            {
                role: 'user',
                content: '张杰拔剑冲向巨蟒，一剑刺穿它的要害，巨蟒当场死亡。请更新变量状态。'
            }
        ];

        const response = await 请求模型文本(testConfig, messages, {
            temperature: 0.7,
            signal: undefined,
            streamOptions: { stream: false },
            errorDetailLimit: 1000
        });

        console.log('AI响应:', response);

        // 验证响应包含死亡描述
        expect(response).toContain('巨蟒');
        expect(response).toContain('死亡');
    });
});
