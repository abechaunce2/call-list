#!/usr/bin/env python3
"""Woodbridge Metro Chamber (GrowthZone) member-directory parser.
Input: FindStartsWith letter pages saved as HTML (server-rendered).
Output: TSV name|phone_digits|town|zip|desc|website|details_url per card, deduped by phone/name.
Pattern sibling: Grand Blanc sitemap sweep (2026-08-11) + NEK Wix sweep (2026-08-24)."""
import re, sys, html as H, glob

CARD = re.compile(r'<div class="card gz-directory-card[^>]*>(.*?)(?=<div class="card gz-directory-card|</footer|$)', re.S)
TITLE = re.compile(r'class="card-title gz-card-title"[^>]*>\s*<a\s+href="([^"]*)"[^>]*>([^<]+)</a>', re.S)
TEL = re.compile(r'href="tel:\+?1?(\d{10})"')
TOWN = re.compile(r'itemprop="addressLocality">([^<]+)<')
ZIP = re.compile(r'itemprop="postalCode">([^<]+)<')
STREET = re.compile(r'itemprop="streetAddress">([^<]+)<')
DESC = re.compile(r'gz-card-description">\s*<div class="mn-text">(.*?)</div>', re.S)
WEB = re.compile(r'gz-card-website">\s*<a href="([^"]+)"')

def parse_file(path):
    h = open(path, encoding='utf-8', errors='replace').read()
    out = []
    for m in CARD.finditer(h):
        c = m.group(0)
        t = TITLE.search(c)
        if not t:
            continue
        url = t.group(1)
        name = H.unescape(t.group(2)).strip()
        p = TEL.search(c)
        dig = p.group(1) if p else ''
        tw = TOWN.search(c)
        town = H.unescape(tw.group(1)).strip().rstrip(',') if tw else ''
        z = ZIP.search(c)
        zc = z.group(1).strip() if z else ''
        st = STREET.search(c)
        street = H.unescape(st.group(1)).strip() if st else ''
        d = DESC.search(c)
        desc = re.sub(r'<[^>]+>', ' ', d.group(1)) if d else ''
        desc = H.unescape(re.sub(r'\s+', ' ', desc)).strip()[:90]
        w = WEB.search(c)
        web = w.group(1).strip() if w else ''
        out.append((name, dig, town, zc, street, desc, web, url))
    return out

if __name__ == '__main__':
    seen = set()
    rows = []
    for f in sorted(glob.glob(sys.argv[1])):
        for r in parse_file(f):
            key = r[1] or r[0].lower()
            if key in seen:
                continue
            seen.add(key)
            rows.append('\t'.join(r))
    print(f"# {len(rows)} unique members", file=sys.stderr)
    print('\n'.join(rows))
