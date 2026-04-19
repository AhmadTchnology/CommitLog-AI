import { Command } from 'commander';
import { generateCommand, type GenerateOptions } from './commands/generate.js';
import { setupCommand } from './commands/setup.js';
import { configSetCommand, configListCommand } from './commands/config-cmd.js';
import { showError } from './ui.js';

const program = new Command();

program
    .name('commitlog')
    .description('AI-powered changelog generator from git commit history')
    .version('1.0.0');

// Default generate command
program
    .argument('[from]', 'Start ref (tag, branch, or SHA)')
    .argument('[to]', 'End ref (tag, branch, or SHA), defaults to HEAD')
    .option('-p, --provider <name>', 'AI provider (openai, anthropic, gemini, groq, nim, openrouter, ollama)')
    .option('-m, --model <name>', 'AI model to use')
    .option('-f, --format <type>', 'Output format (keepachangelog, simple, github-release, detailed)')
    .option('-l, --lang <code>', 'Output language code (en, fr, de, etc.)')
    .option('--since <duration>', 'Time-based range (e.g., "2 weeks ago")')
    .option('-o, --output <file>', 'Output file path', 'CHANGELOG.md')
    .option('--dry-run', 'Print result without writing to file')
    .option('--no-ai', 'Group and format without AI')
    .option('--stdout', 'Print to stdout only')
    .option('--prepend', 'Prepend to existing CHANGELOG.md')
    .option('--overwrite', 'Overwrite entire CHANGELOG.md')
    .action(async (from: string | undefined, to: string | undefined, options: GenerateOptions) => {
        try {
            await generateCommand(from, to, options);
        } catch (err) {
            showError(err instanceof Error ? err.message : String(err));
            process.exit(1);
        }
    });

// Setup command
program
    .command('setup')
    .description('Interactive first-time configuration wizard')
    .action(async () => {
        try {
            await setupCommand();
        } catch (err) {
            showError(err instanceof Error ? err.message : String(err));
            process.exit(1);
        }
    });

// Config commands
const configCmd = program
    .command('config')
    .description('Manage configuration');

configCmd
    .command('set <key> <value>')
    .description('Set a config value (e.g., "defaults.provider groq" or "openai.api_key sk-...")')
    .action(async (key: string, value: string) => {
        try {
            await configSetCommand(key, value);
        } catch (err) {
            showError(err instanceof Error ? err.message : String(err));
            process.exit(1);
        }
    });

configCmd
    .command('list')
    .description('Display current configuration')
    .action(async () => {
        try {
            await configListCommand();
        } catch (err) {
            showError(err instanceof Error ? err.message : String(err));
            process.exit(1);
        }
    });

program.parse();
