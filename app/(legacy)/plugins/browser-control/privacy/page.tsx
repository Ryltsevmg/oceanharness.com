import type { Metadata } from 'next';
import { browserControlPrivacyMetadata, BrowserControlPrivacyPage } from '../../../../../src/views/browser-control-privacy.tsx';

/**
 * The address the English policy was published at before the localized routes existed.
 *
 * It serves the English text and canonicalizes to `/en/plugins/browser-control/privacy/`, exactly as the generated
 * page did, so the old inbound links keep working without creating a second indexable copy.
 */
export function generateMetadata(): Metadata {
  return browserControlPrivacyMetadata('en');
}

export default function Page() {
  return <BrowserControlPrivacyPage locale="en" />;
}
