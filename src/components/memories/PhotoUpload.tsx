'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE  = 10 * 1024 * 1024; // 10 MB
const MAX_DIMENSION  = 1920;
const MAX_FILES      = 50;

interface UploadResult {
  publicId:      string;
  url:           string;
  thumbnailUrl?: string;
  width:         number;
  height:        number;
  fileSize:      number;
  mimeType:      string;
}

interface PhotoUploadProps {
  eventId:   string;
  onUploaded: (results: UploadResult[]) => void;
  disabled?:  boolean;
}

interface FileEntry {
  id:       string;
  file:     File;
  preview:  string;
  status:   'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?:   string;
}

async function resizeImage(file: File, maxDim: number): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else                { width  = Math.round((width  * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { if (blob) resolve({ blob, width, height }); else reject(new Error('Canvas toBlob failed')); },
        file.type,
        0.88,
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

async function signedUpload(eventId: string): Promise<{
  signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string; uploadUrl: string;
}> {
  const res = await fetch(`/api/upload?eventId=${eventId}`);
  if (!res.ok) throw new Error('Failed to get upload signature');
  return res.json();
}

async function uploadToCloudinary(
  blob: Blob,
  mimeType: string,
  sig: Awaited<ReturnType<typeof signedUpload>>,
  onProgress: (pct: number) => void,
): Promise<{ publicId: string; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', blob, 'photo.jpg');
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    form.append('folder', sig.folder);
    form.append('transformation', 'f_auto,q_auto');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', sig.uploadUrl);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ publicId: data.public_id, url: data.secure_url, width: data.width, height: data.height });
      } else {
        reject(new Error('Upload failed: ' + xhr.statusText));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

export function PhotoUpload({ eventId, onUploaded, disabled }: PhotoUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((raw: FileList | null) => {
    if (!raw) return;
    const valid: FileEntry[] = [];
    const total = entries.length;
    for (let i = 0; i < raw.length && total + valid.length < MAX_FILES; i++) {
      const file = raw[i];
      if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      valid.push({
        id:       Math.random().toString(36).slice(2),
        file,
        preview:  URL.createObjectURL(file),
        status:   'pending',
        progress: 0,
      });
    }
    setEntries((prev) => [...prev, ...valid]);
  }, [entries.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((e) => e.id !== id);
    });
  };

  const uploadAll = async () => {
    const pending = entries.filter((e) => e.status === 'pending');
    if (!pending.length) return;
    setUploading(true);

    let sig: Awaited<ReturnType<typeof signedUpload>>;
    try { sig = await signedUpload(eventId); }
    catch { setUploading(false); return; }

    const results: UploadResult[] = [];

    for (const entry of pending) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'uploading' } : e));
      try {
        const { blob, width, height } = await resizeImage(entry.file, MAX_DIMENSION);
        const { publicId, url } = await uploadToCloudinary(blob, entry.file.type, sig, (pct) => {
          setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, progress: pct } : e));
        });
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'done', progress: 100 } : e));
        results.push({ publicId, url, width, height, fileSize: blob.size, mimeType: entry.file.type });
      } catch (err) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: 'error', error: String(err) } : e));
      }
    }

    if (results.length) onUploaded(results);
    setUploading(false);
  };

  const pendingCount = entries.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{ borderColor: isDragging ? '#C9933A' : '#E8D5A3' }}
        className="relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors"
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          disabled={disabled}
        />
        <div className="text-4xl mb-3">📸</div>
        <p className="font-medium text-pichwai-brown">
          {isDragging ? 'Drop photos here' : 'Drag & drop photos or click to browse'}
        </p>
        <p className="text-sm text-pichwai-brown/50 mt-1">
          JPEG, PNG, WebP · Max 10 MB each · Up to {MAX_FILES} photos
        </p>
        {entries.length > 0 && (
          <p className="text-xs text-pichwai-gold mt-2 font-medium">
            {entries.length} photo{entries.length > 1 ? 's' : ''} selected
          </p>
        )}
      </motion.div>

      {/* Preview grid */}
      <AnimatePresence>
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-4 sm:grid-cols-6 gap-2"
          >
            {entries.map((entry) => (
              <div key={entry.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt="" className="w-full h-full object-cover" />

                {/* Status overlay */}
                {entry.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <div className="text-white text-xs font-medium">{entry.progress}%</div>
                    <div className="w-12 h-1 bg-white/30 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${entry.progress}%` }} />
                    </div>
                  </div>
                )}
                {entry.status === 'done' && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                )}
                {entry.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-500 text-lg">✕</span>
                  </div>
                )}

                {/* Remove button */}
                {entry.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs
                      opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      {pendingCount > 0 && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={uploadAll}
          disabled={isUploading || disabled}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white
            font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isUploading
            ? `Uploading… (${entries.filter((e) => e.status === 'done').length}/${pendingCount})`
            : `Upload ${pendingCount} Photo${pendingCount > 1 ? 's' : ''}`}
        </motion.button>
      )}
    </div>
  );
}
