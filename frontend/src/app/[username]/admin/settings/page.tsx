"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  getAdminSettings,
  updateSetting,
  HeroSettings,
  Skill,
  SkillCategory,
  ContactSettings,
  CVSettings,
  CVExperience,
  CVEducation,
  CVCertification,
  CVAward,
  FooterSettings,
  AppearanceSettings,
  IntegrationsSettings,
} from "@/lib/settings-api";
import {
  uploadFile,
  MediaAsset,
  uploadPlatformImageToBlob,
  setCustomDomain,
  syncPlatformConfigToEdge,
  testCloudinary,
  getDomainStatus,
  getSuperAdminPlatformHero,
  updateSuperAdminPlatformHero,
} from "@/lib/admin-api";
import { getMe, getToken, User } from "@/lib/auth";
import { defaultPlatformHero, PlatformHeroSettings } from "@/lib/platform-config";
import MediaLibraryModal from "@/components/MediaLibraryModal";

type TabType = "appearance" | "personal" | "footer" | "integrations" | "domain" | "platform";

interface SettingsPageClientProps {
  forcedTab?: TabType;
  hideTabs?: boolean;
  pageTitle?: string;
}

export function SettingsPageClient({
  forcedTab,
  hideTabs = false,
  pageTitle = "Site Settings",
}: SettingsPageClientProps = {}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(forcedTab || "appearance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [integrationMessage, setIntegrationMessage] = useState("");

  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
  const [uploadingCvPdf, setUploadingCvPdf] = useState(false);

  // Preview state
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Domain state
  const [domainValue, setDomainValue] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [domainStatus, setDomainStatus] = useState<"not_set" | "unconfigured" | "not_verified" | "verified">("not_set");
  const [domainExpectedA, setDomainExpectedA] = useState<string | null>(null);
  const [domainExpectedCname, setDomainExpectedCname] = useState<string | null>(null);
  const [domainExpectedNs, setDomainExpectedNs] = useState<string[]>([]);
  const [domainFoundNs, setDomainFoundNs] = useState<string[]>([]);
  const [domainSiteStatus, setDomainSiteStatus] = useState<"unchecked" | "propagating" | "reachable">("unchecked");
  const [domainSiteChecks, setDomainSiteChecks] = useState<{
    https?: { ok: boolean; status_code?: number; error?: string } | null;
    http?: { ok: boolean; status_code?: number; error?: string } | null;
  } | null>(null);
  const [platformHero, setPlatformHero] = useState<PlatformHeroSettings>(defaultPlatformHero);
  const [uploadingPlatformHeroBg, setUploadingPlatformHeroBg] = useState(false);
  const [mediaLibraryTarget, setMediaLibraryTarget] = useState<"hero_bg" | "cv_photo" | "platform_hero_bg" | null>(null);
  const isApexDomain = domainValue && !domainValue.includes(".")
    ? false
    : Boolean(domainValue && domainValue.split(".").length === 2);

  // Settings state
  const [hero, setHero] = useState<HeroSettings>({
    title: "",
    highlight: "",
    subtitle: "",
    cta_primary: "",
    cta_secondary: "",
    background_image: "",
    background_overlay: 50,
    use_custom_colors: false,
    text_color: "",
    subtitle_color: "",
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState({ name: "", category: "", mainCategory: "", level: 75 });
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [newMainCategory, setNewMainCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [selectedMainCategoryForSub, setSelectedMainCategoryForSub] = useState("");

  const [contact, setContact] = useState<ContactSettings>({
    heading: "",
    subheading: "",
    email: "",
    github: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    phone: "",
  });

  const [cv, setCv] = useState<CVSettings>({
    enabled: false,
    show_on_home: true,
    title: "Curriculum Vitae",
    headline: "",
    summary: "",
    location: "",
    website: "",
    photo_url: "",
    pdf_url: "",
    use_custom_appearance: false,
    appearance: {
      accent: "",
      background: "",
      text: "",
      muted: "",
      card: "",
      border: "",
    },
    experience: [],
    education: [],
    certifications: [],
    awards: [],
  });

  const [footer, setFooter] = useState<FooterSettings>({
    copyright: "",
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    accent: "#2563eb",
    background: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
    card: "#f4f4f5",
    border: "#e4e4e7",
    sections: {
      hero: "",
      projects: "",
      designs: "",
      skills: "",
      footer: "",
    },
    dark_mode: false,
    dark: {
      accent: "#60a5fa",
      background: "#0b0f1a",
      text: "#e5e7eb",
      muted: "#9ca3af",
      card: "#111827",
      border: "#1f2937",
      sections: {
        hero: "",
        projects: "",
        designs: "",
        skills: "",
        footer: "",
      },
    },
  });

  const [integrations, setIntegrations] = useState<IntegrationsSettings>({
    cloudinary_url: "",
    screenshotone_access_key: "",
  });
  const [showCloudinaryUrl, setShowCloudinaryUrl] = useState(false);
  const [showScreenshotKey, setShowScreenshotKey] = useState(false);

  const createItemId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
      return;
    }
    const tab = searchParams.get("tab");
    if (tab && ["appearance", "personal", "skills", "contact", "footer", "integrations", "domain", "platform"].includes(tab)) {
      if (tab === "skills" || tab === "contact") {
        setActiveTab("personal");
      } else {
        setActiveTab(tab as TabType);
      }
    }
  }, [searchParams, forcedTab]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch user info for domain tab
        const token = getToken();
        if (token) {
          const user = await getMe(token);
          setCurrentUser(user);
          setDomainValue(user.custom_domain || "");
          if (user.super_admin) {
            try {
              const superHero = await getSuperAdminPlatformHero();
              setPlatformHero({ ...defaultPlatformHero, ...superHero });
            } catch (err) {
              console.error("Failed to fetch platform hero settings:", err);
            }
          }
          try {
            const status = await getDomainStatus();
            setDomainStatus(status.status);
            setDomainExpectedA(status.expected_a || null);
            setDomainExpectedCname(status.expected_cname || null);
            setDomainExpectedNs(status.expected_ns || []);
            setDomainFoundNs(status.found_ns || []);
            setDomainSiteStatus(status.site_status || "unchecked");
            setDomainSiteChecks(status.site_checks || null);
          } catch (err) {
            console.error("Failed to fetch domain status:", err);
          }
        }

        const data = await getAdminSettings();
        if (data.hero) setHero(data.hero);
        if (data.skills) {
          setSkills(
            data.skills.map((s) => ({
              ...s,
              level: typeof s.level === "number" ? s.level : 75,
            }))
          );
        }
        if (data.skill_categories) {
          if (Array.isArray(data.skill_categories) && data.skill_categories.length > 0) {
            if (typeof data.skill_categories[0] === "string") {
              const converted: SkillCategory[] = (data.skill_categories as string[]).map((cat) => ({
                name: cat,
                subcategories: [],
              }));
              setSkillCategories(converted);
            } else {
              setSkillCategories(data.skill_categories as SkillCategory[]);
            }
          }
        } else if (data.skills) {
          const mainCats = new Map<string, Set<string>>();
          data.skills.forEach((s) => {
            const main = s.mainCategory || "Other";
            if (!mainCats.has(main)) mainCats.set(main, new Set());
            if (s.category) mainCats.get(main)!.add(s.category);
          });
          const converted: SkillCategory[] = Array.from(mainCats.entries()).map(([name, subs]) => ({
            name,
            subcategories: Array.from(subs),
          }));
          setSkillCategories(converted);
        }
        if (data.contact) setContact(data.contact);
        if (data.cv) {
          const cvData = data.cv;
          setCv((prev) => ({
            ...prev,
            ...cvData,
            experience: (cvData.experience || []).map((item: CVExperience) => ({
              id: item.id || createItemId(),
              ...item,
            })),
            education: (cvData.education || []).map((item: CVEducation) => ({
              id: item.id || createItemId(),
              ...item,
            })),
            certifications: (cvData.certifications || []).map((item: CVCertification) => ({
              id: item.id || createItemId(),
              ...item,
            })),
            awards: (cvData.awards || []).map((item: CVAward) => ({
              id: item.id || createItemId(),
              ...item,
            })),
          }));
        }
        if (data.footer) setFooter(data.footer);
        if (data.appearance) {
          const appearanceData = data.appearance;
          setAppearance((prev) => ({
            ...prev,
            ...appearanceData,
            sections: {
              ...prev.sections,
              ...(appearanceData.sections || {}),
            },
          }));
        }
        if (data.integrations) {
          setIntegrations({
            cloudinary_url: data.integrations.cloudinary_url || "",
            screenshotone_access_key: data.integrations.screenshotone_access_key || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "platform" && currentUser && !currentUser.super_admin) {
      setActiveTab("appearance");
    }
  }, [activeTab, currentUser]);

  const handleSave = async (key: string, value: unknown) => {
    setSaving(true);
    setMessage("");
    try {
      await updateSetting(key, value);
      setMessage("Saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomain = async () => {
    setSaving(true);
    setMessage("");
    try {
      await setCustomDomain(domainValue.trim());
      setMessage("Domain saved!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save domain");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.name && newSkill.category && newSkill.mainCategory) {
      const updated = [...skills, newSkill];
      setSkills(updated);
      setNewSkill({ name: "", category: "", mainCategory: "", level: 75 });
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addMainCategory = () => {
    const trimmed = newMainCategory.trim();
    if (!trimmed) return;
    if (!skillCategories.find((c) => c.name === trimmed)) {
      setSkillCategories([...skillCategories, { name: trimmed, subcategories: [] }]);
    }
    setNewMainCategory("");
  };

  const removeMainCategory = (index: number) => {
    setSkillCategories(skillCategories.filter((_, i) => i !== index));
  };

  const addSubCategory = () => {
    const trimmed = newSubCategory.trim();
    if (!trimmed || !selectedMainCategoryForSub) return;
    setSkillCategories(
      skillCategories.map((cat) =>
        cat.name === selectedMainCategoryForSub && !cat.subcategories.includes(trimmed)
          ? { ...cat, subcategories: [...cat.subcategories, trimmed] }
          : cat
      )
    );
    setNewSubCategory("");
  };

  const removeSubCategory = (mainIndex: number, subIndex: number) => {
    setSkillCategories(
      skillCategories.map((cat, i) =>
        i === mainIndex
          ? { ...cat, subcategories: cat.subcategories.filter((_, si) => si !== subIndex) }
          : cat
      )
    );
  };

  const getSubcategories = (mainCategory: string) => {
    const cat = skillCategories.find((c) => c.name === mainCategory);
    return cat?.subcategories || [];
  };

  const sanitizePhone = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.replace(/[^\d+]/g, "");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return value;
  };

  const handleSelectMediaAsset = (asset: MediaAsset) => {
    if (mediaLibraryTarget === "hero_bg") {
      setHero((prev) => ({ ...prev, background_image: asset.url }));
    } else if (mediaLibraryTarget === "cv_photo") {
      setCv((prev) => ({ ...prev, photo_url: asset.url }));
    } else if (mediaLibraryTarget === "platform_hero_bg") {
      setPlatformHero((prev) => ({ ...prev, background_image: asset.url }));
    }
    setMediaLibraryTarget(null);
  };

  const normalizeCv = (current: CVSettings): CVSettings => ({
    ...current,
    experience: current.experience.map((item) => ({
      ...item,
      highlights: (item.highlights || []).filter((h) => h.trim().length > 0),
    })),
    education: current.education.map((item) => ({ ...item })),
    certifications: current.certifications.map((item) => ({ ...item })),
    awards: current.awards.map((item) => ({ ...item })),
  });

  const tabs = [
    { id: "appearance" as TabType, label: "Appearance" },
    { id: "footer" as TabType, label: "Footer" },
    { id: "integrations" as TabType, label: "Integrations" },
    { id: "domain" as TabType, label: "Domain" },
    ...(currentUser?.super_admin
      ? [{ id: "platform" as TabType, label: "Platform Hero" }]
      : []),
  ];

  const isHexColor = (value: string | undefined) => Boolean(value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value));
  const normalizeHex = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("#")) return trimmed;
    return `#${trimmed}`;
  };
  const resolveColor = (value: string | undefined, fallback: string): string =>
    isHexColor(value) && value ? value : fallback;
  const previewPalette = appearance.dark_mode && appearance.dark
    ? {
        accent: resolveColor(appearance.dark.accent, "#60a5fa"),
        background: resolveColor(appearance.dark.background, "#0b0f1a"),
        text: resolveColor(appearance.dark.text, "#e5e7eb"),
        muted: resolveColor(appearance.dark.muted, "#9ca3af"),
        card: resolveColor(appearance.dark.card, "#111827"),
        border: resolveColor(appearance.dark.border, "#1f2937"),
      }
    : {
        accent: resolveColor(appearance.accent, "#2563eb"),
        background: resolveColor(appearance.background, "#ffffff"),
        text: resolveColor(appearance.text, "#111827"),
        muted: resolveColor(appearance.muted, "#6b7280"),
        card: resolveColor(appearance.card, "#f4f4f5"),
        border: resolveColor(appearance.border, "#e4e4e7"),
      };
  const cvPreviewPalette = cv.use_custom_appearance
    ? {
        accent: resolveColor(cv.appearance?.accent, previewPalette.accent),
        background: resolveColor(cv.appearance?.background, previewPalette.background),
        text: resolveColor(cv.appearance?.text, previewPalette.text),
        muted: resolveColor(cv.appearance?.muted, previewPalette.muted),
        card: resolveColor(cv.appearance?.card, previewPalette.card),
        border: resolveColor(cv.appearance?.border, previewPalette.border),
      }
    : previewPalette;

  if (loading) {
    return <p className="text-zinc-500">Loading settings...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {pageTitle}
        </h1>
        {message && (
          <span className={`text-sm ${message.includes("Failed") || message.includes("failed") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </span>
        )}
      </div>

      {/* Tabs */}
      {!hideTabs && (
        <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="relative">
          {/* Mobile Preview Button */}
          <button
            onClick={() => setShowMobilePreview(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
            aria-label="Show preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Mobile Preview Modal */}
          {showMobilePreview && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md overflow-hidden">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preview</p>
                  <button onClick={() => setShowMobilePreview(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="relative min-h-[200px] flex items-center justify-center p-4" style={{ background: hero.background_image ? undefined : appearance.sections?.hero || previewPalette.background }}>
                  {hero.background_image && (
                    <>
                      <Image src={hero.background_image} alt="" fill className="object-cover" />
                      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${(hero.background_overlay ?? 50) / 100})` }} />
                    </>
                  )}
                  <div className="relative z-10 text-center">
                    <h1 className="text-xl font-bold mb-2" style={{ color: hero.use_custom_colors && hero.text_color ? hero.text_color : (hero.background_image ? "#ffffff" : previewPalette.text) }}>
                      {hero.title || "Hello, I'm"}{" "}
                      <span className="whitespace-pre-wrap" style={{ color: hero.use_custom_colors && hero.highlight_color ? hero.highlight_color : previewPalette.accent }}>{hero.highlight || "Your Name"}</span>
                    </h1>
                    <p className="text-xs mb-3" style={{ color: hero.use_custom_colors && hero.subtitle_color ? hero.subtitle_color : (hero.background_image ? "rgba(255,255,255,0.8)" : previewPalette.muted) }}>
                      {hero.subtitle || "A passionate developer"}
                    </p>
                    <button className="px-3 py-1 text-xs font-medium text-white rounded-full" style={{ backgroundColor: previewPalette.accent }}>
                      {hero.cta_primary || "View Dev Projects"}
                    </button>
                  </div>
                </div>
                <div className="p-4" style={{ background: previewPalette.background }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg" style={{ background: previewPalette.card, border: `1px solid ${previewPalette.border}` }}>
                      <p className="text-[10px]" style={{ color: previewPalette.muted }}>Muted</p>
                      <p className="text-xs mt-0.5" style={{ color: previewPalette.text }}>Card</p>
                      <div className="h-1 w-full rounded-full mt-2 overflow-hidden" style={{ background: previewPalette.border }}>
                        <div className="h-full w-2/3" style={{ background: previewPalette.accent }} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: previewPalette.card, border: `1px solid ${previewPalette.border}` }}>
                      <p className="text-[10px]" style={{ color: previewPalette.muted }}>Secondary</p>
                      <p className="text-xs mt-0.5" style={{ color: previewPalette.text }}>Text</p>
                      <span className="inline-flex mt-2 text-[10px]" style={{ color: previewPalette.accent }}>View →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Panel */}
            <div className="space-y-4">
              {/* Global Colors */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme Colors</p>
                  <button onClick={() => setShowColorPicker(!showColorPicker)} className="lg:hidden p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </button>
                </div>
                <div className={`${showColorPicker ? "block" : "hidden"} lg:block`}>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { key: "accent", label: "Accent" },
                      { key: "background", label: "BG" },
                      { key: "text", label: "Text" },
                      { key: "muted", label: "Muted" },
                      { key: "card", label: "Card" },
                      { key: "border", label: "Border" },
                    ].map(({ key, label }) => (
                      <div key={key} className="text-center">
                        <input
                          type="color"
                          value={isHexColor(appearance[key as keyof typeof appearance] as string) ? appearance[key as keyof typeof appearance] as string : "#000000"}
                          onChange={(e) => setAppearance({ ...appearance, [key]: e.target.value })}
                          className="w-full h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1 truncate">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hero BG override */}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <input type="color" value={isHexColor(appearance.sections?.hero || "") ? appearance.sections!.hero! : previewPalette.background} onChange={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: e.target.value } })} className="w-8 h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer" />
                      </div>
                      <input type="text" value={appearance.sections?.hero || ""} onChange={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: e.target.value } })} onBlur={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: normalizeHex(e.target.value) } })} className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" placeholder="Hero BG (optional)" />
                      {appearance.sections?.hero && (
                        <button onClick={() => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: "" } })} className="text-xs text-red-500">Clear</button>
                      )}
                    </div>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <input type="checkbox" checked={Boolean(appearance.dark_mode)} onChange={(e) => setAppearance({ ...appearance, dark_mode: e.target.checked })} className="w-4 h-4 rounded" />
                      Enable dark mode
                    </label>
                  </div>

                  {/* Section Backgrounds */}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 mb-2">Section Backgrounds</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "projects", label: "Dev Projects" },
                        { key: "designs", label: "Design Projects" },
                        { key: "skills", label: "Skills" },
                        { key: "footer", label: "Footer" },
                      ].map(({ key, label }) => (
                        <div key={key} className="text-center">
                          <input type="color" value={isHexColor(appearance.sections?.[key as keyof typeof appearance.sections] || "") ? appearance.sections![key as keyof typeof appearance.sections]! : previewPalette.background} onChange={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, [key]: e.target.value } })} className="w-full h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer" />
                          <p className="text-[10px] text-zinc-500 mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dark Mode Colors */}
                  {appearance.dark_mode && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-2">Dark Mode Colors</p>
                      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { key: "accent", label: "Accent" },
                          { key: "background", label: "BG" },
                          { key: "text", label: "Text" },
                          { key: "muted", label: "Muted" },
                          { key: "card", label: "Card" },
                          { key: "border", label: "Border" },
                        ].map(({ key, label }) => (
                          <div key={key} className="text-center">
                            <input type="color" value={isHexColor(appearance.dark?.[key as keyof typeof appearance.dark] as string || "") ? appearance.dark![key as keyof typeof appearance.dark] as string : "#000000"} onChange={(e) => setAppearance({ ...appearance, dark: { ...appearance.dark!, [key]: e.target.value } })} className="w-full h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer" />
                            <p className="text-[10px] text-zinc-500 mt-1">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => handleSave("appearance", appearance)} disabled={saving} className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                    {saving ? "Saving..." : "Save Colors"}
                  </button>
                </div>
              </div>

              {/* Hero Content */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Hero Content</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Title</label>
                      <input type="text" value={hero.title} onChange={(e) => setHero((prev) => ({ ...prev, title: e.target.value }))} placeholder="Hello, I'm" className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Highlight</label>
                      <input type="text" value={hero.highlight} onChange={(e) => setHero((prev) => ({ ...prev, highlight: e.target.value }))} placeholder="Your Name" className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Subtitle</label>
                    <textarea value={hero.subtitle} onChange={(e) => setHero((prev) => ({ ...prev, subtitle: e.target.value }))} rows={2} placeholder="A passionate developer..." className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Primary Button</label>
                      <input type="text" value={hero.cta_primary} onChange={(e) => setHero((prev) => ({ ...prev, cta_primary: e.target.value }))} placeholder="View Dev Projects" className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Secondary Button</label>
                      <input type="text" value={hero.cta_secondary} onChange={(e) => setHero((prev) => ({ ...prev, cta_secondary: e.target.value }))} placeholder="Contact Me" className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Hero Text Colors */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <label className="flex items-center gap-3 mb-3">
                  <input type="checkbox" checked={hero.use_custom_colors || false} onChange={(e) => setHero({ ...hero, use_custom_colors: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Custom Hero Text Colors</span>
                </label>
                {hero.use_custom_colors && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {[
                      { key: "text_color", label: "Title Color", fallback: previewPalette.text },
                      { key: "highlight_color", label: "Highlight Color", fallback: previewPalette.accent },
                      { key: "subtitle_color", label: "Subtitle Color", fallback: previewPalette.muted },
                    ].map(({ key, label, fallback }) => (
                      <div key={key}>
                        <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                        <div className="flex gap-2">
                          <input type="color" value={isHexColor(hero[key as keyof HeroSettings] as string || "") ? hero[key as keyof HeroSettings] as string : fallback} onChange={(e) => setHero({ ...hero, [key]: e.target.value })} className="w-10 h-9 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer" />
                          <input type="text" value={(hero[key as keyof HeroSettings] as string) || ""} onChange={(e) => setHero({ ...hero, [key]: e.target.value })} onBlur={(e) => setHero({ ...hero, [key]: normalizeHex(e.target.value) })} placeholder="Auto" className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Background Image */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Background Image</p>
                {hero.background_image && (
                  <div className="mb-3 relative inline-block">
                    <Image src={hero.background_image} alt="Hero background" width={96} height={96} className="h-24 rounded-lg object-cover" />
                    <button type="button" onClick={() => setHero({ ...hero, background_image: "" })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">&times;</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={hero.background_image || ""} onChange={(e) => setHero({ ...hero, background_image: e.target.value })} placeholder="Image URL" className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                  <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                    {uploadingHeroBg ? "..." : "Upload"}
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingHeroBg(true);
                      try {
                        const result = await uploadFile(file);
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                        const imageUrl = result.url.startsWith("http") ? result.url : `${apiUrl}${result.url}`;
                        setHero({ ...hero, background_image: imageUrl });
                      } catch (error) {
                        console.error("Failed to upload:", error);
                      } finally {
                        setUploadingHeroBg(false);
                      }
                    }} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setMediaLibraryTarget("hero_bg")}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200"
                  >
                    Library
                  </button>
                </div>
                {hero.background_image && (
                  <div className="mt-3">
                    <label className="block text-xs text-zinc-500 mb-1">Overlay Darkness ({hero.background_overlay ?? 50}%)</label>
                    <input type="range" min={0} max={80} step={5} value={hero.background_overlay ?? 50} onChange={(e) => setHero({ ...hero, background_overlay: Number(e.target.value) })} className="w-full" />
                  </div>
                )}
              </div>

              <button onClick={() => handleSave("hero", hero)} disabled={saving} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Hero Settings"}
              </button>
            </div>

            {/* Live Preview Panel */}
            <div className="hidden lg:block">
              <div className="sticky top-4">
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Live Preview</p>
                    <div className="flex gap-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg p-0.5">
                      <button onClick={() => setPreviewMode("desktop")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${previewMode === "desktop" ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400"}`}>Desktop</button>
                      <button onClick={() => setPreviewMode("mobile")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${previewMode === "mobile" ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400"}`}>Mobile</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-900">
                    <div className={`relative overflow-hidden rounded-lg transition-all duration-300 ${previewMode === "mobile" ? "w-[280px]" : "w-full"}`} style={{ background: hero.background_image ? undefined : appearance.sections?.hero || previewPalette.background, minHeight: previewMode === "mobile" ? "300px" : "250px" }}>
                      {hero.background_image && (
                        <>
                          <Image src={hero.background_image} alt="" fill className="object-cover" />
                          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${(hero.background_overlay ?? 50) / 100})` }} />
                        </>
                      )}
                      <div className={`relative z-10 h-full flex items-center justify-center ${previewMode === "mobile" ? "p-4" : "p-6"}`}>
                        <div className="text-center max-w-lg">
                          <h1 className={`font-bold mb-3 ${previewMode === "mobile" ? "text-lg" : "text-2xl"}`} style={{ color: hero.use_custom_colors && hero.text_color ? hero.text_color : (hero.background_image ? "#ffffff" : previewPalette.text) }}>
                            {hero.title || "Hello, I'm"}{" "}
                            <span className="whitespace-pre-wrap" style={{ color: hero.use_custom_colors && hero.highlight_color ? hero.highlight_color : previewPalette.accent }}>{hero.highlight || "Your Name"}</span>
                          </h1>
                          <p className={`mb-4 ${previewMode === "mobile" ? "text-xs" : "text-sm"}`} style={{ color: hero.use_custom_colors && hero.subtitle_color ? hero.subtitle_color : (hero.background_image ? "rgba(255,255,255,0.8)" : previewPalette.muted) }}>
                            {hero.subtitle || "A passionate developer creating amazing experiences"}
                          </p>
                          <div className={`flex gap-2 justify-center ${previewMode === "mobile" ? "flex-col" : ""}`}>
                            <button className={`font-medium text-white rounded-full ${previewMode === "mobile" ? "px-3 py-1.5 text-xs" : "px-4 py-1.5 text-xs"}`} style={{ backgroundColor: previewPalette.accent }}>{hero.cta_primary || "View Dev Projects"}</button>
                            <button className={`font-medium rounded-full border ${previewMode === "mobile" ? "px-3 py-1.5 text-xs" : "px-4 py-1.5 text-xs"}`} style={{ color: hero.background_image ? "#ffffff" : previewPalette.text, borderColor: hero.background_image ? "rgba(255,255,255,0.3)" : previewPalette.border }}>{hero.cta_secondary || "Contact Me"}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4" style={{ background: previewPalette.background }}>
                    <p className="text-xs font-medium mb-3" style={{ color: previewPalette.muted }}>Components Preview</p>
                    <div className={`grid gap-3 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                      <div className="p-4 rounded-lg" style={{ background: previewPalette.card, border: `1px solid ${previewPalette.border}` }}>
                        <p className="text-xs" style={{ color: previewPalette.muted }}>Muted text</p>
                        <p className="text-sm mt-1" style={{ color: previewPalette.text }}>Card content</p>
                        <div className="h-1.5 w-full rounded-full mt-3 overflow-hidden" style={{ background: previewPalette.border }}><div className="h-full w-2/3" style={{ background: previewPalette.accent }} /></div>
                      </div>
                      <div className="p-4 rounded-lg" style={{ background: previewPalette.card, border: `1px solid ${previewPalette.border}` }}>
                        <p className="text-xs" style={{ color: previewPalette.muted }}>Secondary</p>
                        <p className="text-sm mt-1" style={{ color: previewPalette.text }}>Text content</p>
                        <span className="inline-flex mt-3 text-xs" style={{ color: previewPalette.accent }}>View more →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Tab */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enable CV</p>
                <p className="text-xs text-zinc-500">Show a dedicated CV page and home card.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={cv.enabled}
                  onChange={(e) => setCv({ ...cv, enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>
            {cv.enabled && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={cv.show_on_home !== false}
                    onChange={(e) => setCv({ ...cv, show_on_home: e.target.checked })}
                  />
                  Show CV card on home page
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "title", label: "CV Title", type: "text" },
                    { key: "headline", label: "Headline", type: "text" },
                    { key: "location", label: "Location", type: "text" },
                    { key: "website", label: "Website URL", type: "url" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
                      <input
                        type={type}
                        value={cv[key as keyof CVSettings] as string}
                        onChange={(e) => setCv({ ...cv, [key]: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Summary</label>
                  <textarea
                    value={cv.summary}
                    onChange={(e) => setCv({ ...cv, summary: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    <input
                      type="checkbox"
                      checked={Boolean(cv.use_custom_appearance)}
                      onChange={(e) =>
                        setCv({
                          ...cv,
                          use_custom_appearance: e.target.checked,
                          appearance: cv.appearance || {
                            accent: "",
                            background: "",
                            text: "",
                            muted: "",
                            card: "",
                            border: "",
                          },
                        })
                      }
                    />
                    Customize CV Appearance
                  </label>

                  {cv.use_custom_appearance && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: "accent", label: "Accent", fallback: previewPalette.accent },
                        { key: "background", label: "Background", fallback: previewPalette.background },
                        { key: "text", label: "Text", fallback: previewPalette.text },
                        { key: "muted", label: "Muted", fallback: previewPalette.muted },
                        { key: "card", label: "Card", fallback: previewPalette.card },
                        { key: "border", label: "Border", fallback: previewPalette.border },
                      ].map(({ key, label, fallback }) => (
                        <div key={key}>
                          <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={isHexColor(cv.appearance?.[key as keyof NonNullable<CVSettings["appearance"]>] || "")
                                ? cv.appearance?.[key as keyof NonNullable<CVSettings["appearance"]>] as string
                                : fallback}
                              onChange={(e) =>
                                setCv({
                                  ...cv,
                                  appearance: {
                                    ...(cv.appearance || {}),
                                    [key]: e.target.value,
                                  },
                                })
                              }
                              className="w-10 h-9 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={(cv.appearance?.[key as keyof NonNullable<CVSettings["appearance"]>] as string) || ""}
                              onChange={(e) =>
                                setCv({
                                  ...cv,
                                  appearance: {
                                    ...(cv.appearance || {}),
                                    [key]: e.target.value,
                                  },
                                })
                              }
                              onBlur={(e) =>
                                setCv({
                                  ...cv,
                                  appearance: {
                                    ...(cv.appearance || {}),
                                    [key]: normalizeHex(e.target.value),
                                  },
                                })
                              }
                              placeholder="Auto"
                              className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border p-4" style={{ borderColor: cvPreviewPalette.border, background: cvPreviewPalette.background }}>
                    <p className="text-xs mb-2" style={{ color: cvPreviewPalette.muted }}>CV Preview</p>
                    <div className="rounded-lg border p-3" style={{ borderColor: cvPreviewPalette.border, background: cvPreviewPalette.card }}>
                      <p className="text-lg font-semibold whitespace-pre-wrap" style={{ color: cvPreviewPalette.text }}>{hero.highlight || "Your Name"}</p>
                      <p className="text-sm mt-1" style={{ color: cvPreviewPalette.muted }}>{cv.headline || "Your headline"}</p>
                      <div className="mt-3 flex gap-2">
                        <span className="px-2 py-1 rounded text-xs text-white" style={{ background: cvPreviewPalette.accent }}>View CV</span>
                        <span className="px-2 py-1 rounded text-xs border" style={{ borderColor: cvPreviewPalette.border, color: cvPreviewPalette.text }}>Generate PDF</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Photo URL</label>
                  <div className="flex flex-wrap gap-2 items-start">
                    <input
                      type="url"
                      value={cv.photo_url || ""}
                      onChange={(e) => setCv({ ...cv, photo_url: e.target.value })}
                      className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      placeholder="https://..."
                    />
                    <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const result = await uploadFile(file);
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                            const imageUrl = result.url.startsWith("http") ? result.url : `${apiUrl}${result.url}`;
                            setCv({ ...cv, photo_url: imageUrl });
                          } catch (error) {
                            console.error("Failed to upload photo:", error);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setMediaLibraryTarget("cv_photo")}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200 text-sm"
                    >
                      Library
                    </button>
                  </div>
                  {cv.photo_url && (
                    <Image
                      src={cv.photo_url}
                      alt="CV photo preview"
                      width={80}
                      height={80}
                      className="mt-3 h-20 w-20 object-cover rounded-lg border border-zinc-300 dark:border-zinc-600"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">PDF URL</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="url"
                      value={cv.pdf_url || ""}
                      onChange={(e) => setCv({ ...cv, pdf_url: e.target.value })}
                      className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                    />
                    <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                      {uploadingCvPdf ? "Uploading..." : "Upload PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingCvPdf(true);
                          try {
                            const result = await uploadFile(file);
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                            const fileUrl = result.url.startsWith("http") ? result.url : `${apiUrl}${result.url}`;
                            setCv({ ...cv, pdf_url: fileUrl });
                          } catch (error) {
                            console.error("Failed to upload PDF:", error);
                          } finally {
                            setUploadingCvPdf(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => handleSave("cv", normalizeCv(cv))}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save CV Settings"}
                </button>
              </div>
            )}
          </div>

          {cv.enabled && (
            <>
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Experience</p>
                  <button
                    onClick={() =>
                      setCv({
                        ...cv,
                        experience: [
                          ...cv.experience,
                          {
                            id: createItemId(),
                            company: "",
                            role: "",
                            location: "",
                            start: "",
                            end: "",
                            summary: "",
                            highlights: [],
                          } as CVExperience,
                        ],
                      })
                    }
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-4">
                  {cv.experience.map((item, index) => (
                    <div key={item.id || `${item.company}-${index}`} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: "company", label: "Company" },
                          { key: "role", label: "Role" },
                          { key: "location", label: "Location" },
                          { key: "start", label: "Start (e.g., 2022)" },
                          { key: "end", label: "End (or Present)" },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                            <input
                              type="text"
                              value={item[key as keyof CVExperience] as string}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                updated[index] = { ...updated[index], [key]: e.target.value };
                                setCv({ ...cv, experience: updated });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Summary</label>
                        <textarea
                          value={item.summary || ""}
                          onChange={(e) => {
                            const updated = [...cv.experience];
                            updated[index] = { ...updated[index], summary: e.target.value };
                            setCv({ ...cv, experience: updated });
                          }}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Highlights (one per line)</label>
                        <textarea
                          value={(item.highlights || []).join("\n")}
                          onChange={(e) => {
                            const updated = [...cv.experience];
                            updated[index] = {
                              ...updated[index],
                              highlights: e.target.value.split("\n"),
                            };
                            setCv({ ...cv, experience: updated });
                          }}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => setCv({ ...cv, experience: cv.experience.filter((_, i) => i !== index) })}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Education</p>
                  <button
                    onClick={() =>
                      setCv({
                        ...cv,
                        education: [
                          ...cv.education,
                          {
                            id: createItemId(),
                            institution: "",
                            degree: "",
                            field: "",
                            location: "",
                            start: "",
                            end: "",
                            summary: "",
                          } as CVEducation,
                        ],
                      })
                    }
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-4">
                  {cv.education.map((item, index) => (
                    <div key={item.id || `${item.institution}-${index}`} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: "institution", label: "Institution" },
                          { key: "degree", label: "Degree" },
                          { key: "field", label: "Field" },
                          { key: "location", label: "Location" },
                          { key: "start", label: "Start" },
                          { key: "end", label: "End" },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                            <input
                              type="text"
                              value={item[key as keyof CVEducation] as string}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                updated[index] = { ...updated[index], [key]: e.target.value };
                                setCv({ ...cv, education: updated });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Summary</label>
                        <textarea
                          value={item.summary || ""}
                          onChange={(e) => {
                            const updated = [...cv.education];
                            updated[index] = { ...updated[index], summary: e.target.value };
                            setCv({ ...cv, education: updated });
                          }}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => setCv({ ...cv, education: cv.education.filter((_, i) => i !== index) })}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Certifications</p>
                  <button
                    onClick={() =>
                      setCv({
                        ...cv,
                        certifications: [
                          ...cv.certifications,
                          { id: createItemId(), name: "", issuer: "", year: "", url: "" } as CVCertification,
                        ],
                      })
                    }
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-4">
                  {cv.certifications.map((item, index) => (
                    <div key={item.id || `${item.name}-${index}`} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: "name", label: "Name" },
                          { key: "issuer", label: "Issuer" },
                          { key: "year", label: "Year" },
                          { key: "url", label: "Credential URL" },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                            <input
                              type="text"
                              value={item[key as keyof CVCertification] as string}
                              onChange={(e) => {
                                const updated = [...cv.certifications];
                                updated[index] = { ...updated[index], [key]: e.target.value };
                                setCv({ ...cv, certifications: updated });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setCv({ ...cv, certifications: cv.certifications.filter((_, i) => i !== index) })}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Awards</p>
                  <button
                    onClick={() =>
                      setCv({
                        ...cv,
                        awards: [
                          ...cv.awards,
                          { id: createItemId(), title: "", issuer: "", year: "", description: "" } as CVAward,
                        ],
                      })
                    }
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-4">
                  {cv.awards.map((item, index) => (
                    <div key={item.id || `${item.title}-${index}`} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: "title", label: "Title" },
                          { key: "issuer", label: "Issuer" },
                          { key: "year", label: "Year" },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                            <input
                              type="text"
                              value={item[key as keyof CVAward] as string}
                              onChange={(e) => {
                                const updated = [...cv.awards];
                                updated[index] = { ...updated[index], [key]: e.target.value };
                                setCv({ ...cv, awards: updated });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Description</label>
                        <textarea
                          value={item.description || ""}
                          onChange={(e) => {
                            const updated = [...cv.awards];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setCv({ ...cv, awards: updated });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => setCv({ ...cv, awards: cv.awards.filter((_, i) => i !== index) })}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => handleSave("cv", normalizeCv(cv))}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save CV Sections"}
                </button>
              </div>
            </>
          )}

          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Main Categories</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="New main category (e.g., Development, Design)" value={newMainCategory} onChange={(e) => setNewMainCategory(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                  <button onClick={addMainCategory} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">Add</button>
                </div>
                <div className="space-y-3">
                  {skillCategories.map((cat, mainIndex) => (
                    <div key={cat.name} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-zinc-900 dark:text-white">{cat.name}</span>
                        <button onClick={() => removeMainCategory(mainIndex)} className="text-red-500 hover:text-red-400 text-sm">Remove</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cat.subcategories.map((sub, subIndex) => (
                          <span key={sub} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-sm">
                            {sub}
                            <button onClick={() => removeSubCategory(mainIndex, subIndex)} className="text-red-500 hover:text-red-400">&times;</button>
                          </span>
                        ))}
                        {cat.subcategories.length === 0 && <span className="text-xs text-zinc-500">No subcategories yet</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {skillCategories.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    <select value={selectedMainCategoryForSub} onChange={(e) => setSelectedMainCategoryForSub(e.target.value)} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white">
                      <option value="">Select main category</option>
                      {skillCategories.map((cat) => (<option key={cat.name} value={cat.name}>{cat.name}</option>))}
                    </select>
                    <input type="text" placeholder="New subcategory" value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                    <button onClick={addSubCategory} disabled={!selectedMainCategoryForSub} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">Add Sub</button>
                  </div>
                )}
                <button onClick={() => handleSave("skill_categories", skillCategories)} disabled={saving} className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save Categories"}</button>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Add Skill</p>
                <div className="flex flex-wrap gap-2">
                  <input type="text" placeholder="Skill name" value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} className="flex-1 min-w-[150px] px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                  <select value={newSkill.mainCategory} onChange={(e) => setNewSkill({ ...newSkill, mainCategory: e.target.value, category: "" })} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white">
                    <option value="">Main Category</option>
                    {skillCategories.map((cat) => (<option key={cat.name} value={cat.name}>{cat.name}</option>))}
                  </select>
                  <select value={newSkill.category} onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })} disabled={!newSkill.mainCategory} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-50">
                    <option value="">Subcategory</option>
                    {getSubcategories(newSkill.mainCategory).map((sub) => (<option key={sub} value={sub}>{sub}</option>))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} step={1} value={newSkill.level} onChange={(e) => setNewSkill({ ...newSkill, level: Number(e.target.value) })} className="w-24" />
                    <span className="text-xs text-zinc-500 w-8">{newSkill.level}%</span>
                  </div>
                  <button onClick={addSkill} disabled={!newSkill.name || !newSkill.category || !newSkill.mainCategory} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">Add</button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Skills ({skills.length})</p>
                {skillCategories.map((mainCat) => {
                  const mainSkills = skills.filter((s) => s.mainCategory === mainCat.name);
                  if (mainSkills.length === 0) return null;
                  return (
                    <div key={mainCat.name} className="mb-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">{mainCat.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {mainSkills.map((skill, index) => {
                          const globalIndex = skills.findIndex((s) => s === skill);
                          return (
                            <div key={index} className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                              <span className="text-zinc-900 dark:text-white">{skill.name}</span>
                              <span className="text-xs text-zinc-500">({skill.category})</span>
                              <input type="range" min={0} max={100} step={1} value={typeof skill.level === "number" ? skill.level : 75} onChange={(e) => { const level = Number(e.target.value); setSkills((prev) => prev.map((s, i) => (i === globalIndex ? { ...s, level } : s))); }} className="w-20" />
                              <span className="text-xs text-zinc-500 w-8">{typeof skill.level === "number" ? skill.level : 75}%</span>
                              <button onClick={() => removeSkill(globalIndex)} className="text-red-500 hover:text-red-400">&times;</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {skills.filter((s) => !s.mainCategory).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Uncategorized</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.filter((s) => !s.mainCategory).map((skill, index) => {
                        const globalIndex = skills.findIndex((s) => s === skill);
                        return (
                          <div key={index} className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                            <span className="text-zinc-900 dark:text-white">{skill.name}</span>
                            <span className="text-xs text-zinc-500">({skill.category || "none"})</span>
                            <input type="range" min={0} max={100} step={1} value={typeof skill.level === "number" ? skill.level : 75} onChange={(e) => { const level = Number(e.target.value); setSkills((prev) => prev.map((s, i) => (i === globalIndex ? { ...s, level } : s))); }} className="w-20" />
                            <span className="text-xs text-zinc-500 w-8">{typeof skill.level === "number" ? skill.level : 75}%</span>
                            <button onClick={() => removeSkill(globalIndex)} className="text-red-500 hover:text-red-400">&times;</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => handleSave("skills", skills)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save Skills"}</button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-4">
              {[
                { key: "heading", label: "Heading", type: "text" },
                { key: "subheading", label: "Subheading", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "github", label: "GitHub URL", type: "url" },
                { key: "linkedin", label: "LinkedIn URL", type: "url" },
                { key: "twitter", label: "Twitter/X URL (optional)", type: "url" },
                { key: "instagram", label: "Instagram URL (optional)", type: "url" },
                { key: "phone", label: "Phone (optional)", type: "tel" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
                  <input
                    type={type}
                    value={contact[key as keyof ContactSettings]}
                    onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
              ))}
              <button
                onClick={async () => {
                  const sanitizedPhone = sanitizePhone(contact.phone);
                  await handleSave("contact", { ...contact, phone: sanitizedPhone });
                  setContact((prev) => ({ ...prev, phone: formatPhone(sanitizedPhone) }));
                }}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Contact Settings"}
              </button>
            </div>
          </div>

          </div>

          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">CV Page Preview</p>
                  {currentUser?.username && (
                    <a
                      href={`/${currentUser.username}/cv`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-500"
                    >
                      Open in new tab
                    </a>
                  )}
                </div>
                {cv.enabled && currentUser?.username ? (
                  <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                    <iframe
                      src={`/${currentUser.username}/cv`}
                      title="CV page preview"
                      className="w-full h-[760px] bg-white"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Enable CV to preview the full page.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === "footer" && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Copyright Text</label>
              <input type="text" value={footer.copyright} onChange={(e) => setFooter({ ...footer, copyright: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" placeholder="Your Name. All rights reserved." />
              <p className="text-xs text-zinc-500 mt-1">Year is added automatically</p>
            </div>
            <button onClick={() => handleSave("footer", footer)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save Footer Settings"}</button>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">API Keys</p>
              <p className="text-xs text-zinc-500">
                These are required if you want project screenshots and hosted images.
                Without Cloudinary, uploads fall back to local storage (not recommended on Railway).
              </p>
            </div>

            {integrationMessage && (
              <div className={`text-sm ${integrationMessage.toLowerCase().includes("failed") ? "text-red-500" : "text-green-500"}`}>
                {integrationMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Cloudinary URL
              </label>
              <p className="text-xs text-zinc-500 mb-2">
                Get it from your Cloudinary dashboard under API keys. Format:
                <span className="font-mono"> cloudinary://API_KEY:API_SECRET@CLOUD_NAME</span>
                .{" "}
                <a
                  href="https://cloudinary.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  cloudinary.com
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type={showCloudinaryUrl ? "text" : "password"}
                  value={integrations.cloudinary_url || ""}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, cloudinary_url: e.target.value })
                  }
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
                />
                <button
                  type="button"
                  onClick={() => setShowCloudinaryUrl((s) => !s)}
                  className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-600 dark:text-zinc-300"
                >
                  {showCloudinaryUrl ? "Hide" : "Show"}
                </button>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setIntegrationMessage("");
                  try {
                    await testCloudinary();
                    setIntegrationMessage("Cloudinary connection OK.");
                  } catch (error) {
                    const msg = error instanceof Error ? error.message : "Cloudinary test failed";
                    setIntegrationMessage(msg);
                  }
                }}
                className="mt-2 text-xs text-blue-600 hover:text-blue-500 underline"
              >
                Test Cloudinary Connection
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                ScreenshotOne Access Key
              </label>
              <p className="text-xs text-zinc-500 mb-2">
                Create a key in your ScreenshotOne dashboard.{" "}
                <a
                  href="https://screenshotone.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  screenshotone.com
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type={showScreenshotKey ? "text" : "password"}
                  value={integrations.screenshotone_access_key || ""}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, screenshotone_access_key: e.target.value })
                  }
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="screenshotone_access_key"
                />
                <button
                  type="button"
                  onClick={() => setShowScreenshotKey((s) => !s)}
                  className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-600 dark:text-zinc-300"
                >
                  {showScreenshotKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              onClick={async () => {
                setIntegrationMessage("");
                const cloudinaryUrl = (integrations.cloudinary_url || "").trim();
                if (cloudinaryUrl && !cloudinaryUrl.startsWith("cloudinary://")) {
                  setIntegrationMessage("Cloudinary URL must start with cloudinary://");
                  return;
                }
                await handleSave("integrations", {
                  cloudinary_url: cloudinaryUrl,
                  screenshotone_access_key: (integrations.screenshotone_access_key || "").trim(),
                });
              }}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Integrations"}
            </button>
          </div>
        </div>
      )}

      {/* Domain Tab */}
      {activeTab === "domain" && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Custom Domain</p>
              <p className="text-xs text-zinc-500 mb-3">
                Enter your domain below to connect it to your portfolio. After saving, configure the DNS records shown to complete the setup.
                Your portfolio will be accessible at both folio.skin/{currentUser?.username} and your custom domain.
              </p>
              {domainStatus !== "not_set" && (
                <p className={`text-xs mb-2 ${domainStatus === "verified" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {domainStatus === "verified"
                    ? "✓ Domain DNS records verified"
                    : domainStatus === "unconfigured"
                      ? "⚠ DNS verification not configured on server"
                      : "⏳ Awaiting DNS verification"}
                </p>
              )}
              {domainStatus === "verified" && (
                <div className={`text-xs mb-2 ${domainSiteStatus === "reachable" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                  <p>
                    {domainSiteStatus === "reachable"
                      ? "✓ Domain is responding publicly"
                      : "⏳ DNS is verified, but public traffic may still be propagating (SSL/caching can lag)"}
                  </p>
                  {domainSiteChecks && (
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                      HTTPS: {domainSiteChecks.https?.status_code ?? domainSiteChecks.https?.error ?? "-"} | HTTP: {domainSiteChecks.http?.status_code ?? domainSiteChecks.http?.error ?? "-"}
                    </p>
                  )}
                </div>
              )}
              <input
                type="text"
                value={domainValue}
                onChange={(e) => setDomainValue(e.target.value.toLowerCase())}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                placeholder="yourdomain.com or subdomain.yourdomain.com"
              />
              {domainStatus !== "verified" && (domainExpectedA || domainExpectedCname || domainExpectedNs.length > 0) && (
                <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <p className="font-medium text-zinc-700 dark:text-zinc-200">DNS Configuration Required</p>
                  <p className="mt-1">
                    Add this DNS record at your domain registrar:
                  </p>
                  {isApexDomain && domainExpectedA && (
                    <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                      <p><span className="text-zinc-500">Type:</span> <span className="font-medium">A</span></p>
                      <p><span className="text-zinc-500">Name:</span> <span className="font-medium">@</span></p>
                      <p><span className="text-zinc-500">Value:</span> <span className="font-medium">{domainExpectedA}</span></p>
                    </div>
                  )}
                  {!isApexDomain && domainExpectedCname && (
                    <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                      <p><span className="text-zinc-500">Type:</span> <span className="font-medium">CNAME</span></p>
                      <p><span className="text-zinc-500">Name:</span> <span className="font-medium">{domainValue.split(".")[0]}</span></p>
                      <p><span className="text-zinc-500">Value:</span> <span className="font-medium">{domainExpectedCname}</span></p>
                    </div>
                  )}
                  {!isApexDomain && !domainExpectedCname && domainExpectedA && (
                    <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                      <p><span className="text-zinc-500">Type:</span> <span className="font-medium">A</span></p>
                      <p><span className="text-zinc-500">Name:</span> <span className="font-medium">{domainValue.split(".")[0]}</span></p>
                      <p><span className="text-zinc-500">Value:</span> <span className="font-medium">{domainExpectedA}</span></p>
                    </div>
                  )}
                  {domainExpectedNs.length > 0 && (
                    <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                      <p><span className="text-zinc-500">Type:</span> <span className="font-medium">NS (nameservers)</span></p>
                      <p><span className="text-zinc-500">Value:</span> <span className="font-medium">{domainExpectedNs.join(", ")}</span></p>
                      {domainFoundNs.length > 0 && (
                        <p><span className="text-zinc-500">Detected:</span> <span className="font-medium">{domainFoundNs.join(", ")}</span></p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-zinc-500">DNS changes can take up to 48 hours to propagate.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await handleSaveDomain();
                  // Refresh domain status after saving
                  try {
                    const status = await getDomainStatus();
                    setDomainStatus(status.status);
                    setDomainExpectedA(status.expected_a || null);
                    setDomainExpectedCname(status.expected_cname || null);
                    setDomainExpectedNs(status.expected_ns || []);
                    setDomainFoundNs(status.found_ns || []);
                    setDomainSiteStatus(status.site_status || "unchecked");
                    setDomainSiteChecks(status.site_checks || null);
                  } catch (err) {
                    console.error("Failed to refresh domain status:", err);
                  }
                }}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Domain"}
              </button>
              {domainValue && (
                <button
                  onClick={async () => {
                    setDomainValue("");
                    setSaving(true);
                    try {
                      await setCustomDomain("");
                      setDomainStatus("not_set");
                      setDomainExpectedA(null);
                      setDomainExpectedCname(null);
                      setDomainExpectedNs([]);
                      setDomainFoundNs([]);
                      setDomainSiteStatus("unchecked");
                      setDomainSiteChecks(null);
                      setMessage("Domain removed");
                      setTimeout(() => setMessage(""), 3000);
                    } catch {
                      setMessage("Failed to remove domain");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="px-6 py-2 text-red-600 hover:text-red-500 font-medium"
                >
                  Remove Domain
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Platform Hero Tab (Super Admin only) */}
      {activeTab === "platform" && currentUser?.super_admin && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Landing Page Hero</p>
              <p className="text-xs text-zinc-500">
                This controls the public homepage at <span className="font-mono">/</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Title</label>
                <input
                  type="text"
                  value={platformHero.title}
                  onChange={(e) => setPlatformHero((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Highlight</label>
                <input
                  type="text"
                  value={platformHero.highlight}
                  onChange={(e) => setPlatformHero((prev) => ({ ...prev, highlight: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Subtitle</label>
              <textarea
                value={platformHero.subtitle}
                onChange={(e) => setPlatformHero((prev) => ({ ...prev, subtitle: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Primary Button</label>
                <input
                  type="text"
                  value={platformHero.cta_primary}
                  onChange={(e) => setPlatformHero((prev) => ({ ...prev, cta_primary: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Secondary Button</label>
                <input
                  type="text"
                  value={platformHero.cta_secondary}
                  onChange={(e) => setPlatformHero((prev) => ({ ...prev, cta_secondary: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={platformHero.use_custom_colors || false}
                  onChange={(e) => setPlatformHero({ ...platformHero, use_custom_colors: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Use Custom Text Colors</span>
              </label>
              {platformHero.use_custom_colors && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: "text_color", label: "Title", fallback: "#111827" },
                    { key: "highlight_color", label: "Highlight", fallback: "#2563eb" },
                    { key: "subtitle_color", label: "Subtitle", fallback: "#6b7280" },
                  ].map(({ key, label, fallback }) => (
                    <div key={key}>
                      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={isHexColor(platformHero[key as keyof PlatformHeroSettings] as string || "")
                            ? platformHero[key as keyof PlatformHeroSettings] as string
                            : fallback}
                          onChange={(e) => setPlatformHero({ ...platformHero, [key]: e.target.value })}
                          className="w-10 h-9 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(platformHero[key as keyof PlatformHeroSettings] as string) || ""}
                          onChange={(e) => setPlatformHero({ ...platformHero, [key]: e.target.value })}
                          onBlur={(e) => setPlatformHero({ ...platformHero, [key]: normalizeHex(e.target.value) })}
                          placeholder="Auto"
                          className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-1">Background Image URL</p>
              {platformHero.background_image && (
                <div className="mb-2 relative inline-block">
                  <Image src={platformHero.background_image} alt="Platform hero background" width={96} height={96} className="h-24 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setPlatformHero({ ...platformHero, background_image: "" })}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    &times;
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={platformHero.background_image || ""}
                  onChange={(e) => setPlatformHero({ ...platformHero, background_image: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="https://..."
                />
                <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                  {uploadingPlatformHeroBg ? "..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingPlatformHeroBg(true);
                      try {
                        const result = await uploadPlatformImageToBlob(file);
                        setPlatformHero({ ...platformHero, background_image: result.url });
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Failed to upload image");
                      } finally {
                        setUploadingPlatformHeroBg(false);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setMediaLibraryTarget("platform_hero_bg")}
                  className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200"
                >
                  Library
                </button>
              </div>
            </div>

            {platformHero.background_image && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Overlay Darkness ({platformHero.background_overlay ?? 45}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={platformHero.background_overlay ?? 45}
                  onChange={(e) => setPlatformHero({ ...platformHero, background_overlay: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            <button
              onClick={async () => {
                setSaving(true);
                setMessage("");
                try {
                  await updateSuperAdminPlatformHero(platformHero);
                  const syncResult = await syncPlatformConfigToEdge(platformHero);
                  setMessage(syncResult.synced ? "Platform hero saved and synced to Edge Config." : `Platform hero saved. ${syncResult.reason || ""}`);
                  setTimeout(() => setMessage(""), 3000);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Failed to save platform hero");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Platform Hero"}
            </button>
          </div>
        </div>
      )}

      <MediaLibraryModal
        isOpen={mediaLibraryTarget !== null}
        onClose={() => setMediaLibraryTarget(null)}
        onSelect={handleSelectMediaAsset}
      />
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsPageClient />;
}
