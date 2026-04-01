import React, { useState } from 'react';
import { buildApiBaseUrl } from '../../apiConfig';

/**
 * Input de texto para el chat.
 */
const ChatInput = ({ onSend, disabled, useRag, onToggleRag }) => {
    const [text, setText] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);

    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSend(text);
            setText('');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar extensiones
        const allowed = ['.txt', '.md', '.csv'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
            alert('Sólo se permiten archivos .txt, .md o .csv');
            return;
        }

        setIsIngesting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result;
            try {
                const token = localStorage.getItem('erp_token');
                const response = await fetch(buildApiBaseUrl('/api/chat/ingest'), {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        content,
                        source: `Frontend: ${file.name}`,
                        filename: file.name
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(`✅ Documento indexado: ${result.insertedCount} fragmentos añadidos.`);
                } else {
                    throw new Error('Error en el servidor');
                }
            } catch (err) {
                console.error(err);
                alert('❌ Error al indexar el documento.');
            } finally {
                setIsIngesting(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-container">
            <div className="chat-options">
                <label className="rag-toggle">
                    <input type="checkbox" checked={useRag} onChange={onToggleRag} />
                    <svg style={{ marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg>
                    <span>USAR CONTEXTO RAG</span>
                </label>
            </div>
            <div className="input-group">
                <input
                    type="file"
                    id="rag-ingest"
                    hidden
                    onChange={handleFileChange}
                    accept=".txt,.md,.csv"
                />
                <button 
                    className="attach-btn" 
                    title="Ingestar documento para RAG"
                    onClick={() => document.getElementById('rag-ingest').click()}
                    disabled={disabled || isIngesting}
                >
                    {isIngesting ? '...' : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    )}
                </button>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isIngesting ? "Procesando documento..." : "Escribe un mensaje..."}
                    disabled={disabled || isIngesting}
                    rows={1}
                />
                <button onClick={handleSend} disabled={disabled || !text.trim() || isIngesting} className="send-btn">
                    {disabled ? '...' : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
