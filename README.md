# Michael Savransky musician website

Static bilingual musician portfolio for GitHub Pages.

## What is included

- `index.html` — public website
- `admin.html` — local admin helper
- `content/site.config.json` — all editable text and track data
- `media/audio/` — audio files
- `media/images/` — artist/cover images
- `assets/` — site design and JavaScript

## Edit locally without GitHub

Because GitHub Pages is static, it cannot save uploads directly to GitHub. The easiest workflow is local editing:

1. Unzip this folder.
2. Open a terminal inside the folder.
3. Run:

```bash
python -m http.server 8000
```

4. Open:

```text
http://localhost:8000/admin.html
```

5. Click **Choose local site folder** and select the unzipped website folder.
6. Edit Basics, About, Music, Sketches, Videos / Live, and Contact.
7. For audio/images, click **Choose file**. The admin will fill the correct `media/audio/...` or `media/images/...` path.
8. To change item order, drag a Music/Sketches card by the ☰ handle, or use the ↑ / ↓ buttons.
9. Click **Save changes to folder**.
10. Open:

```text
http://localhost:8000/index.html
```

11. When ready, upload/commit the updated folder to GitHub Pages.

Direct local folder saving works best in Chrome/Edge because it uses the browser File System Access API. In other browsers, use **Download site.config.json** and manually replace `content/site.config.json`.

## Adding tracks manually

Music and Sketches are controlled by arrays in `content/site.config.json`:

- `music.tracks`
- `sketches.tracks`

Each item supports:

- `id`
- `title.en` / `title.he`
- `description.en` / `description.he`
- `year`
- `instrument.en` / `instrument.he`
- `credits.en` / `credits.he`
- `audioSrc`
- `coverImage`

## Hebrew font note

The CSS includes the requested Hebrew font-family names first:

```css
wfont_cfe233_4d34b9bc1c36464ba3977773413b606d,
wf_4d34b9bc1c36464ba39777734,
orig_assistant
```

No third-party font files are bundled. If you own or license the exact font file, add it to `assets/fonts/` and define an `@font-face` rule. Otherwise the site falls back to Assistant / Hebrew system fonts.

## Reordering Music and Sketches

Open `admin.html`, go to **Music** or **Sketches**, then drag an item card by the ☰ handle to the desired position. You can also use the ↑ / ↓ buttons. Click **Save changes to folder** so `content/site.config.json` stores the new order. The public site displays items in the same array order.
