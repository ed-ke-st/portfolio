"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppearanceSettings, getSettings, ContactSettings, FooterSettings } from "@/lib/settings-api";

const defaultContact: ContactSettings = {
  heading: "Get in Touch",
  subheading: "Feel free to reach out for collaborations or just a friendly hello",
  email: "hello@example.com",
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  twitter: "",
  instagram: "",
  phone: "",
};

const defaultFooter: FooterSettings = {
  copyright: "Portfolio. All rights reserved.",
};

export default function Footer({ appearance }: { appearance?: AppearanceSettings }) {
  const [contact, setContact] = useState<ContactSettings>(defaultContact);
  const [footer, setFooter] = useState<FooterSettings>(defaultFooter);
  const sectionBg = appearance?.sections?.footer;

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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings.contact) {
          const formatted = settings.contact.phone
            ? { ...settings.contact, phone: formatPhone(settings.contact.phone) }
            : settings.contact;
          setContact(formatted);
        }
        if (settings.footer) setFooter(settings.footer);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer
      id="contact"
      className="bg-[var(--app-card)] border-t border-[var(--app-border)]"
      style={sectionBg ? { background: sectionBg } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-[var(--app-text)]">
              {contact.heading}
            </h3>
            <p className="text-[var(--app-muted)] mt-1">
              {contact.subheading}
            </p>
          </div>

          <div className="flex gap-6">
            {contact.github && (
              <Link
                href={contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                </svg>
              </Link>
            )}
            {contact.linkedin && (
              <Link
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            )}
            {contact.twitter && (
              <Link
                href={contact.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            )}
            {contact.instagram && (
              <Link
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm10 2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2zm-5 3a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm5.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                </svg>
              </Link>
            )}
            {contact.phone && (
              <Link
                href={`tel:${contact.phone.replace(/\\D/g, "")}`}
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                aria-label="Phone"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5.5A2.5 2.5 0 015.5 3h2a2 2 0 012 2v2a2 2 0 01-2 2H7a12 12 0 008 8v-.5a2 2 0 012-2h2a2 2 0 012 2v2A2.5 2.5 0 0118.5 21h-1C9.82 21 3 14.18 3 5.5z" />
                </svg>
              </Link>
            )}
            {contact.email && (
              <Link
                href={`mailto:${contact.email}`}
                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                aria-label="Email"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--app-border)] text-center">
          <p className="text-[var(--app-muted)] text-sm">
            &copy; {new Date().getFullYear()} {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
