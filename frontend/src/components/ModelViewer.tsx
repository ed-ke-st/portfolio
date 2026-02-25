"use client";

import { useEffect, useRef, useState } from "react";

interface ModelViewerProps {
  src: string;
  alt?: string;
  orientation?: string;
  zoom?: string;
}

type ModelViewerElement = HTMLElement & {
  availableAnimations?: string[];
  play?: () => void;
  appendAnimation?: (name: string, options?: { weight?: number }) => void;
};

function pickDefaultAnimation(clips: string[]): string | null {
  if (!clips.length) return null;
  const preferred = clips.find((clip) => !/tpose|bind|rest/i.test(clip));
  return preferred || clips[0];
}

function toCameraOrbitDistance(zoom?: string): string | undefined {
  const value = zoom?.trim();
  if (!value) return undefined;
  if (/^\d+(\.\d+)?$/.test(value)) return `${value}%`;
  return value;
}

export default function ModelViewer({ src, alt, orientation, zoom }: ModelViewerProps) {
  const [ready, setReady] = useState(false);
  const [animationName, setAnimationName] = useState<string | null>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const configuredForSrcRef = useRef(false);
  const cameraOrbitDistance = toCameraOrbitDistance(zoom);

  useEffect(() => {
    // Dynamically import the web component — browser-only, no SSR
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  useEffect(() => {
    configuredForSrcRef.current = false;
    setAnimationName(null);
  }, [src]);

  useEffect(() => {
    if (!ready || !viewerRef.current) return;

    const viewer = viewerRef.current;
    const syncAnimation = () => {
      if (configuredForSrcRef.current) return;

      const clips = (viewer.availableAnimations ?? []).filter(
        (clip) => !/tpose|bind|rest/i.test(clip),
      );
      const selected = pickDefaultAnimation(clips);
      if (!selected) return;

      setAnimationName(selected);
      clips
        .filter((clip) => clip !== selected)
        .forEach((clip) => viewer.appendAnimation?.(clip, { weight: 1 }));
      viewer.play?.();
      configuredForSrcRef.current = true;
    };

    viewer.addEventListener("load", syncAnimation);
    // Covers cached/fast-loaded models where the load event may have already fired.
    syncAnimation();
    return () => {
      viewer.removeEventListener("load", syncAnimation);
    };
  }, [ready, src]);

  useEffect(() => {
    if (!ready || !animationName || !viewerRef.current) return;
    viewerRef.current.play?.();
  }, [ready, animationName]);

  return (
    <div
      className="rounded-xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-bg)]"
      style={{ aspectRatio: "4/3" }}
    >
      {ready ? (
        <model-viewer
          ref={viewerRef}
          src={src}
          alt={alt || "3D model"}
          autoplay=""
          animation-name={animationName || undefined}
          orientation={orientation || undefined}
          camera-orbit={cameraOrbitDistance ? `auto auto ${cameraOrbitDistance}` : undefined}
          min-camera-orbit="auto auto 1%"
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
