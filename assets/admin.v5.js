function slugify(text) {
  return String(text || 'new-track').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'new-track';
}
function value(id) { return document.getElementById(id)?.value.trim() || ''; }
function setValue(id, val) { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; }
function makeEntry() {
  const titleEn = value('titleEn');
  const titleHe = value('titleHe');
  const base = slugify(titleEn || titleHe);
  const entry = {
    id: `${value('section') || 'sketches'}-${base}`,
    title: { en: titleEn, he: titleHe },
    description: { en: value('descEn'), he: value('descHe') },
    year: value('year'),
    instrument: { en: value('instEn'), he: value('instHe') },
    credits: { en: value('creditsEn'), he: value('creditsHe') },
    audioSrc: `media/audio/${value('audioFile') || base + '.mp3'}`,
    coverImage: value('coverImage') || 'media/images/michael-savransky.png'
  };
  document.getElementById('output').value = JSON.stringify(entry, null, 2);
}
async function tryLoadConfig() {
  try {
    const res = await fetch('content/site.config.json', { cache: 'no-store' });
    if (!res.ok) return;
    const cfg = await res.json();
    setValue('artistNameEn', cfg.site?.artistName?.en);
    setValue('artistNameHe', cfg.site?.artistName?.he);
    setValue('taglineEn', cfg.site?.tagline?.en);
    setValue('taglineHe', cfg.site?.tagline?.he);
    setValue('bookingEmail', cfg.site?.email || cfg.contact?.email);
    setValue('heroImage', cfg.site?.heroImage);
    setValue('aboutEn', Array.isArray(cfg.about?.paragraphs?.en) ? cfg.about.paragraphs.en[0] : '');
    setValue('aboutHe', Array.isArray(cfg.about?.paragraphs?.he) ? cfg.about.paragraphs.he[0] : '');
  } catch (_) {}
}
document.getElementById('makeEntry')?.addEventListener('click', makeEntry);
document.getElementById('downloadJson')?.addEventListener('click', () => {
  const blob = new Blob([document.getElementById('output').value || '{}'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'track-entry.json';
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('copyJson')?.addEventListener('click', async () => {
  const text = document.getElementById('output').value || '{}';
  try { await navigator.clipboard.writeText(text); } catch (_) {}
});
tryLoadConfig();
