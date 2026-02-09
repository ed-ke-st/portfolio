import { AppearanceSettings, Skill } from "@/lib/settings-api";

interface TechStackProps {
  skills?: Skill[];
  appearance?: AppearanceSettings;
}

const defaultSkills: Skill[] = [
  { name: "TypeScript", category: "Language", level: 85 },
  { name: "JavaScript", category: "Language", level: 80 },
  { name: "Python", category: "Language", level: 78 },
  { name: "React", category: "Frontend", level: 82 },
  { name: "Next.js", category: "Frontend", level: 80 },
  { name: "Tailwind CSS", category: "Frontend", level: 76 },
  { name: "Node.js", category: "Backend", level: 75 },
  { name: "FastAPI", category: "Backend", level: 72 },
  { name: "PostgreSQL", category: "Database", level: 70 },
  { name: "MongoDB", category: "Database", level: 68 },
  { name: "Git", category: "Tools", level: 78 },
  { name: "Docker", category: "Tools", level: 70 },
];

export default function TechStack({ skills, appearance }: TechStackProps) {
  const technologies = skills && skills.length > 0 ? skills : defaultSkills;
  const sectionBg = appearance?.sections?.skills;

  return (
    <section
      id="skills"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--app-bg)]"
      style={sectionBg ? { background: sectionBg } : undefined}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)]">
            Skills & Technologies
          </h2>
          <p className="mt-4 text-[var(--app-muted)] max-w-2xl mx-auto">
            Technologies I work with to build modern, scalable applications
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {technologies.map((tech) => {
            const level =
              typeof tech.level === "number" ? Math.max(0, Math.min(100, tech.level)) : 75;
            return (
              <div
                key={tech.name}
                className="flex flex-col items-center justify-center p-4 bg-[var(--app-card)] rounded-xl border border-[var(--app-border)] hover:border-[var(--app-accent)] transition-colors group"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-[var(--app-bg)] rounded-lg mb-3 transition-colors">
                  <span className="text-lg font-bold text-[var(--app-muted)] group-hover:text-[var(--app-accent)]">
                    {tech.name.slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--app-text)] text-center">
                  {tech.name}
                </span>
                <span className="text-xs text-[var(--app-muted)] mt-1">
                  {tech.category}
                </span>
                <div className="w-full mt-3">
                  <div className="h-1.5 w-full bg-[var(--app-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--app-accent)] transition-all"
                      style={{ width: `${level}%` }}
                      aria-label={`${tech.name} skill level ${level}%`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
