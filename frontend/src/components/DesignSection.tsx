"use client";

import Link from "next/link";
import { DesignWork } from "@/types/design";
import { AppearanceSettings } from "@/lib/settings-api";
import DesignCard from "./DesignCard";
import { buildDesignPathSegment } from "@/lib/designs";

interface DesignSectionProps {
  designs: DesignWork[];
  appearance?: AppearanceSettings;
  username?: string;
}

export default function DesignSection({ designs, appearance, username }: DesignSectionProps) {
  const sectionBg = appearance?.sections?.designs;

  // Show only first 4 designs on home page
  const displayedDesigns = designs.slice(0, 4);

  if (designs.length === 0) {
    return null;
  }

  return (
    <section
      id="designs"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--app-bg)]"
      style={sectionBg ? { background: sectionBg } : undefined}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)]">
            Design Projects
          </h2>
          <p className="mt-4 text-[var(--app-muted)] max-w-2xl mx-auto">
            Logos, branding, and visual design projects
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayedDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              href={`/${username}/designs/${buildDesignPathSegment(design)}`}
            />
          ))}
        </div>

        {designs.length > 4 && (
          <div className="text-center mt-8">
            <Link
              href={username ? `/${username}/designs` : "/designs"}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[var(--app-text)] border border-[var(--app-border)] rounded-full hover:bg-[var(--app-card)] transition-colors"
            >
              View All Design Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

       
      </div>
    </section>
  );
}
