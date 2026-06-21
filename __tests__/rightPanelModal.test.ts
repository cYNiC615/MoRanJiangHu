import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('right panel feature modals', () => {
    it('App no longer wraps feature pages in the desktop right detail container', () => {
        const appSource = readFileSync(resolve(process.cwd(), 'App.tsx'), 'utf8');
        const cssSource = readFileSync(resolve(process.cwd(), 'styles/global.css'), 'utf8');

        expect(appSource).not.toContain('desktop-right-detail-modal');
        expect(appSource).not.toContain('activeDetailPanelId');
        expect(appSource).not.toContain('setViewportWidth');
        expect(appSource).not.toContain('viewportWidth');
        expect(cssSource).not.toContain('.desktop-right-detail-modal');
        expect(cssSource).not.toContain('.desktop-detail-resize-handle');
    });
});
