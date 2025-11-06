import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage, ChatSession } from '../types';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SendIcon } from './icons/SendIcon';
import { XIcon } from './icons/XIcon';

interface LiveChatWidgetProps {
    currentUser: User;
    session: ChatSession | undefined;
    messages: ChatMessage[];
    onSendMessage: (text: string, user: User) => void;
    isTyping: boolean;
}

const Chatbot: React.FC<LiveChatWidgetProps> = ({ currentUser, session, messages, onSendMessage, isTyping }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;
        
        onSendMessage(inputValue.trim(), currentUser);
        setInputValue('');
    };
    
    const initialMessage: ChatMessage = {
        id: 'initial-msg',
        sessionId: session?.id || '',
        senderId: 'gemini-assistant',
        senderName: 'Support Assistant',
        text: `Hello ${currentUser.name}! Ask me anything, or I can connect you with a support agent.`,
        timestamp: new Date().toISOString(),
    };

    const displayMessages = messages.length > 0 ? messages : [initialMessage];

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

    return (
        <>
            <div className={`fixed bottom-0 right-0 m-4 md:m-8 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-amber-500 text-white rounded-full p-4 shadow-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75"
                    aria-label="Open Live Chat"
                >
                    <ChatBubbleIcon className="h-8 w-8" />
                </button>
            </div>

            <div className={`fixed bottom-0 right-0 z-50 mb-4 md:mb-8 mr-4 md:mr-8 bg-slate-800/80 backdrop-blur-md border border-slate-700 w-[calc(100%-2rem)] md:w-[400px] h-[600px] max-h-[80vh] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white">Live Support</h3>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {displayMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                                msg.senderId === currentUser.id 
                                ? 'bg-amber-500 text-slate-900 rounded-br-none' 
                                : msg.senderId === 'admin'
                                ? 'bg-indigo-600 text-white rounded-bl-none'
                                : 'bg-slate-700 text-slate-200 rounded-bl-none'
                            }`}>
                                <p className="text-sm font-semibold mb-0.5">{msg.senderName}</p>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                {msg.groundingChunks && renderGrounding(msg.groundingChunks)}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
                                <p className="text-sm font-semibold mb-0.5">Support Assistant</p>
                                <div className="flex items-center gap-1.5 py-2">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <footer className="flex-shrink-0 p-4 border-t border-slate-700">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-4 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                        <button type="submit" disabled={inputValue.trim() === ''} className="p-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            <SendIcon className="h-5 w-5" />
                        </button>
                    </form>
                </footer>
            </div>
        </>
    );
};

export default Chatbot;