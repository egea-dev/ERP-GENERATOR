import { useState, useCallback } from 'react';

/**
 * Hook para manejar SSE streaming desde el backend.
 */
export const useStream = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

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

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages, provider, useRag }),
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

                // Procesar lineas SSE
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Mantener el resto incompleto

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
                                onDone && onDone(data);
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
        } catch (err) {
            console.error('StreamChat Error:', err);
            setError(err.message);
            onError && onError(err.message);
            setIsStreaming(false);
        }
    }, []);

    return { streamChat, isStreaming, error };
};
