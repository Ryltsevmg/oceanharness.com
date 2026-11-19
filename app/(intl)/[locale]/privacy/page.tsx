import type { Metadata } from 'next';
import type { Locale } from '../../../../src/i18n/locales.ts';
import { localeParams } from '../../../../src/i18n/static-params.ts';
import { privacyMetadata, PrivacyPage } from '../../../../src/views/privacy.tsx';

export const generateStaticParams = localeParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return privacyMetadata(locale);
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <PrivacyPage locale={locale} />;
}
