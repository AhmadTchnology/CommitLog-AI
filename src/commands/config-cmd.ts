import { loadConfig, setConfigValue, getConfigPath } from '../config.js';
import { showSuccess, showError } from '../ui.js';
import chalk from 'chalk';

export async function configSetCommand(key: string, value: string): Promise<void> {
    try {
        await setConfigValue(key, value);
        showSuccess(`Set ${key} = ${value}`);
    } catch (err) {
        showError(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}

export async function configListCommand(): Promise<void> {
    const config = await loadConfig();
    const configPath = getConfigPath();

    console.log(chalk.bold.cyan('\n  ⚡ commitlog config\n'));
    console.log(chalk.dim(`  Config file: ${configPath}\n`));

    console.log(chalk.bold('  [defaults]'));
    for (const [key, value] of Object.entries(config.defaults)) {
        console.log(`    ${chalk.white(key)} = ${chalk.yellow(String(value))}`);
    }

    const providers = ['openai', 'anthropic', 'gemini', 'groq', 'nim', 'openrouter', 'ollama'];
    for (const provider of providers) {
        const providerConfig = config[provider] as Record<string, unknown> | undefined;
        if (!providerConfig) continue;

        console.log(chalk.bold(`\n  [${provider}]`));
        for (const [key, value] of Object.entries(providerConfig)) {
            const displayValue = key === 'api_key'
                ? maskApiKey(String(value))
                : String(value);
            console.log(`    ${chalk.white(key)} = ${chalk.yellow(displayValue)}`);
        }
    }

    console.log('');
}

function maskApiKey(key: string): string {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••' + key.slice(-4);
}
