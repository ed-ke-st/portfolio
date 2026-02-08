import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import TechStack from "@/components/TechStack";
import { getProjects } from "@/lib/api";
import { Project } from "@/types/project";

export default async function Home() {
  let projects: Project[] = [];

  try {
    projects = await getProjects();
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }

  return (
    <>
      <Hero />
      <Projects projects={projects} />
      <TechStack />
    </>
  );
}
