import type { ReactNode } from 'react';
import type { Translate } from '../i18n/messages.ts';
import { HTML_LANG, localizedPath, type Locale, type PageKey } from '../i18n/locales.ts';
import { footerLinks, headerLabels, languageLinks, navLinks, type Current } from './chrome.ts';
import { SiteHeader } from './site-header.tsx';

/**
 * The page frame shared by every route: skip link, header, main landmark and footer.
 *
 * `mainId` stays `main` on every page because the skip link and the in-page anchors of the landing hero point at it.
 *
 * @param locale the locale whose text and routes the frame renders.
 * @param page the page key, used for the language switch links.
 * @param current the active nav entry; `features` marks the landing page's in-page section.
 * @param className the class of the `main` element, as the published stylesheets select it.
 */
export function PageShell({
  locale,
  ui,
  page,
  current,
  className,
  children,
}: {
  locale: Locale;
  ui: Translate;
  page: PageKey;
  current: Current;
  className?: string;
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main">{ui('К содержанию')}</a>
      <SiteHeader
        locale={locale}
        homeHref={localizedPath('home', locale)}
        languages={languageLinks(locale, page)}
        links={navLinks(locale, ui, current)}
        labels={headerLabels(ui)}
      />
      <main tabIndex={-1} id="main" className={className}>{children}</main>
      <footer className="footer" lang={HTML_LANG[locale]}>
        <div className="wrap footer-inner">
          <a className="brand" href={localizedPath('home', locale)}>Ocean</a>
          <div className="footer-links">
            {footerLinks(locale, ui).map(link => (
              <a key={link.href} href={link.href}>
                {link.label}
                {link.external ? <span aria-hidden="true">↗</span> : null}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
