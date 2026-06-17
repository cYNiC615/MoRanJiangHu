import { describe, expect, it } from 'vitest';
import { 检测NPC死亡判定风险命令 } from '../hooks/useGame/variableModelWorkflow';
import type { TavernCommand } from '../types';

const social = [
    { 姓名: '韩小霜', 当前血量: 31, 状态: '重伤' }
];

describe('NPC death judgement guard', () => {
    it('rejects death status when HP zero, explicit story death, and cause are missing', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].关系状态', value: '已故' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social)).toEqual([
            '韩小霜 缺少当前血量归零、死亡时间、死亡描述'
        ]);
    });

    it('rejects death status when no death time or description is provided', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social)).toEqual([
            '韩小霜 缺少死亡时间、死亡描述'
        ]);
    });

    it('accepts death status only when HP zero, death time, and death description are all present', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' },
            { action: 'set', key: '社交[0].死亡时间', value: '1:01:01:08:00' },
            { action: 'set', key: '社交[0].死亡描述', value: '韩小霜被尸群咬伤感染后失血休克，最终死亡。' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social)).toEqual([]);
    });

    it('does not treat erotic exaggeration as a death fact', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' },
            { action: 'set', key: '社交[0].死亡描述', value: '欢好时喊了一句要死了' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social)).toEqual([
            '韩小霜 缺少死亡时间'
        ]);
    });

    it('rejects irreversible annihilation wording when death metadata commands are missing', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].当前血量', value: 0 },
            { action: 'set', key: '社交[0].生死状态', value: '死亡' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social)).toEqual([
            '韩小霜 缺少死亡时间、死亡描述'
        ]);
    });

    it('rejects explicit corpse wording when hp zero and death metadata commands are missing', () => {
        const commands: TavernCommand[] = [
            { action: 'set', key: '社交[0].生死状态', value: '死亡' }
        ];

        expect(检测NPC死亡判定风险命令(commands, social)).toEqual([
            '韩小霜 缺少当前血量归零、死亡时间、死亡描述'
        ]);
    });
});
