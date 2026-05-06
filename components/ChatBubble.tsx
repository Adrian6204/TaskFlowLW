import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PendingAction {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  streaming?: boolean;
  retryPayload?: { user_message?: string; confirm?: { tool_call_id: string; approved: boolean } };
}

interface ChatBubbleProps {
  onDataChanged?: () => void;
}

const FUNCTIONS_URL =
  (process.env.SUPABASE_URL || 'https://placeholder.supabase.co') + '/functions/v1/ai-agent';

const STORAGE_KEY = 'taskflow_ai_conversation_id';

// ─── Tiny markdown renderer ───────────────────────────────────────────────
// Supports: **bold**, *italic*, `code`, ```code blocks```, - bullets, 1. ordered, [text](url), \n.
const renderInline = (text: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    // **bold**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > -1) {
        out.push(<strong key={key++}>{renderInline(text.slice(i + 2, end))}</strong>);
        i = end + 2;
        continue;
      }
    }
    // *italic*
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end > -1) {
        out.push(<em key={key++}>{renderInline(text.slice(i + 1, end))}</em>);
        i = end + 1;
        continue;
      }
    }
    // `code`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > -1) {
        out.push(
          <code key={key++} className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[0.85em] font-mono">
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }
    // [text](url)
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      if (closeBracket > -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen > -1) {
          const label = text.slice(i + 1, closeBracket);
          const url = text.slice(closeBracket + 2, closeParen);
          out.push(
            <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline">
              {label}
            </a>,
          );
          i = closeParen + 1;
          continue;
        }
      }
    }
    // plain char — accumulate until next special. Search from i+1 so we
    // always advance at least one character (otherwise unmatched `[` / `*` / `\`` loops forever).
    let nextSpecial = text.length;
    for (const ch of ['*', '`', '[']) {
      const idx = text.indexOf(ch, i + 1);
      if (idx > -1 && idx < nextSpecial) nextSpecial = idx;
    }
    out.push(text.slice(i, nextSpecial));
    i = nextSpecial;
  }
  return out;
};

const Markdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    // ``` code block
    if (line.trim().startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={key++} className="my-1 p-2 rounded bg-slate-200 dark:bg-slate-800 overflow-x-auto text-xs font-mono">
          {buf.join('\n')}
        </pre>,
      );
      continue;
    }
    // - bullets
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
          {items.map((it, n) => (
            <li key={n}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    // 1. ordered
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal list-inside space-y-0.5 my-1">
          {items.map((it, n) => (
            <li key={n}>{renderInline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    // blank line
    if (line.trim() === '') {
      blocks.push(<div key={key++} className="h-2" />);
      i++;
      continue;
    }
    // paragraph
    blocks.push(
      <p key={key++} className="my-0.5">
        {renderInline(line)}
      </p>,
    );
    i++;
  }
  return <>{blocks}</>;
};

// ─── Confirmation card ───────────────────────────────────────────────────
const formatDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  try {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex gap-2 text-sm">
    <span className="w-20 shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-slate-900 dark:text-white font-medium break-words">{children}</span>
  </div>
);

const PriorityChip: React.FC<{ value: string }> = ({ value }) => {
  const colors: Record<string, string> = {
    Urgent: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    Low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[value] || colors.Medium}`}>
      {value}
    </span>
  );
};

const PendingCard: React.FC<{ action: PendingAction; onConfirm: (ok: boolean) => void; busy: boolean }> = ({ action, onConfirm, busy }) => {
  const a = action.arguments;
  let icon = '⚡';
  let title = action.name;
  let body: React.ReactNode = null;

  if (action.name === 'create_task') {
    icon = '✨';
    title = 'Create task';
    body = (
      <div className="space-y-1.5">
        <Field label="Title">{a.title}</Field>
        {a.description && <Field label="Details">{a.description}</Field>}
        <Field label="Workspace">{a._space_name || a.space_id}</Field>
        <Field label="Assignee">
          {a._assignee_name || 'You'}
          {a._assignee_default && <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">(default)</span>}
        </Field>
        {a.due_date && <Field label="Due">{formatDate(a.due_date)}</Field>}
        <Field label="Priority"><PriorityChip value={a.priority || 'Medium'} /></Field>
        <Field label="Status">{a.status || 'To Do'}</Field>
        {Array.isArray(a.tags) && a.tags.length > 0 && <Field label="Tags">{a.tags.join(', ')}</Field>}
      </div>
    );
  } else if (action.name === 'update_task') {
    icon = '✏️';
    title = `Update task #${a.id}`;
    const changedKeys = Object.keys(a).filter((k) => k !== 'id' && !k.startsWith('_'));
    body = (
      <div className="space-y-1.5">
        {a._current_title && <Field label="Task">{a._current_title}</Field>}
        {changedKeys.length === 0 && <div className="text-sm text-slate-500">No changes specified.</div>}
        {changedKeys.map((k) => {
          const v = a[k];
          let display: React.ReactNode = String(v);
          if (k === 'due_date') display = formatDate(v);
          if (k === 'priority') display = <PriorityChip value={v} />;
          if (k === 'assignee_id') display = a._assignee_name || v;
          if (k === 'tags' && Array.isArray(v)) display = v.join(', ') || '(none)';
          const labelMap: Record<string, string> = {
            title: 'Title',
            description: 'Details',
            status: 'Status',
            priority: 'Priority',
            due_date: 'Due',
            assignee_id: 'Assignee',
            tags: 'Tags',
          };
          return (
            <Field key={k} label={`→ ${labelMap[k] || k}`}>
              {display}
            </Field>
          );
        })}
      </div>
    );
  } else if (action.name === 'delete_task') {
    icon = '🗑️';
    title = `Delete task #${a.id}`;
    body = (
      <div className="space-y-1.5">
        {a._current_title && <Field label="Task">{a._current_title}</Field>}
        {a._space_name && <Field label="Workspace">{a._space_name}</Field>}
        <div className="text-xs text-red-600 dark:text-red-400 mt-2">This cannot be undone.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
      </div>
      {body}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onConfirm(true)}
          disabled={busy}
          className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
        >
          Confirm
        </button>
        <button
          onClick={() => onConfirm(false)}
          disabled={busy}
          className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── ChatBubble ──────────────────────────────────────────────────────────
const ChatBubble: React.FC<ChatBubbleProps> = ({ onDataChanged }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [stepLabel, setStepLabel] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const [pending, setPending] = useState<PendingAction[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      if (conversationId) localStorage.setItem(STORAGE_KEY, conversationId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // private mode / quota exceeded — ignore
    }
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending, busy, stepLabel]);

  // auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  const callAgent = async (
    payload: { user_message?: string; confirm?: { tool_call_id: string; approved: boolean } },
  ) => {
    setBusy(true);
    setStepLabel('Thinking…');
    let assistantId: string | null = null;
    let confirmedApproval: boolean | null = null;
    if (payload.confirm) confirmedApproval = payload.confirm.approved;

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: 'Please sign in to use the assistant.' }]);
        return;
      }
      const now = new Date();
      const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const res = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversation_id: conversationId, client_date: clientDate, client_tz: clientTz, ...payload }),
      });
      if (!res.ok || !res.body) {
        let parsed: any = null;
        try { parsed = await res.json(); } catch {}
        const friendly = parsed?.message
          ?? (res.status === 429 ? "You're sending messages quickly — please wait a minute." : `Error ${res.status}`);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'error', content: friendly, retryPayload: payload }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const evt of events) {
          if (!evt.trim()) continue;
          let event = 'message';
          let dataLine = '';
          for (const line of evt.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          let data: any = {};
          try { data = JSON.parse(dataLine); } catch { continue; }

          if (event === 'conversation') {
            if (data.conversation_id) setConversationId(data.conversation_id);
          } else if (event === 'step') {
            setStepLabel(data.label);
          } else if (event === 'text') {
            setStepLabel(null);
            const delta = typeof data.delta === 'string' ? data.delta : '';
            if (!delta) continue;
            if (!assistantId) {
              assistantId = crypto.randomUUID();
              const id = assistantId;
              setMessages((m) => [...m, { id, role: 'assistant', content: delta, streaming: true }]);
            } else {
              const id = assistantId;
              setMessages((m) => m.map((msg) => msg.id === id ? { ...msg, content: msg.content + delta } : msg));
            }
          } else if (event === 'pending') {
            setPending(Array.isArray(data.actions) ? data.actions : []);
            if (data.assistant_text && !assistantId) {
              setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: data.assistant_text }]);
            }
          } else if (event === 'done') {
            if (assistantId) {
              const id = assistantId;
              setMessages((m) => m.map((msg) => msg.id === id ? { ...msg, streaming: false } : msg));
            }
            if (confirmedApproval === true) onDataChanged?.();
          } else if (event === 'error') {
            const msg = data.code === 'rate_limit'
              ? (data.message || 'AI service is temporarily over capacity. Try again in a minute.')
              : (data.message || 'Something went wrong.');
            setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'error', content: msg, retryPayload: payload }]);
          }
        }
      }
    } catch (err) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: `Network error: ${(err as Error).message}` }]);
    } finally {
      setBusy(false);
      setStepLabel(null);
      // Always clear the streaming cursor, even if the server closed without 'done'
      if (assistantId) {
        const id = assistantId;
        setMessages((m) => m.map((msg) => msg.id === id ? { ...msg, streaming: false } : msg));
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: text }]);
    await callAgent({ user_message: text });
  };

  const handleConfirm = async (approved: boolean) => {
    if (!pending.length) return;
    const action = pending[0];
    setPending([]);
    await callAgent({ confirm: { tool_call_id: action.id, approved } });
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    setPending([]);
  };

  const suggestions = [
    "What's due today?",
    'Show my overdue tasks',
    'Create a task for tomorrow',
    'List tasks in PH Lifewood Tasks',
  ];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-2rem))] h-[min(620px,calc(100vh-3rem))] flex flex-col rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">AI Assistant</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tasks · ask me anything</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={newConversation} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded" title="New conversation">
                New
              </button>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1" aria-label="Close">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !busy && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-4 space-y-3">
                <p className="text-center">Ask me about your tasks, or try:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); setTimeout(() => textareaRef.current?.focus(), 0); }}
                      className="px-2.5 py-1 rounded-full text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs">Writes always need your confirmation.</p>
              </div>
            )}

            {messages.map((m) => {
              if (m.role === 'error') {
                return (
                  <div key={m.id} className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">⚠</span>
                      <div className="flex-1 text-sm text-slate-800 dark:text-slate-200">{m.content}</div>
                    </div>
                    {m.retryPayload && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => callAgent(m.retryPayload!)}
                          disabled={busy}
                          className="text-xs px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${
                      m.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm whitespace-pre-wrap'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <>
                        <Markdown text={m.content} />
                        {m.streaming && <span className="inline-block w-1.5 h-3.5 -mb-0.5 ml-0.5 bg-slate-400 dark:bg-slate-500 animate-pulse" />}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {pending.map((p) => (
              <PendingCard key={p.id} action={p} onConfirm={handleConfirm} busy={busy} />
            ))}

            {busy && stepLabel && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
                  </span>
                  <span>{stepLabel}</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={pending.length ? 'Confirm the action above first…' : 'Type a message… (Shift+Enter for newline)'}
                disabled={busy || pending.length > 0}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 leading-snug max-h-[140px]"
              />
              <button
                onClick={handleSend}
                disabled={busy || !input.trim() || pending.length > 0}
                className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Error boundary so a render crash in the bubble can't take down the whole app
class ChatBubbleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ChatBubble crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-3 text-xs text-red-700 dark:text-red-300 shadow-lg">
          <div className="font-semibold mb-1">AI Assistant crashed</div>
          <div className="mb-2">{this.state.error?.message ?? 'Unknown error'}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-red-700 dark:text-red-200 underline"
          >
            Reload
          </button>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

const ChatBubbleSafe: React.FC<ChatBubbleProps> = (props) => (
  <ChatBubbleErrorBoundary>
    <ChatBubble {...props} />
  </ChatBubbleErrorBoundary>
);

export default ChatBubbleSafe;
