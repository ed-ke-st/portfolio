"use client";

import { useEffect, useState } from "react";

interface ModelViewerProps {
  src: string;
  alt?: string;
}

export default function ModelViewer({ src, alt }: ModelViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Dynamically import the web component — browser-only, no SSR
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-bg)]"
      style={{ aspectRatio: "4/3" }}
    >
      {ready ? (
        <model-viewer
          src={src}
          alt={alt || "3D model"}
          auto-rotate=""
          camera-controls=""
          shadow-intensity="1"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ModelIcon className="w-10 h-10 text-[var(--app-muted)] animate-pulse" />
        </div>
      )}
    </div>
  );
}

function ModelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 2v20M3.34 7l8.66 5 8.66-5" />
    </svg>
  );
}
