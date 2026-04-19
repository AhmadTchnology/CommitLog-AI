import type { AIProvider } from './types.js';
import { openAICompatibleGenerate } from './utils.js';

export function createGroq(apiKey: string, model: string): AIProvider {
    return {
        name: 'groq',
        generate: (prompt, systemPrompt) =>
            openAICompatibleGenerate(
                { apiKey, baseUrl: 'https://api.groq.com/openai/v1', model },
                prompt,
                systemPrompt,
            ),
    };
}
