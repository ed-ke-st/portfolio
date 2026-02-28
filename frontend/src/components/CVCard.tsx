"use client";

import Link from "next/link";
import { CVSettings, AppearanceSettings } from "@/lib/settings-api";

interface CVCardProps {
  username: string;
  cv?: CVSettings;
  appearance?: AppearanceSettings;
  basePath?: string;
}

export default function CVCard({ username, cv, appearance, basePath = "" }: CVCardProps) {
  if (!cv?.enabled) return null;
  if (cv.show_on_home === false) return null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const generatedPdfUrl = `${apiBaseUrl}/api/u/${username}/cv/pdf`;
  const downloadPdfUrl = generatedPdfUrl;
  const downloadPdfFilename = `${username.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cv"}.pdf`;
  const isHexColor = (value?: string) => Boolean(value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value));
  const cvPalette = {
    accent: cv.use_custom_appearance && isHexColor(cv.appearance?.accent) ? cv.appearance!.accent! : appearance?.accent || "#2563eb",
    background: cv.use_custom_appearance && isHexColor(cv.appearance?.background) ? cv.appearance!.background! : appearance?.background || "#ffffff",
    text: cv.use_custom_appearance && isHexColor(cv.appearance?.text) ? cv.appearance!.text! : appearance?.text || "#111827",
    muted: cv.use_custom_appearance && isHexColor(cv.appearance?.muted) ? cv.appearance!.muted! : appearance?.muted || "#6b7280",
    card: cv.use_custom_appearance && isHexColor(cv.appearance?.card) ? cv.appearance!.card! : appearance?.card || "#f4f4f5",
    border: cv.use_custom_appearance && isHexColor(cv.appearance?.border) ? cv.appearance!.border! : appearance?.border || "#e4e4e7",
  };

  return (
    <section id="cv" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-2xl border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          style={{
            background: cvPalette.card,
            borderColor: cvPalette.border,
            color: cvPalette.text,
          }}
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: cvPalette.muted }}>
              CV
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold">
              {cv.title || "Curriculum Vitae"}
            </h2>
            {cv.headline && (
              <p className="text-base" style={{ color: cvPalette.muted }}>{cv.headline}</p>
            )}
            {cv.summary && (
              <p className="text-sm max-w-2xl" style={{ color: cvPalette.muted }}>
                {cv.summary}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`${basePath}/cv`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white font-medium"
              style={{ backgroundColor: cvPalette.accent }}
            >
              View CV
            </Link>
            <a
              href={downloadPdfUrl}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border"
              style={{ borderColor: cvPalette.border, color: cvPalette.text }}
              download={downloadPdfFilename}
            >
              {cv.pdf_url ? "Download PDF" : "Generate PDF"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
