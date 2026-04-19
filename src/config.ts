import { cosmiconfig } from 'cosmiconfig';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import TOML from '@iarna/toml';

export interface ProviderConfig {
    api_key?: string;
    base_url?: string;
    model?: string;
}

export interface DefaultsConfig {
    provider: string;
    model: string;
    format: 'keepachangelog' | 'simple' | 'github-release' | 'detailed';
    output: string;
    language: string;
    max_commits: number;
}

export interface CommitlogConfig {
    defaults: DefaultsConfig;
    openai?: ProviderConfig;
    anthropic?: ProviderConfig;
    gemini?: ProviderConfig;
    groq?: ProviderConfig;
    openrouter?: ProviderConfig;
    nim?: ProviderConfig;
    ollama?: ProviderConfig;
    [key: string]: unknown;
}

const CONFIG_DIR = path.join(os.homedir(), '.commitlog');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.toml');

const DEFAULT_CONFIG: CommitlogConfig = {
    defaults: {
        provider: 'openai',
        model: 'gpt-4o',
        format: 'keepachangelog',
        output: 'CHANGELOG.md',
        language: 'en',
        max_commits: 500,
    },
};

export async function loadConfig(): Promise<CommitlogConfig> {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsed = TOML.parse(content) as unknown as CommitlogConfig;
        return { ...DEFAULT_CONFIG, ...parsed, defaults: { ...DEFAULT_CONFIG.defaults, ...parsed.defaults } };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

export async function saveConfig(config: CommitlogConfig): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tomlString = TOML.stringify(config as any);
    await fs.writeFile(CONFIG_PATH, tomlString, 'utf-8');
}

export function getProviderConfig(config: CommitlogConfig, providerName: string): ProviderConfig {
    return (config[providerName] as ProviderConfig) ?? {};
}

export function getConfigPath(): string {
    return CONFIG_PATH;
}

export async function setConfigValue(key: string, value: string): Promise<void> {
    const config = await loadConfig();
    const parts = key.split('.');

    if (parts.length === 1) {
        (config.defaults as any)[key] = value;
    } else if (parts.length === 2) {
        const [section, field] = parts;
        if (!config[section]) {
            (config as Record<string, unknown>)[section] = {};
        }
        (config[section] as Record<string, unknown>)[field] = value;
    }

    await saveConfig(config);
}
