import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const readProjectFile = (relativePath: string) => {
    const absolutePath = resolve(projectRoot, relativePath);
    return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const projectFileExists = (relativePath: string) => existsSync(resolve(projectRoot, relativePath));

const productionRoots = [
    'App.tsx',
    'components',
    'hooks',
    'services',
    'utils',
    'prompts',
    'models',
    'data',
    'public',
    'scripts',
    'package.json',
    'vite.config.ts'
];

const scannedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.html', '.css']);

const listFiles = (relativePath: string): string[] => {
    const absolutePath = resolve(projectRoot, relativePath);
    if (!existsSync(absolutePath)) return [];
    const stats = statSync(absolutePath);
    if (!stats.isDirectory()) return [relativePath];
    return readdirSync(absolutePath).flatMap((entry) => {
        const child = join(relativePath, entry);
        const childStats = statSync(resolve(projectRoot, child));
        return childStats.isDirectory() ? listFiles(child) : [child];
    });
};

const extensionOf = (relativePath: string) => {
    const match = relativePath.match(/(\.[^.\\/]*)$/u);
    return match?.[1] || '';
};

const retiredNeedles = [
    'AuctionHouse',
    'auctionHouse',
    'defaultAuctionItemImages',
    'BattleModal',
    'models/battle',
    '玩家门派',
    '功法',
    '修炼体系',
    'core_realm',
    'stat_kungfu',
    'stat_cultivation',
    'stat_combat',
    'cultivationSystemEnabled',
    'isCultivationSystemEnabled',
    'retired_growth_core',
    'retired_ability_prompt',
    'retired_growth_stat',
    'retired_ability_stat',
    'builtin_slot_style_cultivation',
    'fandom',
    '同人剧情规划',
    'novelDecomposition',
    '小说分解',
    'nativeRuntime',
    'Capacitor',
    'MobileQuickMenu',
    '对象存储'
];

describe('homebrew dead feature registry', () => {
    it('removes Phase 1.5 retired feature packages and assets', () => {
        [
            'components/features/AuctionHouse',
            'components/features/Battle',
            'components/features/Kungfu',
            'components/features/Sect',
            'components/features/Skills',
            'models/battle.ts',
            'models/kungfu.ts',
            'models/sect.ts',
            'models/novelDecomposition.ts',
            'models/fandomPlanning',
            'prompts/core/realm.ts',
            'prompts/core/cotCombat.ts',
            'prompts/stats/kungfu.ts',
            'prompts/stats/cultivation.ts',
            'prompts/stats/combat.ts',
            'prompts/runtime/fandom.ts',
            'prompts/runtime/fandomPlanningAnalysis.ts',
            'prompts/runtime/fandomRealmGeneration.ts',
            'prompts/runtime/fandomWorldEvolution.ts',
            'prompts/runtime/novelDecomposition.ts',
            'prompts/runtime/novelDecompositionCot.ts',
            'prompts/runtime/storyStyles/cultivation.ts',
            'services/auctionHouse.ts',
            'data/defaultAuctionItemImages.ts',
            'public/assets/auction-items',
            'utils/nativeRuntime.ts',
            'utils/realmConfig.ts',
            'utils/realmDisplay.ts',
            'components/layout/MobileQuickMenu.tsx',
            'android',
            'capacitor.config.ts',
            'docs/homebrew-dead-feature-registry.md',
            '.tmp-release-assets',
            'tests/bugfix-map-theme.spec.mjs',
            'tests/dialogue-render-fallback.spec.mjs',
            'tests/e2e-autogen-off.spec.mjs',
            'tests/e2e-current.spec.mjs',
            'tests/e2e-npc-placeholder-identity.spec.mjs',
            'tests/save-single-export.spec.mjs'
        ].forEach((relativePath) => {
            expect(projectFileExists(relativePath), relativePath).toBe(false);
        });
    });

    it('keeps retired feature names out of production code', () => {
        const files = productionRoots
            .flatMap(listFiles)
            .filter((relativePath) => scannedExtensions.has(extensionOf(relativePath)));

        const hits: string[] = [];
        files.forEach((relativePath) => {
            const content = readProjectFile(relativePath);
            retiredNeedles.forEach((needle) => {
                if (content.includes(needle)) {
                    hits.push(`${relativePath}: ${needle}`);
                }
            });
        });

        expect(hits).toEqual([]);
    });

    it('keeps retired feature guardrails in current-state docs without deleted-history baggage', () => {
        const map = readProjectFile('docs/homebrew-function-map-and-simplification-decision-table.md');
        expect(projectFileExists('docs/homebrew-dead-feature-registry.md')).toBe(false);
        expect(map).toContain('## 已退役功能护栏');
        expect(map).toContain('No live retired-feature residue');
        expect(map).not.toContain('Generic organization legacy naming');
        expect(map).not.toContain('Retired growth prompt id placeholders');
        expect(map).not.toContain('同人/原著融合残留');
        expect(map).not.toContain('小说分解残留');
        expect(map).not.toContain('New Phase 2 Deep Deletion Queue');
        expect(map).not.toContain('backend_pending');
        expect(map).not.toContain('storage_pending');
    });
});
