"use client";

import { useEffect, useState } from "react";
import {
  getSettings,
  updateSetting,
  HeroSettings,
  Skill,
  SkillCategory,
  ContactSettings,
  FooterSettings,
  AppearanceSettings,
} from "@/lib/settings-api";
import { uploadFile } from "@/lib/admin-api";

type TabType = "appearance" | "skills" | "contact" | "footer";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("appearance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);

  // Preview state
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
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
          // Handle both old format (string[]) and new format (SkillCategory[])
          if (Array.isArray(data.skill_categories) && data.skill_categories.length > 0) {
            if (typeof data.skill_categories[0] === "string") {
              // Old format - convert to new format
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
          // Build categories from skills
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
        if (data.footer) setFooter(data.footer);
        if (data.appearance) {
          setAppearance({
            ...appearance,
            ...data.appearance,
            sections: {
              ...appearance.sections,
              ...(data.appearance.sections || {}),
            },
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

  // Get all subcategories for a main category
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

  const tabs = [
    { id: "appearance" as TabType, label: "Appearance" },
    { id: "skills" as TabType, label: "Skills" },
    { id: "contact" as TabType, label: "Contact" },
    { id: "footer" as TabType, label: "Footer" },
  ];

  const isHexColor = (value: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const normalizeHex = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("#")) return trimmed;
    return `#${trimmed}`;
  };
  const resolveColor = (value: string, fallback: string) =>
    isHexColor(value) ? value : fallback;
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

  const appearanceColorKeys = [
    "accent",
    "background",
    "text",
    "muted",
    "card",
    "border",
  ] as const;

  if (loading) {
    return <p className="text-zinc-500">Loading settings...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Site Settings
        </h1>
        {message && (
          <span className={`text-sm ${message.includes("Failed") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </span>
        )}
      </div>

      {/* Tabs */}
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
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div
                  className="relative min-h-[200px] flex items-center justify-center p-4"
                  style={{
                    background: hero.background_image
                      ? undefined
                      : appearance.sections?.hero || previewPalette.background,
                  }}
                >
                  {hero.background_image && (
                    <>
                      <img src={hero.background_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${(hero.background_overlay ?? 50) / 100})` }} />
                    </>
                  )}
                  <div className="relative z-10 text-center">
                    <h1 className="text-xl font-bold mb-2" style={{ color: hero.use_custom_colors && hero.text_color ? hero.text_color : (hero.background_image ? "#ffffff" : previewPalette.text) }}>
                      {hero.title || "Hello, I'm"}{" "}
                      <span style={{ color: hero.use_custom_colors && hero.highlight_color ? hero.highlight_color : previewPalette.accent }}>{hero.highlight || "Your Name"}</span>
                    </h1>
                    <p className="text-xs mb-3" style={{ color: hero.use_custom_colors && hero.subtitle_color ? hero.subtitle_color : (hero.background_image ? "rgba(255,255,255,0.8)" : previewPalette.muted) }}>
                      {hero.subtitle || "A passionate developer"}
                    </p>
                    <button className="px-3 py-1 text-xs font-medium text-white rounded-full" style={{ backgroundColor: previewPalette.accent }}>
                      {hero.cta_primary || "View Projects"}
                    </button>
                  </div>
                </div>

                {/* Card Preview */}
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
              {/* Global Colors - Compact Row */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme Colors</p>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="lg:hidden p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </button>
                </div>

                {/* Desktop: Always visible row / Mobile: Collapsible */}
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

                  {/* Hero Background Override */}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <input
                          type="color"
                          value={isHexColor(appearance.sections?.hero || "") ? appearance.sections!.hero! : previewPalette.background}
                          onChange={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: e.target.value } })}
                          className="w-8 h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={appearance.sections?.hero || ""}
                        onChange={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: e.target.value } })}
                        onBlur={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: normalizeHex(e.target.value) } })}
                        className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        placeholder="Hero BG (optional)"
                      />
                      {appearance.sections?.hero && (
                        <button onClick={() => setAppearance({ ...appearance, sections: { ...appearance.sections, hero: "" } })} className="text-xs text-red-500">Clear</button>
                      )}
                    </div>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={Boolean(appearance.dark_mode)}
                        onChange={(e) => setAppearance({ ...appearance, dark_mode: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Enable dark mode
                    </label>
                  </div>

                  {/* Section Backgrounds */}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 mb-2">Section Backgrounds</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "projects", label: "Projects" },
                        { key: "designs", label: "Designs" },
                        { key: "skills", label: "Skills" },
                        { key: "footer", label: "Footer" },
                      ].map(({ key, label }) => (
                        <div key={key} className="text-center">
                          <input
                            type="color"
                            value={isHexColor(appearance.sections?.[key as keyof typeof appearance.sections] || "") ? appearance.sections![key as keyof typeof appearance.sections]! : previewPalette.background}
                            onChange={(e) => setAppearance({ ...appearance, sections: { ...appearance.sections, [key]: e.target.value } })}
                            className="w-full h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                          />
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
                            <input
                              type="color"
                              value={isHexColor(appearance.dark?.[key as keyof typeof appearance.dark] as string || "") ? appearance.dark![key as keyof typeof appearance.dark] as string : "#000000"}
                              onChange={(e) => setAppearance({ ...appearance, dark: { ...appearance.dark!, [key]: e.target.value } })}
                              className="w-full h-8 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSave("appearance", appearance)}
                    disabled={saving}
                    className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
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
                      <input
                        type="text"
                        value={hero.title}
                        onChange={(e) => setHero({ ...hero, title: e.target.value })}
                        placeholder="Hello, I'm"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Highlight</label>
                      <input
                        type="text"
                        value={hero.highlight}
                        onChange={(e) => setHero({ ...hero, highlight: e.target.value })}
                        placeholder="Your Name"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Subtitle</label>
                    <textarea
                      value={hero.subtitle}
                      onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                      rows={2}
                      placeholder="A passionate developer..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Primary Button</label>
                      <input
                        type="text"
                        value={hero.cta_primary}
                        onChange={(e) => setHero({ ...hero, cta_primary: e.target.value })}
                        placeholder="View Projects"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Secondary Button</label>
                      <input
                        type="text"
                        value={hero.cta_secondary}
                        onChange={(e) => setHero({ ...hero, cta_secondary: e.target.value })}
                        placeholder="Contact Me"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Hero Text Colors */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <label className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={hero.use_custom_colors || false}
                    onChange={(e) => setHero({ ...hero, use_custom_colors: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Custom Hero Text Colors</span>
                </label>

                {hero.use_custom_colors && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Title Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={isHexColor(hero.text_color || "") ? hero.text_color! : previewPalette.text}
                          onChange={(e) => setHero({ ...hero, text_color: e.target.value })}
                          className="w-10 h-9 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={hero.text_color || ""}
                          onChange={(e) => setHero({ ...hero, text_color: e.target.value })}
                          onBlur={(e) => setHero({ ...hero, text_color: normalizeHex(e.target.value) })}
                          placeholder="Auto"
                          className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Highlight Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={isHexColor(hero.highlight_color || "") ? hero.highlight_color! : previewPalette.accent}
                          onChange={(e) => setHero({ ...hero, highlight_color: e.target.value })}
                          className="w-10 h-9 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={hero.highlight_color || ""}
                          onChange={(e) => setHero({ ...hero, highlight_color: e.target.value })}
                          onBlur={(e) => setHero({ ...hero, highlight_color: normalizeHex(e.target.value) })}
                          placeholder="Accent"
                          className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Subtitle Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={isHexColor(hero.subtitle_color || "") ? hero.subtitle_color! : previewPalette.muted}
                          onChange={(e) => setHero({ ...hero, subtitle_color: e.target.value })}
                          className="w-10 h-9 border border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={hero.subtitle_color || ""}
                          onChange={(e) => setHero({ ...hero, subtitle_color: e.target.value })}
                          onBlur={(e) => setHero({ ...hero, subtitle_color: normalizeHex(e.target.value) })}
                          placeholder="Auto"
                          className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Background Image */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Background Image</p>
                {hero.background_image && (
                  <div className="mb-3 relative inline-block">
                    <img src={hero.background_image} alt="Hero background" className="h-24 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setHero({ ...hero, background_image: "" })}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hero.background_image || ""}
                    onChange={(e) => setHero({ ...hero, background_image: e.target.value })}
                    placeholder="Image URL"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                  <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                    {uploadingHeroBg ? "..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
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
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {hero.background_image && (
                  <div className="mt-3">
                    <label className="block text-xs text-zinc-500 mb-1">Overlay Darkness ({hero.background_overlay ?? 50}%)</label>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={hero.background_overlay ?? 50}
                      onChange={(e) => setHero({ ...hero, background_overlay: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={() => handleSave("hero", hero)}
                disabled={saving}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Hero Settings"}
              </button>
            </div>

            {/* Live Preview Panel - Sticky on Desktop */}
            <div className="hidden lg:block">
              <div className="sticky top-4">
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Live Preview</p>
                    <div className="flex gap-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setPreviewMode("desktop")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${previewMode === "desktop" ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400"}`}
                      >
                        Desktop
                      </button>
                      <button
                        onClick={() => setPreviewMode("mobile")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${previewMode === "mobile" ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400"}`}
                      >
                        Mobile
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-900">
                    <div
                      className={`relative overflow-hidden rounded-lg transition-all duration-300 ${previewMode === "mobile" ? "w-[280px]" : "w-full"}`}
                      style={{
                        background: hero.background_image ? undefined : appearance.sections?.hero || previewPalette.background,
                        minHeight: previewMode === "mobile" ? "300px" : "250px",
                      }}
                    >
                      {hero.background_image && (
                        <>
                          <img src={hero.background_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${(hero.background_overlay ?? 50) / 100})` }} />
                        </>
                      )}

                      <div className={`relative z-10 h-full flex items-center justify-center ${previewMode === "mobile" ? "p-4" : "p-6"}`}>
                        <div className="text-center max-w-lg">
                          <h1
                            className={`font-bold mb-3 ${previewMode === "mobile" ? "text-lg" : "text-2xl"}`}
                            style={{
                              color: hero.use_custom_colors && hero.text_color
                                ? hero.text_color
                                : (hero.background_image ? "#ffffff" : previewPalette.text),
                            }}
                          >
                            {hero.title || "Hello, I'm"}{" "}
                            <span style={{ color: hero.use_custom_colors && hero.highlight_color ? hero.highlight_color : previewPalette.accent }}>
                              {hero.highlight || "Your Name"}
                            </span>
                          </h1>
                          <p
                            className={`mb-4 ${previewMode === "mobile" ? "text-xs" : "text-sm"}`}
                            style={{
                              color: hero.use_custom_colors && hero.subtitle_color
                                ? hero.subtitle_color
                                : (hero.background_image ? "rgba(255,255,255,0.8)" : previewPalette.muted),
                            }}
                          >
                            {hero.subtitle || "A passionate developer creating amazing experiences"}
                          </p>
                          <div className={`flex gap-2 justify-center ${previewMode === "mobile" ? "flex-col" : ""}`}>
                            <button
                              className={`font-medium text-white rounded-full ${previewMode === "mobile" ? "px-3 py-1.5 text-xs" : "px-4 py-1.5 text-xs"}`}
                              style={{ backgroundColor: previewPalette.accent }}
                            >
                              {hero.cta_primary || "View Projects"}
                            </button>
                            <button
                              className={`font-medium rounded-full border ${previewMode === "mobile" ? "px-3 py-1.5 text-xs" : "px-4 py-1.5 text-xs"}`}
                              style={{
                                color: hero.background_image ? "#ffffff" : previewPalette.text,
                                borderColor: hero.background_image ? "rgba(255,255,255,0.3)" : previewPalette.border,
                              }}
                            >
                              {hero.cta_secondary || "Contact Me"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Preview */}
                  <div
                    className="p-4"
                    style={{ background: previewPalette.background }}
                  >
                    <p className="text-xs font-medium mb-3" style={{ color: previewPalette.muted }}>
                      Components Preview
                    </p>
                    <div className={`grid gap-3 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                      <div
                        className="p-4 rounded-lg"
                        style={{ background: previewPalette.card, border: `1px solid ${previewPalette.border}` }}
                      >
                        <p className="text-xs" style={{ color: previewPalette.muted }}>Muted text</p>
                        <p className="text-sm mt-1" style={{ color: previewPalette.text }}>Card content</p>
                        <div
                          className="h-1.5 w-full rounded-full mt-3 overflow-hidden"
                          style={{ background: previewPalette.border }}
                        >
                          <div className="h-full w-2/3" style={{ background: previewPalette.accent }} />
                        </div>
                      </div>
                      <div
                        className="p-4 rounded-lg"
                        style={{ background: previewPalette.card, border: `1px solid ${previewPalette.border}` }}
                      >
                        <p className="text-xs" style={{ color: previewPalette.muted }}>Secondary</p>
                        <p className="text-sm mt-1" style={{ color: previewPalette.text }}>Text content</p>
                        <span className="inline-flex mt-3 text-xs" style={{ color: previewPalette.accent }}>
                          View more →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === "skills" && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-6">
            {/* Category Management */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Main Categories
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="New main category (e.g., Development, Design)"
                  value={newMainCategory}
                  onChange={(e) => setNewMainCategory(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
                <button
                  onClick={addMainCategory}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Main categories with their subcategories */}
              <div className="space-y-3">
                {skillCategories.map((cat, mainIndex) => (
                  <div key={cat.name} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-zinc-900 dark:text-white">{cat.name}</span>
                      <button
                        onClick={() => removeMainCategory(mainIndex)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories.map((sub, subIndex) => (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-sm"
                        >
                          {sub}
                          <button
                            onClick={() => removeSubCategory(mainIndex, subIndex)}
                            className="text-red-500 hover:text-red-400"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      {cat.subcategories.length === 0 && (
                        <span className="text-xs text-zinc-500">No subcategories yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add subcategory */}
              {skillCategories.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <select
                    value={selectedMainCategoryForSub}
                    onChange={(e) => setSelectedMainCategoryForSub(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  >
                    <option value="">Select main category</option>
                    {skillCategories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="New subcategory (e.g., Frontend, Backend)"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={addSubCategory}
                    disabled={!selectedMainCategoryForSub}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add Sub
                  </button>
                </div>
              )}

              <button
                onClick={() => handleSave("skill_categories", skillCategories)}
                disabled={saving}
                className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Categories"}
              </button>
            </div>

            {/* Add new skill */}
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Add Skill
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="flex-1 min-w-[150px] px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
                <select
                  value={newSkill.mainCategory}
                  onChange={(e) => setNewSkill({ ...newSkill, mainCategory: e.target.value, category: "" })}
                  className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                >
                  <option value="">Main Category</option>
                  {skillCategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  disabled={!newSkill.mainCategory}
                  className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Subcategory</option>
                  {getSubcategories(newSkill.mainCategory).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: Number(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-xs text-zinc-500 w-8">{newSkill.level}%</span>
                </div>
                <button
                  onClick={addSkill}
                  disabled={!newSkill.name || !newSkill.category || !newSkill.mainCategory}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Skills list grouped by main category */}
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Skills ({skills.length})
              </p>
              {skillCategories.map((mainCat) => {
                const mainSkills = skills.filter((s) => s.mainCategory === mainCat.name);
                if (mainSkills.length === 0) return null;
                return (
                  <div key={mainCat.name} className="mb-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                      {mainCat.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mainSkills.map((skill, index) => {
                        const globalIndex = skills.findIndex((s) => s === skill);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg"
                          >
                            <span className="text-zinc-900 dark:text-white">{skill.name}</span>
                            <span className="text-xs text-zinc-500">({skill.category})</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={typeof skill.level === "number" ? skill.level : 75}
                              onChange={(e) => {
                                const level = Number(e.target.value);
                                setSkills((prev) =>
                                  prev.map((s, i) => (i === globalIndex ? { ...s, level } : s))
                                );
                              }}
                              className="w-20"
                            />
                            <span className="text-xs text-zinc-500 w-8">
                              {typeof skill.level === "number" ? skill.level : 75}%
                            </span>
                            <button
                              onClick={() => removeSkill(globalIndex)}
                              className="text-red-500 hover:text-red-400"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {/* Skills without main category */}
              {skills.filter((s) => !s.mainCategory).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    Uncategorized
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.filter((s) => !s.mainCategory).map((skill, index) => {
                      const globalIndex = skills.findIndex((s) => s === skill);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg"
                        >
                          <span className="text-zinc-900 dark:text-white">{skill.name}</span>
                          <span className="text-xs text-zinc-500">({skill.category || "none"})</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={typeof skill.level === "number" ? skill.level : 75}
                            onChange={(e) => {
                              const level = Number(e.target.value);
                              setSkills((prev) =>
                                prev.map((s, i) => (i === globalIndex ? { ...s, level } : s))
                              );
                            }}
                            className="w-20"
                          />
                          <span className="text-xs text-zinc-500 w-8">
                            {typeof skill.level === "number" ? skill.level : 75}%
                          </span>
                          <button
                            onClick={() => removeSkill(globalIndex)}
                            className="text-red-500 hover:text-red-400"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleSave("skills", skills)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Skills"}
            </button>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Heading
              </label>
              <input
                type="text"
                value={contact.heading}
                onChange={(e) => setContact({ ...contact, heading: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Subheading
              </label>
              <input
                type="text"
                value={contact.subheading}
                onChange={(e) => setContact({ ...contact, subheading: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={contact.github}
                onChange={(e) => setContact({ ...contact, github: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={contact.linkedin}
                onChange={(e) => setContact({ ...contact, linkedin: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Twitter/X URL (optional)
              </label>
              <input
                type="url"
                value={contact.twitter}
                onChange={(e) => setContact({ ...contact, twitter: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Instagram URL (optional)
              </label>
              <input
                type="url"
                value={contact.instagram}
                onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
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
      )}

      {/* Footer Tab */}
      {activeTab === "footer" && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Copyright Text
              </label>
              <input
                type="text"
                value={footer.copyright}
                onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                placeholder="Your Name. All rights reserved."
              />
              <p className="text-xs text-zinc-500 mt-1">Year is added automatically</p>
            </div>
            <button
              onClick={() => handleSave("footer", footer)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Footer Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
