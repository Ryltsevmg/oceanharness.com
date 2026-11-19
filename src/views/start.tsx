import type { Metadata } from 'next';
import '../styles/plugins.css';
import '../styles/start.css';
import { PageShell } from '../components/page-shell.tsx';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages, type Translate } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/start/` — the first-launch guide.
 *
 * Three numbered steps, each a `.guide-section` with a heading column and a panel: the platform installs as stacked
 * `<details>`, the model setup and the first chat as ordered instruction lists. The step navigation anchors to the
 * section ids, so `#install`, `#model` and `#first-chat` stay exactly as the published markup spells them.
 */

/**
 * Metadata of `/start/`.
 *
 * @param locale the locale whose title and description are emitted.
 * @returns the Next metadata object, including the full `hreflang` set.
 */
export function startMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'start',
    locale,
    title: ui('Первый запуск — Ocean'),
    description: ui('Установите Ocean, подключите свою модель и получите первый ответ. Короткая инструкция для macOS, Windows и Linux.'),
    socialDescription: ui('От установки до первого результата: три простых шага в Ocean.'),
  });
}

export function StartPage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="start" current="start" className="plugin-page guide-page wrap">
      <section className="plugin-intro" aria-labelledby="start-title">
        <p className="eyebrow">{ui('Начало погружения')}</p>
        <h1 id="start-title">
          {ui('От первого запуска')}
          <br />
          {ui('к первой задаче.')}
        </h1>
        <p className="plugin-lead">{ui('Установите Ocean, подключите модель и начните разговор. Браузер и приложения можно добавить позже.')}</p>
        <nav className="guide-route" aria-label={ui('Шаги первого запуска')}>
          <a href="#install"><span aria-hidden="true">01</span> {ui('Установить Ocean')}</a>
          <a href="#model"><span aria-hidden="true">02</span> {ui('Подключить модель')}</a>
          <a href="#first-chat"><span aria-hidden="true">03</span> {ui('Задать задачу')}</a>
        </nav>
      </section>
      <section className="guide-section" id="install" aria-labelledby="install-title">
        <div className="guide-heading">
          <p className="eyebrow">{ui('Шаг 01')}</p>
          <h2 id="install-title">{ui('Установите Ocean')}</h2>
          <p>{ui('На странице загрузки выберите свою систему и архитектуру.')}</p>
          <a className="button primary" href={localizedPath('downloads', locale)}>{ui('Выбрать загрузку')} <span aria-hidden="true">↓</span></a>
        </div>
        <div className="guide-panel guide-platforms">
          <details open>
            <summary>macOS</summary>
            <div>
              <ol>
                <li>{ui('Откройте DMG или распакуйте скачанный ZIP.')}</li>
                <li>{ui('Перенесите приложение Ocean в папку «Программы».')}</li>
                <li>{ui('Запустите Ocean из этой папки.')}</li>
              </ol>
              <p>{ui('Apple silicon подходит для чипов Apple M. Тип процессора можно посмотреть в меню Apple → «Об этом Mac».')}</p>
            </div>
          </details>
          <details>
            <summary>Windows</summary>
            <div>
              <ol>
                <li>{ui('Скачайте установщик, когда он доступен для вашей системы.')}</li>
                <li>{ui('Откройте файл и пройдите шаги установки.')}</li>
                <li>{ui('Запустите Ocean из меню «Пуск».')}</li>
              </ol>
            </div>
          </details>
          <details>
            <summary>Linux</summary>
            <div>
              <ol>
                <li>{ui('Распакуйте архив TAR.GZ в отдельную папку.')}</li>
                <li>{ui('Сохраните вместе все файлы из архива.')}</li>
                <li>{ui('Откройте терминал в распакованной папке и запустите')} <code>./ocean</code>.</li>
              </ol>
              <p>{ui('Команда')} <code>uname -m</code> {ui('поможет выбрать архитектуру:')} <code>x86_64</code> — x64, <code>aarch64</code> — ARM64.</p>
            </div>
          </details>
        </div>
      </section>
      <section className="guide-section" id="model" aria-labelledby="model-title">
        <div className="guide-heading">
          <p className="eyebrow">{ui('Шаг 02')}</p>
          <h2 id="model-title">{ui('Подключите свою модель')}</h2>
          <p>{ui('Для первого разговора достаточно одного провайдера и его API-ключа.')}</p>
        </div>
        <div className="guide-panel">
          <ol className="guide-instructions">
            <li>
              <h3>{ui('Откройте «Настройки» → «Модели»')}</h3>
              <p>{ui('Нажмите «Добавить провайдера моделей» и выберите провайдера из каталога. Если он уже есть в списке, откройте «Изменить».')}</p>
            </li>
            <li>
              <h3>{ui('Добавьте API-ключ')}</h3>
              <p>{ui('Возьмите ключ в кабинете своего провайдера, вставьте в поле «API-ключ» и нажмите «Применить».')}</p>
            </li>
            <li>
              <h3>{ui('Убедитесь, что ключ сохранён')}</h3>
              <p>{ui('У провайдера появится отметка «API-ключ настроен». Работу модели проверим первым сообщением.')}</p>
            </li>
          </ol>
          <p className="guide-note">{ui('Доступ к моделям и стоимость запросов определяет ваш провайдер. Если подключаете аккаунт через плагин, вход выполняется в карточке этого плагина.')}</p>
        </div>
      </section>
      <section className="guide-section" id="first-chat" aria-labelledby="chat-title">
        <div className="guide-heading">
          <p className="eyebrow">{ui('Шаг 03')}</p>
          <h2 id="chat-title">{ui('Получите первый ответ')}</h2>
          <p>{ui('Начните с небольшой задачи. Для этого примера не нужен доступ к браузеру или приложениям.')}</p>
        </div>
        <div className="guide-panel">
          <ol className="guide-instructions">
            <li>
              <h3>{ui('Создайте чат')}</h3>
              <p>{ui('Нажмите «Новая сессия» в левой панели. Внизу поля сообщения выберите подключённую модель.')}</p>
            </li>
            <li>
              <h3>{ui('Опишите задачу')}</h3>
              <p>{ui('Попробуйте пример с главной страницы. В нём уже есть весь нужный контекст:')}</p>
              <blockquote className="guide-prompt">{ui('Составь план командной встречи на 30 минут. Нужно согласовать дату запуска, распределить оставшиеся задачи и выбрать, кто проверяет результат. Выдели решения, которые нужно принять.')}</blockquote>
            </li>
            <li>
              <h3>{ui('Продолжите разговор')}</h3>
              <p>{ui('Отправьте сообщение кнопкой со стрелкой. Получив ответ, уточните задачу — например, попросите уложить встречу в 20 минут.')}</p>
            </li>
          </ol>
        </div>
      </section>
      <section className="guide-next" aria-labelledby="next-title">
        <div>
          <p className="eyebrow">{ui('Когда освоитесь')}</p>
          <h2 id="next-title">{ui('Подключите свои инструменты')}</h2>
          <p>{ui('Плагины добавляют работу с сайтами и приложениями. Доступ выбираете вы.')}</p>
        </div>
        <div className="guide-next-links">
          <a className="text-link" href={localizedPath('browser-control', locale)}>{ui('Подключить Chrome')} <span aria-hidden="true">→</span></a>
          <a className="text-link" href={localizedPath('computer-use', locale)}>{ui('Подключить приложения')} <span aria-hidden="true">→</span></a>
        </div>
      </section>
      <section className="guide-trouble" aria-labelledby="trouble-title">
        <h2 id="trouble-title">{ui('Если ответ не приходит')}</h2>
        <p>{ui('Проверьте выбранную модель, API-ключ и доступный баланс в кабинете провайдера. Если Ocean показывает ошибку,')} <a href="https://t.me/oceanchatsupportbot">{ui('напишите в поддержку')}</a> {ui('и приложите её текст без ключей и паролей.')}</p>
      </section>
    </PageShell>
  );
}
