import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { 校验响应人称一致性, 校验主剧情正文最低字数, 获取主剧情正文不足信息, 统计正文字符数 } from '../hooks/useGame/sendWorkflow';
import { 净化角色对白行, 评估润色长度结果, 检测文章优化协议确认污染, 解析正文日志文本 } from '../hooks/useGame/bodyPolish';
import { 清理润色正文输出, 构建故事请求消息诊断 } from '../services/ai/storyTasks';
import { 构建主剧情请求参数, type 主剧情系统上下文 } from '../hooks/useGame/mainStoryRequest';
import { 构建字数要求提示词 } from '../prompts/runtime/protocolDirectives';
import { 默认游戏设置 } from '../utils/gameSettings';

describe('主剧情正文字数校验', () => {
    it('统计正文日志的可见字符数', () => {
        expect(统计正文字符数({
            logs: [
                { sender: '旁白', text: '  江风渐起。 ' },
                { sender: '苏清寒', text: '继续。' }
            ]
        })).toBe(8);
    });

    it('正文低于设置字数时抛出解析错误，交给自动重试或恢复流程处理', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '太短了。' }
            ]
        }, 50, '<正文>太短了。</正文>')).toThrow(/正文过短/);
    });

    it('正文低于设置字数时返回可供文章优化接管的不足信息', () => {
        expect(获取主剧情正文不足信息({
            logs: [
                { sender: '旁白', text: '大纲可用。' }
            ]
        }, 80)).toMatchObject({
            actual: 5,
            required: 80
        });
    });

    it('正文只差少量字数时会落入容错并保留为提示', () => {
        expect(获取主剧情正文不足信息({
            logs: [
                { sender: '旁白', text: 'x'.repeat(1934) }
            ]
        }, 2000)).toMatchObject({
            actual: 1934,
            required: 2000,
            shortage: 66,
            withinTolerance: true
        });

        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: 'x'.repeat(1934) }
            ]
        }, 2000, '<正文>略短但可读</正文>')).not.toThrow();
    });

    it('正文达到最低字数时通过', () => {
        expect(() => 校验主剧情正文最低字数({
            logs: [
                { sender: '旁白', text: '这是一段已经达到最低长度要求的正文内容，用来确认正常回合不会被误判为失败。江风穿过长街，灯影落在青石上，行人低声交谈，新的线索也随之展开。' }
            ]
        }, 50, '<正文>...</正文>')).not.toThrow();
    });

    it('文章优化不能把正常正文明显压缩成大纲', () => {
        expect(评估润色长度结果({
            sourceLength: 400,
            polishedLength: 220,
            requiredLength: 300
        })).toMatchObject({ ok: false });
    });

    it('短正文交给文章优化扩写时会按容错接受接近目标的结果', () => {
        expect(评估润色长度结果({
            sourceLength: 1800,
            polishedLength: 1934,
            requiredLength: 2000,
            allowExpansionForLength: true
        })).toMatchObject({ ok: true });

        expect(评估润色长度结果({
            sourceLength: 120,
            polishedLength: 180,
            requiredLength: 300,
            allowExpansionForLength: true
        })).toMatchObject({ ok: false });

        expect(评估润色长度结果({
            sourceLength: 120,
            polishedLength: 320,
            requiredLength: 300,
            allowExpansionForLength: true
        })).toMatchObject({ ok: true });
    });

    it('文章优化后会把污染到角色行里的旁白拆回旁白', () => {
        const logs = 净化角色对白行([
            {
                sender: '灵灵',
                text: '"那是当然。本助手可是按照地球东亚审美天花板调的参数——宿主从前不是说想回高中吗？回不去了，看看我过过瘾也行嘛。" 她说完往驾座那一处靠了靠，两条穿着黑色短袜的腿晃了两下。'
            },
            {
                sender: '旁白',
                text: '吴杰涛朝她那一处望了一眼，又把目光收回到前方那条黄土官道上。'
            }
        ]);

        expect(logs).toEqual([
            {
                sender: '灵灵',
                text: '那是当然。本助手可是按照地球东亚审美天花板调的参数——宿主从前不是说想回高中吗？回不去了，看看我过过瘾也行嘛。'
            },
            {
                sender: '旁白',
                text: '她说完往驾座那一处靠了靠，两条穿着黑色短袜的腿晃了两下。\n吴杰涛朝她那一处望了一眼，又把目光收回到前方那条黄土官道上。'
            }
        ]);
    });

    it('文章优化只提取正文块，不把正文后的记忆规划块混入正文', () => {
        const cleaned = 清理润色正文输出([
            '<thinking>检查协议。</thinking>',
            '<正文>',
            '【旁白】他的手指在口袋里摸到了两个坚硬的物体。',
            '</正文>',
            '<短期记忆>杨培强找到了手机。</短期记忆>',
            '<行动选项]',
            '【选项一】查看手机。',
            '</行动选项]'
        ].join('\n'));

        expect(cleaned).toBe('【旁白】他的手指在口袋里摸到了两个坚硬的物体。');
    });

    it('文章优化正文解析会合并被模型硬拆开的物品名续行', () => {
        const logs = 解析正文日志文本([
            '【旁白】他的手指在口袋里摸到了两个坚硬的物体。',
            '一把是他平日里习惯随身携带的',
            '【随身短刃】',
            '，刀柄的防滑纹路让他感到一阵安心；',
            '另一件则是他的',
            '【智能手机】',
            '他掏出手机按下电源键，屏幕亮起。'
        ].join('\n'));

        expect(logs).toEqual([{
            sender: '旁白',
            text: '他的手指在口袋里摸到了两个坚硬的物体。\n一把是他平日里习惯随身携带的【随身短刃】，刀柄的防滑纹路让他感到一阵安心；\n另一件则是他的【智能手机】他掏出手机按下电源键，屏幕亮起。'
        }]);
    });

    it('文章优化正文解析会合并被模型硬拆开的括号说明续行', () => {
        const logs = 解析正文日志文本([
            '【旁白】他的身体已经恢复到了巅峰状态，虽然六维属性依旧是普通人的极限',
            '（力量5、敏捷5、体质5、根骨5、悟性5、福源5）',
            '，但那种死里逃生的真实感终于落到了实处。'
        ].join('\n'));

        expect(logs).toEqual([{
            sender: '旁白',
            text: '他的身体已经恢复到了巅峰状态，虽然六维属性依旧是普通人的极限（力量5、敏捷5、体质5、根骨5、悟性5、福源5），但那种死里逃生的真实感终于落到了实处。'
        }]);
    });

    it('文章优化会识别协议确认句复读污染', () => {
        const polluted = [
            '好的，将以<正文></正文>包裹正文，并且本次会在<短期记忆>、<变量规划>、<剧情规划>等回合标签之后输出<行动选项></行动选项>，<正文>前以<thinking>作为开头进行思考并以</thinking>闭合：',
            '好的，将以<正文></正文>包裹正文，并且本次会在<短期记忆>、<变量规划>、<剧情规划>等回合标签之后输出<行动选项></行动选项>，<正文>前以<thinking>作为开头进行思考并以</thinking>闭合：'
        ].join('\n');

        expect(检测文章优化协议确认污染(polluted)).toMatchObject({
            polluted: true,
            repeats: 2
        });
    });

    it('文章优化不会把正常正文里的协议标签误判为复读污染', () => {
        const normal = [
            '<thinking>检查原文事实与对白。</thinking>',
            '<正文>',
            '【旁白】主神光球在头顶亮起，冷白色的光压住了房间里浮动的尘埃。',
            '【林岚】先别兑换，确认任务世界和限制条件。',
            '</正文>'
        ].join('\n');

        expect(检测文章优化协议确认污染(normal)).toMatchObject({
            polluted: false
        });
    });

    it('主剧情有序消息会把动态最低字数要求放到最终任务前', () => {
        const lengthPrompt = 构建字数要求提示词(1500);
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '',
                地图建筑状态: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '<字数>本次<正文>内的正文必须达到动态注入的最低字数要求。</字数>',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                任务状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: lengthPrompt,
                免责声明输出提示词: '',
                输出协议提示词: ''
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                字数要求: 1500,
                启用GPT模式: true,
                主剧情消息模式: 'GPT'
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://example.test/v1',
                model: 'gemini-test'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '继续剧情。'
        });

        const finalLengthEntryIndex = result.messageEntries.findIndex((entry) => entry.id === 'turn_directives');
        const startTaskIndex = result.messageEntries.findIndex((entry) => entry.id === 'start_task');

        expect(finalLengthEntryIndex).toBeGreaterThanOrEqual(0);
        expect(startTaskIndex).toBeGreaterThan(finalLengthEntryIndex);
        expect(result.messageEntries[finalLengthEntryIndex]).toMatchObject({
            role: 'user',
            content: expect.stringContaining('1500字以上')
        });
        expect(result.orderedMessages.some((message) => message.content.includes(lengthPrompt))).toBe(true);
    });

    it('酒馆预设模式也会注入动态最低字数要求', () => {
        const lengthPrompt = 构建字数要求提示词(2200);
        const disclaimerPrompt = '<disclaimer>如需现实建议，请寻求现实专业渠道。</disclaimer>';
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '世界书占位',
                地图建筑状态: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '<字数>旧字数提示会被运行时修正。</字数>',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                任务状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: lengthPrompt,
                免责声明输出提示词: disclaimerPrompt,
                输出协议提示词: ''
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                字数要求: 2200,
                启用酒馆预设模式: true,
                当前酒馆预设ID: 'travel',
                酒馆预设角色ID: 1,
                酒馆预设列表: [{
                    id: 'travel',
                    名称: '双人旅行',
                    角色ID: 1,
                    预设: {
                        spec: 'chara_card_v3',
                        prompts: [
                            { identifier: 'main', name: 'main', role: 'system', content: '固定预设' },
                            { identifier: 'worldInfoBefore', name: 'worldInfoBefore', role: 'system', content: '' },
                            { identifier: 'userInput', name: 'userInput', role: 'user', content: '' }
                        ],
                        prompt_order: [{
                            character_id: 1,
                            order: [
                                { identifier: 'main', enabled: true },
                                { identifier: 'worldInfoBefore', enabled: true },
                                { identifier: 'userInput', enabled: true }
                            ]
                        }]
                    } as any
                }]
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://example.test/v1',
                model: 'gemini-test'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '继续剧情。'
        });

        expect(result.tavernPresetModeEnabled).toBe(true);
        const payload = result.orderedMessages.map((message) => message.content).join('\n');
        expect(payload).toContain('2200字以上');
        expect(payload.split('<字数>').length - 1).toBe(1);
        expect(payload.split('<disclaimer>').length - 1).toBe(1);
    });

    it('主剧情 assembly 将导演配置与角色种子作为独立分段注入真实 payload', () => {
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '现代都市世界观。',
                地图建筑状态: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                任务状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: 构建字数要求提示词(1200),
                免责声明输出提示词: '',
                输出协议提示词: '',
                ...( {
                    题材模式提示词: '【题材模式】现代都市',
                    玩家剧情倾向提示词: '【玩家剧情倾向】慢热后宫推进。',
                    导演配置提示词: '【角色种子入口摘要】\n1. 角色种子ID：seed-roommate；林知夏：合租室友。'
                } as any)
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                字数要求: 1200,
                启用GPT模式: true,
                主剧情消息模式: 'GPT'
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://example.test/v1',
                model: 'gemini-test'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '回到合租公寓。'
        });

        const payload = result.orderedMessages.map((message) => message.content).join('\n');
        expect(result.messageEntries.map((entry) => entry.id)).toEqual(expect.arrayContaining([
            'topic_mode',
            'player_preference',
            'director_config'
        ]));
        expect(payload).toContain('【题材模式】现代都市');
        expect(payload).toContain('【玩家剧情倾向】慢热后宫推进。');
        expect(payload).toContain('角色种子ID：seed-roommate');
    });

    it('主剧情 assembly 对字数、人称、重试和用户输入使用唯一分段', () => {
        const lengthPrompt = 构建字数要求提示词(1600);
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '',
                地图建筑状态: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '<字数>旧写作要求应由最终硬约束替换。</字数>',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                任务状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: lengthPrompt,
                免责声明输出提示词: '',
                输出协议提示词: '',
                ...( {
                    重试格式要求提示词: '【自动重试格式修正】请完整重新生成本回合。',
                    协议重试要求提示词: '【标签协议自动回炉】缺少 <行动选项>。',
                    人称硬约束提示词: '【人称硬约束】本回合正文必须使用第三人称指代主角。'
                } as any)
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                字数要求: 1600,
                启用GPT模式: true,
                主剧情消息模式: 'GPT'
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://example.test/v1',
                model: 'gemini-test'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '去便利店买水。'
        });

        const payload = result.orderedMessages.map((message) => message.content).join('\n');
        expect(payload.split('<字数>').length - 1).toBe(1);
        expect(payload.split('【人称硬约束】').length - 1).toBe(1);
        expect(payload.split('【自动重试格式修正】').length - 1).toBe(1);
        expect(payload.split('去便利店买水。').length - 1).toBe(1);
        expect(result.messageEntries.filter((entry) => entry.id === 'turn_directives')).toHaveLength(1);
        expect(result.messageEntries.every((entry) => Number.isFinite((entry as any).charCount))).toBe(true);
    });

    it('主剧情 assembly diagnostics 标明实际拼装分支与分段结构', () => {
        const builtContext: 主剧情系统上下文 = {
            shortMemoryContext: '',
            contextPieces: {
                AI角色声明: '你是墨染江湖叙事模型。',
                worldPrompt: '现代都市世界观。',
                地图建筑状态: '',
                离场NPC档案: '',
                otherPrompts: '',
                难度设置提示词: '',
                叙事人称提示词: '',
                字数设置提示词: '',
                长期记忆: '',
                中期记忆: '',
                在场NPC档案: '',
                剧情安排: '',
                女主剧情规划状态: '',
                世界状态: '',
                环境状态: '',
                角色状态: '',
                任务状态: '',
                COT提示词: '',
                格式提示词: '<正文>...</正文>',
                字数要求提示词: 构建字数要求提示词(1200),
                免责声明输出提示词: '',
                输出协议提示词: '',
                ...( {
                    导演配置提示词: '【角色种子入口摘要】\n1. 角色种子ID：seed-roommate；林知夏：合租室友。'
                } as any)
            }
        };

        const result = 构建主剧情请求参数({
            gameConfig: {
                ...默认游戏设置,
                启用GPT模式: true,
                主剧情消息模式: 'GPT'
            },
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://api.deepseek.com/v1',
                model: 'deepseek-v4-pro',
                供应商: 'deepseek'
            } as any,
            builtContext,
            updatedContextHistory: [],
            updatedMemSys: {} as any,
            sendInput: '继续剧情。'
        });

        expect(result.diagnostics).toMatchObject({
            tavernPresetModeEnabled: false,
            assemblyBranch: 'native_ordered_segments',
            orderedMessageCount: result.orderedMessages.length,
            orderedRoleSequence: result.orderedMessages.map((message) => message.role)
        });
        expect(result.diagnostics.payloadSegments).toContainEqual(expect.objectContaining({
            id: 'director_config',
            role: 'system',
            charCount: expect.any(Number)
        }));
    });

    it('主剧情 service diagnostics 记录 runtime 注入与 provider 兼容修正后的 role 序列', () => {
        const beforeRuntime = [
            { role: 'system' as const, content: '系统提示' },
            { role: 'assistant' as const, content: '前置说明' },
            { role: 'user' as const, content: '开始任务' }
        ];
        const afterRuntime = [
            ...beforeRuntime,
            { role: 'user' as const, content: '【人称硬约束】使用第三人称。' }
        ];

        const diagnostics = 构建故事请求消息诊断({
            apiConfig: {
                apiKey: 'test-key',
                baseUrl: 'https://api.deepseek.com/v1',
                model: 'deepseek-v4-pro',
                供应商: 'deepseek'
            } as any,
            beforeRuntimeRequirements: beforeRuntime,
            afterRuntimeRequirements: afterRuntime
        });

        expect(diagnostics).toMatchObject({
            providerProtocol: 'deepseek',
            runtimeRequirementsInjected: true,
            beforeRuntimeRequirements: {
                messageCount: 3,
                roleSequence: ['system', 'assistant', 'user']
            },
            afterRuntimeRequirements: {
                messageCount: 4,
                roleSequence: ['system', 'assistant', 'user', 'user']
            },
            providerNormalized: {
                changed: true,
                roleSequence: ['system', 'user']
            }
        });
    });

    it('主剧情请求开始诊断记录 payload 分段摘要而不是完整正文', () => {
        const source = readFileSync(resolve(process.cwd(), 'hooks/useGame/sendWorkflow.ts'), 'utf8');

        expect(source).toContain('payloadSegments: messageEntries.map');
        expect(source).toContain('charCount: entry.charCount');
        expect(source).toContain('requestDiagnostics');
        expect(source).toContain('serviceDiagnostics');
        expect(source).not.toContain('content: entry.content');
    });
});

describe('主剧情叙事人称校验', () => {
    const rawText = '<正文>测试正文</正文>';

    it('第三人称旁白 + 角色对白含“你”时不报错', () => {
        expect(() => 校验响应人称一致性({
            角色: { 姓名: '沈砚' },
            logs: [
                { sender: '旁白', text: '林清月垂下眼，袖口的雨水顺着指尖滴落。' },
                { sender: '林清月', text: '你没有要过她任何一丝一毫的回报。' }
            ]
        } as any, rawText, '第三人称')).not.toThrow();
    });

    it('第三人称旁白引号内含“你”时不报错', () => {
        expect(() => 校验响应人称一致性({
            角色: { 姓名: '沈砚' },
            logs: [
                { sender: '旁白', text: '林清月低声说：“你走进房间。你感到一阵寒意。”随后她把目光移向窗外。' }
            ]
        } as any, rawText, '第三人称')).not.toThrow();
    });

    it('玩家输入摘要、系统提示和任务提示含“你”时不报错', () => {
        expect(() => 校验响应人称一致性({
            角色: { 姓名: '沈砚' },
            logs: [
                {
                    sender: '旁白',
                    text: [
                        '玩家输入摘要：你走进房间，询问林清月。',
                        '系统提示：你感到一阵寒意时需要等待判定。',
                        '任务提示：你决定继续向前会推进主线。',
                        '林清月站在廊下，雨声遮住了她短促的呼吸。'
                    ].join('\n')
                }
            ]
        } as any, rawText, '第三人称')).not.toThrow();
    });

    it('第三人称正文不出现主角姓名、只用他她少年时不报错', () => {
        expect(() => 校验响应人称一致性({
            角色: { 姓名: '沈砚' },
            logs: [
                { sender: '旁白', text: '少年推开木门，望见廊下的灯影。他停了片刻，随后向她点头。' }
            ]
        } as any, rawText, '第三人称')).not.toThrow();
    });

    it('正文主体明显连续使用第二人称时会报错', () => {
        expect(() => 校验响应人称一致性({
            角色: { 姓名: '沈砚' },
            logs: [
                { sender: '旁白', text: '你走进房间。你感到寒意。你决定继续向前。' }
            ]
        } as any, rawText, '第三人称')).toThrow(/叙事人称不符/);
    });

    it('第一人称模式下，对话里出现“你”但旁白稳定用“我”时不报错', () => {
        expect(() => 校验响应人称一致性({
            角色: { 姓名: '沈砚' },
            logs: [
                { sender: '旁白', text: '我走进房间，听见窗外雨声渐急。我决定先把灯点亮。' },
                { sender: '林清月', text: '你先别急，外面还有人。' }
            ]
        } as any, rawText, '第一人称')).not.toThrow();
    });
});
