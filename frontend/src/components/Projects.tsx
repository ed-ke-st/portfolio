import { Project } from "@/types/project";
import { AppearanceSettings } from "@/lib/settings-api";
import ProjectCard from "./ProjectCard";

interface ProjectsProps {
  projects: Project[];
  appearance?: AppearanceSettings;
}

export default function Projects({ projects, appearance }: ProjectsProps) {
  const sectionBg = appearance?.sections?.projects;
  return (
    <section
      id="projects"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--app-bg)]"
      style={sectionBg ? { background: sectionBg } : undefined}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)]">
            Featured Dev Projects
          </h2>
          <p className="mt-4 text-[var(--app-muted)] max-w-2xl mx-auto">
            A selection of development projects showcasing my full-stack skills
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
