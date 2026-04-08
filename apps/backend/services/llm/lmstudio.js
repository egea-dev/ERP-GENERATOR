const { OpenAI } = require('openai');
const { ProxyAgent, fetch: undiciFetch } = require('undici');
const LLMProvider = require('./base');

/**
 * Adapter para LM Studio (local).
 * Compatible con la API de OpenAI.
 */
class LMStudioProvider extends LLMProvider {
    constructor() {
        super();
        this.baseURL = process.env.LMSTUDIO_URL || 'http://localhost:1234/v1';
        this.proxyURL = process.env.LMSTUDIO_PROXY_URL || '';
        this.fetchOptions = this.proxyURL
            ? { dispatcher: new ProxyAgent(this.proxyURL) }
            : undefined;

        this.client = new OpenAI({
            baseURL: this.baseURL,
            apiKey: 'lm-studio', // El valor no importa para LM Studio local
            fetchOptions: this.fetchOptions,
        });
        console.log(`[LMStudio] Cliente inicializado con baseURL: ${this.baseURL}`);
        if (this.proxyURL) {
            console.log(`[LMStudio] Proxy HTTP activo: ${this.proxyURL}`);
        }
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
        const baseUrl = this.baseURL.replace(/\/$/, '');
        const paths = [
            baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`,
            baseUrl + '/models',
            baseUrl.replace(/\/v1$/, '') + '/models'
        ];

        for (const url of [...new Set(paths)]) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1500);
                const resp = await undiciFetch(url, {
                    signal: controller.signal,
                    ...(this.fetchOptions || {}),
                });
                clearTimeout(timeoutId);
                if (resp.ok) return { available: true };
            } catch (e) { /* continue */ }
        }
        return { available: false, error: 'LM Studio no responde en las rutas estándar.' };
    }
}

module.exports = LMStudioProvider;
