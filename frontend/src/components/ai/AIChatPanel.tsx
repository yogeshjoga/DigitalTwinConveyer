import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Send, Sparkles, User,
  ChevronDown, Loader2, Zap, Thermometer,
  Activity, TrendingDown, Shield, Clock,
} from 'lucide-react';
import { useAIChat } from '@/api/hooks';
import { useMLPrediction, useLiveSensors } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string;
}

// Quick-ask chips — clickable metric shortcuts
const QUICK_ASKS = [
  { label: 'Tear risk?',        icon: Zap,          q: 'What is the current tear probability and what should I do?' },
  { label: 'Temperature status',icon: Thermometer,  q: 'Explain the current temperature readings and overheat risk.' },
  { label: 'Maintenance when?', icon: Clock,        q: 'When should I schedule the next maintenance?' },
  { label: 'Vibration analysis',icon: Activity,     q: 'Analyze the current vibration levels and misalignment risk.' },
  { label: 'Remaining life',    icon: TrendingDown, q: 'How much remaining life does the belt have?' },
  { label: 'Overall health',    icon: Shield,       q: 'Give me a full belt health summary and top recommendations.' },
];

interface AIChatPanelProps {
  /** Pre-selected metric context injected from clicking a metric card */
  injectedContext?: { label: string; value: string; question: string } | null;
  onClearInjected?: () => void;
}

export default function AIChatPanel({ injectedContext, onClearInjected }: AIChatPanelProps) {
  // ── All hooks declared first ───────────────────────────────────────────────
  const { mutate: sendChat, isPending } = useAIChat();
  const { data: pred }    = useMLPrediction();
  const { data: sensors } = useLiveSensors();
  const selectedBelt      = useBeltStore((s) => s.selectedBeltEntry);

  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Reset chat with belt-specific greeting when selected belt changes
  useEffect(() => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content:
        `Hi! I'm **BeltGuard AI** monitoring **${selectedBelt.name}** (\`${selectedBelt.id}\`).\n\n` +
        `This belt handles **${selectedBelt.material}** in the **${selectedBelt.area}** area.\n\n` +
        `Ask me about its health, risks, maintenance schedule, or click a quick-ask below.`,
      timestamp: new Date(),
      source: 'rule-based',
    }]);
  }, [selectedBelt.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Auto-open + inject question when a metric is clicked
  useEffect(() => {
    if (injectedContext) {
      setOpen(true);
      setTimeout(() => {
        sendMessage(injectedContext.question);
        onClearInjected?.();
      }, 300);
    }
  }, [injectedContext]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const buildContext = () => ({
    belt: {
      id:          selectedBelt.id,
      name:        selectedBelt.name,
      area:        selectedBelt.area,
      material:    selectedBelt.material,
      description: selectedBelt.description,
    },
    prediction: pred
      ? {
          remaining_life_hours:     pred.remainingLifeHours,
          tear_probability:         pred.tearProbability,
          burst_risk:               pred.burstRisk,
          overheat_risk:            pred.overheatRisk,
          misalignment_risk:        pred.misalignmentRisk,
          maintenance_window_hours: pred.maintenanceWindowHours,
          confidence_score:         pred.confidenceScore,
        }
      : {},
    sensors: sensors
      ? {
          temperature: sensors.temperature,
          vibration:   sensors.vibration,
          load_cell:   sensors.loadCell,
          udl:         sensors.udl,
          belt_speed:  sensors.beltSpeed,
        }
      : {},
  });

  const sendMessage = (text: string) => {
    if (!text.trim() || isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    sendChat(
      { message: text.trim(), history, context: buildContext() },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + '_ai',
              role: 'assistant',
              content: data.reply,
              timestamp: new Date(),
              source: data.source,
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + '_err',
              role: 'assistant',
              content: 'Sorry, I could not reach the AI service. Please check the ML service is running.',
              timestamp: new Date(),
            },
          ]);
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #27a372, #1a835c)',
          boxShadow: '0 8px 32px rgba(39,163,114,0.4)',
        }}
        aria-label="Open AI Chat"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} className="text-white" /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot size={22} className="text-white" /></motion.div>
          }
        </AnimatePresence>
        {/* Unread dot */}
        {!open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{  opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{
              height: 580,
              backgroundColor: 'var(--color-panel)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #27a37222, #1a835c11)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary">BeltGuard AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted truncate">
                    {selectedBelt.name} · {selectedBelt.id}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#27a37222', color: '#27a372', border: '1px solid #27a37244' }}>
                  <Sparkles size={9} className="inline mr-1" />
                  AI
                </span>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-primary transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === 'user'
                      ? 'bg-brand-500'
                      : 'bg-slate-700 dark:bg-slate-600'
                  }`}>
                    {msg.role === 'user'
                      ? <User size={13} className="text-white" />
                      : <Bot  size={13} className="text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm text-white'
                      : 'rounded-tl-sm'
                  }`}
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #27a372, #1a835c)'
                        : 'var(--color-surface)',
                      border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                      color: msg.role === 'assistant' ? 'var(--text-primary)' : undefined,
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert
                        prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
                        prose-headings:text-primary prose-strong:text-primary
                        prose-code:text-brand-500 prose-code:bg-black/10 prose-code:px-1 prose-code:rounded
                        prose-table:text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <span className="text-[10px] opacity-50">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.source && msg.role === 'assistant' && (
                        <span className="text-[10px] opacity-40">
                          {msg.source === 'openai' ? '✦ GPT-4o' : '⚙ rule-based'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick-ask chips */}
            <div className="px-3 py-2 border-t flex gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-hide"
              style={{ borderColor: 'var(--color-border)' }}>
              {QUICK_ASKS.map(({ label, icon: Icon, q }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(q)}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-3 border-t flex-shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about belt health, risks, maintenance…"
                disabled={isPending}
                className="flex-1 text-sm px-3 py-2 rounded-xl outline-none transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isPending}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #27a372, #1a835c)' }}
              >
                {isPending
                  ? <Loader2 size={15} className="text-white animate-spin" />
                  : <Send size={15} className="text-white" />
                }
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
