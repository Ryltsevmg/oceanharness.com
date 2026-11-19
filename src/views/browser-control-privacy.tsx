import type { Metadata } from 'next';
import '../styles/plugins.css';
import '../styles/privacy.css';
import { PageShell } from '../components/page-shell.tsx';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/plugins/browser-control/privacy/` — the Browser Control extension privacy policy.
 *
 * The published English address, kept for the URL that Chrome Web Store and the extension already point at; Russian
 * lives under `ru/`. The legacy page carried a row of policy-language links that the old localizer stripped from
 * every output — the header language picker replaces it, so the row is not ported. Permission names, the contact
 * address and the `Browser Control` product name stay literal in every locale.
 */

/**
 * Metadata of the Browser Control policy.
 *
 * @param locale the locale whose title and description are emitted.
 * @returns the Next metadata object, including the full `hreflang` set.
 */
export function browserControlPrivacyMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'browser-control-privacy',
    locale,
    title: ui('Конфиденциальность Browser Control — Ocean'),
    description: ui('Как расширение Ocean Browser Control для Chrome обрабатывает данные страниц, хранит настройки и использует разрешения браузера.'),
    socialDescription: ui('Данные страниц, разрешения Chrome и управление доступом расширения Ocean.'),
  });
}

/**
 * The Browser Control policy in one locale.
 *
 * @param locale the locale whose text and routes the page renders.
 * @returns the framed policy page.
 */
export function BrowserControlPrivacyPage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="browser-control-privacy" current="plugins" className="policy-page wrap">
      <a className="plugin-back" href={localizedPath('browser-control', locale)}>
        <span aria-hidden="true">←</span> Browser Control
      </a>
      <h1>{ui('Конфиденциальность Browser Control')}</h1>
      <p>
        {ui('Действует с 16 ноября 2026 года. Эта политика относится к расширению Ocean Browser Control для Chrome. О хранении чатов и обработке данных в самом приложении читайте на странице')}{' '}
        <a href={localizedPath('privacy', locale)}>{ui('«Ваши данные в Ocean»')}</a>.
      </p>
      <h2>{ui('Что делает расширение')}</h2>
      <p>{ui('Расширение соединяет Chrome с сопряжённым сервисом связи, чтобы Ocean мог управлять вкладками задач и вкладками, которые вы передали через кнопку на панели браузера. В Ocean есть отдельная настройка разрешённых сайтов. Разрешения Chrome шире этой настройки: ограничение действует на уровне приложения, а не отдельной песочницы Chrome.')}</p>
      <h2>{ui('Какие данные обрабатываются')}</h2>
      <p>{ui('По запросу расширение может читать текст и структуру страниц, адреса, заголовки вкладок, снимки экрана и значения полей; нажимать элементы, вводить текст и управлять вкладками. Страницы могут содержать персональные данные, сведения для авторизации, финансовую, медицинскую и другую чувствительную информацию. Сервис связи также поддерживает запись переданных вкладок по запросу. Входы на сайты остаются в вашем профиле Chrome и используются через обычную сессию браузера.')}</p>
      <h2>{ui('Куда передаются данные')}</h2>
      <p>{ui('По умолчанию расширение обменивается командами и результатами с сервисом связи на вашем компьютере. В расширенных настройках можно указать выбранный вами сервис на другом компьютере. Используйте только сервис и сеть, которым доверяете. Ocean может передавать содержимое страниц и снимки экрана провайдеру модели, выбранному для задачи. В этом случае действуют условия и политика конфиденциальности провайдера. Само расширение не выбирает провайдера модели.')}</p>
      <p>{ui('У расширения нет рекламного или аналитического сервиса; оно не отправляет данные браузера на сервер сбора данных Ocean. Данные браузера используются для запрошенных действий: они не продаются и не используются для рекламы, профилирования или посторонних целей. Использование и передача данных соответствуют политике Chrome Web Store в отношении пользовательских данных и требованиям Limited Use.')}</p>
      <h2>{ui('Хранение и удаление')}</h2>
      <p>{ui('Расширение сохраняет данные сопряжения и настройки в хранилище расширений Chrome. Данные доступа к сервису связи и записи задач Ocean хранятся отдельно. Удаление расширения удаляет его локальное хранилище. При этом журналы чатов Ocean, файлы сервиса связи и уже переданные провайдеру модели копии остаются: ими нужно управлять в соответствующем приложении или сервисе.')}</p>
      <h2>{ui('Разрешения Chrome')}</h2>
      <ul>
        <li>
          <strong>debugger:</strong> {ui('просмотр переданных страниц, снимки экрана и действия в браузере через Chrome DevTools Protocol.')}
        </li>
        <li>
          <strong>{ui('tabs и tabGroups:')}</strong> {ui('управление вкладками задач и их группировка по сессиям агента.')}
        </li>
        <li>
          <strong>storage:</strong> {ui('локальное хранение данных сопряжения и настроек.')}
        </li>
        <li>
          <strong>alarms:</strong> {ui('повторное подключение к сервису связи после приостановки фонового процесса расширения.')}
        </li>
        <li>
          <strong>{ui('offscreen и tabCapture:')}</strong> {ui('обработка запрошенных записей переданных вкладок.')}
        </li>
        <li>
          <strong>webNavigation:</strong> {ui('связь всплывающих окон и переходов с вкладками задачи.')}
        </li>
        <li>
          <strong>scripting:</strong> {ui('запуск включённых в расширение вспомогательных скриптов для работы со страницей.')}
        </li>
        <li>
          <strong>notifications:</strong> {ui('уведомления, когда задаче требуется ваше участие.')}
        </li>
        <li>
          <strong>{ui('Доступ ко всем сайтам:')}</strong> {ui('работа с выбранными пользователем сайтами и связь с настроенным сервисом. Расширение не запрашивает доступ ко всей базе истории посещений.')}
        </li>
      </ul>
      <h2>{ui('Ваш контроль')}</h2>
      <p>{ui('Выбирайте разрешённые сайты в Ocean, явно передавайте существующие вкладки и выключайте плагин или расширение, чтобы прекратить их использование. Проверяйте задачи перед действиями на страницах с чувствительными данными. Не вводите секреты в задачу, если не намерены передать их выбранному провайдеру модели.')}</p>
      <h2>{ui('Контакты')}</h2>
      <p>
        {ui('По вопросам конфиденциальности и запросам, связанным с данными, пишите на')} <a href="mailto:support@oceanharness.com">support@oceanharness.com</a>{' '}
        {ui('или в')} <a href="https://t.me/oceanchatsupportbot">{ui('поддержку Ocean')}</a>
        {ui('. Обновления политики будут опубликованы на этой странице с новой датой вступления в силу.')}
      </p>
    </PageShell>
  );
}
