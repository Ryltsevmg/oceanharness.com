import type { Metadata } from 'next';
import { privacyMetadata, PrivacyPage } from '../../../src/views/privacy.tsx';

export function generateMetadata(): Metadata {
  return privacyMetadata('ru');
}

export default function Page() {
  return <PrivacyPage locale="ru" />;
}
