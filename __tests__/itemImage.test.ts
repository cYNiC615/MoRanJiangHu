import { describe, expect, it } from 'vitest';
import { 获取物品图标复用Key, 获取物品已选图标地址 } from '../utils/itemImage';
import { 构建最终图片提示词, 全局无文字正向提示词, 全局无文字负面提示词 } from '../services/ai/image';
import { 构建物品图提示词, 构建物品负面提示词, 构建物品视觉描述, 清洗物品外观描述 } from '../services/ai/itemImageGeneration';

describe('item image preset fallback', () => {
    const expectHostedPreset = (url: string | undefined) => {
        expect(url).toMatch(/^(?:\/assets\/item-presets\/.+|https:\/\/(?:i\.111666\.best\/image|s3\.hi168\.com\/hi168-19275-07130td3)\/.+)\.(?:jpg|jpeg|png|webp)$/);
    };

    it('uses generated local presets for structured item library names', () => {
        const sword: any = { 名称: '钢剑', 类型: '武器', 品质: '良品' };
        const armor: any = { 名称: '钢盔甲', 类型: '防具', 品质: '良品' };

        expectHostedPreset(获取物品已选图标地址(sword));
        expectHostedPreset(获取物品已选图标地址(armor));
        expect(获取物品已选图标地址(sword)).not.toBe(获取物品已选图标地址(armor));
    });

    it('uses normative preset names when the display name follows the story flavor', () => {
        const item: any = {
            名称: '杨氏断门刀',
            规范物品名称: '钢刀',
            类型: '武器',
            品质: '良品'
        };

        expectHostedPreset(获取物品已选图标地址(item));
    });

    it('keeps selected images first even when the item name has an exact preset', () => {
        const item: any = {
            ID: 'Item002',
            名称: '青钢剑',
            类型: '武器',
            品质: '良品',
            图片档案: {
                最近生图结果: {
                    id: 'custom_icon',
                    状态: 'success',
                    图片URL: 'https://example.com/custom-sword.png',
                    构图: '物品图标'
                },
                生图历史: [
                    {
                        id: 'custom_icon',
                        状态: 'success',
                        图片URL: 'https://example.com/custom-sword.png',
                        构图: '物品图标'
                    }
                ],
                已选图标图片ID: 'custom_icon'
            }
        };

        expect(获取物品已选图标地址(item)).toBe('https://example.com/custom-sword.png');
    });

    it('normalizes whitespace when matching structured preset names', () => {
        const item: any = {
            名称: ' 精钢长剑 ',
            类型: '武器',
            品质: '良品'
        };

        expectHostedPreset(获取物品已选图标地址(item));
    });

    it('treats item remote image URLs as existing icons so auto generation can skip them', () => {
        const item: any = {
            ID: 'ItemRemote001',
            名称: '无名玉佩',
            类型: '饰品',
            品质: '良品',
            图片URL: 'https://cdn.example.com/items/jade-pendant.png'
        };

        expect(获取物品已选图标地址(item)).toBe('https://cdn.example.com/items/jade-pendant.png');
    });
});

describe('item image reuse key', () => {
    it('uses visual identity instead of instance ID for repeated distributed items', () => {
        const sectSwordA: any = { ID: 'sect_a_001', 名称: '宗门制式长剑', 类型: '武器', 品质: '凡品' };
        const sectSwordB: any = { ID: 'npc_bag_777', 名称: '宗门制式长剑', 类型: '武器', 品质: '凡品' };

        expect(获取物品图标复用Key(sectSwordA)).toBe(获取物品图标复用Key(sectSwordB));
    });

    it('keeps visually different items separated even when names match', () => {
        const normalSword: any = { ID: 'sword_001', 名称: '宗门制式长剑', 类型: '武器', 品质: '凡品' };
        const rareSword: any = { ID: 'sword_002', 名称: '宗门制式长剑', 类型: '武器', 品质: '上品' };

        expect(获取物品图标复用Key(normalSword)).not.toBe(获取物品图标复用Key(rareSword));
    });

    it('keeps visual tag order from splitting the same item icon cache', () => {
        const first: any = { ID: 'item_a', 名称: '夜明珠', 类型: '宝物', 品质: '珍品', 视觉标签: ['发光', '圆润', '青色'] };
        const second: any = { ID: 'item_b', 名称: '夜明珠', 类型: '宝物', 品质: '珍品', 视觉标签: ['青色', '发光', '圆润'] };

        expect(获取物品图标复用Key(first)).toBe(获取物品图标复用Key(second));
    });
});

describe('item image visual description', () => {
    it('keeps appearance clauses while removing mechanics without falling back to discarded text', () => {
        expect(清洗物品外观描述('灰色棉质披风，提供微弱的身体防护，能遮挡小雨。')).toBe('灰色棉质披风');
        expect(清洗物品外观描述('可折叠的布帽，会发光的玉佩')).toBe('可折叠的布帽，会发光的玉佩');
        expect(清洗物品外观描述('恢复生命值，提供属性加成。')).toBe('');
        expect(清洗物品外观描述('青钢剑用玄铁打造而成的剑身')).toBe('青钢剑用玄铁打造而成的剑身');
        expect(构建物品视觉描述({ 名称: '测试外套', 描述: '粗布材质，提升防御。' })).toBe('粗布材质');
    });
    it('uses freeform item descriptions without throwing when no structured preset matches', () => {
        const description = 构建物品视觉描述({
            名称: '斑驳旧木盒',
            描述: '一只边角磨损的旧木盒，铜扣泛着暗沉光泽。'
        });

        expect(description).toContain('一只边角磨损的旧木盒');
    });

    it('filters mechanical stat descriptions from generated visual text', () => {
        const description = 构建物品视觉描述({
            名称: '临时奖励牌',
            描述: '生命值恢复 +10，技能冷却减少 1 回合。'
        });

        expect(description).not.toContain('生命值恢复');
    });
});

describe('item image prompt classification', () => {
    it('renders damp cigarettes as a cigarette pack, not a pouch', () => {
        const item = {
            名称: '半包受潮的香烟',
            类型: '杂物',
            品质: '凡品',
            描述: '半包受潮后还能勉强点燃的旧香烟。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('opened damp cardboard cigarette pack');
        expect(prompt).toContain('visible bent cigarettes');
        expect(negativePrompt).toContain('leather pouch');
        expect(negativePrompt).toContain('drawstring bag');
    });

    it('treats moon-white sect disciple clothes as pale cloth uniforms instead of black armor', () => {
        const item = {
            名称: '月白内门弟子服',
            类型: '防具',
            品质: '良品',
            装备位置: '胸部',
            描述: '月白色内门弟子制式服，布料细密，衣襟处有浅色纹饰。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('inner sect disciple uniform robe');
        expect(prompt).toContain('moon-white pale ivory fabric');
        expect(prompt).toContain('soft textile clothing item');
        expect(prompt).toContain('cloth-only garment design');
        expect(prompt).not.toContain('strict wearable armor item');
        expect(prompt).not.toContain('cuirass garment shape');
        expect(negativePrompt).toContain('black armor');
        expect(negativePrompt).toContain('dark armor');
        expect(negativePrompt).toContain('black clothing');
        expect(negativePrompt).toContain('dark robe');
    });

    it('renders modified crossbows as crossbows instead of polearms', () => {
        const item = {
            名称: '改装弩',
            类型: '武器',
            品质: '良品',
            描述: '用废旧零件重新调校的静音弩，适合末世近距离伏击。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('modified compact crossbow');
        expect(prompt).toContain('horizontal bow limbs');
        expect(prompt).toContain('stock, trigger');
        expect(prompt).not.toContain('spear weapon');
        expect(negativePrompt).toContain('polearm');
        expect(negativePrompt).toContain('staff');
    });

    it('treats quivers as carrying containers instead of generic weapons', () => {
        const item = {
            名称: '牛皮箭囊',
            类型: '杂物',
            品质: '凡品',
            描述: '用牛皮缝制的旧箭囊，肩带磨损，囊口露出几枚羽箭尾羽。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('quiver');
        expect(prompt).toContain('arrow container');
        expect(prompt).not.toContain('strict traditional weapon prop only');
        expect(prompt).not.toContain('blade, bow, hilt, handle, grip, shaft or scabbard must be the main subject');
        expect(negativePrompt).toContain('bow as main subject');
        expect(negativePrompt).toContain('sword');
    });

    it('renders fox pets as living animals instead of plush toys or figurines', () => {
        const item = {
            名称: '小狐狸宠物',
            类型: '杂物',
            品质: '良品',
            描述: '一只机警的小狐狸，毛发柔顺，尾巴蓬松，会跟着主人行动。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('real living');
        expect(prompt).toContain('fox');
        expect(prompt).toContain('full-body portrait');
        expect(prompt).toContain('natural animal anatomy');
        expect(negativePrompt).toContain('plush toy');
        expect(negativePrompt).toContain('stuffed animal');
        expect(negativePrompt).toContain('resin figurine');
    });

    it('does not treat animal-tooth daggers as living animals', () => {
        const item = {
            名称: '犬牙匕首',
            类型: '武器',
            品质: '良品',
            描述: '以异兽犬牙打磨成刃的小型匕首，适合近身突刺。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).not.toContain('real living');
        expect(prompt).not.toContain('fox');
        expect(prompt).not.toContain('natural animal anatomy');
        expect(prompt).not.toContain('full-body portrait');
        expect(negativePrompt).not.toContain('plush toy');
        expect(prompt).toContain('edged weapon');
        expect(prompt).toContain('blade');
    });

    it('renders arrow bundles as ammunition instead of generic blade weapons', () => {
        const item = {
            名称: '羽箭束',
            类型: '弹药',
            品质: '凡品',
            描述: '十余支羽箭扎成一束，箭羽整齐，箭头已磨亮。'
        };
        const prompt = 构建物品图提示词(item);

        expect(prompt).toContain('arrow ammunition');
        expect(prompt).toContain('arrowheads');
        expect(prompt).toContain('fletching');
        expect(prompt).not.toContain('hilt');
        expect(prompt).not.toContain('scabbard');
        expect(prompt).not.toContain('strict traditional weapon prop only');
    });

    it('treats old military uniforms as soft cloth garments instead of armor', () => {
        const item = {
            名称: '旧军装',
            类型: '防具',
            品质: '凡品',
            描述: '一套磨旧的军装，袖口已经起毛，只有基础遮蔽作用。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('worn modern military uniform');
        expect(prompt).toContain('soft textile clothing item');
        expect(prompt).not.toContain('strict wearable armor item');
        expect(negativePrompt).toContain('lamellar armor');
        expect(negativePrompt).toContain('metal plates');
    });

    it('renders old straw sandals as empty footwear without people or feet', () => {
        const item = {
            名称: '旧草鞋',
            类型: '防具',
            品质: '凡品',
            描述: '一双磨旧的草鞋，草绳已经有些松散。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('old straw sandals');
        expect(prompt).toContain('strict empty footwear prop only');
        expect(prompt).toContain('unworn product still life');
        expect(prompt).not.toMatch(/\b(?:no|not)\b/i);
        expect(negativePrompt).toContain('feet');
        expect(negativePrompt).toContain('person wearing shoes');
    });

    it('renders bandages as dressing supplies without portraits or body parts', () => {
        const item = {
            名称: '绷带',
            类型: '消耗品',
            品质: '凡品',
            描述: '用于包扎伤口的干净布条。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('rolled medical bandage');
        expect(prompt).toContain('strict bandage dressing prop only');
        expect(prompt).toContain('first-aid supply still life');
        expect(prompt).not.toMatch(/\b(?:no|not)\b/i);
        expect(negativePrompt).toContain('framed portrait');
        expect(negativePrompt).toContain('body part');
        expect(negativePrompt).toContain('hand wrapping bandage');
    });

    it('keeps real defensive gear classified as armor', () => {
        const prompt = 构建物品图提示词({
            名称: '精铁护腕',
            类型: '防具',
            品质: '良品',
            描述: '一对精铁打造的护腕。'
        });

        expect(prompt).toContain('fine armor prop');
        expect(prompt).not.toContain('soft textile clothing item');
    });

    it('keeps herb-gathering knives classified as weapons despite herb wording', () => {
        const item = {
            名称: '采药短刀',
            类型: '武器',
            品质: '凡品',
            装备位置: '主手',
            描述: '用来割药草的短刀，略带锈迹。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('short herbal-gathering knife');
        expect(prompt).toContain('strict edged weapon prop');
        expect(prompt).toContain('blade');
        expect(prompt).toContain('hilt');
        expect(prompt).toContain('handle');
        expect(prompt).not.toContain('strict botanical herb or flower');
        expect(negativePrompt).toContain('potted plant');
        expect(negativePrompt).toContain('flowerpot');
        expect(negativePrompt).not.toContain('manufactured object');
    });

    it('treats mystical lotus materials as botanical herbs instead of generic game props', () => {
        const item = {
            名称: '幽冥冰莲',
            类型: '材料',
            品质: '传说',
            描述: '生长在极寒幽潭中的奇异莲花，花瓣如冰，散发幽蓝寒气。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('ice lotus flower');
        expect(prompt).toContain('strict botanical herb or flower');
        expect(prompt).not.toContain('game prop');
        expect(negativePrompt).toContain('game controller');
        expect(negativePrompt).toContain('electronic device');
        expect(negativePrompt).toContain('manufactured object');
    });

    it('renders modern assault rifles as firearms instead of ancient spears', () => {
        const item = {
            名称: '磨损的自动步枪',
            类型: '武器',
            品质: '良品',
            描述: '枪身磨损严重，弹匣和枪托仍可使用。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('modern assault rifle');
        expect(prompt).toContain('receiver, barrel, magazine, stock');
        expect(prompt).toContain('strict modern firearm prop only');
        expect(prompt).not.toContain('strict traditional wuxia weapon prop only');
        expect(negativePrompt).toContain('spear');
        expect(negativePrompt).toContain('polearm');
        expect(negativePrompt).not.toContain('modern weapon, firearm, gun');
    });

    it('renders tactical vests as wearable gear instead of shields', () => {
        const item = {
            名称: '战术背心',
            类型: '防具',
            品质: '良品',
            描述: '带有模块化织带和弹匣袋的旧战术背心。'
        };
        const prompt = 构建物品图提示词(item);
        const negativePrompt = 构建物品负面提示词(item);

        expect(prompt).toContain('wearable tactical vest');
        expect(prompt).toContain('MOLLE webbing');
        expect(prompt).toContain('strict wearable tactical vest item');
        expect(negativePrompt).toContain('shield only');
        expect(negativePrompt).toContain('medieval shield');
    });

    it('keeps global no-text protection even when base negative prompt is skipped', () => {
        const bundle = 构建最终图片提示词('single access token prop', {
            图片后端类型: 'comfyui',
            baseUrl: 'https://example.com',
            apiKey: '',
            model: 'mock'
        } as any, {
            构图: '场景',
            附加负面提示词: '',
            附加正向提示词: ''
        });

        expect(bundle.最终正向提示词).toContain(全局无文字正向提示词);
        expect(bundle.最终负向提示词).toContain(全局无文字负面提示词);
    });

    it('defaults people in scene snapshots to Chinese unless foreign features are explicit', () => {
        const bundle = 构建最终图片提示词('cinematic scene, young man and woman standing in a white light plaza', {
            图片后端类型: 'comfyui',
            baseUrl: 'https://example.com',
            apiKey: '',
            model: 'mock'
        } as any, {
            构图: '场景',
            场景类型: '剧照场景',
            附加负面提示词: '',
            附加正向提示词: ''
        });

        expect(bundle.最终正向提示词).toContain('Chinese person');
        expect(bundle.最终正向提示词).toContain('East Asian facial features');
        expect(bundle.最终负向提示词).toContain('Caucasian face');
        expect(bundle.最终负向提示词).toContain('blonde hair');
    });
});
