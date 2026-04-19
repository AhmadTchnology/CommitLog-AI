import { loadConfig, getProviderConfig } from '../config.js';
import { getCommitsBetween, getCommitsSince, resolveRange, isGitRepo, getCommitCount } from '../git.js';
import { parseAndGroup } from '../parser.js';
import { buildPrompt, type OutputFormat } from '../prompt.js';
import { formatNoAi, prependToChangelog, overwriteChangelog } from '../formatter.js';
import { detectVersion } from '../version.js';
import { createProvider } from '../providers/index.js';
import {
    showBanner,
    showRangeInfo,
    showAutoDetectInfo,
    showPreview,
    createSpinner,
    showSuccess,
    showError,
    showWarning,
    promptAction,
    promptProviderRetry,
} from '../ui.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface GenerateOptions {
    provider?: string;
    model?: string;
    format?: OutputFormat;
    lang?: string;
    dryRun?: boolean;
    noAi?: boolean;
    stdout?: boolean;
    prepend?: boolean;
    overwrite?: boolean;
    since?: string;
    output?: string;
}

export async function generateCommand(
    from: string | undefined,
    to: string | undefined,
    options: GenerateOptions,
): Promise<void> {
    showBanner();

    // 1. Verify git repo
    if (!(await isGitRepo())) {
        showError('Not a git repository. Run this command inside a git repo.');
        process.exit(1);
    }

    // 2. Load config
    const config = await loadConfig();
    const providerName = options.provider ?? config.defaults.provider;
    const modelName = options.model ?? config.defaults.model;
    const format = options.format ?? config.defaults.format;
    const language = options.lang ?? config.defaults.language;
    const outputFile = options.output ?? config.defaults.output;
    const maxCommits = config.defaults.max_commits;

    // 3. Resolve commit range
    let commits;
    if (options.since) {
        const spinner = createSpinner(`Reading commits since ${options.since}...`);
        commits = await getCommitsSince(options.since, maxCommits);
        spinner.stop();
    } else {
        const range = await resolveRange(from, to);

        if (!from && !to) {
            showAutoDetectInfo(range.from, range.to);
        }

        const count = await getCommitCount(range.from, range.to);
        showRangeInfo(range.from, range.to, count);

        const spinner = createSpinner(`Reading ${count} commits...`);
        commits = await getCommitsBetween(range.from, range.to, maxCommits);
        spinner.stop();

        // Use range version if available
        if (range.version && !options.noAi) {
            // version from tags
        }
    }

    if (commits.length === 0) {
        showWarning('No commits found in the specified range.');
        return;
    }

    // 4. Parse and group
    const spinner2 = createSpinner('Grouping by type...');
    const grouped = parseAndGroup(commits);
    spinner2.succeed('Commits grouped');

    // 5. Detect version
    const version = await detectVersion() ?? undefined;

    // 6. Generate changelog
    let changelog: string = '';

    if (options.noAi) {
        changelog = formatNoAi(grouped, version);
    } else {
        // Validate provider config
        let currentProviderName = providerName;
        let currentModelName: string | undefined = modelName;
        let success = false;

        while (!success) {
            const providerConfig = getProviderConfig(config, currentProviderName);

            if (currentProviderName !== 'ollama' && !providerConfig.api_key) {
                const errMsg = `No API key found for "${currentProviderName}". Run "commitlog setup" or set it in ~/.commitlog/config.toml`;
                const retryChoice = await promptProviderRetry(errMsg, currentProviderName);
                if (!retryChoice) {
                    process.exit(1);
                } else if (retryChoice === 'no-ai') {
                    showWarning('Falling back to --no-ai format...');
                    changelog = formatNoAi(grouped, version);
                    break;
                } else {
                    currentProviderName = retryChoice;
                    currentModelName = undefined; // reset model to use provider default
                    continue;
                }
            }

            const aiSpinner = createSpinner(`Generating changelog with ${currentProviderName} ...`);

            try {
                const provider = createProvider(
                    currentProviderName,
                    providerConfig.api_key,
                    currentModelName,
                    providerConfig.base_url,
                );

                const { systemPrompt, userPrompt } = buildPrompt(grouped, format, version, language);
                changelog = await provider.generate(userPrompt, systemPrompt);
                aiSpinner.succeed('Changelog generated');
                success = true;
            } catch (err) {
                aiSpinner.fail('AI generation failed');
                const errMsg = err instanceof Error ? err.message : String(err);

                const retryChoice = await promptProviderRetry(errMsg, currentProviderName);
                if (!retryChoice) {
                    process.exit(1);
                } else if (retryChoice === 'no-ai') {
                    showWarning('Falling back to --no-ai format...');
                    changelog = formatNoAi(grouped, version);
                    break;
                } else {
                    currentProviderName = retryChoice;
                    currentModelName = undefined;
                }
            }
        }
    }

    // 7. Output
    if (options.stdout || options.dryRun) {
        showPreview(changelog);
        if (options.dryRun) {
            console.log('\n  (dry run — no file written)\n');
        }
        return;
    }

    // 8. Interactive flow
    let done = false;
    while (!done) {
        showPreview(changelog);

        const outputPath = path.resolve(outputFile);
        let hasExisting = false;
        try {
            await fs.access(outputPath);
            hasExisting = true;
        } catch {
            // File doesn't exist
        }

        const action = await promptAction(hasExisting);

        switch (action) {
            case 'append':
            case 'prepend':
                await prependToChangelog(changelog, outputPath);
                showSuccess(`${outputFile} updated successfully`);
                done = true;
                break;

            case 'overwrite':
                await overwriteChangelog(changelog, outputPath);
                showSuccess(`${outputFile} overwritten successfully`);
                done = true;
                break;

            case 'regenerate':
                if (options.noAi) {
                    showWarning('Cannot regenerate in --no-ai mode');
                } else {
                    const regenSpinner = createSpinner(`Regenerating with ${modelName}...`);
                    try {
                        const providerConfig = getProviderConfig(config, providerName);
                        const provider = createProvider(
                            providerName,
                            providerConfig.api_key,
                            modelName,
                            providerConfig.base_url,
                        );
                        const { systemPrompt, userPrompt } = buildPrompt(grouped, format, version, language);
                        changelog = await provider.generate(userPrompt, systemPrompt);
                        regenSpinner.succeed('Regenerated');
                    } catch (err) {
                        regenSpinner.fail('Regeneration failed');
                        showError(err instanceof Error ? err.message : String(err));
                    }
                }
                break;

            case 'copy': {
                const { default: clipboardModule } = await import('node:child_process');
                // Cross-platform clipboard
                const proc = clipboardModule.spawn(
                    process.platform === 'win32' ? 'clip' :
                        process.platform === 'darwin' ? 'pbcopy' : 'xclip',
                    process.platform === 'linux' ? ['-selection', 'clipboard'] : [],
                    { stdio: ['pipe', 'inherit', 'inherit'] },
                );
                proc.stdin?.write(changelog);
                proc.stdin?.end();
                showSuccess('Copied to clipboard');
                break;
            }

            case 'edit':
                showWarning('Edit mode: Copy the output above, make your changes, and run again.');
                done = true;
                break;

            case 'cancel':
                console.log('\n  Cancelled.\n');
                done = true;
                break;
        }
    }
}
