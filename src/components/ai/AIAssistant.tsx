'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubble, TypingIndicator, type Message } from './ChatBubble';
import { SuggestionChip } from './SuggestionChip';

const SUGGESTED_PROMPTS = [
  'Plan my wedding in Pune for 200 guests',
  'Suggest caterers under ₹500/plate',
  'Create a budget for a ₹2L birthday',
  'Write a WhatsApp invite for my daughter\'s birthday',
  'What decorations suit a Pichwai theme?',
  'Timeline for a 2-day destination wedding',
];

interface Event {
  id:    string;
  title: string;
}

interface AIAssistantProps {
  events?: Event[];
}

function nanoid() {
  return Math.random().toString(36).slice(2, 11);
}

export function AIAssistant({ events = [] }: AIAssistantProps) {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [selectedEventId, setEventId]   = useState<string | undefined>(undefined);
  const [msgCount, setMsgCount]         = useState(0);
  const [dailyLimit]                    = useState(20);
  const bottomRef                       = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    setInput('');

    const userMsg: Message = { id: nanoid(), role: 'user', content: content.trim() };
    const asstMsg: Message = { id: nanoid(), role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setIsLoading(true);
    setMsgCount((c) => c + 1);

    try {
      const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));
      historyForApi.push({ role: 'user', content: content.trim() });

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          eventId: selectedEventId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errText = (errJson as { error?: string }).error ?? 'Something went wrong.';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsg.id ? { ...m, content: `⚠️ ${errText}` } : m
          )
        );
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsg.id ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsg.id ? { ...m, content: '⚠️ Network error. Please try again.' } : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, selectedEventId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setMsgCount(0);
    inputRef.current?.focus();
  };

  const remainingMessages = dailyLimit - msgCount;

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border-gold)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-gold)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪔</span>
          <div>
            <p className="font-semibold text-[var(--foreground)] text-sm">Milap AI</p>
            <p className="text-xs text-[var(--muted-fg)]">Your event planning assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Token indicator */}
          <span className="text-xs text-[var(--muted-fg)]">
            {remainingMessages}/{dailyLimit} left today
          </span>
          {/* Event context selector */}
          {events.length > 0 && (
            <select
              value={selectedEventId ?? ''}
              onChange={(e) => setEventId(e.target.value || undefined)}
              className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]
                focus:outline-none focus:ring-1 focus:ring-[var(--ring)] max-w-[180px] truncate"
            >
              <option value="">No event context</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="text-xs text-[var(--muted-fg)] hover:text-[var(--foreground)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-4xl mb-4">🌸</div>
            <h3 className="font-playfair text-lg font-semibold text-[var(--pichwai-gold-deep)] mb-1">
              Namaste! I&apos;m Milap AI
            </h3>
            <p className="text-sm text-[var(--muted-fg)] max-w-xs">
              Ask me anything about event planning — venues, budgets, guest lists, vendors, menus, and more.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}
        </AnimatePresence>

        {isLoading && messages.at(-1)?.role === 'assistant' && !messages.at(-1)?.content && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pichwai-gold to-pichwai-brown flex items-center justify-center text-sm">
              🪔
            </div>
            <div className="bg-[var(--muted)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips (only when empty) */}
      {messages.length === 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <SuggestionChip
                key={prompt}
                label={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading || remainingMessages <= 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[var(--border)]">
        <div className="flex gap-2 items-end bg-[var(--muted)] rounded-2xl border border-[var(--border)] px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              remainingMessages <= 0
                ? 'Daily limit reached. Upgrade to premium for unlimited messages.'
                : 'Ask me about your event...'
            }
            disabled={isLoading || remainingMessages <= 0}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[var(--foreground)] placeholder-[var(--muted-fg)]
              text-sm focus:outline-none min-h-[24px] max-h-32 py-1 disabled:opacity-50"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || remainingMessages <= 0}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-pichwai-saffron to-pichwai-gold
              text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-[var(--muted-fg)] mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
