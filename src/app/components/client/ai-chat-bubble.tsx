'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const WELCOME_MESSAGE: Message = {
    role: 'model',
    text: 'Привіт! 🦄✨ Я AI-помічник магазину mlpcutiefamily store. Можу відповісти на питання про наші товари, доставку, оплату та замовлення. Чим можу допомогти?',
};

const QUICK_QUESTIONS = [
    '📦 Як зробити замовлення?',
    '🚚 Варіанти доставки?',
    '💳 Як оплатити?',
    '🎁 Що таке конструктор боксів?',
];

export default function AiChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 100);
            setHasNewMessage(false);
        }
    }, [isOpen, scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMessage: Message = { role: 'user', text: trimmed };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Send all messages (history) except the first welcome message
            const history = newMessages.slice(1); // skip welcome
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'model',
                        text: 'Вибачте, зараз сталася помилка. Спробуйте трохи пізніше або напишіть нам в Telegram [@mlpcutiefamily](https://t.me/mlpcutiefamily) 🙏',
                    },
                ]);
            } else {
                setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
                if (!isOpen) setHasNewMessage(true);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'model',
                    text: `Вибачте, не вдалося зв'язатися з AI. Напишіть нам в Telegram [@mlpcutiefamily](https://t.me/mlpcutiefamily) 🙏`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [messages, loading, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleReset = () => {
        setMessages([WELCOME_MESSAGE]);
    };

    // Render text with basic markdown (bold, links)
    const renderText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\)|\n)/g);
        return parts.map((part, i) => {
            if (part === '\n') return <br key={i} />;
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                return (
                    <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
                        className="text-purple-600 underline hover:text-purple-800">
                        {linkMatch[1]}
                    </a>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <>
            {/* Bubble Button */}
            <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">

                <button
                    onClick={() => setIsOpen((v) => !v)}
                    aria-label="Відкрити AI-чат"
                    className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                    }}
                >
                    {/* Notification dot */}
                    {hasNewMessage && !isOpen && (
                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}

                    <span className="text-2xl transition-transform duration-300" style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                        {isOpen ? '✕' : <img src="/png/IMG_20260210_181913_338.PNG" alt="Menu" className="w-12 h-12" />}
                    </span>
                </button>
            </div>

            {/* Chat Window */}
            <div
                className={`fixed bottom-44 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                style={{ height: '480px', transformOrigin: 'bottom right' }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}
                >
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                        <img src="/png/IMG_20260210_181913_338.PNG"></img>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight">AI-помічник</p>
                        <p className="text-purple-100 text-xs truncate">mlpcutiefamily store <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" /></p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Reset button */}
                        <button
                            onClick={handleReset}
                            title="Почати нову розмову"
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs transition-colors"
                        >
                            ↺
                        </button>
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            {msg.role === 'model' && (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                                    <img src="/png/IMG_20260210_181913_338.PNG"></img>
                                </div>
                            )}

                            {/* Bubble */}
                            <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-sm'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                    }`}
                            >
                                {renderText(msg.text)}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex gap-2 flex-row">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                                🦄
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1 items-center">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick questions (shown only on first message) */}
                {messages.length === 1 && (
                    <div className="px-4 pb-2 flex flex-col gap-1.5 flex-shrink-0">
                        {QUICK_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(q)}
                                className="text-left text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl px-3 py-2 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-gray-100 px-3 py-2 flex gap-2 items-end flex-shrink-0">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Напишіть питання..."
                        rows={1}
                        disabled={loading}
                        className="flex-1 text-sm text-gray-800 resize-none outline-none border border-gray-200 rounded-xl px-3 py-2 focus:border-purple-400 transition-colors disabled:opacity-50 max-h-24 overflow-y-auto"
                        style={{ scrollbarWidth: 'none' }}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}
                        aria-label="Надіслати"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m-7 7l7-7 7 7" />
                        </svg>
                    </button>
                </div>
            </div>

        </>
    );
}
