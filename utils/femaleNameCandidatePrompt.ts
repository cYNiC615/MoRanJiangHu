import { 构建女性姓名黑名单提示词, 常见女性姓名黑名单 } from './femaleNameSelector';

const 默认禁用模板名 = [
    '苏婉儿',
    '婉儿',
    '林清雪',
    '清雪',
    '柳若嫣',
    '若嫣',
    '灵儿',
    '月儿',
    '芷若',
    '小雅',
    '小柔',
    '小蝶',
    '小环',
    '小翠'
];

const 规范化姓名 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

export const 构建女性姓名候选提示词 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
    count?: number;
}): string => {
    void params;
    return 构建女性姓名黑名单提示词();
};

export const 收集女性姓名候选已用名 = (stateLike?: any): string[] => {
    const used = new Set<string>();
    const push = (value: unknown) => {
        const name = 规范化姓名(value);
        if (name) used.add(name);
    };
    const social = Array.isArray(stateLike?.社交) ? stateLike.社交 : [];
    social.forEach((npc: any) => {
        push(npc?.姓名);
        if (Array.isArray(npc?.曾用名)) npc.曾用名.forEach(push);
    });
    push(stateLike?.角色?.姓名);
    [...默认禁用模板名, ...常见女性姓名黑名单].forEach(push);
    return Array.from(used);
};
