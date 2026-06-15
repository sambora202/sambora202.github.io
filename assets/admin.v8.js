const CONFIG_URL = 'content/site.config.json';
const LANGS = ['en', 'he'];
let config = null;
let dirHandle = null;
let pendingFiles = new Map();
let draggedTrack = null;

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function get(path, fallback = '') {
  return path.split('.').reduce((obj, key) => obj?.[key], config) ?? fallback;
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cursor = obj;
  while (parts.length > 1) {
    const key = parts.shift();
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[0]] = value;
}

function normalizeConfig(cfg) {
  cfg.site ||= {};
  cfg.home ||= {};
  cfg.about ||= {};
  cfg.music ||= { intro: { en: '', he: '' }, tracks: [] };
  cfg.sketches ||= { intro: { en: '', he: '' }, tracks: [] };
  cfg.videosLive ||= { intro: { en: '', he: '' }, videos: [], shows: [] };
  cfg.contact ||= { headline: { en: '', he: '' }, text: { en: '', he: '' }, email: '', links: [] };
  cfg.nav ||= {};
  cfg.labels ||= {};
  cfg.music.tracks ||= [];
  cfg.sketches.tracks ||= [];
  cfg.videosLive.videos ||= [];
  cfg.videosLive.shows ||= [];
  cfg.contact.links ||= [];
  return cfg;
}

function biInput(labelText, basePath, opts = {}) {
  const type = opts.textarea ? 'textarea' : 'input';
  const rows = opts.rows || 3;
  const valueEn = get(`${basePath}.en`, '');
  const valueHe = get(`${basePath}.he`, '');
  return `<div class="field-group">
    <h3>${escapeHtml(labelText)}</h3>
    <div class="grid-two">
      <label>English
        ${type === 'textarea'
          ? `<textarea rows="${rows}" data-path="${escapeHtml(basePath)}.en">${escapeHtml(valueEn)}</textarea>`
          : `<input data-path="${escapeHtml(basePath)}.en" value="${escapeHtml(valueEn)}" />`}
      </label>
      <label dir="rtl">עברית
        ${type === 'textarea'
          ? `<textarea rows="${rows}" dir="rtl" data-path="${escapeHtml(basePath)}.he">${escapeHtml(valueHe)}</textarea>`
          : `<input dir="rtl" data-path="${escapeHtml(basePath)}.he" value="${escapeHtml(valueHe)}" />`}
      </label>
    </div>
  </div>`;
}

function singleInput(labelText, path, opts = {}) {
  const value = get(path, '');
  const note = opts.note ? `<small>${escapeHtml(opts.note)}</small>` : '';
  if (opts.textarea) {
    return `<label>${escapeHtml(labelText)}<textarea rows="${opts.rows || 3}" data-path="${escapeHtml(path)}">${escapeHtml(value)}</textarea>${note}</label>`;
  }
  return `<label>${escapeHtml(labelText)}<input data-path="${escapeHtml(path)}" value="${escapeHtml(value)}" />${note}</label>`;
}

function fileInput(labelText, path, kind = 'image') {
  const value = get(path, '');
  const accept = kind === 'audio' ? 'audio/*,video/mp4,video/mpeg,.mp3,.wav,.ogg,.m4a,.mpeg,.mp4' : 'image/*';
  const targetFolder = kind === 'audio' ? 'media/audio' : 'media/images';
  const id = `file-${path.replace(/[^a-z0-9]/gi, '-')}-${Math.random().toString(36).slice(2)}`;
  return `<div class="file-field">
    <div class="field-label">${escapeHtml(labelText)}</div>
    <div class="file-row">
      <input data-path="${escapeHtml(path)}" value="${escapeHtml(value)}" placeholder="${targetFolder}/file-name" />
      <label class="file-choice" for="${id}">Choose file</label>
      <input id="${id}" type="file" data-file-for="${escapeHtml(path)}" data-kind="${kind}" accept="${accept}" />
    </div>
    <small>Choosing a file fills the path automatically. Saving locally copies the selected file into ${targetFolder}/.</small>
  </div>`;
}

function arrayTextarea(labelText, path, opts = {}) {
  const arr = get(path, []);
  const text = Array.isArray(arr) ? arr.join('\n\n') : String(arr || '');
  return `<label>${escapeHtml(labelText)}<textarea rows="${opts.rows || 7}" data-array-path="${escapeHtml(path)}">${escapeHtml(text)}</textarea><small>Separate paragraphs with a blank line.</small></label>`;
}

function renderBasics() {
  $('basicsForm').innerHTML = `
    ${biInput('Artist / band name', 'site.artistName')}
    ${biInput('Tagline', 'site.tagline')}
    ${biInput('Small badge text', 'site.accentText')}
    ${biInput('Location', 'site.location')}
    <div class="grid-two">
      ${singleInput('Booking email', 'site.email')}
      ${fileInput('Hero image', 'site.heroImage', 'image')}
    </div>
  `;
}

function renderHome() {
  $('homeForm').innerHTML = `
    ${biInput('Homepage headline', 'home.headline', { textarea: true, rows: 2 })}
    ${biInput('Homepage text', 'home.text', { textarea: true, rows: 3 })}
    <div class="grid-three">
      ${singleInput('Featured sketch ID', 'home.featuredSketchId', { note: 'Use one of the IDs from Sketches.' })}
      ${singleInput('Primary button route', 'site.ctaPrimary.route')}
      ${singleInput('Secondary button route', 'site.ctaSecondary.route')}
    </div>
    ${biInput('Primary button label', 'site.ctaPrimary.label')}
    ${biInput('Secondary button label', 'site.ctaSecondary.label')}
  `;
}

function renderAbout() {
  $('aboutForm').innerHTML = `
    ${biInput('About page title', 'about.headline')}
    ${fileInput('About image', 'about.image', 'image')}
    <div class="grid-two">
      ${arrayTextarea('Paragraphs — English', 'about.paragraphs.en')}
      <div dir="rtl">${arrayTextarea('פסקאות — עברית', 'about.paragraphs.he')}</div>
    </div>
    ${biInput('Quote', 'about.quote', { textarea: true, rows: 2 })}
  `;
}

function trackDefaults(section) {
  return {
    id: `${section}-${Date.now()}`,
    title: { en: '', he: '' },
    description: { en: '', he: '' },
    year: '',
    instrument: { en: 'Guitar', he: 'גיטרה' },
    credits: { en: '', he: '' },
    audioSrc: '',
    coverImage: config.site?.heroImage || 'media/images/michael-savransky.png'
  };
}

function renderTrackEditor(section, track, index) {
  const path = `${section}.tracks.${index}`;
  const title = track.title?.en || track.title?.he || `Item ${index + 1}`;
  return `<article class="track-editor" draggable="true" data-section="${section}" data-index="${index}" aria-label="Drag to reorder item ${index + 1}">
    <div class="track-head">
      <div class="track-title-row">
        <button type="button" class="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">☰</button>
        <h3>${escapeHtml(section === 'sketches' ? 'Sketch' : 'Music')} item ${index + 1}: ${escapeHtml(title)}</h3>
      </div>
      <div class="track-tools">
        <button type="button" class="secondary compact" data-move-track="${section}" data-index="${index}" data-direction="up" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="secondary compact" data-move-track="${section}" data-index="${index}" data-direction="down" ${index === ((config[section]?.tracks?.length || 1) - 1) ? 'disabled' : ''}>↓</button>
        <button type="button" class="secondary" data-duplicate-track="${section}" data-index="${index}">Duplicate</button>
        <button type="button" class="danger" data-remove-track="${section}" data-index="${index}">Remove</button>
      </div>
    </div>
    <div class="drag-hint">Drag this card to change its order. The public site uses the same order.</div>
    ${singleInput('ID', `${path}.id`, { note: 'Unique ID, for example sketch-hapachad. The homepage featured item can reference this ID.' })}
    ${biInput('Title', `${path}.title`)}
    ${biInput('Description', `${path}.description`, { textarea: true, rows: 3 })}
    <div class="grid-three">
      ${singleInput('Year / date', `${path}.year`)}
      ${singleInput('Instrument — English', `${path}.instrument.en`)}
      <div dir="rtl">${singleInput('כלי — עברית', `${path}.instrument.he`)}</div>
    </div>
    ${biInput('Credits', `${path}.credits`, { textarea: true, rows: 2 })}
    <div class="grid-two">
      ${fileInput('Audio file', `${path}.audioSrc`, 'audio')}
      ${fileInput('Cover image', `${path}.coverImage`, 'image')}
    </div>
  </article>`;
}

function renderTracks(section) {
  const data = config[section] || { intro: { en: '', he: '' }, tracks: [] };
  const form = section === 'music' ? $('musicForm') : $('sketchesForm');
  const items = data.tracks || [];
  form.innerHTML = `
    ${biInput(`${section === 'music' ? 'Music' : 'Sketches'} page intro`, `${section}.intro`, { textarea: true, rows: 4 })}
    <div class="reorder-note">Order matters: drag an item card up/down, or use the ↑ / ↓ buttons. The website will show items in this exact order.</div>
    <div class="sortable-list" data-sortable-section="${section}">
      ${items.map((track, index) => renderTrackEditor(section, track, index)).join('') || `<div class="status warn">No ${section} items yet. Click Add ${section === 'music' ? 'music item' : 'sketch item'}.</div>`}
    </div>
  `;
}

function renderVideosLive() {
  $('videosLiveForm').innerHTML = `${biInput('Videos / Live intro', 'videosLive.intro', { textarea: true, rows: 4 })}`;
}

function renderContact() {
  $('contactForm').innerHTML = `
    ${biInput('Contact headline', 'contact.headline')}
    ${biInput('Contact text', 'contact.text', { textarea: true, rows: 4 })}
    ${singleInput('Contact email', 'contact.email')}
  `;
}

function syncFromDOM() {
  if (!config) return;
  document.querySelectorAll('[data-path]').forEach(el => setPath(config, el.dataset.path, el.value));
  document.querySelectorAll('[data-array-path]').forEach(el => {
    const arr = el.value.split(/\n\s*\n/g).map(s => s.trim()).filter(Boolean);
    setPath(config, el.dataset.arrayPath, arr);
  });
  updateOutput();
}

function updateOutput() {
  $('output').value = JSON.stringify(config, null, 2);
}

function renderAll() {
  renderBasics();
  renderHome();
  renderAbout();
  renderTracks('music');
  renderTracks('sketches');
  renderVideosLive();
  renderContact();
  updateOutput();
}

function slugify(text) {
  return String(text || 'new-item')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'new-item';
}

function mediaPathForFile(file, kind) {
  const folder = kind === 'audio' ? 'media/audio' : 'media/images';
  const clean = slugify(file.name.replace(/\.[^.]+$/, ''));
  const ext = (file.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
  return `${folder}/${clean}${ext}`;
}

async function ensureDirectory(root, parts) {
  let current = root;
  for (const part of parts) current = await current.getDirectoryHandle(part, { create: true });
  return current;
}

async function writeTextFile(root, path, text) {
  const parts = path.split('/');
  const fileName = parts.pop();
  const folder = await ensureDirectory(root, parts);
  const fileHandle = await folder.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function writeBinaryFile(root, path, file) {
  const parts = path.split('/');
  const fileName = parts.pop();
  const folder = await ensureDirectory(root, parts);
  const fileHandle = await folder.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
}

async function chooseFolder() {
  if (!window.showDirectoryPicker) {
    setStatus('Your browser does not support direct local folder saving. Use Chrome/Edge or download site.config.json instead.', 'warn');
    return;
  }
  dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
  setStatus(`Selected local folder: ${dirHandle.name}. You can now save changes directly into this folder.`, 'good');
}

async function saveToFolder() {
  syncFromDOM();
  if (!dirHandle) await chooseFolder();
  if (!dirHandle) return;
  await writeTextFile(dirHandle, 'content/site.config.json', JSON.stringify(config, null, 2));
  for (const [path, file] of pendingFiles.entries()) await writeBinaryFile(dirHandle, path, file);
  setStatus(`Saved content/site.config.json and ${pendingFiles.size} selected media file(s) to the local folder.`, 'good');
}

function downloadConfig() {
  syncFromDOM();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site.config.json';
  a.click();
  URL.revokeObjectURL(url);
  setStatus('Downloaded site.config.json. Replace the file in content/site.config.json.', 'good');
}

async function copyConfig() {
  syncFromDOM();
  try {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setStatus('Copied the full JSON config to the clipboard.', 'good');
  } catch (_) {
    setStatus('Could not copy automatically. Select the JSON text and copy it manually.', 'warn');
  }
}

function addTrack(section) {
  syncFromDOM();
  config[section].tracks.push(trackDefaults(section));
  renderTracks(section);
  updateOutput();
  setStatus(`Added a new ${section === 'music' ? 'music' : 'sketch'} item.`, 'good');
}

function removeTrack(section, index) {
  syncFromDOM();
  config[section].tracks.splice(index, 1);
  renderTracks(section);
  updateOutput();
  setStatus(`Removed item ${index + 1} from ${section}.`, 'good');
}

function duplicateTrack(section, index) {
  syncFromDOM();
  const copy = JSON.parse(JSON.stringify(config[section].tracks[index] || trackDefaults(section)));
  copy.id = `${copy.id || section + '-item'}-copy`;
  config[section].tracks.splice(index + 1, 0, copy);
  renderTracks(section);
  updateOutput();
  setStatus(`Duplicated item ${index + 1} in ${section}.`, 'good');
}

function reorderTrack(section, fromIndex, toIndex) {
  syncFromDOM();
  const items = config[section]?.tracks || [];
  if (!items.length) return;
  const maxIndex = items.length - 1;
  fromIndex = Math.max(0, Math.min(maxIndex, Number(fromIndex)));
  toIndex = Math.max(0, Math.min(maxIndex, Number(toIndex)));
  if (fromIndex === toIndex) return;
  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);
  renderTracks(section);
  updateOutput();
  setStatus(`Moved ${section === 'music' ? 'music item' : 'sketch'} from position ${fromIndex + 1} to ${toIndex + 1}.`, 'good');
}

function clearDragState() {
  document.querySelectorAll('.track-editor').forEach(el => {
    el.classList.remove('is-dragging', 'drag-over-before', 'drag-over-after');
  });
}

function handleFileInput(input) {
  const file = input.files?.[0];
  if (!file) return;
  const path = mediaPathForFile(file, input.dataset.kind);
  pendingFiles.set(path, file);
  const target = Array.from(document.querySelectorAll('[data-path]')).find(el => el.dataset.path === input.dataset.fileFor);
  if (target) target.value = path;
  syncFromDOM();
  setStatus(`Selected ${file.name}. It will be saved as ${path}.`, 'good');
}

async function loadConfig() {
  try {
    const res = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load ${CONFIG_URL}`);
    config = normalizeConfig(await res.json());
    renderAll();
    setStatus('Loaded current site.config.json. Existing Music and Sketches are editable below.', 'good');
  } catch (error) {
    setStatus(`${error.message}. Open admin.html through a local server or GitHub Pages, not directly as a file.`, 'warn');
    config = normalizeConfig({});
    renderAll();
  }
}

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-path], [data-array-path]')) syncFromDOM();
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-file-for]')) handleFileInput(event.target);
});

document.addEventListener('dragstart', (event) => {
  const editor = event.target.closest('.track-editor');
  if (!editor) return;
  const interactive = event.target.closest('input, textarea, select, label, button');
  if (interactive && !event.target.closest('.drag-handle')) {
    event.preventDefault();
    return;
  }
  syncFromDOM();
  draggedTrack = { section: editor.dataset.section, index: Number(editor.dataset.index) };
  editor.classList.add('is-dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', `${draggedTrack.section}:${draggedTrack.index}`);
});

document.addEventListener('dragover', (event) => {
  const editor = event.target.closest('.track-editor');
  if (!editor || !draggedTrack || editor.dataset.section !== draggedTrack.section) return;
  event.preventDefault();
  const rect = editor.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  clearDragState();
  editor.classList.add(after ? 'drag-over-after' : 'drag-over-before');
  document.querySelector(`.track-editor[data-section="${draggedTrack.section}"][data-index="${draggedTrack.index}"]`)?.classList.add('is-dragging');
});

document.addEventListener('drop', (event) => {
  const editor = event.target.closest('.track-editor');
  if (!editor || !draggedTrack || editor.dataset.section !== draggedTrack.section) {
    clearDragState();
    draggedTrack = null;
    return;
  }
  event.preventDefault();
  const section = draggedTrack.section;
  const fromIndex = draggedTrack.index;
  const targetIndex = Number(editor.dataset.index);
  const rect = editor.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  let toIndex = targetIndex + (after ? 1 : 0);
  if (fromIndex < toIndex) toIndex -= 1;
  clearDragState();
  draggedTrack = null;
  reorderTrack(section, fromIndex, toIndex);
});

document.addEventListener('dragend', () => {
  clearDragState();
  draggedTrack = null;
});

document.addEventListener('click', (event) => {
  const add = event.target.closest('[data-add-track]');
  if (add) addTrack(add.dataset.addTrack);

  const remove = event.target.closest('[data-remove-track]');
  if (remove) removeTrack(remove.dataset.removeTrack, Number(remove.dataset.index));

  const duplicate = event.target.closest('[data-duplicate-track]');
  if (duplicate) duplicateTrack(duplicate.dataset.duplicateTrack, Number(duplicate.dataset.index));

  const move = event.target.closest('[data-move-track]');
  if (move) {
    const index = Number(move.dataset.index);
    reorderTrack(move.dataset.moveTrack, index, move.dataset.direction === 'up' ? index - 1 : index + 1);
  }
});

$('pickFolder').addEventListener('click', () => chooseFolder().catch(err => setStatus(err.message, 'warn')));
$('saveToFolder').addEventListener('click', () => saveToFolder().catch(err => setStatus(err.message, 'warn')));
$('downloadConfig').addEventListener('click', downloadConfig);
$('copyConfig').addEventListener('click', copyConfig);

loadConfig();
