

import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, ChatMessage, User } from '../types';
import { SendIcon } from './icons/SendIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

interface LiveSupportProps {
    sessions: ChatSession[];
    messages: ChatMessage[];
    users: User[];
    onSendMessage: (text: string, sessionId: string, senderId: string) => void;
    onSessionSelect: (sessionId: string) => void;
}

const renderGrounding = (chunks: any[]) => {
    const sources = chunks.map(chunk => chunk.maps).filter(Boolean);
    if (sources.length === 0) return null;

    return (
        <div className="mt-2 text-xs">
            <p className="font-semibold text-slate-400">Sources:</p>
            <ul className="list-disc list-inside">
                {sources.map((source, index) => (
                    <li key={index}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                            {source.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const LiveSupport: React.FC<LiveSupportProps> = ({ sessions, messages, users, onSendMessage, onSessionSelect }) => {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showChatViewOnMobile, setShowChatViewOnMobile] = useState(false);

    const sortedSessions = [...sessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    useEffect(() => {
        if (!selectedSessionId && sortedSessions.length > 0) {
            const firstUnread = sortedSessions.find(s => !s.isReadByAdmin);
            const firstSessionId = firstUnread ? firstUnread.id : sortedSessions[0].id;
            setSelectedSessionId(firstSessionId);
            onSessionSelect(firstSessionId);
        }
    }, [sortedSessions, selectedSessionId, onSessionSelect]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages, selectedSessionId]);

    const handleSelectSession = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        onSessionSelect(sessionId);
        setShowChatViewOnMobile(true);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() === '' || !selectedSessionId) return;
        onSendMessage(inputValue.trim(), selectedSessionId, 'admin');
        setInputValue('');
    };

    const selectedSessionMessages = messages.filter(m => m.sessionId === selectedSessionId);
    const selectedSessionUser = users.find(u => u.id === sessions.find(s => s.id === selectedSessionId)?.userId);

    return (
        <div className="flex h-full max-h-[calc(100vh-160px)] bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
            {/* Session List */}
            <aside className={`w-full md:w-1/3 border-r border-slate-700/50 flex-col ${showChatViewOnMobile ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Inbox ({sortedSessions.length})</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sortedSessions.length > 0 ? sortedSessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={`w-full text-left p-4 border-l-4 transition-colors ${selectedSessionId === session.id ? 'bg-slate-700/50 border-amber-400' : 'bg-transparent border-transparent hover:bg-slate-700/20'}`}
                        >
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-white">{session.userName}</p>
                                <p className="text-xs text-slate-400">{formatTimeAgo(session.timestamp)}</p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-slate-400 truncate pr-4">{session.lastMessage}</p>
                                {!session.isReadByAdmin && <div className="w-2.5 h-2.5 bg-amber-400 rounded-full flex-shrink-0" title="New message"></div>}
                            </div>
                        </button>
                    )) : (
                         <p className="text-slate-400 text-center p-8">No active conversations.</p>
                    )}
                </div>
            </aside>
            
            {/* Chat View */}
            <main className={`w-full md:w-2/3 flex-col ${showChatViewOnMobile ? 'flex' : 'hidden md:flex'}`}>
                {selectedSessionId && selectedSessionUser ? (
                    <>
                        <header className="p-4 border-b border-slate-700/50 flex-shrink-0 flex items-center gap-4">
                            <button onClick={() => setShowChatViewOnMobile(false)} className="md:hidden p-1 text-slate-400 hover:text-white">
                                <ChevronLeftIcon className="h-6 w-6" />
                            </button>
                            <h3 className="font-bold text-white text-lg">Chat with {selectedSessionUser.name}</h3>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedSessionMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md px-4 py-2 rounded-2xl ${
                                        msg.senderId === 'admin' 
                                            ? 'bg-amber-500 text-slate-900 rounded-br-none' 
                                            : msg.senderId === 'gemini-assistant'
                                                ? 'bg-slate-600 text-slate-200 rounded-bl-none'
                                                : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                    }`}>
                                        <p className="text-sm font-semibold mb-0.5">{msg.senderName}</p>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        {msg.groundingChunks && renderGrounding(msg.groundingChunks)}
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                        <footer className="p-4 border-t border-slate-700/50 flex-shrink-0 bg-slate-800">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={`Reply to ${selectedSessionUser.name}...`}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-4 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                                <button type="submit" disabled={inputValue.trim() === ''} className="p-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                    <SendIcon className="h-5 w-5" />
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400">Select a conversation to start chatting.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LiveSupport;