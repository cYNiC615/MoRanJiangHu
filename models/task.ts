
// 任务系统定义

export type 任务状态 = '进行中' | '可提交' | '已完成' | '已失败';
export type 任务类型 = '主线' | '支线' | '门派' | '奇遇' | '悬赏' | '传闻';
export const 任务分类列表: 任务类型[] = ['主线', '支线', '门派', '奇遇', '悬赏', '传闻'];

export interface 任务目标 {
    描述: string;           // 任务目标描述
    当前进度: number;
    总需进度: number;
    完成状态: boolean;
}

export interface 任务结构 {
    标题: string;           // 任务标题
    描述: string;           // 任务背景描述
    类型: 任务类型;
    发布人: string;         // 发布者名称
    发布地点: string;       // 地点名
    任务世界?: string;       // 无限流等跨世界任务的世界级名称
    所在世界?: string;       // 兼容 AI 可能返回的同义字段
    任务副本?: string;       // 兼容 AI 可能返回的同义字段
    世界标签?: string;       // 兼容 AI 可能返回的同义字段
    推荐境界: string;       // 境界要求
    
    // 时间限制 (可选)
    截止时间?: string;      // YYYY:MM:DD:HH:MM
    
    当前状态: 任务状态;
    目标列表: 任务目标[];
    
    // 奖励 (描述性，用于显示)
    奖励描述: string[];     // 奖励描述列表
    奖励已发放?: boolean;   // 防止完成任务后重复结算
    奖励发放时间?: string;
    奖励发放人?: string;
    奖励到账记录?: string[];
    
    // AI 辅助字段 (暗线)
    剧情暗线?: string;      // 给AI看的暗线说明
}
