"use client";

import Link from "next/link";
import { CVSettings, AppearanceSettings } from "@/lib/settings-api";

interface CVCardProps {
  username: string;
  cv?: CVSettings;
  appearance?: AppearanceSettings;
}

export default function CVCard({ username, cv, appearance }: CVCardProps) {
  if (!cv?.enabled) return null;
  if (cv.show_on_home === false) return null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const generatedPdfUrl = `${apiBaseUrl}/api/u/${username}/cv/pdf`;
  const downloadPdfUrl = cv.pdf_url || generatedPdfUrl;

  return (
    <section id="cv" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-2xl border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          style={{
            background: appearance?.card,
            borderColor: appearance?.border,
          }}
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
              CV
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--app-text)]">
              {cv.title || "Curriculum Vitae"}
            </h2>
            {cv.headline && (
              <p className="text-base text-[var(--app-muted)]">{cv.headline}</p>
            )}
            {cv.summary && (
              <p className="text-sm text-[var(--app-muted)] max-w-2xl">
                {cv.summary}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${username}/cv`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white font-medium"
              style={{ backgroundColor: appearance?.accent }}
            >
              View CV
            </Link>
            <a
              href={downloadPdfUrl}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border text-[var(--app-text)]"
              style={{ borderColor: appearance?.border }}
              download
            >
              {cv.pdf_url ? "Download PDF" : "Generate PDF"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
