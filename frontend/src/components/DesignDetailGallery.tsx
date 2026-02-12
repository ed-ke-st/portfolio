"use client";

import { useEffect, useMemo, useState } from "react";
import { DesignWork } from "@/types/design";
import { getLargeUrl, getThumbnailUrl } from "@/lib/image";

interface DesignDetailGalleryProps {
  design: DesignWork;
}

export default function DesignDetailGallery({ design }: DesignDetailGalleryProps) {
  const safeInitialIndex = useMemo(() => {
    if (design.images.length === 0) return 0;
    if (design.primary_image >= 0 && design.primary_image < design.images.length) {
      return design.primary_image;
    }
    return 0;
  }, [design.images.length, design.primary_image]);

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);

  useEffect(() => {
    setCurrentIndex(safeInitialIndex);
  }, [safeInitialIndex]);

  if (design.images.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-bg)]">
        <img
          src={getLargeUrl(design.images[currentIndex])}
          alt={design.title}
          className="w-full h-auto object-cover"
        />
      </div>

      {design.images.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {design.images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`rounded-lg overflow-hidden border bg-[var(--app-bg)] transition-colors ${
                index === currentIndex
                  ? "border-[var(--app-accent)]"
                  : "border-[var(--app-border)] hover:border-[var(--app-accent)]/60"
              }`}
            >
              <img
                src={getThumbnailUrl(image)}
                alt={`${design.title} image ${index + 1}`}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
