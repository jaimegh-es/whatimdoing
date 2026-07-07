const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

// 1. Default configuration
let config = {
  title: "What I'm Doing",
  subtitle_es: "Log diario",
  subtitle_en: "Daily log",
  author: "JaimeGH",
  description_es:
    "Hola, soy Jaimegh. En esta pagina puedes ver qué estoy haciendo cada día, relacionado con la informática",
  description_en:
    "Hi, I'm Jaimegh. On this page, you can see what I'm doing each day in the field of computing.",
  links: {
    github: "https://github.com/jaimegh-es",
    linkedin: "https://es.linkedin.com/in/jaimegonzalezherraiz",
    email: "hi@inled.es",
  },
};

// 2. Load configuration if exists
const configPath = path.join(__dirname, "config.json");
if (fs.existsSync(configPath)) {
  try {
    const loadedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config = { ...config, ...loadedConfig };
    config.links = { ...config.links, ...(loadedConfig.links || {}) };
  } catch (err) {
    console.error("Error reading config.json, using defaults:", err);
  }
}

// 3. Setup folders
const entriesDir = path.join(__dirname, "entries");
if (!fs.existsSync(entriesDir)) {
  fs.mkdirSync(entriesDir);
}

// 4. Gather markdown files
const files = fs
  .readdirSync(entriesDir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => path.join(entriesDir, file));

const entriesMap = {};

// 5. Parse files
files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  // fallback date is file's modification date (YYYY-MM-DD)
  const stats = fs.statSync(filePath);
  const mtimeDate = stats.mtime.toISOString().split("T")[0];

  // check if filename itself has a date prefix
  const fileName = path.basename(filePath);
  const fileDateMatch = fileName.match(/^(\d{4}[-/]\d{2}[-/]\d{2})/);

  let currentDate = null;
  if (fileDateMatch) {
    currentDate = fileDateMatch[1].replace(/\//g, "-");
  }

  let currentLines = [];

  lines.forEach((line) => {
    // Matches headers like: ## 2026-07-07 or ### 2026-07-07 or ##2026-07-07
    const dateMatch = line.match(/^#{2,3}\s*(\d{4}[-/]\d{2}[-/]\d{2})\b/);

    if (dateMatch) {
      // Save current accumulated lines for the previous date
      if (currentDate && currentLines.length > 0) {
        if (!entriesMap[currentDate]) entriesMap[currentDate] = [];
        entriesMap[currentDate] = entriesMap[currentDate].concat(currentLines);
      }
      currentDate = dateMatch[1].replace(/\//g, "-");
      currentLines = [];
    } else {
      // If we don't have a date yet and we hit content, fallback to mtime
      if (!currentDate && line.trim() !== "") {
        currentDate = mtimeDate;
      }
      if (currentDate) {
        currentLines.push(line);
      }
    }
  });

  // Save last section
  if (currentDate && currentLines.length > 0) {
    if (!entriesMap[currentDate]) entriesMap[currentDate] = [];
    entriesMap[currentDate] = entriesMap[currentDate].concat(currentLines);
  }
});

// 6. Sort entries and parse Markdown (detecting language dividers)
const sortedDates = Object.keys(entriesMap).sort((a, b) => b.localeCompare(a));

const renderedEntries = sortedDates.map((dateStr) => {
  const lines = entriesMap[dateStr];
  const rawText = lines.join("\n");

  // Split by English version divider
  const langParts = rawText.split(/---en---|--- en ---|<!--\s*en\s*-->/i);
  const esContent = langParts[0] ? langParts[0].trim() : "";
  const enContent = langParts[1] ? langParts[1].trim() : "";

  const htmlES = marked.parse(esContent);
  const htmlEN = enContent ? marked.parse(enContent) : htmlES; // Fallback to Spanish if no English version

  // Format Date to Spanish & English
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day, 12, 0, 0);

  // Spanish date: e.g. "Martes, 7 de julio de 2026"
  const optionsES = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDateES = dateObj.toLocaleDateString("es-ES", optionsES);
  const displayDateES =
    formattedDateES.charAt(0).toUpperCase() + formattedDateES.slice(1);

  // English date: e.g. "Tuesday, July 7, 2026"
  const optionsEN = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDateEN = dateObj.toLocaleDateString("en-US", optionsEN);
  const displayDateEN =
    formattedDateEN.charAt(0).toUpperCase() + formattedDateEN.slice(1);

  return {
    date: dateStr,
    displayDateES: displayDateES,
    displayDateEN: displayDateEN,
    htmlES: htmlES,
    htmlEN: htmlEN,
  };
});

// 7. HTML Template
const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} | ${config.author}</title>
  <meta name="description" content="${config.description_es}">
  <meta name="author" content="${config.author}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${config.title} | ${config.author}">
  <meta property="og:description" content="${config.description_es}">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --bg-black: #000000;
      --text-light: #f5f5f5;
      --text-muted: rgba(255, 255, 255, 0.6);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(255, 255, 255, 0.25);
      --card-bg: rgba(18, 18, 18, 0.4);
    }

    body {
      background-color: var(--bg-black);
      color: var(--text-light);
      font-family: "Newsreader", serif;
      font-weight: 300;
      overflow-x: hidden;
      position: relative;
      min-height: 100vh;
    }

    /* Grid overlay */
    .grid-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.02) 1px,
          transparent 1px
        );
      background-size: 50px 50px;
      pointer-events: none;
      z-index: 1;
    }

    /* Light cursor effect */
    .light-cursor {
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.08) 0%,
        transparent 70%
      );
      pointer-events: none;
      z-index: 2;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      opacity: 0;
    }

    @media (pointer: fine) {
      body:hover .light-cursor {
        opacity: 1;
      }
    }

    /* Floating Header */
    .floating-header {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 550px;
      z-index: 1000;
      padding: 0.6rem 1.5rem;
      background: rgba(10, 10, 10, 0.4);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-radius: 20px;
      border: 1px solid var(--border-color);
      box-shadow:
        0 10px 40px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .floating-header::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 20%;
      width: 60%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      border-radius: 1px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff, #999);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
    }

    nav {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .nav-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    /* Language Button Styles */
    .lang-btn {
      width: auto !important;
      padding: 0 0.7rem;
      gap: 0.3rem;
    }

    .lang-label {
      font-size: 0.85rem;
      font-weight: 600;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }

    /* Hero Section */
    .hero {
      position: relative;
      z-index: 10;
      max-width: 800px;
      margin: 8rem auto 4rem auto;
      text-align: center;
      padding: 0 20px;
    }

    .hero-title {
      font-size: clamp(2.5rem, 6vw, 4.2rem);
      font-weight: 300;
      letter-spacing: -1px;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #ffffff 30%, #888888 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: clamp(1.1rem, 2vw, 1.35rem);
      color: var(--text-muted);
      font-weight: 300;
      line-height: 1.5;
    }

    /* Timeline Container */
    .timeline {
      position: relative;
      max-width: 800px;
      margin: 0 auto 8rem auto;
      padding: 0 20px;
      z-index: 10;
    }

    /* Central vertical timeline line */
    .timeline::before {
      content: '';
      position: absolute;
      top: 35px;
      bottom: 35px;
      left: 40px; /* Match (timeline padding 20px + timeline-marker absolute offset 20px) */
      width: 1px;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%);
    }

    /* Timeline item structure */
    .timeline-item {
      position: relative;
      padding-left: 55px;
      margin-bottom: 4rem;
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    /* Marker */
    .timeline-marker {
      position: absolute;
      left: 20px;
      top: 35px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
      z-index: 3;
      transform: translate(-50%, -50%);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .timeline-item:hover .timeline-marker {
      transform: translate(-50%, -50%) scale(1.4);
      box-shadow: 0 0 15px #ffffff;
    }

    /* Card */
    .timeline-card {
      position: relative;
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2.2rem;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    .timeline-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%);
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .timeline-card:hover::before {
      opacity: 1;
    }

    .timeline-card:hover {
      transform: translateY(-6px);
      border-color: var(--border-hover);
      box-shadow:
        0 15px 40px rgba(0, 0, 0, 0.6),
        0 0 30px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    /* Glow elements */
    .card-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 150%;
      height: 150%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }

    .timeline-card:hover .card-glow {
      opacity: 1;
    }

    .card-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.06) 50%,
        transparent 70%
      );
      transform: translateX(-100%);
      transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }

    .timeline-card:hover .card-shine {
      transform: translateX(100%);
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      color: var(--text-muted);
    }

    .card-date {
      font-size: 1.35rem;
      font-weight: 400;
      color: #ffffff;
      letter-spacing: -0.2px;
      font-family: "Newsreader", serif;
    }

    .calendar-icon {
      width: 16px;
      height: 16px;
      stroke-width: 2px;
      color: var(--text-muted);
      display: inline-block;
      vertical-align: middle;
    }

    /* Card Body Markdown Styling */
    .card-body {
      font-size: 1.15rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.78);
    }

    .card-body p {
      margin-bottom: 1.25rem;
    }

    .card-body p:last-child {
      margin-bottom: 0;
    }

    .card-body h1, .card-body h2, .card-body h3, .card-body h4 {
      color: #ffffff;
      font-weight: 400;
      margin: 1.5rem 0 1rem 0;
      font-family: "Newsreader", serif;
      letter-spacing: -0.2px;
    }

    .card-body h1 { font-size: 1.6rem; }
    .card-body h2 { font-size: 1.45rem; }
    .card-body h3 { font-size: 1.3rem; }
    .card-body h4 { font-size: 1.15rem; }

    .card-body ul, .card-body ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
    }

    .card-body li {
      margin-bottom: 0.5rem;
    }

    .card-body a {
      color: #ffffff;
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-color: rgba(255, 255, 255, 0.3);
      transition: text-decoration-color 0.2s ease;
    }

    .card-body a:hover {
      text-decoration-color: #ffffff;
    }

    .card-body code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85em;
      background: rgba(255, 255, 255, 0.06);
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #eaeaea;
    }

    .card-body pre {
      background: rgba(10, 10, 10, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.25rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }

    .card-body pre code {
      background: transparent;
      padding: 0;
      border: none;
      font-size: 0.9em;
      color: #f5f5f5;
    }

    .card-body blockquote {
      border-left: 3px solid rgba(255, 255, 255, 0.3);
      padding-left: 1.25rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: var(--text-muted);
    }

    .card-body hr {
      border: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 1.5rem 0;
    }

    /* Empty state styling */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--card-bg);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      color: var(--text-muted);
      font-size: 1.2rem;
      line-height: 1.6;
    }

    /* Popup overlay */
    .popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .popup-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .popup-content {
      background: #0a0a0a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 28px;
      padding: 2.5rem 2rem;
      width: 90%;
      max-width: 380px;
      position: relative;
      transform: translateY(30px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      text-align: center;
      box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
      z-index: 2010;
    }

    .popup-overlay.active .popup-content {
      transform: translateY(0);
      opacity: 1;
    }

    .close-btn {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: color 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: white;
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .popup-header h3 {
      font-size: 1.55rem;
      margin-bottom: 0.5rem;
      color: white;
      font-weight: 400;
    }

    .popup-header p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    .email-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
      padding: 0.6rem 1rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 1.5rem;
    }

    #email-address {
      color: rgba(255, 255, 255, 0.85);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.95rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1.5rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      border: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .action-btn.primary {
      background: white;
      color: black;
    }

    .action-btn.primary:hover {
      background: #eeeeee;
      transform: translateY(-2px);
    }

    .action-btn.secondary {
      width: auto;
      background: rgba(255, 255, 255, 0.05);
      color: white;
      padding: 0.5rem;
    }

    .action-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .toast {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: white;
      padding: 0.6rem 1.2rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.85rem;
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
      white-space: nowrap;
    }

    .toast.active {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Footer */
    footer {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 4rem 20px;
      color: var(--text-muted);
      font-size: 0.95rem;
      border-top: 1px solid var(--border-color);
      max-width: 800px;
      margin: 0 auto;
    }

    footer p {
      margin-bottom: 0.5rem;
    }

    footer a {
      color: var(--text-light);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .floating-header {
        top: auto;
        bottom: 20px;
        width: auto;
        min-width: 280px;
        max-width: 90%;
        padding: 0.5rem 1.25rem;
        border-radius: 18px;
      }

      .floating-header::before {
        width: 40%;
        left: 30%;
      }

      .logo {
        display: none;
      }

      .header-content {
        justify-content: center;
      }

      nav {
        gap: 1rem;
      }

      .nav-btn {
        width: 40px;
        height: 40px;
      }

      .lang-btn {
        padding: 0 0.8rem !important;
        width: auto !important;
      }

      .hero {
        margin: 4rem auto 3rem auto;
      }

      .timeline {
        margin-bottom: 4rem;
      }

      .timeline::before {
        left: 30px;
      }

      .timeline-item {
        padding-left: 40px;
        margin-bottom: 3rem;
      }

      .timeline-marker {
        left: 10px;
      }

      .timeline-card {
        padding: 1.5rem;
      }

      .card-date {
        font-size: 1.2rem;
      }

      .card-body {
        font-size: 1.05rem;
      }
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="light-cursor"></div>

  <!-- Header -->
  <header class="floating-header">
    <div class="header-content">
      <a href="#" class="logo">${config.title}</a>
      <nav>
        <button id="lang-toggle" class="nav-btn lang-btn" aria-label="Cambiar idioma">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span id="lang-toggle-text" class="lang-label">ES</span>
        </button>
        <button id="email-trigger" class="nav-btn" aria-label="Contacto por Email">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </button>
        ${
          config.links.linkedin
            ? `
        <a href="${config.links.linkedin}" target="_blank" rel="noopener noreferrer" class="nav-btn" aria-label="LinkedIn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        </a>
        `
            : ""
        }
        ${
          config.links.github
            ? `
        <a href="${config.links.github}" target="_blank" rel="noopener noreferrer" class="nav-btn" aria-label="GitHub">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </a>
        `
            : ""
        }
      </nav>
    </div>
  </header>

  <!-- Hero -->
  <section class="hero">
    <h1 class="hero-title">${config.title}</h1>
    <p class="hero-subtitle lang-es">${config.subtitle_es}</p>
    <p class="hero-subtitle lang-en" style="display: none;">${config.subtitle_en}</p>
  </section>

  <!-- Timeline Content -->
  <main class="timeline">
    ${
      renderedEntries.length > 0
        ? renderedEntries
            .map(
              (entry) => `
    <div class="timeline-item">
      <div class="timeline-marker"></div>
      <article class="timeline-card">
        <div class="card-glow"></div>
        <div class="card-shine"></div>
        <div class="card-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="calendar-icon"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>
          <time class="card-date lang-es" datetime="${entry.date}">${entry.displayDateES}</time>
          <time class="card-date lang-en" datetime="${entry.date}" style="display: none;">${entry.displayDateEN}</time>
        </div>
        <div class="card-body lang-es">
          ${entry.htmlES}
        </div>
        <div class="card-body lang-en" style="display: none;">
          ${entry.htmlEN}
        </div>
      </article>
    </div>
    `,
            )
            .join("")
        : `
    <div class="empty-state lang-es">
      <p>Aún no hay entradas registradas.</p>
      <p style="font-size: 0.95rem; margin-top: 0.5rem; color: rgba(255,255,255,0.4);">
        Crea archivos <code>.md</code> en la carpeta <code>entries/</code> con formato <code>## AAAA-MM-DD</code> para empezar.
      </p>
    </div>
    <div class="empty-state lang-en" style="display: none;">
      <p>No entries recorded yet.</p>
      <p style="font-size: 0.95rem; margin-top: 0.5rem; color: rgba(255,255,255,0.4);">
        Create <code>.md</code> files in the <code>entries/</code> folder with <code>## YYYY-MM-DD</code> format to start.
      </p>
    </div>
    `
    }
  </main>

  <!-- Footer -->
  <footer>
    <p class="lang-es">&copy; ${new Date().getFullYear()} ${config.author}. Todos los derechos reservados.</p>
    <p class="lang-en" style="display: none;">&copy; ${new Date().getFullYear()} ${config.author}. All rights reserved.</p>
    <p class="lang-es" style="font-size: 0.85rem; color: rgba(255,255,255,0.3); margin-top: 0.5rem;">
      Generado estáticamente con <a href="https://github.com/jaimegh-es" target="_blank">whatimdoing builder</a>.
    </p>
    <p class="lang-en" style="display: none; font-size: 0.85rem; color: rgba(255,255,255,0.3); margin-top: 0.5rem;">
      Statically generated with <a href="https://github.com/jaimegh-es" target="_blank">whatimdoing builder</a>.
    </p>
  </footer>

  <!-- Contact Popup -->
  <div id="email-popup" class="popup-overlay">
    <div class="popup-content">
      <button id="close-popup" class="close-btn" aria-label="Cerrar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div class="popup-header">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <h3 class="lang-es">¿Hablamos?</h3>
        <h3 class="lang-en" style="display: none;">Let's talk?</h3>
        <p class="lang-es">Escríbeme cuando quieras</p>
        <p class="lang-en" style="display: none;">Write to me anytime</p>
      </div>

      <div class="email-container">
        <span id="email-address">${config.links.email}</span>
        <button id="copy-email" class="action-btn secondary" title="Copiar email">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
      </div>

      <div class="popup-actions">
        <a href="mailto:${config.links.email}" class="action-btn primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
          <span class="lang-es">Abrir en correo</span>
          <span class="lang-en" style="display: none;">Open email client</span>
        </a>
      </div>

      <div id="copy-toast" class="toast">
        <span class="lang-es">¡Copiado al portapapeles!</span>
        <span class="lang-en" style="display: none;">Copied to clipboard!</span>
      </div>
    </div>
  </div>

  <!-- Client-side Logic -->
  <script>
    // Light cursor follow mouse
    document.addEventListener("mousemove", (e) => {
      const cursor = document.querySelector(".light-cursor");
      if (cursor) {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      }
    });

    // Language Toggle Logic
    let currentLang = localStorage.getItem('lang') || 'es';

    function setLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('lang', lang);

      // Update HTML elements visibility
      document.querySelectorAll('.lang-es').forEach(el => {
        el.style.display = lang === 'es' ? '' : 'none';
      });
      document.querySelectorAll('.lang-en').forEach(el => {
        el.style.display = lang === 'en' ? '' : 'none';
      });

      // Update label in toggle button
      const toggleLabel = document.getElementById('lang-toggle-text');
      if (toggleLabel) {
        toggleLabel.textContent = lang === 'es' ? 'ES' : 'EN';
      }
    }

    // Set initial language
    setLanguage(currentLang);

    // Event listener for language toggle
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      setLanguage(currentLang === 'es' ? 'en' : 'es');
    });

    // Contact Popup logic
    const emailTrigger = document.getElementById('email-trigger');
    const emailPopup = document.getElementById('email-popup');
    const closePopup = document.getElementById('close-popup');
    const copyBtn = document.getElementById('copy-email');
    const emailText = document.getElementById('email-address')?.textContent;
    const toast = document.getElementById('copy-toast');

    function togglePopup() {
      emailPopup?.classList.toggle('active');
      if (emailPopup?.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    emailTrigger?.addEventListener('click', togglePopup);
    closePopup?.addEventListener('click', togglePopup);

    emailPopup?.addEventListener('click', (e) => {
      if (e.target === emailPopup) togglePopup();
    });

    copyBtn?.addEventListener('click', () => {
      if (emailText) {
        navigator.clipboard.writeText(emailText).then(() => {
          toast?.classList.add('active');
          setTimeout(() => {
            toast?.classList.remove('active');
          }, 2000);
        });
      }
    });
  </script>
</body>
</html>`;

// 8. Write the HTML output
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}
const outputPath = path.join(distDir, "index.html");
fs.writeFileSync(outputPath, htmlTemplate, "utf8");

console.log(
  `\x1b[32m✔ ¡Éxito! Archivo HTML estático generado en: ${outputPath}\x1b[0m`,
);
console.log(
  `\x1b[36mℹ Total de fechas procesadas: ${renderedEntries.length}\x1b[0m`,
);
