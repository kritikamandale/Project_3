'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export interface Memory {
  id:                 string;
  url:                string;
  thumbnailUrl?:      string | null;
  caption?:           string | null;
  isCover:            boolean;
  isHighlight:        boolean;
  likesCount:         number;
  cloudinaryPublicId: string;
  width?:             number | null;
  height?:            number | null;
  metadata?:          Record<string, unknown>;
  createdAt:          string;
}

interface AlbumGridProps {
  memories:     Memory[];
  isHost:       boolean;
  eventId:      string;
  onUpdate:     (id: string, changes: Partial<Memory>) => Promise<void>;
  onDelete:     (id: string) => Promise<void>;
}

interface LightboxProps {
  memory:  Memory;
  onClose: () => void;
  onPrev:  () => void;
  onNext:  () => void;
  hasPrev: boolean;
  hasNext: boolean;
  isHost:  boolean;
  onUpdate: (changes: Partial<Memory>) => void;
}

function Lightbox({ memory, onClose, onPrev, onNext, hasPrev, hasNext, isHost, onUpdate }: LightboxProps) {
  const [caption, setCaption] = useState(memory.caption ?? '');
  const [editing, setEditing] = useState(false);

  const guestName = (memory.metadata as { uploadedByGuest?: string })?.uploadedByGuest;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        <div className="relative w-full max-h-[70vh]">
          <Image
            src={memory.url}
            alt={memory.caption ?? ''}
            fill
            className="object-contain rounded-xl"
            sizes="90vw"
          />

          {/* Close */}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80">
            ✕
          </button>

          {/* Prev/Next */}
          {hasPrev && (
            <button onClick={onPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 text-xl">
              ‹
            </button>
          )}
          {hasNext && (
            <button onClick={onNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 text-xl">
              ›
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/60 rounded-b-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="flex-1 bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none"
                  placeholder="Add a caption…"
                  autoFocus
                />
                <button onClick={() => { onUpdate({ caption }); setEditing(false); }} className="text-pichwai-gold text-sm px-3 py-1.5 rounded-lg bg-pichwai-gold/20 hover:bg-pichwai-gold/30">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-white/50 text-sm px-2">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white text-sm truncate">{memory.caption || (isHost ? 'Add caption…' : '')}</p>
                {isHost && <button onClick={() => setEditing(true)} className="text-white/40 hover:text-white text-xs flex-shrink-0">✏️</button>}
              </div>
            )}
            {guestName && <p className="text-white/40 text-xs mt-0.5">By {guestName}</p>}
          </div>

          {isHost && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => onUpdate({ isCover: !memory.isCover })}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${memory.isCover ? 'bg-pichwai-gold text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {memory.isCover ? '⭐ Cover' : 'Set Cover'}
              </button>
              <button
                onClick={() => onUpdate({ isHighlight: !memory.isHighlight })}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${memory.isHighlight ? 'bg-pichwai-saffron text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {memory.isHighlight ? '✨ Highlight' : 'Highlight'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AlbumGrid({ memories, isHost, eventId, onUpdate, onDelete }: AlbumGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const lightboxMemory = lightboxIdx !== null ? memories[lightboxIdx] : null;

  const handleLightboxUpdate = async (changes: Partial<Memory>) => {
    if (lightboxIdx === null) return;
    await onUpdate(memories[lightboxIdx].id, changes);
  };

  if (!memories.length) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📷</div>
        <p className="text-pichwai-brown/60 font-medium">No photos yet</p>
        <p className="text-pichwai-brown/40 text-sm mt-1">Upload some memories from your event!</p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry CSS grid */}
      <div
        className="columns-2 sm:columns-3 lg:columns-4 gap-3"
        style={{ columnGap: '0.75rem' }}
      >
        {memories.map((memory, idx) => {
          const guestName = (memory.metadata as { uploadedByGuest?: string })?.uploadedByGuest;
          return (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="break-inside-avoid mb-3 relative group cursor-pointer rounded-xl overflow-hidden"
              onClick={() => setLightboxIdx(idx)}
            >
              <Image
                src={memory.thumbnailUrl ?? memory.url}
                alt={memory.caption ?? ''}
                width={400}
                height={300}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {memory.caption && (
                    <p className="text-white text-xs leading-tight truncate">{memory.caption}</p>
                  )}
                  {guestName && (
                    <p className="text-white/60 text-xs">By {guestName}</p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex gap-2">
                      {memory.isCover     && <span className="text-xs bg-pichwai-gold/80 text-white px-1.5 py-0.5 rounded">⭐ Cover</span>}
                      {memory.isHighlight && <span className="text-xs bg-pichwai-saffron/80 text-white px-1.5 py-0.5 rounded">✨</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async (e) => { e.stopPropagation(); await onUpdate(memory.id, { likesCount: memory.likesCount + 1 }); }}
                        className="text-white/80 hover:text-white text-xs flex items-center gap-1"
                      >
                        ♥ {memory.likesCount}
                      </button>
                      {isHost && (
                        <button
                          onClick={async (e) => { e.stopPropagation(); if (confirm('Delete this photo?')) await onDelete(memory.id); }}
                          className="text-white/60 hover:text-red-400 text-xs"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxMemory !== null && lightboxIdx !== null && (
          <Lightbox
            memory={lightboxMemory}
            onClose={() => setLightboxIdx(null)}
            onPrev={() => setLightboxIdx((i) => Math.max(0, (i ?? 0) - 1))}
            onNext={() => setLightboxIdx((i) => Math.min(memories.length - 1, (i ?? 0) + 1))}
            hasPrev={(lightboxIdx ?? 0) > 0}
            hasNext={(lightboxIdx ?? 0) < memories.length - 1}
            isHost={isHost}
            onUpdate={handleLightboxUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
