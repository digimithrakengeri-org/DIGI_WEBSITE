# DigiMithra — 3D Automation Website

Marketing site for **DigiMithra**, a digital marketing company ("We Build Your Brand").

- **3D hero** (Three.js): extruded DM growth-arrow logo at the center of an automation hub — service satellites (Web, SEO, Meta, Social, Ads, 1-Click) orbit and stream data packets into it, over a ring of animated growth bars.
- **Services**: Website Development, SEO, Meta Business, One-Click Optimize, Social Media Management, Branding & Ads — with 3D tilt cards.
- **Automation pipeline**: 3D CSS cubes + a live "engine" console showing a lead moving Attract → Convert → Automate → Engage → Grow.
- **One-Click Optimize demo**: simulated audit with an animated growth-score gauge.
- **Contact form** that opens WhatsApp with the enquiry pre-filled.

## Run locally

It's a static site with no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly also works in most browsers; a local server is needed for the ES-module import of Three.js in some.)

## Configure

- **WhatsApp number**: `WHATSAPP_NUMBER` at the top of `js/ui.js` (currently `919742142166`). The number and email also appear in `index.html` (contact section, footer, floating WhatsApp button).
- **Stats / copy**: edit `index.html` — the numbers in the stats band are placeholders.

## Deploy

Live at **https://digimithra.vercel.app**, hosted on Vercel (project `digimithra`), which builds from this
GitHub repo's `main` branch. There's no build step: Vercel serves the files as they are.

The folder also works on any other static host (Netlify, GitHub Pages, cPanel hosting).

## Structure

```
index.html        page markup
css/style.css     theme + layout (black / lime-green brand palette)
js/scene.js       Three.js 3D hero scene
js/ui.js          nav, reveal animations, tilt, pipeline console, optimize demo, contact form
assets/           original brand image, logo cut-outs (mark, wordmark, full) and icons
assets/brands/    platform logos (Google, Meta, Instagram, …) from Simple Icons, CC0; trademarks belong to their owners
```
