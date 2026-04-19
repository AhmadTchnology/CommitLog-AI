import type { AIProvider } from './types.js';

export function createGemini(apiKey: string, model: string): AIProvider {
    return {
        name: 'gemini',
        async generate(prompt: string, systemPrompt: string): Promise<string> {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Gemini API failed (${response.status}): ${error}`);
            }

            const data = (await response.json()) as {
                candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
            };

            return data.candidates[0]?.content?.parts[0]?.text?.trim() ?? '';
        },
    };
}
