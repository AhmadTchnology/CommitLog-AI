import type { AIProvider } from './types.js';

export function createOllama(model: string, baseUrl?: string): AIProvider {
    const ollamaUrl = baseUrl ?? 'http://localhost:11434';

    return {
        name: 'ollama',
        async generate(prompt: string, systemPrompt: string): Promise<string> {
            const response = await fetch(`${ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt },
                    ],
                    stream: false,
                    options: { temperature: 0.3 },
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama API failed (${response.status}): ${error}`);
            }

            const data = (await response.json()) as {
                message: { content: string };
            };

            return data.message?.content?.trim() ?? '';
        },
    };
}
