import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';
import { PageShell } from '../components/page-shell.tsx';

/**
 * The landing page: hero, a scripted chat demo, three feature steps, the equipment list, permissions, FAQ,
 * the Ocean Pass block for users in Russia, and the install call.
 *
 * The demo block is decorative markup, not a widget: every pane is `aria-hidden` because it illustrates a finished
 * exchange rather than offering one. The `js` class and the language picker live in the shared chrome.
 */

/** A stroked line icon from the published set; `.icon` sizes it and sets the stroke weight. */
function Mark({ children }: { children: ReactNode }) {
  return (
    <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const DOWNLOAD = <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>;
const EXTERNAL = <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>;
const GLOBE = <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>;

export function homeMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'home',
    locale,
    title: ui('Ocean — harness для AI-агентов'),
    description: ui('Ocean — открытое настольное приложение. Подключайте любые модели, управляйте браузером, ставьте плагины в один клик и работайте в одном чате.'),
    socialDescription: ui('Harness для AI-агентов. Все плагины уже внутри.'),
  });
}

export function HomePage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  const downloads = localizedPath('downloads', locale);
  const start = localizedPath('start', locale);
  const plugins = localizedPath('plugins', locale);
  return (
    <PageShell locale={locale} ui={ui} page="home" current="features" className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap hero-inner">
          <p className="eyebrow">{ui('Ocean / открытый код')}</p>
          <h1 id="hero-title">{ui('Harness для AI-агентов.')}<br />{ui('Все плагины уже внутри.')}</h1>
          <div className="hero-art" aria-hidden="true">
            <picture>
              <source type="image/webp" srcSet="/assets/ocean-whale-640.webp 640w, /assets/ocean-whale-1040.webp 1040w, /assets/ocean-whale-1672.webp 1672w" sizes="(max-width: 360px) calc(100vw - 32px), (max-width: 760px) calc(100vw - 48px), (max-width: 1440px) 73vw, 1050px" />
              <img src="/ocean-whale-line.png" alt="" width="1672" height="941" fetchPriority="high" />
            </picture>
          </div>
          <p className="lead">{ui('Ocean — открытое настольное приложение. Подключайте любые модели, управляйте браузером, ставьте плагины в один клик и работайте в одном чате.')}</p>
          <div className="actions">
            <a className="button primary" href={downloads}>{ui('Скачать Ocean')} <span><Mark>{DOWNLOAD}</Mark></span></a>
            <a className="button secondary" href="#demo">{ui('Как работает Ocean')} <span><Mark>{DOWNLOAD}</Mark></span></a>
          </div>
          <p className="hero-note">{ui('macOS, Windows и Linux.')}</p>
        </div>
      </section>
      <section id="demo" className="demo wrap" aria-labelledby="demo-title">
        <div className="demo-heading">
          <h2 id="demo-title" className="eyebrow">{ui('От заметок — к готовому плану')}</h2>
          <span>{ui('Пример работы Ocean')}</span>
        </div>
        <div className="app-preview">
          <div className="app-titlebar" aria-hidden="true"><span className="window-dots"><i /><i /><i /></span><span>Ocean</span></div>
          <aside className="app-sidebar" aria-hidden="true">
            <div className="app-brand"><img src="/ocean-logo.svg" alt="" width="36" height="36" />Ocean</div>
            <div className="app-new">{ui('+ Новая сессия')}</div>
            <div className="app-sidebar-links"><span>{ui('Автоматизация')}</span><span>{ui('Плагины')}</span></div>
            <div className="app-workspace-label">{ui('Рабочие пространства')}</div>
            <div className="app-project">{ui('Мой проект')}</div>
            <div className="app-selected">{ui('Командная встреча')}</div>
          </aside>
          <div className="app-chat" data-demo-label={ui('Ocean / Пример сценария')}>
            <div className="app-breadcrumb">{ui('Мой проект')} <span>/</span> {ui('Командная встреча')}</div>
            <div className="app-message">{ui('Собери из моих заметок план встречи на 30 минут. Выдели решения, которые нужно принять.')}</div>
            <details className="demo-notes">
              <summary>{ui('Что было в заметках')}</summary>
              <p>{ui('Нужно согласовать дату запуска, распределить оставшиеся задачи и решить, кто проверяет результат. Вся команда может выделить полчаса.')}</p>
            </details>
            <div className="app-result">
              <p className="app-tool">
                <Mark><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></Mark>
                {ui('Заметки прочитаны · План составлен')}
              </p>
              <h3>{ui('План командной встречи')}</h3>
              <ol className="meeting-plan">
                <li><span className="meeting-time">{ui('5 мин')}</span><div><strong>{ui('Сверить готовность')}</strong><p>{ui('Что уже сделано и что мешает запуску.')}</p></div></li>
                <li><span className="meeting-time">{ui('15 мин')}</span><div><strong>{ui('Принять решения')}</strong><p>{ui('Выбрать дату запуска и назначить ответственных.')}</p></div></li>
                <li><span className="meeting-time">{ui('10 мин')}</span><div><strong>{ui('Зафиксировать следующий шаг')}</strong><p>{ui('Кто проверит результат и когда вернёмся к нему.')}</p></div></li>
              </ol>
              <div className="demo-outcome">
                <span className="feature-index">{ui('НА ВЫХОДЕ')}</span>
                <p>{ui('Дата запуска, ответственные и список следующих действий.')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="demo-next">
          <p>{ui('Начните со своей задачи. Добавьте файлы или опишите контекст прямо в чате.')}</p>
          <a className="text-link" href={start}>{ui('Начать работу с Ocean')} <span aria-hidden="true">→</span></a>
        </div>
      </section>
      <section id="features" className="features wrap" aria-labelledby="features-title">
        <p className="eyebrow">{ui('01 / Ваша экспедиция')}</p>
        <h2 id="features-title">{ui('От вопроса — к ясному результату.')}</h2>
        <p className="section-lead">{ui('Контекст, инструменты и ход работы собраны в одном месте.')}</p>
        <ol className="feature-grid">
          <li><span className="feature-index">01</span><div><h3>{ui('Задайте направление')}</h3><p>{ui('Опишите результат и добавьте контекст: проект, файлы или ссылки.')}</p></div></li>
          <li><span className="feature-index">02</span><div><h3>{ui('Исследуйте вместе')}</h3><p>{ui('Агент изучает материалы и работает с подключёнными инструментами.')}</p></div></li>
          <li><span className="feature-index">03</span><div><h3>{ui('Продолжайте с результатом')}</h3><p>{ui('Читайте ответы, проверяйте действия и возвращайтесь к сохранённым чатам.')}</p></div></li>
        </ol>
      </section>
      <section className="equipment wide-panel" aria-labelledby="equipment-title">
        <div className="equipment-copy">
          <p className="eyebrow">{ui('02 / Снаряжение')}</p>
          <h2 id="equipment-title">{ui('Снаряжение')}<br />{ui('для ваших задач.')}</h2>
          <p className="section-lead">{ui('Соберите команду агентов, подключите')}<br className="desktop-break" /> {ui('браузер и приложения для своей задачи.')}</p>
          <a className="text-link" href={plugins}>{ui('Все плагины')} <span><Mark><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Mark></span></a>
        </div>
        <ul className="equipment-list">
          <li>
            <span className="feature-icon"><Mark><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Mark></span>
            <div><h3>{ui('Команда агентов')}</h3><p>{ui('Распределяйте задачи и следите')}<br className="desktop-break" /> {ui('за общим прогрессом.')}</p></div>
          </li>
          <li>
            <span className="feature-icon"><Mark>{GLOBE}</Mark></span>
            <div><h3>{ui('Управление браузером')}</h3><p>{ui('Ваш Chrome с сохранёнными входами.')}<br className="desktop-break" /> {ui('Страницы, формы и работа с вкладками.')}</p></div>
          </li>
          <li>
            <span className="feature-icon"><Mark><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" /></Mark></span>
            <div><h3>{ui('Управление приложениями')}</h3><p>{ui('Снимки окон и управление')}<br className="desktop-break" /> {ui('разрешёнными приложениями.')}</p></div>
          </li>
        </ul>
      </section>
      <section className="control wrap" aria-labelledby="control-title">
        <div>
          <p className="eyebrow">{ui('03 / Вы у штурвала')}</p>
          <h2 id="control-title">{ui('Возможности — глубже.')}<br />{ui('Управление — у вас.')}</h2>
        </div>
        <div className="control-copy">
          <h3>{ui('Вы выбираете, к чему подключается Ocean.')}</h3>
          <p>{ui('Вход в аккаунт и другие ручные шаги')}<br className="desktop-break" /> {ui('остаются за вами.')}</p>
          <ul className="permissions">
            <li><span><Mark>{GLOBE}</Mark></span><span>{ui('Сайты')}</span><small>{ui('Вы выбираете')}</small></li>
            <li><span><Mark><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 4v4" /><path d="M2 8h20" /><path d="M6 4v4" /></Mark></span><span>{ui('Приложения')}</span><small>{ui('Вы выбираете')}</small></li>
            <li><span><Mark><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></Mark></span><span>{ui('Ручной шаг')}</span><small>{ui('Ваше управление')}</small></li>
          </ul>
        </div>
      </section>
      <section className="faq wrap" aria-labelledby="faq-title">
        <div>
          <p className="eyebrow">{ui('04 / Перед погружением')}</p>
          <h2 id="faq-title">{ui('Пара вопросов')}<br />{ui('перед стартом.')}</h2>
        </div>
        <div className="faq-answers">
          <div><h3>{ui('Нужна ли подписка на модель?')}</h3><p>{ui('Подключите свой аккаунт или API-ключ. Доступ к моделям и стоимость определяет выбранный провайдер.')}</p></div>
          <div><h3>{ui('С чего начать после установки?')}</h3><p>{ui('Добавьте провайдера в «Настройки → Модели» и создайте первую сессию.')} <a href={start}>{ui('Пройти настройку шаг за шагом')}</a>.</p></div>
        </div>
      </section>
      <section id="ocean-pass" className="pass wrap" aria-labelledby="pass-title">
        <div>
          <p className="eyebrow">{ui('Ocean Pass')}</p>
          <h2 id="pass-title">{ui('GPT, Claude и Gemini')}<br />{ui('в России — через один ключ.')}</h2>
          <p className="section-lead">{ui('Один API-ключ к ведущим моделям. Оплата в рублях, закрывающие документы для ИП и ООО.')}</p>
          <a className="button primary" href="https://oceanpass.ru">{ui('Открыть Ocean Pass')} <span><Mark>{EXTERNAL}</Mark></span></a>
        </div>
        <div className="pass-aside">
          <p>{ui('В Ocean, Cursor, Cline и Claude Code меняется только base_url.')}</p>
          <dl className="pass-url">
            <dt><code>base_url</code></dt>
            <dd><code>https://oceanpass.ru/v1</code></dd>
          </dl>
        </div>
      </section>
      <section id="install" className="install wide-panel" aria-labelledby="install-title">
        <div>
          <p className="eyebrow">{ui('Начало работы')}</p>
          <h2 id="install-title">{ui('Начните с Ocean')}</h2>
          <p className="section-lead">{ui('Скачайте приложение для своей системы, подключите модель и задайте первую задачу.')}</p>
          <a className="button primary" href={downloads}>{ui('Скачать Ocean')} <span><Mark>{DOWNLOAD}</Mark></span></a>
        </div>
        <ol className="install-steps">
          <li><span>01</span>{ui('Установите приложение')}</li>
          <li><span>02</span>{ui('Выберите свою модель')}</li>
          <li><span>03</span>{ui('Начните разговор')}</li>
        </ol>
      </section>
    </PageShell>
  );
}
