export type 角色种子状态类型 = '未引入' | '已引入' | '已转正' | '暂停';

export interface 角色种子定义结构 {
    id: string;
    名称: string;
    性别?: string;
    是否启用: boolean;
    入口摘要: string;
    完整设定?: string;
    关系入口标签?: string[];
    默认发展方向?: string;
    备注?: string;
}

export interface 角色种子运行时状态结构 {
    seedId: string;
    状态: 角色种子状态类型;
    linkedNpcId?: string;
    linkedNpcName?: string;
    更新时间?: string;
}

export interface 导演配置结构 {
    玩家剧情倾向?: string;
    角色种子定义: 角色种子定义结构[];
    角色种子运行时状态: 角色种子运行时状态结构[];
}
