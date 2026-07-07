# What I'm Doing 📝

Una web estática minimalista y elegante para documentar tu progreso diario. El diseño está inspirado en [jaimegh.com](file:///home/jaime/Documentos/jaimegh.com), implementando un tema oscuro con malla cuadriculada, efecto de cursor interactivo y tarjetas con efecto de cristal (glassmorphism) y brillos.

## 🚀 Cómo empezar

### 1. Escribir tu progreso diario
Puedes redactar lo que vas haciendo en archivos Markdown (`.md`) dentro de la carpeta `entries/`. Tienes dos formas muy cómodas de organizar tu bitácora:

* **Opción A (Un único archivo):** Puedes tener un único archivo (ej. `entries/diario.md`) e ir agregando entradas indicando la fecha con una cabecera de segundo nivel:
  ```markdown
  ## 2026-07-07
  Hoy he aprendido a usar la API de Google Fonts.
  
  ## 2026-07-06
  Ayer terminé el diseño del header.
  ```

* **Opción B (Múltiples archivos):** Puedes crear un archivo nuevo para cada día (ej. `entries/2026-07-07.md`). El compilador detectará la fecha por el nombre del archivo o mediante las cabeceras internas.

### 🌐 Bitácora Bilingüe (Español / Inglés)
El generador soporta una bitácora bilingüe. Para separar la versión en castellano de la versión en inglés en un día específico, utiliza el separador `---en---` (o `<!-- en -->`):

```markdown
## 2026-07-07
Hoy he estado optimizando los iconos SVG.
* Menos dependencias externas.
* Mayor rendimiento local.

---en---

Today I've been optimizing the SVG icons.
* Less external dependencies.
* Better local performance.
```

Si un día no añades el separador `---en---`, el generador usará la versión en castellano por defecto para ambos idiomas (evitando que queden tarjetas vacías). En la parte superior de la página, un elegante botón con un icono del globo terráqueo te permitirá alternar entre los dos idiomas al instante (guardando tu preferencia en el navegador).

### 2. Personalizar la información
Edita el archivo [`config.json`](file:///home/jaime/Documentos/whatimdoing/config.json) para cambiar el título, subtítulo, autor, descripción y tus enlaces de redes sociales (GitHub, LinkedIn, Email).

### 3. Generar la web
Cada vez que actualices o crees un Markdown, ejecuta el comando de construcción:

```bash
npm run build
```

Esto procesará todas tus entradas, las ordenará cronológicamente (mostrando los días más recientes arriba) y generará un único archivo estático autocontenido:
👉 [`dist/index.html`](file:///home/jaime/Documentos/whatimdoing/dist/index.html).

¡Puedes abrir este `index.html` directamente desde la carpeta `dist/` en tu navegador o desplegar el contenido de esa carpeta en cualquier servidor estático (como Cloudflare Pages)!
