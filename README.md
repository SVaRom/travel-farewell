# Invitación de despedida ✈️ Julio, Diana, Liam y Luca

## Antes de publicar
1. **Datos del evento:** edita `EVENTO` en `config.js` (fecha, hora, lugar, link de Maps, destino, WhatsApp).
2. **Canción:** pon el MP3 en `assets/cancion.mp3`. Empieza a sonar cuando abren el sobre. Si no hay archivo, el botón de música no aparece.
3. **Flechas:** abre `index.html?editar`, haz clic en la cara de cada niño y copia las coordenadas que salen en `config.js` (`x`, `y` = la cara; `lx`, `ly` = la etiqueta).

## Verla en tu compu
```bash
python3 -m http.server 8765
```
Luego abre http://localhost:8765

## Publicar en GitHub Pages (gratis)
1. Crea un repo público en GitHub, por ejemplo `despedida`.
2. Sube estos archivos:
   ```bash
   git init && git add . && git commit -m "Invitación" && git branch -M main
   git remote add origin https://github.com/TU_USUARIO/despedida.git
   git push -u origin main
   ```
3. En el repo, ve a **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** y guarda.
4. En 1-2 minutos queda en `https://TU_USUARIO.github.io/despedida/`.
