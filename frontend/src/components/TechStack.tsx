const technologies = [
  { name: "TypeScript", category: "Language" },
  { name: "JavaScript", category: "Language" },
  { name: "Python", category: "Language" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "FastAPI", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "Git", category: "Tools" },
  { name: "Docker", category: "Tools" },
];

export default function TechStack() {
  return (
    <section id="skills" className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
            Skills & Technologies
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Technologies I work with to build modern, scalable applications
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-700 rounded-lg mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <span className="text-lg font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {tech.name.slice(0, 2)}
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-white text-center">
                {tech.name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                {tech.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
