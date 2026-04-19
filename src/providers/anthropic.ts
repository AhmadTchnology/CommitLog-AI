import type { AIProvider } from './types.js';

export function createAnthropic(apiKey: string, model: string): AIProvider {
    return {
        name: 'anthropic',
        async generate(prompt: string, systemPrompt: string): Promise<string> {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Anthropic API failed (${response.status}): ${error}`);
            }

            const data = (await response.json()) as {
                content: Array<{ text: string }>;
            };

            return data.content[0]?.text?.trim() ?? '';
        },
    };
}
