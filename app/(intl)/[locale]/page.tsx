import type { Metadata } from 'next';
import type { Locale } from '../../../src/i18n/locales.ts';
import { localeParams } from '../../../src/i18n/static-params.ts';
import { homeMetadata, HomePage } from '../../../src/views/home.tsx';

export const generateStaticParams = localeParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return homeMetadata(locale);
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <HomePage locale={locale} />;
}
