import { getDesigns } from "@/lib/designs";
import { getSettings } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import DesignGallery from "@/components/DesignGallery";
import Link from "next/link";
import { DesignWork } from "@/types/design";

export const metadata = {
  title: "Design Work | Portfolio",
  description: "Logos, branding, and design projects",
};

export default async function DesignsPage() {
  let designs: DesignWork[] = [];
  let sectionBg = "";

  try {
    designs = await getDesigns();
    const settings = await getSettings();
    sectionBg = resolveAppearance(settings.appearance).active.sections?.designs || "";
  } catch (error) {
    console.error("Failed to fetch designs:", error);
  }

  return (
    <div
      className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[var(--app-bg)]"
      style={sectionBg ? { background: sectionBg } : undefined}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)]">
            Design Work
          </h1>
          <p className="mt-4 text-[var(--app-muted)] max-w-2xl mx-auto">
            A collection of logos, branding, and visual design projects
          </p>
        </div>

        {/* Gallery with filters */}
        <DesignGallery designs={designs} showFilters />
      </div>
    </div>
  );
}
