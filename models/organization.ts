// Generic player-organization model.

export type 组织任务状态 = '可接取' | '进行中' | '已完成' | '已失败' | '已过期';
export type 组织任务类型 = '日常' | '悬赏' | '建设' | '历练';

export interface 组织任务 {
    id: string;
    标题: string;
    描述: string;
    类型: 组织任务类型;
    难度: string;
    发布日期: string;
    截止日期: string;
    刷新日期: string;
    奖励贡献: number;
    奖励资金: number;
    奖励物品?: string[];
    当前状态: 组织任务状态;
}

export interface 组织商品 {
    id: string;
    物品名称: string;
    类型: '技能' | '训练' | '装备' | '材料' | string;
    兑换价格: number;
    库存: number;
    要求职位: string;
}

export interface 组织资料 {
    id: string;
    名称: string;
    类型: '技能' | '训练' | '资料' | '杂学' | string;
    品阶: string;
    简介: string;
    要求职位: string;
    要求累计贡献: number;
}

export interface 组织成员简报 {
    id: string;
    姓名: string;
    性别: '男' | '女';
    年龄: number;
    境界: string;
    身份: string;
    是否玩家本人?: boolean;
    简介: string;
}

export interface 组织能力分布 {
    凡俗?: number;
    入门?: number;
    中坚?: number;
    高手?: number;
    顶尖?: number;
    [key: string]: number | undefined;
}

export interface 组织津贴规则 {
    基础俸禄: number;
    贡献系数: number;
    规模系数: number;
    发放说明: string;
}

export interface 玩家组织结构 {
    ID: string;
    名称: string;
    简介: string;
    组织规则: string[];
    组织语义?: string;
    组织类型?: string;
    题材组织类型?: string;
    组织资金: number;
    组织物资: number;
    建设度: number;
    组织等级?: string;
    组织规模?: string;
    成员总数?: number;
    能力分布?: 组织能力分布;
    财富评级?: string;
    津贴规则?: 组织津贴规则;
    上次津贴月份?: string;
    玩家职位: string;
    玩家贡献: number;
    累计贡献?: number;
    任务列表: 组织任务[];
    兑换列表: 组织商品[];
    资料库列表?: 组织资料[];
    重要成员: 组织成员简报[];
}

export const 职位等级排序: Record<string, number> = {
    杂役弟子: 1,
    外门弟子: 2,
    内门弟子: 3,
    真传弟子: 4,
    执事: 5,
    长老: 6,
    副掌门: 7,
    掌门: 8,
    营地成员: 1,
    外勤成员: 2,
    巡逻队员: 2,
    维修工: 2,
    医疗员: 2,
    搜救队员: 3,
    物资协调员: 3,
    安全骨干: 4,
    指挥骨干: 5,
    副负责人: 6,
    负责人: 7,
    成员: 1,
    外勤: 2,
    技术成员: 2,
    行政联系人: 2,
    项目骨干: 4
};
