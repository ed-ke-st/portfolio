"use client";

import { ProjectGalleryItem } from "@/types/project";
import { getOptimizedVideoUrl } from "@/lib/image";
import ModelViewer from "./ModelViewer";

interface ProjectGalleryProps {
  items: ProjectGalleryItem[];
  title: string;
}

function GalleryMedia({ item, title, index }: { item: ProjectGalleryItem; title: string; index: number }) {
  // Models have their own wrapper — skip bg/rounded logic
  if (item.type === "model") {
    return (
      <ModelViewer
        src={item.url}
        alt={item.caption || title}
        orientation={item.model_orientation}
        zoom={item.model_zoom}
      />
    );
  }

  const showBg = item.background !== false;
  const showRounded = item.rounded !== false;

  const wrapperClass = [
    "overflow-hidden",
    showRounded ? "rounded-xl" : "",
    showBg ? "border border-[var(--app-border)]" : "",
    showBg && item.type === "video" ? "bg-black" : "",
  ].filter(Boolean).join(" ");

  if (item.type === "video") {
    return (
      <div className={wrapperClass}>
        <video
          src={getOptimizedVideoUrl(item.url)}
          controls
          playsInline
          preload="metadata"
          className="w-full h-auto"
        />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={item.caption || `${title} image ${index + 1}`}
        className="w-full h-auto"
        loading={index === 0 ? "eager" : "lazy"}
      />
    </div>
  );
}

export default function ProjectGallery({ items, title }: ProjectGalleryProps) {
  if (!items.length) return null;

  return (
    <div className="space-y-10">
      {items.map((item, index) => {
        const isSide = item.layout === "side" && item.caption;

        if (isSide) {
          return (
            <div key={index} className="grid grid-cols-2 gap-6 items-center">
              <GalleryMedia item={item} title={title} index={index} />
              <p className="text-sm text-[var(--app-muted)] leading-relaxed">
                {item.caption}
              </p>
            </div>
          );
        }

        return (
          <div key={index}>
            <GalleryMedia item={item} title={title} index={index} />
            {item.caption && (
              <p className="mt-3 text-sm text-[var(--app-muted)] leading-relaxed">
                {item.caption}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
