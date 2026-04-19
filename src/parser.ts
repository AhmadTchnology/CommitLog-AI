import type { RawCommit } from './git.js';

export type CommitCategory =
    | 'breaking'
    | 'added'
    | 'fixed'
    | 'changed'
    | 'deprecated'
    | 'removed'
    | 'security'
    | 'maintenance'
    | 'documentation'
    | 'other';

export interface ParsedCommit {
    hash: string;
    type: string;
    scope?: string;
    description: string;
    body: string;
    author: string;
    date: string;
    category: CommitCategory;
    isBreaking: boolean;
}

export interface GroupedCommits {
    breaking: ParsedCommit[];
    added: ParsedCommit[];
    fixed: ParsedCommit[];
    changed: ParsedCommit[];
    deprecated: ParsedCommit[];
    removed: ParsedCommit[];
    security: ParsedCommit[];
    maintenance: ParsedCommit[];
    documentation: ParsedCommit[];
    other: ParsedCommit[];
}

const CONVENTIONAL_REGEX = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;

const TYPE_TO_CATEGORY: Record<string, CommitCategory> = {
    feat: 'added',
    feature: 'added',
    fix: 'fixed',
    bugfix: 'fixed',
    hotfix: 'fixed',
    docs: 'documentation',
    doc: 'documentation',
    style: 'changed',
    refactor: 'changed',
    perf: 'changed',
    test: 'maintenance',
    tests: 'maintenance',
    chore: 'maintenance',
    build: 'maintenance',
    ci: 'maintenance',
    revert: 'changed',
    deps: 'maintenance',
    deprecated: 'deprecated',
    deprecate: 'deprecated',
    remove: 'removed',
    security: 'security',
    sec: 'security',
};

export function parseCommit(raw: RawCommit): ParsedCommit {
    const match = raw.message.match(CONVENTIONAL_REGEX);
    const isBreakingBody = raw.body.includes('BREAKING CHANGE') || raw.message.includes('BREAKING CHANGE');

    if (match) {
        const [, type, scope, bang, description] = match;
        const isBreaking = !!bang || isBreakingBody;
        const category: CommitCategory = isBreaking ? 'breaking' : (TYPE_TO_CATEGORY[type.toLowerCase()] ?? 'other');

        return {
            hash: raw.hash,
            type: type.toLowerCase(),
            scope: scope ?? undefined,
            description,
            body: raw.body,
            author: raw.author,
            date: raw.date,
            category,
            isBreaking,
        };
    }

    // Non-conventional commit
    return {
        hash: raw.hash,
        type: 'other',
        scope: undefined,
        description: raw.message,
        body: raw.body,
        author: raw.author,
        date: raw.date,
        category: isBreakingBody ? 'breaking' : 'other',
        isBreaking: isBreakingBody,
    };
}

export function parseAndGroup(rawCommits: RawCommit[]): GroupedCommits {
    const grouped: GroupedCommits = {
        breaking: [],
        added: [],
        fixed: [],
        changed: [],
        deprecated: [],
        removed: [],
        security: [],
        maintenance: [],
        documentation: [],
        other: [],
    };

    for (const raw of rawCommits) {
        const parsed = parseCommit(raw);
        grouped[parsed.category].push(parsed);
    }

    return grouped;
}

export function groupedToString(grouped: GroupedCommits): string {
    const sections: string[] = [];

    const labels: Record<CommitCategory, string> = {
        breaking: 'Breaking Changes',
        added: 'Features',
        fixed: 'Bug Fixes',
        changed: 'Changes',
        deprecated: 'Deprecated',
        removed: 'Removed',
        security: 'Security',
        maintenance: 'Maintenance',
        documentation: 'Documentation',
        other: 'Other',
    };

    for (const [key, label] of Object.entries(labels)) {
        const commits = grouped[key as CommitCategory];
        if (commits.length === 0) continue;

        const items = commits
            .map(c => `  - ${c.scope ? `(${c.scope}) ` : ''}${c.description}`)
            .join('\n');

        sections.push(`${label}:\n${items}`);
    }

    return sections.join('\n\n');
}
