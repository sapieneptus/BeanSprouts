# BeanSprouts

The main company repository: the public website, and (next) the shared Claude
skills and project scaffolding that every other BeanSprouts repo copies from.

```
site/              Company website — Astro, static output
workers/contact/   Cloudflare Worker: contact form → GitHub issues
```

## Website

Single-page site covering the mission, principles, projects, an AI-usage
statement, about, and a contact form. All copy lives in one file —
[`site/src/data/company.ts`](site/src/data/company.ts) — so changing what the
site says never means editing markup.

### Artwork

The ridgeline, contour lines and portrait placeholder are hand-authored SVG
rather than photography or generated imagery. They recolour with the theme, add
no network requests, stay sharp at any size, and — given the position stated in
the site's own AI section — aren't generated art standing in for commissioned
art. Swapping in commissioned illustration or your own photography is a drop-in
replacement: see `Ridgeline.astro`, `Contours.astro`, and `about.portrait`.

```sh
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # → site/dist
npm run check    # typecheck
```

### Deploying to Cloudflare Pages

| Setting | Value |
|---|---|
| Root directory | `site` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `PUBLIC_CONTACT_ENDPOINT` = your Worker URL |

If `PUBLIC_CONTACT_ENDPOINT` is unset the site still builds and deploys — the
contact section degrades to a plain email link instead of rendering a form that
can't submit.

Security headers are set in [`site/public/_headers`](site/public/_headers), which
Cloudflare Pages applies automatically.

## Contact form

Submissions become issues in a **private** inbox repository, which keeps every
enquiry in one triageable queue rather than an inbox — and means Claude Code can
work the queue directly. Setup, threat model, and rate limits are documented in
[`workers/contact/README.md`](workers/contact/README.md).

The GitHub token lives only in the Worker. Sender details never appear in a
public repo, and message bodies are wrapped so nothing a stranger types can
render as markdown in an issue.

## Before this goes live

- [ ] Fill in the real CVR number and legal entity name in `site/src/data/company.ts`
- [ ] Write real copy for Sparr, Little Beans and BeanTray (they're `TODO` placeholders — deliberately not invented)
- [ ] Rewrite the About section in your own voice
- [ ] Add a photo at `site/public/portrait.jpg` and set `about.portrait` — a real face does more for trust than anything else on the page
- [ ] Read the AI section closely; it commits you to a line in public, so it should be exactly your position
- [ ] Create the private contact-inbox repo and deploy the Worker
- [ ] Point the domain at Cloudflare Pages and update `site` in `astro.config.mjs`

## What's next

The second half of this repo — reusable Claude skills and the harness structure
(threads, `NEXT` / `RESEARCH` / `UX` / `SECURITY` conventions, quality gates,
and opinionated scaffolding for release pipelines, data stores, and reviews) —
is not built yet. It'll live alongside `site/` once the website is settled.
