import type { Metadata } from 'next';
import { homeMetadata, HomePage } from '../../src/views/home.tsx';

export function generateMetadata(): Metadata {
  return homeMetadata('ru');
}

export default function Page() {
  return <HomePage locale="ru" />;
}
