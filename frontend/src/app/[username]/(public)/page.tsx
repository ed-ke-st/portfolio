import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import DesignSection from "@/components/DesignSection";
import TechStack from "@/components/TechStack";
import CVCard from "@/components/CVCard";
import { getProjectsForUser } from "@/lib/api";
import { getDesignsForUser } from "@/lib/designs";
import { getSettingsForUser, AllSettings, SkillCategory } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";
import { getSiteBasePath } from "@/lib/site-path";
import { Project } from "@/types/project";
import { DesignWork } from "@/types/design";

export default async function UserHome({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let projects: Project[] = [];
  let designs: DesignWork[] = [];
  let settings: AllSettings = {};

  try {
    [projects, designs, settings] = await Promise.all([
      getProjectsForUser(username),
      getDesignsForUser(username),
      getSettingsForUser(username),
    ]);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
  const resolved = resolveAppearance(settings.appearance);
  const basePath = await getSiteBasePath(username);

  return (
    <>
      <Hero settings={settings.hero} appearance={resolved.active} />
      <Projects projects={projects} appearance={resolved.active} basePath={basePath} />
      <DesignSection designs={designs} appearance={resolved.active} basePath={basePath} />
      <TechStack
        skills={settings.skills}
        skillCategories={settings.skill_categories as SkillCategory[] | undefined}
        appearance={resolved.active}
      />
      <CVCard username={username} cv={settings.cv} appearance={resolved.active} basePath={basePath} />
    </>
  );
}
