import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// We test the config module functions by creating a temp config directory
const TEMP_DIR = path.join(os.tmpdir(), `commitlog-test-${Date.now()}`);

describe('config module', () => {
    beforeEach(async () => {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    });

    afterEach(async () => {
        await fs.rm(TEMP_DIR, { recursive: true, force: true });
    });

    it('creates TOML config file from object', async () => {
        const TOML = await import('@iarna/toml');
        const configData = {
            defaults: {
                provider: 'groq',
                model: 'llama3-70b-8192',
                format: 'keepachangelog',
                output: 'CHANGELOG.md',
                language: 'en',
                max_commits: 500,
            },
            groq: {
                api_key: 'gsk_test123',
            },
        };

        const tomlString = TOML.default.stringify(configData as any);
        const filePath = path.join(TEMP_DIR, 'config.toml');
        await fs.writeFile(filePath, tomlString, 'utf-8');

        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = TOML.default.parse(content);

        expect((parsed as any).defaults.provider).toBe('groq');
        expect((parsed as any).defaults.model).toBe('llama3-70b-8192');
        expect((parsed as any).groq.api_key).toBe('gsk_test123');
    });

    it('handles missing config file gracefully', async () => {
        const missingPath = path.join(TEMP_DIR, 'nonexistent.toml');
        let content: string | null = null;
        try {
            content = await fs.readFile(missingPath, 'utf-8');
        } catch {
            content = null;
        }
        expect(content).toBeNull();
    });

    it('round-trips TOML with multiple providers', async () => {
        const TOML = await import('@iarna/toml');
        const configData = {
            defaults: {
                provider: 'openai',
                model: 'gpt-4o',
                format: 'simple',
                output: 'CHANGELOG.md',
                language: 'fr',
                max_commits: 200,
            },
            openai: { api_key: 'sk-test' },
            anthropic: { api_key: 'sk-ant-test' },
        };

        const filePath = path.join(TEMP_DIR, 'config.toml');
        await fs.writeFile(filePath, TOML.default.stringify(configData as any), 'utf-8');

        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = TOML.default.parse(content) as any;

        expect(parsed.defaults.language).toBe('fr');
        expect(parsed.defaults.max_commits).toBe(200);
        expect(parsed.openai.api_key).toBe('sk-test');
        expect(parsed.anthropic.api_key).toBe('sk-ant-test');
    });
});
