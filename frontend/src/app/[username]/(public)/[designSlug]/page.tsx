import { notFound } from "next/navigation";
import { getDesignForUser, parseDesignIdFromPathSegment } from "@/lib/designs";
import { getSettingsForUser } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import DesignDetailGallery from "@/components/DesignDetailGallery";

export default async function DesignDirectDetailPage({
  params,
}: {
  params: Promise<{ username: string; designSlug: string }>;
}) {
  const { username, designSlug } = await params;
  const parsedId = parseDesignIdFromPathSegment(designSlug);

  if (!parsedId) {
    notFound();
  }

  try {
    const [design, settings] = await Promise.all([
      getDesignForUser(username, parsedId),
      getSettingsForUser(username),
    ]);
    const sectionBg = resolveAppearance(settings.appearance).active.sections?.designs || "";

    return (
      <div
        className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[var(--app-bg)]"
        style={sectionBg ? { background: sectionBg } : undefined}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-4 text-sm">
            <a
              href="./designs"
              className="inline-flex items-center gap-1 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Designs
            </a>
            <a
              href="./"
              className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              Home
            </a>
          </div>

          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--app-text)]">{design.title}</h1>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  <span className="capitalize">{design.category}</span>
                  {design.client ? ` • ${design.client}` : ""}
                  {design.year ? ` • ${design.year}` : ""}
                </p>
              </div>
            </div>

            {design.description && (
              <p className="mt-5 text-[var(--app-muted)] whitespace-pre-wrap">{design.description}</p>
            )}

            <DesignDetailGallery design={design} />
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
