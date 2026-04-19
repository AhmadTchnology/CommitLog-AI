import type { AIProvider } from './types.js';
import { openAICompatibleGenerate } from './utils.js';

export function createNIM(apiKey: string, model: string, baseUrl?: string): AIProvider {
    return {
        name: 'nim',
        generate: (prompt, systemPrompt) =>
            openAICompatibleGenerate(
                {
                    apiKey,
                    baseUrl: baseUrl ?? 'https://integrate.api.nvidia.com/v1',
                    model,
                },
                prompt,
                systemPrompt,
            ),
    };
}
