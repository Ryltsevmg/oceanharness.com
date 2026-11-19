import type { Metadata } from 'next';
import '../styles/plugins.css';
import '../styles/start.css';
import { PluginSymbol } from '../components/icons.tsx';
import { PageShell } from '../components/page-shell.tsx';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/plugins/computer-use/` — the Computer Use setup guide.
 *
 * Three numbered steps: enabling the plugin, granting the system permissions per platform, and checking access with a
 * first chat task. The platform disclosures open on macOS because it is the platform that needs the two permissions
 * before anything works. `Computer Use` and the platform names stay literal in every locale.
 */

/**
 * Metadata of `/plugins/computer-use/`.
 *
 * @param locale the locale whose title and description are emitted.
 * @returns the Next metadata object, including the full `hreflang` set.
 */
export function computerUseMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'computer-use',
    locale,
    title: ui('Управление приложениями — Ocean'),
    description: ui('Подключите Computer Use к Ocean. Настройте системные разрешения, выберите приложение и проверьте доступ первой задачей.'),
    socialDescription: ui('Настройте доступ к приложениям и управляйте ими через чат Ocean.'),
  });
}

/**
 * The Computer Use guide in one locale.
 *
 * @param locale the locale whose text and routes the page renders.
 * @returns the framed guide page.
 */
export function ComputerUsePage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="computer-use" current="plugins" className="plugin-page guide-page wrap">
      <a className="plugin-back" href={localizedPath('plugins', locale)}>
        <span aria-hidden="true">←</span> {ui('Все плагины')}
      </a>
      <section className="plugin-intro browser-intro" aria-labelledby="computer-title">
        <PluginSymbol icon="cursor" />
        <p className="eyebrow">Computer Use</p>
        <h1 id="computer-title">
          {ui('Ваши приложения.')}
          <br />
          {ui('Помощь Ocean.')}
        </h1>
        <p className="plugin-lead">{ui('Разрешите Ocean читать интерфейс и выполнять задачи в нужных приложениях. Доступ к каждому приложению выбираете вы.')}</p>
        <nav className="guide-route" aria-label={ui('Шаги подключения приложений')}>
          <a href="#enable">
            <span aria-hidden="true">01</span> {ui('Включить плагин')}
          </a>
          <a href="#permissions">
            <span aria-hidden="true">02</span> {ui('Настроить систему')}
          </a>
          <a href="#try">
            <span aria-hidden="true">03</span> {ui('Проверить в чате')}
          </a>
        </nav>
      </section>
      <section className="guide-section" id="enable" aria-labelledby="enable-title">
        <div className="guide-heading">
          <p className="eyebrow">{ui('Шаг 01')}</p>
          <h2 id="enable-title">{ui('Включите плагин')}</h2>
          <p>{ui('Начните в разделе «Плагины» в боковой панели Ocean.')}</p>
        </div>
        <div className="guide-panel">
          <ol className="guide-instructions">
            <li>
              <h3>{ui('Откройте «Использование компьютера»')}</h3>
              <p>{ui('Включите переключатель в карточке плагина. Если Ocean попросит перезапуск, выполните его.')}</p>
            </li>
            <li>
              <h3>{ui('Оставьте карточку открытой')}</h3>
              <p>{ui('Здесь показана готовность системы и разрешения на доступ к приложениям.')}</p>
            </li>
          </ol>
          <p className="guide-note">
            {ui('Если карточки нет в списке, плагин ещё не установлен.')}{' '}
            <a href="https://t.me/oceanchatsupportbot">{ui('Напишите в поддержку')}</a> {ui('— поможем с установкой для вашей системы.')}
          </p>
        </div>
      </section>
      <section className="guide-section" id="permissions" aria-labelledby="permissions-title">
        <div className="guide-heading">
          <p className="eyebrow">{ui('Шаг 02')}</p>
          <h2 id="permissions-title">{ui('Подготовьте систему')}</h2>
          <p>{ui('Выберите свою ОС. Возможности плагина различаются между платформами.')}</p>
        </div>
        <div className="guide-panel guide-platforms computer-platforms">
          <details open>
            <summary>macOS</summary>
            <div>
              <ol>
                <li>{ui('В строках «Доступность» и «Запись экрана» нажмите «Запросить разрешение».')}</li>
                <li>{ui('В системных настройках разрешите доступ приложению, которое указано в панели Ocean.')}</li>
                <li>{ui('Вернитесь в Ocean. У обоих разрешений должен появиться статус «Разрешено».')}</li>
              </ol>
              <p>{ui('После настройки доступны чтение интерфейса, снимки окон, нажатия, ввод текста и прокрутка.')}</p>
            </div>
          </details>
          <details>
            <summary>Windows</summary>
            <div>
              <ol>
                <li>{ui('Запустите Ocean в обычном сеансе Windows с разблокированным рабочим столом.')}</li>
                <li>{ui('В карточке проверьте «Интерактивный рабочий стол» и «Захват окон».')}</li>
                <li>{ui('Для действий мышью и клавиатурой оставьте нужное приложение на переднем плане.')}</li>
              </ol>
              <p>{ui('Доступны чтение интерфейса, снимки окон и управление. Приложения, запущенные от администратора, могут отказать в доступе.')}</p>
              <p>
                {ui('Если нативный компонент недоступен,')} <a href="https://t.me/oceanchatsupportbot">{ui('обратитесь в поддержку')}</a>{' '}
                {ui('для его настройки под вашу систему.')}
              </p>
            </div>
          </details>
          <details>
            <summary>Linux</summary>
            <div>
              <ol>
                <li>{ui('Запустите Ocean в своём локальном графическом сеансе и разблокируйте рабочий стол.')}</li>
                <li>{ui('В карточке проверьте доступность AT-SPI. Нужны системный Python 3, PyGObject и AT-SPI; плагин не устанавливает их автоматически.')}</li>
                <li>{ui('Откройте приложение с поддержкой AT-SPI.')}</li>
              </ol>
              <p>{ui('Доступны чтение элементов интерфейса и действия, которые предоставляет само приложение. Снимки экрана, обычный ввод мышью и клавиатурой, запуск приложений не поддерживаются.')}</p>
            </div>
          </details>
        </div>
      </section>
      <section className="guide-section" id="try" aria-labelledby="try-title">
        <div className="guide-heading">
          <p className="eyebrow">{ui('Шаг 03')}</p>
          <h2 id="try-title">{ui('Проверьте доступ в чате')}</h2>
          <p>
            {ui('Для начала достаточно прочитать окно. Модель должна быть')}{' '}
            <a href={`${localizedPath('start', locale)}#model`}>{ui('подключена в Ocean')}</a>.
          </p>
        </div>
        <div className="guide-panel">
          <ol className="guide-instructions">
            <li>
              <h3>{ui('Откройте нужное приложение')}</h3>
              <p>{ui('Выберите окно без личных данных — например, текстовый редактор с тестовой заметкой.')}</p>
            </li>
            <li>
              <h3>{ui('Попросите Ocean посмотреть окно')}</h3>
              <blockquote className="guide-prompt computer-example">{ui('Прочитай открытое окно моего текстового редактора и кратко опиши, что в нём видно. Ничего не изменяй.')}</blockquote>
              <p className="guide-note">{ui('Укажите название своего редактора, если открыто несколько приложений.')}</p>
            </li>
            <li>
              <h3>{ui('Подтвердите доступ')}</h3>
              <p>{ui('Ocean запросит разрешение на выбранное приложение. После подтверждения прочитает доступные элементы и ответит в чате.')}</p>
            </li>
          </ol>
        </div>
      </section>
      <section className="guide-next" aria-labelledby="access-title">
        <div>
          <p className="eyebrow">{ui('Вы управляете доступом')}</p>
          <h2 id="access-title">{ui('Остановить или отозвать')}</h2>
          <p>{ui('Нажмите «Остановить» в чате, чтобы прервать текущую работу. В карточке плагина нажмите «Отозвать» рядом с приложением, чтобы убрать его разрешение.')}</p>
        </div>
        <div>
          <p>{ui('Список приложений заполняется после запросов доступа. Пустой список до первой задачи — нормальное состояние.')}</p>
          <a className="text-link" href={localizedPath('privacy', locale)}>
            {ui('Подробнее о данных')} <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <section className="guide-trouble" aria-labelledby="help-title">
        <h2 id="help-title">{ui('Не удаётся подключить?')}</h2>
        <p>
          <a href="https://t.me/oceanchatsupportbot">{ui('Напишите в поддержку Ocean')}</a>
          {ui('. Укажите систему, название приложения и сообщение из карточки плагина.')}
        </p>
      </section>
    </PageShell>
  );
}
