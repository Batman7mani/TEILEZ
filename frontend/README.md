# FORGE — Auto Parts (React + Vite)

A car-parts/customisation storefront concept, styled in the interaction
language of oakâme.com (sticky mega-menu with live preview, corner-bracket
"viewfinder" motif, configurator panel with swatches) but reskinned to a
concrete-grey / ink-black / caliper-orange automotive palette.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## What's inside

- `src/components/Loader.jsx` — the intro animation: AUTO / PARTS split
  text flanking a small framed clip of your footage, which zooms to
  fullscreen before wiping away to reveal the site. Timings are in the
  `PHASES` object at the top of the file if you want to tune pacing.
- `src/components/Nav.jsx` — sticky nav with a mega-menu: hovering a
  category live-updates a big ghosted word + an image preview, mirroring
  oakâme's signature interaction.
- `src/components/Configurator.jsx` — the color/finish/decal swatch
  panel — the part you'll eventually wire up to real per-color product
  photography (swap `cfg-swatch-bg` for an `<img>` once you have shots).
- `src/components/ProductGrid.jsx` — hover-reveal product cards.
- Design tokens live in `src/styles/index.css` (`:root` block) — every
  color in the app is driven from there.

## Swapping in real assets

- Replace `src/assets/loader-bg.mp4` with your own clip (keep it under
  ~2MB and ~6s for a snappy load — re-encode with
  `ffmpeg -i in.mp4 -vf scale=1280:-2 -an -crf 26 -preset slow out.mp4`).
- Swap the Unsplash placeholder URLs in `Nav.jsx` and `ProductGrid.jsx`
  for real product photography once you have it.
- Real per-swatch product photos: in `Configurator.jsx`, replace the
  `cfg-swatch-bg` colored div with an `<img>` whose `src` swaps based on
  `color.name`, the same way oakâme does it.

## Notes

- Animations respect `prefers-reduced-motion`.
- All interactive elements are keyboard-focusable with a visible focus ring.
- No backend / cart logic is wired up — this is the front-of-store shell.
