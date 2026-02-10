import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettingsForUser, AllSettings } from "@/lib/settings-api";
import { resolveAppearance } from "@/lib/appearance";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let settings: AllSettings = {};

  try {
    settings = await getSettingsForUser(username);
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
      <Navbar username={username} />
      <main>{children}</main>
      <Footer
        appearance={resolved.active}
        contact={settings.contact}
        footer={settings.footer}
      />
    </div>
  );
}
