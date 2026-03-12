import React, { useState } from 'react';

/**
 * Muestra las fuentes utilizadas por el RAG.
 */
const RAGSources = ({ sources }) => {
    const [expanded, setExpanded] = useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <div className="rag-sources">
            <div className="rag-header" onClick={() => setExpanded(!expanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span>Fuentes de contexto ({sources.length})</span>
                </div>
                <button className="toggle-btn">
                    {expanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"></path></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                    )}
                </button>
            </div>

            {expanded && (
                <div className="sources-list anim-fade-in">
                    {sources.map((s, i) => (
                        <div key={i} className="source-item">
                            <span className="source-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14.5 2 14.5 8 20 8"></polyline></svg>
                                {s.source}
                            </span>
                            <span className="source-similarity">
                                {(s.similarity * 100).toFixed(1)}% match
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RAGSources;
