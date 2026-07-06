'use client';

import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS    = 20;
const MAX_DIM       = 1920;

interface GuestInfo {
  eventId:       string;
  eventTitle:    string;
  eventType:     string;
  guestName:     string;
  canUpload:     boolean;
  uploadedCount: number;
}

interface FileEntry {
  id:       string;
  file:     File;
  preview:  string;
  caption:  string;
  status:   'pending' | 'uploading' | 'done' | 'error';
  progress: number;
}

async function resizeImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
        else                { width  = Math.round((width  * MAX_DIM) / height); height = MAX_DIM; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { if (blob) resolve({ blob, width, height }); else reject(new Error('Canvas toBlob failed')); },
        file.type, 0.88,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function GuestUploadPage({ params }: { params: Promise<{ inviteToken: string }> }) {
  const { inviteToken } = use(params);

  const [guestInfo, setGuestInfo]   = useState<GuestInfo | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [entries, setEntries]       = useState<FileEntry[]>([]);
  const [guestName, setGuestName]   = useState('');
  const [uploading, setUploading]   = useState(false);
  const [allDone, setAllDone]       = useState(false);
  const [isDragging, setDragging]   = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/guest/memories/${inviteToken}`)
      .then((r) => r.json())
      .then((data: GuestInfo & { error?: string }) => {
        if (data.error) { setError(data.error); return; }
        setGuestInfo(data);
        setGuestName(data.guestName || '');
      })
      .catch(() => setError('Failed to load. Please try again.'))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  const addFiles = useCallback((raw: FileList | null) => {
    if (!raw || !guestInfo) return;
    const remaining = MAX_PHOTOS - (guestInfo.uploadedCount + entries.length);
    const valid: FileEntry[] = [];
    for (let i = 0; i < raw.length && valid.length < remaining; i++) {
      const file = raw[i];
      if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      valid.push({ id: Math.random().toString(36).slice(2), file, preview: URL.createObjectURL(file), caption: '', status: 'pending', progress: 0 });
    }
    setEntries((prev) => [...prev, ...valid]);
  }, [guestInfo, entries.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => { const e = prev.find((x) => x.id === id); if (e) URL.revokeObjectURL(e.preview); return prev.filter((x) => x.id !== id); });
  };

  const updateCaption = (id: string, caption: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, caption } : e));
  };

  const uploadAll = async () => {
    const pending = entries.filter((e) => e.status === 'pending');
    if (!pending.length || !guestName.trim()) return;
    setUploading(true);

    // Get signed upload config — use a guest-specific signed upload
    // We sign via the event's upload endpoint
    let sig: { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string; uploadUrl: string };
    try {
      const r = await fetch(`/api/upload?eventId=${guestInfo!.eventId}`);
      if (!r.ok) throw new Error('No upload config');
      sig = await r.json();
    } catch {
      setUploading(false);
      return;
    }

    for (const entry of pending) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'uploading' } : e));
      try {
        const { blob, width, height } = await resizeImage(entry.file);

        // Upload to Cloudinary directly
        const form = new FormData();
        form.append('file', blob, 'photo.jpg');
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature);
        form.append('folder', sig.folder);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', sig.uploadUrl);
        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, progress: pct } : e));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error('Upload failed'));
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(form);
        });

        const data = JSON.parse(xhr.responseText);

        // Save to DB via guest memories API
        await fetch(`/api/guest/memories/${inviteToken}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            guestName:          guestName.trim(),
            cloudinaryPublicId: data.public_id,
            url:                data.secure_url,
            caption:            entry.caption || undefined,
            width,
            height,
            fileSize:           blob.size,
            mimeType:           entry.file.type,
          }),
        });

        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'done', progress: 100 } : e));
      } catch {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'error' } : e));
      }
    }

    setUploading(false);
    if (entries.every((e) => e.status === 'done' || e.status === 'error')) {
      setAllDone(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">📸</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🌸</div>
          <h2 className="font-playfair text-xl font-bold text-pichwai-brown mb-2">Oops!</h2>
          <p className="text-pichwai-brown/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="text-center max-w-sm"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="font-playfair text-2xl font-bold text-pichwai-brown mb-2">
            Photos shared!
          </h2>
          <p className="text-pichwai-brown/60 text-sm">
            Your memories have been added to the album for{' '}
            <span className="font-medium">{guestInfo?.eventTitle}</span>.
            The host will be so happy to see them!
          </p>
          <p className="text-xs text-pichwai-brown/30 mt-6">Powered by Milap 🌸</p>
        </motion.div>
      </div>
    );
  }

  const remaining = MAX_PHOTOS - ((guestInfo?.uploadedCount ?? 0) + entries.length);

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-pichwai-cream/20 to-white">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-4xl mb-3">📸</div>
          <h1 className="font-playfair text-2xl font-bold text-pichwai-brown">Share your memories</h1>
          <p className="text-sm text-pichwai-brown/60 mt-1">
            Add your photos from <span className="font-medium">{guestInfo?.eventTitle}</span>
          </p>
        </motion.div>

        {/* Your name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-pichwai-gold/20 p-5"
        >
          <label className="block text-sm font-medium text-pichwai-brown mb-2">
            Your name <span className="text-red-400">*</span>
          </label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-pichwai-brown text-sm
              focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-pichwai-gold/20 p-5"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${isDragging ? 'border-pichwai-gold bg-pichwai-gold/5' : 'border-pichwai-gold/30 hover:border-pichwai-gold/60'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="text-3xl mb-2">🖼️</div>
            <p className="text-sm font-medium text-pichwai-brown">
              {isDragging ? 'Drop here!' : 'Tap to select photos'}
            </p>
            <p className="text-xs text-pichwai-brown/40 mt-1">
              Up to {MAX_PHOTOS} photos · Max 10 MB each · {remaining} remaining
            </p>
          </div>

          {/* Preview */}
          <AnimatePresence>
            {entries.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex gap-3 items-start">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <NextImage src={entry.preview} alt="" fill className="object-cover" unoptimized />
                      {entry.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs">{entry.progress}%</span>
                        </div>
                      )}
                      {entry.status === 'done' && (
                        <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        value={entry.caption}
                        onChange={(e) => updateCaption(entry.id, e.target.value)}
                        placeholder="Add a caption (optional)"
                        disabled={entry.status !== 'pending'}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-pichwai-brown text-xs
                          focus:outline-none focus:ring-1 focus:ring-pichwai-gold/40 disabled:opacity-50"
                      />
                    </div>
                    {entry.status === 'pending' && (
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-gray-400 hover:text-red-400 text-lg leading-none mt-1.5"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        {entries.filter((e) => e.status === 'pending').length > 0 && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={uploadAll}
            disabled={uploading || !guestName.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold
              text-white font-semibold text-base shadow-md disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {uploading
              ? `Uploading ${entries.filter((e) => e.status === 'done').length}/${entries.filter((e) => e.status !== 'error').length}…`
              : `Share ${entries.filter((e) => e.status === 'pending').length} Photo${entries.filter((e) => e.status === 'pending').length > 1 ? 's' : ''}`}
          </motion.button>
        )}

        <p className="text-center text-xs text-pichwai-brown/30">
          Powered by Milap 🌸
        </p>
      </div>
    </div>
  );
}
