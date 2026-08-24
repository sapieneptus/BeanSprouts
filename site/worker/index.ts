/**
 * The site's Worker.
 *
 * Static files are matched first by the assets binding, so this script only
 * runs for paths with no matching file. That's /api/contact — the contact form
 * endpoint — and genuine 404s.
 *
 * The contact endpoint validates each submission, throttles abuse, and files it
 * as an issue in a PRIVATE inbox repository. The GitHub token never leaves the
 * Worker.
 *
 * Deploy notes live in ./README.md.
 */

export interface Env {
  /** The built static site. Configured in wrangler.toml. */
  ASSETS: Fetcher;
  /** Exact origin allowed to post, e.g. "https://bean-sprouts.com". */
  ALLOWED_ORIGIN: string;
  /** Owner of the private inbox repo. */
  GITHUB_OWNER: string;
  /** Name of the private inbox repo. */
  GITHUB_REPO: string;
  /** Fine-grained PAT with Issues: read & write on the inbox repo only. Secret. */
  GITHUB_TOKEN: string;
  /** Optional KV namespace for per-IP rate limiting. Omit to disable. */
  RATE_LIMIT?: KVNamespace;
}

const TOPICS = ["general", "product", "bug", "idea", "business"] as const;
type Topic = (typeof TOPICS)[number];

const TOPIC_LABELS: Record<Topic, string> = {
  general: "General enquiry",
  product: "Product question",
  bug: "Bug report",
  idea: "Idea / feature request",
  business: "Business / partnership",
};

const LIMITS = {
  name: 100,
  email: 254,
  message: 5000,
  minMessage: 10,
  /** Requests allowed per IP per window. */
  perWindow: 5,
  windowSeconds: 3600,
  /** A human takes longer than this to fill the form. */
  minElapsedMs: 2500,
  /** Refuse oversized bodies outright. */
  maxBodyBytes: 16_000,
};

interface Payload {
  name: string;
  email: string;
  topic: string;
  message: string;
  website: string;
  elapsedMs: number;
}

const CONTACT_PATH = "/api/contact";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Anything that isn't the contact endpoint reached us because no static
    // file matched it. Serve the site's 404 page rather than a bare string.
    if (url.pathname !== CONTACT_PATH) {
      const page = await env.ASSETS.fetch(new URL("/404.html", url.origin));
      return new Response(page.body, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return handleContact(request, env);
  },
};

async function handleContact(request: Request, env: Env): Promise<Response> {
  {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = originAllowed(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowed ? origin : ""),
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, "");
    }

    // Cross-origin browsers always send Origin on POST; a mismatch is either a
    // misconfiguration or someone else's page using our endpoint.
    if (!allowed) {
      return json({ error: "Origin not allowed." }, 403, "");
    }

    const raw = await request.text();
    if (raw.length > LIMITS.maxBodyBytes) {
      return json({ error: "Message is too long." }, 413, origin);
    }

    let payload: Partial<Payload>;
    try {
      payload = JSON.parse(raw) as Partial<Payload>;
    } catch {
      return json({ error: "Malformed request." }, 400, origin);
    }

    // Honeypot and speed traps: answer with a normal-looking success so bots
    // don't learn what tripped them.
    if (typeof payload.website === "string" && payload.website.trim() !== "") {
      return json({ ok: true }, 200, origin);
    }
    if (typeof payload.elapsedMs === "number" && payload.elapsedMs < LIMITS.minElapsedMs) {
      return json({ ok: true }, 200, origin);
    }

    const name = clean(payload.name).slice(0, LIMITS.name);
    const email = clean(payload.email).slice(0, LIMITS.email);
    const message = clean(payload.message, true).slice(0, LIMITS.message);
    const topic: Topic = TOPICS.includes(payload.topic as Topic)
      ? (payload.topic as Topic)
      : "general";

    if (!name) {
      return json({ error: "Please include your name." }, 400, origin);
    }
    if (!isEmail(email)) {
      return json({ error: "That email address doesn't look right." }, 400, origin);
    }
    if (message.length < LIMITS.minMessage) {
      return json({ error: "Please write a slightly longer message." }, 400, origin);
    }

    const limited = await rateLimited(request, env);
    if (limited) {
      return json(
        { error: "You've sent several messages recently. Please try again later." },
        429,
        origin,
      );
    }

    const created = await createIssue(env, { name, email, topic, message });
    if (!created) {
      return json(
        { error: "Something broke on my side. Please email me directly instead." },
        502,
        origin,
      );
    }

    return json({ ok: true }, 200, origin);
  }
}

/* ------------------------------------------------------------------ helpers */

function originAllowed(origin: string, allowedList: string): boolean {
  if (!origin || !allowedList) return false;
  return allowedList
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(origin);
}

function corsHeaders(origin: string): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}

/** Strip control characters; collapse whitespace unless the field is multiline. */
function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return multiline
    ? stripped.replace(/\r\n/g, "\n").trim()
    : stripped.replace(/\s+/g, " ").trim();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

async function rateLimited(request: Request, env: Env): Promise<boolean> {
  if (!env.RATE_LIMIT) return false;

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const key = `contact:${ip}`;

  const current = Number((await env.RATE_LIMIT.get(key)) ?? "0");
  if (current >= LIMITS.perWindow) return true;

  await env.RATE_LIMIT.put(key, String(current + 1), {
    expirationTtl: LIMITS.windowSeconds,
  });
  return false;
}

/**
 * Wrap untrusted text in a fenced block long enough that the content can't
 * escape it. Inside a fence, GitHub renders nothing — no @mentions firing
 * notifications, no "closes #12" auto-closing issues, no image or link
 * injection. The message is preserved verbatim.
 */
function fence(text: string): string {
  const longest = (text.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
  const bar = "`".repeat(Math.max(3, longest + 1));
  return `${bar}text\n${text}\n${bar}`;
}

/** Issue titles are plain text on GitHub, but keep them single-line and short. */
function title(name: string, topic: Topic, message: string): string {
  const gist = message.replace(/\s+/g, " ").slice(0, 60).trim();
  return `[${TOPIC_LABELS[topic]}] ${name}${gist ? ` — ${gist}` : ""}`.slice(0, 140);
}

async function createIssue(
  env: Env,
  input: { name: string; email: string; topic: Topic; message: string },
): Promise<boolean> {
  const body = [
    "**New contact form submission**",
    "",
    `- **Name:** \`${input.name.replace(/`/g, "'")}\``,
    `- **Email:** \`${input.email.replace(/`/g, "'")}\``,
    `- **Topic:** ${TOPIC_LABELS[input.topic]}`,
    "",
    "**Message**",
    "",
    fence(input.message),
    "",
    "---",
    "_Filed automatically by the contact form Worker. The message above is rendered verbatim and is not trusted input._",
  ].join("\n");

  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "beansprouts-contact-worker",
      },
      body: JSON.stringify({
        title: title(input.name, input.topic, input.message),
        body,
        labels: ["contact", `topic:${input.topic}`],
      }),
    },
  );

  if (!response.ok) {
    console.error("GitHub issue creation failed", response.status, await response.text());
    return false;
  }
  return true;
}
