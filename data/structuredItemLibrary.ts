import type { 物品品质, 物品类型 } from '../models/item';
import type { 题材模式类型 } from '../models/system';
import { 规范化题材模式 } from './workshopThemes/topicModeThemeData.ts';

export interface 结构化物品条目 {
    名称: string;
    材质?: string;
    物品: string;
    类型: 物品类型;
    品质: 物品品质;
    装备位置?: string;
    武器子类?: string;
    视觉标签: string[];
    生图描述: string;
    适用题材模式?: 题材模式类型[];
}

const 武器材质 = [
    { 名称: '木', 品质: '凡品', 标签: ['wood', 'plain wooden'] },
    { 名称: '竹', 品质: '凡品', 标签: ['bamboo', 'lightweight'] },
    { 名称: '铁', 品质: '凡品', 标签: ['dark iron', 'rough forged metal'] },
    { 名称: '钢', 品质: '良品', 标签: ['polished steel', 'refined metal'] },
    { 名称: '精钢', 品质: '良品', 标签: ['refined steel', 'clean craftsmanship'] },
    { 名称: '寒铁', 品质: '上品', 标签: ['cold iron', 'frosted dark metal'] },
    { 名称: '玄铁', 品质: '极品', 标签: ['black iron', 'heavy dark metal'] },
    { 名称: '乌金', 品质: '极品', 标签: ['blackened gold alloy', 'dark metallic sheen'] },
] as const;

const 金属防具材质 = [
    { 名称: '铁', 品质: '良品', 标签: ['iron plates', 'riveted metal'] },
    { 名称: '钢', 品质: '良品', 标签: ['steel plates', 'polished metal'] },
    { 名称: '精钢', 品质: '上品', 标签: ['refined steel armor', 'clean bright plates'] },
    { 名称: '寒铁', 品质: '上品', 标签: ['cold iron armor', 'frosted metal'] },
    { 名称: '玄铁', 品质: '极品', 标签: ['black iron armor', 'heavy dark plates'] },
    { 名称: '乌金', 品质: '极品', 标签: ['blackened gold armor', 'dark flexible scales'] },
] as const;

const 布衣材质 = [
    { 名称: '粗布', 品质: '凡品', 标签: ['coarse cloth', 'plain textile'] },
    { 名称: '布', 品质: '凡品', 标签: ['cloth', 'woven fabric'] },
] as const;

const 皮革防具材质 = [
    { 名称: '皮', 品质: '凡品', 标签: ['leather', 'stitched hide'] },
] as const;

const 武器模板 = [
    { 物品: '剑', 子类: '剑' },
    { 物品: '长剑', 子类: '剑' },
    { 物品: '短剑', 子类: '剑' },
    { 物品: '刀', 子类: '刀' },
    { 物品: '短刀', 子类: '刀' },
    { 物品: '匕首', 子类: '暗器' },
    { 物品: '枪', 子类: '枪' },
    { 物品: '矛', 子类: '枪' },
    { 物品: '棍', 子类: '棍' },
    { 物品: '杖', 子类: '棍' },
    { 物品: '弓', 子类: '暗器' },
    { 物品: '弩', 子类: '暗器' },
    { 物品: '飞刀', 子类: '暗器' },
    { 物品: '袖箭', 子类: '暗器' },
] as const;

const 硬防具模板 = [
    { 物品: '盔甲', 位置: '胸部' },
    { 物品: '护甲', 位置: '胸部' },
    { 物品: '软甲', 位置: '胸部' },
    { 物品: '护腕', 位置: '手部' },
    { 物品: '护腿', 位置: '腿部' },
    { 物品: '护膝', 位置: '腿部' },
    { 物品: '头盔', 位置: '头部' },
    { 物品: '发冠', 位置: '头部' },
] as const;

const 金属足具模板 = [
    { 物品: '靴', 位置: '足部' },
    { 物品: '鞋', 位置: '足部' },
] as const;

const 布衣模板 = [
    { 物品: '长衫', 位置: '胸部' },
    { 物品: '练功服', 位置: '胸部' },
    { 物品: '长裤', 位置: '腿部' },
    { 物品: '鞋', 位置: '足部' },
] as const;

const 皮革模板 = [
    { 物品: '护甲', 位置: '胸部' },
    { 物品: '软甲', 位置: '胸部' },
    { 物品: '护腕', 位置: '手部' },
    { 物品: '护腿', 位置: '腿部' },
    { 物品: '护膝', 位置: '腿部' },
    { 物品: '靴', 位置: '足部' },
    { 物品: '鞋', 位置: '足部' },
] as const;

const 无材质物品: 结构化物品条目[] = [
    { 名称: '金创药', 物品: '金创药', 类型: '消耗品', 品质: '凡品', 视觉标签: ['wound powder', 'paper packet', 'ceramic vial'], 生图描述: 'ancient wound medicine powder in a small paper packet or ceramic vial' },
    { 名称: '回气丹', 物品: '回气丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medicine pill', 'porcelain bottle'], 生图描述: 'small qi recovery medicinal pills in a porcelain bottle' },
    { 名称: '辟谷丹', 物品: '辟谷丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medicine pill', 'clay jar'], 生图描述: 'small fasting medicinal pills in a simple clay jar' },
    { 名称: '引气丹', 物品: '引气丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['pale blue pill', 'porcelain vial', 'spirit qi'], 生图描述: 'pale blue qi-guiding cultivation pills in a small unmarked porcelain vial, faint mist aura, no writing' },
    { 名称: '聚灵丹', 物品: '聚灵丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['green pill', 'jade bottle', 'spirit light'], 生图描述: 'round green spirit-gathering cultivation pills in a small jade bottle, subtle glowing aura, no writing' },
    { 名称: '凝元丹', 物品: '凝元丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['amber pill', 'jade case'], 生图描述: 'translucent amber cultivation pill stored in a small jade case' },
    { 名称: '筑基丹', 物品: '筑基丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['golden pill', 'jade case', 'foundation establishment'], 生图描述: 'golden foundation-establishment cultivation pill in a silk lined jade case, refined elixir glow, no label or text' },
    { 名称: '结金丹', 物品: '结金丹', 类型: '消耗品', 品质: '绝世', 视觉标签: ['deep gold pill', 'black jade box', 'core formation'], 生图描述: 'deep golden core-formation elixir pill in a black jade box, restrained spiritual glow, no writing' },
    { 名称: '凝婴丹', 物品: '凝婴丹', 类型: '消耗品', 品质: '传说', 视觉标签: ['violet pill', 'white jade case', 'nascent soul'], 生图描述: 'violet nascent-soul condensation elixir in a white jade case, ethereal aura, no text' },
    { 名称: '化神丹', 物品: '化神丹', 类型: '消耗品', 品质: '传说', 视觉标签: ['silver pill', 'spirit mist', 'ancient jade box'], 生图描述: 'silver spirit-transformation elixir pill in an ancient jade box, soft celestial mist, no writing' },
    { 名称: '清心丹', 物品: '清心丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['white pill', 'plain ceramic bowl', 'calming elixir'], 生图描述: 'small white calming cultivation pills in a plain ceramic bowl, clean apothecary still life, no writing' },
    { 名称: '破境丹', 物品: '破境丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['golden pill', 'wooden medicine box'], 生图描述: 'golden breakthrough pill in a silk lined wooden box' },
    { 名称: '大还丹', 物品: '大还丹', 类型: '消耗品', 品质: '绝世', 视觉标签: ['crimson pill', 'jade gourd'], 生图描述: 'legendary crimson healing pills in a plain jade gourd or small unmarked medicine bowl, no seal, no writing' },
    { 名称: '解毒散', 物品: '解毒散', 类型: '消耗品', 品质: '良品', 视觉标签: ['green medicinal powder', 'unmarked paper packet'], 生图描述: 'green antidote powder spilling from a plain unmarked folded paper packet, no writing' },
    { 名称: '续命丹', 物品: '续命丹', 类型: '消耗品', 品质: '极品', 视觉标签: ['red pill', 'bronze case'], 生图描述: 'deep red life extending pill with golden flecks in a bronze case' },
    { 名称: '寒铁矿', 材质: '寒铁', 物品: '矿石', 类型: '材料', 品质: '上品', 视觉标签: ['cold iron ore', 'frost crystals'], 生图描述: 'single chunk of cold iron ore with frost crystals on the surface, raw mineral only, no label' },
    { 名称: '铁木', 材质: '铁木', 物品: '木材', 类型: '材料', 品质: '良品', 视觉标签: ['dark dense wood', 'hard grain'], 生图描述: 'section of dense dark ironwood timber with heavy grain' },
    { 名称: '兽皮', 物品: '兽皮', 类型: '材料', 品质: '凡品', 视觉标签: ['animal hide', 'rough leather'], 生图描述: 'rough cured animal hide used as crafting leather' },
    { 名称: '千年灵芝', 物品: '千年灵芝', 类型: '材料', 品质: '极品', 视觉标签: ['lingzhi mushroom', 'rare herb'], 生图描述: 'single thousand year lingzhi mushroom with glossy red cap and golden spores, botanical specimen only, no label' },
    { 名称: '百年何首乌', 物品: '百年何首乌', 类型: '材料', 品质: '上品', 视觉标签: ['he shou wu root', 'medicinal herb'], 生图描述: 'century old he shou wu root with fibrous natural texture' },
    { 名称: '蛇胆', 物品: '蛇胆', 类型: '材料', 品质: '良品', 视觉标签: ['snake gallbladder organ', 'translucent dark green bile sac', 'medicinal ingredient', 'small porcelain dish'], 生图描述: 'one translucent dark green snake gallbladder organ, oval bile sac medicinal ingredient, placed on a small shallow white porcelain dish, wet glossy membrane, no snake body, no worm, no eel, no vial, no bottle' },
    { 名称: '基础剑法残卷', 物品: '秘籍残卷', 类型: '秘籍', 品质: '凡品', 视觉标签: ['torn scroll', 'faded ink diagram'], 生图描述: 'torn incomplete martial arts manual scroll with abstract faded practice diagrams, no readable writing' },
    { 名称: '吐纳心法', 物品: '秘籍', 类型: '秘籍', 品质: '良品', 视觉标签: ['paper scroll', 'breathing manual', 'ink diagrams', 'unreadable calligraphy strokes'], 生图描述: 'well preserved ancient cultivation scroll tied with silk ribbon, opened to show dense black ink-like unreadable calligraphy strokes and breathing meridian diagrams, clearly not blank, no readable real text' },
    { 名称: '轻身术', 物品: '秘籍', 类型: '秘籍', 品质: '良品', 视觉标签: ['silk scroll', 'movement manual'], 生图描述: 'thin silk martial arts scroll with abstract movement diagram silhouettes, no readable writing' },
    { 名称: '金钟罩', 物品: '秘籍', 类型: '秘籍', 品质: '上品', 视觉标签: ['ancient stitched book', 'martial arts manual', 'ink diagrams', 'aged paper'], 生图描述: 'ancient Chinese stitched martial arts book, blue cloth cover partly open, yellowed pages filled with black ink-like unreadable calligraphy strokes and body training diagrams, old book style, no readable real text' },
    { 名称: '九阳真经', 物品: '秘籍', 类型: '秘籍', 品质: '传说', 视觉标签: ['legendary scroll', 'martial arts scripture', 'golden silk scroll', 'ink calligraphy strokes'], 生图描述: 'legendary martial arts scripture scroll opened on parchment, golden silk edges, yellowed paper filled with dense black ink-like unreadable calligraphy strokes and red meridian diagrams, clearly a written scroll, no readable real text' },
    { 名称: '玉佩', 物品: '玉佩', 类型: '饰品', 品质: '良品', 视觉标签: ['white jade', 'silk cord'], 生图描述: 'carved white jade pendant with cloud motif and silk cord' },
    { 名称: '银簪', 材质: '银', 物品: '簪', 类型: '饰品', 品质: '良品', 视觉标签: ['silver hairpin', 'floral tip'], 生图描述: 'polished silver hairpin with delicate floral tip' },
    { 名称: '护身符', 物品: '护身符', 类型: '饰品', 品质: '上品', 视觉标签: ['talisman', 'plain brocade pouch'], 生图描述: 'protective talisman sealed inside a plain brocade pouch with geometric embroidery, no writing' },
    { 名称: '夜明珠', 物品: '夜明珠', 类型: '饰品', 品质: '极品', 视觉标签: ['glowing pearl', 'carved stand'], 生图描述: 'luminous night pearl glowing blue green on a carved stand' },
    { 名称: '玉骨扇', 物品: '玉骨扇', 类型: '法宝', 品质: '上品', 视觉标签: ['jade ribs', 'folded fan', 'silk fan leaf', 'tassel'], 生图描述: 'elegant folded Chinese hand fan with pale jade ribs, silk fan leaf and tassel, clearly a fan accessory, no blade' },
    { 名称: '火折子', 物品: '火折子', 类型: '杂物', 品质: '凡品', 视觉标签: ['bamboo fire starter', 'tinder'], 生图描述: 'bamboo fire starter tube with smoldering tinder and brass cap' },
    { 名称: '绳索', 物品: '绳索', 类型: '杂物', 品质: '凡品', 视觉标签: ['hemp rope', 'coil'], 生图描述: 'coil of rough braided hemp rope' },
    { 名称: '地图', 物品: '地图', 类型: '杂物', 品质: '良品', 视觉标签: ['aged paper map', 'ink routes'], 生图描述: 'hand drawn map on aged paper showing mountains rivers and paths' },
    { 名称: '现金', 材质: '纸币', 物品: '现金', 类型: '杂物', 品质: '凡品', 视觉标签: ['cash bills', 'currency'], 生图描述: 'small stack of modern cash bills' },
    { 名称: '迷魂香囊', 物品: '香囊', 类型: '任务道具', 品质: '上品', 视觉标签: ['fictional forbidden incense pouch', 'sealed brocade sachet', 'investigation evidence'], 生图描述: 'sealed ancient brocade incense sachet used as fictional contraband evidence, wax thread closure, no loose powder, no formula, no writing, no person' },
    { 名称: '合欢香丸', 物品: '香丸', 类型: '消耗品', 品质: '上品', 视觉标签: ['fictional romance incense pellets', 'lacquer case', 'plot prop'], 生图描述: 'small fictional romance-incense pellets sealed in a red lacquer case, elegant inventory prop, no ingredient detail, no label, no person' },
    { 名称: '清心解香丸', 物品: '解香丸', 类型: '消耗品', 品质: '良品', 视觉标签: ['clarity antidote pills', 'plain porcelain bottle', 'anti charm'], 生图描述: 'white clarity antidote pills in a plain porcelain bottle beside a folded paper packet, no readable text, no formula, no person' },
    { 名称: '醒神银针', 物品: '银针', 类型: '杂物', 品质: '良品', 视觉标签: ['silver needles', 'awareness aid', 'detective prop'], 生图描述: 'set of fine silver awareness needles arranged in a small wooden case, fictional investigation prop, no blood, no body, no text' },
    { 名称: '门派令牌', 物品: '令牌', 类型: '任务道具', 品质: '良品', 视觉标签: ['sect token', 'carved wood and bronze'], 生图描述: 'ancient sect identity token made of carved wood and bronze, abstract emblem only, no readable text' },
    { 名称: '镖局凭证', 物品: '凭证', 类型: '任务道具', 品质: '凡品', 视觉标签: ['escort agency voucher', 'paper seal'], 生图描述: 'folded ancient escort agency voucher with wax seal and unreadable ink strokes, no real text' },
    { 名称: '密函', 物品: '密函', 类型: '任务道具', 品质: '上品', 视觉标签: ['sealed letter', 'secret document'], 生图描述: 'sealed ancient secret letter tied with cord and wax seal, unreadable marks only, no real text' },
    { 名称: '铜钥匙', 材质: '铜', 物品: '钥匙', 类型: '任务道具', 品质: '凡品', 视觉标签: ['bronze key', 'old key'], 生图描述: 'single old bronze key with simple teeth on aged cloth, no label' },
    { 名称: '官府文牒', 物品: '文牒', 类型: '任务道具', 品质: '良品', 视觉标签: ['official writ', 'folded document', 'seal'], 生图描述: 'ancient official travel document with red seal and unreadable calligraphy-like strokes, no readable real text' },
    { 名称: '草鞋', 物品: '草鞋', 类型: '防具', 品质: '凡品', 装备位置: '足部', 视觉标签: ['straw sandals', 'woven straw footwear'], 生图描述: 'a pair of empty woven straw sandals, rustic ancient footwear, visible straw weave and simple ties' },
];

const 仙侠预设物品: 结构化物品条目[] = [
    { 名称: '淬体丹', 物品: '淬体丹', 类型: '消耗品', 品质: '凡品', 视觉标签: ['bronze pill', 'body tempering elixir', 'ceramic vial'], 生图描述: 'bronze body-tempering cultivation pills in a small unmarked ceramic vial, pre-modern apothecary still life, no writing' },
    { 名称: '洗髓丹', 物品: '洗髓丹', 类型: '消耗品', 品质: '上品', 视觉标签: ['white jade pill', 'marrow cleansing elixir', 'jade box'], 生图描述: 'white jade marrow-cleansing cultivation pill in a silk lined jade box, subtle spiritual mist, no writing' },
    { 名称: '护脉丹', 物品: '护脉丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['pale gold pill', 'meridian protection', 'porcelain bowl'], 生图描述: 'pale gold meridian-protecting cultivation pills in a small porcelain bowl, refined apothecary prop, no label' },
    { 名称: '回灵丹', 物品: '回灵丹', 类型: '消耗品', 品质: '良品', 视觉标签: ['blue green pill', 'spiritual recovery', 'jade bottle'], 生图描述: 'blue green spirit-recovery pills in a small jade bottle, faint qi glow, no writing' },
    { 名称: '培元丹', 物品: '培元丹', 类型: '消耗品', 品质: '上品', 视觉标签: ['amber pill', 'foundation nurturing', 'wooden case'], 生图描述: 'amber yuan-nourishing cultivation pills in a dark wooden medicine case, no readable text' },
    { 名称: '下品灵石', 物品: '灵石', 类型: '材料', 品质: '凡品', 视觉标签: ['spirit stone', 'pale crystal', 'raw mineral'], 生图描述: 'single pale translucent low grade spirit stone crystal, raw mineral with soft inner glow, no label' },
    { 名称: '中品灵石', 物品: '灵石', 类型: '材料', 品质: '良品', 视觉标签: ['spirit stone', 'blue crystal', 'raw mineral'], 生图描述: 'single blue translucent mid grade spirit stone crystal, raw mineral with clean inner glow, no label' },
    { 名称: '上品灵石', 物品: '灵石', 类型: '材料', 品质: '上品', 视觉标签: ['spirit stone', 'clear crystal', 'high grade mineral'], 生图描述: 'single clear high grade spirit stone crystal with bright inner light, raw mineral only, no text' },
    { 名称: '极品灵石', 物品: '灵石', 类型: '材料', 品质: '极品', 视觉标签: ['spirit stone', 'rainbow crystal', 'top grade mineral'], 生图描述: 'single top grade spirit stone crystal with subtle rainbow refraction, raw mineral specimen, no label' },
    { 名称: '灵晶', 物品: '灵晶', 类型: '材料', 品质: '极品', 视觉标签: ['spirit crystal', 'faceted crystal', 'dense qi'], 生图描述: 'dense faceted spirit crystal with concentrated inner glow, isolated raw cultivation material, no writing' },
    { 名称: '赤阳石', 物品: '矿石', 类型: '材料', 品质: '上品', 视觉标签: ['red sun stone', 'warm ore', 'orange crystal'], 生图描述: 'single red-orange sunstone ore chunk with warm glow and mineral veins, no label' },
    { 名称: '星辰砂', 物品: '矿砂', 类型: '材料', 品质: '上品', 视觉标签: ['star sand', 'silver grains', 'small dish'], 生图描述: 'small shallow dish of silver star-like mineral sand grains, crafting material, no writing' },
    { 名称: '空冥石', 物品: '矿石', 类型: '材料', 品质: '极品', 视觉标签: ['void stone', 'dark violet mineral', 'space ore'], 生图描述: 'single dark violet void stone ore with faint nebula-like inclusions, raw mineral only, no text' },
    { 名称: '雷击木', 物品: '木材', 类型: '材料', 品质: '上品', 视觉标签: ['lightning-struck wood', 'charred grain', 'crafting timber'], 生图描述: 'piece of lightning-struck wood with charred dark grain and pale inner streaks, natural timber material, no label' },
    { 名称: '灵竹', 物品: '竹材', 类型: '材料', 品质: '良品', 视觉标签: ['spirit bamboo', 'green bamboo segment', 'crafting material'], 生图描述: 'fresh green spirit bamboo segments with subtle natural sheen, crafting material still life, no writing' },
    { 名称: '月华草', 物品: '灵草', 类型: '材料', 品质: '良品', 视觉标签: ['moonlight herb', 'silver leaves', 'botanical specimen'], 生图描述: 'single moonlight herb specimen with silver-green leaves and small pale blossoms, botanical cultivation material, no label' },
    { 名称: '凝露草', 物品: '灵草', 类型: '材料', 品质: '凡品', 视觉标签: ['dew herb', 'green leaves', 'water drops'], 生图描述: 'green dew-gathering herb with clear droplets on leaves, botanical specimen only, no text' },
    { 名称: '血参', 物品: '灵药', 类型: '材料', 品质: '上品', 视觉标签: ['red ginseng', 'medicinal root', 'rare herb'], 生图描述: 'deep red blood ginseng root with branching organic texture, rare medicinal herb specimen, no label' },
    { 名称: '朱果', 物品: '灵果', 类型: '材料', 品质: '极品', 视觉标签: ['vermilion fruit', 'red fruit', 'spirit fruit'], 生图描述: 'single glossy vermilion spirit fruit with small leaves, pre-modern botanical treasure, no text' },
    { 名称: '妖丹', 物品: '妖丹', 类型: '材料', 品质: '极品', 视觉标签: ['demon core', 'round crystal core', 'monster core'], 生图描述: 'single round beast core crystal with layered inner glow, cultivation material displayed on a small stand, no writing' },
    { 名称: '炼气诀', 物品: '玉简', 类型: '秘籍', 品质: '凡品', 视觉标签: ['jade slip', 'cultivation manual', 'unreadable marks'], 生图描述: 'bundle of pale green jade slips tied with silk cord, ancient cultivation manual, abstract unreadable etched marks, no real text' },
    { 名称: '筑基心得', 物品: '玉简', 类型: '秘籍', 品质: '良品', 视觉标签: ['jade slip', 'foundation notes', 'unreadable marks'], 生图描述: 'small bundle of warm white jade slips with silk tie, foundation-establishment cultivation notes, abstract unreadable marks only' },
    { 名称: '御剑术', 物品: '玉简', 类型: '秘籍', 品质: '上品', 视觉标签: ['jade slip', 'sword technique', 'spirit manual'], 生图描述: 'green jade slip bundle for sword-riding technique, faint aura, etched abstract unreadable diagrams, no text' },
    { 名称: '小五行术', 物品: '玉简', 类型: '秘籍', 品质: '良品', 视觉标签: ['jade slip', 'five elements', 'colored cords'], 生图描述: 'jade slip cultivation manual with five colored silk cords, abstract unreadable elemental diagrams, no real writing' },
    { 名称: '太乙剑诀', 物品: '玉简', 类型: '秘籍', 品质: '极品', 视觉标签: ['jade slip', 'sword scripture', 'gold cord'], 生图描述: 'refined white jade slip bundle tied with gold silk cord, sword scripture aura, abstract unreadable etchings, no text' },
    { 名称: '炼丹初解', 物品: '玉简', 类型: '秘籍', 品质: '良品', 视觉标签: ['jade slip', 'alchemy manual', 'small furnace diagram'], 生图描述: 'jade slip alchemy manual beside a tiny unmarked bronze furnace charm, abstract unreadable diagrams, no text' },
    { 名称: '符箓入门', 物品: '玉简', 类型: '秘籍', 品质: '凡品', 视觉标签: ['jade slip', 'talisman manual', 'yellow cord'], 生图描述: 'jade slip talisman manual tied with yellow cord, abstract unreadable strokes and diagrams, no real writing' },
    { 名称: '火球符', 物品: '符箓', 类型: '消耗品', 品质: '凡品', 视觉标签: ['yellow talisman paper', 'red strokes', 'fire charm'], 生图描述: 'single yellow talisman paper charm with abstract red ink strokes and warm fire aura, no readable characters' },
    { 名称: '冰锥符', 物品: '符箓', 类型: '消耗品', 品质: '凡品', 视觉标签: ['blue talisman paper', 'cold aura', 'ice charm'], 生图描述: 'single blue-white talisman paper charm with abstract ink strokes and frost aura, no readable text' },
    { 名称: '雷光符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['purple talisman paper', 'lightning charm', 'ink strokes'], 生图描述: 'single purple talisman paper charm with abstract silver ink strokes and subtle lightning glow, no readable text' },
    { 名称: '金刚符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['gold talisman paper', 'protective charm', 'ink strokes'], 生图描述: 'single gold talisman paper charm with abstract dark ink strokes and protective glow, no real characters' },
    { 名称: '神行符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['yellow talisman paper', 'swift charm', 'wind aura'], 生图描述: 'single yellow talisman charm with abstract flowing ink strokes and light wind aura, no readable text' },
    { 名称: '隐身符', 物品: '符箓', 类型: '消耗品', 品质: '上品', 视觉标签: ['pale talisman paper', 'stealth charm', 'soft glow'], 生图描述: 'single pale translucent talisman paper charm with abstract gray ink strokes and soft vanishing aura, no readable text' },
    { 名称: '传音符', 物品: '符箓', 类型: '消耗品', 品质: '良品', 视觉标签: ['small talisman paper', 'message charm', 'blue thread'], 生图描述: 'small folded talisman paper charm tied with blue thread, abstract unreadable marks, communication charm still life' },
    { 名称: '传送符', 物品: '符箓', 类型: '消耗品', 品质: '极品', 视觉标签: ['silver talisman paper', 'teleport charm', 'ring pattern'], 生图描述: 'single silver talisman paper charm with abstract circular ink pattern and spatial glow, no readable characters' },
    { 名称: '摄魂符', 物品: '符箓', 类型: '任务道具', 品质: '极品', 视觉标签: ['fictional soul charm talisman', 'sealed evidence', 'purple ink'], 生图描述: 'single sealed purple talisman charm as fictional soul-bewitching contraband evidence, abstract ink strokes, wax seal, no readable characters, no person' },
    { 名称: '破妄清心符', 物品: '符箓', 类型: '消耗品', 品质: '上品', 视觉标签: ['anti illusion talisman', 'clarity charm', 'gold paper'], 生图描述: 'gold talisman charm for clarity and anti-illusion protection, abstract white ink pattern and clean aura, no readable text, no person' },
    { 名称: '定神玉佩', 物品: '玉佩', 类型: '饰品', 品质: '上品', 视觉标签: ['mind anchor jade pendant', 'anti charm accessory', 'white jade'], 生图描述: 'white jade mind-anchor pendant with silk cord and subtle clear glow, protective accessory prop, no readable text, no person' },
    { 名称: '六欲琉璃炉', 物品: '琉璃炉', 类型: '法宝', 品质: '绝世', 视觉标签: ['forbidden six desires glazed censer', 'cultivation treasure', 'sealed artifact'], 生图描述: 'realistic ancient glazed bronze censer as a forbidden six-desires cultivation artifact, lotus relief, sealed lid, faint pink-violet aura, no smoke cloud, no person, no text, no explicit imagery' },
    { 名称: '合欢迷神铃', 物品: '法铃', 类型: '法宝', 品质: '极品', 视觉标签: ['fictional charm bell', 'cultivation artifact', 'sealed evidence'], 生图描述: 'single ornate bronze ritual bell with red silk tassel as a fictional charm-mind artifact, photographed on dark cloth, no person, no readable text, no explicit imagery' },
    { 名称: '魅心摄魂镜', 物品: '宝镜', 类型: '法宝', 品质: '极品', 视觉标签: ['charm mirror artifact', 'soul capture mirror', 'cultivation prop'], 生图描述: 'round antique bronze mirror with cloudy rose-gold reflective surface as a fictional charm artifact, full object visible, no face reflection, no person, no text' },
    { 名称: '缚念红绫', 物品: '红绫', 类型: '法宝', 品质: '上品', 视觉标签: ['mind-binding red silk ribbon', 'cultivation artifact', 'sealed prop'], 生图描述: 'coiled crimson silk ribbon talisman artifact with small bronze clasps, realistic fabric texture, no body, no knots on a person, no text, no explicit imagery' },
    { 名称: '净欲明心镜', 物品: '宝镜', 类型: '法宝', 品质: '上品', 视觉标签: ['anti charm clarity mirror', 'protective artifact', 'cultivation'], 生图描述: 'small silver protective clarity mirror with pale jade inlay, anti-charm cultivation artifact, clean tabletop product photo, no person, no text' },
    { 名称: '断欲镇魂印', 物品: '法印', 类型: '法宝', 品质: '极品', 视觉标签: ['anti desire soul seal', 'protective artifact', 'cultivation treasure'], 生图描述: 'heavy black jade ritual seal used as a protective soul-stabilizing artifact, carved abstract cloud pattern, no readable writing, no person' },
    { 名称: '青竹飞剑', 物品: '飞剑', 类型: '法宝', 品质: '良品', 视觉标签: ['flying sword', 'bamboo green blade', 'jade hilt'], 生图描述: 'slender decorative cultivation flying sword artifact with bamboo-green sheath and jade hilt, ceremonial prop, no blood, no person' },
    { 名称: '寒霜飞剑', 物品: '飞剑', 类型: '法宝', 品质: '上品', 视觉标签: ['flying sword', 'frosted blade', 'white jade hilt'], 生图描述: 'slender frosted cultivation flying sword artifact with white jade hilt, cold aura, decorative ceremonial prop, no person' },
    { 名称: '紫电飞剑', 物品: '飞剑', 类型: '法宝', 品质: '极品', 视觉标签: ['flying sword', 'violet lightning', 'dark scabbard'], 生图描述: 'refined violet lightning flying sword artifact with dark scabbard and silver fittings, ceremonial display prop, no person' },
    { 名称: '青玉葫芦', 物品: '葫芦', 类型: '法宝', 品质: '上品', 视觉标签: ['green jade gourd', 'magic vessel', 'silk cord'], 生图描述: 'green jade cultivation gourd vessel with silk cord and cork stopper, elegant magic treasure prop, no writing' },
    { 名称: '养魂铃', 物品: '铃铛', 类型: '法宝', 品质: '上品', 视觉标签: ['soul bell', 'bronze bell', 'red cord'], 生图描述: 'small bronze soul-nourishing bell treasure tied with red cord, antique patina, no text' },
    { 名称: '镇魂铃', 物品: '铃铛', 类型: '法宝', 品质: '极品', 视觉标签: ['soul-suppressing bell', 'dark bronze', 'jade bead'], 生图描述: 'dark bronze soul-suppressing bell with jade bead and old tassel, cultivation magic treasure prop, no writing' },
    { 名称: '玄光镜', 物品: '宝镜', 类型: '法宝', 品质: '极品', 视觉标签: ['mystic mirror', 'bronze mirror', 'round artifact'], 生图描述: 'round bronze mystic light mirror artifact with cloudy polished surface and carved rim, no readable characters' },
    { 名称: '八卦镜', 物品: '宝镜', 类型: '法宝', 品质: '上品', 视觉标签: ['bagua mirror', 'bronze mirror', 'protective artifact'], 生图描述: 'round protective bronze mirror artifact with abstract geometric rim motifs, no readable characters or real text' },
    { 名称: '缚妖索', 物品: '法索', 类型: '法宝', 品质: '上品', 视觉标签: ['binding rope', 'gold cord', 'talisman knots'], 生图描述: 'coiled golden binding rope magic treasure with simple knot charms and tassels, no readable talisman text' },
    { 名称: '储物袋', 物品: '储物袋', 类型: '法宝', 品质: '良品', 视觉标签: ['storage pouch', 'embroidered cloth bag', 'drawstring'], 生图描述: 'small embroidered cloth storage pouch with drawstring and jade bead, cultivation inventory treasure, no writing' },
    { 名称: '储物戒', 物品: '储物戒', 类型: '法宝', 品质: '上品', 视觉标签: ['storage ring', 'silver ring', 'tiny gemstone'], 生图描述: 'single silver storage ring with small green gemstone, cultivation artifact accessory, no hand, no text' },
    { 名称: '灵兽袋', 物品: '灵兽袋', 类型: '法宝', 品质: '上品', 视觉标签: ['spirit beast pouch', 'leather pouch', 'tassel'], 生图描述: 'small spirit beast pouch made of soft leather and brocade, drawstring and tassel, no animal visible, no writing' },
    { 名称: '聚灵阵盘', 物品: '阵盘', 类型: '法宝', 品质: '上品', 视觉标签: ['array disk', 'jade disk', 'geometric grooves'], 生图描述: 'round jade spirit-gathering array disk with carved abstract geometric grooves and inlaid stones, no readable text' },
    { 名称: '护山阵盘', 物品: '阵盘', 类型: '法宝', 品质: '极品', 视觉标签: ['array disk', 'bronze jade disk', 'protective formation'], 生图描述: 'large bronze and jade protective array disk with abstract concentric geometric grooves, no readable characters' },
    { 名称: '寻灵罗盘', 物品: '罗盘', 类型: '法宝', 品质: '良品', 视觉标签: ['spirit compass', 'bronze compass', 'pointer'], 生图描述: 'small bronze spirit-seeking compass with central pointer and abstract carved rings, no readable text' },
    { 名称: '紫铜丹炉', 物品: '丹炉', 类型: '法宝', 品质: '良品', 视觉标签: ['alchemy furnace', 'purple bronze', 'three legs'], 生图描述: 'small three-legged purple bronze alchemy furnace with lid and handles, tabletop cultivation tool, no text' },
    { 名称: '玄铁丹炉', 物品: '丹炉', 类型: '法宝', 品质: '极品', 视觉标签: ['alchemy furnace', 'black iron', 'three legs'], 生图描述: 'heavy three-legged black iron alchemy furnace with lid, carved abstract cloud motifs, no readable characters' },
    { 名称: '炼器锤', 物品: '炼器锤', 类型: '法宝', 品质: '良品', 视觉标签: ['artifact forging hammer', 'bronze hammer', 'wood handle'], 生图描述: 'small artifact-forging hammer with bronze head and dark wooden handle, cultivation crafting tool, no text' },
    { 名称: '青云法袍', 物品: '法袍', 类型: '防具', 品质: '良品', 装备位置: '胸部', 视觉标签: ['cultivation robe', 'blue green fabric', 'cloud trim'], 生图描述: 'blue-green cultivation robe laid flat, soft woven fabric with abstract cloud trim, no person, no readable text' },
    { 名称: '月白法袍', 物品: '法袍', 类型: '防具', 品质: '上品', 装备位置: '胸部', 视觉标签: ['cultivation robe', 'moon white fabric', 'silver trim'], 生图描述: 'moon-white cultivation robe laid flat with silver trim and soft fabric folds, no person, no text' },
    { 名称: '玄纹法冠', 物品: '法冠', 类型: '防具', 品质: '上品', 装备位置: '头部', 视觉标签: ['cultivation crown', 'dark jade', 'hair crown'], 生图描述: 'dark jade cultivation hair crown accessory with simple geometric motifs, isolated headwear prop, no person' },
    { 名称: '避尘靴', 物品: '法靴', 类型: '防具', 品质: '良品', 装备位置: '足部', 视觉标签: ['cultivation boots', 'cloth boots', 'white soles'], 生图描述: 'pair of empty clean cloth cultivation boots placed side by side, visible hollow openings and stitched soles, no feet' },
    { 名称: '宗门令牌', 物品: '令牌', 类型: '任务道具', 品质: '良品', 视觉标签: ['cultivation sect token', 'jade and bronze'], 生图描述: 'xianxia sect identity token made of jade and bronze with abstract emblem, no readable text' },
    { 名称: '秘境钥匙', 物品: '钥匙', 类型: '任务道具', 品质: '极品', 视觉标签: ['mystic key', 'ancient jade key', 'spatial gate'], 生图描述: 'single ancient jade key for a mystic realm gate, faint spatial glow, no text' },
    { 名称: '传承玉符', 物品: '玉符', 类型: '任务道具', 品质: '绝世', 视觉标签: ['inheritance jade talisman', 'glowing jade token'], 生图描述: 'small glowing jade inheritance talisman with abstract engraved patterns, no readable characters' },
    { 名称: '洞府禁牌', 物品: '禁牌', 类型: '任务道具', 品质: '上品', 视觉标签: ['cave mansion pass token', 'dark jade plaque'], 生图描述: 'dark jade cave-mansion access plaque with abstract seal marks, no readable text' },
];

const 西方奇幻预设物品: 结构化物品条目[] = [
    { 名称: '骑士长剑', 材质: '钢', 物品: '长剑', 类型: '武器', 品质: '良品', 武器子类: '剑', 视觉标签: ['western fantasy', 'medieval arming sword', 'polished steel', 'leather grip', 'crossguard'], 生图描述: 'medieval arming sword with polished steel blade, simple crossguard, leather wrapped grip and round pommel, isolated museum prop, no blood' },
    { 名称: '冒险者短剑', 材质: '钢', 物品: '短剑', 类型: '武器', 品质: '凡品', 武器子类: '剑', 视觉标签: ['western fantasy', 'short sword', 'simple steel', 'worn leather grip'], 生图描述: 'practical medieval short sword with worn leather grip and plain steel blade, single inventory prop, no person' },
    { 名称: '猎人匕首', 材质: '钢', 物品: '匕首', 类型: '武器', 品质: '凡品', 武器子类: '暗器', 视觉标签: ['western fantasy', 'hunting dagger', 'small blade', 'leather sheath'], 生图描述: 'small hunting dagger with leather sheath beside it, simple steel blade, realistic product photo, no blood' },
    { 名称: '橡木法杖', 材质: '橡木', 物品: '法杖', 类型: '武器', 品质: '良品', 武器子类: '棍', 视觉标签: ['western fantasy', 'wizard staff', 'oak wood', 'small crystal'], 生图描述: 'oak wizard staff with a small blue crystal set near the top, carved wooden grain, isolated prop, restrained magic glow' },
    { 名称: '牧师钉头锤', 材质: '铁', 物品: '钉头锤', 类型: '武器', 品质: '良品', 武器子类: '棍', 视觉标签: ['western fantasy', 'mace', 'iron head', 'wooden handle'], 生图描述: 'medieval iron mace with a flanged head and wooden handle, ceremonial display prop, no violence' },
    { 名称: '战斧', 材质: '铁', 物品: '战斧', 类型: '武器', 品质: '良品', 武器子类: '刀', 视觉标签: ['western fantasy', 'battle axe', 'iron blade', 'wooden haft'], 生图描述: 'single medieval battle axe with iron blade and wooden haft, catalog product photo, no blood' },
    { 名称: '长矛', 材质: '铁', 物品: '矛', 类型: '武器', 品质: '凡品', 武器子类: '枪', 视觉标签: ['western fantasy', 'spear', 'wooden shaft', 'iron spearhead'], 生图描述: 'medieval spear with long wooden shaft and iron leaf-shaped spearhead, isolated diagonal product shot' },
    { 名称: '短弓', 物品: '弓', 类型: '武器', 品质: '凡品', 武器子类: '暗器', 视觉标签: ['western fantasy', 'short bow', 'wood', 'bowstring'], 生图描述: 'simple medieval short bow with taut bowstring, one quiver strap nearby but no arrows flying, isolated prop' },
    { 名称: '轻弩', 物品: '弩', 类型: '武器', 品质: '良品', 武器子类: '暗器', 视觉标签: ['western fantasy', 'crossbow', 'wood stock', 'iron limbs'], 生图描述: 'compact medieval crossbow with wooden stock, iron bow limbs and trigger, museum prop only, no projectile in flight' },
    { 名称: '圆盾', 材质: '木铁', 物品: '盾', 类型: '防具', 品质: '凡品', 装备位置: '手部', 视觉标签: ['western fantasy', 'round shield', 'wooden shield', 'iron boss'], 生图描述: 'round wooden shield with iron rim and central boss, worn leather straps visible, isolated product photo' },
    { 名称: '皮甲', 材质: '皮革', 物品: '护甲', 类型: '防具', 品质: '凡品', 装备位置: '胸部', 视觉标签: ['western fantasy', 'leather armor', 'stitched hide', 'buckles'], 生图描述: 'empty medieval leather chest armor laid flat, stitched hide panels and buckle straps, no mannequin, no person' },
    { 名称: '锁子甲', 材质: '铁', 物品: '锁子甲', 类型: '防具', 品质: '良品', 装备位置: '胸部', 视觉标签: ['western fantasy', 'chainmail shirt', 'interlocking rings'], 生图描述: 'empty medieval chainmail shirt folded on a table, interlocking iron rings, no person wearing it' },
    { 名称: '板甲胸甲', 材质: '钢', 物品: '胸甲', 类型: '防具', 品质: '上品', 装备位置: '胸部', 视觉标签: ['western fantasy', 'plate breastplate', 'polished steel'], 生图描述: 'polished steel plate breastplate photographed alone, medieval armor chest piece, no full armor suit, no person' },
    { 名称: '铁盔', 材质: '铁', 物品: '头盔', 类型: '防具', 品质: '良品', 装备位置: '头部', 视觉标签: ['western fantasy', 'iron helmet', 'nasal guard'], 生图描述: 'single medieval iron helmet with nasal guard, worn metal texture, empty helmet on neutral background' },
    { 名称: '兜帽披风', 物品: '披风', 类型: '防具', 品质: '凡品', 装备位置: '胸部', 视觉标签: ['western fantasy', 'hooded cloak', 'wool cloth'], 生图描述: 'empty hooded wool cloak laid flat with hood visible, travel-worn fabric, no person or mannequin' },
    { 名称: '皮靴', 材质: '皮革', 物品: '靴', 类型: '防具', 品质: '凡品', 装备位置: '足部', 视觉标签: ['western fantasy', 'leather boots', 'travel footwear'], 生图描述: 'pair of empty medieval leather travel boots lying side by side, scuffed soles, visible hollow openings' },
    { 名称: '旅行干粮', 物品: '干粮', 类型: '消耗品', 品质: '凡品', 视觉标签: ['western fantasy', 'travel rations', 'hard bread', 'dried meat', 'cloth wrap'], 生图描述: 'bundle of medieval travel rations: hard bread, dried meat and cheese wrapped in plain cloth, no label' },
    { 名称: '清水水囊', 物品: '水囊', 类型: '消耗品', 品质: '凡品', 视觉标签: ['western fantasy', 'waterskin', 'leather flask'], 生图描述: 'leather waterskin flask with cork stopper and strap, slightly worn travel gear, no writing' },
    { 名称: '治疗药水', 物品: '药水', 类型: '消耗品', 品质: '良品', 视觉标签: ['western fantasy', 'healing potion', 'red glass vial', 'cork'], 生图描述: 'small round glass vial of red healing potion with cork stopper, wax seal without text, realistic glass and liquid' },
    { 名称: '法力药水', 物品: '药水', 类型: '消耗品', 品质: '良品', 视觉标签: ['western fantasy', 'mana potion', 'blue glass vial', 'cork'], 生图描述: 'small glass vial of blue mana potion with cork stopper, subtle liquid glow, no label or runes' },
    { 名称: '解毒药剂', 物品: '药剂', 类型: '消耗品', 品质: '良品', 视觉标签: ['western fantasy', 'antidote', 'green vial', 'apothecary'], 生图描述: 'green antidote potion in a small unmarked apothecary vial, cork stopper, no readable text' },
    { 名称: '魅惑药剂', 物品: '药剂', 类型: '任务道具', 品质: '上品', 视觉标签: ['western fantasy', 'fictional charm potion', 'sealed pink vial', 'contraband evidence'], 生图描述: 'sealed pink fictional charm potion vial kept as contraband evidence, cork and wax seal, no label, no formula, no person' },
    { 名称: '沉眠熏香', 物品: '熏香', 类型: '任务道具', 品质: '良品', 视觉标签: ['western fantasy', 'sleep incense', 'sealed incense tin', 'mystery prop'], 生图描述: 'small sealed medieval apothecary incense tin for fictional sleep magic, wax cord closure, no loose powder, no readable text, no person' },
    { 名称: '反魅惑护符', 物品: '护符', 类型: '饰品', 品质: '上品', 视觉标签: ['western fantasy', 'anti charm amulet', 'silver ward'], 生图描述: 'silver anti-charm amulet with abstract moon and knot relief, protective fantasy accessory, no readable letters, no person' },
    { 名称: '火把', 物品: '火把', 类型: '杂物', 品质: '凡品', 视觉标签: ['western fantasy', 'torch', 'wooden handle', 'cloth wrapped end'], 生图描述: 'unlit wooden torch with cloth wrapped head and tar-darkened end, single object on neutral tabletop, no flame scene' },
    { 名称: '火绒盒', 物品: '火绒盒', 类型: '杂物', 品质: '凡品', 视觉标签: ['western fantasy', 'tinderbox', 'flint', 'steel striker'], 生图描述: 'small metal tinderbox opened to show flint, steel striker and dry tinder, no text' },
    { 名称: '冒险者绳索', 物品: '绳索', 类型: '杂物', 品质: '凡品', 视觉标签: ['western fantasy', 'hemp rope', 'adventuring gear'], 生图描述: 'coil of thick hemp rope with a simple brass hook, adventurer utility gear, no label' },
    { 名称: '王国地图', 物品: '地图', 类型: '杂物', 品质: '良品', 视觉标签: ['western fantasy', 'parchment map', 'kingdom roads'], 生图描述: 'aged parchment kingdom map with abstract roads, rivers and mountain symbols, no readable names or letters' },
    { 名称: '指南针', 物品: '指南针', 类型: '杂物', 品质: '良品', 视觉标签: ['western fantasy', 'brass compass', 'navigation'], 生图描述: 'brass compass with glass cover on parchment background, abstract dial marks only, no readable letters' },
    { 名称: '公会徽章', 物品: '徽章', 类型: '饰品', 品质: '良品', 视觉标签: ['western fantasy', 'adventurer guild badge', 'bronze emblem'], 生图描述: 'bronze adventurer guild badge with abstract crossed-tool emblem, no letters, no readable symbol text' },
    { 名称: '护佑圣徽', 物品: '圣徽', 类型: '饰品', 品质: '上品', 视觉标签: ['western fantasy', 'holy symbol', 'silver amulet'], 生图描述: 'silver holy amulet with abstract sunburst relief on a chain, no readable letters, no real religious symbol' },
    { 名称: '魔晶吊坠', 物品: '吊坠', 类型: '饰品', 品质: '上品', 视觉标签: ['western fantasy', 'mana crystal pendant', 'blue crystal', 'silver chain'], 生图描述: 'blue mana crystal pendant set in a simple silver frame, small chain, realistic mineral glow, no text' },
    { 名称: '家族纹章戒指', 物品: '戒指', 类型: '饰品', 品质: '良品', 视觉标签: ['western fantasy', 'signet ring', 'brass ring', 'blank crest'], 生图描述: 'brass signet ring with blank abstract crest, photographed alone, no letters or readable heraldry' },
    { 名称: '铁矿石', 物品: '矿石', 类型: '材料', 品质: '凡品', 视觉标签: ['western fantasy', 'iron ore', 'raw mineral'], 生图描述: 'single raw iron ore chunk with dark metallic veins, mineral specimen, no label' },
    { 名称: '秘银矿石', 物品: '矿石', 类型: '材料', 品质: '上品', 视觉标签: ['western fantasy', 'mithril ore', 'silver blue mineral'], 生图描述: 'single silver-blue mithril ore chunk with fine metallic veins, raw fantasy mineral, no text' },
    { 名称: '魔晶', 物品: '魔晶', 类型: '材料', 品质: '上品', 视觉标签: ['western fantasy', 'mana crystal', 'blue crystal', 'magic material'], 生图描述: 'faceted blue mana crystal as a raw magical crafting material, subtle inner glow, no jewelry setting' },
    { 名称: '狼皮', 物品: '兽皮', 类型: '材料', 品质: '凡品', 视觉标签: ['western fantasy', 'wolf pelt', 'fur hide'], 生图描述: 'rough cured grey wolf pelt folded as crafting leather material, no animal body, no blood' },
    { 名称: '龙鳞', 物品: '鳞片', 类型: '材料', 品质: '极品', 视觉标签: ['western fantasy', 'dragon scale', 'iridescent scale'], 生图描述: 'single iridescent dragon scale displayed on dark cloth, hard enamel texture, no creature, no text' },
    { 名称: '银叶草', 物品: '草药', 类型: '材料', 品质: '良品', 视觉标签: ['western fantasy', 'silverleaf herb', 'botanical specimen'], 生图描述: 'small silver-green medicinal herb sprig with pale leaves, botanical specimen on parchment, no label' },
    { 名称: '初级魔法书', 物品: '魔法书', 类型: '秘籍', 品质: '凡品', 视觉标签: ['western fantasy', 'spellbook', 'leather cover', 'unreadable diagrams'], 生图描述: 'small worn leather spellbook opened to pages with abstract unreadable arcane diagrams, no real letters or symbols' },
    { 名称: '火球术卷轴', 物品: '魔法卷轴', 类型: '秘籍', 品质: '良品', 视觉标签: ['western fantasy', 'spell scroll', 'fire magic', 'parchment'], 生图描述: 'rolled parchment spell scroll partly open, abstract red ink circles and fire motif, no readable text or letters' },
    { 名称: '治疗祷文', 物品: '祷文书页', 类型: '秘籍', 品质: '良品', 视觉标签: ['western fantasy', 'healing prayer page', 'parchment', 'gold border'], 生图描述: 'single parchment prayer page with gold border and abstract unreadable script-like lines, no real text' },
    { 名称: '炼金笔记', 物品: '炼金笔记', 类型: '秘籍', 品质: '上品', 视觉标签: ['western fantasy', 'alchemy notebook', 'diagram pages'], 生图描述: 'open alchemy notebook with abstract potion diagrams, glass vial sketch shapes, unreadable marks only, no real text' },
    { 名称: '委托羊皮卷', 物品: '委托书', 类型: '任务道具', 品质: '凡品', 视觉标签: ['western fantasy', 'quest parchment', 'wax seal'], 生图描述: 'rolled quest parchment tied with cord and plain wax seal, abstract unreadable lines only, no real letters' },
    { 名称: '冒险者执照', 物品: '执照', 类型: '任务道具', 品质: '良品', 视觉标签: ['western fantasy', 'adventurer license', 'metal token', 'parchment card'], 生图描述: 'adventurer license set: small bronze token beside blank parchment card with unreadable marks, no readable text' },
    { 名称: '地牢钥匙', 材质: '铁', 物品: '钥匙', 类型: '任务道具', 品质: '凡品', 视觉标签: ['western fantasy', 'dungeon key', 'old iron key'], 生图描述: 'large old iron dungeon key with simple teeth, lying on worn leather, no label' },
    { 名称: '铜币袋', 物品: '钱袋', 类型: '杂物', 品质: '凡品', 视觉标签: ['western fantasy', 'copper coins', 'coin pouch'], 生图描述: 'small leather pouch spilled with plain copper coins, no faces, no letters, no readable mint marks' },
    { 名称: '银币袋', 物品: '钱袋', 类型: '杂物', 品质: '良品', 视觉标签: ['western fantasy', 'silver coins', 'coin pouch'], 生图描述: 'small leather pouch spilled with plain silver coins, no portraits, no letters, no readable mint marks' },
    { 名称: '金币袋', 物品: '钱袋', 类型: '杂物', 品质: '上品', 视觉标签: ['western fantasy', 'gold coins', 'coin pouch'], 生图描述: 'small leather pouch spilled with plain gold coins, no portraits, no letters, no readable mint marks' },
];

const 现代预设物品: 结构化物品条目[] = [
    { 名称: '智能手机', 物品: '智能手机', 类型: '杂物', 品质: '良品', 视觉标签: ['smartphone', 'cracked screen', 'modern device'], 生图描述: 'used modern smartphone with a slightly cracked screen, isolated product prop, no readable text' },
    { 名称: '录音笔', 物品: '录音笔', 类型: '杂物', 品质: '上品', 视觉标签: ['digital voice recorder', 'investigation tool'], 生图描述: 'small black digital voice recorder on a desk, modern investigation prop, no readable text' },
    { 名称: '笔记本电脑', 物品: '笔记本电脑', 类型: '杂物', 品质: '上品', 视觉标签: ['laptop', 'modern electronics'], 生图描述: 'closed slim laptop with worn edges, modern urban prop, no logo, no readable text' },
    { 名称: '急救包', 物品: '急救包', 类型: '消耗品', 品质: '良品', 视觉标签: ['first aid kit', 'medical supplies'], 生图描述: 'compact first aid kit opened to show bandages and medical supplies, no readable labels' },
    { 名称: '防割手套', 物品: '防割手套', 类型: '防具', 品质: '良品', 装备位置: '手部', 视觉标签: ['cut resistant gloves', 'work safety gear'], 生图描述: 'pair of grey cut-resistant work gloves, modern safety gear, isolated product photo' },
    { 名称: '古玉残佩', 物品: '古玉残佩', 类型: '饰品', 品质: '上品', 视觉标签: ['ancient jade pendant', 'modern antique market'], 生图描述: 'small incomplete antique jade pendant on a dark cloth, subtle mysterious aura, no text' },
    { 名称: '银行卡', 物品: '银行卡', 类型: '杂物', 品质: '良品', 视觉标签: ['bank card', 'modern payment card'], 生图描述: 'plain modern bank card on a desk, no logo, no numbers, no readable text' },
    { 名称: '现金信封', 物品: '现金信封', 类型: '杂物', 品质: '凡品', 视觉标签: ['cash envelope', 'modern currency'], 生图描述: 'plain paper envelope partly open with generic cash-like paper slips, no readable text or numbers' },
    { 名称: '合同文件', 物品: '合同文件', 类型: '任务道具', 品质: '良品', 视觉标签: ['contract document', 'signature pages'], 生图描述: 'modern contract folder with clipped pages and unreadable lines, no real text, no readable signatures' },
    { 名称: '证件夹', 物品: '证件夹', 类型: '任务道具', 品质: '凡品', 视觉标签: ['ID holder', 'document wallet'], 生图描述: 'plain leather ID document holder with blank cards inside, no readable identity text' },
    { 名称: '门禁卡', 物品: '门禁卡', 类型: '任务道具', 品质: '凡品', 视觉标签: ['access card', 'urban key item'], 生图描述: 'plain modern access card on a desk, no logo, no numbers, no readable text' },
    { 名称: '身份证件', 物品: '身份证件', 类型: '任务道具', 品质: '凡品', 视觉标签: ['identity card', 'document wallet'], 生图描述: 'blank modern identity card in a transparent sleeve, no readable personal information' },
    { 名称: '数据U盘', 物品: '数据U盘', 类型: '任务道具', 品质: '上品', 视觉标签: ['USB drive', 'data evidence'], 生图描述: 'small black USB flash drive on a desk, no logo or readable label' },
    { 名称: '车钥匙', 物品: '车钥匙', 类型: '任务道具', 品质: '凡品', 视觉标签: ['car key', 'key fob'], 生图描述: 'plain modern car key fob and metal key on a tabletop, no logo, no text' },
    { 名称: '钥匙串', 物品: '钥匙串', 类型: '任务道具', 品质: '凡品', 视觉标签: ['key ring', 'urban keys'], 生图描述: 'small key ring with several plain house keys on a tabletop, no logo, no text' },
    { 名称: '出租屋租约', 物品: '租约', 类型: '任务道具', 品质: '凡品', 视觉标签: ['rental contract', 'urban document'], 生图描述: 'modern rental contract pages in a folder with abstract unreadable lines, no real text' },
    { 名称: '维修工具箱', 物品: '工具箱', 类型: '杂物', 品质: '良品', 视觉标签: ['toolbox', 'repair tools'], 生图描述: 'open modern repair toolbox with wrench screwdriver and pliers, no brand labels' },
    { 名称: '多功能工具钳', 物品: '工具钳', 类型: '杂物', 品质: '良品', 视觉标签: ['multitool pliers', 'pocket tool'], 生图描述: 'folding multitool pliers opened slightly, isolated product photo, no logo' },
    { 名称: '电子元件包', 物品: '电子元件', 类型: '材料', 品质: '良品', 视觉标签: ['electronic components', 'repair parts'], 生图描述: 'small tray of generic electronic components, wires and circuit parts, no readable markings' },
    { 名称: '备用电池组', 物品: '电池组', 类型: '材料', 品质: '良品', 视觉标签: ['battery pack', 'portable cells'], 生图描述: 'compact unlabeled rechargeable battery pack and loose generic cells, no text' },
    { 名称: '充电宝', 物品: '充电宝', 类型: '材料', 品质: '良品', 视觉标签: ['power bank', 'portable battery'], 生图描述: 'plain portable power bank with a blank indicator strip, no logo, no readable text' },
    { 名称: '手机充电线', 物品: '充电线', 类型: '材料', 品质: '凡品', 视觉标签: ['charging cable', 'phone accessory'], 生图描述: 'coiled plain phone charging cable on a desk, no logo, no text' },
    { 名称: '违禁香氛样本', 物品: '香氛样本', 类型: '任务道具', 品质: '上品', 视觉标签: ['fictional contraband fragrance sample', 'sealed evidence vial', 'modern investigation'], 生图描述: 'sealed modern evidence vial containing fictional contraband fragrance sample, tamper-evident cap, no label text, no formula, no person' },
    { 名称: '催眠录音芯片', 物品: '录音芯片', 类型: '任务道具', 品质: '上品', 视觉标签: ['fictional hypnosis audio chip', 'evidence bag', 'modern mystery'], 生图描述: 'small data chip sealed in a clear evidence sleeve as fictional hypnosis-audio plot evidence, no readable text, no person' },
    { 名称: '清醒贴片', 物品: '贴片', 类型: '消耗品', 品质: '良品', 视觉标签: ['awareness patch', 'anti hypnosis patch', 'sealed medical prop'], 生图描述: 'sealed plain awareness adhesive patches in a sterile blister pack, fictional anti-hypnosis support prop, no readable text, no formula' },
    { 名称: '香氛检测卡', 物品: '检测卡', 类型: '杂物', 品质: '良品', 视觉标签: ['fragrance detector card', 'investigation tool', 'modern safety'], 生图描述: 'blank modern fragrance detection cards with a small sealed swab tube, investigation prop, no readable text, no logos' },
    { 名称: '防身喷雾', 物品: '防身喷雾', 类型: '武器', 品质: '凡品', 武器子类: '暗器', 视觉标签: ['defense spray canister', 'nonlethal tool'], 生图描述: 'small plain personal safety spray canister, capped, no brand, no readable text' },
    { 名称: '随身短刃', 物品: '短刃', 类型: '武器', 品质: '良品', 武器子类: '暗器', 视觉标签: ['pocket knife', 'urban survival tool'], 生图描述: 'compact folding pocket knife prop with textured grip, closed or partly open, no blood, no person, no readable text' },
    { 名称: '伸缩警棍', 物品: '警棍', 类型: '武器', 品质: '良品', 武器子类: '棍', 视觉标签: ['telescopic baton', 'modern self defense tool'], 生图描述: 'closed telescopic baton as a nonfunctional prop, isolated on neutral background, no person' },
    { 名称: '轻便夹克', 物品: '夹克', 类型: '防具', 品质: '凡品', 装备位置: '胸部', 视觉标签: ['light jacket', 'urban clothing'], 生图描述: 'plain lightweight urban jacket laid flat, no person, no logo' },
    { 名称: '防水雨衣', 物品: '雨衣', 类型: '防具', 品质: '凡品', 装备位置: '胸部', 视觉标签: ['raincoat', 'urban weather gear'], 生图描述: 'folded plain waterproof raincoat with hood, no person, no logo, no readable text' },
    { 名称: '防护口罩', 物品: '口罩', 类型: '防具', 品质: '凡品', 装备位置: '头部', 视觉标签: ['protective mask', 'modern PPE'], 生图描述: 'single plain protective face mask on a clean surface, no text or logo' },
    { 名称: '运动鞋', 物品: '运动鞋', 类型: '防具', 品质: '凡品', 装备位置: '足部', 视觉标签: ['sneakers', 'modern footwear'], 生图描述: 'pair of empty modern sneakers side by side, no feet, no brand, no logo' },
    { 名称: '急救手册', 物品: '手册', 类型: '秘籍', 品质: '良品', 视觉标签: ['first aid manual', 'training booklet'], 生图描述: 'small modern first aid training booklet with simple blank cover and unreadable diagrams, no readable text' },
    { 名称: '记事本', 物品: '记事本', 类型: '秘籍', 品质: '凡品', 视觉标签: ['notebook', 'urban notes'], 生图描述: 'small pocket notebook opened to blank and abstract unreadable notes, no real text' },
    { 名称: '电脑维修手册', 物品: '手册', 类型: '秘籍', 品质: '良品', 视觉标签: ['computer repair manual', 'technical booklet'], 生图描述: 'modern computer repair manual booklet with abstract circuit diagrams, no readable text' },
    { 名称: '便携检测仪', 物品: '检测仪', 类型: '杂物', 品质: '上品', 视觉标签: ['portable detector', 'scientific handheld device'], 生图描述: 'handheld portable detector device with small blank screen and sensor probe, no text' },
    { 名称: '便携药盒', 物品: '药盒', 类型: '消耗品', 品质: '凡品', 视觉标签: ['pill organizer', 'urban medicine kit'], 生图描述: 'small plain pill organizer with sealed compartments, no readable labels, no brand' },
    { 名称: '调查相机', 物品: '相机', 类型: '杂物', 品质: '良品', 视觉标签: ['compact camera', 'investigation tool'], 生图描述: 'compact black digital camera used as an investigation prop, no logo, no readable text' },
    { 名称: '交通卡', 物品: '交通卡', 类型: '杂物', 品质: '凡品', 视觉标签: ['transit card', 'urban daily item'], 生图描述: 'plain modern transit card on a desk, no logo, no numbers, no readable text' },
    { 名称: '防护服', 物品: '防护服', 类型: '防具', 品质: '上品', 装备位置: '胸部', 视觉标签: ['protective suit', 'hazmat-style gear'], 生图描述: 'folded modern protective suit with gloves and hood, no person, no logo, no text' },
    { 名称: '异常样本盒', 物品: '样本盒', 类型: '材料', 品质: '上品', 视觉标签: ['sample case', 'sealed specimen'], 生图描述: 'sealed transparent specimen sample case with faint glow inside, no biohazard symbol, no readable text' },
    { 名称: '灵能探测器', 物品: '探测器', 类型: '杂物', 品质: '上品', 视觉标签: ['spiritual energy detector', 'modern occult device'], 生图描述: 'modern handheld spiritual energy detector with blank gauge and subtle glow, no text' },
    { 名称: '灵气抑制贴', 物品: '抑制贴', 类型: '消耗品', 品质: '良品', 视觉标签: ['spirit suppression patch', 'medical patch'], 生图描述: 'small sealed adhesive patches with faint blue pattern, no readable text or label' },
    { 名称: '银戒指', 材质: '银', 物品: '戒指', 类型: '饰品', 品质: '良品', 视觉标签: ['silver ring', 'modern accessory'], 生图描述: 'plain silver ring photographed alone on neutral cloth, no hand, no logo' },
    { 名称: '怀表', 物品: '怀表', 类型: '饰品', 品质: '良品', 视觉标签: ['pocket watch', 'vintage accessory'], 生图描述: 'closed vintage pocket watch with chain on dark cloth, no readable numerals or text' },
];

const 末日预设物品: 结构化物品条目[] = [
    { 名称: '罐头包', 物品: '罐头包', 类型: '消耗品', 品质: '凡品', 视觉标签: ['canned food', 'survival supplies'], 生图描述: 'small bundle of dented canned food for survival, no readable labels' },
    { 名称: '净水片', 物品: '净水片', 类型: '消耗品', 品质: '良品', 视觉标签: ['water purification tablets', 'survival medicine'], 生图描述: 'small blister pack of water purification tablets beside a metal cup, no readable text' },
    { 名称: '手摇电筒', 物品: '手摇电筒', 类型: '杂物', 品质: '良品', 视觉标签: ['hand crank flashlight', 'survival tool'], 生图描述: 'worn hand-crank flashlight with scratches, apocalypse survival gear, no logo' },
    { 名称: '弩机组件', 物品: '弩机组件', 类型: '武器', 品质: '上品', 视觉标签: ['crossbow parts', 'silent weapon'], 生图描述: 'mechanical crossbow limb and trigger components on a rough table, no person' },
    { 名称: '抗生素散盒', 物品: '抗生素散盒', 类型: '消耗品', 品质: '上品', 视觉标签: ['antibiotics', 'medical cache'], 生图描述: 'scattered unlabeled antibiotic blister packs and small medicine box, survival medical supplies, no readable text' },
    { 名称: '汽油桶', 物品: '汽油桶', 类型: '材料', 品质: '良品', 视觉标签: ['fuel canister', 'survival resource'], 生图描述: 'red metal fuel canister with scratches and dirt, isolated apocalypse resource prop, no readable text' },
    { 名称: '饮水瓶', 物品: '饮水瓶', 类型: '消耗品', 品质: '凡品', 视觉标签: ['water bottle', 'survival water'], 生图描述: 'clear reusable water bottle filled with clean water, scratched survival gear, no label' },
    { 名称: '压缩饼干', 物品: '压缩饼干', 类型: '消耗品', 品质: '凡品', 视觉标签: ['compressed biscuits', 'ration food'], 生图描述: 'plain compressed ration biscuits in torn unlabeled foil packet, no readable text' },
    { 名称: '口粮包', 物品: '口粮包', 类型: '消耗品', 品质: '凡品', 视觉标签: ['ration pack', 'survival food'], 生图描述: 'compact survival ration pack with plain foil wrappers, no readable text or brand' },
    { 名称: '医用绷带', 物品: '绷带', 类型: '消耗品', 品质: '凡品', 视觉标签: ['medical bandage', 'survival medicine'], 生图描述: 'roll of clean medical bandage and gauze pads, no label or text' },
    { 名称: '应急药箱', 物品: '药箱', 类型: '消耗品', 品质: '良品', 视觉标签: ['emergency medical kit', 'survival medicine'], 生图描述: 'rugged emergency medical kit opened with bandages and sealed supplies, no readable labels' },
    { 名称: '瓶装水', 物品: '瓶装水', 类型: '消耗品', 品质: '凡品', 视觉标签: ['bottled water', 'survival water'], 生图描述: 'plain clear water bottle with no label, scratched survival prop' },
    { 名称: '止血带', 物品: '止血带', 类型: '消耗品', 品质: '良品', 视觉标签: ['tourniquet', 'emergency medicine'], 生图描述: 'plain emergency tourniquet strap coiled beside gauze, no logo or text' },
    { 名称: '消毒喷雾', 物品: '消毒喷雾', 类型: '消耗品', 品质: '良品', 视觉标签: ['disinfectant spray', 'medical survival supply'], 生图描述: 'plain disinfectant spray bottle beside gauze pads, no logo, no readable text' },
    { 名称: '过滤水壶', 物品: '过滤水壶', 类型: '杂物', 品质: '良品', 视觉标签: ['water filter bottle', 'survival tool'], 生图描述: 'rugged water filter bottle with scratches, no brand, no readable markings' },
    { 名称: '干电池组', 物品: '干电池', 类型: '材料', 品质: '凡品', 视觉标签: ['dry batteries', 'power cells'], 生图描述: 'small bundle of generic dry batteries with blank wraps, no text or brand' },
    { 名称: '胶带卷', 物品: '胶带', 类型: '材料', 品质: '凡品', 视觉标签: ['duct tape', 'repair supply'], 生图描述: 'single roll of grey duct tape on a work table, no label or readable text' },
    { 名称: '净水滤芯', 物品: '滤芯', 类型: '材料', 品质: '良品', 视觉标签: ['water filter cartridge', 'survival component'], 生图描述: 'generic water filter cartridge and charcoal pellets, no text' },
    { 名称: '弹药盒', 物品: '弹药盒', 类型: '材料', 品质: '上品', 视觉标签: ['ammunition box', 'sealed metal box'], 生图描述: 'closed rugged metal ammunition supply box as a survival resource prop, no weapons, no readable text' },
    { 名称: '太阳能充电板', 物品: '太阳能板', 类型: '材料', 品质: '上品', 视觉标签: ['portable solar panel', 'survival power'], 生图描述: 'folding portable solar charging panel on a dusty surface, no logo or text' },
    { 名称: '柴油桶', 物品: '柴油桶', 类型: '材料', 品质: '良品', 视觉标签: ['diesel canister', 'survival fuel'], 生图描述: 'yellow metal diesel canister with scratches and dirt, no readable text' },
    { 名称: '镇静烟雾罐', 物品: '烟雾罐', 类型: '任务道具', 品质: '上品', 视觉标签: ['fictional sedative smoke canister', 'sealed survival contraband', 'apocalypse evidence'], 生图描述: 'sealed rugged fictional sedative smoke canister stored as apocalypse contraband evidence, safety pin intact, no gas cloud, no label, no person' },
    { 名称: '诱导素样本', 物品: '样本管', 类型: '材料', 品质: '上品', 视觉标签: ['fictional lure pheromone sample', 'sealed specimen tube', 'apocalypse research'], 生图描述: 'sealed specimen tube containing fictional lure-agent sample in a padded survival research case, no formula, no biohazard symbol, no readable text' },
    { 名称: '神志清明针', 物品: '针剂', 类型: '消耗品', 品质: '上品', 视觉标签: ['clarity injector', 'emergency awareness aid', 'survival medicine'], 生图描述: 'single capped auto-injector clarity aid in a sterile tray, no exposed needle, no readable text, no person' },
    { 名称: '防毒面具', 物品: '防毒面具', 类型: '防具', 品质: '上品', 装备位置: '头部', 视觉标签: ['gas mask', 'respirator'], 生图描述: 'single rugged gas mask respirator lying on a table, no person, no symbol, no text' },
    { 名称: '护目镜', 物品: '护目镜', 类型: '防具', 品质: '良品', 装备位置: '头部', 视觉标签: ['protective goggles', 'survival eyewear'], 生图描述: 'scratched protective goggles on a dusty surface, no face, no logo' },
    { 名称: '战术背心', 物品: '战术背心', 类型: '防具', 品质: '良品', 装备位置: '胸部', 视觉标签: ['tactical vest', 'survival armor'], 生图描述: 'empty rugged tactical vest laid flat with pouches, no person, no patches or text' },
    { 名称: '防割外套', 物品: '外套', 类型: '防具', 品质: '良品', 装备位置: '胸部', 视觉标签: ['cut resistant jacket', 'survival protective clothing'], 生图描述: 'empty cut-resistant survival jacket laid flat, no person, no logo, no readable text' },
    { 名称: '一次性手套', 物品: '手套', 类型: '防具', 品质: '凡品', 装备位置: '手部', 视觉标签: ['disposable gloves', 'medical PPE'], 生图描述: 'pair of plain disposable medical gloves on a clean surface, no hands, no logo' },
    { 名称: '撬棍', 物品: '撬棍', 类型: '武器', 品质: '凡品', 武器子类: '棍', 视觉标签: ['crowbar', 'salvage tool'], 生图描述: 'worn metal crowbar as a survival salvage tool, isolated prop, no person' },
    { 名称: '破窗锤', 物品: '破窗锤', 类型: '武器', 品质: '凡品', 武器子类: '棍', 视觉标签: ['emergency glass breaker', 'escape tool'], 生图描述: 'compact emergency glass breaker hammer as a survival escape tool, no person, no readable text' },
    { 名称: '消音弩', 物品: '弩', 类型: '武器', 品质: '上品', 武器子类: '暗器', 视觉标签: ['silent crossbow', 'survival weapon prop'], 生图描述: 'compact nonfunctional survival crossbow prop with simple limbs and stock, no projectile fired, no person' },
    { 名称: '求生手册', 物品: '手册', 类型: '秘籍', 品质: '良品', 视觉标签: ['survival manual', 'field guide'], 生图描述: 'worn survival field manual booklet with abstract diagrams and no readable text' },
    { 名称: '感染记录本', 物品: '记录本', 类型: '任务道具', 品质: '凡品', 视觉标签: ['infection logbook', 'apocalypse records'], 生图描述: 'worn field logbook with abstract medical chart marks, no readable real text' },
    { 名称: '营地通行证', 物品: '通行证', 类型: '任务道具', 品质: '良品', 视觉标签: ['camp pass', 'survivor permit'], 生图描述: 'laminated survivor camp pass card with blank photo square and unreadable lines, no real text' },
    { 名称: '无线电台', 物品: '无线电台', 类型: '杂物', 品质: '上品', 视觉标签: ['field radio', 'survival communication'], 生图描述: 'rugged portable field radio with antenna and blank display, no readable text' },
    { 名称: '对讲机', 物品: '对讲机', 类型: '杂物', 品质: '良品', 视觉标签: ['walkie talkie', 'survival communication'], 生图描述: 'rugged walkie talkie with antenna and blank display, no logo, no readable text' },
    { 名称: '防水火柴', 物品: '火柴', 类型: '杂物', 品质: '凡品', 视觉标签: ['waterproof matches', 'survival fire starter'], 生图描述: 'small waterproof match case opened to show matches, no label or text' },
    { 名称: '打火机', 物品: '打火机', 类型: '杂物', 品质: '凡品', 视觉标签: ['lighter', 'survival fire starter'], 生图描述: 'plain metal lighter on a dusty table, no flame, no logo, no readable text' },
    { 名称: '感染检测卡', 物品: '检测卡', 类型: '任务道具', 品质: '上品', 视觉标签: ['infection test card', 'medical evidence'], 生图描述: 'blank medical test card in a clear pouch with sample tube, no readable text or symbols' },
];

const 无限流预设物品: 结构化物品条目[] = [
    { 名称: '战术匕首', 物品: '匕首', 类型: '武器', 品质: '良品', 武器子类: '暗器', 视觉标签: ['tactical dagger', 'survival trial weapon', 'infinite flow'], 生图描述: 'compact tactical dagger prop with worn black grip, isolated inventory item, no blood, no person, no readable text' },
    { 名称: '消音手枪', 物品: '手枪', 类型: '武器', 品质: '上品', 武器子类: '暗器', 视觉标签: ['suppressed pistol prop', 'modern weapon', 'mission exchange'], 生图描述: 'nonfunctional suppressed pistol prop on a neutral surface, angled inventory product view, no bullets fired, no person, no logo, no readable text' },
    { 名称: '折叠弩', 物品: '弩', 类型: '武器', 品质: '上品', 武器子类: '暗器', 视觉标签: ['folding crossbow', 'quiet mission gear', 'survival trial'], 生图描述: 'compact folding crossbow prop with collapsed limbs and simple stock, isolated product photo, no person, no readable text' },
    { 名称: '高周波短刃', 物品: '短刃', 类型: '武器', 品质: '极品', 武器子类: '暗器', 视觉标签: ['high frequency blade', 'sci fi melee weapon', 'exchange gear'], 生图描述: 'sleek short high-frequency sci-fi blade with subtle blue edge glow, single item on dark neutral cloth, no text, no logo' },
    { 名称: '电磁脉冲枪', 物品: '脉冲枪', 类型: '武器', 品质: '极品', 武器子类: '枪', 视觉标签: ['EMP launcher', 'sci fi weapon prop', 'trial equipment'], 生图描述: 'compact sci-fi electromagnetic pulse launcher prop with coils and blank indicator panel, no projectile, no person, no readable text' },
    { 名称: '单兵火箭筒', 物品: '火箭筒', 类型: '武器', 品质: '极品', 武器子类: '枪', 视觉标签: ['portable rocket launcher', 'RPG', 'anti-tank weapon', 'military heavy weapon'], 生图描述: 'single portable anti-tank rocket launcher tube with grip and sight, military green olive drab finish, realistic product photo on neutral surface, no person, no explosion, no readable text, no logo' },
    { 名称: '防弹背心', 物品: '防弹背心', 类型: '防具', 品质: '良品', 装备位置: '胸部', 视觉标签: ['ballistic vest', 'tactical armor', 'survival mission'], 生图描述: 'empty plain black ballistic vest laid flat with pouches, no person, no patches, no logos, no readable text' },
    { 名称: '防护背心', 物品: '防护背心', 类型: '防具', 品质: '凡品', 装备位置: '胸部', 视觉标签: ['protective vest', 'body armor', 'safety gear'], 生图描述: 'empty plain protective vest laid flat showing shoulder straps and velcro closures, no person, no patches, no text' },
    { 名称: '战术护臂', 物品: '护臂', 类型: '防具', 品质: '良品', 装备位置: '手部', 视觉标签: ['tactical bracers', 'forearm protection', 'mission armor'], 生图描述: 'pair of rugged tactical forearm bracers with straps, isolated product view, no arms, no text, no logo' },
    { 名称: '作战靴', 物品: '作战靴', 类型: '防具', 品质: '良品', 装备位置: '足部', 视觉标签: ['combat boots', 'survival footwear', 'mission armor'], 生图描述: 'pair of empty black combat boots side by side, worn but clean, no feet, no person, no brand, no readable text' },
    { 名称: '主神制式防护服', 物品: '防护服', 类型: '防具', 品质: '上品', 装备位置: '胸部', 视觉标签: ['trial protective suit', 'main god shop', 'sci fi survival suit'], 生图描述: 'folded futuristic protective suit with hood and gloves, clean white and graphite panels, no person, no emblem, no readable text' },
    { 名称: '止血喷雾', 物品: '止血喷雾', 类型: '消耗品', 品质: '良品', 视觉标签: ['hemostatic spray', 'field medicine', 'mission recovery'], 生图描述: 'small plain medical spray canister beside gauze pads, emergency field medicine, no logo, no readable text' },
    { 名称: '肾上腺素针剂', 物品: '针剂', 类型: '消耗品', 品质: '上品', 视觉标签: ['adrenaline injector', 'emergency medicine', 'trial recovery'], 生图描述: 'single auto injector medical prop in clear sterile tray, amber fluid window, no needle exposed, no readable text' },
    { 名称: '病毒抑制剂', 物品: '抑制剂', 类型: '消耗品', 品质: '上品', 视觉标签: ['virus inhibitor vial', 'bio trial medicine', 'zombie mission'], 生图描述: 'sealed unlabeled medical vial with faint green liquid in a sterile tray, no symbols, no readable text, no logo' },
    { 名称: '精神稳定剂', 物品: '稳定剂', 类型: '消耗品', 品质: '上品', 视觉标签: ['mental stabilizer', 'psychic recovery', 'trial medicine'], 生图描述: 'small unlabeled blue medical vial and calming patch kit, clean sci-fi medical prop, no readable text' },
    { 名称: '体力恢复药剂', 物品: '恢复药剂', 类型: '消耗品', 品质: '良品', 视觉标签: ['stamina recovery potion', 'main god exchange', 'field medicine'], 生图描述: 'compact transparent ampoule with warm orange liquid in a padded case, no label, no readable text' },
    { 名称: '魅惑抗性贴片', 物品: '抗性贴片', 类型: '消耗品', 品质: '上品', 视觉标签: ['charm resistance patch', 'main god exchange', 'psychic safety'], 生图描述: 'sealed sci-fi charm-resistance adhesive patches in a clean black case, no readable text, no person, no logo' },
    { 名称: '违禁迷情香囊', 物品: '香囊', 类型: '任务道具', 品质: '极品', 视觉标签: ['forbidden fictional romance incense', 'main god contraband', 'sealed pouch'], 生图描述: 'sealed futuristic evidence pouch holding a fictional forbidden romance-incense sachet, black case and red wax seal, no loose powder, no formula, no person' },
    { 名称: '精神锚定护符', 物品: '护符', 类型: '饰品', 品质: '极品', 视觉标签: ['mental anchor amulet', 'psychic protection', 'trial gear'], 生图描述: 'geometric mental-anchor amulet with silver frame and blue core, protective trial accessory prop, no readable text, no person' },
    { 名称: '异种细胞样本', 物品: '细胞样本', 类型: '材料', 品质: '上品', 视觉标签: ['alien cell sample', 'sealed specimen', 'mission material'], 生图描述: 'sealed transparent specimen capsule with faint organic glow inside, sterile tray, no biohazard symbol, no readable text' },
    { 名称: '变异晶核', 物品: '晶核', 类型: '材料', 品质: '上品', 视觉标签: ['mutant crystal core', 'monster drop', 'mission material'], 生图描述: 'single irregular dark red crystal core with inner glow, small inventory prop on neutral cloth, no text' },
    { 名称: '记忆金属片', 物品: '金属片', 类型: '材料', 品质: '极品', 视觉标签: ['memory metal plate', 'sci fi crafting material', 'main god shop'], 生图描述: 'thin flexible silver memory-metal plates slightly curling on a dark surface, subtle sci-fi sheen, no text or logo' },
    { 名称: '主神能量碎片', 物品: '能量碎片', 类型: '材料', 品质: '极品', 视觉标签: ['main god energy shard', 'dimensional energy', 'exchange material'], 生图描述: 'faceted translucent energy shard floating just above a small black stand, white-blue glow, no symbols, no readable text' },
    { 名称: '黑曜病毒培养皿', 物品: '培养皿', 类型: '材料', 品质: '上品', 视觉标签: ['obsidian virus culture', 'sealed petri dish', 'mission material'], 生图描述: 'sealed petri dish with dark obsidian-colored culture sealed under glass, scientific prop, no biohazard symbol, no readable text' },
    { 名称: '基因锁训练手册', 物品: '训练手册', 类型: '秘籍', 品质: '上品', 视觉标签: ['gene lock manual', 'training booklet', 'main god exchange'], 生图描述: 'plain futuristic training manual booklet with abstract body-diagram lines, no readable words, no logo' },
    { 名称: '精神力扫描教程', 物品: '教程', 类型: '秘籍', 品质: '上品', 视觉标签: ['psychic scan tutorial', 'mind training manual', 'team support'], 生图描述: 'thin sci-fi tutorial booklet with abstract wave and brain diagrams, blank cover, no readable text' },
    { 名称: '近战格斗模块', 物品: '技能模块', 类型: '秘籍', 品质: '良品', 视觉标签: ['combat training module', 'skill chip', 'exchange tutorial'], 生图描述: 'small training data module chip in a clear case with abstract fighting pose icon shapes, no readable text or logo' },
    { 名称: '枪械速成模块', 物品: '技能模块', 类型: '秘籍', 品质: '良品', 视觉标签: ['firearm training module', 'skill chip', 'exchange tutorial'], 生图描述: 'compact training data chip in padded case with abstract target diagram shapes, no weapon brand, no readable text' },
    { 名称: '轮回者腕表', 物品: '腕表', 类型: '饰品', 品质: '上品', 视觉标签: ['reincarnator wristwatch', 'mission countdown device', 'infinite flow'], 生图描述: 'rugged black wristwatch device with blank glowing screen and metal clasp, no wrist, no numbers, no readable text' },
    { 名称: '任务腕表', 物品: '腕表', 类型: '饰品', 品质: '上品', 视觉标签: ['mission wristwatch', 'countdown device', 'infinite flow'], 生图描述: 'rugged mission countdown wristwatch with blank glowing screen, no wrist, no numbers, no readable text' },
    { 名称: '奖励点凭证', 物品: '凭证', 类型: '任务道具', 品质: '良品', 视觉标签: ['reward point token', 'main god shop', 'infinite flow'], 生图描述: 'small abstract reward point token card in a clear sleeve, no readable text, no logo' },
    { 名称: 'D级支线剧情凭证', 物品: '凭证', 类型: '任务道具', 品质: '上品', 视觉标签: ['D rank side story token', 'mission reward', 'infinite flow'], 生图描述: 'small sealed side-story reward chip with a simple geometric mark, no readable letters or numbers' },
    { 名称: '主神任务卡', 物品: '任务卡', 类型: '任务道具', 品质: '良品', 视觉标签: ['main god mission card', 'quest item', 'infinite flow'], 生图描述: 'blank futuristic mission card with glowing border, no readable text, no logo' },
    { 名称: '主神兑换券', 物品: '兑换券', 类型: '任务道具', 品质: '良品', 视觉标签: ['main god exchange voucher', 'quest token', 'infinite flow'], 生图描述: 'sealed futuristic exchange voucher card with abstract patterns, no readable text, no logo' },
    { 名称: '剧情地图碎片', 物品: '地图碎片', 类型: '任务道具', 品质: '凡品', 视觉标签: ['plot map fragment', 'mission clue'], 生图描述: 'torn map fragment with abstract unreadable route marks, no real text, no logo' },
    { 名称: '备用弹匣', 物品: '弹匣', 类型: '材料', 品质: '良品', 视觉标签: ['spare magazine', 'tactical supply'], 生图描述: 'plain spare magazine prop beside a closed supply case, no bullets loose, no readable text' },
    { 名称: '通讯耳麦', 物品: '耳麦', 类型: '杂物', 品质: '良品', 视觉标签: ['communication headset', 'team mission gear'], 生图描述: 'compact tactical communication headset with earpiece and mic, no person, no logo, no readable text' },
    { 名称: '强光手电', 物品: '手电', 类型: '杂物', 品质: '良品', 视觉标签: ['high power flashlight', 'mission survival gear'], 生图描述: 'rugged high power flashlight on dark neutral cloth, no beam, no logo, no readable text' },
    { 名称: '便携扫描仪', 物品: '扫描仪', 类型: '杂物', 品质: '上品', 视觉标签: ['portable scanner', 'mission detector'], 生图描述: 'handheld sci-fi portable scanner with blank screen and sensor head, no readable text, no logo' },
    { 名称: '轮回者身份铭牌', 物品: '铭牌', 类型: '任务道具', 品质: '良品', 视觉标签: ['reincarnator ID tag', 'mission identity item'], 生图描述: 'plain metal identity tag in a clear sleeve with abstract unreadable marks, no real text' },
    { 名称: '安全屋钥匙', 物品: '钥匙', 类型: '任务道具', 品质: '凡品', 视觉标签: ['safehouse key', 'mission key item'], 生图描述: 'plain safehouse key with a blank tag, no readable text, no logo' },
];

const 生成材质物品 = (): 结构化物品条目[] => {
    const weapons = 武器材质.flatMap((material) => 武器模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '武器' as const,
        品质: material.品质 as 物品品质,
        武器子类: template.子类,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品} weapon, clear blade or body, visible grip and fittings`
    })));
    const hardArmors = 金属防具材质.flatMap((material) => 硬防具模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品} armor or clothing item, isolated product prop, visible material texture`
    })));
    const metalFootwear = 金属防具材质.flatMap((material) => 金属足具模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a pair of ${material.标签.join(', ')} wuxia ${template.物品}, armored footwear only, two empty shoes or boots lying side by side on a tabletop, visible hollow openings, low product photo angle, no vertical leg armor, no legs, no greaves, no pants, no mannequin, no full armor suit, no straw, no cloth sandals`
    })));
    const clothItems = 布衣材质.flatMap((material) => 布衣模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品}, soft textile item only, isolated product prop, visible woven fabric texture`
    })));
    const leatherItems = 皮革防具材质.flatMap((material) => 皮革模板.map((template) => ({
        名称: `${material.名称}${template.物品}`,
        材质: material.名称,
        物品: template.物品,
        类型: '防具' as const,
        品质: material.品质 as 物品品质,
        装备位置: template.位置,
        视觉标签: [...material.标签, template.物品],
        生图描述: `a ${material.标签.join(', ')} wuxia ${template.物品}, leather defensive gear or footwear, isolated product prop, visible stitched hide texture`
    })));
    return [...weapons, ...hardArmors, ...metalFootwear, ...clothItems, ...leatherItems, ...无材质物品, ...仙侠预设物品, ...西方奇幻预设物品, ...现代预设物品, ...末日预设物品, ...无限流预设物品];
};

export const 结构化物品库: 结构化物品条目[] = 生成材质物品();

const 取名称 = (items: readonly 结构化物品条目[]) => items.map((item) => item.名称);
const 仙侠专属名称 = new Set(取名称(仙侠预设物品));
const 西方奇幻专属名称 = new Set(取名称(西方奇幻预设物品));
const 现代专属名称 = new Set(取名称(现代预设物品));
const 末日专属名称 = new Set(取名称(末日预设物品));
const 无限流专属名称 = new Set(取名称(无限流预设物品));
const 额外仙侠法宝名称 = new Set(['玉骨扇']);
const 去重名称 = (...groups: string[][]): string[] => Array.from(new Set(groups.flat().filter(Boolean)));

const 武侠基础物品名称 = 结构化物品库
    .filter((entry) => (
        !仙侠专属名称.has(entry.名称)
        && !西方奇幻专属名称.has(entry.名称)
        && !现代专属名称.has(entry.名称)
        && !末日专属名称.has(entry.名称)
        && !无限流专属名称.has(entry.名称)
        && entry.类型 !== '法宝'
    ))
    .map((entry) => entry.名称);

const 仙侠物品名称 = 结构化物品库
    .filter((entry) => (
        仙侠专属名称.has(entry.名称)
        || 额外仙侠法宝名称.has(entry.名称)
        || (!现代专属名称.has(entry.名称) && !末日专属名称.has(entry.名称))
    ))
    .map((entry) => entry.名称);

const 西方奇幻物品名称 = 结构化物品库
    .filter((entry) => 西方奇幻专属名称.has(entry.名称))
    .map((entry) => entry.名称);

const 现代都市物品名称 = 结构化物品库
    .filter((entry) => 现代专属名称.has(entry.名称))
    .map((entry) => entry.名称);

const 末日物品名称 = 结构化物品库
    .filter((entry) => 末日专属名称.has(entry.名称))
    .map((entry) => entry.名称);

const 无限流物品名称 = 结构化物品库
    .filter((entry) => 无限流专属名称.has(entry.名称))
    .map((entry) => entry.名称);

export const 题材模式预设物品名称清单: Record<题材模式类型, string[]> = {
    武侠: 去重名称(武侠基础物品名称),
    仙侠: 去重名称(仙侠物品名称),
    西方奇幻: 去重名称(西方奇幻物品名称),
    灵气复苏: 去重名称(现代都市物品名称, 仙侠物品名称, ['急救包', '便携检测仪', '防护服', '异常样本盒', '灵能探测器', '灵气抑制贴', '古玉残佩', '灵晶']),
    都市修仙: 去重名称(现代都市物品名称, 仙侠物品名称, ['银行卡', '合同文件', '智能手机', '古玉残佩', '下品灵石', '符箓入门', '护身符']),
    现代都市: 去重名称(现代都市物品名称),
    末日丧尸: 去重名称(末日物品名称, ['智能手机', '急救包', '维修工具箱', '多功能工具钳', '备用电池组', '防护口罩', '运动鞋']),
    无限流: 去重名称(无限流物品名称, ['智能手机', '急救包', '防护服', '净水片', '手摇电筒', '防毒面具', '无线电台', '感染检测卡', '数据U盘']),
};

export const 获取题材模式预设物品名称清单 = (mode?: unknown): string[] => (
    题材模式预设物品名称清单[规范化题材模式(mode)]
);

export const 获取题材模式预设物品库 = (mode?: unknown): 结构化物品条目[] => {
    const names = new Set(获取题材模式预设物品名称清单(mode));
    return 结构化物品库.filter((entry) => names.has(entry.名称));
};

const 规范化名称 = (value: string): string => (
    String(value || '').trim().replace(/[·•・\s_\-—]+/g, '').replace(/青钢/g, '钢')
);

export const 查找结构化物品 = (itemName: string): 结构化物品条目 | null => {
    const normalized = 规范化名称(itemName);
    if (!normalized) return null;
    return 结构化物品库.find((entry) => 规范化名称(entry.名称) === normalized) || null;
};

export const 构建结构化物品库提示词摘要 = (): string => {
    const sampleNames = 结构化物品库
        .filter((entry) => ['武器', '防具', '消耗品', '材料', '秘籍', '饰品', '法宝', '任务道具', '杂物', '杂项'].includes(entry.类型))
        .slice(0, 120)
        .map((entry) => entry.名称)
        .join('、');
    const specialPlotItemSummary = [
        '武侠: 迷魂香囊、合欢香丸、清心解香丸、醒神银针',
        '仙侠/灵气复苏/都市修仙: 摄魂符、六欲琉璃炉、合欢迷神铃、魅心摄魂镜、缚念红绫、破妄清心符、定神玉佩、净欲明心镜、断欲镇魂印、违禁香氛样本、催眠录音芯片、清醒贴片、香氛检测卡',
        '西方奇幻: 魅惑药剂、沉眠熏香、反魅惑护符',
        '现代都市: 违禁香氛样本、催眠录音芯片、清醒贴片、香氛检测卡',
        '末日丧尸: 镇静烟雾罐、诱导素样本、神志清明针',
        '无限流: 六欲琉璃炉、魅心摄魂镜、净欲明心镜、魅惑抗性贴片、违禁迷情香囊、精神锚定护符'
    ].join('；');
    const modeSummary = Object.entries(题材模式预设物品名称清单)
        .map(([mode, names]) => `${mode}: ${names.slice(0, 28).join('、')}${names.length > 28 ? '等' : ''}`)
        .join('；');
    return [
        '## 7. 结构化物品库优先规则',
        '- 生成任何新物品前，先在结构化物品库中选择最接近的“规范物品名称”：如 `钢盔甲`、`铁盔甲`、`钢剑`、`铁剑`、`木剑`、`草鞋`。',
        '- 消耗品、秘籍、材料、杂物可以没有材质前缀，如 `金创药`、`回气丹`、`基础剑法残卷`、`火折子`。',
        '- 规范物品名称必须和真实材质语义一致：`精钢鞋`就是精钢鞋，`草鞋`就是草鞋，不要写成 `钢草鞋`、`精钢草鞋`、`寒铁草鞋`；布衣不要写成 `钢长衫`、`玄铁练功服`。',
        '- 若剧情需要有门派、家族、出处或招式感，可以在展示名称中发挥，但底层规范物品仍应能对应库中条目。例如规范物品是 `钢刀`，展示名可以写 `杨氏断门刀`，描述里说明它是一柄杨氏家族传下的钢刀。',
        '- 物品图片、装备识别和预设复用以规范物品名称为准；剧情化展示名只负责风味，不应破坏规范物品映射。',
        '- 只有库中没有合适条目、且剧情确有特殊性时，才允许自由生成新规范名称；新规范名称也应保持材质和物品本体一致。',
        '- 题材模式应优先从对应预设清单选物品；现代/末日不要回落到古代银钱、宗门法宝或仙侠灵石，灵气复苏/都市修仙可同时使用现代物资与修行物资。',
        `- 若剧情涉及迷魂、魅惑、催眠、情香、反制、侦查或安全防护，应优先使用这些虚构剧情道具/反制道具，不要编写现实配方、剂量、使用教程或非自愿细节：${specialPlotItemSummary}。`,
        `- 当前题材模式预设清单示例：${modeSummary}。`,
        `- 当前可参考的常用结构化条目示例：${sampleNames}。`
    ].join('\n');
};
