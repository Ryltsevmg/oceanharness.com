"""Verify locale navigation, assets and metadata in all generated pages."""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('localize', ROOT/'scripts/localize-site.py')
localize = importlib.util.module_from_spec(spec)
spec.loader.exec_module(localize)

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags=[]
        self.ids=set()
        self.feed(source)
    def handle_starttag(self, tag, attributes):
        attrs=dict(attributes)
        self.tags.append((tag, attrs))
        if 'id' in attrs: self.ids.add(attrs['id'])

class LocalizationTests(unittest.TestCase):
    def test_page_routes_metadata_and_local_links(self):
        for source in localize.PAGES:
            for code in localize.LANGUAGES:
                route=localize.localized_route(localize.route(source), code)
                with self.subTest(route=route):
                    path=ROOT/(route.lstrip('/')+'index.html')
                    page=Page(path.read_text())
                    self.assertIn(('html', {'lang':localize.HTML_LANG.get(code, code)}), page.tags)
                    alternates=[a for tag,a in page.tags if tag=='link' and a.get('rel')=='alternate']
                    self.assertEqual(len(alternates), 10)
                    self.assertEqual(sum(a.get('id')=='site-messages' for _,a in page.tags),1)
                    self.assertEqual(sum('data-language-picker' in a for _,a in page.tags),1)
                    for tag,a in page.tags:
                        target=a.get('href' if tag in ('a','link') else 'src','')
                        url=urlsplit(target)
                        if not target or url.scheme or url.netloc: continue
                        if url.path.startswith('/'): linked=ROOT/url.path.lstrip('/')
                        elif url.path: linked=path.parent/url.path
                        else: linked=path
                        if linked.is_dir(): linked/='index.html'
                        self.assertTrue(linked.exists(), target)
                        if url.fragment and linked.suffix=='.html':
                            self.assertIn(unquote(url.fragment), Page(linked.read_text()).ids, target)
                    canonical=[a['href'] for tag,a in page.tags if tag=='link' and a.get('rel')=='canonical']
                    self.assertEqual(canonical,['https://oceanharness.com'+route])

    def test_language_switch_preserves_page(self):
        for source in localize.PAGES:
            for code in localize.LANGUAGES:
                path=ROOT/(localize.localized_route(localize.route(source),code).lstrip('/')+'index.html')
                page=Page(path.read_text())
                choices=[a for tag,a in page.tags if tag=='a' and 'hreflang' in a]
                self.assertEqual(len(choices),9)
                self.assertEqual([a['href'] for a in choices], [localize.localized_route(localize.route(source), locale) for locale in localize.LANGUAGES])

    def test_missing_translation_is_rejected(self):
        parser=localize.Localizer('en', {}, 'index.html')
        with self.assertRaisesRegex(ValueError, 'Missing en translation'):
            parser.feed('<p>Новая надпись</p>')

if __name__=='__main__': unittest.main()
