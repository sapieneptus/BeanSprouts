# Deploying the website

End-to-end runbook, in order. Roughly 45 minutes the first time, most of it
waiting on DNS.

The finished setup:

```
bean-sprouts.com            → Cloudflare Pages (static site from site/)
bean-sprouts.com/api/contact → Cloudflare Worker (contact form)
                           → GitHub issue in a private inbox repo
```

## What you need first

- A Cloudflare account (free tier is enough).
- Your domain, with its nameservers pointed at Cloudflare. If it isn't there
  yet, add the site in the Cloudflare dashboard and change the nameservers at
  your registrar. Propagation is usually under an hour but can take a day —
  start this before anything else.
- Node 18+ locally.

---

## 1. Fill in the real details

Nothing here is guessable, so it has to be you.

Edit [`site/src/data/company.ts`](../site/src/data/company.ts):

- `company.legalName` — registered entity name
- `company.cvr` — your real CVR number (currently `00000000`)
- `company.founder.name` — full name as you want it shown
- The `TODO` blocks on Sparr, Little Beans and BeanTray
- `about.body` — rewrite in your own voice
- The **On AI** section — read it closely, it commits you in public

Then edit [`site/astro.config.mjs`](../site/astro.config.mjs) and set `site` to
your real domain. It's used for canonical URLs and the sitemap, so a wrong value
ships wrong metadata.

Check it locally:

```sh
cd site
npm install
npm run dev      # http://localhost:4321
```

## 2. Create the private inbox repo

Contact submissions become GitHub issues. Issue bodies contain the sender's
name and email, so this repo **must be private** — a public one publishes
their personal data and hands spam harvesters a feed.

On GitHub: **New repository** → name it `contact-inbox` → **Private** → create.
Nothing else goes in it.

## 3. Create a GitHub token for the Worker

**Settings → Developer settings → Personal access tokens → Fine-grained tokens
→ Generate new token**

- Resource owner: your account
- Repository access: **Only select repositories** → `contact-inbox`
- Permissions: **Issues → Read and write**. Nothing else.
- Expiry: pick a date and put the rotation in your calendar now.

Copy the token. You'll paste it once in the next step and never see it again.

## 4. Deploy the Worker

```sh
cd workers/contact
npm install
npx wrangler login
```

> Working in a Codespace or dev container? `wrangler login` needs a browser
> callback that won't reach you. See
> [Doing this from a Codespace](#doing-this-from-a-codespace-or-dev-container)
> for the API-token route instead.

Edit [`wrangler.toml`](../workers/contact/wrangler.toml):

- `ALLOWED_ORIGIN` — your real site origin, no trailing slash
- `GITHUB_OWNER` — your GitHub username
- `GITHUB_REPO` — `contact-inbox`

Add the token as a secret (never a `[vars]` entry — those are committed):

```sh
npx wrangler secret put GITHUB_TOKEN
```

Add rate limiting. Skipping this means one bot can fill your inbox repo:

```sh
npx wrangler kv namespace create RATE_LIMIT
```

Paste the printed id into the commented `[[kv_namespaces]]` block in
`wrangler.toml` and uncomment it. Then:

```sh
npx wrangler deploy
```

## 5. Put the Worker on your own domain

You can stop at the `*.workers.dev` URL, but binding it to your domain is
better: the form becomes same-origin, and your page source doesn't advertise a
third-party endpoint.

Uncomment the `[[routes]]` block in `wrangler.toml`, set the pattern to
`bean-sprouts.com/api/contact` and `zone_name` to your domain, then
`npx wrangler deploy` again.

Worker routes take precedence over Pages for matching paths on the same zone,
so `/api/contact` hits the Worker and everything else hits the site.

> Same-origin `POST` still sends an `Origin` header — browsers include it for
> any method other than GET and HEAD — so the Worker's origin check keeps
> working after the move.

## 6. Create the Pages project

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
pick this repository, then:

> **Make sure you're in the Pages flow, not Workers.** The Create screen defaults
> to Workers and the Pages entry is behind small secondary links. You're in the
> wrong one if the build settings show a **Deploy command** (`npx wrangler
> versions upload`) and no **Build output directory** — a Workers project ignores
> the settings below, runs the build at the repo root, and fails with
> `ENOENT ... /opt/buildhome/repo/package.json`.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `site` |

Under **Environment variables (Production)** add:

```
PUBLIC_CONTACT_ENDPOINT = https://bean-sprouts.com/api/contact
```

This is read at **build** time, not run time, so changing it later needs a
rebuild, not just a redeploy. If it's unset the site still builds — the contact
section falls back to a plain email link instead of a form that can't submit.

Deploy. You'll get a `*.pages.dev` URL to check before the domain is live.

> The work so far is on the `claude/company-website-repo-qijvdg` branch. Merge
> it to `main` before the first production build, or set the production branch
> to match.

## 7. Point the domain at it (DNS)

**The nameservers must be on Cloudflare before this works.** If your domain's
DNS is still served elsewhere — Route 53, your registrar's default, anywhere —
stop and move it first. This isn't a preference; see the apex note below.

In the Pages project: **Custom domains → Set up a custom domain** →
`bean-sprouts.com`. Repeat for `www.bean-sprouts.com`. Cloudflare writes the DNS
records itself when the zone is on your account. Wait for the certificate,
usually a few minutes.

> **Cloudflare warns you about missing records before you get here.** "Visitors
> cannot reach bean-sprouts.com" appears the moment the zone exists and is
> empty. Expected. Attaching the custom domains clears it — adding records by
> hand to silence it is the wrong fix.

### Why the apex needs Cloudflare's DNS

Pages has no fixed IP, so there's nothing to put in an `A` record. The target is
a hostname (`<project>.pages.dev`), which means a `CNAME` — and **a CNAME is
illegal at a zone apex**. The apex must carry `SOA` and `NS` records, and a
CNAME cannot coexist with any other record on the same name. Every compliant DNS
server refuses it.

Route 53 will reject it explicitly:

```
RRSet of type CNAME with DNS name bean-sprouts.com. is not permitted at apex
```

Cloudflare gets around this with **CNAME flattening**: it resolves the target
and answers with `A`/`AAAA` records at the apex, so nothing illegal is ever
published. Route 53's nearest equivalent, an **Alias** record, only targets AWS
resources — CloudFront, ELB, S3 website endpoints, API Gateway — and cannot
point at `pages.dev`. So there is no way to serve the apex from Route 53.

Moving nameservers: Route 53 → **Registered domains** → your domain → edit
nameservers, replace the four AWS ones with the two Cloudflare gave you.
Cloudflare's zone-add scans and imports existing records, but check they all
came across before cutting over. Afterwards, delete the unused Route 53 hosted
zone — it bills $0.50/month regardless of traffic.

`www` is not the apex, so a CNAME there is legal anywhere. That's a usable
stopgap while nameservers propagate.

## 7b. Email records: SPF, DKIM, DMARC

Cloudflare warns that "email cannot reach @bean-sprouts.com addresses and they
could be spoofed," and offers a prefilled restrictive set. Its description —
"advise receiving mail servers to drop all incoming email sent from your
domain" — is badly worded and reads far more alarming than it is.

**Two independent things:**

| Concern | Governed by | Direction |
|---|---|---|
| Can people send mail **to** you at the domain? | `MX` records | Inbound |
| Can someone send mail **claiming to be** the domain? | SPF, DKIM, DMARC | Outbound |

The preset only touches the second. It says "no server is authorised to send as
this domain, reject anything claiming to be." It cannot stop anyone emailing
you — that's MX, which the preset doesn't set.

| Record | Meaning |
|---|---|
| `TXT @` → `v=spf1 -all` | No server may send as this domain |
| `TXT *._domainkey` → `v=DKIM1; p=` | Empty key = revoked. The wildcard covers every selector |
| `TXT _dmarc` → `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;` | Reject failures outright, strictly, subdomains included |

While the site publishes an address on another domain and sends no mail from
this one, the preset is exactly right. Leave the reporting address blank unless
you want the XML aggregate reports; you can add `rua=` later.

**MX:** not needed while no address at this domain is published. To be explicit
rather than merely silent, add a "null MX" (RFC 7505) — priority `0`, content
`.` — which formally declares the domain accepts no mail.

### If you want hello@bean-sprouts.com

**Email → Email Routing** forwards it to your real inbox, free, and adds the MX
records for you. Don't add the null MX if you go this way, and expect Cloudflare
to prompt you about the SPF record it conflicts with.

Routing only lets you **receive**. Sending as that address means replacing
`-all` with an include list naming your provider, plus real DKIM keys from them.

**Publish the address on the site only once routing is verified** — a published
address that bounces is worse than no address.

## 8. Verify before you tell anyone

- [ ] Site loads on the real domain over HTTPS
- [ ] Dark mode: toggle it, reload, the choice sticks
- [ ] Every nav link scrolls to the right section, nothing hidden behind the header
- [ ] Send yourself a real message through the contact form
- [ ] An issue appears in `contact-inbox` with the right name, email and body
- [ ] Submit again 6 times — the 6th should be refused (rate limit is 5/hour/IP)
- [ ] `curl -sI https://bean-sprouts.com | grep -i strict-transport` returns the header
- [ ] View source: no GitHub token anywhere (it's in the Worker, but check)
- [ ] Phone check — the layout is single-column and nothing scrolls sideways

## Day-to-day

**Changing site copy** — edit `site/src/data/company.ts`, push to `main`.
Pages rebuilds automatically.

**Changing the Worker** — `cd workers/contact && npx wrangler deploy`. Not
automatic; Pages doesn't deploy Workers.

**Rolling back the site** — Pages project → Deployments → find the last good
one → **Rollback**. Instant, no rebuild.

**Rotating the GitHub token** — issue a new one, `npx wrangler secret put
GITHUB_TOKEN`, redeploy the Worker, then revoke the old token.

## When something's wrong

| Symptom | Cause |
|---|---|
| Contact section shows an email link, not a form | `PUBLIC_CONTACT_ENDPOINT` unset at build time — set it and **rebuild** |
| Form returns "Origin not allowed" | `ALLOWED_ORIGIN` doesn't match. **`[vars]` are baked in at deploy time — editing `wrangler.toml` does nothing until you `wrangler deploy` again.** Also: no trailing slash, and `www.` is a separate origin. `npx wrangler tail` logs both sides |
| Build fails with `ENOENT ... /opt/buildhome/repo/package.json` | Root directory isn't `site`, or you created a Workers project instead of a Pages one |
| Route 53 refuses a CNAME at the apex | Expected — see step 7. The nameservers have to move to Cloudflare |
| Form returns 502 | Token expired, lost its Issues permission, or `GITHUB_REPO` is wrong. `npx wrangler tail` shows the GitHub error |
| Submissions silently succeed but no issue appears | You tripped a bot trap — the Worker fakes success for a filled honeypot or a sub-2.5s submit. Fill the form like a person |
| Build fails on Cloudflare, works locally | Root directory isn't `site`, or Node version differs. Set `NODE_VERSION=20` in the Pages env vars |
| Rate limit never triggers | The KV namespace isn't bound. Without it the Worker runs fine but doesn't throttle |

---

## Doing this from a Codespace or dev container

Almost all of it, yes. The split is clean:

**Browser, one-time, unavoidable (~15 minutes of clicking):**

1. **Registrar** — point your domain's nameservers at Cloudflare. Nothing to do
   with Cloudflare's tooling; it's your registrar's control panel.
2. **Cloudflare dashboard** — create an API token so the CLI can authenticate
   without a browser (see below).
3. **GitHub** — create the fine-grained PAT for the inbox repo (step 3 above).
4. **Cloudflare dashboard** — connect the Pages project to this Git repo, and
   add the custom domain. `wrangler pages project create` exists but can't set
   up the Git connection or attach a domain.

**CLI, from inside the container — everything else:**

```sh
npm install && npm run build          # site
npx wrangler kv namespace create RATE_LIMIT
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy                   # worker
```

### Authenticating without a browser

`wrangler login` runs an OAuth flow that redirects to `localhost`. In a
container that callback lands inside the container, not in your browser.
Codespaces port-forwarding sometimes rescues this; don't rely on it.

Use an API token instead — wrangler picks it up from the environment and never
opens a browser:

```sh
export CLOUDFLARE_API_TOKEN="..."
npx wrangler whoami        # confirms it worked
```

Create it at **Cloudflare dashboard → My Profile → API Tokens → Create Token**,
starting from the **Edit Cloudflare Workers** template. That covers Workers
Scripts and KV. Add **Zone → Workers Routes → Edit** for your domain if you're
binding the Worker to a route (step 5).

Store it as a Codespace secret rather than in your shell history. **Don't paste
it into an AI coding session** — including this one. It's an account-level
credential; it belongs in your own environment only.

### Previewing the site in a container

Astro's dev server binds to localhost by default, which a forwarded port can't
reach. Bind it to all interfaces:

```sh
npm run dev -- --host
```

Codespaces will offer to forward port 4321.

### Git-connected Pages vs. direct upload

`wrangler pages deploy dist` works entirely from the CLI and skips the
dashboard. It's tempting if you want zero clicking — but it means either
deploying by hand every time, or adding a GitHub Actions workflow and storing a
Cloudflare token in GitHub secrets, which is one more credential to rotate
forever.

**Connecting Pages to Git in the dashboard costs about two minutes, once, and
then it's push-to-deploy with no token to manage.** For lowest total overhead,
click the two minutes.
