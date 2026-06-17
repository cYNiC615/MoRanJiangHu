import type {
    世界书结构,
    世界书预设组结构,
    记忆配置结构,
    内置提示词条目结构,
    图片管理设置结构,
    场景图片档案,
    接口设置结构,
    提示词结构,
    游戏设置结构,
    视觉设置结构,
} from '../../../types';
import * as dbService from '../../../services/dbService';
import { recordDiagnosticLog } from '../../../services/diagnosticLog';
import { bundledDefaultWorldbookIds, loadAllBundledWorldbookPresets } from '../../../data/worldbookPresets';
import { 按场景图上限裁剪档案 } from '../sceneImageArchiveWorkflow';
import { 规范化游戏设置 } from '../../../utils/gameSettings';
import { 规范化图片管理设置 } from '../../../utils/imageManagerSettings';
import { 设置键 } from '../../../utils/settingsSchema';
import { 写入接口设置本地镜像, 规范化接口设置 } from '../../../utils/apiConfig';
import { 内置提示词存储键, 规范化内置提示词列表 } from '../../../utils/builtinPrompts';
import { 世界书存储键, 世界书预设组存储键, 规范化世界书列表, 规范化世界书预设组列表 } from '../../../utils/worldbook';
import { 规范化记忆配置 } from '../memoryUtils';

type 设置持久化工作流依赖 = {
    获取接口配置: () => 接口设置结构;
    同步接口配置: (config: 接口设置结构) => void;
    设置内置提示词列表: (entries: 内置提示词条目结构[]) => void;
    设置世界书列表: (books: 世界书结构[]) => void;
    设置世界书预设组列表: (groups: 世界书预设组结构[]) => void;
    应用视觉设置到状态: (value: Partial<视觉设置结构> | null | undefined) => void;
    应用图片管理设置到状态: (value: Partial<图片管理设置结构> | null | undefined) => void;
    获取当前场景图片档案: () => 场景图片档案;
    同步场景图片档案: (archive: 场景图片档案) => void;
    获取场景图历史上限: () => number;
    设置游戏设置: (config: 游戏设置结构) => void;
    设置记忆配置: (config: 记忆配置结构) => void;
    设置提示词池: (prompts: 提示词结构[]) => void;
};

export const 创建设置持久化工作流 = (deps: 设置持久化工作流依赖) => {
    const saveSettings = async (newConfig: 接口设置结构) => {
        const normalized = 规范化接口设置(newConfig);
        deps.同步接口配置(normalized);
        写入接口设置本地镜像(normalized);
        await dbService.保存设置(设置键.API配置, normalized);
    };

    const updateApiConfig = (updater: (config: 接口设置结构) => 接口设置结构) => {
        const nextConfig = updater(规范化接口设置(deps.获取接口配置()));
        return saveSettings(nextConfig);
    };

    const loadBuiltinPromptEntries = async () => {
        try {
            const savedEntries = await dbService.读取设置(内置提示词存储键);
            deps.设置内置提示词列表(规范化内置提示词列表(savedEntries));
        } catch (error) {
            recordDiagnosticLog('error', ['读取内置提示词失败', {
                message: error?.message || '',
                stack: typeof error?.stack === 'string' ? error.stack : undefined
            }]);
            console.error('读取内置提示词失败', error);
        }
    };

    const loadWorldbooks = async () => {
        try {
            const savedEntries = await dbService.读取设置(世界书存储键);
            const normalizedSavedEntries = 规范化世界书列表(savedEntries);
            let bundledDefaults: 世界书结构[] = [];
            try {
                bundledDefaults = await loadAllBundledWorldbookPresets();
            } catch (error) {
                recordDiagnosticLog('warn', ['读取默认世界书预置失败', {
                    message: error?.message || '',
                    stack: typeof error?.stack === 'string' ? error.stack : undefined
                }]);
                console.error('读取默认世界书预置失败', error);
            }
            const normalizedMergedEntries = 规范化世界书列表([...bundledDefaults, ...normalizedSavedEntries]);
            deps.设置世界书列表(normalizedMergedEntries);
            const hasMissingBundledDefaults = bundledDefaultWorldbookIds.some((id) => !normalizedSavedEntries.some((book) => book.id === id));
            if (hasMissingBundledDefaults) {
                await dbService.保存设置(世界书存储键, normalizedMergedEntries);
            }
        } catch (error) {
            recordDiagnosticLog('error', ['读取世界书列表失败', {
                message: error?.message || '',
                stack: typeof error?.stack === 'string' ? error.stack : undefined
            }]);
            console.error('读取世界书列表失败', error);
        }
    };

    const loadWorldbookPresetGroups = async () => {
        try {
            const savedGroups = await dbService.读取设置(世界书预设组存储键);
            deps.设置世界书预设组列表(规范化世界书预设组列表(savedGroups));
        } catch (error) {
            recordDiagnosticLog('error', ['读取世界书预设组失败', {
                message: error?.message || '',
                stack: typeof error?.stack === 'string' ? error.stack : undefined
            }]);
            console.error('读取世界书预设组失败', error);
        }
    };

    const saveBuiltinPromptEntries = async (entries: 内置提示词条目结构[]) => {
        const normalized = 规范化内置提示词列表(entries);
        deps.设置内置提示词列表(normalized);
        await dbService.保存设置(内置提示词存储键, normalized);
    };

    const saveWorldbooks = async (books: 世界书结构[]) => {
        const normalized = 规范化世界书列表(books);
        deps.设置世界书列表(normalized);
        await dbService.保存设置(世界书存储键, normalized);
    };

    const saveWorldbookPresetGroups = async (groups: 世界书预设组结构[]) => {
        const normalized = 规范化世界书预设组列表(groups);
        deps.设置世界书预设组列表(normalized);
        await dbService.保存设置(世界书预设组存储键, normalized);
    };

    const saveVisualSettings = async (newConfig: 视觉设置结构) => {
        deps.应用视觉设置到状态(newConfig);
    };

    const saveImageManagerSettings = async (newConfig: 图片管理设置结构) => {
        const normalized = 规范化图片管理设置(newConfig);
        deps.应用图片管理设置到状态(normalized);
        const { 档案: nextArchive, 删除数量 } = 按场景图上限裁剪档案(
            deps.获取当前场景图片档案() || {},
            deps.获取场景图历史上限()
        );
        deps.同步场景图片档案(nextArchive);
        await dbService.保存设置(设置键.场景图片档案, nextArchive);
        if (删除数量 > 0) {
            await dbService.清理未引用图片资源();
        }
    };

    const saveGameSettings = async (newConfig: 游戏设置结构) => {
        const normalized = 规范化游戏设置(newConfig);
        deps.设置游戏设置(normalized);
        await dbService.保存设置(设置键.游戏设置, normalized);
    };

    const saveMemorySettings = async (newConfig: 记忆配置结构) => {
        const normalized = 规范化记忆配置(newConfig);
        deps.设置记忆配置(normalized);
        await dbService.保存设置(设置键.记忆设置, normalized);
    };

    const updatePrompts = async (newPrompts: 提示词结构[]) => {
        deps.设置提示词池(newPrompts);
        await dbService.保存设置(设置键.提示词池, newPrompts);
    };

    return {
        loadBuiltinPromptEntries,
        loadWorldbooks,
        loadWorldbookPresetGroups,
        saveSettings,
        saveBuiltinPromptEntries,
        saveWorldbooks,
        saveWorldbookPresetGroups,
        saveVisualSettings,
        saveImageManagerSettings,
        updateApiConfig,
        saveGameSettings,
        saveMemorySettings,
        updatePrompts
    };
};
