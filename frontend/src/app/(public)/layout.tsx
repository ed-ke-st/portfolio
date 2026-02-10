import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings, AllSettings } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: AllSettings = {};

  try {
    settings = await getSettings();
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  const resolved = resolveAppearance(settings.appearance);

  return (
    <div
      style={{
        ["--app-accent" as string]: resolved.active.accent,
        ["--app-bg" as string]: resolved.active.background,
        ["--app-text" as string]: resolved.active.text,
        ["--app-muted" as string]: resolved.active.muted,
        ["--app-card" as string]: resolved.active.card,
        ["--app-border" as string]: resolved.active.border,
        ["--background" as string]: resolved.active.background,
        ["--foreground" as string]: resolved.active.text,
      }}
    >
      <Navbar />
      <main>{children}</main>
      <Footer appearance={resolved.active} />
    </div>
  );
}
