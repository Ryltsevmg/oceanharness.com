'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '../i18n/locales.ts';
import { HTML_LANG, LANGUAGE_NAMES } from '../i18n/locales.ts';
import { LanguageIcon } from './icons.tsx';

/**
 * The site header: brand, language picker and mobile menu.
 *
 * It is a client component because both disclosures are interactive, and it is the only script the chrome needs. The
 * server renders the same markup with both closed; the `js` class is added on mount, which is what collapses the
 * mobile link list, so the header keeps working with JavaScript disabled.
 *
 * Every link and label arrives already localized: locale routing and text lookup belong to the server render, and
 * this component ships no message catalog.
 */

/** One header or footer link. `external` appends the `↗` mark the published markup carries. */
export type NavLink = { readonly label: string; readonly href: string; readonly current?: boolean; readonly external?: boolean };

export type LanguageLink = { readonly code: Locale; readonly href: string };

export type HeaderLabels = {
  readonly nav: string;
  readonly brand: string;
  readonly language: string;
  readonly open: string;
  readonly close: string;
};

const BURGER = 'M4 6h16M4 12h16M4 18h16';
const CLOSE = 'M6 6l12 12M6 18 18 6';

export function SiteHeader({
  locale,
  homeHref,
  languages,
  links,
  labels,
}: {
  locale: Locale;
  homeHref: string;
  languages: readonly LanguageLink[];
  links: readonly NavLink[];
  labels: HeaderLabels;
}) {
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const languagesRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('js');
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (languagesRef.current && !languagesRef.current.contains(target)) setLanguagesOpen(false);
      if (menuOpen && menuRef.current && toggleRef.current && !menuRef.current.contains(target) && !toggleRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (languagesOpen) {
        setLanguagesOpen(false);
        summaryRef.current?.focus();
      } else if (menuOpen) {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const compact = window.matchMedia('(max-width: 760px)');
    const onViewportChange = () => setMenuOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    compact.addEventListener('change', onViewportChange);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      compact.removeEventListener('change', onViewportChange);
    };
  }, [languagesOpen, menuOpen]);

  const onMenuClick = useCallback((event: React.SyntheticEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('a')) setMenuOpen(false);
  }, []);

  return (
    <header className="site-header" lang={HTML_LANG[locale]}>
      <nav className="nav wrap" aria-label={labels.nav}>
        <a className="brand" href={homeHref} aria-label={labels.brand}>
          <img src="/ocean-logo.svg" alt="" width="40" height="40" />
          Ocean
        </a>
        <details
          className="language-picker"
          ref={languagesRef}
          open={languagesOpen}
          onToggle={event => setLanguagesOpen(event.currentTarget.open)}
        >
          <summary aria-label={labels.language} ref={summaryRef}>
            <LanguageIcon />
            <span>{locale.toUpperCase()}</span>
          </summary>
          <nav aria-label={labels.language}>
            {languages.map(({ code, href }) => (
              <a
                key={code}
                href={href}
                lang={HTML_LANG[code]}
                hrefLang={HTML_LANG[code]}
                {...(code === locale ? { 'aria-current': 'page' as const } : {})}
              >
                {LANGUAGE_NAMES[code]}
              </a>
            ))}
          </nav>
        </details>
        <button
          className="menu-toggle"
          type="button"
          ref={toggleRef}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? labels.close : labels.open}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={menuOpen ? CLOSE : BURGER} />
          </svg>
        </button>
        <div className={menuOpen ? 'nav-links is-open' : 'nav-links'} id="site-menu" ref={menuRef} onClick={onMenuClick}>
          {links.map(link => (
            <a key={`${link.href}${link.label}`} href={link.href} {...(link.current ? { 'aria-current': 'page' as const } : {})}>
              {link.label}
              {link.external ? <span aria-hidden="true">↗</span> : null}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
