import { 任务分类列表, type 任务结构, type 任务目标, type 任务类型 } from '../models/task';

const 取数字 = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

export const 任务目标已完成 = (objective: Partial<任务目标> | any): boolean => {
    if (!objective || typeof objective !== 'object') return false;
    if (objective.完成状态 === true) return true;
    const total = 取数字(objective.总需进度, 0);
    if (total <= 0) return false;
    return 取数字(objective.当前进度, 0) >= total;
};

const 任务类型集合 = new Set<string>(任务分类列表);

const 取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 取奖励描述文本 = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

    const source = value as Record<string, unknown>;
    const type = 取文本(source.类型) || 取文本(source.type) || 取文本(source.类别);
    const content = 取文本(source.内容)
        || 取文本(source.text)
        || 取文本(source.描述)
        || 取文本(source.说明)
        || 取文本(source.名称)
        || 取文本(source.name);
    if (type && content) return `${type}：${content}`;
    if (content) return content;
    if (type) return type;

    return Object.entries(source)
        .map(([key, raw]) => {
            const text = 取文本(raw);
            return key && text ? `${key}：${text}` : '';
        })
        .filter(Boolean)
        .slice(0, 3)
        .join('；');
};

export const 规范化任务奖励描述列表 = (raw: unknown): string[] => {
    const source = Array.isArray(raw) ? raw : (raw === undefined || raw === null ? [] : [raw]);
    return source
        .map(取奖励描述文本)
        .map((item) => item.trim())
        .filter(Boolean);
};

const 合并任务文本 = (task: any): string => [
    task?.类型,
    task?.标题,
    task?.描述,
    task?.发布人,
    task?.发布地点,
    task?.任务世界,
    task?.所在世界,
    task?.任务副本,
    task?.世界标签,
    task?.推荐境界,
    task?.剧情暗线,
    Array.isArray(task?.目标列表) ? task.目标列表.map((item: any) => item?.描述).join(' ') : '',
    规范化任务奖励描述列表(task?.奖励描述).join(' ')
].filter(Boolean).join(' ');

const 具体地点或团队名正则 = /小队|团队|同盟|队伍|队长|成员|主神空间|主神广场|房间|偏厅|大厅|卧室|厨房|走廊|门口|村|古宅|安全屋|据点|营地|办公室|资料室/u;

export const 提取任务世界 = (task: any): string => {
    const direct = [task?.任务世界, task?.所在世界, task?.任务副本, task?.世界标签]
        .map(取文本)
        .find(Boolean);
    if (direct && !具体地点或团队名正则.test(direct)) return direct;
    const text = 合并任务文本(task);
    const bracketWorld = text.match(/任务世界[<《](.*?)[>》]/u)?.[1]?.trim();
    if (bracketWorld) return `任务世界<${bracketWorld}>`;
    const namedWorld = text.match(/([\u4e00-\u9fa5A-Za-z0-9·：:《》<>-]{2,24}(?:任务世界|世界|副本|恐怖片))/u)?.[1]?.trim();
    if (namedWorld && !具体地点或团队名正则.test(namedWorld)) return namedWorld;
    if (/主神|轮回|奖励点|支线剧情|恐怖片|任务世界/u.test(text)) return '当前任务世界';
    return direct || '';
};

const 归一化任务去重文本 = (value: unknown): string => 取文本(value)
    .replace(/任务世界[<《].*?[>》]/gu, '任务世界')
    .replace(/[“”"'\s，。！？；：、,.!?;:【】《》<>]/gu, '')
    .replace(/二十四小时|24小时|第一夜|至天亮|活到天亮|存活到天亮/gu, '存活至天亮')
    .replace(/封门古宅|荒废古宅|古宅偏厅|东偏厅/gu, '当前任务地点')
    .toLowerCase();

const 是无限流任务 = (task: any): boolean => /主神|轮回|奖励点|支线剧情|任务世界|恐怖片|小队|团队/u.test(合并任务文本(task));

const 是主神主线生存任务 = (task: any): boolean => (
    取文本(task?.类型) === '主线'
    && /主神|任务世界|倒计时|存活|天亮|24小时|二十四小时/u.test(合并任务文本(task))
);

const 是团队重复生存任务 = (task: any): boolean => (
    取文本(task?.类型) !== '主线'
    && /团队|小队|同盟|队长|资深者|轮回者/u.test(合并任务文本(task))
    && /存活|天亮|24小时|二十四小时|主线任务/u.test(合并任务文本(task))
);

const 是同一生存倒计时任务 = (task: any): boolean => (
    是无限流任务(task)
    && /存活|活下去|撑过|天亮|24小时|二十四小时|第一夜|倒计时/u.test(合并任务文本(task))
    && /主神|任务世界|恐怖片|副本|古宅|民宅|安全屋|第一夜|天亮/u.test(合并任务文本(task))
);

const 任务去重指纹 = (task: any): string => {
    const objectives = Array.isArray(task?.目标列表) ? task.目标列表.map((item: any) => item?.描述).join('|') : '';
    const base = [
        取文本(task?.类型),
        取文本(task?.发布人),
        提取任务世界(task),
        task?.标题,
        task?.描述,
        objectives
    ].join('|');
    return 归一化任务去重文本(base);
};

export const 归一化任务类型 = (task: any): 任务类型 => {
    const rawType = typeof task?.类型 === 'string' ? task.类型.trim() : '';
    if (任务类型集合.has(rawType)) return rawType as 任务类型;
    const text = 合并任务文本(task);
    if (/门派|宗门|师门|同门|山门|藏经阁|聚宝阁|外务堂|戒律|贡献|俸禄/u.test(text)) return '门派';
    if (/悬赏|悬榜|通缉|赏金|缉拿|缉盗|追捕/u.test(text)) return '悬赏';
    if (/传闻|流言|风声|消息|打听|坊间|江湖传言/u.test(text)) return '传闻';
    if (/奇遇|偶遇|机缘|秘境|异象|突发|误入|邂逅/u.test(text)) return '奇遇';
    if (/主线|主剧情|核心|宿命|血仇|身世|家族旧案|命脉/u.test(text)) return '主线';
    return '支线';
};

export const 规范化任务自动结算 = (task: 任务结构 | any): 任务结构 | any => {
    if (!task || typeof task !== 'object') return task;
    const objectives = Array.isArray(task.目标列表)
        ? task.目标列表.map((objective: any) => {
            const done = 任务目标已完成(objective);
            const total = Math.max(0, 取数字(objective?.总需进度, 0));
            const current = Math.max(0, 取数字(objective?.当前进度, done ? total : 0));
            return {
                ...objective,
                当前进度: done && total > 0 ? Math.max(current, total) : current,
                完成状态: done,
            };
        })
        : [];
    const allObjectivesDone = objectives.length > 0 && objectives.every(任务目标已完成);
    const currentStatus = typeof task.当前状态 === 'string' && task.当前状态.trim()
        ? task.当前状态
        : '进行中';
    const shouldAutoComplete = allObjectivesDone && currentStatus !== '已完成' && currentStatus !== '已失败';
    const taskWorld = 提取任务世界(task);
    return {
        ...task,
        类型: 归一化任务类型(task),
        ...(taskWorld ? { 任务世界: taskWorld } : {}),
        当前状态: shouldAutoComplete ? '已完成' : currentStatus,
        目标列表: objectives,
        奖励描述: 规范化任务奖励描述列表(task.奖励描述),
    };
};

export const 规范化任务列表自动结算 = (tasks: any[]): any[] => (
    Array.isArray(tasks)
        ? tasks
            .map(规范化任务自动结算)
            .filter((task, index, list) => {
                if (!是无限流任务(task)) return true;
                if (是团队重复生存任务(task) && list.some(是主神主线生存任务)) return false;
                if (是同一生存倒计时任务(task)) {
                    return list.findIndex(是同一生存倒计时任务) === index;
                }
                const key = 任务去重指纹(task);
                if (!key) return true;
                return list.findIndex((item) => 任务去重指纹(item) === key) === index;
            })
        : []
);
