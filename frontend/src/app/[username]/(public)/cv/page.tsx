import Link from "next/link";
import { getSettingsForUser, AllSettings, SkillCategory } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import { getSiteBasePath } from "@/lib/site-path";
import { getProjectsForUser } from "@/lib/api";
import { Project } from "@/types/project";
import { stripMarkdown } from "@/lib/text";

function formatRange(start?: string, end?: string) {
  if (!start && !end) return "";
  if (start && end) return `${start} — ${end}`;
  if (start && !end) return `${start} — Present`;
  return end || "";
}

export default async function CVPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let settings: AllSettings = {};
  let projects: Project[] = [];

  try {
    [settings, projects] = await Promise.all([
      getSettingsForUser(username),
      getProjectsForUser(username),
    ]);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  const resolved = resolveAppearance(settings.appearance);
  const basePath = await getSiteBasePath(username);
  const cv = settings.cv;
  const heroName = settings.hero?.highlight || username;
  const contact = settings.contact;
  const skills = settings.skills || [];
  const skillCategories = settings.skill_categories as SkillCategory[] | undefined;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const generatedPdfUrl = `${apiBaseUrl}/api/u/${username}/cv/pdf`;
  const downloadPdfUrl = cv?.pdf_url || generatedPdfUrl;
  const isHexColor = (value?: string) => Boolean(value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value));
  const cvPalette = cv?.use_custom_appearance
    ? {
        accent: isHexColor(cv.appearance?.accent) ? cv.appearance!.accent! : resolved.active.accent,
        background: isHexColor(cv.appearance?.background) ? cv.appearance!.background! : resolved.active.background,
        text: isHexColor(cv.appearance?.text) ? cv.appearance!.text! : resolved.active.text,
        muted: isHexColor(cv.appearance?.muted) ? cv.appearance!.muted! : resolved.active.muted,
        card: isHexColor(cv.appearance?.card) ? cv.appearance!.card! : resolved.active.card,
        border: isHexColor(cv.appearance?.border) ? cv.appearance!.border! : resolved.active.border,
      }
    : resolved.active;

  if (!cv?.enabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-2xl font-semibold text-[var(--app-text)]">
          CV Unavailable
        </h1>
        <p className="text-[var(--app-muted)] mt-2">
          This CV is not published yet.
        </p>
        <Link
          href={basePath || "/"}
          className="inline-flex mt-6 text-sm font-medium text-[var(--app-text)] underline"
        >
          Back to portfolio
        </Link>
      </div>
    );
  }

  const groupedSkills = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const group = skill.mainCategory || "Skills";
    if (!acc[group]) acc[group] = [];
    acc[group].push(skill);
    return acc;
  }, {});
  const orderedSkillGroups = skillCategories?.map((c) => c.name).filter((n) => groupedSkills[n]?.length)
    || Object.keys(groupedSkills);

  return (
    <div
      className="min-h-screen"
      style={{ background: cvPalette.background, color: cvPalette.text }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          className="rounded-2xl border p-6 mt-8 sm:p-8 sm:mt-6"
          style={{ background: cvPalette.card, borderColor: cvPalette.border }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
            <div className="space-y-2 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                {cv.title || "Curriculum Vitae"}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold whitespace-pre-wrap">
                {heroName}
              </h1>
              {cv.headline && (
                <p className="text-lg" style={{ color: cvPalette.muted }}>{cv.headline}</p>
              )}
              {cv.location && (
                <p className="text-sm" style={{ color: cvPalette.muted }}>{cv.location}</p>
              )}
            </div>
            {cv.photo_url && (
              <div className="shrink-0">
                <img
                  src={cv.photo_url}
                  alt={`${heroName} photo`}
                  className="w-24 h-24 rounded-xl object-cover border"
                  style={{ borderColor: cvPalette.border }}
                />
              </div>
            )}
            <div className="flex flex-col gap-2 text-sm">
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {contact.email}
                </a>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5.5A2.5 2.5 0 015.5 3h2a2 2 0 012 2v2a2 2 0 01-2 2H7a12 12 0 008 8v-.5a2 2 0 012-2h2a2 2 0 012 2v2A2.5 2.5 0 0118.5 21h-1C9.82 21 3 14.18 3 5.5z" />
                  </svg>
                  {contact.phone}
                </a>
              )}
              {contact?.linkedin && (
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
              {contact?.github && (
                <a href={contact.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  GitHub
                </a>
              )}
              {cv.website && (
                <a href={cv.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c1.657 0 3-4.03 3-9s-1.343-9-3-9M3.5 9h17M3.5 15h17" />
                  </svg>
                  {cv.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              <a className="inline-flex items-center gap-2 underline" href={downloadPdfUrl} download>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {cv.pdf_url ? "Download PDF" : "Generate PDF"}
              </a>
            </div>
          </div>

          {cv.summary && (
            <p className="mt-6" style={{ color: cvPalette.muted }}>{cv.summary}</p>
          )}
        </div>

        <div className="mt-10 grid gap-8">
          {cv.experience?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Experience</h2>
              <div className="space-y-6">
                {cv.experience.map((item, index) => (
                  <div key={item.id || `${item.company}-${item.role}-${index}`} className="border-l-2 pl-4" style={{ borderColor: cvPalette.border }}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold">{item.role}</h3>
                      <span className="text-sm" style={{ color: cvPalette.muted }}>{item.company}</span>
                      {item.location && (
                        <span className="text-sm" style={{ color: cvPalette.muted }}>{item.location}</span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: cvPalette.muted }}>{formatRange(item.start, item.end)}</p>
                    {item.summary && (
                      <p className="mt-2 text-sm">{item.summary}</p>
                    )}
                    {item.highlights && item.highlights.filter((h) => h.trim()).length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-sm" style={{ color: cvPalette.muted }}>
                        {item.highlights.filter((h) => h.trim()).map((h, i) => (
                          <li key={`${h}-${i}`}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.education?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Education</h2>
              <div className="space-y-6">
                {cv.education.map((item, index) => (
                  <div key={item.id || `${item.institution}-${item.degree}-${index}`} className="border-l-2 pl-4" style={{ borderColor: cvPalette.border }}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold">{item.degree}</h3>
                      <span className="text-sm" style={{ color: cvPalette.muted }}>{item.institution}</span>
                      {item.field && (
                        <span className="text-sm" style={{ color: cvPalette.muted }}>{item.field}</span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: cvPalette.muted }}>{formatRange(item.start, item.end)}</p>
                    {item.summary && (
                      <p className="mt-2 text-sm">{item.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {skills.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Skills</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {orderedSkillGroups.map((group) => (
                  <div key={group} className="rounded-xl border p-4" style={{ borderColor: cvPalette.border }}>
                    <p className="text-sm font-semibold mb-2">{group}</p>
                    <div className="flex flex-wrap gap-2 text-sm" style={{ color: cvPalette.muted }}>
                      {groupedSkills[group].map((skill) => (
                        <span key={`${group}-${skill.name}`} className="px-2 py-1 rounded-full border" style={{ borderColor: cvPalette.border }}>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.certifications?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Certifications</h2>
              <div className="grid gap-3">
                {cv.certifications.map((item, index) => (
                  <div key={item.id || `${item.name}-${index}`} className="rounded-lg border p-4" style={{ borderColor: cvPalette.border }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      {item.issuer && <span className="text-sm" style={{ color: cvPalette.muted }}>{item.issuer}</span>}
                      {item.year && <span className="text-sm" style={{ color: cvPalette.muted }}>{item.year}</span>}
                    </div>
                    {item.url && (
                      <a className="text-sm underline" href={item.url}>
                        View credential
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.awards?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Awards</h2>
              <div className="grid gap-3">
                {cv.awards.map((item, index) => (
                  <div key={item.id || `${item.title}-${index}`} className="rounded-lg border p-4" style={{ borderColor: cvPalette.border }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {item.issuer && <span className="text-sm" style={{ color: cvPalette.muted }}>{item.issuer}</span>}
                      {item.year && <span className="text-sm" style={{ color: cvPalette.muted }}>{item.year}</span>}
                    </div>
                    {item.description && (
                      <p className="text-sm mt-1" style={{ color: cvPalette.muted }}>{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.languages?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Languages</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cv.languages.map((item, index) => (
                  <div key={item.id || `${item.language}-${index}`} className="rounded-lg border p-4" style={{ borderColor: cvPalette.border }}>
                    <p className="font-medium">{item.language}</p>
                    <div className="mt-2 space-y-1 text-sm" style={{ color: cvPalette.muted }}>
                      {item.spoken && (
                        <p><span className="font-medium">Spoken</span> — {item.spoken}</p>
                      )}
                      {item.written && (
                        <p><span className="font-medium">Written</span> — {item.written}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Selected Projects</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.filter((p) => p.featured).slice(0, 4).map((project) => (
                  <div key={project.id} className="rounded-xl border p-4" style={{ borderColor: cvPalette.border }}>
                    <p className="font-medium">{project.title}</p>
                    <p className="text-sm mt-1" style={{ color: cvPalette.muted }}>{stripMarkdown(project.description)}</p>
                    <div className="flex gap-3 mt-3 text-sm">
                      {project.live_url && (
                        <a className="underline" href={project.live_url}>Live</a>
                      )}
                      {project.github_link && (
                        <a className="underline" href={project.github_link}>GitHub</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
