import type { MetadataRoute } from 'next';
import { LOCALES, PAGES, localizedUrl, SITE_ORIGIN } from '../src/i18n/locales.ts';

/**
 * `sitemap.xml` for the whole site.
 *
 * Every page in every locale, plus the pre-localization English policy address that stays published. The list is
 * derived from the route registry, so a new page or locale appears here without a manual edit.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const item of PAGES) {
    for (const locale of LOCALES) entries.push({ url: localizedUrl(item.key, locale) });
    if (item.privacyLegacy) entries.push({ url: `${SITE_ORIGIN}${item.path}` });
  }
  return entries;
}
