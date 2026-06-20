import type { GameResponse, PostprocessSignal, TavernCommand } from '../../types';

export type 后处理调度状态快照 = {
    任务列表?: unknown;
    社交?: unknown;
    [key: string]: unknown;
};

export type 后处理调度判定输入 = {
    postprocessSignal?: PostprocessSignal;
    response?: Partial<GameResponse> & Record<string, unknown>;
    state?: 后处理调度状态快照 | null;
    previousState?: 后处理调度状态快照 | null;
};

export type 后处理调度判定结果 = {
    worldStageRequested: boolean;
    planningStageRequested: boolean;
    worldReasons: string[];
    planningReasons: string[];
    signalReliable: boolean;
};

const 安全兜底原因 = '后处理信号缺失或解析失败，按安全兜底执行。';

const 规划承接信号规则: Array<[string, RegExp]> = [
    ['下一回合强制触发', /下一回合强制触发/u],
    ['强制接住', /强制接住/u],
    ['待承接', /待承接/u],
    ['关系突破', /关系突破/u],
    ['冲突升级', /冲突升级/u],
    ['玩家意图转向', /玩家意图转向/u],
    ['新主要角色', /新主要角色/u]
];

const 世界侧后果规则: Array<[string, RegExp]> = [
    ['重大事件', /重大事件/u],
    ['时间大跨度', /时间大跨度|数日后|数周后|数月后|多年后|一周后|几天后|次日|第二天/u],
    ['地点大跨度', /地点大跨度|跨城|跨区|远赴|转场到/u],
    ['后台余波', /后台余波|世界余波|余波扩散/u],
    ['组织行动', /组织行动|势力行动|公司行动|学校行动|社团行动|利益集团/u],
    ['NPC远端行动', /NPC远端行动|远端行动|远处.*行动/u],
    ['世界镜头', /世界镜头|镜头切到|与此同时/u]
];

const 主线结束状态 = /已完成|完成|已失效|失效|已失败|失败|已取消|取消|作废|过期/u;

const 去重 = (items: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    items.forEach((item) => {
        const text = item.trim();
        if (!text || seen.has(text)) return;
        seen.add(text);
        result.push(text);
    });
    return result;
};

const 安全转JSON = (value: unknown): string => {
    try {
        return JSON.stringify(value) || '';
    } catch {
        return '';
    }
};

const 读取文本字段 = (source: Record<string, unknown> | undefined, keys: string[]): string[] => {
    if (!source) return [];
    return keys
        .map((key) => source[key])
        .flatMap((value) => {
            if (typeof value === 'string') return [value];
            if (Array.isArray(value)) {
                return value.flatMap((item) => typeof item === 'string' ? [item] : []);
            }
            return [];
        });
};

const 提取响应文本 = (response?: Partial<GameResponse> & Record<string, unknown>): string => {
    if (!response) return '';
    const parts: string[] = [];

    if (Array.isArray(response.logs)) {
        response.logs.forEach((log) => {
            if (log?.text) parts.push(log.text);
            if (log?.rawText) parts.push(log.rawText);
        });
    }
    if (Array.isArray(response.body_original_logs)) {
        (response.body_original_logs as unknown[]).forEach((log) => {
            if (log && typeof log === 'object') {
                const text = (log as Record<string, unknown>).text;
                const rawText = (log as Record<string, unknown>).rawText;
                if (typeof text === 'string') parts.push(text);
                if (typeof rawText === 'string') parts.push(rawText);
            }
        });
    }

    parts.push(...读取文本字段(response, [
        't_plan',
        't_var_plan',
        't_state',
        't_branch',
        't_cmd',
        'planning_analysis_report',
        'story_plan',
        'variable_plan',
        'planningText',
        'rawText',
        '剧情规划'
    ]));

    if (Array.isArray(response.dynamic_world)) {
        parts.push(...response.dynamic_world.filter((item): item is string => typeof item === 'string'));
    }
    if (Array.isArray(response.tavern_commands)) {
        parts.push(安全转JSON(response.tavern_commands));
    }
    if (Array.isArray(response.planning_analysis_commands)) {
        parts.push(安全转JSON(response.planning_analysis_commands));
    }

    return parts.filter(Boolean).join('\n');
};

const 提取动态世界线索 = (response?: Partial<GameResponse>): string[] => (
    Array.isArray(response?.dynamic_world)
        ? response.dynamic_world.map((item) => (item || '').trim()).filter(Boolean)
        : []
);

const 读取对象文本 = (item: unknown, keys: string[]): string => {
    if (!item || typeof item !== 'object') return '';
    const record = item as Record<string, unknown>;
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
};

const 是主线任务 = (item: unknown): boolean => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Record<string, unknown>;
    const markers = [
        record.类型,
        record.任务类型,
        record.分类,
        record.类别,
        record.名称,
        record.标题,
        record.name,
        record.title
    ];
    return markers.some((value) => typeof value === 'string' && value.includes('主线'));
};

const 收集任务规划原因 = (state?: 后处理调度状态快照 | null): string[] => {
    if (!state || !Array.isArray(state.任务列表)) return [];
    const mainlineTasks = state.任务列表.filter(是主线任务);
    if (mainlineTasks.length === 0) {
        return ['当前没有可承接的主线任务，需要规划分析补齐方向。'];
    }

    const ended = mainlineTasks.find((task) => {
        const status = 读取对象文本(task, ['状态', '当前状态', '任务状态', '进度状态', '完成状态']);
        return 主线结束状态.test(status);
    });
    if (ended) {
        return ['主线任务已完成/失效，需要规划分析承接下一阶段。'];
    }
    return [];
};

const 收集关键词原因 = (text: string, rules: Array<[string, RegExp]>, reasonPrefix: string): string[] => {
    if (!text.trim()) return [];
    return rules
        .filter(([, pattern]) => pattern.test(text))
        .map(([label]) => `${reasonPrefix}：${label}。`);
};

const 是肯定主要角色 = (value: unknown): boolean => (
    value === true
    || value === 'true'
    || value === '是'
    || value === '主要角色'
    || value === '重要角色'
);

const 提取角色姓名 = (item: unknown): string => (
    读取对象文本(item, ['姓名', '名字', '名称', '角色名', 'NPC名', 'name'])
);

const 收集对象中的主要角色姓名 = (value: unknown, names: Set<string>, depth = 0): void => {
    if (depth > 4 || value == null) return;
    if (Array.isArray(value)) {
        value.forEach((item) => 收集对象中的主要角色姓名(item, names, depth + 1));
        return;
    }
    if (typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    if (是肯定主要角色(record.是否主要角色)) {
        const name = 提取角色姓名(record);
        if (name) names.add(name);
    }

    Object.values(record).forEach((item) => 收集对象中的主要角色姓名(item, names, depth + 1));
};

const 收集命令新主要角色姓名 = (commands?: TavernCommand[]): string[] => {
    if (!Array.isArray(commands)) return [];
    const names = new Set<string>();
    commands.forEach((command) => {
        const key = typeof command?.key === 'string' ? command.key : '';
        if (!key.includes('社交') && !安全转JSON(command).includes('是否主要角色')) return;
        收集对象中的主要角色姓名(command.value, names);
    });
    return [...names];
};

const 提取当前主要角色姓名 = (state?: 后处理调度状态快照 | null): string[] => {
    if (!state || !Array.isArray(state.社交)) return [];
    return state.社交
        .filter((item) => item && typeof item === 'object' && 是肯定主要角色((item as Record<string, unknown>).是否主要角色))
        .map(提取角色姓名)
        .filter(Boolean);
};

const 收集新主要角色原因 = (
    responseText: string,
    response?: Partial<GameResponse>,
    state?: 后处理调度状态快照 | null,
    previousState?: 后处理调度状态快照 | null
): string[] => {
    const commandNames = 收集命令新主要角色姓名(response?.tavern_commands);
    const candidateNames = new Set<string>(commandNames);

    if (previousState) {
        const previousNames = new Set(提取当前主要角色姓名(previousState));
        提取当前主要角色姓名(state)
            .filter((name) => !previousNames.has(name))
            .forEach((name) => candidateNames.add(name));
    }

    const mentioned = [...candidateNames].filter((name) => responseText.includes(name));
    if (mentioned.length === 0) return [];
    return [`新主要角色成立，需要规划分析承接关系与镜头：${mentioned.join('、')}。`];
};

export const 判定后处理调度请求 = ({
    postprocessSignal,
    response,
    state,
    previousState
}: 后处理调度判定输入): 后处理调度判定结果 => {
    const signalReliable = Boolean(postprocessSignal && !postprocessSignal.parseError);
    if (!signalReliable) {
        return {
            worldStageRequested: true,
            planningStageRequested: true,
            worldReasons: [安全兜底原因],
            planningReasons: [安全兜底原因],
            signalReliable: false
        };
    }

    const responseText = 提取响应文本(response);
    const dynamicWorldHints = 提取动态世界线索(response);
    const planningReasons = 去重([
        ...收集任务规划原因(state),
        ...收集关键词原因(responseText, 规划承接信号规则, '剧情承接信号命中'),
        ...收集新主要角色原因(responseText, response, state, previousState)
    ]);
    const worldReasons = 去重([
        ...(dynamicWorldHints.length > 0 ? ['动态世界提示非空，需要世界演变承接。'] : []),
        ...收集关键词原因(responseText, 世界侧后果规则, '世界侧后果命中')
    ]);

    return {
        worldStageRequested: postprocessSignal.needsWorldEvolution === true || worldReasons.length > 0,
        planningStageRequested: postprocessSignal.needsPlanningAnalysis === true || planningReasons.length > 0,
        worldReasons,
        planningReasons,
        signalReliable: true
    };
};
