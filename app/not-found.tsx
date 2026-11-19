import type { Viewport } from 'next';
import { PageShell } from '../src/components/page-shell.tsx';
import { localizedPath } from '../src/i18n/locales.ts';
import { messages } from '../src/i18n/messages.ts';

export const viewport: Viewport = { themeColor: '#0b111c' };

/**
 * The `404.html` GitHub Pages serves for an unknown address.
 *
 * It renders its own document element because the root layout is a fragment: `<html lang>` belongs to the locale,
 * and a missing path has none. Russian is the source language and the `x-default` of every route, so it is what an
 * unknown visitor gets, with links back to the two pages that answer "what is this".
 */
export default function NotFound() {
  const ui = messages('ru');
  return (
    <html lang="ru">
      <body>
        <PageShell locale="ru" ui={ui} page="home" current={null} className="plugin-page wrap">
          <section className="plugin-intro" aria-labelledby="not-found-title">
            <p className="eyebrow">404</p>
            <h1 id="not-found-title">{ui('Страница не найдена')}</h1>
            <p className="plugin-lead">{ui('Такой страницы здесь нет. Начните с главной или загляните в плагины.')}</p>
          </section>
          <div className="plugin-grid">
            <article className="plugin-card">
              <h2>{ui('Главная')}</h2>
              <p>Ocean</p>
              <a className="text-link" href={localizedPath('home', 'ru')}>{ui('На главную')} <span aria-hidden="true">→</span></a>
            </article>
            <article className="plugin-card">
              <h2>{ui('Плагины')}</h2>
              <p>{ui('Снаряжение для ваших задач')}</p>
              <a className="text-link" href={localizedPath('plugins', 'ru')}>{ui('Все плагины')} <span aria-hidden="true">→</span></a>
            </article>
          </div>
        </PageShell>
      </body>
    </html>
  );
}
