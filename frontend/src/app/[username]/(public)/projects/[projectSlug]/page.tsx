import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettingsForUser } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import { getSiteBasePath } from "@/lib/site-path";
import { parseProjectIdFromPathSegment } from "@/lib/projects";
import { getProjectForUser } from "@/lib/api";
import ProjectGallery from "@/components/ProjectGallery";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}) {
  const { username, projectSlug } = await params;
  const parsedId = parseProjectIdFromPathSegment(projectSlug);

  if (!parsedId) notFound();

  try {
    const [project, settings] = await Promise.all([
      getProjectForUser(username, parsedId),
      getSettingsForUser(username),
    ]);
    const sectionBg = resolveAppearance(settings.appearance).active.sections?.projects || "";
    const basePath = await getSiteBasePath(username);
    const homePath = basePath || "/";

    return (
      <div
        className="min-h-screen pt-24 pb-16 bg-[var(--app-bg)]"
        style={sectionBg ? { background: sectionBg } : undefined}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-4 text-sm">
            <Link
              href={`${homePath}#projects`}
              className="inline-flex items-center gap-1 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dev Projects
            </Link>
            <Link
              href={homePath}
              className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              Home
            </Link>
          </div>

          {/* 2-col layout on desktop */}
          <div className="lg:grid lg:grid-cols-5 lg:gap-16">
            {/* Left col — sticky description */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-28">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--app-text)]">
                  {project.title}
                </h1>

                <p className="mt-5 text-[var(--app-muted)] whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>

                {project.tech_stack.length > 0 && (
                  <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--app-muted)] mb-3">
                      Tech Stack
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-sm bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  {project.github_link && (
                    <a
                      href={project.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--app-border)] text-[var(--app-text)] hover:border-[var(--app-accent)] transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                      </svg>
                      Code
                    </a>
                  )}
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--app-accent)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right col — gallery */}
            <div className="lg:col-span-3 mt-12 lg:mt-0">
              {project.gallery && project.gallery.length > 0 ? (
                <ProjectGallery items={project.gallery} title={project.title} />
              ) : project.image_url ? (
                <div className="rounded-xl overflow-hidden border border-[var(--app-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-auto"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
