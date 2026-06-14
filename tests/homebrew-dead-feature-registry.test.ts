import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (relativePath: string) => {
    const absolutePath = resolve(process.cwd(), relativePath);
    return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

describe('homebrew dead feature registry', () => {
    it('removes player-visible novel decomposition entrypoints', () => {
        const app = readProjectFile('App.tsx');
        expect(app).not.toContain('NovelDecompositionWorkbenchModal');
        expect(app).not.toContain('小说拆分后台调度服务');
        expect(app).not.toContain('openNovelDecompositionWorkbench');
        expect(app).not.toContain('onNovelDecomposition');
        expect(app).not.toContain('onOpenNovelDecomposition');
        expect(app).not.toContain('enableNovelDecomposition');

        expect(readProjectFile('components/layout/LandingPage.tsx')).not.toContain('onNovelDecomposition');
        expect(readProjectFile('components/features/Workshop/CreativeWorkshopModal.tsx')).not.toContain('onNovelDecomposition');
        expect(readProjectFile('components/features/Workshop/CreativeWorkshopModal.tsx')).not.toContain('小说分解模块');
        expect(readProjectFile('components/layout/RightPanel.tsx')).not.toContain('onOpenNovelDecomposition');
        expect(readProjectFile('components/layout/MobileQuickMenu.tsx')).not.toContain('novel_decomposition');
        expect(readProjectFile('components/features/Settings/SettingsModal.tsx')).not.toContain('novel_decomposition');
        expect(readProjectFile('components/features/Settings/mobile/MobileSettingsModal.tsx')).not.toContain('novel_decomposition');
    });

    it('records the remaining novel decomposition backend as pending removal', () => {
        const registry = readProjectFile('docs/homebrew-dead-feature-registry.md');
        expect(registry).toContain('novel_decomposition');
        expect(registry).toContain('backend_pending');
        expect(registry).toContain('services/novelDecompositionPipeline.ts');
        expect(registry).toContain('prompts/runtime/novelDecomposition.ts');
        expect(registry).toContain('functions/api/workshop/novel-decomposition.ts');
    });
});
