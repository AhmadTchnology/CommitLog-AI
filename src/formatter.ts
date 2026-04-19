import fs from 'node:fs/promises';
import type { GroupedCommits, CommitCategory } from './parser.js';

const CATEGORY_HEADERS: Record<CommitCategory, string> = {
    breaking: 'Breaking Changes',
    added: 'Added',
    fixed: 'Fixed',
    changed: 'Changed',
    deprecated: 'Deprecated',
    removed: 'Removed',
    security: 'Security',
    maintenance: 'Maintenance',
    documentation: 'Documentation',
    other: 'Other',
};

export function formatNoAi(grouped: GroupedCommits, version?: string): string {
    const today = new Date().toISOString().split('T')[0];
    const versionLabel = version ?? 'Unreleased';
    const lines: string[] = [`## [${versionLabel}] - ${today}`, ''];

    const order: CommitCategory[] = [
        'breaking', 'added', 'fixed', 'changed', 'deprecated',
        'removed', 'security', 'maintenance', 'documentation', 'other',
    ];

    for (const category of order) {
        const commits = grouped[category];
        if (commits.length === 0) continue;

        lines.push(`### ${CATEGORY_HEADERS[category]}`);
        for (const commit of commits) {
            const scope = commit.scope ? `**${commit.scope}:** ` : '';
            lines.push(`- ${scope}${commit.description}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

export async function prependToChangelog(content: string, filePath: string): Promise<void> {
    let existing = '';
    try {
        existing = await fs.readFile(filePath, 'utf-8');
    } catch {
        // File doesn't exist, that's fine
    }

    const HEADER = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';

    if (existing.startsWith('# Changelog')) {
        // Insert new content after the header
        const headerEnd = existing.indexOf('\n\n', existing.indexOf('\n') + 1);
        if (headerEnd !== -1) {
            const header = existing.slice(0, headerEnd + 2);
            const rest = existing.slice(headerEnd + 2);
            await fs.writeFile(filePath, `${header}${content}\n\n${rest}`, 'utf-8');
        } else {
            await fs.writeFile(filePath, `${existing}\n\n${content}\n`, 'utf-8');
        }
    } else if (existing) {
        await fs.writeFile(filePath, `${HEADER}${content}\n\n${existing}`, 'utf-8');
    } else {
        await fs.writeFile(filePath, `${HEADER}${content}\n`, 'utf-8');
    }
}

export async function overwriteChangelog(content: string, filePath: string): Promise<void> {
    const HEADER = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    await fs.writeFile(filePath, `${HEADER}${content}\n`, 'utf-8');
}
