import type { AIProvider } from './types.js';
import { openAICompatibleGenerate } from './utils.js';

export function createOpenAI(apiKey: string, model: string): AIProvider {
    return {
        name: 'openai',
        generate: (prompt, systemPrompt) =>
            openAICompatibleGenerate(
                { apiKey, baseUrl: 'https://api.openai.com/v1', model },
                prompt,
                systemPrompt,
            ),
    };
}
