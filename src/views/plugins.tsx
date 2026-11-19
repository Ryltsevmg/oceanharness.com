import type { Metadata } from 'next';
import '../styles/plugins.css';
import { PluginSymbol } from '../components/icons.tsx';
import { PageShell } from '../components/page-shell.tsx';
import { PLUGINS, type Plugin } from '../content/plugins.ts';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages, type Translate } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/plugins/` — the plugin catalog.
 *
 * One compact card per installable plugin of the Ocean market: the symbol and product name on one row, the localized
 * title, one description, and a setup link for the two plugins that have a guide page.
 */

function PluginCard({ plugin, locale, ui }: { plugin: Plugin; locale: Locale; ui: Translate }) {
  return (
    <article className="plugin-card">
      <p className="plugin-head">
        <PluginSymbol icon={plugin.icon} />
        <span className="plugin-kicker">{plugin.product}</span>
      </p>
      <h2>{plugin.title[locale]}</h2>
      <p>{plugin.description[locale]}</p>
      {plugin.guide ? (
        <a className="text-link" href={localizedPath(plugin.guide, locale)}>
          {ui('Как подключить')} <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </article>
  );
}

/**
 * Metadata of `/plugins/`.
 *
 * @param locale the locale whose title and description are emitted.
 * @returns the Next metadata object, including the full `hreflang` set.
 */
export function pluginsMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'plugins',
    locale,
    title: ui('Плагины — Ocean'),
    description: ui('Плагины Ocean: браузер, приложения компьютера, модели и инструменты разработки. Управляйте ими в одном рабочем пространстве.'),
  });
}

export function PluginsPage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="plugins" current="plugins" className="plugin-page wrap">
      <section className="plugin-intro" aria-labelledby="plugins-title">
        <p className="eyebrow">{ui('Снаряжение для ваших задач')}</p>
        <h1 id="plugins-title">
          {ui('Больше возможностей.')}
          <br />
          {ui('Ваш Ocean.')}
        </h1>
        <p className="plugin-lead">{ui('Подключите браузер, приложения и модели, с которыми работаете каждый день.')}</p>
      </section>
      <div className="plugin-grid">
        {PLUGINS.map(plugin => (
          <PluginCard key={plugin.id} plugin={plugin} locale={locale} ui={ui} />
        ))}
      </div>
      <section className="plugin-team" aria-labelledby="team-title">
        <span className="plugin-symbol">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        </span>
        <div>
          <p className="eyebrow">{ui('Возможность Ocean')}</p>
          <h2 id="team-title">{ui('Команда агентов')}</h2>
          <p>{ui('Распределяйте задачи и следите за общим прогрессом.')}</p>
        </div>
      </section>
      <section className="plugin-start" aria-labelledby="start-title">
        <div>
          <h2 id="start-title">{ui('Соберите своё рабочее пространство')}</h2>
          <p>{ui('Управляйте инструментами и подключениями в разделе «Плагины» приложения.')}</p>
        </div>
        <a className="button primary" href={localizedPath('downloads', locale)}>
          {ui('Скачать Ocean')} <span aria-hidden="true">↓</span>
        </a>
      </section>
    </PageShell>
  );
}
