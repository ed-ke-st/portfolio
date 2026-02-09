"use client";

import { DesignWork } from "@/types/design";
import { getThumbnailUrl } from "@/lib/image";

interface DesignCardProps {
  design: DesignWork;
  onClick: () => void;
}

export default function DesignCard({ design, onClick }: DesignCardProps) {
  const primaryImage = design.images[design.primary_image] || design.images[0];
  const thumbnailSrc = primaryImage ? getThumbnailUrl(primaryImage) : null;

  return (
    <button
      onClick={onClick}
      className="group relative bg-[var(--app-card)] rounded-xl border border-[var(--app-border)] overflow-hidden hover:border-[var(--app-accent)] transition-all duration-300 hover:shadow-lg text-left w-full"
    >
      {/* Image */}
      <div className="aspect-square bg-[var(--app-bg)] flex items-center justify-center overflow-hidden">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={design.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="text-[var(--app-muted)] text-sm">
            No image
          </span>
        )}
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-semibold">{design.title}</h3>
        <p className="text-white/80 text-sm capitalize">{design.category}</p>
      </div>

      {/* Image count badge */}
      {design.images.length > 1 && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-md">
          {design.images.length} images
        </div>
      )}
    </button>
  );
}
