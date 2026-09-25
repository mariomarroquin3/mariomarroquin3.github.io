# Mario Marroquín — sitio personal

Sitio estático (HTML + CSS + JavaScript, sin build ni dependencias) para GitHub Pages.

```
index.html          contenido
css/styles.css      estilos
js/main.js          animaciones (Lorenz, parallax, reveal, visualizaciones, lightbox)
assets/certs/       PDFs de los certificados y sus miniaturas (thumbs/)
```

## Probar en local

```bash
python -m http.server 8000
```

y abrir <http://localhost:8000>.

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
