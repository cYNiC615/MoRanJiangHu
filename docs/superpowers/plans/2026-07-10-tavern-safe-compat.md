# Tavern Preset Safe Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Izumi 0623 and a display-only SillyTavern compatibility subset without executing preset JavaScript or reintroducing community/mobile features.

**Architecture:** Preserve and classify preset extensions at import time, then run eligible regex and HTML processing through pure utilities after game-state application. A focused display post-processor returns cloned logs with native options or sanitized static HTML; the normal parsed response remains authoritative for commands, memories, and saves.

**Tech Stack:** TypeScript, React 19, Vitest, DOMPurify, IndexedDB-backed local settings.

## Global Constraints

- Keep Izumi 0503 and add Izumi 0623 as local bundled presets.
- Do not add community workshop, remote preset loading, mobile UI, release metadata, APK changes, sandboxed iframe, `postMessage`, input injection, or automatic send behavior.
- Never execute preset JavaScript.
- Static HTML must be structurally sanitized and stripped of network-capable URLs and CSS.
- Pure prompt wording additions do not require exact-string tests; routing, ownership, parsing, and security behavior still require failing tests first.
- Preserve non-tavern prompt behavior.

---

### Task 1: Preserve and classify preset extensions

**Files:**
- Modify: `models/system.ts`
- Modify: `utils/tavernPreset.ts`
- Create: `__tests__/tavernPresetCompat.test.ts`

**Interfaces:**
- Produces: `酒馆正则脚本安全类型 = 'safe-cleanup' | 'option-render' | 'html-beautify' | 'blocked'`
- Produces: `分类酒馆正则脚本(raw): 酒馆正则脚本分类条目 | null`
- Produces: `获取预设已分类正则脚本(preset): 酒馆正则脚本分类条目[]`

- [ ] **Step 1: Write failing normalization tests**

```ts
it('preserves regex extensions and blocks executable scripts', () => {
    const preset = 规范化酒馆预设({
        prompts: [{ identifier: 'main', role: 'system', content: 'main' }],
        prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }],
        extensions: {
            regex_scripts: [
                { id: 'clean', findRegex: '/foo/g', replaceString: 'bar', placement: [2] },
                { id: 'js', findRegex: '/foo/g', replaceString: '<script>fetch("https://x")</script>', placement: [2] }
            ]
        }
    });
    expect(preset?.extensions).toBeDefined();
    expect(preset?.兼容性?.安全清理脚本数).toBe(1);
    expect(preset?.兼容性?.阻止脚本数).toBe(1);
});
```

- [ ] **Step 2: Run the test and verify it fails because extensions are discarded**

Run: `npx vitest run __tests__/tavernPresetCompat.test.ts`

- [ ] **Step 3: Add types and minimal classification implementation**

Classification must block replacements containing script tags, browser DOM APIs, storage APIs, network APIs, external resource tags/attributes, or JavaScript URLs. Preserve a JSON-safe extension copy and build compatibility counts from normalized scripts.

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run __tests__/tavernPresetCompat.test.ts`

- [ ] **Step 5: Commit**

```powershell
git add models/system.ts utils/tavernPreset.ts __tests__/tavernPresetCompat.test.ts
git commit -m "feat: preserve safe tavern preset extensions"
```

---

### Task 2: Execute safe regex and extract native options

**Files:**
- Create: `utils/tavernRegexEngine.ts`
- Create: `utils/tavernOptionRenderer.ts`
- Create: `__tests__/tavernRegexEngine.test.ts`
- Create: `__tests__/tavernOptionRenderer.test.ts`

**Interfaces:**
- Produces: `执行酒馆安全正则(text, scripts, options): string`
- Produces: `提取酒馆选项(text, scripts): string[]`

- [ ] **Step 1: Write failing regex tests**

Cover literal and plain regex formats, capture groups, disabled scripts, placement `2`, invalid regex fallback, and proof that `blocked` or `option-render` entries are never executed by the text engine.

- [ ] **Step 2: Run regex tests and verify expected missing-module failures**

Run: `npx vitest run __tests__/tavernRegexEngine.test.ts`

- [ ] **Step 3: Implement the minimal ordered regex engine**

Compile regex safely, apply only `safe-cleanup` and `html-beautify`, catch per-script errors, and never evaluate replacement JavaScript.

- [ ] **Step 4: Run regex tests and verify green**

Run: `npx vitest run __tests__/tavernRegexEngine.test.ts`

- [ ] **Step 5: Write failing option extraction tests**

```ts
expect(提取酒馆选项('<options>\n>选项一：观察\n>选项二：前进\n</options>', [])).toEqual(['观察', '前进']);
```

Also cover `Option 1:` and deduplication.

- [ ] **Step 6: Implement option extraction and verify green**

Run: `npx vitest run __tests__/tavernOptionRenderer.test.ts`

- [ ] **Step 7: Commit**

```powershell
git add utils/tavernRegexEngine.ts utils/tavernOptionRenderer.ts __tests__/tavernRegexEngine.test.ts __tests__/tavernOptionRenderer.test.ts
git commit -m "feat: add safe tavern regex and option processing"
```

---

### Task 3: Sanitize and render static HTML

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `types.ts`
- Create: `utils/tavernStaticHtml.ts`
- Modify: `components/features/Chat/MessageRenderers.tsx`
- Modify: `components/features/Chat/TurnItem.tsx`
- Create: `__tests__/tavernStaticHtml.test.ts`

**Interfaces:**
- Produces: `清洗酒馆静态HTML(html): string`
- Produces: `提取酒馆静态HTML(text): { text: string; htmlContent?: string }`
- Extends `GameLog` with `htmlContent?: string` and `htmlRenderMode?: 'purify'`.

- [ ] **Step 1: Install DOMPurify**

Run: `npm install dompurify`

- [ ] **Step 2: Write failing sanitizer tests**

Verify ordinary `div`, `span`, `details`, and local inline styles survive. Verify script, iframe, form, event handlers, URL attributes, media/resource tags, `url()`, `image-set()`, `@import`, `expression()`, `behavior`, and `-moz-binding` are removed.

- [ ] **Step 3: Run sanitizer tests and verify red**

Run: `npx vitest run __tests__/tavernStaticHtml.test.ts`

- [ ] **Step 4: Implement structural and CSS sanitization**

Use DOMPurify with an explicit allowlist, then remove forbidden URL attributes and reject unsafe CSS declarations. If no meaningful HTML remains, return an empty HTML result and preserve plain text.

- [ ] **Step 5: Add the static renderer**

Export `TavernStaticHtmlRenderer` from `MessageRenderers.tsx`; it renders only pre-sanitized `htmlContent`. Update `TurnItem` to prefer this renderer when `htmlRenderMode === 'purify'`, with the existing narrator/character renderer as fallback.

- [ ] **Step 6: Run sanitizer tests and TypeScript**

Run: `npx vitest run __tests__/tavernStaticHtml.test.ts`

Run: `npx tsc --noEmit --pretty false`

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json types.ts utils/tavernStaticHtml.ts components/features/Chat/MessageRenderers.tsx components/features/Chat/TurnItem.tsx __tests__/tavernStaticHtml.test.ts
git commit -m "feat: render sanitized tavern html"
```

---

### Task 4: Apply compatibility to display responses only

**Files:**
- Create: `hooks/useGame/tavernDisplayPostProcessor.ts`
- Modify: `hooks/useGame/sendWorkflow.ts`
- Create: `__tests__/tavernDisplayPostProcessor.test.ts`

**Interfaces:**
- Produces: `处理酒馆展示响应(response, preset): GameResponse`

- [ ] **Step 1: Write failing post-processor tests**

Tests must prove the function returns a clone, does not mutate commands or source logs, keeps existing `action_options`, fills an empty option list, attaches sanitized static HTML, and ignores blocked scripts.

- [ ] **Step 2: Run tests and verify red**

Run: `npx vitest run __tests__/tavernDisplayPostProcessor.test.ts`

- [ ] **Step 3: Implement the pure display post-processor**

Process each display log with the safe regex engine, split and sanitize static HTML, and extract native options only when the response has no options.

- [ ] **Step 4: Integrate after final state application**

Call the post-processor only while constructing `finalDisplayResponse`, after `finalParsedResponse` has been used by `processResponseCommands`. Do not modify `responseForExecution`.

- [ ] **Step 5: Run focused workflow tests**

Run: `npx vitest run __tests__/tavernDisplayPostProcessor.test.ts __tests__/runtimeVariableWorkflow.test.ts __tests__/responseCommandProcessor.test.ts`

- [ ] **Step 6: Commit**

```powershell
git add hooks/useGame/tavernDisplayPostProcessor.ts hooks/useGame/sendWorkflow.ts __tests__/tavernDisplayPostProcessor.test.ts
git commit -m "feat: apply tavern rendering after state processing"
```

---

### Task 5: Give tavern presets prompt ownership

**Files:**
- Modify: `hooks/useGame/mainStoryRequest.ts`
- Modify: `services/ai/storyResponseParser.ts`
- Modify: `__tests__/storyLengthValidation.test.ts`
- Modify: `__tests__/storyResponseParser.test.ts`

**Interfaces:**
- Preserves existing `构建主剧情请求参数` and parser signatures.

- [ ] **Step 1: Write failing behavior tests**

Verify tavern mode excludes native style, native format, native length, disclaimer, topic, and director prompt blocks while retaining explicit traditional-language/provider/user-extra preferences. Verify `>选项一：文本` normalizes to `文本`.

- [ ] **Step 2: Run tests and verify red**

Run: `npx vitest run __tests__/storyLengthValidation.test.ts __tests__/storyResponseParser.test.ts`

- [ ] **Step 3: Narrow tavern message extras and option parsing**

Do not add exact-string tests for new prompt prose. Change only routing/ownership and parser normalization behavior.

- [ ] **Step 4: Run tests and verify green**

Run: `npx vitest run __tests__/storyLengthValidation.test.ts __tests__/storyResponseParser.test.ts`

- [ ] **Step 5: Commit**

```powershell
git add hooks/useGame/mainStoryRequest.ts services/ai/storyResponseParser.ts __tests__/storyLengthValidation.test.ts __tests__/storyResponseParser.test.ts
git commit -m "fix: let tavern presets own prompt protocol"
```

---

### Task 6: Bundle Izumi 0623 locally

**Files:**
- Create: `public/tavern-presets/izumi-0623.json`
- Modify: `data/bundledTavernPresets.ts`
- Modify: `__tests__/tavernPresetCompat.test.ts`

**Interfaces:**
- Adds `builtin_izumi_0623` without changing `builtin_izumi_0503`.

- [ ] **Step 1: Add a failing registry test**

Verify both IDs and paths exist and the 0623 JSON normalizes with prompts, prompt order, and preserved extensions.

- [ ] **Step 2: Run test and verify red**

Run: `npx vitest run __tests__/tavernPresetCompat.test.ts`

- [ ] **Step 3: Copy the reviewed upstream JSON mechanically and add the local registry entry**

Copy only `upstream/main:public/tavern-presets/izumi-0623.json`; do not copy upstream's empty bundled list or workshop integration.

- [ ] **Step 4: Run test and verify green**

Run: `npx vitest run __tests__/tavernPresetCompat.test.ts`

- [ ] **Step 5: Commit**

```powershell
git add public/tavern-presets/izumi-0623.json data/bundledTavernPresets.ts __tests__/tavernPresetCompat.test.ts
git commit -m "feat: bundle izumi 0623 tavern preset"
```

---

### Task 7: Record intake and verify the complete slice

**Files:**
- Modify: `docs/homebrew-upstream-intake-decisions.md`

- [ ] **Step 1: Record the current-state decision**

Document the absorbed safe subset and explicitly list excluded JS iframe, community workshop, mobile, APK, and release metadata. Keep the document as current state rather than a detailed changelog.

- [ ] **Step 2: Run focused tests**

Run: `npx vitest run __tests__/tavernPresetCompat.test.ts __tests__/tavernRegexEngine.test.ts __tests__/tavernOptionRenderer.test.ts __tests__/tavernStaticHtml.test.ts __tests__/tavernDisplayPostProcessor.test.ts __tests__/storyLengthValidation.test.ts __tests__/storyResponseParser.test.ts`

- [ ] **Step 3: Run full verification**

Run: `npx tsc --noEmit --pretty false`

Run: `npm run test:run -- --reporter=dot`

Run: `npm run build`

Run: `git diff --check`

- [ ] **Step 4: Commit the decision document**

```powershell
git add docs/homebrew-upstream-intake-decisions.md
git commit -m "docs: record safe tavern upstream intake"
```
