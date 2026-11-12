#!/usr/bin/env python3
"""Lê o feed público do canal do YouTube e grava data/youtube.json.
Roda no GitHub Actions (sem chave de API). Uso: python scripts/youtube_feed.py @bwproducoes2626
"""
import json, re, sys, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

HANDLE = (sys.argv[1] if len(sys.argv) > 1 else "@bwproducoes2626").lstrip("@")
OUT = Path(__file__).resolve().parent.parent / "data" / "youtube.json"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept-Language": "pt-BR,pt;q=0.9"}


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def channel_id():
    html = get(f"https://www.youtube.com/@{HANDLE}")
    for pat in (r'"externalId":"(UC[\w-]{22})"', r'"channelId":"(UC[\w-]{22})"', r'channel/(UC[\w-]{22})'):
        m = re.search(pat, html)
        if m:
            return m.group(1)
    raise SystemExit("Não achei o ID do canal")


def main():
    old = {}
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text("utf-8"))
        except Exception:
            old = {}
    cid = old.get("canal_id") or channel_id()
    xml = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}")
    ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
    root = ET.fromstring(xml)
    videos = []
    for e in root.findall("a:entry", ns):
        vid = e.findtext("yt:videoId", default="", namespaces=ns)
        ln = e.find("a:link", ns)
        link = ln.get("href") if ln is not None else ""
        videos.append({
            "id": vid,
            "titulo": e.findtext("a:title", default="", namespaces=ns).strip(),
            "publicado": e.findtext("a:published", default="", namespaces=ns),
            "short": "/shorts/" in link,
            "url": link or f"https://www.youtube.com/watch?v={vid}",
            "capa": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        })
    data = {"canal": "@" + HANDLE, "canal_id": cid, "videos": videos}
    if old.get("videos") == videos and old.get("canal_id") == cid:
        print("Sem novidades no canal.")
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"{len(videos)} vídeos gravados em {OUT}")


if __name__ == "__main__":
    main()
