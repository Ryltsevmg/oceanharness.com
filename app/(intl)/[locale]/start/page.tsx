import type { Metadata } from 'next';
import type { Locale } from '../../../../src/i18n/locales.ts';
import { localeParams } from '../../../../src/i18n/static-params.ts';
import { startMetadata, StartPage } from '../../../../src/views/start.tsx';

export const generateStaticParams = localeParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return startMetadata(locale);
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <StartPage locale={locale} />;
}
