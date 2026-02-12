"use client";

import { useEffect, useState } from "react";
import { listMediaAssets, MediaAsset } from "@/lib/admin-api";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadAssets = async (opts?: { reset?: boolean; cursor?: string; search?: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await listMediaAssets(opts?.cursor, opts?.search);
      setItems((prev) => (opts?.reset ? res.resources : [...prev, ...res.resources]));
      setNextCursor(res.next_cursor || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setItems([]);
    setNextCursor(null);
    setSearch("");
    loadAssets({ reset: true });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[85vh] bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Media Library</p>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Close
          </button>
        </div>

        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                loadAssets({ reset: true, search });
              }
            }}
            placeholder="Search by filename..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => loadAssets({ reset: true, search })}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            Search
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          {items.length === 0 && !loading && (
            <p className="text-sm text-zinc-500">No media found yet.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((asset) => (
              <button
                type="button"
                key={asset.public_id}
                onClick={() => onSelect(asset)}
                className="text-left border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-900">
                  <img src={asset.url} alt={asset.filename || asset.public_id} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">{asset.filename || asset.public_id}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
          {nextCursor && (
            <button
              type="button"
              onClick={() => loadAssets({ cursor: nextCursor, search })}
              className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200"
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
