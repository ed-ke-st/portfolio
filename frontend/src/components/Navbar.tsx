"use client";

import Link from "next/link";
import { useState } from "react";

interface NavbarProps {
  username?: string;
}

export default function Navbar({ username }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const basePath = username ? `/${username}` : "";
  const navLinks = [
    { href: `${basePath}#projects`, label: "Dev Projects" },
    { href: `${basePath}#designs`, label: "Design Projects" },
    { href: `${basePath}#skills`, label: "Skills" },
    { href: `${basePath}#contact`, label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--app-bg)] backdrop-blur-md border-b border-[var(--app-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={basePath || "/"} className="text-xl font-bold text-[var(--app-text)]">
            Portfolio
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-[var(--app-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[var(--app-border)]">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
