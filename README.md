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

1. Crear en GitHub un repositorio llamado `mariomarroquin3.github.io` (sitio de usuario) y subir esta carpeta a `main`.
2. En *Settings → Pages* elegir *Deploy from a branch → main / (root)*.

## Agregar un certificado

1. Copiar el PDF a `assets/certs/` y generar su miniatura `.webp` en `assets/certs/thumbs/`.
2. Duplicar una tarjeta `.cert` en la sección `#certificados` de `index.html` y ajustar `data-cat`, `data-pdf`, `data-img` y `data-title`.
