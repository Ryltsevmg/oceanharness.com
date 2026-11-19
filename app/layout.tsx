import type { ReactNode } from 'react';
import '../src/styles/globals.css';

/**
 * The document root.
 *
 * It holds the global stylesheet and nothing else: `<html lang>` differs per locale, and the Russian routes carry no
 * locale segment, so each route group renders its own document element.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
