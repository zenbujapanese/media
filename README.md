# Zenbu Japanese — Motion Asset Pack

Brand animations for video: intros, bumpers, stings, transitions, outros, lower thirds, CTAs, loops, stills, watermarks, and placeholder sound effects. Every animated asset ships in **9:16 (1080×1920)** and **16:9 (1920×1080)** at **30 fps**.

Open `preview.html` in a browser to scrub through everything.

## Brand

| Token | Value | Use |
| --- | --- | --- |
| Red | `#C60121` | Primary. Backgrounds, tags, pills, the mark |
| Ink | `#1C1B1B` | Dark backgrounds (the mark's shadow is `#242323`) |
| Paper | `#FCF9FA` | Light backgrounds |
| Wordmark | Geist 700, letter-spacing −3% | "Zenbu Japanese" |
| Supporting text | Geist 500 | URLs, taglines, CTAs |
| Mark | 全 sticker | Never recolour the full-colour mark. Use the white or ink silhouette when it must be one colour |

## Formats

| Suffix | Codec | Alpha | Use it in |
| --- | --- | --- | --- |
| `.mp4` | H.264, BT.709 | No | Anything. Drop-in opaque clips |
| `.mov` | ProRes 4444 | Yes | Final Cut, Premiere, DaVinci, After Effects. Highest quality overlay |
| `-hevc-alpha.mov` | HEVC with alpha | Yes | CapCut, iMovie, Final Cut, iPhone/Mac apps. Small files |
| `.webm` | VP9 with alpha | Yes | OBS, web, browsers, Descript |

If an overlay shows a black background in your editor, switch to one of the other alpha formats.

## Folders

**01-intro** — 3 s. The mark stamps in, the wordmark and tagline rise under it.
- `intro-*` holds on the last frame. Cut straight into content.
- `bumper-*` ends with a zoom-fade to black. Use mid-video or before a cold open.
- `intro-*-alpha` has no background. Lay it over your own footage.
- Pair the stamp hit (frame 0.1–0.5 s) with `11-sfx/stamp-thud-shimmer.wav`.

**02-sting** — 1.5–1.8 s logo pop. `sting-*-alpha` holds; `sting-*-alpha-exit` pops back out; `sting-*-red/ink` are opaque with a fade to the background colour. Good for chapter breaks and as a "button" at the end of a Short.

**03-transitions** — 1 s, alpha. Put the clip across a cut so the cut lands at **0.5 s**.
- `transition-stamp-*`: a red disc bursts out from the mark to cover the frame, then collapses.
- `transition-wipe-*`: a red panel wipes through the frame carrying the mark (vertical in 9:16, horizontal in 16:9).

**04-outro** — 10 s end card. 16:9 keeps the right 56% of the frame empty for YouTube end-screen elements (see `08-stills/endscreen-guide-16x9.png`). 9:16 keeps the bottom 25% clear of platform UI and shows a "Follow for more" pill. `outro-*-ink-fadeout` fades to black at the end.

**05-lower-third** — 6 s, alpha. Red tag with the mark, name on line one, URL on line two. In at 0–0.7 s, out at 5.5–6 s. Trim in the middle to shorten.

**06-cta** — 4 s, alpha. Red pill with the mark: `cta-follow` ("Follow for more") and `cta-link-in-bio` ("Link in bio"). 9:16 sits at 72% height, above Shorts/TikTok UI.

**07-background-loops** — 10 s seamless loops, opaque. A slow drift of the mark over ink, paper, or red. Loop them under talking heads, text screens, or as a Shorts backdrop.

**08-stills** — PNG.
- `title-card-*`: empty centre, small lockup at the edge. Type your title on top.
- `thumbnail-base-*`: 1920×1080 base for YouTube thumbnails, mark on the right, empty on the left.
- `endscreen-guide-16x9`: transparent overlay showing where YouTube end-screen elements fit over the outro.

**09-logo-lockups** — transparent PNGs, horizontal and stacked, ink or white text.

**10-watermarks** — the mark at 256/512/1024 in full colour, white, and ink, plus SVGs, plus pre-placed full-frame corner bugs (`corner-bug-*`, top right, 45% opacity for white). Drop a corner bug on your top video track for the whole video.

**11-sfx** — synthesized placeholders, 48 kHz 24-bit WAV: `stamp-thud`, `stamp-thud-shimmer`, `whoosh`, `pop`, `shimmer`. They are usable but generic. Swap in a licensed stamp or whoosh when you find one you like.

## Changing text or re-rendering

`source/` contains everything. Scenes are one HTML file driven by URL parameters; `render.mjs` screenshots each frame with Playwright and encodes with ffmpeg.

Preview a scene in Chrome (animations are paused at frame 0; run `__seek(1200)` in the console to scrub):

```
open "source/scenes.html?scene=lower-third&ar=16x9&bg=none&l1=Devin&l2=@zenbujapanese"
```

Re-render only the lower thirds with new text, at 60 fps:

```bash
node "source/render.mjs" --only=lower-third --fps=60 --out="$HOME/Desktop/Zenbu Motion Pack"
```

Parameters accepted by every scene: `l1` (name), `l2` (second line), `cta`, `tagline`, `url`, `store`, `dur` (ms), `exit=1`, `bg` (`red`, `ink`, `paper`, `none`). Edit the job list at the top of `render.mjs` to add variants. The renderer needs ffmpeg, ImageMagick, and the repo's Playwright install (set `PW_PKG` to another Playwright package path if you move the pack).
