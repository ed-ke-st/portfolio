import Link from "next/link";
import { getSettingsForUser, AllSettings, SkillCategory } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
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
  const cv = settings.cv;
  const heroName = settings.hero?.highlight || username;
  const contact = settings.contact;
  const skills = settings.skills || [];
  const skillCategories = settings.skill_categories as SkillCategory[] | undefined;

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
          href={`/${username}`}
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
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ background: resolved.active.card, borderColor: resolved.active.border }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                {cv.title || "Curriculum Vitae"}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold">
                {heroName}
              </h1>
              {cv.headline && (
                <p className="text-lg text-[var(--app-muted)]">{cv.headline}</p>
              )}
              {cv.location && (
                <p className="text-sm text-[var(--app-muted)]">{cv.location}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              {contact?.email && (
                <a className="text-[var(--app-text)]" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              )}
              {contact?.phone && (
                <a className="text-[var(--app-text)]" href={`tel:${contact.phone.replace(/\\D/g, "")}`}>
                  {contact.phone}
                </a>
              )}
              {contact?.linkedin && (
                <a className="text-[var(--app-text)]" href={contact.linkedin}>
                  LinkedIn
                </a>
              )}
              {contact?.github && (
                <a className="text-[var(--app-text)]" href={contact.github}>
                  GitHub
                </a>
              )}
              {cv.website && (
                <a className="text-[var(--app-text)]" href={cv.website}>
                  {cv.website}
                </a>
              )}
              {cv.pdf_url && (
                <a
                  className="inline-flex items-center gap-2 text-[var(--app-text)] underline"
                  href={cv.pdf_url}
                  download
                >
                  Download PDF
                </a>
              )}
            </div>
          </div>

          {cv.summary && (
            <p className="mt-6 text-[var(--app-muted)]">{cv.summary}</p>
          )}
        </div>

        <div className="mt-10 grid gap-8">
          {cv.experience?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Experience</h2>
              <div className="space-y-6">
                {cv.experience.map((item, index) => (
                  <div key={item.id || `${item.company}-${item.role}-${index}`} className="border-l-2 pl-4" style={{ borderColor: resolved.active.border }}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold">{item.role}</h3>
                      <span className="text-sm text-[var(--app-muted)]">{item.company}</span>
                      {item.location && (
                        <span className="text-sm text-[var(--app-muted)]">{item.location}</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--app-muted)]">{formatRange(item.start, item.end)}</p>
                    {item.summary && (
                      <p className="mt-2 text-sm text-[var(--app-text)]">{item.summary}</p>
                    )}
                    {item.highlights && item.highlights.filter((h) => h.trim()).length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-sm text-[var(--app-muted)]">
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
                  <div key={item.id || `${item.institution}-${item.degree}-${index}`} className="border-l-2 pl-4" style={{ borderColor: resolved.active.border }}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold">{item.degree}</h3>
                      <span className="text-sm text-[var(--app-muted)]">{item.institution}</span>
                      {item.field && (
                        <span className="text-sm text-[var(--app-muted)]">{item.field}</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--app-muted)]">{formatRange(item.start, item.end)}</p>
                    {item.summary && (
                      <p className="mt-2 text-sm text-[var(--app-text)]">{item.summary}</p>
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
                  <div key={group} className="rounded-xl border p-4" style={{ borderColor: resolved.active.border }}>
                    <p className="text-sm font-semibold mb-2">{group}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-[var(--app-muted)]">
                      {groupedSkills[group].map((skill) => (
                        <span key={`${group}-${skill.name}`} className="px-2 py-1 rounded-full border" style={{ borderColor: resolved.active.border }}>
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
                  <div key={item.id || `${item.name}-${index}`} className="rounded-lg border p-4" style={{ borderColor: resolved.active.border }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      {item.issuer && <span className="text-sm text-[var(--app-muted)]">{item.issuer}</span>}
                      {item.year && <span className="text-sm text-[var(--app-muted)]">{item.year}</span>}
                    </div>
                    {item.url && (
                      <a className="text-sm underline text-[var(--app-text)]" href={item.url}>
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
                  <div key={item.id || `${item.title}-${index}`} className="rounded-lg border p-4" style={{ borderColor: resolved.active.border }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {item.issuer && <span className="text-sm text-[var(--app-muted)]">{item.issuer}</span>}
                      {item.year && <span className="text-sm text-[var(--app-muted)]">{item.year}</span>}
                    </div>
                    {item.description && (
                      <p className="text-sm text-[var(--app-muted)] mt-1">{item.description}</p>
                    )}
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
                  <div key={project.id} className="rounded-xl border p-4" style={{ borderColor: resolved.active.border }}>
                    <p className="font-medium">{project.title}</p>
                    <p className="text-sm text-[var(--app-muted)] mt-1">{project.description}</p>
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
