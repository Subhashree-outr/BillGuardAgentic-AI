import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatPanelProps {
  apiKey?: string;
  onNotify?: (message: string) => void;
}

export function ChatPanel({ apiKey, onNotify }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (window.location.hostname.endsWith('github.io')) {
        setMessages((prev) => [...prev, { role: 'model', text: 'Chat requires the BillGuard Node backend and is not available on static GitHub Pages. Run the app locally or use the backend deployment.' }]);
        return;
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-Gemini-API-Key': apiKey } : {}) },
        body: JSON.stringify({ message: userMessage, sessionId: 'default_session' }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.reply || data.error || 'The chat service returned no response.' }]);
      if (data.provider_error) onNotify?.(data.reply || 'Gemini provider error.');
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-blue-600 hover:bg-blue-500 text-white p-3.5 sm:p-4 rounded-full shadow-lg shadow-blue-600/30 transition-all hover:scale-105 z-40"
        aria-label="Open BillGuard chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-3 right-3 sm:left-auto sm:bottom-24 sm:right-6 w-auto sm:w-[23.75rem] max-w-[calc(100vw-1.5rem)] h-[min(70vh,31.25rem)] sm:h-[31.25rem] bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#18181B] border-b border-[#27272A] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-[#FAFAFA] text-sm">BillGuard Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[#71717A] text-sm mt-10">
                  Ask me about your latest audit, anomalies, or how to save more money!
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`min-w-0 max-w-[80%] break-words rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-[#27272A] text-[#FAFAFA] rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#27272A] text-[#FAFAFA] rounded-xl rounded-tl-sm px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#A1A1AA]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#18181B] border-t border-[#27272A]">
              <div className="flex items-center bg-[#09090B] border border-[#27272A] rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[#FAFAFA] focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 text-blue-400 hover:text-blue-300 disabled:text-[#3F3F46] disabled:bg-transparent transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
