import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Sparkles, X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const assistantFallback = [
  "Tripetrip's travel assistant is being rebuilt on the new platform.",
  'Search and vendor tools are available now, and provider-backed recommendations will return after the core migration is stable.',
].join(' ');

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hello! Tripetrip's travel guide is being rebuilt on the new platform." },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((current) => [...current, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    window.setTimeout(() => {
      setIsTyping(false);
      setMessages((current) => [...current, { role: 'bot', text: assistantFallback }]);
    }, 300);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-3">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 text-slate-700 pointer-events-none mb-0.5"
          >
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Ready to plan your trip?
          </motion.div>
        )}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-20 right-0 w-[380px] max-w-[calc(100vw-4rem)] h-[550px] max-h-[calc(100vh-10rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Sparkles className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Travel Guide</h3>
                  <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                    Rebuilding
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div
                  key={`${msg.role}-${i}`}
                  className={cn(
                    'flex flex-col max-w-[85%]',
                    msg.role === 'user' ? 'ml-auto items-end' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-3 rounded-xl text-sm leading-relaxed font-medium shadow-sm',
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200/50',
                    )}
                  >
                    {msg.role === 'bot' ? (
                      <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-2">
                    {msg.role === 'user' ? 'You' : 'Guide'}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%] animate-pulse">
                  <div className="px-4 py-3 bg-slate-100 rounded-xl rounded-tl-none border border-slate-200/50">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/30">
              <div className="relative group">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about riverside cafes..."
                  className="bg-white border-slate-200 h-12 pr-12 rounded-xl focus-visible:ring-indigo-100 shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-center mt-4 text-slate-300 font-bold uppercase tracking-widest">
                Travel guide rebuild in progress
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shadow-xl transition-all border border-indigo-500',
          isOpen ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white',
        )}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </motion.button>
    </div>
  );
}
