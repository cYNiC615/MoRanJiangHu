import type { 接口设置结构 } from '../types';
import { 获取文生图接口配置, 获取NSFW文生图接口配置, 接口配置是否可用 } from './apiConfig';

export const 解析文生图功能配置 = (apiConfig: 接口设置结构) => {
    const feature = apiConfig?.功能模型占位 as any;
    const 场景横竖屏 = feature?.自动场景生图横竖屏 === '竖屏' ? '竖屏' : '横屏';
    const 场景尺寸 = typeof feature?.自动场景生图分辨率 === 'string' && feature.自动场景生图分辨率.trim()
        ? feature.自动场景生图分辨率.trim()
        : (场景横竖屏 === '竖屏' ? '576x1024' : '1024x576');
    return {
        总开关: feature?.文生图功能启用 === true,
        NPC开关: feature?.文生图功能启用 === true && feature?.NPC生图启用 === true,
        使用词组转化器: feature?.NPC生图使用词组转化器 !== false,
        性别筛选: feature?.NPC生图性别筛选 === '男' || feature?.NPC生图性别筛选 === '女' || feature?.NPC生图性别筛选 === '全部'
            ? feature.NPC生图性别筛选
            : '全部',
        重要性筛选: feature?.NPC生图重要性筛选 === '仅重要' || feature?.NPC生图重要性筛选 === '全部'
            ? feature.NPC生图重要性筛选
            : '全部',
        NPC画风: feature?.自动NPC生图画风 === '二次元' || feature?.自动NPC生图画风 === '写实' || feature?.自动NPC生图画风 === '国风'
            ? feature.自动NPC生图画风
            : '通用',
        场景画风: feature?.自动场景生图画风 === '二次元' || feature?.自动场景生图画风 === '写实' || feature?.自动场景生图画风 === '国风'
            ? feature.自动场景生图画风
            : '通用',
        场景构图要求: feature?.自动场景生图构图要求 === '故事快照' || feature?.自动场景生图构图要求 === '剧照'
            ? feature.自动场景生图构图要求
            : '纯场景',
        场景横竖屏,
        场景尺寸
    } as const;
};

export const 构建生图配置恢复签名 = (config: 接口设置结构): string => (
    [解析文生图功能配置(config).总开关, 解析文生图功能配置(config).NPC开关].join(':') + '|' +
    [获取文生图接口配置(config), 获取NSFW文生图接口配置(config)].map(api => [
        接口配置是否可用(api),
        Boolean(api?.apiKey?.trim()),
        Boolean(api?.ComfyUI工作流JSON?.trim())
    ].join(':')).join('|')
);
