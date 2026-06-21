import { describe, expect, it } from 'vitest';
import { 清洗导入存档 } from '../services/dbService';

describe('dbService director config import cleaning', () => {
    it('preserves top-level director config when cleaning imported saves', () => {
        const cleaned = 清洗导入存档({
            类型: 'manual',
            时间戳: 1000,
            角色数据: { 姓名: '沈墨' },
            环境信息: { 时间: '1:01:01:00:00', 具体地点: '出租屋' },
            历史记录: [],
            openingConfig: { 题材模式: '现代都市' },
            导演配置: {
                玩家剧情倾向: '慢热合租线',
                角色种子定义: [{
                    id: 'seed-roommate',
                    名称: '林知夏',
                    性别: '女',
                    是否启用: true,
                    入口摘要: '合租室友'
                }],
                角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
            }
        });

        expect(cleaned?.导演配置).toMatchObject({
            玩家剧情倾向: '慢热合租线',
            角色种子定义: [{ id: 'seed-roommate', 名称: '林知夏' }],
            角色种子运行时状态: [{ seedId: 'seed-roommate', 状态: '未引入' }]
        });
    });
});
