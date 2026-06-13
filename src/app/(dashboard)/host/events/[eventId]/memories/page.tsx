'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PhotoUpload } from '@/components/memories/PhotoUpload';
import { AlbumGrid, type Memory } from '@/components/memories/AlbumGrid';
import { HighlightReel } from '@/components/memories/HighlightReel';

interface UploadResult {
  publicId:  string;
  url:       string;
  width:     number;
  height:    number;
  fileSize:  number;
  mimeType:  string;
}

export default function MemoriesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const [memories, setMemories]   = useState<Memory[]>([]);
  const [loading, setLoading]     = useState(true);
  const [shareUrl, setShareUrl]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab]  = useState<'all' | 'highlights'>('all');

  const loadMemories = useCallback(async () => {
    try {
      const res  = await fetch(`/api/memories/${eventId}`);
      const data = await res.json() as { memories?: Memory[] };
      setMemories(data.memories ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const handleUploaded = async (results: UploadResult[]) => {
    for (const r of results) {
      try {
        await fetch(`/api/memories/${eventId}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            cloudinaryPublicId: r.publicId,
            url:                r.url,
            width:              r.width,
            height:             r.height,
            fileSize:           r.fileSize,
            mimeType:           r.mimeType,
          }),
        });
      } catch { /* ignore */ }
    }
    await loadMemories();
    setShowUpload(false);
  };

  const handleUpdate = useCallback(async (id: string, changes: Partial<Memory>) => {
    await fetch(`/api/memories/${eventId}/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(changes),
    });
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));
  }, [eventId]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/memories/${eventId}/${id}`, { method: 'DELETE' });
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, [eventId]);

  const getShareLink = async () => {
    const res  = await fetch(`/api/memories/${eventId}/share`);
    const data = await res.json() as { shareUrl?: string };
    if (data.shareUrl) {
      setShareUrl(data.shareUrl);
      await navigator.clipboard.writeText(data.shareUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const downloadAll = () => {
    window.location.href = `/api/memories/${eventId}/download`;
  };

  const displayMemories = activeTab === 'highlights'
    ? memories.filter((m) => m.isHighlight || m.isCover)
    : memories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-playfair text-2xl font-bold text-pichwai-brown flex items-center gap-2">
            <span>📸</span> Memory Album
          </h1>
          <p className="text-sm text-pichwai-brown/60 mt-0.5">
            {memories.length} photo{memories.length !== 1 ? 's' : ''} · Cherish every moment
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={getShareLink}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-pichwai-gold/30
              bg-white text-pichwai-brown hover:bg-pichwai-gold/5 transition-colors"
          >
            🔗 {copied ? 'Copied!' : 'Share Album'}
          </button>
          {memories.length > 0 && (
            <button
              onClick={downloadAll}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-pichwai-gold/30
                bg-white text-pichwai-brown hover:bg-pichwai-gold/5 transition-colors"
            >
              ⬇ Download All
            </button>
          )}
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl
              bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            + Upload Photos
          </button>
        </div>
      </motion.div>

      {/* Share URL bar */}
      {shareUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-3 bg-pichwai-green/10 border border-pichwai-green/20 rounded-xl px-4 py-3"
        >
          <span className="text-green-600 text-sm">✓</span>
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-sm text-pichwai-brown focus:outline-none truncate"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl).then(() => setCopied(true))}
            className="text-xs text-pichwai-brown/50 hover:text-pichwai-brown"
          >
            Copy
          </button>
          <button onClick={() => setShareUrl(null)} className="text-pichwai-brown/30 hover:text-pichwai-brown">✕</button>
        </motion.div>
      )}

      {/* Upload zone */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-pichwai-gold/20 p-5"
        >
          <PhotoUpload eventId={eventId} onUploaded={handleUploaded} />
        </motion.div>
      )}

      {/* Highlight reel */}
      {memories.length > 0 && (
        <HighlightReel memories={memories} />
      )}

      {/* Tabs */}
      {memories.length > 0 && (
        <div className="flex gap-1 p-1 bg-pichwai-cream/50 rounded-xl w-fit">
          {(['all', 'highlights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-pichwai-brown shadow-sm'
                  : 'text-pichwai-brown/50 hover:text-pichwai-brown'
              }`}
            >
              {tab === 'all' ? `All Photos (${memories.length})` : `Highlights (${memories.filter((m) => m.isHighlight || m.isCover).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Album grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-pichwai-gold/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <AlbumGrid
          memories={displayMemories}
          isHost={true}
          eventId={eventId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Guest upload link notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-pichwai-gold/20 p-5"
      >
        <h3 className="font-semibold text-pichwai-brown text-sm mb-2">🎁 Let guests contribute photos</h3>
        <p className="text-xs text-pichwai-brown/60 mb-3">
          Guests with confirmed RSVPs can upload photos without creating an account.
          Share the invite link and they&apos;ll see the upload option automatically.
        </p>
        <button
          onClick={getShareLink}
          className="text-xs text-pichwai-gold hover:text-pichwai-brown font-medium"
        >
          Copy guest upload link →
        </button>
      </motion.div>
    </div>
  );
}
