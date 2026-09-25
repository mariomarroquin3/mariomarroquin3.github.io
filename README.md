# Mario Marroquín — sitio personal

Sitio estático bilingüe (HTML + CSS + JavaScript) para GitHub Pages. Las páginas se generan con un script de Python sin dependencias.

```
index.html          entrada: elige es/ o en/ según el navegador (generado por build.py)
es/index.html       sitio en español (generado)
en/index.html       sitio en inglés (generado)
src/template.html   estructura de la página, con marcadores {{clave}}
src/es.txt          textos en español
src/en.txt          textos en inglés (lo que falte se hereda de common.txt o del español)
src/common.txt      traducciones de textos repetidos
build.py            genera las tres páginas a partir de src/ (solo biblioteca estándar)
css/styles.css      estilos
js/main.js          animaciones (Lorenz, parallax, reveal, visualizaciones, lightbox)
assets/             certificados (PDF y miniaturas), CV e imagen para redes
```

## Editar el contenido

1. Cambiar el texto en `src/es.txt` y `src/en.txt` (bajo su clave `### sección.NNN`). Para cambios de estructura, editar `src/template.html`.
2. Regenerar y probar:

   ```bash
   python build.py
   python -m http.server 8000
   ```

   y abrir <http://localhost:8000> (o `/es/`, `/en/`). `build.py` avisa si una traducción rompe las etiquetas HTML o si quedó un texto sin traducir.
3. Publicar con `git add -A`, `git commit` y `git push`.

**No editar a mano** `index.html`, `es/index.html` ni `en/index.html`: se sobrescriben al generar.

## Publicar

1. En <https://github.com/new> crear un repositorio **público** llamado exactamente `mariomarroquin3.github.io`, sin README ni .gitignore.
2. Desde esta carpeta:

   ```bash
   git remote add origin https://github.com/mariomarroquin3/mariomarroquin3.github.io.git
   git push -u origin main
   ```

3. En *Settings → Pages* elegir *Deploy from a branch → main / (root)*. El sitio queda en <https://mariomarroquin3.github.io> en uno o dos minutos.

Las fórmulas usan KaTeX desde el CDN de jsDelivr y las tipografías vienen de Google Fonts; sin conexión la página sigue funcionando con texto de respaldo.

## Agregar un certificado

1. Copiar el PDF a `assets/certs/` y generar su miniatura `.webp` en `assets/certs/thumbs/`.
2. Duplicar una tarjeta `.cert` en la sección `#certificados` de `index.html` y ajustar `data-cat`, `data-pdf`, `data-img` y `data-title`.
