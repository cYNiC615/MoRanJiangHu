import { describe, expect, it } from 'vitest';
import { 构建变量路径登记提示, 校验变量命令是否登记 } from '../utils/variableRegistry';
import { applyStateCommand } from '../utils/stateHelpers';

const baseState = {
    角色: {
        姓名: '沈墨',
        当前精力: 80,
        状态: {
            外伤: '无'
        }
    },
    环境: {
        具体地点: '旧巷'
    },
    社交: [
        {
            姓名: '阿青',
            关系状态: '同行',
            记忆: ['初见']
        }
    ],
    任务列表: [],
    世界: {
        地图层级: [],
        地图建筑: []
    },
    剧情: {},
    剧情规划: {},
    玩家组织: {
        名称: '铁栅安全点',
        玩家贡献: 120,
        累计贡献: 1500,
        任务列表: []
    }
};

describe('variableRegistry', () => {
    it('allows registered scalar updates and registered array pushes', () => {
        expect(校验变量命令是否登记({
            action: 'set',
            key: '角色.当前精力',
            value: 60
        }, baseState).allowed).toBe(true);

        expect(校验变量命令是否登记({
            action: 'push',
            key: '社交[0].记忆',
            value: '一起避雨'
        }, baseState).allowed).toBe(true);
    });

    it('blocks unregistered fields that the variable model invents', () => {
        const result = 校验变量命令是否登记({
            action: 'set',
            key: '角色.哈基米灵感值',
            value: 999
        }, baseState);

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('目标路径未登记');
    });

    it('shows the registered paths in the prompt sent to the variable model', () => {
        const prompt = 构建变量路径登记提示(baseState);

        expect(prompt).toContain('【变量路径登记表】');
        expect(prompt).toContain('- 角色.当前精力');
        expect(prompt).toContain('- 社交[0].记忆');
        expect(prompt).toContain('- 玩家组织');
        expect(prompt).toContain('- 玩家组织.玩家贡献');
        expect(prompt).not.toContain('- 战斗');
        expect(prompt).not.toContain('- 玩家组织.任务列表');
    });

    it('blocks retired feature roots from variable commands', () => {
        [
            ['战斗.敌方', []],
            ['战斗态势.主角.当前血量', 1]
        ].forEach(([key, value]) => {
            const result = 校验变量命令是否登记({
                action: 'set',
                key: key as string,
                value
            }, baseState);

            expect(result.allowed, key as string).toBe(false);
            expect(result.reason, key as string).toBe('废弃功能根路径已退役');
        });
    });

    it('allows current player organization fields but keeps organization tasks on the global task list', () => {
        expect(校验变量命令是否登记({
            action: 'set',
            key: '玩家组织.玩家贡献',
            value: 180
        }, baseState).allowed).toBe(true);

        const result = 校验变量命令是否登记({
            action: 'push',
            key: '玩家组织.任务列表',
            value: { 标题: '旧入口任务' }
        }, baseState);

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('组织任务入口已迁移到全局任务列表');
    });

    it('allows important male NSFW profile fields to be added to social records', () => {
        expect(校验变量命令是否登记({
            action: 'set',
            key: '社交[0].男娘设定',
            value: '男娘设定：女性化气质明确，常以柔雅衣饰示人。'
        }, baseState).allowed).toBe(true);

        expect(校验变量命令是否登记({
            action: 'set',
            key: '社交[0].扶她设定',
            value: '扶她设定：扶她身份与身体结构明确。'
        }, baseState).allowed).toBe(true);

        expect(校验变量命令是否登记({
            action: 'set',
            key: '社交[0].肉棒描述',
            value: '稳定私密档案描述'
        }, baseState).allowed).toBe(true);
    });

    it('allows variable generation to repair incomplete dialogue NPC base fields', () => {
        [
            ['社交[0].性别', '女'],
            ['社交[0].年龄', '十八'],
            ['社交[0].身份', '青云门弟子'],
            ['社交[0].境界', '炼气一层'],
            ['社交[0].简介', '本回合对白登场的长期承接人物。'],
            ['社交[0].是否主要角色', true],
            ['社交[0].是否在场', true],
            ['社交[0].天赋列表', []],
            ['社交[0].出身背景', { 名称: '宗门弟子' }],
            ['社交[0].当前装备', {}],
            ['社交[0].背包', []],
            ['社交[0].BUFF', []],
            ['社交[0].DEBUFF', []],
            ['社交[0].技艺', []],
            ['社交[0].力量', 5],
            ['社交[0].境界层级', 1]
        ].forEach(([key, value]) => {
            expect(校验变量命令是否登记({
                action: 'set',
                key: key as string,
                value
            }, baseState).allowed).toBe(true);
        });
    });

    it('blocks writes to deprecated coordinate map fields', () => {
        const result = 校验变量命令是否登记({
            action: 'push',
            key: '世界.地图建筑',
            value: { 名称: '旧式建筑' }
        }, baseState);

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('旧地图坐标字段已废弃');
    });

    it('ignores deprecated coordinate map writes when applying commands', () => {
        const result = applyStateCommand(
            baseState.角色 as any,
            baseState.环境 as any,
            baseState.社交 as any,
            baseState.世界 as any,
            baseState.剧情 as any,
            baseState.剧情规划 as any,
            undefined,
            baseState.玩家组织 as any,
            baseState.任务列表 as any,
            '世界.地图建筑',
            { 名称: '旧式建筑' },
            'push'
        );

        expect(result.world.地图建筑).toEqual([]);
    });

    it('ignores retired feature root writes when applying commands', () => {
        const result = applyStateCommand(
            baseState.角色 as any,
            baseState.环境 as any,
            baseState.社交 as any,
            baseState.世界 as any,
            baseState.剧情 as any,
            baseState.剧情规划 as any,
            undefined,
            baseState.玩家组织 as any,
            baseState.任务列表 as any,
            '战斗.是否战斗中',
            true,
            'set'
        );

        expect('battle' in result).toBe(false);
        expect(result.sect).toEqual(baseState.玩家组织);
    });

    it('applies current player organization commands except the old organization task list', () => {
        const updated = applyStateCommand(
            baseState.角色 as any,
            baseState.环境 as any,
            baseState.社交 as any,
            baseState.世界 as any,
            baseState.剧情 as any,
            baseState.剧情规划 as any,
            undefined,
            baseState.玩家组织 as any,
            baseState.任务列表 as any,
            '玩家组织.玩家贡献',
            180,
            'set'
        );
        expect(updated.sect.玩家贡献).toBe(180);

        const blocked = applyStateCommand(
            baseState.角色 as any,
            baseState.环境 as any,
            baseState.社交 as any,
            baseState.世界 as any,
            baseState.剧情 as any,
            baseState.剧情规划 as any,
            undefined,
            baseState.玩家组织 as any,
            baseState.任务列表 as any,
            '玩家组织.任务列表',
            [{ 标题: '旧入口任务' }],
            'set'
        );
        expect(blocked.sect.任务列表).toEqual([]);
    });
});
