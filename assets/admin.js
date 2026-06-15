const CONFIG_URL = 'content/site.config.json';
const app = document.getElementById('adminApp');
let state = null;
let selectedFiles = new Map();

const LANGUAGE_META = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' }
];

function defaultConfig() {
  return {
    site: {
      defaultLanguage: 'en',
      languages: [
        { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
        { code: 'he', label: 'HE', name: 'עברית', dir: 'rtl' }
      ],
      artistName: { en: 'Your Name', he: 'השם שלך' },
      tagline: { en: 'Guitarist · Composer · Songwriter', he: 'גיטריסט · מלחין · כותב שירים' },
      location: { en: 'Your City / Worldwide', he: 'העיר שלך / ברחבי העולם' },
      email: 'booking@example.com',
      heroImage: 'media/images/musician-placeholder.svg',
      accentText: { en: 'Original guitar music', he: 'מוזיקת גיטרה מקורית' },
      ctaPrimaryText: { en: 'Listen Now', he: 'האזנה' },
      ctaPrimaryTarget: '#/en/music',
      ctaSecondaryText: { en: 'Contact', he: 'יצירת קשר' },
      ctaSecondaryTarget: '#/en/contact'
    },
    ui: {
      nav: {
        home: { en: 'Home', he: 'בית' },
        about: { en: 'About', he: 'אודות' },
        music: { en: 'Music', he: 'מוזיקה' },
        sketches: { en: 'Sketches', he: 'סקיצות' },
        'videos-live': { en: 'Videos / Live', he: 'וידאו / הופעות' },
        contact: { en: 'Contact', he: 'יצירת קשר' }
      },
      labels: {}
    },
    home: {
      introTitle: { en: 'Guitar strings with room to breathe.', he: 'מיתרי גיטרה עם מקום לנשום.' },
      introText: { en: 'A professional portfolio for guitar pieces, songs, sketches, live sessions, and collaborations.', he: 'פורטפוליו מקצועי לקטעי גיטרה, שירים, סקיצות, סשנים חיים ושיתופי פעולה.' },
      featuredTrackTitle: { en: 'Featured Track', he: 'קטע נבחר' },
      featuredTrackId: 'track-01',
      featuredSketchTitle: { en: 'Latest Sketch', he: 'סקיצה אחרונה' },
      featuredSketchId: 'sketch-01'
    },
    about: {
      headline: { en: 'About the Musician', he: 'על המוזיקאי' },
      image: 'media/images/musician-placeholder.svg',
      paragraphs: { en: ['Write your short biography here.'], he: ['כתוב כאן ביוגרפיה קצרה.'] },
      quote: { en: 'A short artistic sentence can go here.', he: 'כאן יכולה להופיע שורה אמנותית קצרה.' },
      facts: [
        { label: { en: 'Based in', he: 'מיקום' }, value: { en: 'Your City', he: 'העיר שלך' } },
        { label: { en: 'Available for', he: 'זמין עבור' }, value: { en: 'Concerts, recording, lessons, collaborations', he: 'הופעות, הקלטות, שיעורים ושיתופי פעולה' } }
      ]
    },
    music: { intro: { en: 'Selected recordings and releases.', he: 'הקלטות וקטעים נבחרים.' }, tracks: [] },
    sketches: { intro: { en: 'Every finished piece starts as a sketch.', he: 'כל יצירה גמורה מתחילה כסקיצה.' }, tracks: [] },
    videosLive: { intro: { en: 'Live performances, videos, and upcoming events.', he: 'הופעות, וידאו ואירועים קרובים.' }, videos: [], shows: [] },
    contact: { headline: { en: 'Booking and collaborations', he: 'בוקינג ושיתופי פעולה' }, text: { en: 'Send a message with your project details.', he: 'אפשר לשלוח הודעה עם פרטי הפרויקט.' }, email: 'booking@example.com', social: [] }
  };
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function pathKey(part) {
  return /^\d+$/.test(part) ? Number(part) : part;
}

function get(path) {
  return path.split('.').reduce((acc, key) => acc?.[pathKey(key)], state);
}

function ensureObject(path) {
  const parts = path.split('.');
  let node = state;
  for (const part of parts) {
    const key = pathKey(part);
    if (node[key] == null || typeof node[key] !== 'object' || Array.isArray(node[key])) node[key] = {};
    node = node[key];
  }
}

function set(path, value) {
  const parts = path.split('.');
  let node = state;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = pathKey(parts[i]);
    if (node[key] == null) node[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    node = node[key];
  }
  node[pathKey(parts.at(-1))] = value;
}

function displayValue(path, kind = '') {
  const current = get(path);
  if (Array.isArray(current)) return current.join(kind === 'tags' ? ', ' : '\n');
  return current ?? '';
}

function normalizeConfig(config) {
  const base = defaultConfig();
  const merged = {
    ...base,
    ...config,
    site: { ...base.site, ...(config.site || {}) },
    ui: { ...base.ui, ...(config.ui || {}), nav: { ...base.ui.nav, ...(config.ui?.nav || {}) }, labels: { ...base.ui.labels, ...(config.ui?.labels || {}) } },
    home: { ...base.home, ...(config.home || {}) },
    about: { ...base.about, ...(config.about || {}), facts: config.about?.facts || base.about.facts },
    music: { ...base.music, ...(config.music || {}), tracks: config.music?.tracks || [] },
    sketches: { ...base.sketches, ...(config.sketches || {}), tracks: config.sketches?.tracks || [] },
    videosLive: { ...base.videosLive, ...(config.videosLive || {}), videos: config.videosLive?.videos || [], shows: config.videosLive?.shows || [] },
    contact: { ...base.contact, ...(config.contact || {}), social: config.contact?.social || [] }
  };
  return merged;
}

async function load() {
  try {
    const response = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Config not found');
    state = normalizeConfig(await response.json());
  } catch (error) {
    state = defaultConfig();
  }
  render();
}

function field(label, path, options = {}) {
  if (options.i18n) return i18nField(label, path, options);
  return singleField(label, path, options);
}

function i18nField(label, path, options = {}) {
  ensureObject(path);
  const help = options.help ? `<div class="help full-help">${esc(options.help)}</div>` : '';
  return `
    <div class="field full i18n-field">
      <div class="i18n-label">${esc(label)}</div>
      <div class="lang-columns">
        ${LANGUAGE_META.map(meta => singleField(meta.label, `${path}.${meta.code}`, { ...options, i18n: false, nested: true })).join('')}
      </div>
      ${help}
    </div>
  `;
}

function singleField(label, path, options = {}) {
  const type = options.type || 'text';
  const full = options.full && !options.nested ? ' full' : '';
  const help = options.help && !options.nested && !options.i18n ? `<div class="help">${esc(options.help)}</div>` : '';
  const kind = options.kind || '';
  const current = displayValue(path, kind);

  if (type === 'textarea') {
    return `
      <div class="field${full}">
        <label for="${esc(path)}">${esc(label)}</label>
        <textarea id="${esc(path)}" data-path="${esc(path)}" data-kind="${esc(kind)}">${esc(current)}</textarea>
        ${help}
      </div>
    `;
  }

  if (type === 'file-path') {
    const accept = options.accept || '*/*';
    const folder = options.folder || 'media/images';
    return `
      <div class="field${full}">
        <label for="${esc(path)}">${esc(label)}</label>
        <div class="file-row">
          <input id="${esc(path)}" data-path="${esc(path)}" value="${esc(current)}" placeholder="${esc(folder)}/file-name" />
          <label class="file-button">
            Choose file
            <input class="hidden-file" type="file" data-file-path="${esc(path)}" data-folder="${esc(folder)}" accept="${esc(accept)}" />
          </label>
        </div>
        ${help}
      </div>
    `;
  }

  return `
    <div class="field${full}">
      <label for="${esc(path)}">${esc(label)}</label>
      <input id="${esc(path)}" data-path="${esc(path)}" data-kind="${esc(kind)}" type="${esc(type)}" value="${esc(current)}" />
      ${help}
    </div>
  `;
}

function section(id, title, help, html) {
  return `
    <section class="section-card" id="${esc(id)}">
      <h3>${esc(title)}</h3>
      <p>${esc(help)}</p>
      ${html}
    </section>
  `;
}

function render() {
  app.innerHTML = `
    <div class="notice translation-note">
      <strong>Bilingual content:</strong> Fill both English and Hebrew fields. GitHub Pages is static, so this admin helper cannot run AI translation by itself. When you ask ChatGPT to add or change content in one language, ask it to update both language fields in <code>site.config.json</code>.
    </div>

    ${section('basics', 'Basics', 'Main identity, hero image, buttons, and home page text.', `
      <div class="form-grid">
        ${field('Artist / band name', 'site.artistName', { i18n: true })}
        ${field('Tagline', 'site.tagline', { i18n: true })}
        ${field('Location', 'site.location', { i18n: true })}
        ${field('Booking email', 'site.email', { type: 'email' })}
        ${field('Hero image', 'site.heroImage', { type: 'file-path', accept: 'image/*', folder: 'media/images', full: true, help: 'Choose an image, then export ZIP. The path will be filled automatically.' })}
        ${field('Small hero label', 'site.accentText', { i18n: true })}
        ${field('Primary button text', 'site.ctaPrimaryText', { i18n: true })}
        ${field('Primary button target', 'site.ctaPrimaryTarget', { help: 'Use #/en/music, #/en/about, #/en/contact, or a full external URL. The website adjusts the language automatically.' })}
        ${field('Secondary button text', 'site.ctaSecondaryText', { i18n: true })}
        ${field('Secondary button target', 'site.ctaSecondaryTarget')}
        ${field('Home headline', 'home.introTitle', { i18n: true, type: 'textarea' })}
        ${field('Home intro text', 'home.introText', { i18n: true, type: 'textarea' })}
        ${field('Featured track title label', 'home.featuredTrackTitle', { i18n: true })}
        ${field('Featured track ID', 'home.featuredTrackId', { help: 'Example: track-01. This should match one Music track ID below.' })}
        ${field('Featured sketch title label', 'home.featuredSketchTitle', { i18n: true })}
        ${field('Featured sketch ID', 'home.featuredSketchId', { help: 'Example: sketch-01. This should match one Sketch ID below.' })}
      </div>
    `)}

    ${section('about', 'About', 'Biography, portrait image, quote, and quick facts.', `
      <div class="form-grid">
        ${field('About headline', 'about.headline', { i18n: true })}
        ${field('About portrait image', 'about.image', { type: 'file-path', accept: 'image/*', folder: 'media/images', full: true })}
        ${field('Biography paragraphs', 'about.paragraphs', { i18n: true, type: 'textarea', kind: 'lines', help: 'Write one paragraph per line in each language.' })}
        ${field('Quote', 'about.quote', { i18n: true, type: 'textarea' })}
      </div>
      <h4>Quick facts</h4>
      ${state.about.facts.map((fact, index) => itemCard(`Fact ${index + 1}`, 'about.facts', index, `
        <div class="form-grid">
          ${field('Label', `about.facts.${index}.label`, { i18n: true })}
          ${field('Value', `about.facts.${index}.value`, { i18n: true })}
        </div>
      `)).join('')}
      <button data-add="about.facts">+ Add fact</button>
    `)}

    ${renderAudioAdminSection('music', 'Music', 'Tracks can use direct audio files or external embed links from SoundCloud/Bandcamp.')}
    ${renderAudioAdminSection('sketches', 'Sketches', 'Sketches work exactly like Music: add small recordings, fragments, loops, and works in progress.')}

    ${section('videos-live', 'Videos / Live', 'Add YouTube/Vimeo links, thumbnails, and upcoming or past shows.', `
      <div class="form-grid">
        ${field('Videos / Live intro', 'videosLive.intro', { i18n: true, type: 'textarea' })}
      </div>
      <h4>Videos</h4>
      ${state.videosLive.videos.map((video, index) => itemCard(`Video ${index + 1}`, 'videosLive.videos', index, `
        <div class="form-grid">
          ${field('Title', `videosLive.videos.${index}.title`, { i18n: true })}
          ${field('Video URL', `videosLive.videos.${index}.url`)}
          ${field('Description', `videosLive.videos.${index}.description`, { i18n: true, type: 'textarea' })}
          ${field('Thumbnail image', `videosLive.videos.${index}.thumbnail`, { type: 'file-path', accept: 'image/*', folder: 'media/images', full: true })}
        </div>
      `)).join('')}
      <button data-add="videosLive.videos">+ Add video</button>

      <h4>Live shows</h4>
      ${state.videosLive.shows.map((show, index) => itemCard(`Show ${index + 1}`, 'videosLive.shows', index, `
        <div class="form-grid">
          ${field('Date', `videosLive.shows.${index}.date`, { type: 'date' })}
          ${field('City', `videosLive.shows.${index}.city`, { i18n: true })}
          ${field('Venue', `videosLive.shows.${index}.venue`, { i18n: true })}
          ${field('Ticket URL', `videosLive.shows.${index}.ticketUrl`)}
          ${field('Notes', `videosLive.shows.${index}.notes`, { i18n: true, type: 'textarea' })}
        </div>
      `)).join('')}
      <button data-add="videosLive.shows">+ Add show</button>
    `)}

    ${section('contact', 'Contact', 'Booking text, email, and social links.', `
      <div class="form-grid">
        ${field('Contact headline', 'contact.headline', { i18n: true })}
        ${field('Contact text', 'contact.text', { i18n: true, type: 'textarea' })}
        ${field('Contact email', 'contact.email', { type: 'email' })}
      </div>
      <h4>Social links</h4>
      ${state.contact.social.map((item, index) => itemCard(`Link ${index + 1}`, 'contact.social', index, `
        <div class="form-grid">
          ${field('Label', `contact.social.${index}.label`, { i18n: true })}
          ${field('URL', `contact.social.${index}.url`)}
        </div>
      `)).join('')}
      <button data-add="contact.social">+ Add social link</button>
    `)}

    ${section('export', 'Preview and Export', 'Export a ZIP containing content/site.config.json and any selected media files.', `
      <div class="actions">
        <button class="primary" id="previewBtn">Save browser preview</button>
        <button id="zipBtn">Download update ZIP</button>
        <button id="jsonBtn">Download JSON only</button>
        <label class="button ghost">Import JSON <input class="hidden-file" type="file" id="importJson" accept="application/json,.json" /></label>
        <button class="danger" id="clearPreviewBtn">Clear preview</button>
      </div>
      <div id="status" class="status"></div>
      <p class="help">After exporting the ZIP, upload its folders/files into your GitHub repository root. It will replace content/site.config.json and add media files.</p>
      <textarea class="code-preview" id="jsonPreview" readonly>${esc(JSON.stringify(cleanState(), null, 2))}</textarea>
    `)}
  `;
  bindEvents();
}

function renderAudioAdminSection(key, title, help) {
  const collection = state[key];
  return section(key, title, help, `
    <div class="form-grid">
      ${field(`${title} page intro`, `${key}.intro`, { i18n: true, type: 'textarea' })}
    </div>
    ${collection.tracks.map((track, index) => itemCard(`${title} item ${index + 1}`, `${key}.tracks`, index, `
      <div class="form-grid">
        ${field('ID', `${key}.tracks.${index}.id`, { help: 'Use a unique ID like track-01 or sketch-01.' })}
        ${field('Title', `${key}.tracks.${index}.title`, { i18n: true })}
        ${field('Description', `${key}.tracks.${index}.description`, { i18n: true, type: 'textarea' })}
        ${field('Audio file', `${key}.tracks.${index}.audioSrc`, { type: 'file-path', accept: 'audio/*', folder: 'media/audio', full: true, help: 'Choose MP3/WAV/OGG. Leave empty when using only an embed.' })}
        ${field('Cover image', `${key}.tracks.${index}.coverImage`, { type: 'file-path', accept: 'image/*', folder: 'media/images', full: true })}
        ${field('Year / date', `${key}.tracks.${index}.date`)}
        ${field('Credits', `${key}.tracks.${index}.credits`, { i18n: true })}
        ${field('Tags', `${key}.tracks.${index}.tags`, { i18n: true, kind: 'tags', help: 'Comma-separated or one per line in each language.' })}
        ${field('External link', `${key}.tracks.${index}.externalUrl`, { full: true, help: 'Optional: Spotify, Bandcamp, YouTube, etc.' })}
        ${field('Embed iframe src', `${key}.tracks.${index}.embedUrl`, { full: true, help: 'Optional. Paste only the iframe src URL, not the whole iframe HTML.' })}
      </div>
    `)).join('')}
    <button data-add="${key}.tracks">+ Add ${title.toLowerCase()} item</button>
  `);
}

function itemCard(title, arrayPath, index, html) {
  return `
    <div class="item-card">
      <div class="item-head">
        <h4>${esc(title)}</h4>
        <button class="danger" data-remove="${esc(arrayPath)}" data-index="${index}">Remove</button>
      </div>
      ${html}
    </div>
  `;
}

function bindEvents() {
  app.querySelectorAll('[data-path]').forEach(input => {
    input.addEventListener('input', event => {
      const path = event.target.dataset.path;
      const kind = event.target.dataset.kind || '';
      const raw = event.target.value;
      if (kind === 'tags') {
        set(path, raw.split(/[\n,]/).map(item => item.trim()).filter(Boolean));
      } else if (kind === 'lines') {
        set(path, raw.split('\n').map(item => item.trim()).filter(Boolean));
      } else {
        set(path, raw);
      }
      refreshPreviewOnly();
    });
  });

  app.querySelectorAll('[data-file-path]').forEach(input => {
    input.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (!file) return;
      const folder = event.target.dataset.folder;
      const cleanName = safeFileName(file.name);
      const path = `${folder}/${cleanName}`;
      selectedFiles.set(path, file);
      set(event.target.dataset.filePath, path);
      render();
      setStatus(`Selected ${cleanName}. It will be included in the export ZIP.`);
    });
  });

  app.querySelectorAll('[data-add]').forEach(button => {
    button.addEventListener('click', () => {
      const path = button.dataset.add;
      const list = get(path);
      list.push(newItemFor(path));
      render();
    });
  });

  app.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => {
      const list = get(button.dataset.remove);
      list.splice(Number(button.dataset.index), 1);
      render();
    });
  });

  document.getElementById('previewBtn')?.addEventListener('click', () => {
    localStorage.setItem('musicianSitePreviewConfig', JSON.stringify(cleanState()));
    setStatus('Preview saved in this browser. Opening preview…');
    window.open('index.html?preview=1#/en/home', '_blank', 'noopener');
  });

  document.getElementById('jsonBtn')?.addEventListener('click', () => downloadJson());
  document.getElementById('zipBtn')?.addEventListener('click', () => downloadZip());
  document.getElementById('clearPreviewBtn')?.addEventListener('click', () => {
    localStorage.removeItem('musicianSitePreviewConfig');
    setStatus('Browser preview cleared.');
  });
  document.getElementById('importJson')?.addEventListener('change', importJson);
}

function refreshPreviewOnly() {
  const preview = document.getElementById('jsonPreview');
  if (preview) preview.value = JSON.stringify(cleanState(), null, 2);
}

function newItemFor(path) {
  const id = Date.now().toString(36);
  const templates = {
    'about.facts': { label: { en: 'Label', he: 'תווית' }, value: { en: 'Value', he: 'ערך' } },
    'music.tracks': { id: `track-${id}`, title: { en: 'New Track', he: 'קטע חדש' }, description: { en: '', he: '' }, audioSrc: '', coverImage: '', date: '', credits: { en: '', he: '' }, tags: { en: [], he: [] }, externalUrl: '', embedUrl: '' },
    'sketches.tracks': { id: `sketch-${id}`, title: { en: 'New Sketch', he: 'סקיצה חדשה' }, description: { en: '', he: '' }, audioSrc: '', coverImage: '', date: '', credits: { en: '', he: '' }, tags: { en: [], he: [] }, externalUrl: '', embedUrl: '' },
    'videosLive.videos': { title: { en: 'New Video', he: 'וידאו חדש' }, description: { en: '', he: '' }, url: '', thumbnail: '' },
    'videosLive.shows': { date: '', city: { en: '', he: '' }, venue: { en: '', he: '' }, notes: { en: '', he: '' }, ticketUrl: '' },
    'contact.social': { label: { en: 'Instagram', he: 'אינסטגרם' }, url: '' }
  };
  return templates[path] || {};
}

function cleanState() {
  const clone = JSON.parse(JSON.stringify(state));
  delete clone.__preview;
  return clone;
}

function setStatus(message, isError = false) {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function safeFileName(name) {
  return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').replace(/-+/g, '-');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadJson() {
  const json = JSON.stringify(cleanState(), null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), 'site.config.json');
  setStatus('Downloaded site.config.json. Put it inside the content folder.');
}

async function downloadZip() {
  try {
    const files = [];
    const json = JSON.stringify(cleanState(), null, 2);
    files.push({ path: 'content/site.config.json', data: new TextEncoder().encode(json) });
    for (const [path, file] of selectedFiles.entries()) files.push({ path, data: new Uint8Array(await file.arrayBuffer()) });
    const blob = createZip(files);
    downloadBlob(blob, 'musician-site-update.zip');
    setStatus(`Downloaded ZIP with ${files.length} file${files.length === 1 ? '' : 's'}. Upload the ZIP contents to GitHub.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    state = normalizeConfig(JSON.parse(text));
    selectedFiles = new Map();
    render();
    setStatus('Imported JSON successfully.');
  } catch (error) {
    setStatus('Could not import JSON. Check that the file is valid JSON.', true);
  }
}

// Tiny ZIP writer for GitHub-ready exports. It stores files uncompressed, so no external library is needed.
function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.path);
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const crc = crc32(data);
    const { time, date } = dosDateTime(new Date());
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const local = new DataView(localHeader.buffer);
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const central = new DataView(centralHeader.buffer);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosYear = Math.max(date.getFullYear() - 1980, 0);
  const dosDate = (dosYear << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

load();
