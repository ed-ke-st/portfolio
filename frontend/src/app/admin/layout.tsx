"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, getMe, removeToken, User } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (!token) {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        setLoading(false);
        return;
      }

      try {
        const userData = await getMe(token);
        setUser(userData);
        if (pathname === "/admin/login") {
          router.push("/admin");
        }
      } catch {
        removeToken();
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = () => {
    removeToken();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Login page doesn't need the admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/projects", label: "Projects" },
    { href: "/admin/designs", label: "Designs" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-zinc-900 dark:text-white">
                Admin
              </Link>
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="hidden sm:block text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                View Site
              </Link>
              <span className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-500">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="hidden sm:block text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Logout
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-zinc-600 dark:text-zinc-400"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-zinc-200 dark:border-zinc-700">
              <nav className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-zinc-200 dark:border-zinc-700" />
                <Link
                  href="/"
                  target="_blank"
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  View Site
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
