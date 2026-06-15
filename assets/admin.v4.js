function slugify(text) {
  return String(text || 'new-track').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'new-track';
}
function value(id) { return document.getElementById(id).value.trim(); }
function makeEntry() {
  const titleEn = value('titleEn');
  const titleHe = value('titleHe');
  const entry = {
    id: `${value('section')}-${slugify(titleEn || titleHe)}`,
    title: { en: titleEn, he: titleHe },
    description: { en: value('descEn'), he: value('descHe') },
    year: value('year'),
    instrument: { en: value('instEn'), he: value('instHe') },
    credits: { en: value('creditsEn'), he: value('creditsHe') },
    audioSrc: `media/audio/${value('audioFile') || slugify(titleEn || titleHe) + '.mp3'}`,
    coverImage: 'media/images/michael-savransky.png'
  };
  document.getElementById('output').value = JSON.stringify(entry, null, 2);
}
document.getElementById('makeEntry').addEventListener('click', makeEntry);
document.getElementById('downloadJson').addEventListener('click', () => {
  const blob = new Blob([document.getElementById('output').value || '{}'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'track-entry.json';
  a.click();
  URL.revokeObjectURL(url);
});
