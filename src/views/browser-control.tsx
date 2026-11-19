import type { Metadata } from 'next';
import '../styles/plugins.css';
import { PluginSymbol } from '../components/icons.tsx';
import { PageShell } from '../components/page-shell.tsx';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/plugins/browser-control/` — the Browser Control setup guide.
 *
 * Two install steps, the tab-control explainer and the link to the extension privacy policy. The `Browser Control`
 * product name and the page title are published as-is in every locale, so they stay literal; only the Russian copy
 * goes through `ui`.
 */

/**
 * Metadata of `/plugins/browser-control/`.
 *
 * @param locale the locale whose description is emitted; the title is the untranslated product name.
 * @returns the Next metadata object, including the full `hreflang` set.
 */
export function browserControlMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'browser-control',
    locale,
    title: 'Browser Control — Ocean',
    description: ui('Подключите Google Chrome к Ocean с сохранёнными входами. Работайте с разрешёнными сайтами, формами и вкладками через чат.'),
    socialDescription: ui('Подключите Google Chrome к Ocean с сохранёнными входами. Работайте с разрешёнными сайтами, формами и вкладками через чат.'),
  });
}

/**
 * The Browser Control guide in one locale.
 *
 * @param locale the locale whose text and routes the page renders.
 * @returns the framed guide page.
 */
export function BrowserControlPage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="browser-control" current="plugins" className="plugin-page wrap">
      <a className="plugin-back" href={localizedPath('plugins', locale)}>
        <span aria-hidden="true">←</span> {ui('Все плагины')}
      </a>
      <section className="plugin-intro browser-intro" aria-labelledby="browser-title">
        <PluginSymbol icon="globe" />
        <p className="eyebrow">Browser Control</p>
        <h1 id="browser-title">
          {ui('Ваш Chrome.')}
          <br />
          {ui('Возможности Ocean.')}
        </h1>
        <p className="plugin-lead">{ui('Читайте страницы, заполняйте формы и работайте с вкладками через чат. Входы на сайты сохраняются в вашем обычном профиле Chrome.')}</p>
      </section>
      <section className="browser-setup" aria-labelledby="setup-title">
        <div>
          <p className="eyebrow">{ui('Начало работы')}</p>
          <h2 id="setup-title">
            {ui('Подключение')}
            <br />
            {ui('в два шага')}
          </h2>
          <p>{ui('Начните в разделе «Плагины» → «Управление браузером» в Ocean.')}</p>
        </div>
        <ol className="setup-steps">
          <li>
            <span className="step-number" aria-hidden="true">01</span>
            <div>
              <h3>{ui('Установите расширение')}</h3>
              <p>{ui('Нажмите «Установить расширение» в Ocean и следуйте инструкции в Chrome.')}</p>
            </div>
          </li>
          <li>
            <span className="step-number" aria-hidden="true">02</span>
            <div>
              <h3>{ui('Подключитесь к Ocean')}</h3>
              <p>{ui('Вернитесь в приложение и нажмите «Подключиться». Затем выберите разрешённые сайты.')}</p>
            </div>
          </li>
        </ol>
      </section>
      <section className="browser-control" aria-labelledby="control-title">
        <div>
          <p className="eyebrow">{ui('Вы задаёте границы')}</p>
          <h2 id="control-title">{ui('Вкладки под вашим контролем')}</h2>
        </div>
        <div>
          <p>{ui('Для каждого чата Ocean открывает отдельные вкладки. Чтобы передать уже открытую личную вкладку, используйте кнопку расширения в Chrome.')}</p>
          <p>{ui('Подключение само по себе не даёт Ocean доступ ко всем сайтам. Разрешения можно изменить в приложении.')}</p>
          <a className="text-link" href={localizedPath('browser-control-privacy', locale)}>
            {ui('Как обрабатываются данные')} <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <section className="plugin-start" aria-labelledby="help-title">
        <div>
          <h2 id="help-title">{ui('Нужна помощь с подключением?')}</h2>
          <p>{ui('Напишите нам — поможем разобраться.')}</p>
        </div>
        <a className="button secondary" href="https://t.me/oceanchatsupportbot">
          {ui('Поддержка Ocean')} <span aria-hidden="true">↗</span>
        </a>
      </section>
    </PageShell>
  );
}
