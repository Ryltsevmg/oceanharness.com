import type { Metadata } from 'next';
import { startMetadata, StartPage } from '../../../src/views/start.tsx';

export function generateMetadata(): Metadata {
  return startMetadata('ru');
}

export default function Page() {
  return <StartPage locale="ru" />;
}
