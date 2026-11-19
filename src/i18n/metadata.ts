import type { Metadata } from 'next';
import { SITE_ORIGIN, hreflangAlternates, localizedUrl, type Locale, type PageKey } from './locales.ts';

/**
 * Metadata of one prerendered page.
 *
 * The published site carries a title, a description, an Open Graph block, a Twitter card and a full `hreflang` set
 * with `x-default` pointing at the Russian source. `theme-color` is not metadata: it comes from the `viewport`
 * export of the layouts. Search engines and link previews read those tags
 * from the static HTML, so every field here is part of the public contract.
 *
 * @param page the page key whose locale URLs are emitted.
 * @param locale the locale of this copy.
 * @param title the localized `<title>` and `og:title`.
 * @param description the localized `meta description`.
 * @param socialDescription the `og:description` and `twitter:description` when a page publishes a shorter one.
 * @returns the Next metadata object for the route.
 */
export function pageMetadata({
  page,
  locale,
  title,
  description,
  socialDescription,
}: {
  page: PageKey;
  locale: Locale;
  title: string;
  description: string;
  socialDescription?: string;
}): Metadata {
  const url = localizedUrl(page, locale);
  const social = socialDescription ?? description;
  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates(page) },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: `${SITE_ORIGIN}/assets/ocean-social.jpg`, width: 1200, height: 630, alt: '' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE_ORIGIN}/assets/ocean-social.jpg`] },
  };
}
