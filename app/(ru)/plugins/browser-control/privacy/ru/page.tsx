import type { Metadata } from 'next';
import { browserControlPrivacyMetadata, BrowserControlPrivacyPage } from '../../../../../../src/views/browser-control-privacy.tsx';

export function generateMetadata(): Metadata {
  return browserControlPrivacyMetadata('ru');
}

export default function Page() {
  return <BrowserControlPrivacyPage locale="ru" />;
}
