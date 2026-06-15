import { describe, expect, it } from 'vitest';
import { 创意工坊模块分区, 创意工坊模块列表 } from '../data/creativeWorkshopModules';
import { 标准化开局预设方案, 构建预设表单恢复结果 } from '../utils/customNewGamePresets';
import { 题材模式顺序 } from '../utils/topicModeProfiles';
import { 获取题材预设背景, 获取题材预设天赋 } from '../data/presets';

describe('creativeWorkshopModules', () => {
    it('规划分区均有当前可用模块', () => {
        const sectionIds = 创意工坊模块分区.map((section) => section.id);
        expect(sectionIds).toEqual(['topic', 'comfy_workflow']);
        for (const sectionId of sectionIds) {
            expect(创意工坊模块列表.some((entry) => entry.type === sectionId)).toBe(true);
        }
    });

    it('每个题材模式都有一个整合后的官方模式包', () => {
        for (const mode of 题材模式顺序) {
            const matches = 创意工坊模块列表.filter((entry) => (
                entry.source === 'builtin'
                && entry.type === 'topic'
                && entry.preset?.openingConfig?.题材模式 === mode
            ));
            expect(matches.length, mode).toBeGreaterThanOrEqual(1);
            const entry = matches[0];
            expect(entry.payload?.packagePart).toBe('mode_package');
            expect(Array.isArray(entry.modeWorldbooks), mode).toBe(true);
            expect(entry.modeWorldbooks?.[0]?.条目.length, mode).toBeGreaterThanOrEqual(4);
            expect(entry.modeWorldbooks?.[0]?.条目.some((item) => item.标题 === '运行时模式配置'), mode).toBe(true);
            expect(entry.payload?.modeWorldbooks).toEqual(entry.modeWorldbooks);
            expect(entry.modeRuntimeProfile?.identity.baseMode, mode).toBe(mode);
            expect(entry.modeRuntimeProfile?.time?.narrativeStyle, mode).toBeTruthy();
            expect(entry.modeRuntimeProfile?.opening?.allowedGeneratedGenders, mode).toEqual(['男', '女', '男娘', '扶她']);
            expect(entry.modeRuntimeProfile?.opening?.lockGeneratedGenders, mode).toBe(false);
            expect(entry.payload?.modeRuntimeProfile).toEqual(entry.modeRuntimeProfile);
            expect(entry.preset?.openingConfig?.modeRuntimeProfile?.identity.baseMode, mode).toBe(mode);
            expect(entry.preset?.openingConfig?.允许生成性别, mode).toEqual(['男', '女', '男娘', '扶她']);
            expect(entry.preset?.openingConfig?.生成性别锁定, mode).toBe(false);
            expect(entry.preset?.worldConfig?.modeRuntimeProfile?.identity.baseMode, mode).toBe(mode);
            expect(Array.isArray(entry.payload?.backgrounds), mode).toBe(true);
            expect(Array.isArray(entry.payload?.talents), mode).toBe(true);
            expect((entry.payload?.backgrounds as any[]).length, mode).toBeGreaterThanOrEqual(8);
            expect((entry.payload?.talents as any[]).length, mode).toBeGreaterThanOrEqual(8);
            expect(entry.payload?.backgrounds).toEqual(获取题材预设背景(mode));
            expect(entry.payload?.talents).toEqual(获取题材预设天赋(mode));
            const backgroundNames = new Set((entry.payload?.backgrounds as any[]).map((item) => item.名称));
            const talentNames = new Set((entry.payload?.talents as any[]).map((item) => item.名称));
            expect(backgroundNames.has(entry.preset?.character.背景名称), mode).toBe(true);
            for (const talentName of entry.preset?.character.天赋名称列表 || []) {
                expect(talentNames.has(talentName), `${mode}:${talentName}`).toBe(true);
            }
            expect(String(entry.payload?.manualWorldPrompt || '')).toBeTruthy();
            expect(String(entry.payload?.worldExtraRequirement || '')).toBeTruthy();
            expect(String(entry.payload?.manualRealmPrompt || '')).toBeTruthy();
        }
    });

    it('新建存档官方模式包恰好对应当前官方题材模式', () => {
        const entries = 创意工坊模块列表.filter((entry) => entry.source === 'builtin' && entry.contributor === '官方' && entry.type === 'topic');
        expect(entries.length).toBe(题材模式顺序.length);
        expect(new Set(entries.map((entry) => entry.preset?.openingConfig?.题材模式))).toEqual(new Set(题材模式顺序));
    });

    it('迁入的玩家题材按完整模式包提供单个整合模块', () => {
        for (const suiteId of ['community-rideress-suite', 'community-pokemon-suite']) {
            const entries = 创意工坊模块列表.filter((entry) => entry.payload?.suiteId === suiteId);
            expect(entries.length, suiteId).toBe(1);
            expect(entries[0].type, suiteId).toBe('topic');
            expect(entries[0].payload?.packagePart, suiteId).toBe('mode_package');
            expect(entries[0].modeWorldbooks?.[0]?.条目.some((entry) => entry.标题 === '世界规则'), suiteId).toBe(true);
            expect(entries[0].modeWorldbooks?.[0]?.条目.some((entry) => entry.标题 === '能力体系'), suiteId).toBe(true);
            expect(entries[0].modeWorldbooks?.[0]?.条目.some((entry) => entry.标题 === '运行时模式配置'), suiteId).toBe(true);
            expect(entries[0].modeRuntimeProfile?.identity.displayName, suiteId).toBeTruthy();
            expect(entries[0].payload?.modeRuntimeProfile, suiteId).toEqual(entries[0].modeRuntimeProfile);
            expect(entries.every((entry) => entry.formatVersion === 2 && entry.workshopKind === 'standard_module'), suiteId).toBe(true);
        }
    });

    it('女骑模式包继承西方奇幻基础模式', () => {
        for (const suiteId of ['community-rideress-suite']) {
            const entry = 创意工坊模块列表.find((item) => item.payload?.suiteId === suiteId);
            expect(entry?.modeRuntimeProfile?.identity.baseMode, suiteId).toBe('西方奇幻');
            expect(entry?.preset?.openingConfig?.题材模式, suiteId).toBe('西方奇幻');
            expect(entry?.payload?.modeRuntimeProfile?.identity.baseMode, suiteId).toBe('西方奇幻');
        }
    });

    it('末日生化感染规则已整合进末日模式包', () => {
        expect(创意工坊模块列表.some((entry) => entry.id === 'world-rules-zombie-classic')).toBe(false);
        const zombiePackage = 创意工坊模块列表.find((entry) => entry.id === 'mode-package-末日丧尸');
        expect(zombiePackage?.title).toBe('末日模式包');
        expect(zombiePackage?.payload?.worldExtraRequirement).toContain('感染');
        expect(zombiePackage?.payload?.worldExtraRequirement).toContain('营地');
    });

    it('每个模块都提供注入预览', () => {
        for (const entry of 创意工坊模块列表) {
            expect(entry.injectionPreview?.length, entry.id).toBeGreaterThan(0);
        }
    });

    it('可安装模块都能标准化为新建游戏开局预设', () => {
        const installable = 创意工坊模块列表.filter((entry) => entry.preset);
        expect(installable.length).toBeGreaterThanOrEqual(题材模式顺序.length);
        for (const entry of installable) {
            const normalized = 标准化开局预设方案(entry.preset);
            expect(normalized?.id).toBe(entry.preset?.id);
            expect(normalized?.openingConfig?.题材模式).toBeTruthy();
            expect(normalized?.openingConfig?.modeRuntimeProfile?.identity.baseMode).toBeTruthy();
            expect(normalized?.openingConfig?.允许生成性别).toEqual(expect.arrayContaining(['男', '女', '男娘', '扶她']));
            expect(normalized?.worldConfig?.modeRuntimeProfile?.identity.baseMode).toBe(normalized?.openingConfig?.modeRuntimeProfile?.identity.baseMode);
        }
    });

    it('标准化开局预设方案保留运行时恢复快照', () => {
        const normalized = 标准化开局预设方案({
            id: 'runtime_snapshot_case',
            名称: '运行时恢复测试',
            简介: '测试创意工坊运行时快照是否被保留',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '',
                manualWorldPrompt: '',
                manualRealmPrompt: ''
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: false,
                runtimeSnapshot: {
                    openingStreaming: false,
                    openingExtraRequirement: '恢复这个额外要求',
                    openingExtraPrompt: '恢复这个额外提示',
                    activeModuleExtraRules: '恢复模块额外规则',
                    modeWorldbooks: [{
                        id: 'book-1',
                        标题: '模式世界书',
                        描述: '模式说明',
                        常驻大纲: '',
                        启用: true,
                        内置: false,
                        条目: [],
                        创建时间: 0,
                        更新时间: 0
                    }],
                    workshopSelection: {
                        selectedMode: '武侠',
                        selectedModules: {
                            topic: 'builtin:topic-wuxia'
                        }
                    },
                    modeBackgrounds: [
                        { 名称: '工坊背景', 描述: '描述', 效果: '效果' }
                    ],
                    modeTalents: [
                        { 名称: '工坊天赋', 描述: '描述', 效果: '效果' }
                    ]
                }
            },
            openingStreaming: true,
            openingExtraRequirement: '表层额外要求'
        });

        expect(normalized?.openingConfig?.runtimeSnapshot).toEqual({
            openingStreaming: false,
            openingExtraRequirement: '恢复这个额外要求',
            openingExtraPrompt: '恢复这个额外提示',
            activeModuleExtraRules: '恢复模块额外规则',
            modeWorldbooks: [{
                id: 'book-1',
                标题: '模式世界书',
                描述: '模式说明',
                常驻大纲: '',
                启用: true,
                内置: false,
                条目: [],
                创建时间: 0,
                更新时间: 0
            }],
            workshopSelection: {
                selectedMode: '武侠',
                selectedModules: {
                    topic: 'builtin:topic-wuxia'
                }
            },
            modeBackgrounds: [
                { 名称: '工坊背景', 描述: '描述', 效果: '效果' }
            ],
            modeTalents: [
                { 名称: '工坊天赋', 描述: '描述', 效果: '效果' }
            ]
        });
    });

    it('预设表单恢复结果同时保留工坊天赋和题材预设天赋', () => {
        const preset = 标准化开局预设方案({
            id: 'restore_with_workshop_traits',
            名称: '工坊恢复测试',
            简介: '验证工坊天赋和题材预设天赋都能恢复',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '',
                manualWorldPrompt: '',
                manualRealmPrompt: ''
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打', '工坊天赋']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: false,
                runtimeSnapshot: {
                    modeBackgrounds: [
                        { 名称: '工坊背景', 描述: '描述', 效果: '效果' }
                    ],
                    modeTalents: [
                        { 名称: '工坊天赋', 描述: '描述', 效果: '效果' }
                    ]
                }
            }
        });

        const restored = 构建预设表单恢复结果(preset!, {
            fallbackBackgrounds: 获取题材预设背景('武侠'),
            fallbackTalents: 获取题材预设天赋('武侠')
        });

        expect(restored.模式包背景列表.map((item) => item.名称)).toContain('工坊背景');
        expect(restored.模式包天赋列表.map((item) => item.名称)).toContain('工坊天赋');
        expect(restored.全部背景选项.map((item) => item.名称)).toContain('宗门旧徒');
        expect(restored.全部背景选项.map((item) => item.名称)).toContain('工坊背景');
        expect(restored.全部天赋选项.map((item) => item.名称)).toContain('稳扎稳打');
        expect(restored.全部天赋选项.map((item) => item.名称)).toContain('工坊天赋');
        expect(restored.selectedTalents.map((item) => item.名称)).toEqual(['稳扎稳打', '工坊天赋']);
    });

    it('工坊天赋和官方预设天赋可在同一组同时恢复', () => {
        const preset = 标准化开局预设方案({
            id: 'restore_mixed_talent_sources',
            名称: '混合来源天赋恢复',
            简介: '验证工坊天赋与官方天赋同组恢复',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '',
                manualWorldPrompt: '',
                manualRealmPrompt: ''
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['纯阳体质', '劫后回甘']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: false,
                runtimeSnapshot: {
                    modeTalents: [
                        { 名称: '纯阳体质', 描述: '体内阳气充沛。', 效果: '长期提升阳属性修行、恢复与抗寒表现。' }
                    ]
                }
            }
        });

        const restored = 构建预设表单恢复结果(preset!, {
            fallbackBackgrounds: 获取题材预设背景('武侠'),
            fallbackTalents: 获取题材预设天赋('武侠'),
            selectedTalentCatalog: [
                ...获取题材预设天赋('武侠'),
                { 名称: '纯阳体质', 描述: '体内阳气充沛。', 效果: '长期提升阳属性修行、恢复与抗寒表现。' },
                { 名称: '劫后回甘', 描述: '你经历损伤后，常能从痛苦里沉淀出新的修行理解。', 效果: '长期提升伤后恢复、失败复盘、破境感悟和逆境成长。' }
            ]
        });

        expect(restored.模式包天赋列表.map((item) => item.名称)).toContain('纯阳体质');
        expect(restored.全部天赋选项.map((item) => item.名称)).toContain('纯阳体质');
        expect(restored.全部天赋选项.map((item) => item.名称)).toContain('劫后回甘');
        expect(restored.selectedTalents.map((item) => item.名称)).toEqual(['纯阳体质', '劫后回甘']);
    });

    it('预设表单恢复结果保留模式世界书与工坊模块选择状态', () => {
        const preset = 标准化开局预设方案({
            id: 'restore_workshop_selection',
            名称: '恢复工坊模块选择',
            简介: '验证模块选择状态与世界书恢复',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '',
                manualWorldPrompt: '',
                manualRealmPrompt: ''
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: false,
                runtimeSnapshot: {
                    modeWorldbooks: [{
                        id: 'topic-book',
                        标题: '题材口径',
                        描述: '题材说明',
                        常驻大纲: '',
                        启用: true,
                        内置: false,
                        条目: [],
                        创建时间: 0,
                        更新时间: 0
                    }],
                    workshopSelection: {
                        selectedMode: '武侠',
                        selectedModules: {
                            topic: 'builtin:topic-wuxia',
                            world_rules: 'builtin:world-rules-wuxia',
                            ability: 'builtin:ability-wuxia'
                        }
                    }
                }
            }
        });

        const restored = 构建预设表单恢复结果(preset!, {
            fallbackBackgrounds: 获取题材预设背景('武侠'),
            fallbackTalents: 获取题材预设天赋('武侠')
        });

        expect(restored.modeWorldbooks?.map((item) => item.id)).toEqual(['topic-book']);
        expect(restored.workshopSelection).toEqual({
            selectedMode: '武侠',
            selectedModules: {
                topic: 'builtin:topic-wuxia',
                world_rules: 'builtin:world-rules-wuxia',
                ability: 'builtin:ability-wuxia'
            }
        });
    });

    it('预设表单恢复结果会过滤失效的工坊模块选择', () => {
        const preset = 标准化开局预设方案({
            id: 'restore_workshop_selection_filtered',
            名称: '恢复工坊模块选择过滤',
            简介: '验证表单恢复会过滤失效模块',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '',
                manualWorldPrompt: '',
                manualRealmPrompt: ''
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: false,
                runtimeSnapshot: {
                    workshopSelection: {
                        selectedMode: '武侠',
                        selectedModules: {
                            topic: 'builtin:topic-wuxia',
                            world_rules: 'missing:world-rules',
                            ability: 'builtin:ability-wuxia'
                        }
                    }
                }
            }
        });

        const restored = 构建预设表单恢复结果(preset!, {
            fallbackBackgrounds: 获取题材预设背景('武侠'),
            fallbackTalents: 获取题材预设天赋('武侠'),
            validModuleKeys: new Set(['builtin:topic-wuxia', 'builtin:ability-wuxia'])
        });

        expect(restored.workshopSelection).toEqual({
            selectedMode: '武侠',
            selectedModules: {
                topic: 'builtin:topic-wuxia',
                ability: 'builtin:ability-wuxia'
            }
        });
    });

    it('预设表单恢复结果会按当前有效模块静默校准派生状态且不依赖旧快照残留', () => {
        const wuxiaTopic = 创意工坊模块列表.find((entry) => entry.source === 'builtin' && entry.id === 'mode-package-武侠');
        expect(wuxiaTopic).toBeTruthy();
        const preset = 标准化开局预设方案({
            id: 'restore_controlled_replay_recalibration',
            名称: '静默校准恢复',
            简介: '验证恢复后按当前模块静默校准派生状态',
            worldConfig: {
                worldName: '测试世界',
                worldSize: '九州宏大',
                dynastySetting: '测试王朝',
                sectDensity: '适中',
                tianjiaoSetting: '测试天骄',
                difficulty: 'normal',
                worldExtraRequirement: '旧世界要求',
                manualWorldPrompt: '旧世界提示',
                manualRealmPrompt: '旧境界提示'
            },
            character: {
                姓名: '测试角色',
                性别: '男',
                年龄: 18,
                出生月: 1,
                出生日: 1,
                外貌: '普通',
                性格: '谨慎',
                属性: { 力量: 5, 敏捷: 5, 体质: 5, 根骨: 5, 悟性: 5, 福源: 5 },
                背景名称: '宗门旧徒',
                天赋名称列表: ['稳扎稳打']
            },
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: false,
                modeRuntimeProfile: {
                    ...(wuxiaTopic!.modeRuntimeProfile as any),
                    identity: {
                        ...(wuxiaTopic!.modeRuntimeProfile as any).identity,
                        displayName: '过期模式名'
                    }
                },
                runtimeSnapshot: {
                    activeModuleExtraRules: '旧模块规则',
                    modeWorldbooks: [{
                        id: 'stale-book',
                        标题: '过期世界书',
                        描述: '过期说明',
                        常驻大纲: '',
                        启用: true,
                        内置: false,
                        条目: [],
                        创建时间: 0,
                        更新时间: 0
                    }],
                    modeBackgrounds: [
                        { 名称: '过期背景', 描述: '过期描述', 效果: '过期效果' }
                    ],
                    modeTalents: [
                        { 名称: '过期天赋', 描述: '过期描述', 效果: '过期效果' }
                    ],
                    workshopSelection: {
                        selectedMode: '武侠',
                        selectedModules: {
                            topic: 'builtin:mode-package-武侠'
                        }
                    }
                }
            }
        });

        const restored = 构建预设表单恢复结果(preset!, {
            fallbackBackgrounds: 获取题材预设背景('武侠'),
            fallbackTalents: 获取题材预设天赋('武侠'),
            validModuleKeys: new Set(['builtin:mode-package-武侠'])
        });

        expect(restored.模式包背景列表.map((item) => item.名称)).not.toContain('过期背景');
        expect(restored.模式包背景列表.map((item) => item.名称)).toEqual((wuxiaTopic!.payload.backgrounds as any[]).map((item) => item.名称));
        expect(restored.模式包天赋列表.map((item) => item.名称)).not.toContain('过期天赋');
        expect(restored.模式包天赋列表.map((item) => item.名称)).toEqual((wuxiaTopic!.payload.talents as any[]).map((item) => item.名称));
        expect(restored.modeWorldbooks?.map((item) => item.id)).toEqual(wuxiaTopic!.modeWorldbooks?.map((item) => item.id));
        expect(restored.activeModuleExtraRules).not.toBe('旧模块规则');
        expect(restored.modeRuntimeProfile?.identity.displayName).toBe(wuxiaTopic!.modeRuntimeProfile?.identity.displayName);
    });

    it('开局配置保留在新建存档流程，不作为创意工坊分区模块', () => {
        expect(创意工坊模块分区.some((section) => section.id === 'opening')).toBe(false);
        expect(创意工坊模块列表.some((entry) => entry.type === 'opening')).toBe(false);
    });
});
