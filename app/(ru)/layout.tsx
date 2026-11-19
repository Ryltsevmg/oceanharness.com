import type { ReactNode } from 'react';
import { DocumentShell } from '../../src/components/document-shell.tsx';

export default function RuLayout({ children }: { children: ReactNode }) {
  return <DocumentShell locale="ru">{children}</DocumentShell>;
}
