"use client";

import { useState, useRef, useCallback } from "react";

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

interface PhotoUploaderProps {
  listingId: string;
  initialPhotos?: Photo[];
}

export default function PhotoUploader({ listingId, initialPhotos = [] }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    setUploading(true);
    setError("");

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/listings/${listingId}/upload-photo`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          setError(b.error ?? "Upload failed");
          continue;
        }

        const photo: Photo = await res.json();
        // Build public URL from path
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        photo.url = `${supabaseUrl}/storage/v1/object/public/listing-assets/${photo.path}`;
        setPhotos(prev => [...prev, photo]);
      } catch {
        setError("Upload failed. Please try again.");
      }
    }

    setUploading(false);
  }, [listingId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleDelete = async (photo: Photo) => {
    try {
      await fetch(`/api/listings/${listingId}/upload-photo`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: photo.id, path: photo.path }),
      });
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch {
      setError("Failed to delete photo.");
    }
  };

  return (
    <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Photos</h2>
        <span className="font-sans text-xs text-stone">{photos.length} uploaded</span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-gilt bg-gilt/5"
            : "border-stone/20 hover:border-gilt/50 hover:bg-parchment/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-gilt border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-sans text-sm text-stone">Uploading…</p>
          </div>
        ) : (
          <div className="space-y-1">
            <svg className="w-8 h-8 mx-auto text-stone/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-sans text-sm text-stone">
              <span className="text-gilt font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="font-sans text-xs text-stone/50">JPG, PNG, WEBP up to 50MB each</p>
          </div>
        )}
      </div>

      {error && (
        <p className="font-sans text-xs text-red-600">{error}</p>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className="group relative aspect-[4/3] rounded-md overflow-hidden bg-parchment border border-stone/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Property photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-ink/80 text-gilt font-sans text-[10px] rounded">
                  Cover
                </span>
              )}
              <button
                onClick={() => handleDelete(photo)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-ink/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
