# Travel Farewell ✈️ Julio, Diana & the Twins

Invitación de despedida: https://svarom.github.io/travel-farewell/

## Editar
- **Evento:** `EVENT` en `config.js` (`date`, `dateText`, `time`, `place`, `mapUrl`, `destination`).
  Si cambian la fecha u hora, actualiza también `farewell.ics` (`DTSTART` / `DTEND`).
- **Canción:** `assets/song.mp3`.
- **Fotos y flechas:** `FAMILY_PHOTO`, `TWINS_PHOTOS` y `MEMORY_PHOTOS` en `config.js`.
  Cada flecha: `x`, `y` = la cara (% de la foto); `lx`, `ly` = la etiqueta; `r` = radio de la cara.
  Abre la página con `?edit` y haz clic en una foto para obtener coordenadas.
- Tras cambiar `styles.css`, `config.js` o `script.js`, sube el `?v=` en `index.html` para que los celulares no usen la versión en caché.

## Verla local
```bash
python3 -m http.server 8765
```

## Deploy
GitHub Pages publica la rama `main` automáticamente: haz commit y push, y en ~1 minuto se actualiza.
