import { 获取题材模式配置 } from './topicModeProfiles';

export const 题材是否使用默认现代境界 = (mode?: unknown): boolean => {
    const group = 获取题材模式配置(mode).group;
    return group === 'modern' || group === 'apocalypse' || group === 'western_fantasy' || group === 'infinite';
};
