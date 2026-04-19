import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatNoAi } from '../src/formatter.js';
import { parseAndGroup } from '../src/parser.js';
import type { RawCommit } from '../src/git.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

function makeRaw(message: string): RawCommit {
    return { hash: 'abc123', message, body: '', author: 'Test', date: '2026-04-13' };
}

describe('formatNoAi', () => {
    it('formats grouped commits without AI', () => {
        const grouped = parseAndGroup([
            makeRaw('feat(auth): add OAuth2 login'),
            makeRaw('fix(api): handle null response'),
            makeRaw('chore: bump dependencies'),
        ]);

        const result = formatNoAi(grouped, '1.3.0');

        expect(result).toContain('## [1.3.0]');
        expect(result).toContain('### Added');
        expect(result).toContain('**auth:** add OAuth2 login');
        expect(result).toContain('### Fixed');
        expect(result).toContain('**api:** handle null response');
        expect(result).toContain('### Maintenance');
        expect(result).toContain('bump dependencies');
    });

    it('uses Unreleased when no version provided', () => {
        const grouped = parseAndGroup([makeRaw('feat: new thing')]);
        const result = formatNoAi(grouped);

        expect(result).toContain('## [Unreleased]');
    });

    it('omits empty sections', () => {
        const grouped = parseAndGroup([makeRaw('feat: only feature')]);
        const result = formatNoAi(grouped);

        expect(result).not.toContain('### Fixed');
        expect(result).not.toContain('### Maintenance');
    });

    it('handles multiple commits in same category', () => {
        const grouped = parseAndGroup([
            makeRaw('feat: feature one'),
            makeRaw('feat(ui): feature two'),
        ]);

        const result = formatNoAi(grouped, '2.0.0');

        expect(result).toContain('- feature one');
        expect(result).toContain('- **ui:** feature two');
    });
});
