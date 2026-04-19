import type { GroupedCommits } from './parser.js';
import { groupedToString } from './parser.js';

export type OutputFormat = 'keepachangelog' | 'simple' | 'github-release' | 'detailed';

export function buildPrompt(
    grouped: GroupedCommits,
    format: OutputFormat,
    version?: string,
    language = 'en',
): { systemPrompt: string; userPrompt: string } {
    const commitText = groupedToString(grouped);
    const today = new Date().toISOString().split('T')[0];
    const versionLabel = version ?? 'Unreleased';

    const systemPrompts: Record<OutputFormat, string> = {
        keepachangelog: `You are a senior software engineer writing release notes for a CHANGELOG.md.
Follow the Keep a Changelog format (keepachangelog.com/en/1.0.0/).

Format:
## [${versionLabel}] - ${today}

### Breaking Changes
### Added
### Fixed
### Changed
### Deprecated
### Removed
### Security

Rules:
- Write in plain ${getLanguageName(language)}, not commit message style
- Each item starts with a capital letter, no period at end
- Group related changes together into one item if they form one feature
- Highlight user-facing impact, not implementation details
- If a section has no entries, omit it entirely
- Output ONLY the markdown. No explanation. No preamble.`,

        simple: `You are a senior software engineer writing a simple changelog summary.

Format: A flat bullet list of changes, no section headers.

Rules:
- Write in plain ${getLanguageName(language)}
- Each item starts with "- " and a capital letter, no period at end
- Group related changes together
- Highlight user-facing impact
- Output ONLY the bullet list. No explanation. No preamble.
- Prefix with: ## [${versionLabel}] - ${today}`,

        'github-release': `You are a senior software engineer writing GitHub release notes.

Format: A release summary paragraph followed by categorized bullets with emoji prefixes.

Rules:
- Start with a 2-3 sentence summary of the release
- Use emoji prefixes: 🚀 Added, 🐛 Fixed, ⚠️ Breaking, 🔄 Changed, 🗑️ Removed, 🔒 Security
- Write in plain ${getLanguageName(language)}
- Mention contributor names if provided
- Output ONLY the release notes. No explanation. No preamble.
- Prefix with: ## ${versionLabel}`,

        detailed: `You are a senior software engineer writing detailed release notes.

Format: A comprehensive paragraph summary followed by Keep a Changelog format sections.

Rules:
- Start with a 3-5 sentence executive summary of the release highlighting the most important changes
- Then list categorized changes using Keep a Changelog sections
- Write in plain ${getLanguageName(language)}, conversational but professional
- Each item starts with a capital letter, no period at end
- Group related changes together
- If a section has no entries, omit it entirely
- Output ONLY the markdown. No explanation. No preamble.
- Prefix with: ## [${versionLabel}] - ${today}`,
    };

    return {
        systemPrompt: systemPrompts[format],
        userPrompt: `Commits (pre-grouped):\n\n${commitText}`,
    };
}

function getLanguageName(code: string): string {
    const languages: Record<string, string> = {
        en: 'English',
        fr: 'French',
        de: 'German',
        es: 'Spanish',
        it: 'Italian',
        pt: 'Portuguese',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese',
        ar: 'Arabic',
        tr: 'Turkish',
        ru: 'Russian',
        nl: 'Dutch',
        pl: 'Polish',
        sv: 'Swedish',
        hi: 'Hindi',
    };

    return languages[code] ?? 'English';
}
