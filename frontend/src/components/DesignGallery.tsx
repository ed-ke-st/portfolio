"use client";

import { useState } from "react";
import { DesignWork } from "@/types/design";
import DesignCard from "./DesignCard";
import Lightbox from "./Lightbox";

interface DesignGalleryProps {
  designs: DesignWork[];
  showFilters?: boolean;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "logo", label: "Logos" },
  { value: "branding", label: "Branding" },
  { value: "ui", label: "UI/UX" },
  { value: "print", label: "Print" },
  { value: "other", label: "Other" },
];

export default function DesignGallery({ designs, showFilters = false }: DesignGalleryProps) {
  const [selectedDesign, setSelectedDesign] = useState<DesignWork | null>(null);
  const [activeCategory, setActiveCategory] = useState("");

  const filteredDesigns = activeCategory
    ? designs.filter((d) => d.category === activeCategory)
    : designs;

  return (
    <>
      {showFilters && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? "bg-[var(--app-accent)] text-white"
                  : "bg-[var(--app-card)] text-[var(--app-text)] hover:opacity-90"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {filteredDesigns.length === 0 ? (
        <p className="text-center text-[var(--app-muted)] py-12">No designs found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onClick={() => setSelectedDesign(design)}
            />
          ))}
        </div>
      )}

      {selectedDesign && (
        <Lightbox
          design={selectedDesign}
          onClose={() => setSelectedDesign(null)}
        />
      )}
    </>
  );
}
