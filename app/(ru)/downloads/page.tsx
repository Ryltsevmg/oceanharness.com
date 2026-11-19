import type { Metadata } from 'next';
import { downloadsMetadata, DownloadsPage } from '../../../src/views/downloads.tsx';

export function generateMetadata(): Metadata {
  return downloadsMetadata('ru');
}

export default function Page() {
  return <DownloadsPage locale="ru" />;
}
