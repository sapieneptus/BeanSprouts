# Deploying the website

End-to-end runbook, in order. Roughly 45 minutes the first time, most of it
waiting on DNS.

The finished setup:

```
bean-sprouts.com             ┐
bean-sprouts.com/api/contact ┴→ one Worker ─┬→ static files (site/dist)
                                            └→ contact endpoint
                                               → GitHub issue, private repo
```

One Cloudflare project serves both. Requests match the static files first;
anything with no matching file (`/api/contact`) falls through to the script in
`site/worker/`. The form is therefore same-origin by construction — no second
Worker, no route binding, no third-party endpoint in the page source.

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
- `company.email` — confirm this is the address you want published
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

## 4. Configure and deploy

```sh
cd site
npm install
npx wrangler login
```

> Working in a Codespace or dev container? `wrangler login` needs a browser
> callback that won't reach you. See
> [Doing this from a Codespace](#doing-this-from-a-codespace-or-dev-container)
> for the API-token route instead.

Edit [`site/wrangler.toml`](../site/wrangler.toml):

- `name` — the Worker's name, and its `*.workers.dev` subdomain
- `ALLOWED_ORIGIN` — your real site origin(s), comma-separated, no trailing slash
- `GITHUB_OWNER` / `GITHUB_REPO` — your username and the private inbox repo

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
npm run deploy      # builds the site, then wrangler deploy
```

You'll get a `*.workers.dev` URL. Check it before pointing the domain at it.

### Running it locally

`npm run dev` gives you Astro's dev server — fast for copy and layout, but the
contact form won't work, because there's no Worker in front of it.

For the real thing, including the endpoint:

```sh
cp worker/.dev.vars.example worker/.dev.vars   # add a real token
npm run preview                                # build + wrangler dev
```

That serves the built site and `/api/contact` on one port, exactly as in
production. Add the dev origin to `ALLOWED_ORIGIN` while testing.

## 5. Connect it to Git

So that pushing to `main` redeploys without you running anything.

Cloudflare dashboard → **Workers & Pages** → your Worker → **Settings → Build**
→ connect the repository, then:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `site` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

**Root directory must be `site`.** Left at `/` the build runs `npm run build` at
the repo root, where there's no `package.json`, and fails with
`ENOENT ... /opt/buildhome/repo/package.json`.

No build-time environment variables are needed. The contact endpoint is a
same-origin path (`/api/contact`) baked into the site, so there's nothing to
configure per environment.

> The work so far is on the `claude/company-website-repo-qijvdg` branch. Merge
> it to `main` before the first production build, or set the production branch
> to match.

## 6. Point the domain at it (DNS)

**Do not create A or AAAA records by hand.** There is no IP address to point at
— Workers run on Cloudflare's anycast network and the addresses aren't
stable. Hardcoding one will break, quietly, later.

Instead, on the Worker: **Settings → Domains & Routes → Add → Custom domain** →
`bean-sprouts.com`. Then repeat for `www.bean-sprouts.com`. Cloudflare creates
the DNS records itself and issues the certificate.

Wait for the certificate to be issued, usually a few minutes.

> **Cloudflare will warn you about missing records before you get here.**
> "Visitors cannot reach bean-sprouts.com / www.bean-sprouts.com" appears the
> moment the zone exists and is empty. It's expected, and adding records by hand
> to silence it is the wrong fix. Attaching the custom domains above clears both
> warnings.

Attaching a custom domain to a Worker writes the routing itself — there are no
`A`/`AAAA` records to add, and nothing to copy by hand.

### Optional: redirect www to the apex

Attaching both domains serves the site at both, which is fine — the pages emit
canonical tags pointing at the apex, so search engines won't treat it as
duplicate content.

If you'd rather have a real 301: **Rules → Redirect Rules → Create rule**,
matching hostname `www.bean-sprouts.com`, redirecting to
`https://bean-sprouts.com` with the path preserved. The www DNS record still has
to exist and be proxied for the rule to fire, so attach the custom domain first
either way.

## 6b. Email records: SPF, DKIM, DMARC

Cloudflare will also warn that "email cannot reach @bean-sprouts.com addresses
and they could be spoofed," and offer a prefilled restrictive record set. Its
description — "advise receiving mail servers to drop all incoming email sent
from your domain" — is badly worded and reads far more alarming than it is.

**These are two independent things:**

| Concern | Governed by | Direction |
|---|---|---|
| Can people send mail **to** you at `@bean-sprouts.com`? | `MX` records | Inbound |
| Can someone send mail **claiming to be** `@bean-sprouts.com`? | SPF, DKIM, DMARC | Outbound |

The restrictive preset only touches the second. It says "no server anywhere is
authorised to send mail as this domain, and receivers should reject anything
that claims to be." It cannot stop anyone from emailing you — that's MX, which
the preset doesn't set.

**Since `bean-sprouts.com` sends no mail today, this preset is exactly right.**
The site's contact address is on a different domain, and the contact form posts
to a Worker and files a GitHub issue — no mail is sent from this domain at any
point. Publishing "nobody may send as us" costs nothing and stops your domain
being used to spoof people, which is worth having on a domain whose whole job is
to look trustworthy.

What each record does:

| Record | Meaning |
|---|---|
| `TXT @` → `v=spf1 -all` | No server is authorised to send as this domain |
| `TXT *._domainkey` → `v=DKIM1; p=` | Empty public key = revoked. The wildcard covers every selector |
| `TXT _dmarc` → `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;` | Receivers should reject failures outright, strictly, subdomains included |

Submit it. Leave **Reporting email addresses** blank unless you want XML
aggregate reports — for a domain that sends nothing they're mostly noise, and
you can add `rua=` later if you get curious about who's trying to spoof you.

**MX:** required, because the site now publishes `hello@bean-sprouts.com`.
Set up **Email Routing** (below) before launch. Do *not* add a "null MX"
(RFC 7505) — that declares the domain accepts no mail, which would be true of a
domain that publishes no address, but is now wrong.

### Set up hello@bean-sprouts.com

The site publishes this address, so it has to work before you tell anyone about
the site. A published address that bounces is worse than no address.

**Cloudflare dashboard → Email → Email Routing → Get started.** Create a rule
forwarding `hello@bean-sprouts.com` to your real inbox, and verify the
destination address (Cloudflare emails you a confirmation link). Enabling it adds
the MX records for you.

Cloudflare will also prompt you about the SPF record, because the restrictive
`v=spf1 -all` above conflicts with what it wants to add. Follow its guidance —
it knows what it needs.

Note the asymmetry: routing only lets you **receive**. If you later want to
*send* as `hello@bean-sprouts.com`, `-all` has to become an include list naming
your sending provider, and you'll need real DKIM keys from them. That's a bigger
change, worth doing properly rather than loosening SPF to `~all` and hoping.

## 7. Verify before you tell anyone

- [ ] Site loads on the real domain over HTTPS
- [ ] Dark mode: toggle it, reload, the choice sticks
- [ ] Every nav link scrolls to the right section, nothing hidden behind the header
- [ ] Email `hello@bean-sprouts.com` from an outside account and confirm it lands in your inbox
- [ ] Send yourself a real message through the contact form
- [ ] An issue appears in `contact-inbox` with the right name, email and body
- [ ] Submit again 6 times — the 6th should be refused (rate limit is 5/hour/IP)
- [ ] `curl -sI https://bean-sprouts.com | grep -i strict-transport` returns the header
- [ ] View source: no GitHub token anywhere (it's in the Worker, but check)
- [ ] Phone check — the layout is single-column and nothing scrolls sideways

## Day-to-day

**Changing site copy** — edit `site/src/data/company.ts`, push to `main`. The
Worker rebuilds and redeploys automatically.

**Changing the endpoint** — edit `site/worker/index.ts`, push to `main`. Same
pipeline; the site and the endpoint deploy together, because they're one Worker.

**Deploying by hand** — `cd site && npm run deploy`.

**Rolling back** — the Worker's **Deployments** tab → find the last good
version → roll back to it. No rebuild.

**Rotating the GitHub token** — issue a new one, `npx wrangler secret put
GITHUB_TOKEN`, redeploy, then revoke the old one.

## When something's wrong

| Symptom | Cause |
|---|---|
| Build fails with `ENOENT ... /opt/buildhome/repo/package.json` | Root directory isn't `site` |
| Form returns "Origin not allowed" | `ALLOWED_ORIGIN` doesn't exactly match the site origin. No trailing slash; `www.` is a different origin |
| Form returns 502 | Token expired, lost its Issues permission, or `GITHUB_REPO` is wrong. `npx wrangler tail` shows the GitHub error |
| Submissions silently succeed but no issue appears | You tripped a bot trap — the endpoint fakes success for a filled honeypot or a sub-2.5s submit. Fill the form like a person |
| `/api/contact` returns the 404 page | A static file is shadowing the path, or `main` isn't set in `wrangler.toml` |
| Security headers missing | `site/public/_headers` didn't make it into `dist/`. Check the build output |
| Rate limit never triggers | The KV namespace isn't bound. Without it the endpoint runs fine but doesn't throttle |
| Build fails on Cloudflare, works locally | Node version differs. Set `NODE_VERSION=20` in the Worker's build variables |

---

## Doing this from a Codespace or dev container

Almost all of it, yes. The split is clean:

**Browser, one-time, unavoidable (~15 minutes of clicking):**

1. **Registrar** — point your domain's nameservers at Cloudflare. Nothing to do
   with Cloudflare's tooling; it's your registrar's control panel.
2. **Cloudflare dashboard** — create an API token so the CLI can authenticate
   without a browser (see below).
3. **GitHub** — create the fine-grained PAT for the inbox repo (step 3 above).
4. **Cloudflare dashboard** — connect the Worker to this Git repo, and attach
   the custom domain. Neither is scriptable from wrangler.

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

### Deploying by hand vs. connecting Git

`npm run deploy` works entirely from the CLI and skips the dashboard. That's
fine, but it means deploying by hand every time, or adding a GitHub Actions
workflow with a Cloudflare token in GitHub secrets — one more credential to
rotate forever.

**Connecting the Worker to Git in the dashboard costs about two minutes, once,
and then it's push-to-deploy with no token to manage.** For lowest total
overhead, click the two minutes.
