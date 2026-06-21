import { GameResponse, TavernCommand, 内置提示词条目结构 } from '../../types';
import type { 当前可用接口结构 } from '../../utils/apiConfig';
import { 翻译连接测试错误 } from './imageGenerationDiagnostics';
import { parseJsonWithRepair } from '../../utils/jsonRepair';
import { 构建世界观生成消息链 } from '../../prompts/runtime/worldGeneration';
import { 构建世界观摘要提示词, 提取世界观摘要内容, 生成世界观确定性摘要 } from '../../prompts/runtime/worldSummary';
import { 构建世界演变系统提示词, 构建世界演变用户提示词 } from '../../prompts/runtime/worldEvolution';
import {
    构建变量模型身份提示词,
    构建变量模型职责提示词,
    构建变量模型系统提示词,
    构建变量模型任务提示词,
    构建变量模型输出格式提示词,
    构建变量模型用户附加规则提示词,
    构建变量模型COT伪装提示词
} from '../../prompts/runtime/variableModel';
import { 构建统一规划分析系统提示词, 构建统一规划分析用户提示词 } from '../../prompts/runtime/planningAnalysis';
import { 默认COT伪装历史消息提示词 } from '../../prompts/runtime/defaults';
import { 获取变量校准COT提示词 } from '../../prompts/runtime/variableCot';
import { 构建AI角色声明提示词 } from '../../prompts/runtime/roleIdentity';
import {
    构建统一规划分析专用上下文,
    统一规划分析COT提示词
} from '../../prompts/runtime/planUpdateReference';
import { 世界书本体槽位 } from '../../utils/worldbook';
import { 获取内置提示词槽位内容 } from '../../utils/builtinPrompts';
import {
    type 通用消息,
    type 文本请求最终消息诊断,
    构建文本请求最终消息诊断,
    规范化文本补全消息链,
    请求模型文本,
    替换COT伪装身份占位
} from './chatCompletionClient';
import {
    parseStoryRawText,
    提取首个标签内容,
    提取首尾思考区段,
    解析动态世界块,
    解析命令块
} from './storyResponseParser';

export interface ConnectionTestResult {
    ok: boolean;
    detail: string;
}

export interface StoryResponseResult {
    response: GameResponse;
    rawText: string;
    diagnostics?: StoryRequestMessageDiagnostics;
}

export interface WorldEvolutionResult {
    commands: TavernCommand[];
    updates: string[];
    rawText: string;
}

export interface WorldFoundationResult {
    worldPrompt: string;
    mapLayers: any[];
    factions: any[];
    rawText: string;
}

export interface VariableCalibrationResult {
    commands: TavernCommand[];
    reports: string[];
    rawText: string;
}

export interface PlanningAnalysisResult {
    shouldUpdate: boolean;
    reason: string;
    commands: TavernCommand[];
    notes: string[];
    rawText: string;
}

export interface PolishedBodyResult {
    bodyText: string;
    rawText: string;
}

export interface StoryStreamOptions {
    stream?: boolean;
    onDelta?: (delta: string, accumulated: string) => void;
}

export interface StoryRequestOptions {
    enableCotInjection?: boolean;
    cotPseudoHistoryPrompt?: string;
    orderedMessages?: 通用消息[];
    leadingSystemPrompt?: string;
    styleAssistantPrompt?: string;
    outputProtocolPrompt?: string;
    lengthRequirementPrompt?: string;
    runtimeTurnDirectivePrompt?: string;
    disclaimerRequirementPrompt?: string;
    validateTagCompleteness?: boolean;
    enableTagRepair?: boolean;
    requireActionOptionsTag?: boolean;
    requireDynamicWorldTag?: boolean;
    validateDialogueFormat?: boolean;
    errorDetailLimit?: number;
    includeReasoning?: boolean;
    disableThinking?: boolean;
    stripReasoning?: boolean;
    prefixMode?: boolean;
}

type 消息阶段诊断 = {
    messageCount: number;
    roleSequence: Array<通用消息['role']>;
    prefixIndexes: number[];
};

export type StoryRequestMessageDiagnostics = {
    providerProtocol: 文本请求最终消息诊断['providerProtocol'];
    supplier: string;
    runtimeRequirementsInjected: boolean;
    beforeRuntimeRequirements: 消息阶段诊断;
    afterRuntimeRequirements: 消息阶段诊断;
    providerNormalized: 文本请求最终消息诊断['providerNormalized'];
};

const 构建消息阶段诊断 = (messages: 通用消息[]): 消息阶段诊断 => ({
    messageCount: messages.length,
    roleSequence: messages.map((message) => message.role),
    prefixIndexes: messages
        .map((message, index) => (message.prefix === true ? index : -1))
        .filter((index) => index >= 0)
});

const 消息结构签名 = (messages: 通用消息[]): Array<{ role: 通用消息['role']; chars: number; prefix?: boolean }> => (
    messages.map((message) => ({
        role: message.role,
        chars: typeof message.content === 'string' ? message.content.length : 0,
        ...(message.prefix === true ? { prefix: true } : {})
    }))
);

const 消息结构相同 = (left: 通用消息[], right: 通用消息[]): boolean => (
    JSON.stringify(消息结构签名(left)) === JSON.stringify(消息结构签名(right))
);

export const 构建故事请求消息诊断 = (params: {
    apiConfig: 当前可用接口结构;
    beforeRuntimeRequirements: 通用消息[];
    afterRuntimeRequirements: 通用消息[];
}): StoryRequestMessageDiagnostics => {
    const finalDiagnostics = 构建文本请求最终消息诊断(params.apiConfig, params.afterRuntimeRequirements);
    return {
        providerProtocol: finalDiagnostics.providerProtocol,
        supplier: finalDiagnostics.supplier,
        runtimeRequirementsInjected: !消息结构相同(params.beforeRuntimeRequirements, params.afterRuntimeRequirements),
        beforeRuntimeRequirements: 构建消息阶段诊断(params.beforeRuntimeRequirements),
        afterRuntimeRequirements: 构建消息阶段诊断(params.afterRuntimeRequirements),
        providerNormalized: finalDiagnostics.providerNormalized
    };
};

export interface WorldStreamOptions {
    stream?: boolean;
    onDelta?: (delta: string, accumulated: string) => void;
}

interface RecallStreamOptions {
    stream?: boolean;
    onDelta?: (delta: string, accumulated: string) => void;
}

export const generateMemoryRecall = async (
    systemPrompt: string,
    userPrompt: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    streamOptions?: RecallStreamOptions,
    extraPrompt?: string,
    cotPseudoHistoryPrompt?: string
): Promise<string> => {
    const normalizedExtraPrompt = (extraPrompt || '').trim();
    const normalizedCotPseudoPrompt = (cotPseudoHistoryPrompt || '').trim();
    const messagesRaw: 通用消息[] = [
        { role: 'system', content: systemPrompt }
    ];
    if (normalizedExtraPrompt) {
        messagesRaw.push({ role: 'user', content: `【额外要求提示词】\n${normalizedExtraPrompt}` });
    }
    messagesRaw.push({ role: 'user', content: userPrompt });
    if (normalizedCotPseudoPrompt) {
        messagesRaw.push({ role: 'assistant', content: normalizedCotPseudoPrompt });
    }
    const messages = 规范化文本补全消息链(messagesRaw, { 保留System: true, 合并同角色: false });
    return 请求模型文本(apiConfig, messages, {
        temperature: 0.2,
        signal,
        streamOptions
    });
};

export const 清理润色正文输出 = (rawText: string): string => {
    let text = (rawText || '').trim();
    if (!text) return '';

    text = text
        .replace(/^```(?:text|markdown)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();

    const thinkingSegment = 提取首尾思考区段(text);
    const textWithoutThinking = (
        thinkingSegment.matched
            ? thinkingSegment.textWithoutThinking
            : text
    ).trim();
    const bodyOpenRegex = /<\s*正文\s*>/gi;
    let bodyOpenMatch: RegExpExecArray | null = null;
    let lastBodyOpenMatch: RegExpExecArray | null = null;
    while ((bodyOpenMatch = bodyOpenRegex.exec(textWithoutThinking)) !== null) {
        lastBodyOpenMatch = bodyOpenMatch;
    }
    if (!lastBodyOpenMatch || typeof lastBodyOpenMatch.index !== 'number') {
        return '';
    }
    const bodyStart = lastBodyOpenMatch.index + lastBodyOpenMatch[0].length;
    const afterBodyOpen = textWithoutThinking.slice(bodyStart);
    const bodyCloseMatch = afterBodyOpen.match(/<\s*\/\s*正文\s*>/i);
    const bodyPayload = bodyCloseMatch && typeof bodyCloseMatch.index === 'number'
        ? afterBodyOpen.slice(0, bodyCloseMatch.index)
        : afterBodyOpen;
    const payload = bodyPayload
        .replace(/^[\t ]+|[\t ]+$/gm, '')
        .trim();
    return payload;
};

export const generatePolishedBody = async (
    bodyText: string,
    polishPrompt: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    extraPrompt?: string,
    cotPseudoHistoryPrompt?: string,
    streamOptions?: WorldStreamOptions
): Promise<PolishedBodyResult> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');
    const normalizedBody = (bodyText || '').trim();
    if (!normalizedBody) {
        return {
            bodyText: '',
            rawText: ''
        };
    }

    const normalizedPrompt = (polishPrompt || '').trim();
    const fallbackPrompt = [
        '请在不改变事实前提下润色正文，并仅输出正文。',
        '【输出结构硬约束】',
        '1) 你必须输出 <thinking>...</thinking> 与 <正文>...</正文> 两个标签块，顺序固定为 thinking 在前、正文在后。',
        '2) 除这两个标签外，禁止输出其他内容（解释、命令、免责声明、代码块等）。',
        '3) 系统只会提取 <正文> 内容用于最终渲染。'
    ].join('\n');
    const systemPrompt = normalizedPrompt || fallbackPrompt;
    const normalizedExtraPrompt = (extraPrompt || '').trim();
    const normalizedCotPseudoPrompt = (cotPseudoHistoryPrompt || '').trim();
    const userPrompt = [
        '【待润色正文】',
        normalizedBody,
        normalizedExtraPrompt ? `\n【最终输出附加要求】\n${normalizedExtraPrompt}` : ''
    ].filter(Boolean).join('\n');

    const messagesRaw: 通用消息[] = [
        { role: 'system', content: systemPrompt }
    ];
    if (normalizedExtraPrompt) {
        messagesRaw.push({ role: 'user', content: `【额外要求提示词】\n${normalizedExtraPrompt}` });
    }
    messagesRaw.push({ role: 'user', content: userPrompt });
    if (normalizedCotPseudoPrompt) {
        messagesRaw.push({ role: 'assistant', content: normalizedCotPseudoPrompt });
    }
    const messages = 规范化文本补全消息链(messagesRaw, { 保留System: true, 合并同角色: false });

    const raw = await 请求模型文本(apiConfig, messages, {
        temperature: 0.6,
        signal,
        streamOptions,
        errorDetailLimit: Number.POSITIVE_INFINITY
    });

    return {
        bodyText: 清理润色正文输出(raw),
        rawText: raw
    };
};

export const generateWorldData = async (
    worldContext: string,
    charData: any,
    apiConfig: 当前可用接口结构,
    streamOptions?: WorldStreamOptions,
    extraPrompt?: string,
    cotPseudoHistoryPrompt?: string,
    config?: { signal?: AbortSignal; openingConfig?: any } & Record<string, unknown>
): Promise<string> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');

    const messagesRaw: 通用消息[] = 构建世界观生成消息链({
        worldContext,
        charData,
        extraPrompt,
        cotPseudoHistoryPrompt,
        config,
        openingConfig: config?.openingConfig
    });
    const messages = 规范化文本补全消息链(messagesRaw, { 保留System: true, 合并同角色: false });

    const rawText = await 请求模型文本(apiConfig, messages, {
        temperature: 0.8,
        streamOptions,
        signal: config?.signal
    });

    return 解析世界观提示词内容(rawText);
};

export const generateWorldFoundationData = async (
    worldContext: string,
    charData: any,
    apiConfig: 当前可用接口结构,
    streamOptions?: WorldStreamOptions,
    extraPrompt?: string,
    cotPseudoHistoryPrompt?: string,
    config?: { signal?: AbortSignal; openingConfig?: any } & Record<string, unknown>
): Promise<WorldFoundationResult> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');

    const foundationConfig = {
        ...config,
        生成世界基底: true
    };
    const messagesRaw: 通用消息[] = 构建世界观生成消息链({
        worldContext,
        charData,
        extraPrompt,
        cotPseudoHistoryPrompt,
        config: foundationConfig,
        openingConfig: config?.openingConfig
    });
    const messages = 规范化文本补全消息链(messagesRaw, { 保留System: true, 合并同角色: false });

    const rawText = await 请求模型文本(apiConfig, messages, {
        temperature: 0.8,
        streamOptions,
        signal: config?.signal
    });

    return 解析世界观生成结果(rawText);
};

export const generateWorldPromptSummary = async (
    worldPrompt: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal
): Promise<string> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');
    const fallback = 生成世界观确定性摘要(worldPrompt);
    const messages = 规范化文本补全消息链([
        {
            role: 'system' as const,
            content: '你是世界观摘要压缩器。只输出可长期引用的本局独特设定摘要，不写普通现代生活常识。'
        },
        {
            role: 'user' as const,
            content: 构建世界观摘要提示词(worldPrompt)
        }
    ], { 保留System: true, 合并同角色: false });
    const rawText = await 请求模型文本(apiConfig, messages, {
        temperature: 0.2,
        signal,
        errorDetailLimit: Number.POSITIVE_INFINITY
    });
    const parsed = 提取世界观摘要内容(rawText);
    return parsed || fallback;
};

export const 解析世界观生成结果 = (content: string): WorldFoundationResult => {
    const source = (content || '').trim();
    if (!source) {
        throw new Error('世界观生成解析失败: 输出为空');
    }

    const 清理世界观候选文本 = (value: unknown): string => {
        if (typeof value !== 'string') return '';
        return value
            .replace(/^```(?:json|JSON)?\s*/g, '')
            .replace(/\s*```$/g, '')
            .replace(/^\s*(?:以下是|下面是|这是)?\s*(?:生成的|整理后的)?\s*世界观(?:设定|母本|提示词)?\s*[:：]\s*/i, '')
            .trim();
    };

    const 提取无标签世界观候选 = (text: string): string => {
        const withoutThinking = text
            .replace(/<\s*thinking\s*>[\s\S]*?<\s*\/\s*thinking\s*>/gi, '')
            .replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, '')
            .trim();
        const markerMatch = withoutThinking.match(/(?:【\s*世界观(?:设定|母本|提示词)?\s*】|#+\s*世界观(?:设定|母本|提示词)?|世界观(?:设定|母本|提示词)?\s*[:：])([\s\S]*)/i);
        const candidateSource = markerMatch?.[1] || withoutThinking;
        const [candidate] = candidateSource.split(/(?:<\s*世界基底\s*>|【\s*世界基底\s*】|#+\s*世界基底|\n\s*(?:world_foundation|mapLayers|map_layers|factions|faction_list)\s*[:：])/i);
        const cleaned = 清理世界观候选文本(candidate);
        if (!cleaned) return '';
        const hasEnoughWorldText = cleaned.length >= 80 || /世界|大陆|王国|宗门|公会|魔法|灵气|势力|地理|历史|规则|货币|地图|冒险/i.test(cleaned);
        if (!hasEnoughWorldText) return '';
        if (/^(抱歉|对不起|无法|不能|I\s+can't|I cannot)/i.test(cleaned)) return '';
        return cleaned;
    };

    const findLastMatch = (text: string, regex: RegExp): { index: number; length: number } | null => {
        const re = new RegExp(regex.source, regex.flags);
        let match: RegExpExecArray | null = null;
        let last: { index: number; length: number } | null = null;
        while ((match = re.exec(text)) !== null) {
            last = { index: match.index, length: match[0].length };
        }
        return last;
    };

    const lastWorldOpen = findLastMatch(source, /<\s*世界观\s*>/gi);
    const lastThinkingClose = (() => {
        const thinking = findLastMatch(source, /<\s*\/\s*thinking\s*>/gi);
        const think = findLastMatch(source, /<\s*\/\s*think\s*>/gi);
        if (!thinking && !think) return null;
        if (thinking && think) {
            return thinking.index >= think.index ? thinking : think;
        }
        return thinking || think;
    })();

    const worldIndex = lastWorldOpen?.index ?? -1;
    const thinkingIndex = lastThinkingClose ? lastThinkingClose.index + lastThinkingClose.length : -1;
    const sliceStart = Math.max(worldIndex, thinkingIndex);
    const textForParsing = (sliceStart > 0 ? source.slice(sliceStart) : source).trim();

    const worldMatches = Array.from(textForParsing.matchAll(/<\s*世界观\s*>([\s\S]*?)(?:<\s*\/\s*世界观\s*>|$)/gi));
    const worldTagBlock = worldMatches.length > 0
        ? (worldMatches[worldMatches.length - 1]?.[1] || '').trim()
        : '';

    const parsed = parseJsonWithRepair<Record<string, unknown>>(textForParsing);
    const jsonPrompt = parsed.value && typeof parsed.value === 'object'
        ? [
            parsed.value.world_prompt,
            parsed.value.worldPrompt,
            (parsed.value as any).世界观,
            (parsed.value as any).世界观提示词,
            (parsed.value as any).世界观母本
        ].map(清理世界观候选文本).find(Boolean) || ''
        : '';
    const fallbackPrompt = 提取无标签世界观候选(textForParsing);
    if (!worldTagBlock && !jsonPrompt && !fallbackPrompt && (!parsed.value || typeof parsed.value !== 'object')) {
        throw new Error(`世界观生成解析失败: 未找到<世界观>标签，且JSON解析失败: ${parsed.error || '未获得有效 JSON'}`);
    }
    const prompt = worldTagBlock || jsonPrompt || fallbackPrompt;
    if (!prompt) throw new Error('世界观生成解析失败: 未找到<世界观>标签且world_prompt为空');

    const foundationMatches = Array.from(source.matchAll(/<\s*世界基底\s*>([\s\S]*?)(?:<\s*\/\s*世界基底\s*>|$)/gi));
    const foundationBlock = foundationMatches.length > 0
        ? (foundationMatches[foundationMatches.length - 1]?.[1] || '').trim()
        : '';
    const foundationParsed = foundationBlock
        ? parseJsonWithRepair<Record<string, any>>(foundationBlock).value
        : undefined;
    const foundation = foundationParsed && typeof foundationParsed === 'object'
        ? foundationParsed
        : (parsed.value && typeof parsed.value === 'object' ? parsed.value as Record<string, any> : {});
    const worldLike = foundation?.世界 && typeof foundation.世界 === 'object' ? foundation.世界 : foundation;
    const mapLayers = [
        worldLike?.地图层级,
        worldLike?.地点树,
        worldLike?.mapLayers,
        worldLike?.map_layers
    ].find(Array.isArray) || [];
    const factions = [
        worldLike?.势力列表,
        worldLike?.factions,
        worldLike?.factionList,
        worldLike?.faction_list
    ].find(Array.isArray) || [];

    return {
        worldPrompt: prompt,
        mapLayers,
        factions,
        rawText: source
    };
};

export const 解析世界观提示词内容 = (content: string): string => 解析世界观生成结果(content).worldPrompt;


const 提取世界演变标题区块 = (text: string): { updateBlock: string; commandBlock: string } => {
    const sections: Record<'说明' | '命令', string[]> = {
        说明: [],
        命令: []
    };
    const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
    let current: '说明' | '命令' | null = null;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
            if (current) sections[current].push('');
            continue;
        }

        if (/^(?:【\s*)?(?:说明|世界更新|动态世界)(?:\s*】)?\s*[:：]?\s*(.*)$/i.test(line)) {
            current = '说明';
            const matched = line.match(/^(?:【\s*)?(?:说明|世界更新|动态世界)(?:\s*】)?\s*[:：]?\s*(.*)$/i);
            const firstLine = (matched?.[1] || '').trim();
            if (firstLine) sections[current].push(firstLine);
            continue;
        }
        if (/^(?:【\s*)?(?:命令|commands?|cmd)(?:\s*】)?\s*[:：]?\s*(.*)$/i.test(line)) {
            current = '命令';
            const matched = line.match(/^(?:【\s*)?(?:命令|commands?|cmd)(?:\s*】)?\s*[:：]?\s*(.*)$/i);
            const firstLine = (matched?.[1] || '').trim();
            if (firstLine) sections[current].push(firstLine);
            continue;
        }

        if (current) {
            sections[current].push(rawLine.trimEnd());
        }
    }

    return {
        updateBlock: sections.说明.join('\n').trim(),
        commandBlock: sections.命令.join('\n').trim()
    };
};

const 解析世界演变候选文本 = (text: string): { commands: TavernCommand[]; updates: string[] } => {
    const candidate = (text || '').trim();
    if (!candidate) return { commands: [], updates: [] };

    const updateBlock = 提取首个标签内容(candidate, '说明')
        || 提取首个标签内容(candidate, '世界更新')
        || 提取首个标签内容(candidate, '动态世界');
    const commandBlock = 提取首个标签内容(candidate, '命令');
    const titleBlocks = (!updateBlock && !commandBlock) ? 提取世界演变标题区块(candidate) : { updateBlock: '', commandBlock: '' };

    const updates = 解析动态世界块(updateBlock || titleBlocks.updateBlock);
    const commands = 解析命令块(commandBlock || titleBlocks.commandBlock)
        .map((cmd) => ({
            action: cmd.action,
            key: cmd.key,
            value: cmd.value
        })) as TavernCommand[];

    if (commands.length > 0 || updates.length > 0) {
        return { commands, updates };
    }

    return {
        commands: 解析命令块(candidate) as TavernCommand[],
        updates: []
    };
};

const 解析世界演变响应 = (rawText: string): { commands: TavernCommand[]; updates: string[] } => {
    const source = (rawText || '').trim();
    if (!source) return { commands: [], updates: [] };

    const thinkingSegment = 提取首尾思考区段(source);
    const candidates = [
        (thinkingSegment.matched ? thinkingSegment.textWithoutThinking : source).trim(),
        thinkingSegment.matched
            ? source
                .replace(/<\s*\/\s*(thinking|think)\s*>/gi, '')
                .replace(/<\s*(thinking|think)\s*>/gi, '')
                .trim()
            : '',
        source
    ].filter((item, index, list) => Boolean(item) && list.indexOf(item) === index);

    for (const candidate of candidates) {
        const parsed = 解析世界演变候选文本(candidate);
        if (parsed.commands.length > 0 || parsed.updates.length > 0) {
            return parsed;
        }
    }

    return { commands: [], updates: [] };
};

const 解析变量校准响应 = (rawText: string): { commands: TavernCommand[]; reports: string[] } => {
    const source = (rawText || '').trim();
    if (!source) return { commands: [], reports: [] };

    const thinkingSegment = 提取首尾思考区段(source);
    let textWithoutThinking = (thinkingSegment.matched ? thinkingSegment.textWithoutThinking : source).trim();
    if (thinkingSegment.matched && !textWithoutThinking) {
        textWithoutThinking = source
            .replace(/<\s*\/\s*(thinking|think)\s*>/gi, '')
            .replace(/<\s*(thinking|think)\s*>/gi, '')
            .trim();
    }
    const reportBlock = 提取首个标签内容(textWithoutThinking, '说明')
        || 提取首个标签内容(textWithoutThinking, '校准说明')
        || 提取首个标签内容(textWithoutThinking, '校准报告')
        || 提取首个标签内容(textWithoutThinking, '说明');
    const commandBlock = 提取首个标签内容(textWithoutThinking, '命令');
    const reports = 解析动态世界块(reportBlock);

    const commands = 解析命令块((commandBlock || textWithoutThinking).trim())
        .map((cmd) => ({
            action: cmd.action,
            key: cmd.key,
            value: cmd.value
        })) as TavernCommand[];

    return { commands, reports };
};

const 解析规划补丁结果 = (
    rawText: string,
    _label: string
): {
    shouldUpdate: boolean;
    reason: string;
    commands: TavernCommand[];
    notes: string[];
} => {
    const source = (rawText || '').trim();
    if (!source) {
        return { shouldUpdate: false, reason: '', commands: [], notes: [] };
    }
    const thinkingSegment = 提取首尾思考区段(source);
    let textWithoutThinking = (thinkingSegment.matched ? thinkingSegment.textWithoutThinking : source).trim();
    if (thinkingSegment.matched && !textWithoutThinking) {
        textWithoutThinking = source
            .replace(/<\s*\/\s*(thinking|think)\s*>/gi, '')
            .replace(/<\s*(thinking|think)\s*>/gi, '')
            .trim();
    }
    const noteBlock = 提取首个标签内容(textWithoutThinking, '说明');
    const commandBlock = 提取首个标签内容(textWithoutThinking, '命令');
    const notes = 解析动态世界块(noteBlock);
    const commands = 解析命令块(commandBlock || textWithoutThinking)
        .map((cmd) => ({
            action: cmd.action === 'add' ? 'set' : cmd.action,
            key: cmd.key,
            value: cmd.value
        }))
        .filter((cmd) => cmd.action === 'set' || cmd.action === 'push' || cmd.action === 'delete') as TavernCommand[];
    const reason = notes[0] || '';
    const noUpdate = notes.some((item) => /无需更新|无需修补|无须更新|无可更新/.test(item));
    return {
        shouldUpdate: !noUpdate && commands.length > 0,
        reason,
        commands,
        notes
    };
};


export const generateWorldEvolutionUpdate = async (
    worldContext: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    extraPrompt?: string,
    cotPseudoHistoryPrompt?: string,
    cotPrompt?: string,
    gptMode?: boolean,
    streamOptions?: WorldStreamOptions
): Promise<WorldEvolutionResult> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');

    const normalizedExtraPrompt = (extraPrompt || '').trim();
    const normalizedCotPseudoPrompt = (cotPseudoHistoryPrompt || '').trim();
    const normalizedCotPrompt = (cotPrompt || '').trim();
    const systemPrompt = 构建世界演变系统提示词();
    const userPrompt = [
        构建世界演变用户提示词(worldContext),
        normalizedExtraPrompt ? `【最终输出附加要求】\n${normalizedExtraPrompt}` : ''
    ].filter(Boolean).join('\n\n');
    const messagesRaw: 通用消息[] = [
        { role: 'system', content: systemPrompt }
    ];
    if (normalizedExtraPrompt) {
        messagesRaw.push({ role: 'system', content: `【额外要求提示词】\n${normalizedExtraPrompt}` });
    }
    if (gptMode) {
        messagesRaw.push({ role: 'user', content: userPrompt });
    } else {
        messagesRaw.push({ role: 'system', content: userPrompt });
    }
    if (normalizedCotPrompt) {
        messagesRaw.push({ role: 'system', content: normalizedCotPrompt });
        if (!gptMode) {
            // ponytail: two non-GPT task chains only need this fixed trigger; no helper for a literal.
            messagesRaw.push({ role: 'user', content: '开始任务' });
        }
    }
    if (normalizedCotPseudoPrompt) {
        messagesRaw.push({ role: 'assistant', content: normalizedCotPseudoPrompt });
    }
    const messages = 规范化文本补全消息链(messagesRaw, { 保留System: true, 合并同角色: false });

    const rawText = await 请求模型文本(apiConfig, messages, {
        temperature: 0.4,
        signal,
        errorDetailLimit: Number.POSITIVE_INFINITY,
        streamOptions
    });
    const parsed = 解析世界演变响应(rawText);
    return {
        commands: parsed.commands,
        updates: parsed.updates,
        rawText
    };
};

export const generateVariableCalibrationUpdate = async (
    params: {
        stateJson: string;
        response: GameResponse;
        /**
         * Variable rules / formulas / structure prompt set for the variable-generation model.
         */
        calibrationRulesContext?: string;
        worldEvolutionEnabled?: boolean;
        worldEvolutionUpdated?: boolean;
        builtinPromptEntries?: 内置提示词条目结构[];
        survivalNeedsEnabled?: boolean;
        recentRounds?: Array<{
            回合: number;
            玩家输入: string;
            正文: string;
            本回合命令: string[];
            校准说明: string[];
            校准命令: string[];
        }>;
        isOpeningRound?: boolean;
        openingTaskContext?: {
            currentGameTime?: string;
            openingRoleSetupText?: string;
            openingConfigText?: string;
        };
    },
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    extraPrompt?: string,
    onStreamDelta?: (delta: string, accumulated: string) => void,
    gptMode?: boolean
): Promise<VariableCalibrationResult> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');

    const systemPrompt = 获取内置提示词槽位内容({
        entries: params.builtinPromptEntries,
        slotId: params.worldEvolutionUpdated === true
            ? 世界书本体槽位.变量模型系统_世界演变已更新
            : 世界书本体槽位.变量模型系统_常规,
        fallback: ''
    });
    const 默认系统补充提示词 = 构建变量模型系统提示词({
        worldEvolutionEnabled: params.worldEvolutionUpdated === true,
        worldEvolutionUpdated: params.worldEvolutionUpdated === true,
        survivalNeedsEnabled: params.survivalNeedsEnabled !== false
    }).trim();
    const 去重后的系统补充提示词 = (() => {
        const source = (systemPrompt || '').trim();
        if (!source) return '';
        if (source === 默认系统补充提示词) return '';
        if (source.startsWith(默认系统补充提示词)) {
            return source.slice(默认系统补充提示词.length).trim();
        }
        return source;
    })();
    const userPromptExtraRules = 获取内置提示词槽位内容({
        entries: params.builtinPromptEntries,
        slotId: params.worldEvolutionUpdated === true
            ? 世界书本体槽位.变量模型用户_世界演变已更新
            : 世界书本体槽位.变量模型用户_常规,
        fallback: 构建变量模型用户附加规则提示词()
    });
    const normalizedVariableExtraPrompt = (extraPrompt || '').trim();
    const taskPrompt = 构建变量模型任务提示词({
        stateJson: params.stateJson,
        response: params.response,
        extraPrompt: normalizedVariableExtraPrompt,
        isOpeningRound: params.isOpeningRound === true,
        openingTaskContext: params.openingTaskContext
    });
    const variableCotPrompt = 获取内置提示词槽位内容({
        entries: params.builtinPromptEntries,
        slotId: 世界书本体槽位.变量模型COT,
        fallback: 获取变量校准COT提示词({})
    });
    const rulesContext = (params.calibrationRulesContext || '').trim();
    const messages = 规范化文本补全消息链([
        { role: 'system', content: `【AI身份提示词】\n${构建变量模型身份提示词()}` },
        {
            role: 'system',
            content: `【职责】\n${构建变量模型职责提示词({
                survivalNeedsEnabled: params.survivalNeedsEnabled !== false
            })}`
        },
        ...(去重后的系统补充提示词
            ? [{ role: 'system' as const, content: `【系统补充】\n${去重后的系统补充提示词}` }]
            : []),
        ...(rulesContext
            ? [{ role: 'system' as const, content: `【变量相关提示词】\n${rulesContext}` }]
            : []),
        ...(userPromptExtraRules
            ? [{ role: 'system' as const, content: `【附加变量规则】\n${userPromptExtraRules}` }]
            : []),
        { role: 'system', content: `【变量生成COT】\n${variableCotPrompt}` },
        { role: 'system', content: 构建变量模型输出格式提示词() },
        { role: gptMode ? 'user' : 'assistant', content: taskPrompt },
        ...(!gptMode ? [{ role: 'user' as const, content: '开始任务' }] : []),
        { role: 'assistant', content: 构建变量模型COT伪装提示词() || 默认COT伪装历史消息提示词.trim() }
    ], { 保留System: true, 合并同角色: false });

    const rawText = await 请求模型文本(apiConfig, messages, {
        temperature: 0.2,
        signal,
        errorDetailLimit: Number.POSITIVE_INFINITY,
        streamOptions: onStreamDelta
            ? {
                stream: true,
                onDelta: onStreamDelta
            }
            : undefined
    });
    const parsed = 解析变量校准响应(rawText);

    return {
        commands: parsed.commands,
        reports: parsed.reports,
        rawText
    };
};

const 构建规划分析消息链 = (
    params: {
        playerName: string;
        currentStoryJson: string;
        currentHeroinePlanJson: string;
        worldJson: string;
        socialJson: string;
        envJson: string;
        recentBodiesText: string;
        currentPlanText?: string;
        auditFocusText: string;
        genderRatioConstraintText?: string;
        heroineCandidateText?: string;
        heroineEnabled?: boolean;
        ntlEnabled?: boolean;
        extraPrompt?: string;
        gptMode?: boolean;
    },
    options?: { forceUserTrigger?: boolean }
): 通用消息[] => {
    const aiRolePrompt = 构建AI角色声明提示词(params.playerName);
    const cotPseudoPrompt = 替换COT伪装身份占位(默认COT伪装历史消息提示词.trim(), aiRolePrompt);
    const normalizedExtraPrompt = typeof params.extraPrompt === 'string' ? params.extraPrompt.trim() : '';
    const taskPrompt = [
        `【本次任务】\n${构建统一规划分析用户提示词({
            currentStoryJson: params.currentStoryJson,
            currentHeroinePlanJson: params.currentHeroinePlanJson,
            worldJson: params.worldJson,
            socialJson: params.socialJson,
            envJson: params.envJson,
            recentBodiesText: params.recentBodiesText,
            currentPlanText: params.currentPlanText,
            auditFocusText: params.auditFocusText,
            genderRatioConstraintText: params.genderRatioConstraintText,
            heroineCandidateText: params.heroineCandidateText,
            heroineEnabled: params.heroineEnabled === true
        })}`,
        normalizedExtraPrompt ? `【最终输出附加要求】\n${normalizedExtraPrompt}` : ''
    ].filter(Boolean).join('\n\n');
    const useUserTrigger = params.gptMode === true || options?.forceUserTrigger === true;

    return 规范化文本补全消息链([
        { role: 'system', content: `【AI角色】\n${aiRolePrompt}` },
        {
            role: 'system',
            content: `【系统提示词】\n${构建统一规划分析系统提示词({
                heroineEnabled: params.heroineEnabled === true,
                ntl: params.ntlEnabled === true
            })}`
        },
        { role: 'system', content: `【结构参考与更新规则】\n${构建统一规划分析专用上下文()}` },
        ...(normalizedExtraPrompt ? [{ role: 'system' as const, content: `【附加世界书】\n${normalizedExtraPrompt}` }] : []),
        { role: 'system', content: `【统一COT】\n${统一规划分析COT提示词}` },
        ...(useUserTrigger ? [{ role: 'system' as const, content: '请在内部完成规划分析思考，最终只输出 <thinking>、<说明>、<命令> 三段；不要输出额外解释。' }] : []),
        { role: useUserTrigger ? 'user' as const : 'assistant' as const, content: taskPrompt },
        ...(!useUserTrigger ? [{ role: 'user' as const, content: '开始任务' }] : []),
        ...(!useUserTrigger ? [{ role: 'assistant' as const, content: cotPseudoPrompt }] : [])
    ], { 保留System: true, 合并同角色: false });
};

export const generatePlanningAnalysis = async (
    params: {
        playerName: string;
        currentStoryJson: string;
        currentHeroinePlanJson: string;
        worldJson: string;
        socialJson: string;
        envJson: string;
        recentBodiesText: string;
        currentPlanText?: string;
        auditFocusText: string;
        genderRatioConstraintText?: string;
        heroineCandidateText?: string;
        heroineEnabled?: boolean;
        ntlEnabled?: boolean;
        extraPrompt?: string;
        gptMode?: boolean;
    },
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    streamOptions?: WorldStreamOptions
): Promise<PlanningAnalysisResult> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');
    const request = (forceUserTrigger = false) => 请求模型文本(apiConfig, 构建规划分析消息链(params, { forceUserTrigger }), {
        temperature: 0.3,
        signal,
        errorDetailLimit: Number.POSITIVE_INFINITY,
        streamOptions
    });
    let rawText = '';
    try {
        rawText = await request(false);
    } catch (error: any) {
        const message = String(error?.message || error || '');
        const shouldRetryWithUserTrigger = params.gptMode !== true && /(messages?|role|assistant|last message|final message|pre[- ]?fill|tool|400|invalid_request)/i.test(message);
        if (!shouldRetryWithUserTrigger || signal?.aborted) throw error;
        rawText = await request(true);
    }
    return { ...解析规划补丁结果(rawText, '统一规划分析'), rawText };
};


const 解析故事响应 = (
    rawText: string,
    requestOptions?: StoryRequestOptions
): StoryResponseResult => ({
    response: parseStoryRawText(rawText, {
        validateTagCompleteness: requestOptions?.validateTagCompleteness,
        enableTagRepair: requestOptions?.enableTagRepair,
        requireActionOptionsTag: requestOptions?.requireActionOptionsTag,
        requireDynamicWorldTag: requestOptions?.requireDynamicWorldTag,
        validateDialogueFormat: requestOptions?.validateDialogueFormat
    }),
    rawText
});

const 是否正文对白格式错误 = (error: any): boolean => {
    const text = `${error?.parseDetail || ''}\n${error?.message || ''}`;
    return /疑似角色|对白.*(?:标签|格式)|冒号格式|旁白.*说|无标签|引号.*跨行|引号内.*换行|孤立标点|标点单独成行|高频套话|指节|指关节|手指.*泛白|拳头.*发白|异常英文片段|英文夹杂|改回自然中文/.test(text);
};

const 构建正文协议修复消息 = (rawText: string, reason: string): 通用消息[] => 规范化文本补全消息链([
    {
        role: 'system',
        content: [
            '你是《墨色江湖》的响应协议修复器。',
            '任务不是重新创作剧情，而是在不改变事实、不新增事件、不改写变量命令含义的前提下，修复上一版模型输出的格式。',
            '必须保留原文中已经成立的剧情、短期记忆、命令、行动选项、动态世界等信息；只允许调整正文分段、对白标签和必要的协议标签闭合。',
            '输出必须是完整可解析的协议文本，不要解释。'
        ].join('\n')
    },
    {
        role: 'user',
        content: [
            '【修复原因】',
            reason || '正文对白格式不合规。',
            '',
            '【硬性修复要求】',
            '1. <正文> 内所有角色说出口的台词必须单独成行，并以【角色名】开头。',
            '2. 没有【角色名】的行只能是旁白、动作、环境或判定。',
            '3. 如果原文出现“某人动作后一整行明显是他说的话”，把那一行改为【某人】开头，不要凭空改名。',
            '4. 保留 <短期记忆>、<命令>、<行动选项>、<动态世界> 等块的原意；缺失必要块时按原文可见信息补齐最小可用内容。',
            '5. 不要新增剧情，不要重写成另一版故事。',
            '',
            '【待修复原始输出】',
            rawText || ''
        ].join('\n')
    }
], { 保留System: true, 合并同角色: false });

const 构建正文对白格式修复消息 = (bodyText: string, reason: string): 通用消息[] => 规范化文本补全消息链([
    {
        role: 'system',
        content: [
            '你是《墨色江湖》的正文局部修复器。',
            '任务不是重新创作剧情，而是在不改变事实、不新增事件、不改写判定结果的前提下，只修复正文里的对白标签、行文格式和指定低质量句子。',
            '你只处理用户给出的 <正文> 内容，不要输出命令、记忆、行动选项、解释或代码块。'
        ].join('\n')
    },
    {
        role: 'user',
        content: [
            '【修复原因】',
            reason || '正文对白格式不合规。',
            '',
            '【硬性规则】',
            '1. 所有角色说出口的台词必须单独成行，并以【角色名】开头。',
            '2. 【角色名】行只能放该角色说出口的台词，不要放动作、心理、旁白说明或括号补描写。',
            '3. 旁白、动作、环境、心理、第三人称叙述必须使用【旁白】开头，或保持为无角色标签的旁白行。',
            '4. 遇到“角色名：台词”“角色说道：‘台词’”“动作行后紧跟明显口语台词”等格式，要改成【角色名】台词。',
            '5. 不能凭空改名；说话人不确定时保留为【旁白】，不要强行猜。',
            '6. 保留原正文事实、顺序、判定结果、地点、物品、人物关系和台词含义。',
            '7. 正文一句话一行；每一行必须是完整的【旁白】、【角色名】或【判定】正文单位。',
            '8. 引号内文字绝对不能换行；如果原文把“……”、「……」、『……』或“‘……’”拆成多行，必须合并回同一行。',
            '9. 如果出现单独一行只有“。”、“！”、“？”、“，”、“；”、省略号等标点，必须局部重写相邻句子，让标点回到自然完整的正文句中；不要只删除标点。',
            '10. 【严禁高频套话】正文绝对禁止出现“指节泛白”“指关节泛白”“指尖泛白”“拳头攥到发白”等描写。若原文包含，必须整句重写，用具体的压力、动作或环境细节替代（如“握紧拳头，骨节咯咯作响”“指甲深深掐进掌心”）。不得保留任何“泛白/发白/苍白”与“指节/指关节/指尖/拳头”的组合。',
            '11. 如果正文里混入无关英文词、拼写残片或中英夹杂短词，例如“千 young 百孔”，必须把整句改回自然中文，不能原样保留。',
            '12. 只输出一个 <正文>...</正文> 块，不要输出其他内容。',
            '',
            '【待修复正文】',
            '<正文>',
            bodyText || '',
            '</正文>'
        ].join('\n')
    }
], { 保留System: true, 合并同角色: false });

const 替换首个正文块 = (rawText: string, bodyText: string): string => {
    const source = rawText || '';
    const body = (bodyText || '').trim();
    const replacement = `<正文>\n${body}\n</正文>`;
    if (/<\s*正文\s*>[\s\S]*?<\s*\/\s*正文\s*>/i.test(source)) {
        return source.replace(/<\s*正文\s*>[\s\S]*?<\s*\/\s*正文\s*>/i, replacement);
    }
    return `${replacement}\n${source}`.trim();
};

const 修复故事响应正文对白格式 = async (
    rawText: string,
    reason: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    requestOptions?: StoryRequestOptions
): Promise<StoryResponseResult> => {
    const sourceBody = 提取首个标签内容(rawText, '正文', { 兼容错误闭合: true }) || rawText;
    const repairedText = await 请求模型文本(apiConfig, 构建正文对白格式修复消息(sourceBody, reason), {
        temperature: 0.2,
        signal,
        errorDetailLimit: requestOptions?.errorDetailLimit,
        includeReasoning: requestOptions?.includeReasoning,
        disableThinking: requestOptions?.disableThinking,
        stripReasoning: requestOptions?.stripReasoning,
        prefixMode: requestOptions?.prefixMode
    });
    const repairedBody = 清理润色正文输出(repairedText);
    if (!repairedBody.trim()) {
        throw new Error('正文对白格式局部修复未返回有效正文');
    }
    const repairedRawText = 替换首个正文块(rawText, repairedBody);
    return 解析故事响应(repairedRawText, requestOptions);
};

const 修复故事响应协议 = async (
    rawText: string,
    reason: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    requestOptions?: StoryRequestOptions
): Promise<StoryResponseResult> => {
    const repairedText = await 请求模型文本(apiConfig, 构建正文协议修复消息(rawText, reason), {
        temperature: 0.2,
        signal,
        errorDetailLimit: requestOptions?.errorDetailLimit,
        includeReasoning: requestOptions?.includeReasoning,
        disableThinking: requestOptions?.disableThinking,
        stripReasoning: requestOptions?.stripReasoning,
        prefixMode: requestOptions?.prefixMode
    });
    return 解析故事响应(repairedText, requestOptions);
};

// ponytail: both story request paths share the same parse/repair fallback; one branch is enough.
const 解析或修复故事响应 = async (
    rawText: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    requestOptions?: StoryRequestOptions
): Promise<StoryResponseResult> => {
    try {
        return 解析故事响应(rawText, requestOptions);
    } catch (error: any) {
        if (requestOptions?.validateDialogueFormat !== true || error?.name !== 'StoryResponseParseError') {
            throw error;
        }

        const reason = error?.parseDetail || error?.message || '正文对白格式不合规';
        if (!是否正文对白格式错误(error)) {
            return 修复故事响应协议(rawText, reason, apiConfig, signal, requestOptions);
        }

        try {
            return await 修复故事响应正文对白格式(rawText, reason, apiConfig, signal, requestOptions);
        } catch {
            return 修复故事响应协议(rawText, reason, apiConfig, signal, requestOptions);
        }
    }
};

export const generateStoryResponse = async (
    systemPrompt: string,
    userContext: string,
    playerInput: string,
    apiConfig: 当前可用接口结构,
    signal?: AbortSignal,
    streamOptions?: StoryStreamOptions,
    extraPrompt?: string,
    requestOptions?: StoryRequestOptions
): Promise<StoryResponseResult> => {
    if (!apiConfig.apiKey) throw new Error('Missing API Key');

    const orderedMessagesRaw = Array.isArray(requestOptions?.orderedMessages)
        ? requestOptions.orderedMessages
            .map((item) => {
                const isPrefix = item?.prefix === true;
                return {
                    role: item?.role,
                    content: typeof item?.content === 'string'
                        ? (isPrefix ? item.content : item.content.trim())
                        : '',
                    ...(isPrefix ? { prefix: true } : {})
                };
            })
            .filter((item): item is 通用消息 =>
                (item.role === 'system' || item.role === 'user' || item.role === 'assistant') && item.content.length > 0
            )
        : [];
    const orderedMessages = 规范化文本补全消息链(orderedMessagesRaw, {
        保留System: true,
        合并同角色: false
    });

    if (orderedMessages.length > 0) {
        const lengthRequirementPrompt = typeof requestOptions?.lengthRequirementPrompt === 'string'
            ? requestOptions.lengthRequirementPrompt.trim()
            : '';
        const runtimeTurnDirectivePrompt = typeof requestOptions?.runtimeTurnDirectivePrompt === 'string'
            ? requestOptions.runtimeTurnDirectivePrompt.trim()
            : '';
        const messagesWithRuntimeRequirements = (() => {
            const runtimeMessages: 通用消息[] = [];
            if (lengthRequirementPrompt && !orderedMessages.some((message) => message.content.includes(lengthRequirementPrompt))) {
                runtimeMessages.push({
                    role: 'user' as const,
                    content: lengthRequirementPrompt
                });
            }
            if (runtimeTurnDirectivePrompt && !orderedMessages.some((message) => message.content.includes(runtimeTurnDirectivePrompt))) {
                runtimeMessages.push({
                    role: 'user' as const,
                    content: runtimeTurnDirectivePrompt
                });
            }
            if (runtimeMessages.length <= 0) return orderedMessages;
            const tail = orderedMessages[orderedMessages.length - 1];
            if (tail?.role === 'assistant' && tail.prefix === true) {
                return [
                    ...orderedMessages.slice(0, -1),
                    ...runtimeMessages,
                    tail
                ];
            }
            return [
                ...orderedMessages,
                ...runtimeMessages
            ];
        })();
        const requestDiagnostics = 构建故事请求消息诊断({
            apiConfig,
            beforeRuntimeRequirements: orderedMessages,
            afterRuntimeRequirements: messagesWithRuntimeRequirements
        });

        const rawText = await 请求模型文本(apiConfig, messagesWithRuntimeRequirements, {
            temperature: 0.7,
            signal,
            streamOptions,
            errorDetailLimit: requestOptions?.errorDetailLimit,
            includeReasoning: requestOptions?.includeReasoning,
            disableThinking: requestOptions?.disableThinking,
            stripReasoning: requestOptions?.stripReasoning,
            prefixMode: requestOptions?.prefixMode
        });
        return {
            ...(await 解析或修复故事响应(rawText, apiConfig, signal, requestOptions)),
            diagnostics: requestDiagnostics
        };
    }

    const normalizedSystemPrompt = typeof systemPrompt === 'string' ? systemPrompt.trim() : '';
    const normalizedContext = typeof userContext === 'string' ? userContext.trim() : '';
    const normalizedExtraPrompt = typeof extraPrompt === 'string' ? extraPrompt.trim() : '';
    const enableCotInjection = requestOptions?.enableCotInjection !== false;
    const leadingSystemPrompt = typeof requestOptions?.leadingSystemPrompt === 'string'
        ? requestOptions.leadingSystemPrompt.trim()
        : '';
    const cotPseudoHistoryPromptRaw = typeof requestOptions?.cotPseudoHistoryPrompt === 'string'
        ? requestOptions.cotPseudoHistoryPrompt.trim()
        : 默认COT伪装历史消息提示词.trim();
    const cotPseudoHistoryPrompt = 替换COT伪装身份占位(cotPseudoHistoryPromptRaw, leadingSystemPrompt);
    const styleAssistantPrompt = typeof requestOptions?.styleAssistantPrompt === 'string'
        ? requestOptions.styleAssistantPrompt.trim()
        : '';
    const outputProtocolPrompt = typeof requestOptions?.outputProtocolPrompt === 'string'
        ? requestOptions.outputProtocolPrompt.trim()
        : '';
    const lengthRequirementPrompt = typeof requestOptions?.lengthRequirementPrompt === 'string'
        ? requestOptions.lengthRequirementPrompt.trim()
        : '';
    const disclaimerRequirementPrompt = typeof requestOptions?.disclaimerRequirementPrompt === 'string'
        ? requestOptions.disclaimerRequirementPrompt.trim()
        : '';

    const apiMessages: 通用消息[] = [];
    if (normalizedSystemPrompt) {
        apiMessages.push({ role: 'system', content: normalizedSystemPrompt });
    }
    if (normalizedContext) {
        apiMessages.push({ role: 'system', content: normalizedContext });
    }
    if (leadingSystemPrompt) {
        apiMessages.push({ role: 'system', content: leadingSystemPrompt });
    }
    if (lengthRequirementPrompt) {
        apiMessages.push({ role: 'system', content: lengthRequirementPrompt });
    }
    if (styleAssistantPrompt) {
        apiMessages.push({ role: 'system', content: styleAssistantPrompt });
    }
    if (outputProtocolPrompt) {
        apiMessages.push({ role: 'system', content: outputProtocolPrompt });
    }
    if (disclaimerRequirementPrompt) {
        apiMessages.push({ role: 'user', content: disclaimerRequirementPrompt });
    }
    if (normalizedExtraPrompt) {
        apiMessages.push({ role: 'user', content: normalizedExtraPrompt });
    }

    const normalizedPlayerInput = typeof playerInput === 'string' && playerInput.trim().length > 0
        ? playerInput
        : '开始任务。';
    if (enableCotInjection && cotPseudoHistoryPrompt) {
        apiMessages.push({ role: 'user', content: '开始任务。' });
        apiMessages.push({ role: 'assistant', content: cotPseudoHistoryPrompt });
    }
    apiMessages.push({
        role: 'user',
        content: normalizedPlayerInput
    });

    const normalizedApiMessages = 规范化文本补全消息链(apiMessages, {
        保留System: true,
        合并同角色: false
    });

    const rawText = await 请求模型文本(apiConfig, normalizedApiMessages, {
        temperature: 0.7,
        signal,
        streamOptions,
        errorDetailLimit: requestOptions?.errorDetailLimit,
        includeReasoning: requestOptions?.includeReasoning,
        disableThinking: requestOptions?.disableThinking,
        stripReasoning: requestOptions?.stripReasoning,
        prefixMode: requestOptions?.prefixMode
    });

    return 解析或修复故事响应(rawText, apiConfig, signal, requestOptions);
};

export const testConnection = async (
    apiConfig: 当前可用接口结构
): Promise<ConnectionTestResult> => {
    if (!apiConfig.apiKey) {
        return { ok: false, detail: '缺少 API Key' };
    }
    if (!apiConfig.baseUrl) {
        return { ok: false, detail: '缺少 Base URL' };
    }
    if (!apiConfig.model) {
        return { ok: false, detail: '缺少模型名称' };
    }

    const messages = 规范化文本补全消息链([
        { role: 'user', content: '你是连接测试。请只回答 OK。' },
        { role: 'user', content: 'ping' }
    ], { 保留System: true, 合并同角色: true });

    const startedAt = Date.now();
    try {
        const text = await 请求模型文本(apiConfig, messages, {
            temperature: 0,
            errorDetailLimit: Number.POSITIVE_INFINITY
        });
        const elapsed = Date.now() - startedAt;
        const body = typeof text === 'string' ? text : '';
        const content = body.length > 0 ? body : '无响应内容';
        return { ok: true, detail: `耗时: ${elapsed}ms\n\n${content}` };
    } catch (error: any) {
        const raw = error?.detail ?? error?.message ?? error ?? '未知错误';
        const detail = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
        return {
            ok: false,
            detail: 翻译连接测试错误(detail, {
                baseUrl: apiConfig.baseUrl,
                backendLabel: '主接口'
            })
        };
    }
};
