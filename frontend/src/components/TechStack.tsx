import { AppearanceSettings, Skill, SkillCategory } from "@/lib/settings-api";

interface TechStackProps {
  skills?: Skill[];
  skillCategories?: SkillCategory[];
  appearance?: AppearanceSettings;
}

const defaultSkills: Skill[] = [
  { name: "TypeScript", category: "Languages", mainCategory: "Development", level: 85 },
  { name: "JavaScript", category: "Languages", mainCategory: "Development", level: 80 },
  { name: "Python", category: "Languages", mainCategory: "Development", level: 78 },
  { name: "React", category: "Frontend", mainCategory: "Development", level: 82 },
  { name: "Next.js", category: "Frontend", mainCategory: "Development", level: 80 },
  { name: "Tailwind CSS", category: "Frontend", mainCategory: "Development", level: 76 },
  { name: "Node.js", category: "Backend", mainCategory: "Development", level: 75 },
  { name: "FastAPI", category: "Backend", mainCategory: "Development", level: 72 },
  { name: "PostgreSQL", category: "Database", mainCategory: "Development", level: 70 },
  { name: "MongoDB", category: "Database", mainCategory: "Development", level: 68 },
  { name: "Git", category: "Tools", mainCategory: "Development", level: 78 },
  { name: "Docker", category: "Tools", mainCategory: "Development", level: 70 },
];

export default function TechStack({ skills, skillCategories, appearance }: TechStackProps) {
  const technologies = skills && skills.length > 0 ? skills : defaultSkills;
  const sectionBg = appearance?.sections?.skills;

  // Group skills by main category
  const groupedSkills = technologies.reduce((acc, skill) => {
    const mainCat = skill.mainCategory || "Other";
    if (!acc[mainCat]) acc[mainCat] = [];
    acc[mainCat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Get ordered main categories (use skillCategories order if available)
  const mainCategoryOrder = skillCategories?.map((c) => c.name) || Object.keys(groupedSkills);
  const orderedMainCategories = mainCategoryOrder.filter((cat) => groupedSkills[cat]?.length > 0);

  // Check if we have main categories to group by
  const hasMainCategories = orderedMainCategories.length > 1 ||
    (orderedMainCategories.length === 1 && orderedMainCategories[0] !== "Other");

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

        {hasMainCategories ? (
          // Grouped display
          <div className="space-y-10">
            {orderedMainCategories.map((mainCategory) => (
              <div key={mainCategory}>
                <h3 className="text-xl font-semibold text-[var(--app-text)] mb-4 text-center">
                  {mainCategory}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {groupedSkills[mainCategory].map((tech) => (
                    <SkillCard key={tech.name} skill={tech} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat display (no main categories)
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {technologies.map((tech) => (
              <SkillCard key={tech.name} skill={tech} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function resolveSkillBadge(skill: Skill): string {
  const custom = (skill.abbreviation || "").trim();
  if (custom) return custom;
  const fallback = skill.name.trim().slice(0, 2);
  return fallback || "--";
}

function SkillCard({ skill }: { skill: Skill }) {
  const level = typeof skill.level === "number" ? Math.max(0, Math.min(100, skill.level)) : 75;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[var(--app-card)] rounded-xl border border-[var(--app-border)] hover:border-[var(--app-accent)] transition-colors group">
      <div className="w-12 h-12 flex items-center justify-center bg-[var(--app-bg)] rounded-lg mb-3 transition-colors">
        <span className="text-lg font-bold text-[var(--app-muted)] group-hover:text-[var(--app-accent)]">
          {resolveSkillBadge(skill)}
        </span>
      </div>
      <span className="text-sm font-medium text-[var(--app-text)] text-center">
        {skill.name}
      </span>
      <span className="text-xs text-[var(--app-muted)] mt-1">
        {skill.category}
      </span>
      <div className="w-full mt-3">
        <div className="h-1.5 w-full bg-[var(--app-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--app-accent)] transition-all"
            style={{ width: `${level}%` }}
            aria-label={`${skill.name} skill level ${level}%`}
          />
        </div>
      </div>
    </div>
  );
}
