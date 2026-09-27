# Research portfolio: Shivansh Pratap Singh

Static site for GitHub Pages. Plain HTML, CSS and a little JavaScript; no framework, no build step.

## Files

```
index.html                  page content (search it for REPLACE, EDIT, VERIFY)
styles.css                  design tokens, layout, light and dark themes, print styles
script.js                   video loading and autoplay, YouTube click-to-load, BibTeX copy, nav highlight
assets/
  cv/Shivansh_Pratap_Singh_CV.pdf   copy of the CV you uploaded (August 2026)
  fonts/archivo-var-latin.woff2     Archivo, weights 400-700, widths 100-125% (47 KB, OFL)
  images/og-card.png                1200x630 link-preview image
  favicon.svg, apple-touch-icon.png
  videos/, images/                  add your clips and posters here
tools/convert-media.sh      GIF or video -> MP4 (+ optional WebM) + poster
robots.txt, sitemap.xml, .nojekyll
```

## Publish

1. Copy everything in this folder, including the hidden `.nojekyll` file, into the root of your `AerialMechX.github.io` repository, replacing the old `index.html`.
2. Add your media (see below), then commit and push. The site is served at https://aerialmechx.github.io/.
3. Preview locally first: run `python3 -m http.server 8000` in this folder and open http://localhost:8000.

## Before you publish

**Add three demo clips.** These are the only files the page expects that aren't included:

| Project | Video | Poster |
|---|---|---|
| ETH world models | `assets/videos/eth-world-model.mp4` | `assets/images/eth-world-model-poster.webp` |
| RL + inner-loop estimator | `assets/videos/rl-inner-loop.mp4` | `assets/images/rl-inner-loop-poster.webp` |
| AERMANI-Diffusion | `assets/videos/aermani-diffusion.mp4` | `assets/images/aermani-diffusion-poster.webp` |

Until a file exists, its frame shows a neutral grid and "video coming soon". AeroGrab uses your existing YouTube video and needs nothing.

**Search `index.html` for three markers:**

- `EDIT`: wording only you can confirm. Your exact contribution on each project, the video captions, your PhD start term and directions, and your ETH supervisors.
- `VERIFY`: claims merged from your CV and your old site. The AeroGrab video ID and result, the PPO + 250 Hz INDI description, the AERMANI result, and whether 0.7 ms was measured on the Jetson.
- `REPLACE`: optional links (project pages, code, extra videos), left as comments.

**Fix one link in your CV.** The ball-catcher link in the PDF points to `.../AerialMechX-Autonomous_ball_catcherr`, which returns 404. The correct URL is https://github.com/AerialMechX/AerialMechX-Autonomous_ball_catcher. After fixing it, replace `assets/cv/Shivansh_Pratap_Singh_CV.pdf` and update the "PDF, updated ..." date in the Contact section.

**Already filled in** from your CV's embedded links, and checked: Google Scholar, arXiv pages for all four 2026 papers, the ICCAS DOI, GitHub, LinkedIn, both email addresses, and both code repositories. Your phone number is deliberately left off.

## Media

### Format

GIF is a poor format for demos. It stores every frame with a 256-color palette and weak compression, so a 10-second clip is often 10-30 MB. The same clip as an H.264 MP4 is typically 1-3 MB and looks better.

- **MP4 (H.264, yuv420p, fast start, no audio):** plays in every browser. Use it for every clip.
- **WebM (VP9):** optional second source, often 20-40% smaller. Each video has a commented `<source>` line for it.
- **Targets:** 16:9 at 1280x720, 5-15 s loops, under about 4 MB each (under 2 MB is ideal). Posters: WebP at 1280x720, under about 80 KB.

### Convert with the included script

```bash
tools/convert-media.sh ~/Downloads/eth_flight.gif eth-world-model
tools/convert-media.sh raw/run.mov rl-inner-loop --start 12 --duration 10 --webm
```

It writes the MP4 (and WebM), extracts a poster under the file names the page expects, prints the sizes, and tells you which `width`, `height` and `--ar` to set if the clip isn't 16:9. The core command, if you'd rather run it yourself:

```bash
ffmpeg -i demo.gif -vf "fps=30,scale='trunc(min(1280,iw)/2)*2':-2,format=yuv420p" \
  -c:v libx264 -crf 24 -preset slow -movflags +faststart -an assets/videos/demo.mp4
```

### Where to host

| Option | Use it? | Why |
|---|---|---|
| In the repo (`assets/videos/`) | **Yes, for short loops** | Same origin, served by GitHub's CDN, works with the page's lazy loading and autoplay. |
| GitHub Releases | No, for on-page playback | Release files are served as downloads through a redirect, not as web media, so inline playback is unreliable, especially in Safari. Fine for large downloadable originals. |
| YouTube | **Yes, for long or narrated videos** | Embedded behind a click-to-load thumbnail, so YouTube's player (about 1 MB of scripts) loads only if someone presses play. |
| Git LFS | No | With the default branch-based Pages deployment, LFS files are published as small pointer files, not as the video. |
| Google Drive or Dropbox links | No | Not built for embedding; slow, rate-limited, and they break. |

GitHub blocks files over 100 MB (with a warning at 50 MB), and a Pages site should stay under 1 GB with a soft bandwidth limit of 100 GB per month. A few 2-4 MB clips are far below all of these.

### How the page loads video

- Nothing large downloads up front. Videos use `preload="none"`, and posters load only shortly before they scroll into view.
- On laptops and desktops, muted loops play while visible and pause when scrolled away. Each has a pause button.
- On phones (up to 704 px wide), with Save-Data or a 2G connection, or with reduced motion turned on, a play button appears instead, so nothing large downloads unless the visitor taps it. To autoplay on phones too, set `AUTOPLAY_ON_SMALL_SCREENS = true` at the top of `script.js`.
- If a video file is missing, the frame says so instead of showing a broken player.

### Use a figure instead of a video

A key paper figure works well, for example for AERMANI-Diffusion. Replace that project's `<div class="media__frame" data-video>...</div>` with:

```html
<div class="media__frame media__frame--figure" style="--ar: 16 / 9">
  <img src="assets/images/aermani-figure.webp" width="1600" height="900" loading="lazy" decoding="async"
       alt="Describe what the figure shows, e.g. predicted vs. measured residual force during a payload pick-up">
</div>
```

Set `--ar` to the image's width / height. `media__frame--figure` fits the whole figure instead of cropping it.

### Use a short local clip for AeroGrab

Copy the video block from another project into the AeroGrab `<figure>`, point it at `assets/videos/aerograb.mp4`, and keep the YouTube link in the links row for the full video.

## Editing

- **Publication:** copy an `<li class="pub">...</li>` block. Keep the `<span class="pub__role">` badge for first- or co-first-author papers.
- **Project:** copy an `<article class="project">` block and give it a unique `id` with a matching `aria-labelledby`.
- **Colors and type:** all design tokens are at the top of `styles.css`. The dark theme overrides them in the `prefers-color-scheme: dark` block.
- **Headshot (optional):** uncomment the `<img class="hero__photo">` in the intro and add `assets/images/profile.jpg`.
- **Footer:** change "Last updated" whenever you update the site.

## After publishing

- Check the link preview with LinkedIn's Post Inspector: https://www.linkedin.com/post-inspector/
- Run Lighthouse in Chrome DevTools. The first view is about 70 KB compressed (HTML 13 KB, CSS 7 KB, JavaScript 3 KB, font 47 KB). The only third-party request is the lazy-loaded YouTube thumbnail.
- Tab through the page once: every link, button and diagram block should show a visible focus ring.

## Credits

Archivo by Omnibus-Type, SIL Open Font License 1.1 (`assets/fonts/OFL-Archivo.txt`), subset to Latin and limited to the weights and widths this site uses.
