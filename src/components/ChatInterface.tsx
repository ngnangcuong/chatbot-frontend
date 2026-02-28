import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface ChatInterfaceProps {
    sessionId: string | null;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If we have a session ID, fetch any existing history (good for persistence if page reloads)
        if (sessionId) {
            axios.get(`http://localhost:8000/api/history/${sessionId}`)
                .then(res => {
                    setMessages(res.data);
                })
                .catch(err => console.error("Could not load history", err));
        }
    }, [sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !sessionId || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMessage
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let startedStreaming = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (!startedStreaming) {
                    setIsLoading(false); // Hide the loading indicator ONLY when first bytes arrive
                    setMessages(prev => [...prev, { role: 'ai', content: "" }]);
                    startedStreaming = true;
                }

                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = { ...newMessages[newMessages.length - 1] };
                    lastMessage.content += chunk;
                    newMessages[newMessages.length - 1] = lastMessage;
                    return newMessages;
                });
            }

            if (!startedStreaming) {
                setIsLoading(false);
                setMessages(prev => [...prev, { role: 'ai', content: "Backend took too long or returned empty response." }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error processing your request." }]);
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu className="text-gradient" />
                    AI Assistant
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Ask me anything, including questions about your uploaded documents!
                </p>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <Cpu size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No messages yet. Send a message to start!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}
                        >
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-full)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
                                    color: msg.role === 'user' ? 'var(--text-primary)' : 'white'
                                }}
                            >
                                {msg.role === 'user' ? <User size={20} /> : <Cpu size={20} />}
                            </div>

                            <div
                                style={{
                                    background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--bg-glass)',
                                    padding: '1rem 1.25rem',
                                    borderRadius: 'var(--radius-lg)',
                                    borderTopRightRadius: msg.role === 'user' ? 0 : 'var(--radius-lg)',
                                    borderTopLeftRadius: msg.role === 'ai' ? 0 : 'var(--radius-lg)',
                                    maxWidth: '80%',
                                    border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none'
                                }}
                            >
                                <div style={{ lineHeight: 1.6 }} className={msg.role === 'ai' ? 'markdown-body' : ''}>
                                    {msg.role === 'ai' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', color: 'white' }}>
                            <Cpu size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-glass)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', borderTopLeftRadius: 0, border: '1px solid var(--border-color)' }}>
                            <div style={{ width: 6, height: 6, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                            <div style={{ width: 6, height: 6, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }}></div>
                            <div style={{ width: 6, height: 6, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        className="input-base"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={sessionId ? "Type your message..." : "Connecting..."}
                        disabled={!sessionId || isLoading}
                        style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-full)' }}
                    />
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!input.trim() || !sessionId || isLoading}
                        style={{ borderRadius: 'var(--radius-full)', width: '56px', height: '56px', padding: 0 }}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { fill: var(--text-tertiary); transform: scale(1); }
          50% { fill: var(--text-primary); transform: scale(1.2); }
        }
      `}</style>
        </div>
    );
}
