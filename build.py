#!/usr/bin/env python3
"""Genera el sitio bilingüe a partir de una sola plantilla.

    src/template.html   estructura de la página, con marcadores {{clave}}
    src/es.txt          textos en español  (formato: '### clave' y el texto debajo)
    src/en.txt          textos en inglés   (lo que falte se toma de common.txt o del español)
    src/common.txt      traducciones de textos repetidos (clave = texto en español)
    src/root.html       página de entrada (elige es/ o en/ según el navegador)

Salida: es/index.html, en/index.html e index.html.  Uso:  python build.py
Solo usa la biblioteca estándar.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE = "https://mariomarroquin3.github.io"
LANGS = {"es": "es_SV", "en": "en_US"}


def parse(path):
    text = path.read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"^### ([^\n]+)\n(.*?)(?=\n### |\Z)", text, flags=re.S | re.M):
        out[m.group(1).strip()] = m.group(2).strip("\n")
    return out


def tag_signature(s):
    """Etiquetas y atributos de un fragmento, sin el texto: sirve para detectar traducciones que rompen el HTML."""
    return re.findall(r"<[^>]+>", s)


es, en, common = parse(SRC / "es.txt"), parse(SRC / "en.txt"), parse(SRC / "common.txt")
template = (SRC / "template.html").read_text(encoding="utf-8")
errors = []


def texts(lang):
    if lang == "es":
        return dict(es)
    out = {}
    for k, v in es.items():
        if k in en:
            out[k] = en[k]
        elif v in common:
            out[k] = common[v]
        else:
            out[k] = v
        if tag_signature(out[k]) != tag_signature(v) and not k.startswith(("js.", "head.")):
            errors.append(f"[{lang}] {k}: las etiquetas HTML no coinciden con el español")
    for k in en:
        if k not in es:
            errors.append(f"[en] clave inexistente en es.txt: {k}")
    return out


def seo(lang):
    other = "en" if lang == "es" else "es"
    return (
        f'<link href="{SITE}/{lang}/" rel="canonical"/>\n'
        f'<link href="{SITE}/es/" hreflang="es" rel="alternate"/>\n'
        f'<link href="{SITE}/en/" hreflang="en" rel="alternate"/>\n'
        f'<link href="{SITE}/" hreflang="x-default" rel="alternate"/>\n'
        f'<meta content="{SITE}/{lang}/" property="og:url"/>\n'
        f'<meta content="{LANGS[lang]}" property="og:locale"/>\n'
        f'<meta content="{LANGS[other]}" property="og:locale:alternate"/>'
    )


def langswitch(lang, label):
    def a(code):
        cur = ' aria-current="true"' if code == lang else ""
        return f'<a data-lang="{code}" href="../{code}/" hreflang="{code}" lang="{code}"{cur}>{code.upper()}</a>'
    return f'<div aria-label="{label}" class="langswitch" role="group">{a("es")}{a("en")}</div>'


def i18n_script(t):
    roles = [r.strip() for r in t["js.roles"].split("\n") if r.strip()]
    js_roles = "[" + ",".join('"' + r.replace('"', '\\"') + '"' for r in roles) + "]"
    alt = t["js.certalt"].replace('"', '\\"')
    return f'<script>window.I18N={{roles:{js_roles},certAlt:"{alt}"}};</script>'


def build(lang):
    t = texts(lang)
    other = "en" if lang == "es" else "es"
    html = template
    special = {
        "lang": lang,
        "root": "../",
        "seo": seo(lang),
        "langswitch": langswitch(lang, t["lang.label"]),
        "i18n_script": i18n_script(t),
        "other_lang": other,
        "other_href": f"../{other}/",
    }
    def sub(m):
        k = m.group(1)
        if k in special:
            return special[k]
        if k in t:
            return t[k]
        errors.append(f"[{lang}] marcador sin texto: {k}")
        return m.group(0)
    html = re.sub(r"\{\{([^}]+)\}\}", sub, html)
    out = ROOT / lang
    out.mkdir(exist_ok=True)
    (out / "index.html").write_text(html, encoding="utf-8")
    return t


built = {lang: build(lang) for lang in LANGS}
shutil.copyfile(SRC / "root.html", ROOT / "index.html")

# Avisos: textos que siguen idénticos al español y parecen español (posible traducción olvidada)
spanish_hint = re.compile(r"\b(de|la|el|los|las|con|para|que|una|un|y|en|del|por|sin|más|se)\b", re.I)
pending = [
    k for k, v in built["en"].items()
    if v == es[k] and spanish_hint.search(re.sub(r"<[^>]+>", "", v)) and not k.startswith(("head.", "js.")) and len(v) > 25
]
if pending:
    print("Posibles textos sin traducir al inglés:", *pending, sep="\n  ")
if errors:
    print("ERRORES:", *errors, sep="\n  ")
    sys.exit(1)
print(f"OK: es/index.html, en/index.html e index.html generados ({len(es)} textos).")
