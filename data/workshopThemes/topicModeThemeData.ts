import type { WorldGenConfig, 题材模式类型 } from '../../models/system';

export type 题材模式分组 = 'wuxia' | 'xianxia' | 'western_fantasy' | 'urban_xianxia' | 'modern' | 'apocalypse' | 'infinite';

export interface 题材模式配置 {
    value: 题材模式类型;
    label: string;
    shortLabel: string;
    hint: string;
    group: 题材模式分组;
    worldDefaults: Pick<WorldGenConfig, 'worldName' | 'worldSize' | 'dynastySetting' | 'sectDensity' | 'tianjiaoSetting' | 'worldExtraRequirement'>;
    worldSizeLabel: string;
    worldSizeHint: string;
    dynastyLabel: string;
    dynastyHint: string;
    densityLabel: string;
    densityOptions: Array<{ value: WorldGenConfig['sectDensity']; label: string }>;
    densityPromptLabel: string;
    tianjiaoLabel: string;
    auctionName: string;
    marketVerb: string;
    currencyPrompt: string;
    currencyDisplayMode: 'wuxia' | 'xianxia' | 'fantasy' | 'urban' | 'modern' | 'apocalypse' | 'infinite';
    currencyExchangePrompt: string;
    mapPrompt: string;
    skillNames: string[];
    backgroundSuggestions: string[];
    talentSuggestions: string[];
    presetItemKeywords: string[];
    manualRealmPrompt: string;
    promptBoundary: string;
    promptLines: string[];
}

export const 题材模式配置表: Record<题材模式类型, 题材模式配置> = {
    武侠: {
        value: '武侠',
        label: '武侠世界',
        shortLabel: '武侠',
        hint: '江湖、门派、内力、武学与凡俗尺度成长。',
        group: 'wuxia',
        worldDefaults: {
            worldName: '墨澜江湖',
            worldSize: '九州宏大',
            dynastySetting: '王朝边地不稳，官府、帮派、门派与商路势力互相牵制。',
            sectDensity: '适中',
            tianjiaoSetting: '年轻一代以武学根基、实战胆识、师承资源和江湖名声分出高下。',
            worldExtraRequirement: '货币以铜钱、银子、金元宝为主，武学交易常用人情、组织贡献、镖银、药材和兵器折价；不要使用灵石或现代货币。'
        },
        worldSizeLabel: '江湖版图',
        worldSizeHint: '决定门派、城镇、关隘、水路与荒野的叙事尺度。',
        dynastyLabel: '王朝局势',
        dynastyHint: '朝廷、地方豪强、门派、帮会、商路与民间秩序。',
        densityLabel: '门派密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (隐世不出)' },
            { value: '适中', label: '适中 (数大门派)' },
            { value: '林立', label: '林立 (百家争鸣)' }
        ],
        densityPromptLabel: '门派密度',
        tianjiaoLabel: '少侠/高手设定',
        auctionName: '天下拍卖行',
        marketVerb: '流入拍卖行',
        currencyPrompt: '普通交易使用铜钱、银子、金元宝；大额江湖交易可折算为镖银、人情、药材、兵器或组织贡献。',
        currencyDisplayMode: 'wuxia',
        currencyExchangePrompt: '三层货币：底层货币=铜钱，中层货币=银子，上层货币=金元宝；1 银子=1000 铜钱，1 金元宝=100 银子。正文可写镖银、人情、药材或兵器折价，结算按创意工坊设置的相邻汇率折算。',
        mapPrompt: '世界版图应按城镇、门派、山道、关隘、渡口、黑市、野外险地等江湖空间组织。',
        skillNames: ['医术', '毒术', '机关', '采集', '鉴定', '易容', '潜行', '经商'],
        backgroundSuggestions: ['镖局少东家', '门派外门', '江湖游侠', '药铺学徒', '寒门书生'],
        talentSuggestions: ['长途脚力', '人情练达', '稳扎稳打', '静心观微', '耐苦心性'],
        presetItemKeywords: ['刀剑', '护腕', '金创药', '秘籍残卷', '玉佩', '玄铁'],
        manualRealmPrompt: '能力体系：外功、内功、轻功、招式、医毒、机关与兵器熟练度；高手仍受体力、伤势、距离、兵器和江湖规矩限制。',
        promptBoundary: '武侠开局可以生成门派、师门、同门、帮会或江湖关系，但不要越界写成仙侠宗门飞升、现代公司制度或末日营地。',
        promptLines: [
            '本存档以武侠/江湖为核心题材，能力边界收束在门派、内力、武学、身法、器械、医毒、机关、江湖势力与凡俗社会秩序内。',
            '不把世界写成仙侠常态法术轰击、常态御空飞行、飞升位面或高频法宝斗法；若有玄异，也应保持稀少、暧昧、代价明确。'
        ]
    },
    仙侠: {
        value: '仙侠',
        label: '仙侠世界',
        shortLabel: '仙侠',
        hint: '古典仙侠世界，宗门、灵根、坊市、秘境与凡俗王朝并立。',
        group: 'xianxia',
        worldDefaults: {
            worldName: '玄衡界',
            worldSize: '九州宏大',
            dynastySetting: '凡俗王朝与修真宗门并立，灵脉复苏后各地争夺灵田、秘境与传承。',
            sectDensity: '林立',
            tianjiaoSetting: '灵根资质、道心、能力契合度和机缘共同决定成长速度，天骄并起但资源稀缺。',
            worldExtraRequirement: '修真交易以灵石、丹药、符箓、法器和能力贡献折价；凡俗交易可保留银钱口径，但不要让宗门核心交易使用现代货币。'
        },
        worldSizeLabel: '修真版图',
        worldSizeHint: '决定王朝、灵脉、宗门、坊市、秘境和禁地的叙事尺度。',
        dynastyLabel: '凡俗/宗门格局',
        dynastyHint: '凡俗王朝、修真宗门、坊市、散修、秘境资源与灵脉归属。',
        densityLabel: '宗门密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (隐世不出)' },
            { value: '适中', label: '适中 (数大宗门)' },
            { value: '林立', label: '林立 (百宗争道)' }
        ],
        densityPromptLabel: '宗门密度',
        tianjiaoLabel: '灵根/天骄设定',
        auctionName: '灵宝拍卖行',
        marketVerb: '流入坊市拍卖',
        currencyPrompt: '修真交易统一使用下品/中品/上品灵石；凡俗小额银钱只作为生活描写，重要结算折回灵石体系。',
        currencyDisplayMode: 'xianxia',
        currencyExchangePrompt: '三层货币：底层货币=下品灵石，中层货币=中品灵石，上层货币=上品灵石；1 中品灵石=1000 下品灵石，1 上品灵石=100 中品灵石。',
        mapPrompt: '世界版图应按王朝、灵脉、宗门、坊市、秘境入口、洞府、禁地与凡俗城镇组织。',
        skillNames: ['炼器', '炼丹', '医术', '阵法', '符箓', '机关', '采集', '鉴定'],
        backgroundSuggestions: ['宗门旧徒', '散修遗孤', '灵田佃户', '坊市学徒', '修真家族旁支'],
        talentSuggestions: ['药灵体', '静心观微', '稳扎稳打', '灵觉敏锐', '耐苦心性'],
        presetItemKeywords: ['灵石', '飞剑', '丹药', '符箓', '阵盘', '玉简'],
        manualRealmPrompt: '境界体系：练气、筑基、金丹、元婴、化神。每个大境界分初期/中期/后期/圆满；突破需要资源、心境、能力契合与风险。',
        promptBoundary: '仙侠开局可以生成宗门、师长、同门、道友与坊市关系，但应使用修真/宗门语境，不要写成现代公司或末日营地。',
        promptLines: [
            '本存档以仙侠/修真为核心题材，后续世界观、开场、变量、规划、世界演变与战斗判定都必须承接仙侠口径。',
            '能力边界允许灵气、灵根、灵力、神识、法宝、术法、神通、阵法、符箓、丹药、灵材、秘境、宗门修真与天劫/心魔/因果代价。',
            '高阶能力、法宝、灵材、秘境收益和跨境胜利都必须有稀缺度、门槛、代价、风险或势力后果。',
            '主角与重要 NPC 应维护修仙字段：灵根、灵根资质、当前灵力/最大灵力、当前神识/最大神识、丹田状态、道基状态、心魔值、功德、业力。'
        ]
    },
    西方奇幻: {
        value: '西方奇幻',
        label: '西方奇幻',
        shortLabel: '西幻',
        hint: '王国、公会、骑士、法师、教会、魔物、地下城与冒险委托。',
        group: 'western_fantasy',
        worldDefaults: {
            worldName: '艾尔兰德',
            worldSize: '九州宏大',
            dynastySetting: '诸王国、公国、边境领主、教会、魔法学院、冒险者公会、佣兵团与商会共同维持秩序；地下城、魔物巢穴和古代遗迹不断改变边境格局。',
            sectDensity: '适中',
            tianjiaoSetting: '天赋来自职业训练、魔力亲和、血脉、神术赐福、战技掌握、契约、装备和公会声望；高阶冒险者稀少且受资源、誓约和阵营约束。',
            worldExtraRequirement: '本局为西方奇幻：日常交易使用铜币、银币、金币；高阶交易可用魔晶、法术卷轴、附魔材料、公会声望、贵族担保和教会赎券折价。不要使用宗门、灵石、丹药、飞剑、江湖银票或现代电子支付作为默认经济核心。'
        },
        worldSizeLabel: '王国版图',
        worldSizeHint: '决定王国、公国、边境、城堡、港口、森林、矿山、地下城和遗迹的叙事尺度。',
        dynastyLabel: '王国/公会格局',
        dynastyHint: '王室、贵族、骑士团、教会、魔法学院、冒险者公会、佣兵团、商会和魔物威胁。',
        densityLabel: '奇幻势力密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (边境孤旅)' },
            { value: '适中', label: '适中 (公会互通)' },
            { value: '林立', label: '林立 (诸国纷争)' }
        ],
        densityPromptLabel: '公会/势力密度',
        tianjiaoLabel: '职业/血脉/魔法设定',
        auctionName: '冒险者市场',
        marketVerb: '流入冒险者市场',
        currencyPrompt: '普通交易使用铜币、银币、金币；高阶交易可用魔晶、卷轴、附魔材料、公会声望、贵族担保或教会赎券折价。',
        currencyDisplayMode: 'fantasy',
        currencyExchangePrompt: '三层货币：底层货币=铜币，中层货币=银币，上层货币=金币；1 银币=100 铜币，1 金币=100 银币。魔晶、卷轴、附魔材料和公会声望按稀缺度折回三层货币。',
        mapPrompt: '世界版图应按王国、公国、城堡、教会、魔法学院、冒险者公会、港口、森林、矿山、地下城、遗迹和魔物巢穴组织。',
        skillNames: ['剑术', '盾术', '弓弩', '骑术', '魔法', '炼金', '调查', '谈判'],
        backgroundSuggestions: ['冒险者学徒', '边境骑士侍从', '魔法学院旁听生', '佣兵团新人', '教会见习'],
        talentSuggestions: ['魔力亲和', '骑士誓言', '古语直觉', '野外求生', '交涉本能'],
        presetItemKeywords: ['长剑', '皮甲', '治疗药水', '魔晶', '羊皮地图', '火把', '短弓', '法术卷轴'],
        manualRealmPrompt: '能力体系：见习、初阶、中阶、高阶、大师、传奇；成长来自职业训练、魔力/神术掌控、装备、契约、公会声望和地下城经验，不写成修仙破境。',
        promptBoundary: '西方奇幻开局不得生成东方宗门、师门、同门、山门、藏经阁、灵石、丹药或古风组织贡献体系；兼容变量 `玩家组织` 只能承载冒险者公会、骑士团、魔法学院、教会、佣兵团、商会或冒险队。',
        promptLines: [
            '本存档以西方奇幻为核心题材，能力边界围绕职业训练、剑盾弓弩、骑术、魔法、神术、炼金、契约、魔物、地下城、遗迹和阵营声望展开。',
            '不把世界写成东方宗门、江湖门派、仙侠飞升、灵石坊市或丹药突破；魔法和神术必须受法力、材料、誓约、教会规则、职业训练或魔物风险约束。',
            '冒险委托、战利品、爵位、通行证、公会声望和阵营关系应共同决定成长资源，不能开局空降神器、圣剑或传奇血统。'
        ]
    },
    灵气复苏: {
        value: '灵气复苏',
        label: '灵气复苏',
        shortLabel: '复苏',
        hint: '现代都市突然灵气复苏，普通社会正在被修行可能性改写。',
        group: 'urban_xianxia',
        worldDefaults: {
            worldName: '海川灵潮',
            worldSize: '弹丸之地',
            dynastySetting: '现代城市原本正常运转，近期灵气突然复苏，学校、医院、公司、治安系统、研究机构和民间觉醒者都在仓促适应。',
            sectDensity: '适中',
            tianjiaoSetting: '第一批觉醒者以灵感、体质、信息渠道、社会资源和风险承受力拉开差距，体系尚未稳定。',
            worldExtraRequirement: '本局是现代灵气复苏：复苏前日常经济使用人民币/电子支付，复苏后新兴修行交易可逐步出现灵晶、资源配给、研究额度、异常物资和情报；不要开局就写成成熟古代宗门社会。'
        },
        worldSizeLabel: '复苏版图',
        worldSizeHint: '决定城区、校园、医院、研究所、异常点、临时管制区和新兴暗市范围。',
        dynastyLabel: '现代复苏格局',
        dynastyHint: '城市制度、研究机构、治安系统、觉醒者组织、民间互助会和新兴暗市。',
        densityLabel: '觉醒者组织密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (刚有传闻)' },
            { value: '适中', label: '适中 (组织萌芽)' },
            { value: '林立', label: '密集 (多方抢先)' }
        ],
        densityPromptLabel: '觉醒者组织密度',
        tianjiaoLabel: '觉醒/社会资源设定',
        auctionName: '复苏暗市',
        marketVerb: '流入复苏暗市',
        currencyPrompt: '复苏前日常消费使用人民币、银行卡和电子支付；复苏后修行交易逐步使用灵晶、异常物资、研究额度、情报和人情，普通社会不会一夜之间改用古代银钱。',
        currencyDisplayMode: 'urban',
        currencyExchangePrompt: '三层货币：底层货币=复苏信用点，中层货币=千元账户/研究额度，上层货币=十万元账户/高阶资源额度；1 千元账户=1000 复苏信用点，1 十万元账户=100 千元账户。灵晶和异常物资可按稀缺度折回三层货币。',
        mapPrompt: '世界版图应按城区、校园、医院、研究所、异常点、临时管制区、觉醒者据点、复苏暗市和城郊灵气节点组织。',
        skillNames: ['急救', '驾驶', '维修', '调查', '谈判', '计算机', '采集', '鉴定'],
        backgroundSuggestions: ['大学生', '急诊实习生', '研究助理', '社区志愿者', '公司职员'],
        talentSuggestions: ['灵觉敏锐', '过目不忘', '静心观微', '市井耳目', '稳扎稳打'],
        presetItemKeywords: ['手机', '检测仪', '古玉', '灵晶', '急救包', '防护服'],
        manualRealmPrompt: '能力体系：未觉醒、灵感初启、觉醒者、稳定者、领域雏形；现代科研、封控和副作用必须参与约束。',
        promptBoundary: '现代灵气复苏题材不得把普通社会直接写成古代山门宗门；若生成组织，必须贴合研究机构、管控点、觉醒者互助点、公司学校或异常处理现场等现代场景。',
        promptLines: [
            '本存档以现代灵气复苏为核心题材：故事开始时现代社会仍存在，灵气与修行可能性是突然出现或刚被确认的新变量。',
            '不要把开局直接写成成熟古代宗门社会；组织、暗市、修炼法和资源价格应有从混乱到成型的过程。',
            '主角与重要觉醒者可逐步维护修仙字段；普通人、公司、医院、学校和治安系统仍按现代逻辑行动。'
        ]
    },
    都市修仙: {
        value: '都市修仙',
        label: '都市修仙',
        shortLabel: '都市修仙',
        hint: '现代城市表面正常运转，暗处有修行家族、异人圈和灵气节点。',
        group: 'urban_xianxia',
        worldDefaults: {
            worldName: '临海市',
            worldSize: '弹丸之地',
            dynastySetting: '现代都市表面由公司、学校、医院、治安系统与社区秩序运转，暗处有修行家族、民间异人和灵气节点。',
            sectDensity: '稀少',
            tianjiaoSetting: '修行天赋隐藏在现代身份之后，资源包括现金、人脉、房产、药材渠道、古物和少量灵石。',
            worldExtraRequirement: '本局是现代都市修仙：日常消费必须使用人民币/现金/银行卡/电子支付等现代货币；修行圈高端交易可少量使用灵石、法器、符箓、药材、人情和情报，不要让普通超市、公交、医院使用银子铜钱。'
        },
        worldSizeLabel: '都市版图',
        worldSizeHint: '决定城区、学校、医院、公司、城郊、灵气节点和暗市的范围。',
        dynastyLabel: '现代社会格局',
        dynastyHint: '城市制度、公司学校、治安系统、修行家族、异人圈与灰色渠道。',
        densityLabel: '隐秘修行圈密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (传闻级)' },
            { value: '适中', label: '适中 (暗线可查)' },
            { value: '林立', label: '密集 (多方暗涌)' }
        ],
        densityPromptLabel: '隐秘修行圈密度',
        tianjiaoLabel: '天赋/社会资源设定',
        auctionName: '异闻暗市',
        marketVerb: '流入异闻暗市',
        currencyPrompt: '普通生活、工资、租房、交通和医院账单必须使用人民币、银行卡、电子支付；修行圈交易才可使用灵石、法器、符箓、药材、人情和情报。',
        currencyDisplayMode: 'urban',
        currencyExchangePrompt: '三层货币：底层货币=信用点/元级记账，中层货币=千元账户，上层货币=十万元账户；1 千元账户=1000 信用点，1 十万元账户=100 千元账户。灵石、法器、药材和情报按圈内估值折回三层货币。',
        mapPrompt: '世界版图应按城区、校园、医院、写字楼、城中村、古玩街、郊区灵气节点、暗市和隐秘洞府组织。',
        skillNames: ['急救', '驾驶', '维修', '调查', '谈判', '计算机', '潜行', '鉴定'],
        backgroundSuggestions: ['大学生', '急诊实习生', '古玩店学徒', '公司社畜', '修行家族旁支'],
        talentSuggestions: ['过目不忘', '静心观微', '市井耳目', '灵觉敏锐', '人情练达'],
        presetItemKeywords: ['手机', '银行卡', '古玉', '符箓', '药材', '灵石'],
        manualRealmPrompt: '能力体系：炼体、引气、凝神、筑基、金丹；修行必须和现代身份、资源渠道、人脉风险并存。',
        promptBoundary: '都市修仙题材不得把普通社会直接写成古代山门宗门；若生成组织，必须贴合隐秘家族、暗线组织、暗市、公司学校或都市据点等现代场景。',
        promptLines: [
            '本存档以都市修仙为核心题材：现代社会制度、交通、手机、互联网、人民币和现实职业逻辑必须成立，修行圈隐藏在暗处。',
            '普通人社会不默认知道修仙；修行资源、灵石、法器和符箓只在隐秘圈层、家族、暗市或特殊事件中流通。',
            '主角与重要修行者仍应维护修仙字段；但日常消费、身份背景和社会后果必须按现代城市逻辑处理。'
        ]
    },
    现代都市: {
        value: '现代都市',
        label: '现代都市',
        shortLabel: '都市',
        hint: '非古代、低玄或无玄现代生活，强调职业、人际、城市制度和现实货币。',
        group: 'modern',
        worldDefaults: {
            worldName: '海川市',
            worldSize: '弹丸之地',
            dynastySetting: '现代城市由企业、学校、社区、医院、媒体和治安系统构成，阶层流动、人情关系和职业压力共同推进剧情。',
            sectDensity: '稀少',
            tianjiaoSetting: '优势来自学历、技能、人脉、信息差、资金调度和心理韧性，不默认出现宗门修真。',
            worldExtraRequirement: '本局为现代都市现实/低玄题材：日常经济只使用人民币、工资、存款、欠款、合同、银行卡、电子支付等现代概念；不要使用银子、铜钱、灵石、宗门贡献作为普通货币。'
        },
        worldSizeLabel: '城市版图',
        worldSizeHint: '决定城区、社区、商圈、学校、公司、医院、郊区与交通网络范围。',
        dynastyLabel: '现代社会格局',
        dynastyHint: '企业、学校、社区、医院、媒体、治安系统、家庭与职业压力。',
        densityLabel: '组织/圈层密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (小圈层)' },
            { value: '适中', label: '适中 (多圈交错)' },
            { value: '林立', label: '密集 (派系复杂)' }
        ],
        densityPromptLabel: '组织/圈层密度',
        tianjiaoLabel: '能力/社会资源设定',
        auctionName: '二手交易所',
        marketVerb: '流入二手市场',
        currencyPrompt: '经济活动使用人民币、工资、银行卡、电子支付、合同、债务和信用；不要把银子、铜钱、灵石、宗门贡献写成普通货币。',
        currencyDisplayMode: 'modern',
        currencyExchangePrompt: '三层货币：底层货币=信用点/元级记账，中层货币=千元账户，上层货币=十万元账户；1 千元账户=1000 信用点，1 十万元账户=100 千元账户。工资、债务、合同和现金按创意工坊设置折算。',
        mapPrompt: '世界版图应按城市行政区、社区、商圈、写字楼、学校、医院、城郊、交通站点和灰色渠道组织。',
        skillNames: ['急救', '驾驶', '维修', '调查', '谈判', '计算机', '经商', '鉴定'],
        backgroundSuggestions: ['寒门子弟', '公司职员', '实习记者', '合租青年', '小店店主'],
        talentSuggestions: ['账房脑子', '人情练达', '静心观微', '市井耳目', '稳扎稳打'],
        presetItemKeywords: ['手机', '笔记本电脑', '银行卡', '合同', '录音笔', '急救包'],
        manualRealmPrompt: '成长体系：职业技能、人脉信用、资产管理、心理韧性和社会资源；不要常态化超凡力量。',
        promptBoundary: '现代都市开局不得生成古代门派、宗门、师门、同门、山门、藏经阁、古风组织贡献体系或江湖门派任务；兼容变量 `玩家组织` 只能承载公司、学校、社区、家庭、媒体、项目组、店铺、合作团队等现实社会结构。',
        promptLines: [
            '本存档以现代都市为核心题材：现实城市制度、职业压力、家庭关系、交通、手机、互联网、人民币和法律后果必须成立。',
            '不要默认古代王朝、宗门修真、灵石货币、古风组织贡献体系或江湖黑话；若出现低玄异常，也必须嵌入现代社会后果。'
        ]
    },
    末日丧尸: {
        value: '末日丧尸',
        label: '末日丧尸',
        shortLabel: '末日',
        hint: '现代秩序崩塌后的感染机制、生存物资、噪音风险、营地政治和幸存者市场。',
        group: 'apocalypse',
        worldDefaults: {
            worldName: '灰潮纪元',
            worldSize: '九州宏大',
            dynastySetting: '现代城市秩序因感染潮崩塌，幸存者营地、军方残部、掠夺团、医疗机构遗址、临时市场网络和教团聚落争夺物资、通行权与安全区。',
            sectDensity: '稀少',
            tianjiaoSetting: '优势来自末日前职业、灾后身份、体能、冷静、求生技能、医疗知识、装备维护、路线认知、团队信任和稀缺物资管理；默认不包含修炼、内力或超能力，除非玩家额外启用异常能力体系。',
            worldExtraRequirement: '本局为现代末日丧尸：默认按经典生化感染处理，咬伤/血液传播，感染者会被声音、气味、视觉线索吸引，噪音、血腥味、防护装备、隔离策略和医疗风险都应影响剧情后果。交易以食物、饮水、药品、弹药、电池、燃油、工具、情报和安全通行权为主；旧货币仅作废纸或少数营地记账单位，不要使用银子、铜钱、灵石。'
        },
        worldSizeLabel: '废土版图',
        worldSizeHint: '决定城市废墟、郊区、避难所、公路、封锁线、医院和资源点范围。',
        dynastyLabel: '灾后秩序格局',
        dynastyHint: '幸存者营地、军方残部、掠夺团、医疗遗址、临时市场网络、教团聚落、物资点和感染区。',
        densityLabel: '幸存者营地密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (孤岛求生)' },
            { value: '适中', label: '适中 (营地互通)' },
            { value: '林立', label: '密集 (多方割据)' }
        ],
        densityPromptLabel: '幸存者营地密度',
        tianjiaoLabel: '职业/身份/感染压力设定',
        auctionName: '市场',
        marketVerb: '流入市场',
        currencyPrompt: '交易以食物、饮水、药品、弹药、电池、燃油、工具、情报、安全通行权和营地信用为主；旧纸币只可作为少数营地记账或废纸，不使用银子、铜钱、灵石。',
        currencyDisplayMode: 'apocalypse',
        currencyExchangePrompt: '三层货币：底层货币=营地信用点，中层货币=物资票，上层货币=安全通行牌；1 物资票=1000 营地信用点，1 安全通行牌=100 物资票。食水、药品、弹药、燃油和情报按稀缺度折回三层货币。',
        mapPrompt: '世界版图应按感染区、医院、商超、仓库、避难所、公路、封锁线、营地、临时市场和资源点组织。',
        skillNames: ['急救', '维修', '驾驶', '搜索', '潜行', '射击', '近战', '谈判'],
        backgroundSuggestions: ['军人', '警察', '医生/护士', '维修工', '锁匠', '司机', '外卖员/快递员', '厨师', '农民/畜牧从业者', '教师', '主播/自媒体', '白领/文职人员'],
        talentSuggestions: ['独行者', '聚落成员', '黑市掮客', '车队成员', '守夜人', '猎手', '邮差', '电台主持人/情报商', '教团脱逃者'],
        presetItemKeywords: ['急救包', '罐头', '净水片', '电池', '燃油', '手电', '弩机'],
        manualRealmPrompt: '能力体系：普通幸存者、熟练搜寻者、营地骨干、感染适应者、区域领袖；感染、伤病、弹药和信任限制成长速度。',
        promptBoundary: '末日丧尸开局不得生成古代门派、宗门、师门、同门、山门、藏经阁或古风组织贡献语感；兼容变量 `玩家组织` 只能承载营地、避难所、车队、军方残部、医疗点、黑市网络或幸存者小队。',
        promptLines: [
            '本存档以现代末日丧尸为核心题材：感染风险、噪音、气味、光源、防护、补给、伤病、团队信任、营地政治与路线选择是主要压力。',
            '默认丧尸规则为经典生化危机式感染：咬伤/血液传播、主动攻击活人、可出现少量特殊变异体；如果玩家额外配置真菌、狂暴感染、动物感染或异常能力体系，应以玩家配置优先。',
            '不要写古代王朝、宗门、灵石、银钱江湖交易；社会秩序应表现为现代设施残骸、幸存者营地、军方残部、掠夺团、临时市场和隔离区。',
            '交易和奖励优先表现为物资、药品、弹药、电池、燃油、工具、情报、安全通行权或营地信用。'
        ]
    },
    无限流: {
        value: '无限流',
        label: '无限流',
        shortLabel: '无限',
        hint: '主神空间、恐怖片轮回、奖励点、支线剧情、强化兑换与团队生存。',
        group: 'infinite',
        worldDefaults: {
            worldName: '主神空间',
            worldSize: '无尽位面',
            dynastySetting: '现实世界的轮回者被主神投放进不同恐怖片、灾难、科幻或奇幻世界执行任务；主神光球、队伍房间、任务结算、兑换强化和回归休整构成核心循环。',
            sectDensity: '适中',
            tianjiaoSetting: '成长优势来自冷静、团队分工、恐怖片情报、奖励点规划、支线剧情稀缺度、血统/技能/道具适配、基因锁开启风险与任务存活率。',
            worldExtraRequirement: '本局为无限流：外部市场入口必须称为主神商城，团队内部兑换页可称为团队商城；核心货币是奖励点，关键高级兑换还需要D/C/B/A/S级支线剧情；任务奖励由主神按主线任务、支线任务、存活、击杀或隐藏贡献结算。不得把经济写成银子、灵石、人民币或古风组织贡献。'
        },
        worldSizeLabel: '轮回规模',
        worldSizeHint: '决定主神空间、轮回小队、任务世界、回归休整和跨世界线索的叙事尺度。',
        dynastyLabel: '主神规则',
        dynastyHint: '主神任务、恐怖片世界、队伍房间、兑换权限、惩罚规则、支线剧情与团战风险。',
        densityLabel: '轮回队伍密度',
        densityOptions: [
            { value: '稀少', label: '稀少 (单队求生)' },
            { value: '适中', label: '适中 (队伍轮换)' },
            { value: '林立', label: '林立 (团战频发)' }
        ],
        densityPromptLabel: '轮回队伍密度',
        tianjiaoLabel: '轮回者/基因锁设定',
        auctionName: '主神商城',
        marketVerb: '进入主神兑换列表',
        currencyPrompt: '外部市场、强化、修复、造人和高级物资交易通过主神商城结算；团队内部补给和成员共享兑换可称为团队商城。底层货币名称为奖励点，中层/上层货币可设为D级、C级支线剧情；更高等级支线剧情只作为稀缺门槛写入物品或任务描述。',
        currencyDisplayMode: 'infinite',
        currencyExchangePrompt: '三层货币：底层货币=奖励点，中层货币=D级支线剧情，上层货币=C级支线剧情；1 D级支线剧情=1000 奖励点，1 C级支线剧情=100 D级支线剧情。B/A/S级支线剧情只作为稀缺任务奖励或兑换门槛。',
        mapPrompt: '世界版图应按主神空间、队伍房间、训练场、主神广场、任务世界、剧情地点、安全屋、补给点、隐藏支线地点和回归通道组织。',
        skillNames: ['枪械', '格斗', '驾驶', '急救', '侦查', '计算机', '精神力', '恐怖片情报'],
        backgroundSuggestions: ['都市普通人', '医学生新人', '退役士兵', '程序员加班族', '恐怖片影迷', '警校生', '极限运动爱好者'],
        talentSuggestions: ['恐惧抗性', '情报记忆', '团队站位', '支线嗅觉', '基因锁边缘'],
        presetItemKeywords: ['智能手机', '止血喷雾', '消音手枪', '轻型防弹内衬', '精神稳定剂', '念动力入门卷轴', '基因锁稳定剂', '恐怖片情报片段', '净水片'],
        manualRealmPrompt: '能力体系：新人、正式轮回者、资深者、解开一阶基因锁、队长级轮回者；成长来自奖励点规划、支线剧情、兑换强化、基因锁、恐怖片情报与团队分工。',
        promptBoundary: '无限流开局不得生成古代门派、宗门、师门、同门、山门、藏经阁、古风组织贡献体系或营地信用；兼容变量 `玩家组织` 只能承载轮回小队、队伍房间、主神空间、临时同盟或团战阵营。',
        promptLines: [
            '本存档以无限流/主神空间为核心题材：主神发布任务，轮回者进入恐怖片或跨题材任务世界，完成主线、支线、隐藏目标后获得奖励点和支线剧情。',
            '外部市场、强化、修复和兑换入口必须称为主神商城；团队内部兑换页可称为团队商城。奖励点是基础货币，D/C/B/A/S级支线剧情是稀缺高级门槛，不要混用银钱、灵石、宗门贡献或现实工资作为核心经济。',
            '能力成长可包含血统、技能、科技装备、魔法物品、武学、精神力、基因锁和团队分工，但每次强化都要有奖励点/支线剧情成本、适配风险、任务压力和副作用。',
            '任务结构应强调主神倒计时、强制目标、可选支线、隐藏奖励、团战或惩罚规则；剧情世界可以跨恐怖、科幻、灾难、奇幻、武侠等类型，但主神规则始终是最高框架。'
        ]
    }
};

export const 题材模式顺序: 题材模式类型[] = ['武侠', '仙侠', '西方奇幻', '灵气复苏', '都市修仙', '现代都市', '末日丧尸', '无限流'];

export const 规范化题材模式 = (mode?: unknown): 题材模式类型 => (
    mode === '灵气修仙'
        ? '灵气复苏'
        : mode === '末世丧尸'
            ? '末日丧尸'
            : typeof mode === 'string' && Object.prototype.hasOwnProperty.call(题材模式配置表, mode)
                ? mode as 题材模式类型
                : '武侠'
);

export const 获取题材模式配置 = (mode?: unknown): 题材模式配置 => (
    题材模式配置表[规范化题材模式(mode)]
);

export const 题材是否仙侠 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'xianxia' || group === 'urban_xianxia';
};

export const 题材是否现代 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'urban_xianxia' || group === 'modern' || group === 'apocalypse';
};

export const 获取题材模式选项 = () => (
    题材模式顺序.map((value) => {
        const profile = 题材模式配置表[value];
        return { value, label: profile.label, hint: profile.hint };
    })
);

export const 合并题材世界默认值 = (
    mode: 题材模式类型,
    previous?: Partial<WorldGenConfig>
): Partial<WorldGenConfig> => ({
    ...previous,
    ...获取题材模式配置(mode).worldDefaults,
    manualWorldPrompt: previous?.manualWorldPrompt || '',
    manualRealmPrompt: previous?.manualRealmPrompt || '',
    difficulty: previous?.difficulty || 'normal'
});
