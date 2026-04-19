import type { AIProvider } from './types.js';
import { createOpenAI } from './openai.js';
import { createAnthropic } from './anthropic.js';
import { createGemini } from './gemini.js';
import { createGroq } from './groq.js';
import { createNIM } from './nim.js';
import { createOpenRouter } from './openrouter.js';
import { createOllama } from './ollama.js';

export type { AIProvider } from './types.js';

export function createProvider(
    name: string,
    apiKey?: string,
    model?: string,
    baseUrl?: string,
): AIProvider {
    switch (name.toLowerCase()) {
        case 'openai':
            return createOpenAI(apiKey!, model ?? 'gpt-4o');
        case 'anthropic':
            return createAnthropic(apiKey!, model ?? 'claude-3-5-sonnet-20241022');
        case 'gemini':
            return createGemini(apiKey!, model ?? 'gemini-1.5-pro');
        case 'groq':
            return createGroq(apiKey!, model ?? 'llama3-70b-8192');
        case 'nim':
            return createNIM(apiKey!, model ?? 'meta/llama3-70b-instruct', baseUrl);
        case 'openrouter':
            return createOpenRouter(apiKey!, model ?? 'anthropic/claude-3.5-sonnet');
        case 'ollama':
            return createOllama(model ?? 'llama3', baseUrl);
        default:
            throw new Error(`Unknown provider: ${name}`);
    }
}
