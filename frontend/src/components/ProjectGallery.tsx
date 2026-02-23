"use client";

import { ProjectGalleryItem } from "@/types/project";
import { getOptimizedVideoUrl } from "@/lib/image";

interface ProjectGalleryProps {
  items: ProjectGalleryItem[];
  title: string;
}

export default function ProjectGallery({ items, title }: ProjectGalleryProps) {
  if (!items.length) return null;

  return (
    <div className="space-y-10">
      {items.map((item, index) => (
        <div key={index}>
          {item.type === "image" ? (
            <div className="rounded-xl overflow-hidden border border-[var(--app-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || `${title} image ${index + 1}`}
                className="w-full h-auto"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-[var(--app-border)] bg-black">
              <video
                src={getOptimizedVideoUrl(item.url)}
                controls
                playsInline
                preload="metadata"
                className="w-full h-auto"
              />
            </div>
          )}
          {item.caption && (
            <p className="mt-3 text-sm text-[var(--app-muted)] leading-relaxed">
              {item.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
