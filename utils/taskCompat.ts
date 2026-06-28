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

export const 提取任务世界 = (task: any): string => {
    const direct = [task?.任务世界, task?.所在世界, task?.任务副本, task?.世界标签]
        .map(取文本)
        .find(Boolean);
    return direct || '';
};

const 归一化任务去重文本 = (value: unknown): string => 取文本(value)
    .replace(/[“”"'\s，。！？；：、,.!?;:【】《》<>]/gu, '')
    .toLowerCase();

const 任务去重指纹 = (task: any): string => {
    const objectives = Array.isArray(task?.目标列表) ? task.目标列表.map((item: any) => item?.描述).join('|') : '';
    const base = [
        取文本(task?.类型),
        取文本(task?.发布人),
        取文本(task?.发布地点),
        task?.标题,
        task?.描述,
        objectives
    ].join('|');
    return 归一化任务去重文本(base);
};

export const 归一化任务类型 = (task: any): 任务类型 => {
    const rawType = typeof task?.类型 === 'string' ? task.类型.trim() : '';
    if (任务类型集合.has(rawType)) return rawType as 任务类型;
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
                const key = 任务去重指纹(task);
                if (!key) return true;
                return list.findIndex((item) => 任务去重指纹(item) === key) === index;
            })
        : []
);
