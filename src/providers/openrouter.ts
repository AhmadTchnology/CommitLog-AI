import type { AIProvider } from './types.js';
import { openAICompatibleGenerate } from './utils.js';

export function createOpenRouter(apiKey: string, model: string): AIProvider {
    return {
        name: 'openrouter',
        generate: (prompt, systemPrompt) =>
            openAICompatibleGenerate(
                { apiKey, baseUrl: 'https://openrouter.ai/api/v1', model },
                prompt,
                systemPrompt,
            ),
    };
}
