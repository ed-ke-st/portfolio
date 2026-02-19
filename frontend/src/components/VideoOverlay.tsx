"use client";

import { useEffect, useRef } from "react";
import { getOptimizedVideoUrl } from "@/lib/image";

interface VideoOverlayProps {
  videoUrl: string;
  onClose: () => void;
}

export default function VideoOverlay({ videoUrl, onClose }: VideoOverlayProps) {
  const optimizedUrl = getOptimizedVideoUrl(videoUrl);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium"
        >
          Close ✕
        </button>
        {/* preload="none" — nothing loads until autoPlay kicks in on open */}
        <video
          src={optimizedUrl}
          className="w-full rounded-lg"
          controls
          autoPlay
          playsInline
          preload="none"
        />
      </div>
    </div>
  );
}
