import { execa } from 'execa';
import semver from 'semver';

export interface RawCommit {
    hash: string;
    message: string;
    body: string;
    author: string;
    date: string;
}

const LOG_FORMAT = '%H|||%s|||%b|||%an|||%ai';
const SEPARATOR = '<<<COMMIT>>>';

export async function getCommitsBetween(from: string, to: string, maxCommits = 500): Promise<RawCommit[]> {
    const { stdout } = await execa('git', [
        'log',
        `${from}..${to}`,
        `--format=${LOG_FORMAT}${SEPARATOR}`,
        `--max-count=${maxCommits}`,
    ]);

    return parseGitLog(stdout);
}

export async function getCommitsSince(since: string, maxCommits = 500): Promise<RawCommit[]> {
    const { stdout } = await execa('git', [
        'log',
        `--since="${since}"`,
        `--format=${LOG_FORMAT}${SEPARATOR}`,
        `--max-count=${maxCommits}`,
    ]);

    return parseGitLog(stdout);
}

export async function getLatestTags(count = 2): Promise<string[]> {
    try {
        const { stdout } = await execa('git', [
            'tag',
            '--sort=-v:refname',
            '--list',
        ]);

        const tags = stdout
            .split('\n')
            .map(t => t.trim())
            .filter(t => t && semver.valid(semver.clean(t)));

        return tags.slice(0, count);
    } catch {
        return [];
    }
}

export async function resolveRange(from?: string, to?: string): Promise<{ from: string; to: string; version?: string }> {
    if (from && to) {
        const version = semver.valid(semver.clean(to)) ? semver.clean(to)! : undefined;
        return { from, to, version };
    }

    const tags = await getLatestTags(2);

    if (tags.length >= 2) {
        return {
            from: tags[1],
            to: tags[0],
            version: semver.clean(tags[0]) ?? undefined,
        };
    }

    if (tags.length === 1) {
        return {
            from: tags[0],
            to: 'HEAD',
            version: undefined,
        };
    }

    // No tags found — get all commits
    const { stdout } = await execa('git', ['rev-list', '--max-parents=0', 'HEAD']);
    const firstCommit = stdout.trim().split('\n')[0];
    return { from: firstCommit, to: 'HEAD' };
}

export async function isGitRepo(): Promise<boolean> {
    try {
        await execa('git', ['rev-parse', '--is-inside-work-tree']);
        return true;
    } catch {
        return false;
    }
}

export async function getCommitCount(from: string, to: string): Promise<number> {
    const { stdout } = await execa('git', ['rev-list', '--count', `${from}..${to}`]);
    return parseInt(stdout.trim(), 10);
}

function parseGitLog(stdout: string): RawCommit[] {
    if (!stdout.trim()) return [];

    return stdout
        .split(SEPARATOR)
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
            const parts = entry.split('|||');
            return {
                hash: parts[0]?.trim() ?? '',
                message: parts[1]?.trim() ?? '',
                body: parts[2]?.trim() ?? '',
                author: parts[3]?.trim() ?? '',
                date: parts[4]?.trim() ?? '',
            };
        })
        .filter(c => c.hash);
}
