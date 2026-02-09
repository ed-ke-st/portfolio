import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import DesignSection from "@/components/DesignSection";
import TechStack from "@/components/TechStack";
import { getProjects } from "@/lib/api";
import { getDesigns } from "@/lib/designs";
import { getSettings, AllSettings } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import { Project } from "@/types/project";
import { DesignWork } from "@/types/design";

export default async function Home() {
  let projects: Project[] = [];
  let designs: DesignWork[] = [];
  let settings: AllSettings = {};

  try {
    [projects, designs, settings] = await Promise.all([
      getProjects(),
      getDesigns(),
      getSettings(),
    ]);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
  const resolved = resolveAppearance(settings.appearance);

  return (
    <>
      <Hero settings={settings.hero} appearance={resolved.active} />
      <Projects projects={projects} appearance={resolved.active} />
      <DesignSection designs={designs} appearance={resolved.active} />
      <TechStack
        skills={settings.skills}
        skillCategories={settings.skill_categories as import("@/lib/settings-api").SkillCategory[] | undefined}
        appearance={resolved.active}
      />
    </>
  );
}
