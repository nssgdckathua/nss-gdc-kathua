# NSS · Government Degree College Kathua — Website

Official link-in-bio style portal for the NSS unit at Government Degree
College Kathua (affiliated to University of Jammu).

## What this is

A **plain static website** — one HTML file with embedded CSS and
JavaScript, plus two local image assets. There is **no framework, no
build tool, and no package.json** — none is needed, because there is
nothing to compile or bundle.

## Files in this package

```
index.html      — the entire site (structure + styles + scripts, inline)
gdc-logo.png     — Government Degree College Kathua crest (local asset)
nss-logo.png     — National Service Scheme emblem (local asset)
netlify.toml     — optional deploy config (added for convenience, see below)
README.md        — this file
```

`index.html` references `gdc-logo.png` and `nss-logo.png` with
**relative paths**. All three files must stay together in the same
folder for the logos (and the 3D rotating seal) to load correctly.

## 1. Framework / build tool

None. Vanilla HTML/CSS/JS. No React, no Vite, no npm, no build step.

## 2. Run it locally

No build required. Either:

- Double-click `index.html` and open it directly in a browser, **or**
- Serve it with a tiny local server (recommended, avoids some
  browser file:// restrictions):
  ```bash
  npx serve .
  # or
  python3 -m http.server
  ```
  then open the printed local URL (e.g. http://localhost:3000).

## 3. Build command

None — there is nothing to build. The files deploy exactly as they are.

## 4. Publish / output directory

The project root itself (the folder containing `index.html`). There is
no separate `dist/` or `build/` output folder.

## 5. Deploying to Netlify

**Manual drag-and-drop (what's been used so far):**
1. Go to your site's **Deploys** tab on app.netlify.com
2. Drag all three files (`index.html`, `gdc-logo.png`, `nss-logo.png`)
   together, or a zip containing them, into the deploy drop zone
3. Netlify serves them as-is — no build step runs

**Git-based deploy (if you connect this to a GitHub repo later):**
The included `netlify.toml` already sets `publish = "."` and no build
command, so Netlify will deploy the repo root directly with zero
extra configuration.

> Note: this account has recently hit Netlify's **credit-based
> plan** limits ("Account credit usage exceeded — new deploys are
> blocked until credits are added"). That's an account/billing
> condition on Netlify's side, not something in this codebase. See
> Netlify's Usage & Billing page for the team, or consider a
> credit-free static host (e.g. GitHub Pages, Cloudflare Pages) if
> this keeps recurring.

## External dependencies

- **Google Fonts** (fonts.googleapis.com) — loaded via `<link>` tag,
  CDN only, no key required.
- **Three.js r128** (cdnjs.cloudflare.com) — loaded via `<script>`
  tag, CDN only, no key required. Powers the rotating 3D seal in the
  hero section; the site has an automatic fallback to a static
  side-by-side logo image if WebGL/JS isn't available.

No backend, no database, no API keys, no environment variables, and
**no runtime dependency on Claude/Anthropic** — the site is fully
self-contained and static.

## Content currently on the site

Quick Links section — live links: MY Bharat registration, Instagram,
Facebook, WhatsApp community, NSS office location (Maps), college
website. Marked "Coming Soon" (empty by design, not broken): the
official Join NSS Google Form, Latest Notices, Photo Gallery,
Volunteer Achievements, Upcoming Events, Contact Programme Officers.
Update these directly by editing the relevant `<a href="...">` (or
`<div class="action-card">` → `<a>`) blocks inside `index.html`.


## Professional 3D build
This version keeps the original NSS GDC Kathua identity while adding a richer WebGL seal, layered depth, 3D card interactions, subtle particle lighting, scroll reveal, stronger responsive layout, and production metadata.

Before publishing, verify that all external official links and social handles are still current.
