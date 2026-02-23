import Link from "next/link";
import { getSettingsForUser, AllSettings, SkillCategory } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import { getSiteBasePath } from "@/lib/site-path";
import { getProjectsForUser } from "@/lib/api";
import { Project } from "@/types/project";

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
          className="rounded-2xl border p-6 sm:p-8"
          style={{ background: cvPalette.card, borderColor: cvPalette.border }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
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
                <a href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone.replace(/\\D/g, "")}`}>
                  {contact.phone}
                </a>
              )}
              {contact?.linkedin && (
                <a href={contact.linkedin}>
                  LinkedIn
                </a>
              )}
              {contact?.github && (
                <a href={contact.github}>
                  GitHub
                </a>
              )}
              {cv.website && (
                <a href={cv.website}>
                  {cv.website}
                </a>
              )}
              <a
                className="inline-flex items-center gap-2 underline"
                href={downloadPdfUrl}
                download
              >
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
                    <p className="text-sm mt-1" style={{ color: cvPalette.muted }}>{project.description}</p>
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
