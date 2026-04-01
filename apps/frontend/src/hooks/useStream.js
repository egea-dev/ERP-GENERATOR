import { useState, useCallback, useRef } from 'react';
import { buildApiBaseUrl } from '../apiConfig';

const STREAM_TIMEOUT = 60000; // 60 segundos

/**
 * Hook para manejar SSE streaming desde el backend.
 */
export const useStream = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    const streamChat = useCallback(async ({
        messages,
        provider,
        useRag,
        onToken,
        onDone,
        onError
    }) => {
        setIsStreaming(true);
        setError(null);

        const controller = new AbortController();
        abortRef.current = controller;

        const timeoutId = setTimeout(() => {
            controller.abort();
            setError('Tiempo de espera agotado. La IA no respondió a tiempo.');
            onError?.('Tiempo de espera agotado.');
            setIsStreaming(false);
        }, STREAM_TIMEOUT);

        try {
            const token = localStorage.getItem('erp_token');
            const response = await fetch(buildApiBaseUrl('/api/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ messages, provider, useRag }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.token) {
                                onToken(data.token);
                            }

                            if (data.done) {
                                clearTimeout(timeoutId);
                                onDone?.(data);
                                setIsStreaming(false);
                                return;
                            }

                            if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            console.error('Error parseando SSE data:', e);
                        }
                    }
                }
            }

            clearTimeout(timeoutId);
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                setError('Conexión cancelada.');
                onError?.('Conexión cancelada.');
            } else {
                console.error('StreamChat Error:', err);
                setError(err.message);
                onError?.(err.message);
            }
            setIsStreaming(false);
        }
    }, []);

    const cancelStream = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    return { streamChat, cancelStream, isStreaming, error };
};