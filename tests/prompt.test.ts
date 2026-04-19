import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/prompt.js';
import { parseAndGroup } from '../src/parser.js';
import type { RawCommit } from '../src/git.js';

function makeRaw(message: string): RawCommit {
    return { hash: 'abc123', message, body: '', author: 'Test', date: '2026-04-13' };
}

const SAMPLE_COMMITS: RawCommit[] = [
    makeRaw('feat(auth): add OAuth2 login'),
    makeRaw('fix(api): handle null response on timeout'),
    makeRaw('chore: bump dependencies'),
];

describe('buildPrompt', () => {
    it('builds keepachangelog format prompt', () => {
        const grouped = parseAndGroup(SAMPLE_COMMITS);
        const { systemPrompt, userPrompt } = buildPrompt(grouped, 'keepachangelog', '1.3.0');

        expect(systemPrompt).toContain('Keep a Changelog');
        expect(systemPrompt).toContain('1.3.0');
        expect(userPrompt).toContain('Features:');
        expect(userPrompt).toContain('add OAuth2 login');
    });

    it('builds simple format prompt', () => {
        const grouped = parseAndGroup(SAMPLE_COMMITS);
        const { systemPrompt } = buildPrompt(grouped, 'simple', '1.0.0');

        expect(systemPrompt).toContain('flat bullet list');
    });

    it('builds github-release format prompt', () => {
        const grouped = parseAndGroup(SAMPLE_COMMITS);
        const { systemPrompt } = buildPrompt(grouped, 'github-release');

        expect(systemPrompt).toContain('GitHub release notes');
        expect(systemPrompt).toContain('emoji');
    });

    it('builds detailed format prompt', () => {
        const grouped = parseAndGroup(SAMPLE_COMMITS);
        const { systemPrompt } = buildPrompt(grouped, 'detailed');

        expect(systemPrompt).toContain('executive summary');
    });

    it('includes language name in prompt', () => {
        const grouped = parseAndGroup(SAMPLE_COMMITS);
        const { systemPrompt } = buildPrompt(grouped, 'keepachangelog', '1.0.0', 'fr');

        expect(systemPrompt).toContain('French');
    });

    it('defaults to English if unknown language', () => {
        const grouped = parseAndGroup(SAMPLE_COMMITS);
        const { systemPrompt } = buildPrompt(grouped, 'keepachangelog', '1.0.0', 'xx');

        expect(systemPrompt).toContain('English');
    });
});
