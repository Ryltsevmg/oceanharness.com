import type { Metadata } from 'next';
import { browserControlMetadata, BrowserControlPage } from '../../../../src/views/browser-control.tsx';

export function generateMetadata(): Metadata {
  return browserControlMetadata('ru');
}

export default function Page() {
  return <BrowserControlPage locale="ru" />;
}
