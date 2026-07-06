'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Memory } from './AlbumGrid';

interface HighlightReelProps {
  memories:  Memory[];
  autoPlay?: boolean;
  interval?: number;
}

export function HighlightReel({ memories, autoPlay = true, interval = 3500 }: HighlightReelProps) {
  const highlights = memories.filter((m) => m.isHighlight || m.isCover || m.likesCount >= 2);
  const slides     = highlights.length > 0 ? highlights : memories.slice(0, Math.min(8, memories.length));

  const [current, setCurrent]   = useState(0);
  const [isPlaying, setPlaying] = useState(autoPlay);
  const [isOpen, setOpen]       = useState(false);

  useEffect(() => {
    if (!isPlaying || !isOpen || slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, isOpen, slides.length, interval]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <>
      {/* Trigger button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 rounded-xl border border-pichwai-gold/30 bg-pichwai-gold/5
          text-pichwai-brown font-medium text-sm flex items-center justify-center gap-2
          hover:bg-pichwai-gold/10 transition-colors"
      >
        <span className="text-lg">✨</span>
        View Highlight Reel ({slides.length} photo{slides.length > 1 ? 's' : ''})
      </motion.button>

      {/* Fullscreen slideshow */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Controls */}
            <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">
                  {current + 1} / {slides.length}
                </span>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="text-white/60 hover:text-white text-sm px-3 py-1 rounded-full bg-white/10"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
              </div>
              <button
                onClick={() => { setOpen(false); setCurrent(0); }}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            {/* Slide */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Image
                    src={slide.url}
                    alt={slide.caption ?? ''}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Caption + progress */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {slide.caption && (
                <motion.p
                  key={slide.id + '-caption'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white text-sm text-center mb-4"
                >
                  {slide.caption}
                </motion.p>
              )}

              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5 mb-4">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrent(i); }}
                    className={`transition-all duration-300 rounded-full
                      ${i === current ? 'w-6 h-1.5 bg-pichwai-gold' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>

              {/* Prev / Next */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrent((c) => (c + 1) % slides.length)}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 text-xl"
                >
                  ›
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
