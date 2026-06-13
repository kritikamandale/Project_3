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
      className="text-xs px-3 py-1.5 rounded-full border border-pichwai-gold/40 bg-pichwai-gold/5
        text-pichwai-brown hover:bg-pichwai-gold/15 hover:border-pichwai-gold/70
        transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {label}
    </motion.button>
  );
}
