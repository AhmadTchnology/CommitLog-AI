import { select, input, password } from '@inquirer/prompts';
import { saveConfig, loadConfig, getConfigPath, type CommitlogConfig, type ProviderConfig } from '../config.js';
import { showBanner, showSuccess, showError } from '../ui.js';
import chalk from 'chalk';

const PROVIDERS = [
    { name: 'OpenAI (GPT-4o, GPT-4-turbo)', value: 'openai' },
    { name: 'Anthropic (Claude 3.5 Sonnet)', value: 'anthropic' },
    { name: 'Google Gemini (gemini-1.5-pro)', value: 'gemini' },
    { name: 'Groq (Llama 3, Mixtral — blazing fast)', value: 'groq' },
    { name: 'NVIDIA NIM (OpenAI-compatible)', value: 'nim' },
    { name: 'OpenRouter (100+ models)', value: 'openrouter' },
    { name: 'Ollama (fully offline, local)', value: 'ollama' },
];

const DEFAULT_MODELS: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-1.5-pro',
    groq: 'llama3-70b-8192',
    nim: 'meta/llama3-70b-instruct',
    openrouter: 'anthropic/claude-3.5-sonnet',
    ollama: 'llama3',
};

export async function setupCommand(): Promise<void> {
    showBanner();
    console.log(chalk.dim('  First-time setup wizard\n'));

    const config = await loadConfig();

    // 1. Select provider
    const provider = await select({
        message: 'Select your default AI provider:',
        choices: PROVIDERS,
    });

    // 2. API key (skip for Ollama)
    let apiKey: string | undefined;
    if (provider !== 'ollama') {
        apiKey = await password({
            message: `Enter your ${provider} API key:`,
            mask: '*',
        });

        if (!apiKey) {
            showError('API key is required. Run "commitlog setup" again.');
            return;
        }
    }

    // 3. Model
    const model = await input({
        message: 'Model to use:',
        default: DEFAULT_MODELS[provider],
    });

    // 4. Output format
    const format = await select({
        message: 'Default changelog format:',
        choices: [
            { name: 'Keep a Changelog (recommended)', value: 'keepachangelog' },
            { name: 'Simple bullet list', value: 'simple' },
            { name: 'GitHub Release style', value: 'github-release' },
            { name: 'Detailed with summary', value: 'detailed' },
        ],
    });

    // 5. Language
    const language = await input({
        message: 'Output language code (en, fr, de, es, ar, etc.):',
        default: 'en',
    });

    // 6. Base URL (for NIM/Ollama)
    let baseUrl: string | undefined;
    if (provider === 'nim') {
        baseUrl = await input({
            message: 'NIM base URL:',
            default: 'https://integrate.api.nvidia.com/v1',
        });
    } else if (provider === 'ollama') {
        baseUrl = await input({
            message: 'Ollama base URL:',
            default: 'http://localhost:11434',
        });
    }

    // 7. Save config
    const providerConfig: ProviderConfig = {};
    if (apiKey) providerConfig.api_key = apiKey;
    if (baseUrl) providerConfig.base_url = baseUrl;
    providerConfig.model = model;

    config.defaults = {
        ...config.defaults,
        provider,
        model,
        format: format as CommitlogConfig['defaults']['format'],
        language,
    };

    (config as Record<string, unknown>)[provider] = providerConfig;

    await saveConfig(config);

    showSuccess(`Configuration saved to ${getConfigPath()}`);
    console.log(chalk.dim('  Run "commitlog" in any git repo to generate a changelog.\n'));
}
