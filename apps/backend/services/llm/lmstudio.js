const { OpenAI } = require('openai');
const LLMProvider = require('./base');

/**
 * Adapter para LM Studio (local).
 * Compatible con la API de OpenAI.
 */
class LMStudioProvider extends LLMProvider {
    constructor() {
        super();
        this.client = new OpenAI({
            baseURL: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
            apiKey: 'lm-studio', // El valor no importa para LM Studio local
        });
        console.log(`[LMStudio] Cliente inicializado con baseURL: ${this.client.baseURL}`);
        this.defaultModel = process.env.LMSTUDIO_DEFAULT_MODEL || 'local-model';
    }

    async *stream({ messages, model, temperature }) {
        try {
            const response = await this.client.chat.completions.create({
                model: model || this.defaultModel,
                messages,
                temperature: temperature !== undefined ? temperature : 0.7,
                stream: true,
            });

            for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) yield content;
            }
        } catch (error) {
            console.error('[LMStudio] Stream Error:', error.message);
            if (error.status) console.error(`[LMStudio] HTTP Status: ${error.status}`);
            throw error;
        }
    }

    async healthCheck() {
        const baseUrl = this.client.baseURL.replace(/\/$/, '');
        const paths = [
            baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`,
            baseUrl + '/models',
            baseUrl.replace(/\/v1$/, '') + '/models'
        ];

        for (const url of [...new Set(paths)]) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1500);
                const resp = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (resp.ok) return { available: true };
            } catch (e) { /* continue */ }
        }
        return { available: false, error: 'LM Studio no responde en las rutas estándar.' };
    }
}

module.exports = LMStudioProvider;
