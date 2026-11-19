import type { Metadata } from 'next';
import '../styles/downloads.css';
import snapshot from '../../public/downloads/releases.json';
import { DownloadCards } from '../components/download-cards.tsx';
import { PageShell } from '../components/page-shell.tsx';
import { parseSnapshot } from '../content/downloads.ts';
import { localizedPath, type Locale } from '../i18n/locales.ts';
import { messages } from '../i18n/messages.ts';
import { pageMetadata } from '../i18n/metadata.ts';

/**
 * `/downloads/` — platform builds, their checked snapshot and the install FAQ.
 *
 * The card list comes from `public/downloads/releases.json`, validated by `parseSnapshot` at build time: a snapshot
 * with an untrusted URL or a duplicate target fails the build instead of publishing a wrong installer link. The same
 * file is what the browser re-reads when the GitHub API is unreachable.
 */

const snapshotData = parseSnapshot(snapshot);

export function downloadsMetadata(locale: Locale): Metadata {
  const ui = messages(locale);
  return pageMetadata({
    page: 'downloads',
    locale,
    title: ui('Скачать Ocean — macOS, Windows и Linux'),
    description: ui('Скачайте Ocean для своего компьютера. Актуальные загрузки для macOS, Windows и Linux, выбор архитектуры и помощь с установкой.'),
  });
}

export function DownloadsPage({ locale }: { locale: Locale }) {
  const ui = messages(locale);
  return (
    <PageShell locale={locale} ui={ui} page="downloads" current="downloads" className="download-main wrap">
      <div className="download-heading">
        <p className="eyebrow">{ui('Начало погружения')}</p>
        <h1>{ui('Ocean для вашего компьютера')}</h1>
        <p className="lead">{ui('Выберите систему и скачайте приложение.')}</p>
      </div>
      <DownloadCards
        locale={locale}
        initial={snapshotData.downloads}
        checkedAt={snapshotData.checkedAt}
        labels={{
          download: ui('Скачать'),
          notes: ui('Что нового'),
          allReleases: ui('Все релизы'),
          unavailable: ui('Пока нет загрузки'),
          retry: ui('Попробовать снова'),
          checking: ui('Проверяем…'),
          updated: ui('Загрузки обновлены с GitHub.'),
          empty: ui('Загрузки появятся здесь после публикации.'),
          stale: ui('Не удалось обновить список. Показаны загрузки, проверенные {date}.'),
          checked: ui('Загрузки проверены {date}.'),
          aria: ui('Скачать Ocean для {platform}, {arch}'),
          megabyte: ui('МБ'),
          grid: ui('Загрузки по платформам'),
          allOnGithub: ui('Все загрузки на GitHub'),
        }}
      />
      <section className="download-help" aria-labelledby="help-title">
        <div>
          <p className="eyebrow">{ui('Перед первым запуском')}</p>
          <h2 id="help-title">{ui('Пара простых шагов')}</h2>
          <p>{ui('Установите приложение, подключите модель и начните разговор.')}</p>
          <a className="text-link" href={`${localizedPath('start', locale)}#install`}>{ui('Инструкция первого запуска')} <span aria-hidden="true">→</span></a>
        </div>
        <div className="download-faq">
          <details>
            <summary>{ui('Какую архитектуру выбрать?')}</summary>
            <p>{ui('На Mac откройте меню Apple → «Об этом Mac»: чип Apple M означает Apple silicon, процессор Intel — Intel. На Windows архитектура указана в «Параметры → Система → О системе». На Linux команда')} <code>uname -m</code> {ui('покажет')} <code>x86_64</code> {ui('для x64 или')} <code>aarch64</code> {ui('для ARM64.')}</p>
          </details>
          <details>
            <summary>{ui('Как установить Ocean?')}</summary>
            <p>{ui('На macOS откройте DMG или распакуйте ZIP и перенесите приложение в «Программы». На Windows запустите скачанный установщик. На Linux распакуйте TAR.GZ, откройте полученную папку в терминале и выполните')} <code>./ocean</code>{ui('. Если скачан AppImage, разрешите запуск файла в его свойствах.')} <a href={`${localizedPath('start', locale)}#install`}>{ui('Подробнее об установке')}</a>.</p>
          </details>
          <details>
            <summary>{ui('Что нужно после установки?')}</summary>
            <p>{ui('Откройте «Настройки → Модели» и нажмите «Добавить провайдера моделей». Укажите данные подключения и нажмите «Применить». Затем создайте новую сессию и выберите модель.')} <a href={`${localizedPath('start', locale)}#model`}>{ui('Настройка и первая задача')}</a>.</p>
          </details>
        </div>
      </section>
      <p className="download-support">{ui('Не получается установить?')} <a href="https://t.me/oceanchatsupportbot">{ui('Напишите нам')}</a>.</p>
    </PageShell>
  );
}
