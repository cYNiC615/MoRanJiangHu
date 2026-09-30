import { describe, expect, it } from 'vitest';
import { 规范化对白日志, 规范化可渲染对白日志 } from '../utils/dialogueLogNormalizer';

describe('dialogueLogNormalizer story readability cleanup', () => {
    it('does not rewrite knuckle-whitening phrasing locally', () => {
        const logs = 规范化对白日志([
            {
                sender: '旁白',
                text: '她握住茶壶时，指节处泛起了一丝不正常的苍白。。屋内安静下来。。'
            }
        ] as any);

        expect(logs).toHaveLength(1);
        expect(logs[0].text).toContain('指节处泛起了一丝不正常的苍白');
        expect(logs[0].text).not.toContain('手指收紧');
        expect(logs[0].text).not.toContain('。。');
    });

    it('splits very long narration into readable paragraphs', () => {
        const longText = [
            '卯时的青云仙城尚未大亮，晨雾覆在飞檐之上。',
            '云水客栈二号房内，灵气沿着阵纹缓缓流转。',
            '窗外有脚步声远远传来，却又在门前停住。',
            '桌上的残烛早已燃尽，只余淡淡安神香气。',
            '你睁开眼时，屋内陈设简单，却透出久住的痕迹。',
            '门外那人没有立刻开口，只让气息沉在风里。',
            '廊下木板被晨露浸得微凉，偶尔有远处钟声越过坊墙。',
            '这座仙城在天光亮起前显得格外空阔，连茶盏边缘的水痕都清晰可见。',
            '你能听见自己的呼吸渐渐平稳，也能察觉门外来人刻意压下的急切。',
            '案边旧册摊开在昨夜翻到的那一页，墨迹被潮气浸得略微发淡。',
            '所有细节堆在一起时，便不再像普通清晨，而像某件事即将被推到眼前。'
        ].join('');

        const logs = 规范化可渲染对白日志([{ sender: '旁白', text: longText }] as any);

        expect(logs[0].text).toContain('\n\n');
    });

    it('keeps narrated quoted speech as narration instead of guessing character bubbles', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '杨培强停下手里的动作。一个清冷的女声从侧后方传来。俞月荷正站在门边，低声说道：“你动作能不能轻一点？如果里面装的是玻璃安瓿瓶，你刚才那一下，至少报废了我们半个月的口粮。”'
        }] as any);
        expect(logs).toEqual([
            {
                sender: '旁白',
                text: '杨培强停下手里的动作。一个清冷的女声从侧后方传来。俞月荷正站在门边，低声说道：“你动作能不能轻一点？如果里面装的是玻璃安瓿瓶，你刚才那一下，至少报废了我们半个月的口粮。”'
            }
        ]);
    });

    it('protects line breaks inside quoted narration without assigning a speaker', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: [
                '叶青压低声音说道：“先别兑换，',
                '确认任务世界和限制条件。',
                '如果主神限制热武器，我们就换侦查能力。”'
            ].join('\n')
        }] as any);

        expect(logs).toEqual([
            {
                sender: '旁白',
                text: '叶青压低声音说道：“先别兑换，确认任务世界和限制条件。如果主神限制热武器，我们就换侦查能力。”'
            }
        ]);
    });

    it('merges adjacent split quote entries without recovering a character bubble', () => {
        const logs = 规范化可渲染对白日志([
            { sender: '旁白', text: '叶青压低声音说道：“先别兑换，' },
            { sender: '旁白', text: '确认任务世界和限制条件。”她看向主神光球。' }
        ] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '叶青压低声音说道：“先别兑换，确认任务世界和限制条件。”她看向主神光球。' }
        ]);
    });

    it('splits bracket speaker lines from narration into character bubbles', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: [
                '门被从外面推开，热水汽涌进屋内。',
                '【绛雨】 “师姐，铁匠大哥，你们在聊什么呢？”',
                '她一边擦着头发，一边走到桌前。'
            ].join('\n')
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '门被从外面推开，热水汽涌进屋内。' },
            { sender: '绛雨', text: '师姐，铁匠大哥，你们在聊什么呢？' },
            { sender: '旁白', text: '她一边擦着头发，一边走到桌前。' }
        ]);
    });

    it('splits explicit bracket speaker dialogue embedded inside a narration paragraph', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '亨特没有抬眼，只把杯子推到桌边。【亨特】“说真的，这地方的品味简直糟透了。”他只是缓缓伸出右手，把冰冷的杯壁贴近嘴唇。'
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '亨特没有抬眼，只把杯子推到桌边。' },
            { sender: '亨特', text: '说真的，这地方的品味简直糟透了。' },
            { sender: '旁白', text: '他只是缓缓伸出右手，把冰冷的杯壁贴近嘴唇。' }
        ]);
    });

    it('keeps narration around multiple embedded bracket speaker turns', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '夜店里的灯光晃了一下。【亨特】“不过，我们今天不是来查税的。”【陈小刀】“他现在就在二楼。”人群又把声音吞了回去。'
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '夜店里的灯光晃了一下。' },
            { sender: '亨特', text: '不过，我们今天不是来查税的。' },
            { sender: '陈小刀', text: '他现在就在二楼。' },
            { sender: '旁白', text: '人群又把声音吞了回去。' }
        ]);
    });

    it('keeps bare colon speaker lines from old narration as narration', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: [
                '门外有人走来。',
                '林婉儿（皱眉）：我也看到这个bug了，有些角色说话的时候对话框就没了。',
                '她抬头看你。'
            ].join('\n')
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '门外有人走来。\n林婉儿（皱眉）：我也看到这个bug了，有些角色说话的时候对话框就没了。\n她抬头看你。' }
        ]);
    });

    it('keeps xml-style character tags in narration instead of character bubbles', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '主神光球闪烁了一下。<林岚>先别兑换，确认任务世界和限制条件。</林岚><叶青>我去检查补给箱。</叶青>白光重新稳定。'
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '主神光球闪烁了一下。<林岚>先别兑换，确认任务世界和限制条件。</林岚><叶青>我去检查补给箱。</叶青>白光重新稳定。' }
        ]);
    });

    it('keeps escaped xml-style character tags in narration', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '队伍频道亮起：&lt;秦映雪&gt;别急着开门，先看门缝下面有没有影子。&lt;/秦映雪&gt;'
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '队伍频道亮起：&lt;秦映雪&gt;别急着开门，先看门缝下面有没有影子。&lt;/秦映雪&gt;' }
        ]);
    });

    it('keeps all bare colon lines as narration', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: [
                '地点：杨家堡后院',
                '任务：检查对话框',
                '林婉儿：真正的对白才需要头像。'
            ].join('\n')
        }] as any);

        expect(logs).toEqual([
            { sender: '旁白', text: '地点：杨家堡后院\n任务：检查对话框\n林婉儿：真正的对白才需要头像。' }
        ]);
    });

    it('does not treat narrative phrase prefixes as speaker names', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: [
                '随着她低头清点物资，墙角的灯光一点点暗下去。',
                '他是个正常的男人，如果是在旧时代，也许会有更轻松的选择。'
            ].join('\n')
        }] as any);

        expect(logs).toEqual([{
            sender: '旁白',
            text: '随着她低头清点物资，墙角的灯光一点点暗下去。\n他是个正常的男人，如果是在旧时代，也许会有更轻松的选择。'
        }]);
    });

    it('downgrades bogus speaker labels produced from narration snippets', () => {
        const logs = 规范化可渲染对白日志([
            { sender: '他摇了摇头', text: '至于玄铁精石，听起来确实不像普通矿材。' },
            { sender: '带来的极致眼力', text: '楚有常的视线从灯火里掠过。' }
        ] as any);

        expect(logs).toEqual([{
            sender: '旁白',
            text: '至于玄铁精石，听起来确实不像普通矿材。\n楚有常的视线从灯火里掠过。'
        }]);
    });

    it('downgrades body-part labels such as 双手 to narration', () => {
        const logs = 规范化可渲染对白日志([
            { sender: '双手', text: '慢慢合拢，指尖扣住杯沿。' },
            { sender: '指尖', text: '在杯壁上停了一瞬。' }
        ] as any);

        expect(logs).toEqual([{
            sender: '旁白',
            text: '慢慢合拢，指尖扣住杯沿。\n在杯壁上停了一瞬。'
        }]);
    });

    it('keeps raw debug source when body-part labels are downgraded', () => {
        const logs = 规范化可渲染对白日志([
            {
                sender: '双手',
                text: '慢慢合拢，指尖扣住杯沿。',
                rawText: '{\"sender\":\"双手\",\"text\":\"慢慢合拢，指尖扣住杯沿。\"}'
            }
        ] as any);

        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            sender: '旁白',
            text: '慢慢合拢，指尖扣住杯沿。'
        });
        expect(logs[0].rawText).toContain('\"sender\":\"双手\"');
    });

    it('does not split body-part bracket tags into character bubbles', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '她垂下眼。【双手】“慢慢合拢，像是把那点犹豫压回掌心。”烛火轻轻晃了一下。'
        }] as any);

        expect(logs).toEqual([{
            sender: '旁白',
            text: '她垂下眼。【双手】“慢慢合拢，像是把那点犹豫压回掌心。”烛火轻轻晃了一下。'
        }]);
    });

    it('keeps adjacent valid named turns as dialogue instead of narration', () => {
        const logs = 规范化可渲染对白日志([
            { sender: '楚有常', text: '玄铁精石不是凡火能炼的东西。' },
            { sender: '杨培强', text: '那就先封存，等找到合适的炉火再说。' }
        ] as any);

        expect(logs).toEqual([
            { sender: '楚有常', text: '玄铁精石不是凡火能炼的东西。' },
            { sender: '杨培强', text: '那就先封存，等找到合适的炉火再说。' }
        ]);
    });

    it('does not promote unlabeled follow-up lines that look like oral speech', () => {
        const oral = 规范化可渲染对白日志([{
            sender: '旁白',
            text: '俞月荷冷笑一声，将表格拍在桌上。\n三百点？你真觉得这点贡献够换一整箱药？'
        }] as any);

        expect(oral).toEqual([{
            sender: '旁白',
            text: '俞月荷冷笑一声，将表格拍在桌上。\n三百点？你真觉得这点贡献够换一整箱药？'
        }]);
    });

    it('does not infer a speaker from narrative adverbs before inner quoted thoughts', () => {
        const logs = 规范化可渲染对白日志([{
            sender: '旁白',
            text: [
                '她低下头，红宝石般的眼眸透过兜帽的阴影，死死盯着脚下那块青石。',
                '',
                '“只要走上去……就有白面馒头吃。”'
            ].join('\n')
        }] as any);

        expect(logs).toHaveLength(1);
        expect(logs[0]).toEqual({
            sender: '旁白',
            text: '她低下头，红宝石般的眼眸透过兜帽的阴影，死死盯着脚下那块青石。\n“只要走上去……就有白面馒头吃。”'
        });
        expect(logs.some(item => item.sender === '死死' || item.sender === '死')).toBe(false);
    });


    it('保留重复出现的显式角色标签，不把第二句降级为旁白', () => {
        const logs = 规范化可渲染对白日志([
            { sender: '旁白', text: '霍青鸾朝沈砚清望过去。他在等她说完。' },
            { sender: '霍青鸾', text: '"我与沈砚清，自十六岁圆房起，结为夫妇。十四载。"' },
            { sender: '霍青鸾', text: '自今日起，解。' },
            { sender: '旁白', text: '这一个解字砸在议事堂青砖地上。' }
        ]);

        expect(logs).toEqual([
            { sender: '旁白', text: '霍青鸾朝沈砚清望过去。他在等她说完。' },
            { sender: '霍青鸾', text: '"我与沈砚清，自十六岁圆房起，结为夫妇。十四载。"\n自今日起，解。' },
            { sender: '旁白', text: '这一个解字砸在议事堂青砖地上。' }
        ]);
    });
});
