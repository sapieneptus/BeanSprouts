# BeanSprouts

The main company repository: the public website, and (next) the shared Claude
skills and project scaffolding that every other BeanSprouts repo copies from.

```
site/              Company website — Astro, static output
  worker/          the Worker: serves those files, plus /api/contact
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

### Deploying

Full runbook: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — domain, Worker,
token, email, and a verification checklist, in order.

The short version: one Cloudflare Worker serves the whole site. Static files are
matched first; `/api/contact` has no matching file, so it falls through to
`site/worker/`. Build settings are root directory `site`, build `npm run build`,
deploy `npx wrangler deploy`. No build-time environment variables — the endpoint
is a same-origin path.

```sh
cd site
npm run deploy    # build + deploy by hand
npm run preview   # build + wrangler dev, the real thing locally
```

Security headers live in [`site/public/_headers`](site/public/_headers), which
Workers static assets applies to every response.

## Contact form

Submissions become issues in a **private** inbox repository, which keeps every
enquiry in one triageable queue rather than an inbox — and means Claude Code can
work the queue directly. Setup, threat model, and rate limits are documented in
[`site/worker/README.md`](site/worker/README.md).

The GitHub token lives only in the Worker. Sender details never appear in a
public repo, and message bodies are wrapped so nothing a stranger types can
render as markdown in an issue.

## Before this goes live

- [ ] Fill in the real CVR number and legal entity name in `site/src/data/company.ts`
- [ ] Set up Cloudflare Email Routing for `hello@bean-sprouts.com` — the site publishes it, so it must receive before launch
- [ ] Write real copy for Sparr, Little Beans and BeanTray (they're `TODO` placeholders — deliberately not invented)
- [ ] Rewrite the About section in your own voice
- [ ] Add a photo at `site/public/portrait.jpg` and set `about.portrait` — a real face does more for trust than anything else on the page
- [ ] Read the AI section closely; it commits you to a line in public, so it should be exactly your position
- [ ] Create the private contact-inbox repo, then deploy the Worker
- [ ] Attach the custom domain to the Worker

## What's next

The second half of this repo — reusable Claude skills and the harness structure
(threads, `NEXT` / `RESEARCH` / `UX` / `SECURITY` conventions, quality gates,
and opinionated scaffolding for release pipelines, data stores, and reviews) —
is not built yet. It'll live alongside `site/` once the website is settled.
