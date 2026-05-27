import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Trash2, Sparkles, ChevronDown, Check, RotateCcw, Square,
} from 'lucide-react';
import { useChart } from '@/store/useChart';
import { useIndicatorStore } from '@/store/useIndicatorStore';
import { useAIStore, type AIMessage } from '@/store/useAIStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import {
  streamGeminiResponse,
  parseGeminiError,
  GEMINI_MODELS,
} from '@/lib/gemini';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Message = AIMessage;

// ─── Preset quick-prompts ───────────────────────────────────────────────────────
const PRESETS = [
  'Analyze trend',
  'Detect reversal',
  'Explain RSI divergence',
  'Find support/resistance',
  'Suggest swing setup',
  'Evaluate momentum',
  'Explain MACD crossover'
];

// ─── Typing dots ────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </span>
  );
}

// ─── Chat Input Component (Memoized) ───────────────────────────────────────────
const ChatInput = React.memo(({
  onSend,
  isStreaming,
  onStop
}: {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSend(input);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
  };

  const handleSendClick = () => {
    if (input.trim() && !isStreaming) {
      onSend(input);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="px-3 pt-2 pb-3 border-t border-border-primary shrink-0">
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask AI Copilot… (Enter to send, Shift+Enter for newline)"
          disabled={isStreaming}
          rows={1}
          className="w-full bg-bg-surface border border-border-primary rounded-xl pl-3 pr-10 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue resize-none min-h-[44px] max-h-[120px] transition-colors disabled:opacity-60"
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            className="absolute right-2 bottom-2 p-1.5 bg-red/80 hover:bg-red text-white rounded-lg transition-colors"
            title="Stop generating"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSendClick}
            disabled={!input.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-blue text-white rounded-lg disabled:opacity-30 hover:bg-blue/90 transition-colors"
            title="Send (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-[10px] text-text-muted mt-1.5 text-center">
        {isStreaming
          ? <span className="text-blue/70 animate-pulse">Generating…</span>
          : 'AI can make mistakes. Verify important trading decisions.'}
      </div>
    </div>
  );
});
ChatInput.displayName = 'ChatInput';

// ─── Chat Messages Component (Memoized) ────────────────────────────────────────
const ChatMessages = React.memo(({
  messages,
  isStreaming,
  pendingRetry,
  onRetry,
  onPresetClick,
  selectedModelName
}: {
  messages: Message[];
  isStreaming: boolean;
  pendingRetry: { prompt: string; aiMsgId: string; } | null;
  onRetry: () => void;
  onPresetClick: (text: string) => void;
  selectedModelName: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0 scroll-smooth">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue/10 border border-blue/20 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-blue/60" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-text-primary mb-1">
              AI Market Intelligence
            </div>
            <div className="text-[12px] text-text-muted max-w-[200px] leading-relaxed mx-auto">
              Powered by {selectedModelName}. Real-time chart analysis & insights.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-[280px]">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => onPresetClick(p)}
                disabled={isStreaming}
                className="text-[11px] bg-bg-surface border border-border-primary rounded-full px-3 py-1.5 hover:bg-bg-hover hover:border-blue/40 transition-all text-text-primary disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map(m => (
        <div
          key={m.id}
          className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} w-full`}
        >
          <div className="text-[10px] text-text-muted mb-1 px-1 flex items-center gap-1">
            {m.role === 'assistant'
              ? <><Bot className="w-3 h-3" /> Copilot</>
              : 'You'}
          </div>

          <div
            className={`text-[13px] rounded-xl px-3 py-2.5 max-w-[95%] shadow-sm ${
              m.role === 'user'
                ? 'bg-blue text-white'
                : m.error
                  ? 'bg-red/8 border border-red/25'
                  : 'bg-bg-surface border border-border-primary'
            }`}
          >
            {m.role === 'user' ? (
              <span className="whitespace-pre-wrap">{m.content}</span>
            ) : m.loading && !m.content ? (
              <TypingDots />
            ) : (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded !bg-bg-void border border-border-primary my-2 text-[11px]"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          {...props}
                          className="bg-bg-void px-1 py-0.5 rounded text-[12px] font-mono border border-border-primary"
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {m.content}
                </ReactMarkdown>

                {isStreaming &&
                  m.id === messages[messages.length - 1]?.id &&
                  !m.error && (
                  <span className="inline-block w-1.5 h-3.5 bg-blue animate-pulse ml-1 align-middle" />
                )}

                {m.error && pendingRetry?.aiMsgId === m.id && (
                  <button
                    onClick={onRetry}
                    disabled={isStreaming}
                    className="mt-2 flex items-center gap-1.5 text-[11px] text-blue hover:underline disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
ChatMessages.displayName = 'ChatMessages';

// ─── Main Panel Component ───────────────────────────────────────────────────────
export function AIAssistantPanel() {
  const { messages, setMessages, clearMessages, model, setModel } = useAIStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [pendingRetry, setPendingRetry] = useState<{
    prompt: string;
    aiMsgId: string;
  } | null>(null);

  const stopRef = useRef(false);

  useEffect(() => {
    if (!showModels) return;
    const close = () => setShowModels(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showModels]);

  const buildFullPrompt = useCallback((userQuery: string): string => {
    const chartState = useChart.getState();
    const indicators = useIndicatorStore.getState().indicators;

    const activeInds = indicators
      .filter(i => i.enabled)
      .map(i => i.name)
      .join(', ') || 'None';

    const cd = chartState.cursorData;
    const fmt = (v: number | undefined) => (v != null ? v.toFixed(2) : 'N/A');

    const context = `You are an elite AI trading copilot integrated directly into a professional trading terminal.

LIVE CHART CONTEXT:
- Symbol: ${chartState.symbol}
- Timeframe: ${chartState.activeTimeframe}
- Active Indicators: ${activeInds}
- Current Price (Close): ${fmt(cd?.close)}
- Open/High/Low: ${fmt(cd?.open)} / ${fmt(cd?.high)} / ${fmt(cd?.low)}
- Volume: ${cd?.volume != null ? Math.round(cd.volume).toLocaleString() : 'N/A'}
- VWAP: ${fmt(cd?.vwap)}
- EMA(9/21/50): ${fmt(cd?.ema9)} / ${fmt(cd?.ema21)} / ${fmt(cd?.ema50)}
- BB Upper/Lower: ${fmt(cd?.bbUpper)} / ${fmt(cd?.bbLower)}

CRITICAL DIRECTIVES:
1. NO DISCLAIMERS: Under no circumstances should you include boilerplate financial disclaimers (e.g. "This is not financial advice"). The user is a professional trader.
2. NO GENERIC INTROS/OUTROS: Start directly with the analysis. Do not say "Based on the chart context..." or "Let me analyze this for you."
3. BE HIGHLY SPECIFIC: Reference EXACT prices, EXACT indicator values, and EXACT patterns from the LIVE CHART CONTEXT.
4. BE CONCISE AND DENSE: Deliver high-signal, low-noise insights. Use punchy bullet points where appropriate.
5. CONTEXT AWARENESS: Consider the previous messages. If the user asks a follow-up, answer it directly without repeating the whole analysis.
`;

    const history = messages
      .filter(m => !m.error && !m.loading && m.content.trim())
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const conversationBlock = history
      ? `PREVIOUS CONVERSATION:\n${history}\n\n`
      : '';

    return `${context}${conversationBlock}User: ${userQuery}\n\nAssistant:`;
  }, [messages]);

  const runStream = useCallback(async (userQuery: string, aiMsgId: string) => {
    stopRef.current = false;
    setIsStreaming(true);
    setPendingRetry(null);

    const fullPrompt = buildFullPrompt(userQuery);

    try {
      await streamGeminiResponse(
        fullPrompt,
        (accumulated) => {
          if (stopRef.current) return;
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId
                ? { ...m, content: accumulated, loading: false, error: false }
                : m
            )
          );
        },
        model
      );
    } catch (err: unknown) {
      const friendlyMsg = parseGeminiError(err);
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes('429') || err.message.includes('quota'));

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? {
                ...m,
                loading: false,
                error: true,
                content: isRateLimit
                  ? `⏳ **Rate limit reached.**\n\nThis API key's free tier is exhausted. Retrying in 30 seconds…`
                  : `❌ **Error:** ${friendlyMsg}\n\nClick **Retry** to try again.`,
              }
            : m
        )
      );
      setPendingRetry({ prompt: userQuery, aiMsgId });

      if (isRateLimit) {
        setTimeout(() => {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId
                ? { ...m, content: '', error: false, loading: true }
                : m
            )
          );
          runStream(userQuery, aiMsgId);
        }, 30_000);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [buildFullPrompt, model]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text || isStreaming) return;

    setPendingRetry(null);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now() + 1}`;

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: text, timestamp: Date.now() },
      { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now(), loading: true },
    ]);

    await runStream(text, aiMsgId);
  }, [isStreaming, runStream]);

  const handleRetry = useCallback(() => {
    if (!pendingRetry) return;
    const { prompt, aiMsgId } = pendingRetry;
    setMessages(prev =>
      prev.map(m =>
        m.id === aiMsgId ? { ...m, content: '', error: false, loading: true } : m
      )
    );
    runStream(prompt, aiMsgId);
  }, [pendingRetry, runStream]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setIsStreaming(false);
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;
      return prev.map(m =>
        m.id === last.id
          ? { ...m, loading: false, content: m.content + (m.content ? '\n\n*[Stopped]*' : '*(Stopped)*') }
          : m
      );
    });
  }, []);

  const selectedModel = GEMINI_MODELS.find(m => m.id === model) ?? GEMINI_MODELS[0];

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-primary shrink-0 relative z-20">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue" />
          <h2 className="text-[14px] font-bold tracking-tight">AI Copilot</h2>
          <span className="text-[10px] bg-blue/15 text-blue px-1.5 py-0.5 rounded font-semibold tracking-wide">
            GEMINI
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={e => { e.stopPropagation(); setShowModels(v => !v); }}
            className="flex items-center gap-1 text-[11px] bg-bg-surface px-2 py-1 rounded border border-border-primary hover:border-blue/40 transition-colors"
          >
            <span className="max-w-[110px] truncate">{selectedModel.name}</span>
            <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
          </button>

          <AnimatePresence>
            {showModels && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.1 }}
                className="absolute top-full right-7 mt-1 w-48 bg-bg-elevated border border-border-primary rounded-lg shadow-2xl overflow-hidden z-50"
                onClick={e => e.stopPropagation()}
              >
                {GEMINI_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setShowModels(false); }}
                    className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-bg-hover flex items-center justify-between gap-2 transition-colors"
                  >
                    <span>{m.name}</span>
                    {model === m.id && <Check className="w-3.5 h-3.5 text-blue shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => { clearMessages(); setPendingRetry(null); }}
            className="p-1 hover:bg-red/20 rounded text-text-muted hover:text-red transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ChatMessages 
        messages={messages} 
        isStreaming={isStreaming} 
        pendingRetry={pendingRetry} 
        onRetry={handleRetry} 
        onPresetClick={sendMessage}
        selectedModelName={selectedModel.name}
      />

      <ChatInput 
        onSend={sendMessage} 
        isStreaming={isStreaming} 
        onStop={handleStop} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-body > *:first-child { margin-top: 0 !important; }
        .markdown-body > *:last-child { margin-bottom: 0 !important; }
        .markdown-body p { margin-bottom: 0.55em; line-height: 1.65; }
        .markdown-body ul, .markdown-body ol { padding-left: 1.4em; margin-bottom: 0.55em; }
        .markdown-body ul { list-style: disc; }
        .markdown-body ol { list-style: decimal; }
        .markdown-body li { margin-bottom: 0.25em; line-height: 1.5; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 700; margin: 0.75em 0 0.35em; }
        .markdown-body h1 { font-size: 1.15em; }
        .markdown-body h2 { font-size: 1.05em; }
        .markdown-body h3 { font-size: 0.97em; }
        .markdown-body strong { font-weight: 700; }
        .markdown-body em { font-style: italic; opacity: 0.85; }
        .markdown-body a { color: #2962FF; text-decoration: underline; }
        .markdown-body blockquote { border-left: 3px solid #2962FF; padding-left: 0.75em; margin: 0.5em 0; opacity: 0.8; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 0.55em; font-size: 12px; }
        .markdown-body th { background: rgba(41,98,255,0.1); font-weight: 700; }
        .markdown-body th, .markdown-body td { border: 1px solid rgba(255,255,255,0.1); padding: 4px 8px; }
        .markdown-body hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0.75em 0; }
      ` }} />
    </div>
  );
}
