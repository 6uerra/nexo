'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, Video, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MediaItem = {
  id: string;
  url: string;
  kind: 'image' | 'video' | 'document';
  mimeType?: string | null;
  label?: string | null;
};

type Props = {
  entityType: string;             // 'vehicle' | 'invoice' | 'driver' ...
  entityId?: string;              // opcional al crear
  kinds?: ('image' | 'video' | 'document')[];  // qué se permite
  label?: string;
  initial?: MediaItem[];
  onChange?: (items: MediaItem[]) => void;
};

/**
 * Componente universal:
 *  - 📷 Tomar foto desde la cámara del dispositivo (móvil o webcam)
 *  - 📁 Subir desde galería / archivos
 *  - 🎥 Grabar / importar video (sólo si 'video' está en `kinds`)
 *  - Lista de archivos ya subidos con opción de borrar
 */
export function MediaCapture({
  entityType,
  entityId,
  kinds = ['image'],
  label,
  initial = [],
  onChange,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onChange?.(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function uploadFiles(files: FileList | null, kind: 'image' | 'video' | 'document') {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const newItems: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const params = new URLSearchParams({ entityType, kind });
        if (entityId) params.set('entityId', entityId);
        if (label) params.set('label', label);
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(`/api/v1/media/upload?${params}`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!r.ok) {
          const detail = await r.json().catch(() => ({}));
          throw new Error(detail?.message ?? `HTTP ${r.status}`);
        }
        const data = await r.json();
        newItems.push(data.media);
      }
      setItems((prev) => [...newItems, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este archivo?')) return;
    const r = await fetch(`/api/v1/media/${id}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const allowImage = kinds.includes('image');
  const allowVideo = kinds.includes('video');
  const allowDoc = kinds.includes('document');

  return (
    <div className="space-y-3">
      {/* Botones de captura */}
      <div className="flex flex-wrap gap-2">
        {allowImage && (
          <>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files, 'image')}
            />
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="btn-outline text-sm flex-1 sm:flex-none"
            >
              <Camera className="h-4 w-4" />
              Tomar foto
            </button>
            <input
              ref={galleryRef}
              type="file"
              accept={allowDoc ? 'image/*,application/pdf' : 'image/*'}
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files, allowDoc && Array.from(e.target.files ?? []).some((f) => f.type === 'application/pdf') ? 'document' : 'image')}
            />
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
              className="btn-outline text-sm flex-1 sm:flex-none"
            >
              <Upload className="h-4 w-4" />
              Subir
            </button>
          </>
        )}
        {allowVideo && (
          <>
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files, 'video')}
            />
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              disabled={uploading}
              className="btn-outline text-sm flex-1 sm:flex-none"
            >
              <Video className="h-4 w-4" />
              Grabar/Importar video
            </button>
          </>
        )}
      </div>

      {uploading && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo...
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</p>
      )}

      {/* Galería */}
      {items.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {items.map((m) => (
            <li key={m.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-background">
              {m.kind === 'image' && (
                <button type="button" onClick={() => setPreview(m)} className="block h-full w-full cursor-pointer">
                  <img src={m.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </button>
              )}
              {m.kind === 'video' && (
                <button type="button" onClick={() => setPreview(m)} className="flex h-full w-full items-center justify-center bg-slate-900 cursor-pointer">
                  <Video className="h-8 w-8 text-white" />
                </button>
              )}
              {m.kind === 'document' && (
                <a href={m.url} target="_blank" rel="noreferrer" className="flex h-full w-full items-center justify-center text-muted hover:bg-background">
                  <ImageIcon className="h-6 w-6" />
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100 cursor-pointer hover:bg-white"
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
            onClick={() => setPreview(null)}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {preview.kind === 'image' && <img src={preview.url} alt="" className="max-h-[80vh] max-w-full rounded-lg" />}
            {preview.kind === 'video' && (
              <video src={preview.url} controls autoPlay className="max-h-[80vh] max-w-full rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
