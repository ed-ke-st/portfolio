import { Project } from "@/types/project";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative bg-[var(--app-card)] rounded-xl border border-[var(--app-border)] overflow-hidden hover:border-[var(--app-accent)] transition-all duration-300 hover:shadow-lg">
      {/* Project Image */}
      <div className="aspect-video bg-[var(--app-bg)] flex items-center justify-center overflow-hidden">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[var(--app-muted)] text-sm">
            Project Preview
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-[var(--app-text)] group-hover:text-[var(--app-accent)] transition-colors">
          {project.title}
        </h3>

        <p className="mt-2 text-[var(--app-muted)] text-sm line-clamp-2">
          {project.description}
        </p>

        {/* Tech Stack */}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech_stack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 text-xs font-medium bg-[var(--app-bg)] text-[var(--app-text)] rounded-md"
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 4 && (
            <span className="px-2 py-1 text-xs font-medium bg-[var(--app-bg)] text-[var(--app-muted)] rounded-md">
              +{project.tech_stack.length - 4} more
            </span>
          )}
        </div>

        {/* Links */}
        <div className="mt-6 flex gap-4">
          {project.github_link && (
            <Link
              href={project.github_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
              Code
            </Link>
          )}
          {project.live_url && (
            <Link
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Live Demo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
