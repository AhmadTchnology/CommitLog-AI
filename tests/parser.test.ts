import { describe, it, expect } from 'vitest';
import { parseCommit, parseAndGroup, groupedToString } from '../src/parser.js';
import type { RawCommit } from '../src/git.js';

function makeRaw(message: string, body = ''): RawCommit {
    return { hash: 'abc123', message, body, author: 'Test', date: '2026-04-13' };
}

describe('parseCommit', () => {
    it('parses a conventional feat commit', () => {
        const result = parseCommit(makeRaw('feat(auth): add OAuth2 login'));
        expect(result.type).toBe('feat');
        expect(result.scope).toBe('auth');
        expect(result.description).toBe('add OAuth2 login');
        expect(result.category).toBe('added');
        expect(result.isBreaking).toBe(false);
    });

    it('parses a fix commit', () => {
        const result = parseCommit(makeRaw('fix(api): handle null response'));
        expect(result.type).toBe('fix');
        expect(result.category).toBe('fixed');
    });

    it('parses a chore commit', () => {
        const result = parseCommit(makeRaw('chore: bump dependencies'));
        expect(result.type).toBe('chore');
        expect(result.scope).toBeUndefined();
        expect(result.category).toBe('maintenance');
    });

    it('detects breaking change via bang', () => {
        const result = parseCommit(makeRaw('feat!: remove v1 endpoints'));
        expect(result.isBreaking).toBe(true);
        expect(result.category).toBe('breaking');
    });

    it('detects breaking change via body', () => {
        const result = parseCommit(makeRaw('feat: update API', 'BREAKING CHANGE: old endpoints removed'));
        expect(result.isBreaking).toBe(true);
        expect(result.category).toBe('breaking');
    });

    it('handles non-conventional commits', () => {
        const result = parseCommit(makeRaw('Update README'));
        expect(result.type).toBe('other');
        expect(result.category).toBe('other');
        expect(result.description).toBe('Update README');
    });

    it('parses docs commit', () => {
        const result = parseCommit(makeRaw('docs: update API documentation'));
        expect(result.category).toBe('documentation');
    });

    it('parses security commit', () => {
        const result = parseCommit(makeRaw('security: patch XSS vulnerability'));
        expect(result.category).toBe('security');
    });
});

describe('parseAndGroup', () => {
    it('groups commits by category', () => {
        const raws: RawCommit[] = [
            makeRaw('feat(auth): add OAuth2 login'),
            makeRaw('fix(api): handle null response'),
            makeRaw('chore: bump dependencies'),
            makeRaw('docs: update README'),
            makeRaw('feat!: remove deprecated endpoints'),
        ];

        const grouped = parseAndGroup(raws);
        expect(grouped.added).toHaveLength(1);
        expect(grouped.fixed).toHaveLength(1);
        expect(grouped.maintenance).toHaveLength(1);
        expect(grouped.documentation).toHaveLength(1);
        expect(grouped.breaking).toHaveLength(1);
    });

    it('handles empty input', () => {
        const grouped = parseAndGroup([]);
        expect(grouped.added).toHaveLength(0);
        expect(grouped.fixed).toHaveLength(0);
    });
});

describe('groupedToString', () => {
    it('renders grouped commits as text', () => {
        const grouped = parseAndGroup([
            makeRaw('feat: new feature'),
            makeRaw('fix: bug fix'),
        ]);

        const text = groupedToString(grouped);
        expect(text).toContain('Features:');
        expect(text).toContain('new feature');
        expect(text).toContain('Bug Fixes:');
        expect(text).toContain('bug fix');
    });

    it('omits empty sections', () => {
        const grouped = parseAndGroup([makeRaw('feat: only feature')]);
        const text = groupedToString(grouped);
        expect(text).not.toContain('Bug Fixes:');
        expect(text).not.toContain('Maintenance:');
    });
});
