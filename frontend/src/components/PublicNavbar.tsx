"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const ACCENT = "#0ea371"; // Harari-inspired green

export default function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('common');
  
  // Fallback function in case translation is not available
  const translate = (key: string, fallback: string) => {
    try {
      return t(key) || fallback;
    } catch {
      return fallback;
    }
  };

  const linkActive = (href: string) =>
    pathname === href ? "text-[var(--accent)]" : "text-dark-2 dark:text-dark-6";

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={`relative px-2 py-1 font-medium hover:text-[var(--accent)] ${linkActive(href)}`}
      onClick={() => setOpen(false)}
      style={{ ["--accent" as any]: ACCENT }}
    >
      {children}
      {pathname === href && (
        <span
          className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full"
          style={{ backgroundColor: ACCENT }}
        />
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/70 backdrop-blur-md dark:border-dark-3 dark:bg-[#0b1420]/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="group inline-flex items-center gap-2">
          <span
            className="grid size-8 place-items-center rounded-md text-white font-bold"
            style={{ background: ACCENT }}
          >
            HD
          </span>
          <span className="text-lg font-bold text-dark dark:text-white">
            Harari Region Diaspora
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          <li><NavLink href="/">{translate('navigation.home', 'Home')}</NavLink></li>
          <li><NavLink href="/about">{translate('navigation.about', 'About')}</NavLink></li>
          <li><NavLink href="/services">Services</NavLink></li>
          <li><NavLink href="/contact">{translate('navigation.contact', 'Contact')}</NavLink></li>
        </ul>

        {/* Auth / CTAs (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher variant="dropdown" className="mr-2" />
          <Link
            href="/auth/sign-up"
            className="rounded-md border px-4 py-2 font-semibold hover:opacity-90"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            {translate('auth.signIn', 'Sign In')}
          </Link>
          <Link
            href="/auth/sign-in"
            className="rounded-md px-4 py-2 font-semibold text-white hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Sign In
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex size-10 items-center justify-center rounded-md border md:hidden dark:border-dark-3"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle navigation"
          style={{ borderColor: "rgba(14,163,113,0.25)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gray-200/70 md:hidden dark:border-dark-3">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
            <NavLink href="/">{translate('navigation.home', 'Home')}</NavLink>
            <NavLink href="/about">{translate('navigation.about', 'About')}</NavLink>
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/contact">{translate('navigation.contact', 'Contact')}</NavLink>
            <div className="mt-2">
              <LanguageSwitcher variant="buttons" className="mb-3" />
            </div>
            <div className="flex gap-2">
              <Link
                  href="/auth/sign-in"
                  className="flex-1 rounded-md border px-4 py-2 text-center font-semibold"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                  onClick={() => setOpen(false)}
                >
                  Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="flex-1 rounded-md px-4 py-2 text-center font-semibold text-white"
                style={{ background: ACCENT }}
                onClick={() => setOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
