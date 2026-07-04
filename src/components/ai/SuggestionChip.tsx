'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SuggestionChipProps {
  label:    string;
  onClick:  () => void;
  disabled?: boolean;
}

export function SuggestionChip({ label, onClick, disabled }: SuggestionChipProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-gold)] bg-[var(--muted)]
        text-[var(--foreground)] hover:bg-[rgba(201,147,58,0.15)] hover:border-[var(--pichwai-gold)]
        transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {label}
    </motion.button>
  );
}
