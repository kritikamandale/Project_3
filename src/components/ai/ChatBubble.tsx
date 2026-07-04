'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

export interface Message {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
}

interface ChatBubbleProps {
  message:   Message;
  isStreaming?: boolean;
}

function renderContent(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={elements.length} className="my-1.5 space-y-0.5 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="list-disc text-sm leading-relaxed">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      listItems.push(line.slice(2));
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList();
      elements.push(
        <p key={elements.length} className="font-semibold text-sm mt-2">{line.slice(2, -2)}</p>
      );
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      const inlineBold = DOMPurify.sanitize(
        line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
        { ALLOWED_TAGS: ['strong', 'em'], ALLOWED_ATTR: [] },
      );
      elements.push(
        <p
          key={elements.length}
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineBold }}
        />
      );
    }
  }
  flushList();
  return elements;
}

export function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${isUser ? 'bg-pichwai-saffron text-white' : 'bg-gradient-to-br from-pichwai-gold to-pichwai-brown text-white'}`}
      >
        {isUser ? '👤' : '🪔'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm
          ${isUser
            ? 'bg-gradient-to-br from-pichwai-saffron to-pichwai-gold text-white rounded-tr-sm'
            : 'bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm'
          }`}
      >
        {isStreaming && !message.content ? (
          <TypingIndicator />
        ) : (
          <div className={`space-y-1 ${isUser ? 'text-white' : ''}`}>
            {renderContent(message.content)}
          </div>
        )}
        {isStreaming && message.content && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-pichwai-gold/60"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}
