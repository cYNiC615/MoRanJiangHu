import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('NewGameWizard homebrew copy', () => {
    it('does not render market display blocks on the worldview selection screen', () => {
        const source = readFileSync('components/features/NewGame/NewGameWizard.tsx', 'utf8');

        expect(source).not.toContain('市场入口和预设物品');
        expect(source).not.toContain('<div className="text-gray-500">市场入口</div>');
        expect(source).not.toContain('<div className="text-gray-500">交易口径</div>');
        expect(source).not.toContain('<div className="text-gray-500">统一换算</div>');
        expect(source).not.toContain('市场入口：{当前题材配置.marketName}');
    });

    it('confirmation step starts at the top and remains scroll-safe for tall content', () => {
        const source = readFileSync('components/features/NewGame/NewGameWizard.tsx', 'utf8');
        const confirmationBlock = source.slice(
            source.indexOf('{/* STEP 6: CONFIRMATION */}'),
            source.indexOf('{/* Bottom Action Bar */}')
        );

        expect(confirmationBlock).toContain('min-h-full');
        expect(confirmationBlock).toContain('justify-start');
        expect(confirmationBlock).not.toContain('h-full flex flex-col items-center justify-center');
    });
});
