"use client";

import { useEffect, useState, useCallback } from "react";
import { DesignWork } from "@/types/design";

interface LightboxProps {
  design: DesignWork;
  onClose: () => void;
}

export default function Lightbox({ design, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(design.primary_image || 0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % design.images.length);
  }, [design.images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + design.images.length) % design.images.length);
  }, [design.images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div>
          <h2 className="text-xl font-semibold">{design.title}</h2>
          <p className="text-white/60 text-sm">
            {design.client && `${design.client} • `}
            {design.year && `${design.year} • `}
            <span className="capitalize">{design.category}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {/* Previous button */}
        {design.images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Image */}
        <img
          src={design.images[currentIndex]}
          alt={`${design.title} - ${currentIndex + 1}`}
          className="max-h-[70vh] max-w-full object-contain rounded-lg"
        />

        {/* Next button */}
        {design.images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Next image"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Description */}
      {design.description && (
        <div className="px-4 py-2 text-center">
          <p className="text-white/80 text-sm max-w-2xl mx-auto">{design.description}</p>
        </div>
      )}

      {/* Thumbnails */}
      {design.images.length > 1 && (
        <div className="flex justify-center gap-2 p-4 overflow-x-auto">
          {design.images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                index === currentIndex
                  ? "border-white"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image counter */}
      {design.images.length > 1 && (
        <div className="text-center pb-4 text-white/60 text-sm">
          {currentIndex + 1} / {design.images.length}
        </div>
      )}
    </div>
  );
}
