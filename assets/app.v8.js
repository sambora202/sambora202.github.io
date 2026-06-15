const CONFIG_URL = 'content/site.config.json';
const ROUTES = ['home', 'about', 'music', 'sketches', 'videos-live', 'contact'];
const LANGS = ['en', 'he'];
const app = document.getElementById('app');
let config = {};
let lang = 'en';
let route = 'home';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function t(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(item => t(item)).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const preferred = value[lang] ?? value[config.site?.defaultLanguage || 'en'] ?? value.en ?? value.he;
    if (preferred !== undefined && preferred !== null) return t(preferred, fallback);
    const firstPrimitive = Object.values(value).find(v => typeof v === 'string' || typeof v === 'number');
    return firstPrimitive !== undefined ? String(firstPrimitive) : fallback;
  }
  return fallback;
}

function tArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(item => t(item)).filter(Boolean);
  if (typeof value === 'object') {
    const selected = value[lang] ?? value[config.site?.defaultLanguage || 'en'] ?? value.en ?? value.he;
    return Array.isArray(selected) ? selected : [];
  }
  return [];
}

function label(key, fallback = '') {
  return t(config.labels?.[key], fallback);
}

function navLabel(id) {
  return t(config.nav?.[id], id);
}

function hashFor(nextRoute = route, nextLang = lang) {
  return `#/${nextLang}/${nextRoute}`;
}

function readRoute() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  let nextLang = localStorage.getItem('ms_lang') || config.site?.defaultLanguage || 'en';
  let nextRoute = 'home';

  if (LANGS.includes(parts[0])) {
    nextLang = parts[0];
    if (ROUTES.includes(parts[1])) nextRoute = parts[1];
  } else if (ROUTES.includes(parts[0])) {
    nextRoute = parts[0];
  }

  return { nextLang, nextRoute };
}

function image(src, alt = '', className = '') {
  const fallback = 'media/images/michael-savransky.png';
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(src || fallback)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.src='${fallback}'" />`;
}

function renderShell(content) {
  const site = config.site || {};
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = `${t(site.artistName, 'Michael Savransky')} | ${navLabel(route)}`;

  app.innerHTML = `
    <div class="site">
      <header class="topbar">
        <div class="nav-inner">
          <a class="brand" href="${hashFor('home')}" aria-label="${escapeHtml(navLabel('home'))}">
            <span class="brand-script">${escapeHtml(t(site.artistName, 'Michael Savransky'))}</span>
            <span class="brand-sub">${escapeHtml(t(site.tagline, 'Guitarist'))}</span>
          </a>
          <nav class="nav-links" aria-label="Main navigation">
            ${ROUTES.map(id => `<a class="nav-link ${id === route ? 'active' : ''}" href="${hashFor(id)}">${escapeHtml(navLabel(id))}</a>`).join('')}
          </nav>
          <div class="lang-switch" aria-label="Language switch">
            <a class="${lang === 'en' ? 'active' : ''}" href="${hashFor(route, 'en')}">EN</a>
            <span>|</span>
            <a class="${lang === 'he' ? 'active' : ''}" href="${hashFor(route, 'he')}">HE</a>
          </div>
        </div>
      </header>
      <main>${content}</main>
      <footer class="footer">
        <div class="footer-inner">
          <span>© ${new Date().getFullYear()} ${escapeHtml(t(site.artistName, 'Michael Savransky'))}</span>
          <span>${escapeHtml(t(site.location, ''))}</span>
        </div>
      </footer>
    </div>
  `;
}

function splitName(name) {
  const words = String(name || '').split(' ').filter(Boolean);
  if (words.length < 2) return escapeHtml(name);
  return `${escapeHtml(words[0])}<span>${escapeHtml(words.slice(1).join(' '))}</span>`;
}

function renderHome() {
  const site = config.site || {};
  const home = config.home || {};
  const sketches = asArray(config.sketches?.tracks);
  const featured = sketches.find(item => item.id === home.featuredSketchId) || sketches[0];

  return `
    <section class="hero">
      <div>
        <div class="kicker">${escapeHtml(t(site.accentText, 'Original guitar music'))}</div>
        <h1>${splitName(t(site.artistName, 'Michael Savransky'))}</h1>
        <p class="hero-role">${escapeHtml(t(site.tagline, 'Guitarist · Composer · Songwriter'))}</p>
        <p class="hero-text">${escapeHtml(t(home.headline, 'Guitar music with air between the notes.'))}</p>
        <p class="lead">${escapeHtml(t(home.text, ''))}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${hashFor(site.ctaPrimary?.route || 'sketches')}">${escapeHtml(t(site.ctaPrimary?.label, label('listen', 'Listen')))}</a>
          <a class="btn" href="${hashFor(site.ctaSecondary?.route || 'contact')}">${escapeHtml(t(site.ctaSecondary?.label, navLabel('contact')))}</a>
        </div>
      </div>
      <div class="portrait-card">
        ${image(site.heroImage, t(site.artistName, 'Michael Savransky'))}
        <div class="portrait-badge">
          <strong>${escapeHtml(t(site.artistName, 'Michael Savransky'))}</strong>
          <span>${escapeHtml(t(site.tagline, 'Guitarist'))}</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="cards-grid">
        <article class="card home-preview-card">
          <h3>${escapeHtml(navLabel('music'))}</h3>
          <p>${escapeHtml(lang === 'he' ? 'שירים גמורים, דמואים והקלטות נבחרות.' : 'Finished songs, demos, and selected recordings.')}</p>
          <a class="pill" href="${hashFor('music')}">${escapeHtml(navLabel('music'))} →</a>
        </article>
        <article class="card home-preview-card">
          <h3>${escapeHtml(navLabel('sketches'))}</h3>
          <p>${escapeHtml(lang === 'he' ? 'רעיונות גיטרה, קטעים קטנים ועבודות בתהליך.' : 'Guitar ideas, small pieces, and works in progress.')}</p>
          <a class="pill" href="${hashFor('sketches')}">${escapeHtml(navLabel('sketches'))} →</a>
        </article>
        <article class="card home-preview-card">
          <h3>${escapeHtml(navLabel('contact'))}</h3>
          <p>${escapeHtml(lang === 'he' ? 'בוקינג, שיעורים, הקלטות ושיתופי פעולה.' : 'Booking, lessons, recording, and collaborations.')}</p>
          <a class="pill" href="${hashFor('contact')}">${escapeHtml(navLabel('contact'))} →</a>
        </article>
      </div>
      ${featured ? `<div class="featured-grid">${renderTrack(featured, label('featuredSketch', 'Featured sketch'))}</div>` : ''}
    </section>
  `;
}

function renderAbout() {
  const about = config.about || {};
  const site = config.site || {};
  return `
    <section class="section two-column">
      <aside class="about-image">${image(about.image || site.heroImage, t(site.artistName, 'Michael Savransky'))}</aside>
      <div>
        <div class="section-kicker">${escapeHtml(navLabel('about'))}</div>
        <h1 class="page-title">${escapeHtml(t(about.headline, 'About'))}</h1>
        ${tArray(about.paragraphs).map(paragraph => `<p class="lead">${escapeHtml(paragraph)}</p>`).join('')}
        ${t(about.quote) ? `<blockquote class="quote">${escapeHtml(t(about.quote))}</blockquote>` : ''}
      </div>
    </section>
  `;
}

function renderAudioPage(key) {
  const data = config[key] || {};
  const title = navLabel(key);
  const tracks = asArray(data.tracks);
  const empty = key === 'music' ? label('noMusic', 'No music yet.') : '';
  return `
    <section class="section">
      <div class="page-head">
        <div class="section-kicker">${escapeHtml(title)}</div>
        <h1 class="page-title">${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(t(data.intro, ''))}</p>
      </div>
      <div class="audio-list">
        ${tracks.length ? tracks.map(track => renderTrack(track)).join('') : `<div class="empty-state">${escapeHtml(empty || (lang === 'he' ? 'עדיין אין קטעים.' : 'No tracks yet.'))}</div>`}
      </div>
    </section>
  `;
}

function renderTrack(track, miniLabel = '') {
  const title = t(track.title, 'Untitled');
  const src = String(track.audioSrc || '').trim();
  const instrument = t(track.instrument);
  return `
    <article class="card track-card">
      <div class="track-cover">${image(track.coverImage || config.site?.heroImage, title)}</div>
      <div class="track-body">
        ${miniLabel ? `<div class="mini-label">${escapeHtml(miniLabel)}</div>` : ''}
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(t(track.description, ''))}</p>
        <div class="track-meta">
          ${track.year ? `<span class="pill ghost">${escapeHtml(label('year', 'Year'))}: ${escapeHtml(track.year)}</span>` : ''}
          ${instrument ? `<span class="pill ghost">${escapeHtml(label('instrument', 'Instrument'))}: ${escapeHtml(instrument)}</span>` : ''}
        </div>
        ${t(track.credits) ? `<div class="credit"><strong>${escapeHtml(label('credits', 'Credits'))}:</strong> ${escapeHtml(t(track.credits))}</div>` : ''}
        ${src ? `<audio class="audio-player" controls preload="metadata" src="${escapeHtml(src)}"></audio>` : `<div class="empty-audio">${escapeHtml(lang === 'he' ? 'אין קובץ אודיו מחובר.' : 'No audio file connected.')}</div>`}
      </div>
    </article>
  `;
}

function renderVideosLive() {
  const data = config.videosLive || {};
  const videos = asArray(data.videos);
  const shows = asArray(data.shows);
  return `
    <section class="section">
      <div class="page-head">
        <div class="section-kicker">${escapeHtml(navLabel('videos-live'))}</div>
        <h1 class="page-title">${escapeHtml(navLabel('videos-live'))}</h1>
        <p class="lead">${escapeHtml(t(data.intro, ''))}</p>
      </div>
      <h2>${escapeHtml(lang === 'he' ? 'וידאו' : 'Videos')}</h2>
      <div class="video-grid">${videos.length ? videos.map(renderVideo).join('') : `<div class="empty-state">${escapeHtml(label('noVideos', 'No videos yet.'))}</div>`}</div>
      <h2 class="subheading">${escapeHtml(lang === 'he' ? 'הופעות' : 'Live')}</h2>
      <div class="show-grid">${shows.length ? shows.map(renderShow).join('') : `<div class="empty-state">${escapeHtml(label('noShows', 'No live dates yet.'))}</div>`}</div>
    </section>
  `;
}

function renderVideo(video) {
  return `<article class="card"><h3>${escapeHtml(t(video.title, 'Video'))}</h3><p>${escapeHtml(t(video.description, ''))}</p>${video.url ? `<a class="pill" href="${escapeHtml(video.url)}" target="_blank" rel="noopener">${escapeHtml(lang === 'he' ? 'צפייה' : 'Watch')} →</a>` : ''}</article>`;
}
function renderShow(show) {
  return `<article class="card"><h3>${escapeHtml(t(show.venue, 'Venue'))}</h3><p>${escapeHtml(show.date || '')}</p><p>${escapeHtml(t(show.city, ''))}</p></article>`;
}

function renderContact() {
  const contact = config.contact || {};
  const email = contact.email || config.site?.email || '';
  return `
    <section class="section">
      <div class="page-head">
        <div class="section-kicker">${escapeHtml(navLabel('contact'))}</div>
        <h1 class="page-title">${escapeHtml(navLabel('contact'))}</h1>
        <p class="lead">${escapeHtml(t(contact.text, ''))}</p>
      </div>
      <div class="contact-grid">
        <article class="card">
          <h2>${escapeHtml(t(contact.headline, 'Get in touch'))}</h2>
          ${email ? `<a class="email-link" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : ''}
        </article>
        <aside class="card">
          <h2>${escapeHtml(lang === 'he' ? 'קישורים' : 'Links')}</h2>
          <div class="social-list">
            ${asArray(contact.links).length ? asArray(contact.links).map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener"><span>${escapeHtml(t(link.label, 'Link'))}</span><span>↗</span></a>`).join('') : `<p>${escapeHtml(lang === 'he' ? 'אין קישורים עדיין.' : 'No links yet.')}</p>`}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function render() {
  const parsed = readRoute();
  lang = parsed.nextLang;
  route = parsed.nextRoute;
  localStorage.setItem('ms_lang', lang);

  let content = '';
  if (route === 'home') content = renderHome();
  if (route === 'about') content = renderAbout();
  if (route === 'music') content = renderAudioPage('music');
  if (route === 'sketches') content = renderAudioPage('sketches');
  if (route === 'videos-live') content = renderVideosLive();
  if (route === 'contact') content = renderContact();
  renderShell(content);
}

async function start() {
  try {
    const response = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load ${CONFIG_URL}`);
    config = await response.json();
    const parsed = readRoute();
    if (!location.hash) {
      location.replace(hashFor(parsed.nextRoute, parsed.nextLang));
      return;
    }
    render();
  } catch (error) {
    app.innerHTML = `<div class="error-box"><h1>Could not load the site</h1><p>${escapeHtml(error.message)}</p><p>Open the site through GitHub Pages or a local server. Direct file opening can block JSON loading in some browsers.</p></div>`;
  }
}

window.addEventListener('hashchange', render);
start();
