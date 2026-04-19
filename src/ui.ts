import chalk from 'chalk';
import ora from 'ora';
import { select } from '@inquirer/prompts';
import { marked } from 'marked';
// @ts-expect-error marked-terminal lacks proper type exports
import { markedTerminal } from 'marked-terminal';

marked.use(markedTerminal());

export type UserAction = 'append' | 'prepend' | 'overwrite' | 'edit' | 'regenerate' | 'copy' | 'cancel';

export function showBanner(): void {
    console.log(
        chalk.bold.cyan('\n  ⚡ commitlog') + chalk.dim(' — AI Changelog Generator\n'),
    );
}

export function showRangeInfo(from: string, to: string, count: number): void {
    console.log(
        chalk.dim('  ℹ ') +
        chalk.white(`Reading ${chalk.bold(String(count))} commits between `) +
        chalk.yellow(from) +
        chalk.white(' → ') +
        chalk.yellow(to) +
        '\n',
    );
}

export function showAutoDetectInfo(from: string, to: string): void {
    console.log(
        chalk.dim('  ℹ ') +
        chalk.white('No range specified. Detected: ') +
        chalk.yellow(from) +
        chalk.white(' → ') +
        chalk.yellow(to),
    );
    console.log(chalk.dim('    Use positional args or --since to override.\n'));
}

export function showPreview(changelog: string): void {
    const border = chalk.dim('─'.repeat(50));
    console.log(`\n${chalk.bold.green('✨ Generated changelog:')}\n`);
    console.log(border);
    console.log(marked(changelog));
    console.log(border);
}

export function createSpinner(text: string) {
    return ora({ text, color: 'cyan' }).start();
}

export function showSuccess(message: string): void {
    console.log(chalk.bold.green(`\n  ✅ ${message}\n`));
}

export function showError(message: string): void {
    console.log(chalk.bold.red(`\n  ❌ ${message}\n`));
}

export function showWarning(message: string): void {
    console.log(chalk.yellow(`\n  ⚠️  ${message}\n`));
}

export async function promptAction(hasExisting: boolean): Promise<UserAction> {
    const choices = [
        ...(hasExisting
            ? [
                { name: '📝 Prepend to CHANGELOG.md', value: 'prepend' as const },
                { name: '📄 Overwrite CHANGELOG.md', value: 'overwrite' as const },
            ]
            : [
                { name: '📄 Create CHANGELOG.md', value: 'append' as const },
            ]),
        { name: '✏️  Edit', value: 'edit' as const },
        { name: '🔄 Regenerate', value: 'regenerate' as const },
        { name: '📋 Copy to clipboard', value: 'copy' as const },
        { name: '❌ Cancel', value: 'cancel' as const },
    ];

    return select({
        message: 'What would you like to do?',
        choices,
    });
}

export async function promptProviderRetry(errorMsg: string, currentProvider: string): Promise<string | null> {
    console.log(chalk.bold.red(`\n  ❌ Provider '${currentProvider}' failed:`));
    console.log(chalk.red(`     ${errorMsg}\n`));

    const choices = [
        { name: '🔄 Retry with OpenAI', value: 'openai' },
        { name: '🔄 Retry with Anthropic', value: 'anthropic' },
        { name: '🔄 Retry with Gemini', value: 'gemini' },
        { name: '🔄 Retry with Groq', value: 'groq' },
        { name: '🔄 Retry with NVIDIA NIM', value: 'nim' },
        { name: '🔄 Retry with OpenRouter', value: 'openrouter' },
        { name: '🔄 Retry with Ollama', value: 'ollama' },
        { name: '⚠️  Fallback to --no-ai mode', value: 'no-ai' },
        { name: '❌ Cancel', value: 'cancel' },
    ];

    const action = await select({
        message: 'How would you like to proceed?',
        choices,
    });

    if (action === 'cancel') return null;
    return action;
}
