"""Build static locale routes from the Russian pages and reviewed message catalogs."""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import hashlib
import html
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
LANGUAGES = {'ru': 'Русский', 'en': 'English', 'zh': '中文', 'ja': '日本語', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch', 'pt': 'Português', 'ko': '한국어'}
HTML_LANG = {'zh': 'zh-CN', 'pt': 'pt-BR'}
PAGES = ['index.html', 'downloads/index.html', 'plugins/index.html', 'plugins/browser-control/index.html', 'plugins/computer-use/index.html', 'start/index.html', 'privacy/index.html', 'plugins/browser-control/privacy/ru/index.html']
DYNAMIC = ['Для вашего Mac', 'Для вашего дистрибутива', 'Для вашего ПК', 'Пока нет загрузки', 'Все релизы', 'Что нового', 'Скачать', 'МБ', 'Скачать Ocean для {platform}, {arch}', 'Проверяем…', 'Загрузки обновлены с GitHub.', 'Загрузки появятся здесь после публикации.', 'Не удалось обновить список. Показаны загрузки, проверенные {date}.', 'Попробовать снова', 'Загрузки проверены {date}.']

def normalized(text):
    return re.sub(r'\s+', ' ', text).strip()

def message_id(text):
    return hashlib.sha256(normalized(text).encode()).hexdigest()[:12]

def route(path):
    return '/' if path == 'index.html' else '/' + path.removesuffix('index.html')

def localized_route(path, locale):
    if locale == 'ru':
        return path
    if path == '/plugins/browser-control/privacy/ru/':
        path = '/plugins/browser-control/privacy/'
    return '/' + locale + path

class Localizer(HTMLParser):
    def __init__(self, locale, catalog, page):
        super().__init__(convert_charrefs=True)
        self.locale, self.catalog, self.page = locale, catalog, page
        self.output = []
        self.raw = 0
        self.release_date = None
        self.download_status = False

    def translated(self, text):
        plain = text
        key = message_id(plain)
        if key not in self.catalog:
            if re.search('[А-Яа-яЁё]', plain):
                raise ValueError(f'Missing {self.locale} translation {key}: {plain}')
            return plain
        leading = re.match(r'^\s*', plain).group()
        trailing = re.search(r'\s*$', plain).group()
        return leading + self.catalog[key] + trailing

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if self.page == 'downloads/index.html':
            if tag == 'time':
                self.release_date = d.get('datetime')
            if 'data-download-status' in d:
                self.download_status = True
        if tag in ['script', 'style']:
            self.raw += 1
        result = []
        for key, value in attrs:
            if value is None:
                result.append(key)
                continue
            if key == 'lang' and value == 'ru':
                value = HTML_LANG.get(self.locale, self.locale)
            elif key in ['aria-label', 'alt', 'title'] or (tag == 'meta' and key == 'content' and d.get('name', d.get('property')) in ['description', 'og:title', 'og:description']):
                if key == 'aria-label' and value.startswith('Скачать Ocean для '):
                    platform, arch = value.removeprefix('Скачать Ocean для ').split(', ', 1)
                    value = self.catalog[message_id(DYNAMIC[8])].format(platform=platform, arch=arch)
                else:
                    value = self.translated(value)
            elif key == 'href' and value.startswith('/') and (value.endswith('/') or '/#' in value):
                path, sep, fragment = value.partition('#')
                if path in [route(p) for p in PAGES] or path == '/plugins/browser-control/privacy/':
                    value = localized_route(path, self.locale) + sep + fragment
            elif (tag == 'link' and d.get('rel') == 'canonical') or (tag == 'meta' and d.get('property') == 'og:url'):
                if key in ['href', 'content']:
                    value = 'https://oceanharness.com' + localized_route(route(self.page), self.locale)
            result.append(f'{key}="{html.escape(value, quote=True)}"')
        self.output.append('<' + tag + (' ' + ' '.join(result) if result else '') + '>')

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.output[-1] = self.output[-1][:-1] + '/>'

    def handle_endtag(self, tag):
        self.output.append(f'</{tag}>')
        if tag == 'time':
            self.release_date = None
        if tag == 'p':
            self.download_status = False
        if tag in ['script', 'style']:
            self.raw -= 1

    def handle_data(self, data):
        if self.raw:
            self.output.append(data)
            return
        if self.release_date:
            value = self.date(self.release_date)
        elif self.download_status:
            checked_at = json.loads((ROOT/'downloads/releases.json').read_text())['checkedAt']
            value = self.catalog[message_id(DYNAMIC[-1])].format(date=self.date(checked_at))
        elif self.page == 'downloads/index.html' and re.fullmatch(r'\s*\d+ МБ', data):
            value = data.replace('МБ', self.catalog[message_id('МБ')])
        else:
            value = self.translated(data)
        self.output.append(html.escape(value, quote=False))

    def date(self, value):
        return subprocess.check_output([
            'node', '-e',
            'console.log(new Intl.DateTimeFormat(process.argv[1], {dateStyle: "long", timeZone: "UTC"}).format(new Date(process.argv[2])))',
            HTML_LANG.get(self.locale, self.locale), value,
        ], text=True).strip()

    def handle_entityref(self, name): self.output.append('&' + name + ';')
    def handle_charref(self, name): self.output.append('&#' + name + ';')
    def handle_decl(self, decl): self.output.append('<!' + decl + '>')
    def handle_comment(self, data): self.output.append('<!--' + data + '-->')


def strip_generated(source):
    source = re.sub(r'<!-- LOCALES_START -->.*?<!-- LOCALES_END -->\n?', '', source, flags=re.S)
    source = re.sub(r'<!-- LANGUAGE_MENU_START -->.*?<!-- LANGUAGE_MENU_END -->', '', source, flags=re.S)
    source = re.sub(r'<!-- LOCALIZED_MESSAGES_START -->.*?<!-- LOCALIZED_MESSAGES_END -->\n?', '', source, flags=re.S)
    source = re.sub(r' data-demo-label="[^"]*"', '', source)
    return source


def enhance(source, locale, catalog, path):
    current = route(path)
    alternates = '\n'.join(f'  <link rel="alternate" hreflang="{HTML_LANG.get(code, code)}" href="https://oceanharness.com{localized_route(current, code)}">' for code in LANGUAGES)
    alternates += f'\n  <link rel="alternate" hreflang="x-default" href="https://oceanharness.com{current}">'
    source = re.sub(r'\s*<link rel="alternate"[^>]*>', '', source)
    source = source.replace('</head>', '<!-- LOCALES_START -->\n' + alternates + '\n<!-- LOCALES_END -->\n</head>')
    label = catalog.get(message_id('Язык сайта'), 'Язык сайта')
    links = ''.join(f'<a href="{localized_route(current, code)}" lang="{HTML_LANG.get(code, code)}" hreflang="{HTML_LANG.get(code, code)}"' + (' aria-current="page"' if code == locale else '') + f'>{name}</a>' for code, name in LANGUAGES.items())
    menu = f'<!-- LANGUAGE_MENU_START --><details class="language-picker" data-language-picker><summary aria-label="{label}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/></svg><span>{locale.upper()}</span></summary><nav aria-label="{label}">{links}</nav></details><!-- LANGUAGE_MENU_END -->'
    source = source.replace('<button class="menu-toggle"', menu + '<button class="menu-toggle"', 1)
    messages = {text: catalog.get(message_id(text), text) for text in DYNAMIC + ['Открыть меню', 'Закрыть меню', 'Ocean / Пример сценария']}
    data = json.dumps({'locale': HTML_LANG.get(locale, locale), 'messages': messages}, ensure_ascii=False).replace('<', '\\u003c')
    source = source.replace('<script src="/site.js"', '<!-- LOCALIZED_MESSAGES_START --><script type="application/json" id="site-messages">' + data + '</script><!-- LOCALIZED_MESSAGES_END -->\n<script src="/site.js"', 1)
    source = source.replace('class="app-chat"', 'class="app-chat" data-demo-label="' + html.escape(messages['Ocean / Пример сценария'], quote=True) + '"')
    return source


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    source_catalog = json.loads((ROOT/'i18n/source.json').read_text())
    catalogs = {'ru': source_catalog}
    for code in LANGUAGES:
        if code == 'ru': continue
        catalog = json.loads((ROOT/f'i18n/{code}.json').read_text())
        if catalog.keys() != source_catalog.keys():
            raise ValueError(f'{code}: message keys differ from source')
        for key, value in catalog.items():
            if not isinstance(value, str) or not value.strip(): raise ValueError(f'{code}: empty {key}')
            if sorted(re.findall(r'\{\w+\}', value)) != sorted(re.findall(r'\{\w+\}', source_catalog[key])): raise ValueError(f'{code}: placeholders {key}')
        catalogs[code] = catalog
    outputs = {}
    for path in PAGES:
        original = strip_generated((ROOT/path).read_text())
        # The localized policy uses the same complete Russian source. Its language links are provided by the global menu.
        original = re.sub(r'\s*<nav class="policy-languages".*?</nav>', '', original, flags=re.S)
        for code, catalog in catalogs.items():
            if code == 'ru':
                content = original
            else:
                p = Localizer(code, catalog, path)
                p.feed(original)
                content = ''.join(p.output)
            content = enhance(content, code, catalog, path)
            output = localized_route(route(path), code).lstrip('/') + 'index.html'
            outputs[output] = content.rstrip()+'\n'
    # Keep the already published English policy URL and its legal text; point language navigation to its localized siblings.
    old_path = 'plugins/browser-control/privacy/index.html'
    old = strip_generated((ROOT/old_path).read_text())
    old = re.sub(r'\s*<nav class="policy-languages".*?</nav>', '', old, flags=re.S)
    p = Localizer('en', catalogs['en'], PAGES[-1])
    p.feed(old)
    policy = enhance(''.join(p.output), 'en', catalogs['en'], PAGES[-1]).rstrip()+'\n'
    outputs[old_path] = policy
    outputs['en/plugins/browser-control/privacy/index.html'] = policy
    urls = ['https://oceanharness.com' + route(path) for path in outputs]
    outputs['sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{url}</loc></url>\n' for url in urls) + '</urlset>\n'
    for path, content in outputs.items():
        target = ROOT/path
        if args.check:
            if not target.exists() or target.read_text() != content: raise ValueError(f'{path}: localized output is stale')
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
    print(f'{"Checked" if args.check else "Built"} {len(outputs)-1} pages in {len(LANGUAGES)} languages')

if __name__ == '__main__': main()
