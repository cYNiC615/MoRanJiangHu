#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 默认ComfyUI工作流JSON, 默认NSFWComfyUI工作流JSON } from '../data/defaultComfyWorkflow.ts';
import { 结构化物品库 } from '../data/structuredItemLibrary.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'assets', 'item-presets');
const presetRegistryPath = path.join(rootDir, 'data', 'presetItemImages.ts');

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const COMFY_URL = getArg('comfy').replace(/\/+$/, '');
const ONLY = getArg('only');
const START = Math.max(0, Number(getArg('start', '0')) || 0);
const LIMIT = Math.max(0, Number(getArg('limit', '0')) || 0);
const WIDTH = Number(getArg('width', '768')) || 768;
const HEIGHT = Number(getArg('height', '768')) || 768;
const STEPS = Number(getArg('steps', '9')) || 9;
const CFG = Number(getArg('cfg', '1')) || 1;
const SAMPLER = getArg('sampler', 'res_multistep');
const SCHEDULER = getArg('scheduler', 'sgm_uniform');
const WORKFLOW = getArg('workflow', 'normal');
const DRY_RUN = hasFlag('dry-run');
const MISSING_ONLY = hasFlag('missing');
const SKIP_REGISTRY = hasFlag('no-registry');
const REUSE_EXISTING = hasFlag('reuse-existing');
const LOCAL_ONLY = hasFlag('local-only');

if (!COMFY_URL && !DRY_RUN) throw new Error('Missing --comfy');

const common = [
  'photorealistic product photo of a single physical wuxia inventory item',
  'centered on warm neutral parchment',
  'realistic material texture',
  'studio lighting',
  'soft shadow',
  'clean silhouette',
  'isolated object only',
  'no text',
  'no letters',
  'no printed words',
  'no inscriptions',
  'no labels on the object',
  'no logo',
  'no watermark',
  'no UI',
  'no card frame'
].join(', ');

const negative = [
  'text',
  'letters',
  'numbers',
  'chinese characters',
  'printed words',
  'inscription',
  'object label',
  'writing on pouch',
  'writing on scroll',
  'calligraphy',
  'caption',
  'label',
  'watermark',
  'logo',
  'signature',
  'ui',
  'card frame',
  'border',
  'badge',
  'collage',
  'person',
  'human',
  'legs',
  'vertical leg armor',
  'greaves',
  'shin guards',
  'feet inside shoes',
  'pants',
  'mannequin',
  'full armor suit',
  'hand',
  'feet',
  'face',
  'modern plastic',
  'blurry',
  'low quality',
  'jpeg artifacts'
].join(', ');

const manualNegative = [
  'blank page',
  'empty scroll',
  'empty book',
  'plain paper only',
  'modern printed book',
  'readable text',
  'legible letters',
  'legible Chinese characters',
  'object label',
  'caption',
  'watermark',
  'logo',
  'signature',
  'ui',
  'card frame',
  'border',
  'badge',
  'collage',
  'person',
  'human',
  'hand',
  'face',
  'modern plastic',
  'blurry',
  'low quality',
  'jpeg artifacts'
].join(', ');

const qualityMap = {
  '传说': 'legendary',
  '绝世': 'mythic',
  '极品': 'top grade',
  '上品': 'superior',
  '良品': 'fine',
  '凡品': 'common'
};

const typeMap = {
  '武器': 'weapon',
  '防具': 'armor or garment',
  '消耗品': 'medicine consumable',
  '材料': 'crafting material',
  '秘籍': 'martial arts manual scroll',
  '饰品': 'accessory',
  '杂物': 'miscellaneous prop'
};

const itemSpecificPrompt = (item) => {
  if (/急救包/.test(item.名称)) {
    return [
      'must clearly be a real portable first aid kit bag or zippered medical pouch',
      'rectangular soft fabric or hard-shell case, visible zipper seam, handle or straps',
      'a small simple cross patch is allowed on the bag, but the object must not be just a cross symbol',
      'no loose medical supplies scattered around, no readable text'
    ].join(', ');
  }
  if (/电脑维修手册|急救手册|求生手册/.test(item.名称)) {
    return [
      'must clearly be a modern paperback field manual or technical handbook, not an ancient scroll or martial arts book',
      'closed or slightly open booklet with plain cover, tabs, worn paper, diagrams suggested by abstract unreadable marks',
      'modern practical survival or repair manual styling, no Chinese calligraphy, no ancient parchment scroll',
      'no readable words, no logo, no brand name'
    ].join(', ');
  }
  if (/防护服/.test(item.名称)) {
    return [
      'must clearly be a modern hazmat protective suit or disposable chemical protection coverall',
      'white or light gray nonwoven fabric, hood, front zipper, elastic cuffs and boot covers',
      'laid flat or hanging as an empty garment, no person, no mannequin, no armor, no medieval clothing'
    ].join(', ');
  }
  if (item.名称 === '蛇胆') {
    return [
      'must look like one real snake gallbladder organ, a small oval dark green translucent bile sac',
      'placed on a shallow white porcelain dish',
      'wet glossy membrane, organic medicinal ingredient',
      'no snake body, no snake head, no curled worm, no eel, no vial, no bottle, no necklace'
    ].join(', ');
  }
  if (item.物品 === '弩' || item.名称.endsWith('弩')) {
    return [
      'must look like a handheld crossbow, horizontal bow limbs, central stock, trigger mechanism, short bolt groove',
      'clear crossbow silhouette viewed from a three quarter top angle',
      'not a longbow, not a staff, not a gun, not a sword, not armor'
    ].join(', ');
  }
  if (item.类型 === '秘籍') {
    if (/手册/.test(item.名称)) {
      return [
        'must clearly look like a modern practical handbook or field manual, not a blank prop',
        'visible abstract unreadable diagrams and pseudo text blocks, modern paper booklet material',
        'not ancient, not a scroll, not Chinese calligraphy, no readable real words'
      ].join(', ');
    }
    return [
      'must clearly look like an ancient martial arts manual, not a blank prop',
      'visible dense black ink-like pseudo calligraphy strokes, visible abstract meridian diagrams or martial arts figure diagrams',
      'the marks must look like writing at a glance but must be unreadable decorative pseudo-text',
      'ancient Chinese book or scroll material, yellowed paper, cloth binding or silk scroll edges',
      'not blank, not empty pages, not a clean unused scroll, no readable real words'
    ].join(', ');
  }
  return '';
};

const buildNegative = (item) => item.类型 === '秘籍' ? manualNegative : negative;

const stableSeed = (name) => {
  let hash = 2166136261;
  for (const ch of name) {
    hash ^= ch.codePointAt(0) || 0;
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 900000000000000;
};

const isModernLikeItem = (item) => {
  const tags = Array.isArray(item.视觉标签) ? item.视觉标签.join(' ') : '';
  return /modern|urban|laptop|smartphone|USB|battery|radio|survival|apocalypse|tool|detector|medical|ration|camp|protective|electronic|hazmat|manual|card|key/i.test(tags)
    || /手机|电脑|U盘|电池|电台|检测|探测|维修|工具|急救|绷带|止血|抗生素|防护|口罩|护目镜|防毒|夹克|运动鞋|汽油|饼干|罐头|饮水|净水|滤芯|手册|证件|银行卡|现金|车钥匙|通行证|感染|样本|太阳能|弹药|撬棍|喷雾|警棍/.test(item.名称 || '');
};

const buildPrompt = (item) => {
  const modernLike = isModernLikeItem(item);
  return [
    common.replace('single physical wuxia inventory item', modernLike ? 'single physical modern inventory item' : 'single physical wuxia inventory item'),
    `single ${qualityMap[item.品质] || 'common'} ${typeMap[item.类型] || 'prop'}`,
    `form and materials: ${item.生图描述}`,
    itemSpecificPrompt(item),
    Array.isArray(item.视觉标签) && item.视觉标签.length > 0 ? `visual tags: ${item.视觉标签.join(', ')}` : '',
    modernLike
      ? 'inventory icon source image, realistic modern product photography, object fills most of the frame, readable silhouette, practical contemporary prop, plain background'
      : 'inventory icon source image, product photography, object fills most of the frame, readable silhouette, ancient Chinese wuxia prop, plain background',
    'absolutely no text, no letters, no numbers, no Chinese characters, no calligraphy, no captions, no labels, no watermarks, no logos, no writing on the object'
  ].filter(Boolean).join('\n');
};

const inject = (value, replacements) => {
  if (typeof value === 'string') {
    const exact = replacements[value];
    if (exact !== undefined) return exact;
    return Object.entries(replacements).reduce((text, [key, replacement]) => text.replaceAll(key, String(replacement)), value);
  }
  if (Array.isArray(value)) return value.map((item) => inject(item, replacements));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, inject(child, replacements)]));
  }
  return value;
};

const buildWorkflow = (item) => inject(JSON.parse(WORKFLOW === 'fallback' ? 默认NSFWComfyUI工作流JSON : 默认ComfyUI工作流JSON), {
  '__PROMPT__': buildPrompt(item),
  '__NEGATIVE_PROMPT__': buildNegative(item),
  '__WIDTH__': WIDTH,
  '__HEIGHT__': HEIGHT,
  '__SEED__': stableSeed(item.名称),
  '__STEPS__': STEPS,
  '__CFG__': CFG,
  '__SAMPLER__': SAMPLER,
  '__SCHEDULER__': SCHEDULER,
});

async function submitPrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: `mrjh-structured-${Math.random().toString(36).slice(2, 10)}` }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /prompt ${res.status}: ${text.slice(0, 1200)}`);
  const json = JSON.parse(text);
  if (!json.prompt_id) throw new Error(`Bad response: ${text.slice(0, 1200)}`);
  return json.prompt_id;
}

async function waitForHistory(promptId, timeoutMs = 300000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    if (res.ok) {
      const json = await res.json();
      const entry = json?.[promptId];
      if (entry?.status?.completed) return entry;
      if (entry?.status?.status_str === 'error') throw new Error(JSON.stringify(entry.status.messages).slice(0, 1600));
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Timed out waiting for ComfyUI result');
}

const extractOutputFile = (entry) => {
  for (const output of Object.values(entry?.outputs || {})) {
    if (Array.isArray(output?.images) && output.images[0]) return output.images[0];
  }
  return null;
};

async function downloadView(fileRef) {
  const qs = new URLSearchParams({
    filename: fileRef.filename,
    subfolder: fileRef.subfolder || '',
    type: fileRef.type || 'output',
  });
  const res = await fetch(`${COMFY_URL}/view?${qs.toString()}`);
  if (!res.ok) throw new Error(`GET /view ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function localPresetExists(item) {
  try {
    await fs.access(path.join(outDir, `${item.名称}.png`));
    return true;
  } catch {
    return false;
  }
}

const readLocalPreset = async (item) => fs.readFile(path.join(outDir, `${item.名称}.png`));

async function selectTargets() {
  let items = 结构化物品库.map((item) => ({ ...item, filename: `${item.名称}.png` }));
  if (ONLY) {
    const terms = ONLY.split(',').map((item) => item.trim()).filter(Boolean);
    items = items.filter((item) => terms.includes(item.名称) || terms.includes(item.filename));
  }
  if (MISSING_ONLY) {
    const filtered = [];
    for (const item of items) {
      if (!(await localPresetExists(item))) filtered.push(item);
    }
    items = filtered;
  }
  if (LOCAL_ONLY) {
    const filtered = [];
    for (const item of items) {
      if (await localPresetExists(item)) filtered.push(item);
    }
    items = filtered;
  }
  if (START) items = items.slice(START);
  if (LIMIT) items = items.slice(0, LIMIT);
  return items;
}

async function syncPresetRegistry(generatedItems) {
  if (SKIP_REGISTRY || generatedItems.length === 0) return;
  let source = await fs.readFile(presetRegistryPath, 'utf8');
  const existing = new Set([...source.matchAll(/名称:\s*'([^']+)'/g)].map((match) => match[1]));
  let updateCount = 0;
  for (const item of generatedItems) {
    if (!existing.has(item.名称)) continue;
    const escapedName = item.名称.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(\\{\\s*名称:\\s*'${escapedName}',\\s*类型:\\s*'[^']+',\\s*品质:\\s*'[^']+',\\s*图片URL:\\s*')[^']+('\\s*\\},)`);
    const next = source.replace(pattern, `$1${item.图片URL}$2`);
    if (next !== source) {
      source = next;
      updateCount += 1;
    }
  }
  const newLines = generatedItems
    .filter((item) => !existing.has(item.名称))
    .map((item) => `    { 名称: '${item.名称}', 类型: '${item.类型}', 品质: '${item.品质}', 图片URL: '${item.图片URL}' },`);
  if (newLines.length === 0) {
    if (updateCount > 0) {
      await fs.writeFile(presetRegistryPath, source, 'utf8');
      console.log(`  registry +0, updated=${updateCount}: data/presetItemImages.ts`);
    }
    return;
  }
  const marker = '    // ─── 杂物/通用 ─────────────────────────────────────────────────────';
  const block = [
    '    // ─── 结构化物品库自动生成 ─────────────────────────────────────────',
    ...newLines,
    ''
  ].join('\n');
  if (!source.includes(marker)) throw new Error('presetItemImages.ts marker not found');
  source = source.replace(marker, `${block}${marker}`);
  await fs.writeFile(presetRegistryPath, source, 'utf8');
  console.log(`  registry +${newLines.length}, updated=${updateCount}: data/presetItemImages.ts`);
}

await fs.mkdir(outDir, { recursive: true });
if (!DRY_RUN) {
  let statsText = await fetch(`${COMFY_URL}/system_stats`).then((r) => r.text()).catch(() => '');
  if (!statsText.trim().startsWith('{')) {
    statsText = await fetch(`${COMFY_URL}/api/system_stats`).then((r) => r.text());
  }
  const stats = JSON.parse(statsText.replace(/^\uFEFF/, ''));
  console.log(`ComfyUI ${stats.system?.comfyui_version || 'unknown'} ready`);
}

const targets = await selectTargets();
console.log(`targets=${targets.length} workflow=${WORKFLOW} size=${WIDTH}x${HEIGHT} steps=${STEPS} sampler=${SAMPLER}/${SCHEDULER}`);
const generated = [];

for (const item of targets) {
  const localPath = path.join(outDir, item.filename);
  console.log(`[${item.名称}] ${DRY_RUN ? 'dry-run' : 'generating'}...`);
  if (DRY_RUN) {
    console.log(buildPrompt(item).slice(0, 360));
    continue;
  }
  let buf = null;
  if (REUSE_EXISTING && await localPresetExists(item)) {
    buf = await readLocalPreset(item);
    console.log(`  reused ${localPath} ${(buf.length / 1024).toFixed(1)}KB`);
  } else {
    const promptId = await submitPrompt(buildWorkflow(item));
    console.log(`  prompt_id=${promptId}`);
    const history = await waitForHistory(promptId);
    const fileRef = extractOutputFile(history);
    if (!fileRef) throw new Error('No output image');
    buf = await downloadView(fileRef);
    await fs.writeFile(localPath, buf);
    console.log(`  saved ${localPath} ${(buf.length / 1024).toFixed(1)}KB`);
  }
  const imageUrl = `/assets/item-presets/${item.filename}`;
  const completed = { ...item, 图片URL: imageUrl };
  generated.push(completed);
  await syncPresetRegistry([completed]);
}

await syncPresetRegistry(generated);
