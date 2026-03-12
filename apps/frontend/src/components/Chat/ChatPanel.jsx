import React, { useState } from 'react';
import { useStream } from '../../hooks/useStream';
import ProviderBar from './ProviderBar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RAGSources from './RAGSources';
import './ChatPanel.css';

const ChatPanel = () => {
    const [messages, setMessages] = useState([]);
    const [provider, setProvider] = useState('lmstudio');
    const [useRag, setUseRag] = useState(false);
    const [ragSources, setRagSources] = useState([]);
    const { streamChat, isStreaming, error } = useStream();

    const handleSendMessage = async (content) => {
        if (!content.trim() || isStreaming) return;
        const userMessage = { role: 'user', content };
        const assistantPlaceholder = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
        setRagSources([]);
        await streamChat({
            messages: [...messages, userMessage],
            provider,
            useRag,
            onToken: (token) => {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: updated[updated.length - 1].content + token
                    };
                    return updated;
                });
            },
            onDone: (data) => { if (data.ragSources) setRagSources(data.ragSources); },
            onError: (msg) => console.error('Chat Error:', msg)
        });
    };

    return (
        <div className="chat-wrap">

            {/* Card 1: Proveedor */}
            <div className="card" style={{ padding: '14px 18px' }}>
                <div className="stitle">Proveedor</div>
                <ProviderBar selected={provider} onSelect={setProvider} />
            </div>

            {/* Card 2: Conversación */}
            <div className="card chat-messages-card">
                <div className="stitle">Conversación</div>
                <MessageList messages={messages} isStreaming={isStreaming} />
                {ragSources.length > 0 && <RAGSources sources={ragSources} />}
            </div>

            {/* Card 3: Mensaje */}
            <div className="card" style={{ padding: '14px 18px' }}>
                <div className="stitle">Mensaje</div>
                <ChatInput
                    onSend={handleSendMessage}
                    disabled={isStreaming}
                    useRag={useRag}
                    onToggleRag={() => setUseRag(!useRag)}
                />
                {error && <div className="chat-error" style={{ marginTop: 8 }}>Error: {error}</div>}
            </div>

        </div>
    );
};

export default ChatPanel;
