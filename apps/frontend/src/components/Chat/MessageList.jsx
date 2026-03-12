import React, { useEffect, useRef } from 'react';

/**
 * Lista de mensajes con scroll automático.
 */
const MessageList = ({ messages, isStreaming }) => {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="message-list">
            {messages.length === 0 && (
                <div className="empty-chat">
                    <p>¿En qué puedo ayudarte hoy?</p>
                </div>
            )}

            {messages.map((m, i) => (
                <div key={i} className={`message-wrapper ${m.role === 'user' ? 'user' : 'assistant'}`}>
                    <div className="message-bubble anim-pop-in">
                        {m.content}
                        {isStreaming && i === messages.length - 1 && m.role === 'assistant' && (
                            <span className="streaming-cursor">|</span>
                        )}
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};

export default MessageList;
