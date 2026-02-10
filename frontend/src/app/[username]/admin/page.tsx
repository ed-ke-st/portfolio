"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProjectsForUser } from "@/lib/api";
import { getDesignsForUser } from "@/lib/designs";
import { getAdminSettings } from "@/lib/settings-api";
import { getMe, getToken } from "@/lib/auth";
import { getDomainStatus } from "@/lib/admin-api";

export default function AdminDashboard() {
  const params = useParams();
  const username = params.username as string;
  const [projectCount, setProjectCount] = useState(0);
  const [designCount, setDesignCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [integrationsReady, setIntegrationsReady] = useState(false);
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [appearanceAccent, setAppearanceAccent] = useState<string | null>(null);
  const [appearanceBackground, setAppearanceBackground] = useState<string | null>(null);
  const [heroBackground, setHeroBackground] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<"not_set" | "unconfigured" | "not_verified" | "verified">("not_set");

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [projects, designs] = await Promise.all([
          getProjectsForUser(username),
          getDesignsForUser(username),
        ]);
        setProjectCount(projects.length);
        setDesignCount(designs.length);
        const settings = await getAdminSettings();
        const integrations = settings.integrations || {};
        const cloudinaryReady = Boolean(integrations.cloudinary_url);
        const screenshotReady = Boolean(integrations.screenshotone_access_key);
        setIntegrationsReady(cloudinaryReady && screenshotReady);
        setAppearanceAccent(settings.appearance?.accent || null);
        setAppearanceBackground(settings.appearance?.background || null);
        setHeroBackground(settings.hero?.background_image || null);

        const token = getToken();
        if (token) {
          const user = await getMe(token);
          setCustomDomain(user.custom_domain || null);
        }

        const domain = await getDomainStatus();
        setDomainStatus(domain.status);
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [username]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
        Dashboard
      </h1>

      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Getting Started</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Complete these steps to unlock full features.
            </p>
          </div>
          <Link
            href={`/${username}/admin/settings?tab=integrations`}
            className="text-xs text-blue-600 hover:text-blue-500 underline"
          >
            Go to settings
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            { label: "Connect integrations", done: integrationsReady, href: `/${username}/admin/settings?tab=integrations` },
            { label: "Add a dev project", done: projectCount > 0, href: `/${username}/admin/projects` },
            { label: "Add a design project", done: designCount > 0, href: `/${username}/admin/designs` },
            { label: "Set a custom domain", done: Boolean(customDomain), href: `/${username}/admin/settings?tab=domain` },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                item.done
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs">{item.done ? "Done" : "Start →"}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Integrations Card */}
        <Link
          href={`/${username}/admin/settings?tab=integrations`}
          className={`rounded-xl p-6 border transition-colors ${
            integrationsReady
              ? "bg-white dark:bg-zinc-800 border-green-200 dark:border-green-900/40 hover:border-green-400"
              : "bg-white dark:bg-zinc-800 border-amber-200 dark:border-amber-900/40 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Integrations</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                {loading ? "-" : integrationsReady ? "Ready" : "Action needed"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Cloudinary + ScreenshotOne
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              integrationsReady ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
            }`}>
              <svg className={`w-6 h-6 ${integrationsReady ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
              </svg>
            </div>
          </div>
          <p className={`${integrationsReady ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"} text-sm mt-4`}>
            {integrationsReady ? "All set" : "Set up API keys →"}
          </p>
        </Link>
        {/* Projects Card */}
        <Link
          href={`/${username}/admin/projects`}
          className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Dev Projects</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                {loading ? "-" : projectCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-4">
            Manage projects &rarr;
          </p>
        </Link>

        {/* Designs Card */}
        <Link
          href={`/${username}/admin/designs`}
          className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Design Projects</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                {loading ? "-" : designCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-4">
            Manage designs &rarr;
          </p>
        </Link>

        {/* Appearance Card */}
        <Link
          href={`/${username}/admin/settings?tab=appearance`}
          className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Appearance</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                Theme Preview
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Colors & sections
              </p>
            </div>
            <div className="w-14 h-14 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {heroBackground ? (
                <div className="w-full h-full" style={{ backgroundImage: `url(${heroBackground})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              ) : (
                <>
                  <div className="h-1/2" style={{ backgroundColor: appearanceBackground || "#f4f4f5" }} />
                  <div className="h-1/2" style={{ backgroundColor: appearanceAccent || "#2563eb" }} />
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
            Customize your theme →
          </p>
        </Link>

        {/* Custom Domain Card */}
        <Link
          href={`/${username}/admin/settings?tab=domain`}
          className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Custom Domain</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1 truncate">
                {loading ? "-" : customDomain || "Not set"}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4l3 8 4-16 3 8h4" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-4">
            {customDomain ? (domainStatus === "verified" ? "Verified" : "Needs verification") : "Set up domain →"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Use A + CNAME records. Nameserver change is optional.
          </p>
        </Link>

        {/* View Site Card */}
        <Link
          href={`/${username}`}
          className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Portfolio</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                View Live Site
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-4">
            Open in new tab &rarr;
          </p>
        </Link>
      </div>
    </div>
  );
}
