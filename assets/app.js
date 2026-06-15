const CONFIG_URL = 'content/site.config.json';
const ROUTE_IDS = ['home', 'about', 'music', 'sketches', 'videos-live', 'contact'];

const app = document.getElementById('app');
let config = null;
let lang = 'en';

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function languages() {
  const list = safeArray(config?.site?.languages);
  return list.length ? list : [
    { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
    { code: 'he', label: 'HE', name: 'עברית', dir: 'rtl' }
  ];
}

function languageCodes() {
  return languages().map(item => item.code);
}

function defaultLanguage() {
  return config?.site?.defaultLanguage || languages()[0]?.code || 'en';
}

function tr(value, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    return value[lang] ?? value[defaultLanguage()] ?? value.en ?? Object.values(value).find(v => typeof v === 'string') ?? fallback;
  }
  return fallback;
}

function trArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return safeArray(value[lang] ?? value[defaultLanguage()] ?? value.en ?? []);
  }
  return [];
}

function label(key, fallback = '') {
  return tr(config?.ui?.labels?.[key], fallback);
}

function navLabel(routeId) {
  return tr(config?.ui?.nav?.[routeId], routeId);
}

function parseHash() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  const codes = languageCodes();
  let parsedLang = defaultLanguage();
  let route = 'home';

  if (parts.length >= 2 && codes.includes(parts[0]) && ROUTE_IDS.includes(parts[1])) {
    parsedLang = parts[0];
    route = parts[1];
  } else if (parts.length >= 1 && ROUTE_IDS.includes(parts[0])) {
    parsedLang = localStorage.getItem('musicianSiteLanguage') || defaultLanguage();
    route = parts[0];
  } else if (parts.length >= 1 && codes.includes(parts[0])) {
    parsedLang = parts[0];
  } else {
    parsedLang = localStorage.getItem('musicianSiteLanguage') || defaultLanguage();
  }

  return { lang: parsedLang, route };
}

function routeHash(routeId, targetLang = lang) {
  return `#/${targetLang}/${routeId}`;
}

async function loadConfig() {
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.get('preview') === '1';
  const storedPreview = localStorage.getItem('musicianSitePreviewConfig');

  if (isPreview && storedPreview) {
    return { data: JSON.parse(storedPreview), preview: true };
  }

  const response = await fetch(CONFIG_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load ${CONFIG_URL}. Make sure the file exists.`);
  }
  return { data: await response.json(), preview: false };
}

function render() {
  const parsed = parseHash();
  lang = parsed.lang;
  localStorage.setItem('musicianSiteLanguage', lang);
  const activeRoute = parsed.route;
  const activeLanguage = languages().find(item => item.code === lang) || languages()[0];
  const site = config.site || {};

  document.documentElement.lang = lang;
  document.documentElement.dir = activeLanguage?.dir || (lang === 'he' ? 'rtl' : 'ltr');

  const pageHtml = {
    home: renderHome,
    about: renderAbout,
    music: () => renderAudioCollection('music', label('musicTitle', 'Music')),
    sketches: () => renderAudioCollection('sketches', label('sketchesTitle', 'Sketches')),
    'videos-live': renderVideosLive,
    contact: renderContact
  }[activeRoute]();

  document.title = `${tr(site.artistName, 'Musician')} | ${navLabel(activeRoute)}`;

  app.innerHTML = `
    <a class="skip-link" href="#main">${lang === 'he' ? 'דלג לתוכן' : 'Skip to content'}</a>
    <div class="site-shell">
      ${config.__preview ? '<div class="preview-banner">Preview mode — export from admin.html and upload the generated files to GitHub to publish.</div>' : ''}
      <header class="topbar">
        <div class="nav-inner">
          <a class="brand" href="${routeHash('home')}" aria-label="Home">
            <span class="brand-name">${esc(tr(site.artistName, 'Your Name'))}</span>
          </a>
          <nav class="nav-links" aria-label="Main navigation">
            ${ROUTE_IDS.map(routeId => `
              <a class="nav-link ${routeId === activeRoute ? 'active' : ''}" href="${routeHash(routeId)}">${esc(navLabel(routeId))}</a>
            `).join('')}
          </nav>
          <div class="language-switch" aria-label="Language switch">
            ${languages().map(item => `
              <a class="lang-link ${item.code === lang ? 'active' : ''}" href="${routeHash(activeRoute, item.code)}">${esc(item.label)}</a>
            `).join('<span>|</span>')}
          </div>
        </div>
      </header>
      <main id="main" class="page">${pageHtml}</main>
      <footer class="footer">
        <div class="footer-inner">
          <span>© ${new Date().getFullYear()} ${esc(tr(site.artistName, 'Musician'))}</span>
          <span>${esc(tr(site.location, ''))}</span>
        </div>
      </footer>
    </div>
  `;
}

function image(src, alt = '', className = '') {
  const fallback = 'media/images/musician-placeholder.svg';
  return `<img class="${esc(className)}" src="${esc(src || fallback)}" alt="${esc(alt)}" loading="lazy" onerror="this.src='${fallback}'" />`;
}

function renderHome() {
  const site = config.site || {};
  const home = config.home || {};
  const musicTracks = safeArray(config.music?.tracks);
  const sketchTracks = safeArray(config.sketches?.tracks);
  const featuredTrack = musicTracks.find(track => track.id === home.featuredTrackId) || musicTracks[0];
  const featuredSketch = sketchTracks.find(track => track.id === home.featuredSketchId) || sketchTracks[0];

  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="kicker">${esc(tr(site.accentText, 'Original music'))}</div>
        <h1>${esc(tr(site.artistName, 'Your Name'))}</h1>
        <p class="hero-role">${esc(tr(site.tagline, 'Musician'))}</p>
        <p class="hero-subtitle">${esc(tr(home.introTitle, 'Music portfolio'))}</p>
        <p class="hero-text">${esc(tr(home.introText, ''))}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${targetForLanguage(site.ctaPrimaryTarget || routeHash('music'))}">${esc(tr(site.ctaPrimaryText, 'Listen'))}</a>
          <a class="btn" href="${targetForLanguage(site.ctaSecondaryTarget || routeHash('contact'))}">${esc(tr(site.ctaSecondaryText, 'Contact'))}</a>
        </div>
      </div>
      <div class="hero-card">
        <div class="portrait-card">
          ${image(site.heroImage, tr(site.artistName, 'Musician portrait'))}
          <div class="portrait-overlay">
            <strong>${esc(tr(home.introTitle, 'Music portfolio'))}</strong>
            <span>${esc(tr(site.location, ''))}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section home-links">
      <div class="grid">
        <article class="card feature-card">
          <span class="card-number">01</span>
          <h3>${esc(navLabel('music'))}</h3>
          <p>${esc(lang === 'he' ? 'קטעים גמורים, שירים, דמואים והקלטות נבחרות.' : 'Finished pieces, songs, demos, and selected recordings.')}</p>
          <a class="pill" href="${routeHash('music')}">${esc(lang === 'he' ? 'למוזיקה' : 'Open Music')} →</a>
        </article>
        <article class="card feature-card">
          <span class="card-number">02</span>
          <h3>${esc(navLabel('sketches'))}</h3>
          <p>${esc(lang === 'he' ? 'רעיונות גיטרה, הקלטות קטנות ועבודות בתהליך.' : 'Guitar ideas, small recordings, fragments, and works in progress.')}</p>
          <a class="pill" href="${routeHash('sketches')}">${esc(lang === 'he' ? 'לסקיצות' : 'Open Sketches')} →</a>
        </article>
        <article class="card feature-card">
          <span class="card-number">03</span>
          <h3>${esc(navLabel('contact'))}</h3>
          <p>${esc(lang === 'he' ? 'בוקינג, שיעורים, הקלטות ושיתופי פעולה.' : 'Booking, lessons, recording, and collaborations.')}</p>
          <a class="pill" href="${routeHash('contact')}">${esc(navLabel('contact'))} →</a>
        </article>
      </div>
      <div class="featured-grid">
        ${featuredTrack ? renderTrack(featuredTrack, { compact: true, labelText: tr(home.featuredTrackTitle, label('featuredTrack', 'Featured Track')) }) : ''}
        ${featuredSketch ? renderTrack(featuredSketch, { compact: true, labelText: tr(home.featuredSketchTitle, label('featuredSketch', 'Featured Sketch')) }) : ''}
      </div>
    </section>
  `;
}

function targetForLanguage(target) {
  if (!target || target.startsWith('http') || target.startsWith('mailto:')) return target;
  const match = target.match(/^#\/(en|he)\/(.+)$/);
  if (match) return routeHash(match[2], lang);
  const route = target.replace('#/', '').replace('#', '');
  return ROUTE_IDS.includes(route) ? routeHash(route) : target;
}

function renderAbout() {
  const about = config.about || {};
  const site = config.site || {};
  return `
    <section class="section two-column">
      <aside class="about-image">
        ${image(about.image || site.heroImage, `${tr(site.artistName, 'Musician')} portrait`)}
      </aside>
      <div>
        <p class="section-kicker">${esc(navLabel('about'))}</p>
        <h1 class="page-title">${esc(tr(about.headline, 'About'))}</h1>
        ${trArray(about.paragraphs).map(paragraph => `<p class="lead">${esc(paragraph)}</p>`).join('')}
        ${tr(about.quote) ? `<blockquote class="quote">“${esc(tr(about.quote))}”</blockquote>` : ''}
        <div class="facts">
          ${safeArray(about.facts).map(fact => `
            <div class="fact">
              <span class="fact-label">${esc(tr(fact.label))}</span>
              <strong>${esc(tr(fact.value))}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAudioCollection(key, title) {
  const data = config[key] || {};
  const tracks = safeArray(data.tracks);
  return `
    <section class="section">
      <p class="section-kicker">${esc(title)}</p>
      <h1 class="page-title">${esc(title)}</h1>
      <p class="lead">${esc(tr(data.intro, ''))}</p>
      <div class="music-list">
        ${tracks.length ? tracks.map(track => renderTrack(track)).join('') : `<div class="card">${esc(lang === 'he' ? 'עדיין אין קטעים.' : 'No tracks yet.')}</div>`}
      </div>
    </section>
  `;
}

function renderTrack(track, options = {}) {
  const tags = trArray(track.tags);
  const hasAudio = track.audioSrc && track.audioSrc.trim().length > 0;
  const hasEmbed = track.embedUrl && track.embedUrl.trim().length > 0;
  const cover = track.coverImage || config.site?.heroImage;
  const title = tr(track.title, 'Untitled');

  return `
    <article class="card track-card">
      <div class="track-cover">${image(cover, `${title} cover`)}</div>
      <div class="track-body">
        ${options.labelText ? `<p class="mini-label">${esc(options.labelText)}</p>` : ''}
        <h3>${esc(title)}</h3>
        <p>${esc(tr(track.description, ''))}</p>
        <div class="track-meta">
          ${track.date ? `<span class="pill">${esc(track.date)}</span>` : ''}
          ${tags.map(tag => `<span class="pill">${esc(tag)}</span>`).join('')}
          ${track.externalUrl ? `<a class="pill" href="${esc(track.externalUrl)}" target="_blank" rel="noopener">${esc(label('externalLink', 'External link'))} →</a>` : ''}
        </div>
        ${tr(track.credits) ? `<p><small>${esc(tr(track.credits))}</small></p>` : ''}
        ${hasEmbed ? `<iframe class="embed-frame" src="${esc(track.embedUrl)}" loading="lazy" allow="autoplay; encrypted-media" title="${esc(title)}"></iframe>` : ''}
        ${!hasEmbed && hasAudio ? `<audio class="audio-player" controls preload="metadata"><source src="${esc(track.audioSrc)}">Your browser does not support the audio element.</audio>` : ''}
        ${!hasEmbed && !hasAudio ? `<div class="empty-audio">${esc(label('missingAudio', 'No audio file connected yet.'))}</div>` : ''}
      </div>
    </article>
  `;
}

function renderVideosLive() {
  const data = config.videosLive || {};
  const videos = safeArray(data.videos);
  const shows = safeArray(data.shows);
  return `
    <section class="section">
      <p class="section-kicker">${esc(navLabel('videos-live'))}</p>
      <h1 class="page-title">${esc(navLabel('videos-live'))}</h1>
      <p class="lead">${esc(tr(data.intro, ''))}</p>

      <h2>${esc(label('videosTitle', 'Videos'))}</h2>
      <div class="video-grid">
        ${videos.length ? videos.map(video => `
          <article class="card video-card">
            <div class="video-thumb">${image(video.thumbnail, tr(video.title, 'Video thumbnail'))}</div>
            <h3>${esc(tr(video.title, 'Video'))}</h3>
            <p>${esc(tr(video.description, ''))}</p>
            ${video.url ? `<a class="pill" href="${esc(video.url)}" target="_blank" rel="noopener">${esc(label('watch', 'Watch'))} →</a>` : `<span class="pill">${esc(lang === 'he' ? 'הוסף קישור וידאו' : 'Add video link')}</span>`}
          </article>
        `).join('') : `<div class="card">${esc(lang === 'he' ? 'עדיין אין סרטונים.' : 'No videos yet.')}</div>`}
      </div>

      <h2 class="section-subtitle">${esc(label('liveTitle', 'Live'))}</h2>
      <div class="show-grid">
        ${shows.length ? shows.map(show => `
          <article class="card show-card">
            <div class="show-date">${esc(formatDate(show.date))}</div>
            <h3>${esc(tr(show.venue, 'Venue'))}</h3>
            <p>${esc(tr(show.city, ''))}</p>
            <p>${esc(tr(show.notes, ''))}</p>
            ${show.ticketUrl ? `<a class="pill" href="${esc(show.ticketUrl)}" target="_blank" rel="noopener">${esc(label('tickets', 'Tickets'))} →</a>` : ''}
          </article>
        `).join('') : `<div class="card">${esc(lang === 'he' ? 'אין הופעות כרגע.' : 'No shows yet.')}</div>`}
      </div>
    </section>
  `;
}

function formatDate(dateString = '') {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderContact() {
  const contact = config.contact || {};
  const site = config.site || {};
  const email = contact.email || site.email || '';
  return `
    <section class="section">
      <p class="section-kicker">${esc(navLabel('contact'))}</p>
      <h1 class="page-title">${esc(navLabel('contact'))}</h1>
      <p class="lead">${esc(tr(contact.text, ''))}</p>
      <div class="contact-panel">
        <article class="card">
          <h2>${esc(tr(contact.headline, 'Get in touch'))}</h2>
          ${email ? `<a class="email-link" href="mailto:${esc(email)}">${esc(email)}</a>` : `<p>${esc(lang === 'he' ? 'הוסף כתובת מייל בעמוד הניהול.' : 'Add your email in admin.html.')}</p>`}
        </article>
        <aside class="card">
          <h2>${esc(label('linksTitle', 'Links'))}</h2>
          <div class="social-list">
            ${safeArray(contact.social).map(item => `
              <a href="${esc(item.url || '#')}" target="_blank" rel="noopener">
                <span>${esc(tr(item.label, 'Link'))}</span><span>↗</span>
              </a>
            `).join('') || `<p>${esc(lang === 'he' ? 'אין קישורים עדיין.' : 'No links yet.')}</p>`}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderError(error) {
  app.innerHTML = `
    <div class="error-box">
      <h1>Could not load the website content</h1>
      <p>${esc(error.message)}</p>
      <p>Open <code>content/site.config.json</code> and make sure the JSON is valid.</p>
    </div>
  `;
}

window.addEventListener('hashchange', render);

loadConfig()
  .then(({ data, preview }) => {
    config = data;
    config.__preview = preview;
    const parsed = parseHash();
    if (!window.location.hash || !window.location.hash.includes('/')) {
      window.location.replace(routeHash(parsed.route, parsed.lang));
      return;
    }
    render();
  })
  .catch(renderError);
