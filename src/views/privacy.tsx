import type { Metadata } from 'next';
import '../styles/plugins.css';
import '../styles/privacy.css';
import { PageShell } from '../components/page-shell.tsx';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages, type Translate } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/privacy/` — the data-handling policy.
 *
 * A three-card overview, then one `<section>` per topic, each labelled by its `<h2>` id. The section ids (`local-data`
 * … `privacy-contact`) are the published anchors, and the DeepSeek disclosure keeps its `<details>` so the advanced
 * configuration note stays collapsed by default.
 */

/**
 * Metadata of `/privacy/`.
 *
 * @param locale the locale whose title and description are emitted.
 * @returns the Next metadata object, including the full `hreflang` set.
 */
export function privacyMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'privacy',
    locale,
    title: ui('Ваши данные — Ocean'),
    description: ui('Как Ocean хранит чаты, передаёт контекст модели и позволяет управлять доступом плагинов и сохранёнными данными.'),
    socialDescription: ui('Что сохраняется на устройстве, что получает модель и как управлять данными.'),
  });
}

export function PrivacyPage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="privacy" current="privacy" className="policy-page privacy-page wrap">
      <p className="eyebrow">{ui('Прозрачно о данных')}</p>
      <h1>{ui('Ваши данные в Ocean')}</h1>
      <p>{ui('Чаты сохраняются на вашем компьютере. Для ответа Ocean передаёт контекст выбранной модели, а подключённые инструменты обращаются к нужным для задачи сервисам.')}</p>
      <div className="privacy-overview">
        <article>
          <h2>{ui('На устройстве')}</h2>
          <p>{ui('История чатов, настройки и сохранённые подключения.')}</p>
        </article>
        <article>
          <h2>{ui('У провайдера модели')}</h2>
          <p>{ui('Сообщения и материалы, включённые в запрос.')}</p>
        </article>
        <article>
          <h2>{ui('Под вашим контролем')}</h2>
          <p>{ui('Выбор модели, плагинов, сайтов и приложений.')}</p>
        </article>
      </div>
      <section aria-labelledby="local-data">
        <h2 id="local-data">{ui('Что сохраняется локально')}</h2>
        <p>{ui('В обычном настольном режиме Ocean хранит историю сообщений и действий инструментов, вложения, настройки и данные подключений в папке данных приложения. По умолчанию это')} <code>~/.ocean</code>{ui('; в собственной конфигурации расположение можно изменить.')}</p>
        <p>{ui('API-ключи и данные авторизации сохраняются отдельно от текста настроек. Защита локальных файлов зависит от доступа к вашему компьютеру: это не изолированное от всех инструментов агента хранилище.')}</p>
      </section>
      <section aria-labelledby="model-data">
        <h2 id="model-data">{ui('Что получает модель')}</h2>
        <p>{ui('Запрос отправляется провайдеру, которого вы подключили. В него могут входить сообщения чата, прочитанные для задачи файлы, текст страниц, снимки окон и результаты инструментов. Локальное хранение истории не означает, что обработка модели тоже происходит локально.')}</p>
        <p>{ui('Сроки хранения и использование данных на стороне провайдера определяются его условиями и настройками вашего аккаунта. Сервисы поиска, внешние инструменты и сторонние плагины также имеют собственные правила обработки данных.')}</p>
      </section>
      <section aria-labelledby="plugin-data">
        <h2 id="plugin-data">{ui('Браузер и приложения')}</h2>
        <p>{ui('Выбирайте разрешённые сайты и приложения в настройках соответствующего плагина. Снимки и прочитанное содержимое могут стать частью чата и запроса к модели. Доступ можно отозвать, а плагин — выключить.')}</p>
        <p>{ui('Для расширения Chrome отдельно описаны его разрешения, сопряжение и хранение данных:')} <a href={localizedPath('browser-control-privacy', locale)}>{ui('конфиденциальность Browser Control')}</a>.</p>
      </section>
      <section aria-labelledby="sharing">
        <h2 id="sharing">{ui('Отправка журналов и диагностика')}</h2>
        <p>{ui('При работе через адаптер DeepSeek есть отдельная настройка')} <strong>{ui('«Отправлять журнал с запросами API DeepSeek»')}</strong> {ui('в разделе «Настройки → Основные». В базовой конфигурации она включена: к API-запросу добавляется журнал чата, включая сообщения и результаты инструментов. Повторное включение может отправить и ранее накопленные записи.')}</p>
        <p>{ui('Отдельная отправка журналов в сервис телеметрии отключена в базовой конфигурации Ocean. Продуктовая аналитика требует явно настроенного получателя и отдельного включения.')}</p>
        <p>{ui('Адаптер DeepSeek также передаёт случайный идентификатор установки, который сохраняется между запусками. Это не зависит от настройки телеметрии.')}</p>
        <details className="privacy-detail">
          <summary>{ui('Если вы используете собственную конфигурацию')}</summary>
          <p>{ui('Конфигурация может включать другие получатели данных. Встроенный механизм отправки отзывов при включении передаёт журнал до момента отзыва, включая контекст. Проверяйте настройки своей сборки и подключённых провайдеров.')}</p>
        </details>
      </section>
      <section aria-labelledby="remove-data">
        <h2 id="remove-data">{ui('Как управлять сохранёнными данными')}</h2>
        <p>{ui('Архивирование скрывает чат из основного списка, но не удаляет его журнал. Удаление рабочего пространства также не удаляет его папку и историю чатов.')}</p>
        <p>{ui('Для удаления всех локальных данных Ocean сначала закройте приложение и сохраните нужные результаты, затем удалите папку данных приложения. Вместе с ней будут удалены локальные чаты, настройки и сохранённые подключения всех профилей в этой папке. При нестандартном расположении данных')} <a href="https://t.me/oceanchatsupportbot">{ui('уточните путь у поддержки')}</a>{ui(', прежде чем удалять файлы.')}</p>
        <p>{ui('Это не удаляет файлы ваших проектов, внешние резервные копии, данные расширения Chrome или материалы, уже переданные провайдерам. Ими нужно управлять в соответствующем приложении или сервисе.')}</p>
      </section>
      <section aria-labelledby="website-data">
        <h2 id="website-data">{ui('Что делает этот сайт')}</h2>
        <p>{ui('На сайте нет форм регистрации, рекламных трекеров и встроенных сторонних счётчиков. Шрифты и изображения загружаются с домена Ocean. Страница загрузок обращается к GitHub за списком опубликованных файлов.')}</p>
        <p>{ui('Сайт размещён на GitHub Pages. При обращении к сайту, GitHub или внешним ссылкам соответствующие сервисы получают обычные данные сетевого запроса. Правила GitHub описаны в')} <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">{ui('его политике конфиденциальности')}</a>.</p>
      </section>
      <section className="privacy-contact" aria-labelledby="privacy-contact">
        <h2 id="privacy-contact">{ui('Вопросы о данных')}</h2>
        <p>{ui('Напишите в')} <a href="https://t.me/oceanchatsupportbot">{ui('поддержку Ocean')}</a> {ui('или на')} <a href="mailto:support@oceanharness.com">support@oceanharness.com</a>{ui('. Не прикладывайте API-ключи, пароли и полный журнал чата без необходимости.')}</p>
      </section>
      <p className="privacy-updated">{ui('Обновлено 17 ноября 2026.')}</p>
    </PageShell>
  );
}
