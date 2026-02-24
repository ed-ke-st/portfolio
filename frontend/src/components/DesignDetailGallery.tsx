"use client";

import { useEffect, useMemo, useState } from "react";
import { DesignWork } from "@/types/design";
import { getLargeUrl, getThumbnailUrl, getVideoThumbnailUrl, getOptimizedVideoUrl } from "@/lib/image";

interface DesignDetailGalleryProps {
  design: DesignWork;
}

export default function DesignDetailGallery({ design }: DesignDetailGalleryProps) {
  const videos = design.videos ?? [];

  const safeInitialIndex = useMemo(() => {
    if (design.images.length === 0) return 0;
    if (design.primary_image >= 0 && design.primary_image < design.images.length) {
      return design.primary_image;
    }
    return 0;
  }, [design.images.length, design.primary_image]);

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  // null = showing an image; number = index into videos array
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(safeInitialIndex);
    setActiveVideo(null);
  }, [safeInitialIndex]);

  if (design.images.length === 0 && videos.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {/* Main viewer */}
      <div className="rounded-xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-bg)]">
        {activeVideo !== null ? (
          <video
            key={activeVideo}
            src={getOptimizedVideoUrl(videos[activeVideo])}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-auto"
          />
        ) : (
          design.images.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getLargeUrl(design.images[currentIndex])}
              alt={design.title}
              className="w-full h-auto object-cover"
            />
          )
        )}
      </div>

      {/* Thumbnail strip — images + videos together */}
      {(design.images.length + videos.length) > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {design.images.map((image, index) => (
            <button
              key={`img-${index}`}
              type="button"
              onClick={() => { setCurrentIndex(index); setActiveVideo(null); }}
              className={`flex-shrink-0 rounded-lg overflow-hidden border bg-[var(--app-bg)] transition-colors ${
                activeVideo === null && index === currentIndex
                  ? "border-[var(--app-accent)]"
                  : "border-[var(--app-border)] hover:border-[var(--app-accent)]/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getThumbnailUrl(image)}
                alt={`${design.title} image ${index + 1}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                loading="lazy"
              />
            </button>
          ))}

          {videos.map((videoUrl, index) => (
            <button
              key={`vid-${index}`}
              type="button"
              onClick={() => setActiveVideo(index)}
              className={`flex-shrink-0 relative rounded-lg overflow-hidden border bg-[var(--app-bg)] transition-colors ${
                activeVideo === index
                  ? "border-[var(--app-accent)]"
                  : "border-[var(--app-border)] hover:border-[var(--app-accent)]/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getVideoThumbnailUrl(videoUrl, 160)}
                alt={`${design.title} video ${index + 1}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                loading="lazy"
              />
              {/* play badge */}
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-3 h-3 text-zinc-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
