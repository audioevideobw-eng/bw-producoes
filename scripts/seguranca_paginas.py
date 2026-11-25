#!/usr/bin/env python3
"""Proteções que valem em TODA página do site da BW Produções (25/11/2026 — guia "100 pontos de segurança").

1. REFERRER: link para fora leva só o endereço do site, nunca o caminho completo.
2. ANTI-MOLDURA (clickjacking): no GitHub Pages não existe cabeçalho X-Frame-Options e o frame-ancestors no <meta> é
   ignorado pelo navegador. A página nasce escondida e só aparece sozinha na aba ou dentro de um quadro do mesmo endereço
   (audioevideobw-eng.github.io). Dentro de um site de fora fica em branco e tenta abrir a aba inteira no endereço certo.
É o MESMO bloco da plataforma Brightway (docs/automacoes/seguranca-paginas.py no repositório dela).
Uso (na raiz): python3 scripts/seguranca_paginas.py  — página nova: rode de novo. Precisa da CSP já na página.
"""
import os, re, sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REF = '<meta name="referrer" content="strict-origin-when-cross-origin">'
ANTI = ('<style id="bwAntiMoldura">html{display:none!important}</style>'
        '<script>(function(){var ok=self===top;if(!ok){try{ok=top.location.origin===location.origin}catch(e){ok=false}}'
        'if(ok){var s=document.getElementById("bwAntiMoldura");if(s)s.parentNode.removeChild(s)}'
        'else{try{top.location.href=location.href}catch(e){}}})();</script>')
RE_REF = re.compile(r'<meta name="referrer"[^>]*>\n?')
RE_ANTI = re.compile(r'<style id="bwAntiMoldura">.*?</script>\n?', re.S)
RE_CSP = re.compile(r'(<meta http-equiv="Content-Security-Policy"[^>]*>\n?)')


def main():
    mudou, falta = 0, []
    for nome in sorted(os.listdir(RAIZ)):
        if not nome.endswith(".html"):
            continue
        p = os.path.join(RAIZ, nome)
        t = open(p, encoding="utf8").read()
        n = RE_ANTI.sub("", RE_REF.sub("", t))
        if not RE_CSP.search(n):
            falta.append(nome); continue
        n = RE_CSP.sub(lambda m: m.group(1).rstrip("\n") + "\n" + REF + "\n" + ANTI + "\n", n, count=1)
        if n != t:
            open(p, "w", encoding="utf8").write(n); mudou += 1
    for f in falta:
        print("⚠ página sem CSP (pôr a CSP antes):", f)
    print(f"referrer e anti-moldura aplicados em {mudou} página(s).")
    return 1 if falta else 0


if __name__ == "__main__":
    sys.exit(main())
