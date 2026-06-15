import type { 接口设置结构 } from '../../types';
import { 获取文生图接口配置, type 当前可用接口结构 } from '../../utils/apiConfig';
import { generateImageByPrompt } from './image';
import { 规范化ComfyUI工作流JSON } from './comfyWorkflowTools';

export interface ComfyUI工作流校验结果 {
    ok: boolean;
    imageUrl: string;
    message: string;
    missingModel: boolean;
    rawMessage?: string;
}

const COMFY_WORKFLOW_VALIDATION_TIMEOUT_MS = 120_000;
const 读取错误消息 = (error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error || '未知错误');
    }
};

export const 判断ComfyUI工作流缺模型错误 = (error: unknown): boolean => {
    const message = 读取错误消息(error);
    return /model\s*(not\s*found|missing|not\s*in\s*list)|checkpoint|checkpoints?|lora|loras?|vae|clip|unet|safetensors|not\s+in\s+list|no\s+such\s+file|cannot\s+find|missing\s+model|CheckpointLoader|LoraLoader|UNETLoader|VAELoader|DualCLIPLoader|模型.*(不存在|缺失|未找到)|缺少.*模型|找不到.*模型/i.test(message);
};

export const 格式化ComfyUI工作流校验错误 = (error: unknown): string => {
    const raw = 读取错误消息(error).replace(/\s+/g, ' ').trim();
    const reason = raw.length > 900 ? `${raw.slice(0, 900)}...` : raw;
    if (判断ComfyUI工作流缺模型错误(raw)) {
        return `工作流校验失败：当前 ComfyUI 缺少这个工作流需要的模型、LoRA、VAE、CLIP 或 safetensors 文件。请先在本地生图服务器安装工作流所需模型后再上传。原始原因：${reason || '缺少模型'}`;
    }
    return `工作流校验失败：${reason || '没有返回可用图片'}`;
};

export const 构建ComfyUI工作流校验接口配置 = (
    settings: 接口设置结构 | null | undefined,
    workflowJson: string
): 当前可用接口结构 => {
    if (!settings) {
        throw new Error('请先在文生图设置里配置可用的 ComfyUI 后端，再上传工作流。');
    }
    const imageApi = 获取文生图接口配置(settings, { 忽略文生图总开关: true });
    if (!imageApi) {
        throw new Error('请先在文生图设置里配置可用的文生图接口，再上传 ComfyUI 工作流。');
    }
    if (imageApi.图片后端类型 !== 'comfyui') {
        throw new Error('上传 ComfyUI 工作流前，请先把文生图后端切换为 ComfyUI，并确认该后端能访问。');
    }
    if (!(imageApi.baseUrl || '').trim()) {
        throw new Error('ComfyUI 后端缺少 API 地址。请先选择在线后端或填写 ComfyUI 地址。');
    }
    return {
        ...imageApi,
        图片后端类型: 'comfyui',
        图片接口路径: imageApi.图片接口路径 || '/prompt',
        图片响应格式: 'url',
        ComfyUI工作流JSON: 规范化ComfyUI工作流JSON(JSON.parse(workflowJson))
    };
};

export const 校验ComfyUI工作流可生图 = async (params: {
    settings?: 接口设置结构 | null;
    apiConfig?: 当前可用接口结构 | null;
    workflowJson: string;
    signal?: AbortSignal;
    timeoutMs?: number;
}): Promise<ComfyUI工作流校验结果> => {
    const normalizedWorkflow = 规范化ComfyUI工作流JSON(JSON.parse(params.workflowJson));
    const imageApi = params.apiConfig
        ? {
            ...params.apiConfig,
            图片后端类型: 'comfyui' as const,
            图片接口路径: params.apiConfig.图片接口路径 || '/prompt',
            图片响应格式: 'url' as const,
            ComfyUI工作流JSON: normalizedWorkflow
        }
        : 构建ComfyUI工作流校验接口配置(params.settings, normalizedWorkflow);

    const controller = new AbortController();
    const timeoutMs = Math.max(30_000, params.timeoutMs || COMFY_WORKFLOW_VALIDATION_TIMEOUT_MS);
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    const abortFromParent = () => controller.abort();
    if (params.signal?.aborted) controller.abort();
    params.signal?.addEventListener('abort', abortFromParent, { once: true });

    try {
        const result = await generateImageByPrompt(
            'single plain ceramic cup on a neutral tabletop, realistic product photo, centered object, simple lighting',
            imageApi,
            controller.signal,
            {
                构图: '物品图标',
                尺寸: '512x512',
                附加负面提示词: 'text, watermark, logo, letters, numbers, people, hands, face, body, frame, collage',
                跳过基础负面提示词: true,
                PNG参数: {
                    步数: 8,
                    CFG强度: 1,
                    采样器: 'euler',
                    噪声计划: 'simple'
                }
            }
        );
        if (!result.图片URL) {
            throw new Error('ComfyUI 没有返回图片 URL。');
        }
        return {
            ok: true,
            imageUrl: result.图片URL,
            message: '工作流已通过真实生图校验。',
            missingModel: false,
            rawMessage: result.客户提示 || result.原始响应 || ''
        };
    } catch (error: unknown) {
        if (controller.signal.aborted && !params.signal?.aborted) {
            throw new Error(`工作流校验超过 ${Math.round(timeoutMs / 1000)} 秒仍未返回图片，请检查 ComfyUI 队列、模型加载或工作流节点。`);
        }
        throw new Error(格式化ComfyUI工作流校验错误(error));
    } finally {
        globalThis.clearTimeout(timeout);
        params.signal?.removeEventListener('abort', abortFromParent);
    }
};
