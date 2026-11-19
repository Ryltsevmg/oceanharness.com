import type { Metadata } from 'next';
import { pluginsMetadata, PluginsPage } from '../../../src/views/plugins.tsx';

export function generateMetadata(): Metadata {
  return pluginsMetadata('ru');
}

export default function Page() {
  return <PluginsPage locale="ru" />;
}
