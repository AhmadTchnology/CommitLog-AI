export interface AIProvider {
    name: string;
    generate(prompt: string, systemPrompt: string): Promise<string>;
}
