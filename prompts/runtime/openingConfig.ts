import type { OpeningConfig } from '../../types';
import { 构建修炼体系附加块 } from '../../utils/promptFeatureToggles';
import { 获取题材开局配置文案, 规范化开局生成性别列表 } from '../../utils/openingConfig';
import { 获取题材模式配置, 题材是否仙侠 } from '../../utils/topicModeProfiles';
import { 规范化模式运行时配置 } from '../../utils/modeRuntimeProfile';

export const 是否仙侠开局模式 = (openingConfig?: OpeningConfig | null): boolean => (
    题材是否仙侠(openingConfig?.题材模式)
);

export const 构建题材模式提示词 = (openingConfig?: OpeningConfig | null): string => {
    const profile = 获取题材模式配置(openingConfig?.题材模式);
    const runtime = 规范化模式运行时配置(openingConfig?.modeRuntimeProfile, openingConfig?.题材模式);
    return [
        `【题材模式：${profile.label}】`,
        ...profile.promptLines.map((line) => `- ${line}`),
        `- 世界版图口径：${profile.mapPrompt}`,
        `- 交易/货币口径：${profile.currencyPrompt}`,
        `- 统一换算口径：${profile.currencyExchangePrompt}`,
        `- 运行时时间口径：${runtime.time.narrativeStyle}`,
        `- 正文时间表达允许：${runtime.time.allowedTimeTerms.join('、') || '无'}；禁止：${runtime.time.bannedTimeTerms.join('、') || '无'}。环境.时间仍是唯一真值，必须固定写成 \`YYYY:MM:DD:HH:MM\`。`,
        `- 时间推进口径：${runtime.time.progressionPrompt}`,
        `- 运行时组织口径：组织称为“${runtime.organization.organizationName}”，成员称为“${runtime.organization.memberName}”，贡献/信用称为“${runtime.organization.contributionName}”。`,
        `- 运行时能力口径：${runtime.ability.primaryAxis}；阶段/等级：${runtime.ability.progressionNames.join('、')}；技艺池：${runtime.ability.skillPool.join('、')}。`,
        `- 运行时物品口径：初始物品优先从 ${runtime.items.initialItemPool.join('、')} 中选择；奖励物品优先从 ${runtime.items.rewardItemPool.join('、')} 中选择；禁止混入 ${runtime.items.bannedItemKeywords.join('、') || '无'}。`,
        `- 运行时地图口径：地点类型优先使用 ${runtime.map.locationTypes.join('、')}；POI 优先使用 ${runtime.map.poiTypes.join('、') || '当前题材默认地点'}。`,
        `- 运行时生图口径：人物服饰=${runtime.image.characterClothingEra}；场景材质=${runtime.image.sceneMaterials}；负面提示=${runtime.image.negativePrompt || '无'}。`,
        '- 仍沿用现有变量树、境界层级、品质枚举和战斗结算口径；不要另造根路径或第二套不可落地字段。'
    ].join('\n');
};

export const 构建开局配置提示词 = (openingConfig?: OpeningConfig | null, openingExtraRequirement?: string): string => {
    if (!openingConfig) return '';
    if (openingConfig.配置约束启用 === false) return '';
    const 关系侧重 = Array.isArray(openingConfig.关系侧重) && openingConfig.关系侧重.length > 0
        ? openingConfig.关系侧重.join('、')
        : '无';
    const 允许生成性别 = 规范化开局生成性别列表(openingConfig.允许生成性别);
    const 开局文案 = 获取题材开局配置文案(openingConfig.题材模式);
    const blocks = [
        '【本次开局配置约束】',
        构建题材模式提示词(openingConfig),
        `- 关系侧重：${关系侧重}。生成初始社交网时，应优先让人物结构与关系情绪落在这些方向上。`,
        `- 开局切入偏好：${openingConfig.开局切入偏好}。第一幕镜头与气氛优先贴近该切入方式，不要无痕偏离。`,
        `- AI 生成角色性别硬约束：本次只允许新生成的 NPC、开局伙伴、组织成员、队友、路人、敌人与任务人物使用这些性别：${允许生成性别.join('、')}。不得生成未允许性别的新角色；不得用“未知性别/待定/不详”绕过限制。`,
        '- 主角性别以玩家建档为准，不受上述生成性别列表覆盖；同人原著章节中已明确存在且性别固定的角色也不强行改性别，但不要额外扩写未允许性别的新原创角色。',
        `- 题材开局边界：${开局文案.promptBoundary}`,
        openingConfig.开局生成门派 === false
            ? '- 开局组织变量：本次明确不生成 `玩家门派` 或等价门派/宗门变量；如题材需要组织归属，只写进地点、社交、任务或世界观语境，不写成门派系统。'
            : `- 开局组织变量：允许生成与题材匹配的初始组织，界面语义为“${开局文案.organizationTitle}”。`,
        openingConfig.开局生成同门 === false
            ? '- 开局成员名录：本次明确不生成同门/同道/队友名录变量；社交人物必须按剧情证据自然落位。'
            : `- 开局成员名录：允许生成与题材匹配的初始成员，界面语义为“${开局文案.memberTitle}”。`,
        '- 若开局偏好与建档、世界观存在冲突，以建档硬约束和 world_prompt 为上位，但仍应尽量保留关系侧重与切入偏好的方向。'
    ];
    if (openingExtraRequirement) {
        blocks.push(
            '',
            '【开局额外约束】',
            openingExtraRequirement
        );
    }
    return blocks.join('\n');
};

export const 构建世界观同人融合提示词 = (openingConfig?: OpeningConfig | null): string => {
    const fandom = openingConfig?.同人融合;
    const title = typeof fandom?.作品名 === 'string' ? fandom.作品名.trim() : '';
    if (!fandom?.enabled || !title) return '';
    const rolePolicy = fandom.保留原著角色
        ? `允许原著角色、原著势力或其直接变体进入世界母本，但仍要保证本项目${获取题材模式配置(openingConfig?.题材模式).label}成长体系与长期叙事可运行。`
        : '只吸收原著世界观母题、气质、势力逻辑、地理审美或价值冲突，不直接保留原著角色实体。';
    return [
        '【同人融合世界观要求】',
        `- 参考来源：${title}（${fandom.来源类型}）。`,
        `- 融合强度：${fandom.融合强度}。`,
        `- 角色保留策略：${rolePolicy}`,
        '- 此要求只作用于 world_prompt 生成，不要在世界观阶段写成粉丝设定清单、角色介绍或剧情提纲。',
        '- 融合后的结果仍必须是当前存档可长期运行的原创世界母本，并兼容本项目既有成长口径。',
        构建修炼体系附加块('- 若启用修炼体系，结果还必须兼容本项目既有境界口径。')
    ].join('\n');
};
