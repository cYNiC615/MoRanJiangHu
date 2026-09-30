# Tavern Preset Safe Compatibility Design

> Status: approved in conversation on 2026-07-10.

## Context

The homebrew fork keeps local SillyTavern-style preset support as part of the
AI harness, but it does not keep community workshop distribution or execute
arbitrary preset JavaScript. Upstream added the Izumi 0623 preset together with
several layers of regex, HTML, and JavaScript compatibility. This design takes
the useful local and display-only subset while preserving the fork's smaller
security boundary.

## Goals

- Add Izumi 0623 as a local bundled preset while retaining Izumi 0503.
- Let an enabled tavern preset control its own prompt style, format, length,
  and output protocol instead of mixing in native project defaults.
- Preserve preset `extensions.regex_scripts` metadata during import and save.
- Execute pure text cleanup regex scripts against display text only.
- Convert preset `<options>` output into the existing native
  `action_options` UI.
- Render static HTML produced by eligible beautification scripts after strict
  DOMPurify sanitization.
- Keep all state mutation, variable commands, memories, and saves based on the
  normal parsed response rather than beautified display output.

## Non-Goals

- No JavaScript execution from tavern presets.
- No sandboxed iframe, `postMessage` bridge, auto-send action, input injection,
  or access to the host React application.
- No community workshop discovery, publishing, download, or remote preset
  source.
- No mobile-specific UI.
- No attempt to implement every SillyTavern macro or extension API in this
  intake.
- No removal of Izumi 0503.

## Considered Approaches

### Full upstream sandbox

This would absorb the iframe renderer, JavaScript bridge, template engine,
interactive cards, and all five regex execution classes. It offers the highest
visual fidelity but adds more than three thousand lines of runtime and a new
browser-script security boundary. It is rejected for this intake.

### Preset JSON only

This would add Izumi 0623 to the dropdown without any compatibility layer. It
is small, but extension metadata would be discarded and users would see raw
option or HTML markup. It is rejected as incomplete.

### Safe compatibility subset

This is the selected approach. It preserves and classifies extensions, runs
only text cleanup and static HTML beautification, maps options to native UI,
and never executes preset JavaScript.

## Architecture

### Local preset ingestion

`public/tavern-presets/izumi-0623.json` is copied from the reviewed upstream
version. `data/bundledTavernPresets.ts` lists both 0503 and 0623 as local
entries. The upstream change that empties the bundled list in favor of the
community workshop is not taken.

`utils/tavernPreset.ts` retains a JSON-safe copy of `extensions` and records a
compatibility summary. Regex scripts are classified as:

- `safe-cleanup`: pure text replacement;
- `option-render`: option extraction only;
- `html-beautify`: replacement may produce static HTML but contains no script
  or browser API;
- `blocked`: JavaScript, DOM access, storage, network, external resources, or
  otherwise unsupported behavior.

Blocked scripts remain visible as metadata but are never executed.

### Prompt ownership

When tavern preset mode is enabled, the imported preset owns prompt style,
format, length, and protocol. Native style, native output format, native length
requirements, disclaimer protocol, topic defaults, and director prompt are not
silently appended. Explicit user choices that are external to the preset may
remain: traditional Chinese mode, provider compatibility instructions, and the
user's own extra prompt.

Normal non-tavern mode behavior is unchanged.

### Display-only regex processing

The regex engine receives AI display text plus the preserved extension list.
It applies scripts in preset order while respecting enabled state, placement,
markdown-only flags, and depth bounds. Only `safe-cleanup` and
`html-beautify` scripts are eligible.

Processing occurs after the parsed response has already been applied to game
state. The result may change `finalDisplayResponse.logs`, but it must not alter
the response used for state commands, memories, NPC retention, or save data.

Invalid regular expressions and failed replacements are ignored individually;
one bad preset script must not fail the turn.

### Native options

The option extractor first reads explicit `<options>` blocks and then supports
the preset's option regex metadata. It returns normalized plain strings. If the
normal parser already produced `action_options`, those options win. Extracted
options only fill an empty list.

No option HTML and no option JavaScript are executed. Clicking an option uses
the application's existing action-option behavior.

### Static HTML

Static HTML output is sanitized with DOMPurify before being stored on a display
log. The sanitizer allows ordinary layout and typography tags but forbids at
least:

- `script`, `iframe`, `object`, `embed`, `applet`, and `form`;
- URL-bearing media and resource tags such as `img`, `link`, `audio`, `video`,
  and `source`;
- inline event handlers such as `onclick`, `onerror`, and `onload`;
- URL-bearing attributes such as `href`, `src`, `srcset`, `action`, and
  `formaction`;
- CSS resource and legacy execution constructs including `url(...)`,
  `image-set(...)`, `@import`, `expression(...)`, `behavior`, and
  `-moz-binding`.

DOMPurify performs the structural sanitization. A second local CSS/attribute
filter enforces the no-network rule because DOMPurify alone does not guarantee
that inline CSS cannot reference an external resource.

The display log may carry `htmlContent` and `htmlRenderMode: 'purify'`.
`TurnItem` renders this content through a focused static HTML renderer. There
is no `'sandbox'` render mode in the local interface.

If sanitization produces an empty result, the original plain log text remains
visible.

## Error Handling

- A bundled preset that cannot be fetched or normalized reports the existing
  local load error and does not replace the active preset.
- A malformed regex is skipped without failing the generation turn.
- A blocked script is recorded in compatibility metadata and ignored.
- A sanitizer failure falls back to plain text.
- Existing parsed action options and ordinary logs remain authoritative.

## Testing

- Bundled preset tests verify that both Izumi versions exist and 0623
  normalizes with prompts, prompt order, and extension metadata.
- Preset normalization tests verify extension preservation and blocked-script
  classification.
- Regex tests prove pure cleanup and static HTML replacements run while script,
  DOM, storage, network, and external-resource replacements do not.
- Option tests cover `<options>` and `>option:` formats and prove existing
  `action_options` are not overwritten.
- Sanitizer tests prove allowed markup survives and executable content is
  removed.
- Prompt assembly tests prove tavern mode no longer receives native style,
  format, length, topic, or director protocol while non-tavern mode is
  unchanged.
- Focused Vitest, full Vitest, TypeScript, build, and `git diff --check` form
  the completion gate.

## Explicitly Excluded Upstream Files

- `components/features/Chat/SandboxedCard.tsx`
- `utils/tavernSandboxBridge.ts`
- JavaScript bridge additions in `App.tsx`
- community workshop preset selection and publishing changes
- mobile settings changes
- release metadata and APK changes
