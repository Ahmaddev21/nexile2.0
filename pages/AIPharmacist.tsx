import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Trash2, Download, BrainCircuit, Sparkles, Bot, User, Activity, Calculator, Pill, Leaf, Star, ChevronRight, Search } from 'lucide-react';
import { generatePharmacistResponse } from '../services/aiService';
import { PharmacistMessage } from '../types';

// Simple Markdown Renderer Component to avoid external dependencies
const SimpleMarkdown = ({ content }: { content: string }) => {
    return (
        <div className="space-y-2">
            {content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;

                if (trimmed.startsWith('# ')) {
                    return <h1 key={i} className="text-xl font-black mb-2 mt-1">{trimmed.substring(2)}</h1>;
                }
                if (trimmed.startsWith('## ')) {
                    return <h2 key={i} className="text-lg font-bold mb-2 mt-3 opacity-90">{trimmed.substring(3)}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                    return <h3 key={i} className="text-base font-bold mb-1 mt-2 opacity-90">{trimmed.substring(4)}</h3>;
                }
                if (trimmed.startsWith('- ')) {
                    const text = trimmed.substring(2);
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="opacity-70 mt-1.5">•</span>
                            <p className="flex-1 leading-relaxed">
                                {text.split('**').map((part, idx) =>
                                    idx % 2 === 1 ? <strong key={idx} className="font-bold opacity-100">{part}</strong> : part
                                )}
                            </p>
                        </div>
                    );
                }

                // Paragraph with bold support
                return (
                    <p key={i} className="leading-relaxed opacity-90">
                        {line.split('**').map((part, idx) =>
                            idx % 2 === 1 ? <strong key={idx} className="font-bold opacity-100">{part}</strong> : part
                        )}
                    </p>
                );
            })}
        </div>
    );
};

export default function AIPharmacist() {
    const [messages, setMessages] = useState<PharmacistMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLive, setIsLive] = useState(false);

    // Load conversation from session storage
    useEffect(() => {
        const saved = sessionStorage.getItem('nexile_pharmacist_chat');
        const seedQuery = sessionStorage.getItem('nexile_pharmacist_seed_query');

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                    // Migration for legacy sources (string[]) to new format ({title, url}[])
                    sources: Array.isArray(m.sources)
                        ? m.sources.map((s: any) => typeof s === 'string' ? { title: s, url: '#' } : s)
                        : []
                })));
            } catch (e) {
                console.error('Failed to load chat history', e);
            }
        } else if (!seedQuery) {
            // Welcome message only if no history AND no seed query
            const welcomeMessage: PharmacistMessage = {
                id: 'welcome-' + Date.now(),
                role: 'assistant',
                content: `# 👋 Welcome to Nexile AI

I'm your advanced clinical intelligence assistant.

## How I Can Help:
- 💊 **Real-time Drug Info**: Ask about any medication, interaction, or side effect.
- 🧮 **Calculations**: Precise dosage calculations for any patient profile.
- 🏥 **Clinical Support**: Evidence-based guidance for complex cases.
- 📦 **Inventory Check**: Instantly check stock levels in your pharmacy.

Simply type your question naturally. I'm connected to the latest medical data and your inventory.`,
                timestamp: new Date(),
                module: 'general',
                sources: []
            };
            setMessages([welcomeMessage]);
        }

        if (seedQuery) {
            setInputValue(seedQuery);
            sessionStorage.removeItem('nexile_pharmacist_seed_query');
        }

        // Check for environment key only
        const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GITHUB_TOKEN : undefined;
        setIsLive(Boolean(envKey));
    }, []);

    // Save conversation to session storage
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('nexile_pharmacist_chat', JSON.stringify(messages));
        }
    }, [messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: PharmacistMessage = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
            module: 'general'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await generatePharmacistResponse(inputValue.trim(), messages);

            const aiMessage: PharmacistMessage = {
                id: 'ai-' + Date.now(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                module: response.module as 'interaction' | 'dosage' | 'advice' | 'non-pharma' | 'recommendation' | 'stock' | 'general',
                sources: response.sources
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsLive(response.usedLive);
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage: PharmacistMessage = {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: '⚠️ I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
                timestamp: new Date(),
                module: 'general'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyMessage = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleClearChat = () => {
        if (window.confirm('Are you sure you want to clear the entire conversation?')) {
            sessionStorage.removeItem('nexile_pharmacist_chat');
            setMessages([]);
            window.location.reload();
        }
    };

    const handleExportChat = () => {
        const chatText = messages.map(m => {
            const role = m.role === 'user' ? 'PHARMACIST' : 'NEXILE AI';
            const time = m.timestamp.toLocaleString();
            return `[${time}] ${role}:\n${m.content}\n\n`;
        }).join('---\n\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexile-ai-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const quickActions = [
        { icon: Activity, label: 'Check Drug Interaction', query: 'Can I take Ibuprofen with Aspirin?' },
        { icon: Calculator, label: 'Calculate Dosage', query: 'What is the recommended dosage of Amoxicillin for a 30kg child?' },
        { icon: Pill, label: 'Drug Information', query: 'What are the side effects of Metformin?' },
        { icon: Leaf, label: 'Non-Pharma Advice', query: 'What lifestyle changes help manage hypertension?' }
    ];

    const getModuleIcon = (module?: string) => {
        switch (module) {
            case 'interaction': return <Activity size={16} className="text-rose-500" />;
            case 'dosage': return <Calculator size={16} className="text-sky-500" />;
            case 'advice': return <Pill size={16} className="text-brand-500" />;
            case 'non-pharma': return <Leaf size={16} className="text-emerald-500" />;
            case 'recommendation': return <Star size={16} className="text-amber-500" />;
            default: return <Sparkles size={16} className="text-violet-500" />;
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <BrainCircuit className="text-white" size={20} />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Nexile AI
                            <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-[10px] font-extrabold tracking-wider uppercase">BETA</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {isLive ? 'Connected to GPT-4o (GitHub Models)' : 'Offline Mode'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleExportChat}
                        disabled={messages.length === 0}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                        title="Export Chat"
                    >
                        <Download size={18} />
                    </button>
                    <button
                        onClick={handleClearChat}
                        disabled={messages.length === 0}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-rose-500 transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-md flex-shrink-0 mt-1">
                                <Bot size={14} className="text-white" />
                            </div>
                        )}

                        <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`
                                relative px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed
                                ${message.role === 'user'
                                    ? 'bg-brand-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'}
                            `}>
                                {message.role === 'assistant' && message.module && message.module === 'stock' && (
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                        {getModuleIcon(message.module)}
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Inventory Check
                                        </span>
                                    </div>
                                )}

                                <SimpleMarkdown content={message.content} />

                                {/* Sources Section */}
                                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <Search size={10} /> Trusted Sources
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {message.sources.map((source, idx) => (
                                                <a
                                                    key={idx}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-900/20 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 transition-all group"
                                                >
                                                    <span>{source.title}</span>
                                                    <ChevronRight size={10} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions & Timestamp */}
                            <div className="flex items-center gap-2 mt-1 px-1">
                                <span className="text-[10px] font-medium text-slate-400">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {message.role === 'assistant' && (
                                    <button
                                        onClick={() => handleCopyMessage(message.content, message.id)}
                                        className="text-slate-400 hover:text-brand-500 transition-colors"
                                        title="Copy response"
                                    >
                                        {copiedId === message.id ? <span className="text-[10px] font-bold text-emerald-500">Copied!</span> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={14} className="text-slate-500 dark:text-slate-400" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 justify-start animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask Nexile AI anything..."
                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-inner text-sm font-medium"
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {/* Optional: Add voice input or attachment icons here later */}
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-3.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-2xl shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Nexile AI provides clinical support but does not replace professional medical judgment.
                    </p>
                </div>
            </div>
        </div>
    );
}
