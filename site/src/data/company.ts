/**
 * Single source of truth for everything the website says.
 *
 * Edit this file to change site copy — the components read from it and nothing
 * else hard-codes company details. Anything marked `TODO` needs your input
 * before the site goes live.
 */

export type ProjectStatus = "live" | "in-development" | "early";

export interface Project {
  name: string;
  /** One line. What it is, in plain language, to someone who has never heard of it. */
  tagline: string;
  /** Two or three sentences. What it does and who it's for. */
  description: string;
  status: ProjectStatus;
  /** Public link. Omit for anything unreleased. */
  url?: string;
  /** Short label for the link, e.g. "Play it" or "Visit site". */
  urlLabel?: string;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  live: "Live",
  "in-development": "In development",
  early: "Early days",
};

export const company = {
  name: "BeanSprouts",
  /**
   * TODO: your registered company name, if it differs from the trading name
   * (e.g. "BeanSprouts ApS"). This appears in the footer next to the CVR number.
   */
  legalName: "BeanSprouts",
  /** TODO: replace with your real CVR number. */
  cvr: "00000000",
  country: "Denmark",
  tagline: "An independent software studio.",
  /** Used for page metadata and social previews. */
  metaDescription:
    "BeanSprouts is a small independent software studio in Denmark, building simple, focused software from real problems — with no ads, no dark patterns, and no data selling.",
  /** TODO: confirm this is the address you want published. */
  email: "chris@chrisf.io",
  founder: {
    /** TODO: full name as you'd like it to appear. */
    name: "Chris",
  },
} as const;

/**
 * The hero. This is the whole positioning in three sentences — if a visitor
 * reads nothing else, this is what they leave with.
 */
export const hero = {
  eyebrow: `Independent software studio · ${company.country}`,
  heading: "Software I'd actually want to use.",
  lede: `${company.name} is a small studio building focused, uncomplicated software. The projects don't share a market or a category — they share a standard. Each one starts from a problem I ran into myself, and gets built simply enough that it doesn't need explaining.`,
};

/**
 * The mission section. Deliberately opens by admitting there is no grand
 * unifying vision, because there isn't one — and saying so is the point.
 */
export const mission = {
  heading: "The honest version",
  body: [
    "Most studios open with a unifying vision. I don't have one, and I'd rather say that than invent one.",
    "My projects are genuinely disconnected. A browser rally game has nothing to do with a tablet tool. What connects them isn't a market thesis — it's a way of working, and a standard I hold every one of them to.",
  ],
};

export const principles = [
  {
    title: "It starts with a real problem",
    body: "Every project traces back to something I hit myself, or watched a friend or family member struggle with. Nothing here came out of a market-gap spreadsheet.",
  },
  {
    title: "Simple beats clever",
    body: "If something needs a tutorial, a walkthrough, or a settings page to make sense of itself, the design isn't finished. I'd rather cut a feature than add an explanation.",
  },
  {
    title: "The person using it comes first",
    body: "One question decides what ships: would I be happy if this were the software I had to use every day? If the answer is no, it doesn't go out.",
  },
  {
    title: "Built to last, not to scale",
    body: "These are small products, made properly and kept working. Growth at any cost is how good software turns into something you tolerate rather than enjoy.",
  },
];

/**
 * Concrete, checkable promises. Principles say who you are; these say what you
 * will and won't do — which is the part people can actually hold you to.
 */
export const commitments = {
  heading: "What that means in practice",
  intro:
    "Principles are easy to write. These are the specific things I commit to, so you can hold me to them:",
  items: [
    "No ads, in any product, ever.",
    "Your data is never sold, rented, or shared with third-party brokers.",
    "No dark patterns. Leaving is always as easy as arriving.",
    "No account required unless the product genuinely can't work without one.",
    "Honest status. Nothing is described as available when it isn't — everything below marked “in development” is exactly that.",
    "If a product ever shuts down, you get fair notice and a way to take your data with you.",
  ],
};

export const projects: Project[] = [
  {
    name: "RallyRush",
    tagline: "A top-down arcade rally game that runs in your browser.",
    description:
      "Pick a car and a stage, then beat the clock. Drift the corners to fill the boost meter and spend it on the straights, across five biomes with changing weather. No download, no install, no account — it just runs, on desktop and mobile.",
    status: "live",
    // TODO: confirm the canonical URL you want to send people to.
    url: "https://rallyrush.io",
    urlLabel: "Play it",
  },
  {
    name: "Sparr",
    // TODO: replace this placeholder with a real one-liner.
    tagline: "TODO — one line on what Sparr is.",
    // TODO: replace with two or three real sentences.
    description:
      "TODO — what does it do, and who is it for? Two or three plain sentences is plenty. Until this is filled in, this card is intentionally vague rather than made up.",
    status: "in-development",
  },
  {
    name: "Little Beans",
    // TODO: replace this placeholder with a real one-liner.
    tagline: "TODO — one line on what Little Beans is.",
    // TODO: replace with two or three real sentences.
    description:
      "TODO — what does it do, and who is it for? Two or three plain sentences is plenty. Until this is filled in, this card is intentionally vague rather than made up.",
    status: "in-development",
  },
  {
    name: "BeanTray",
    // TODO: replace this placeholder with a real one-liner.
    tagline: "TODO — one line on what BeanTray is.",
    // TODO: replace with two or three real sentences.
    description:
      "TODO — what does it do, and who is it for? Two or three plain sentences is plenty. Until this is filled in, this card is intentionally vague rather than made up.",
    status: "in-development",
  },
];

/**
 * TODO: this is a sketch in your voice, not a biography. Rewrite it as yourself —
 * the more specific and personal it is, the better it does its job.
 */
export const about = {
  heading: "About",
  body: [
    `I'm ${company.founder.name}, and ${company.name} is me. There's no team behind the "we" because there isn't a "we" — it's one person who has been building software for a long time and wanted to build some of it properly, on his own terms.`,
    "That means the products come out slower than they would elsewhere. It also means there's nobody to ask me to add tracking, or to make cancelling harder, or to ship something before it's ready. The trade seems worth it.",
    "If you're wondering whether something here would work for you, ask me directly. You'll get a real answer from the person who built it.",
  ],
};

export const contact = {
  heading: "Get in touch",
  lede: "Questions, bug reports, ideas, or just to say hello — this goes straight to me, and I read everything.",
  /**
   * The Cloudflare Worker that receives the form. Set PUBLIC_CONTACT_ENDPOINT in
   * your Cloudflare Pages build settings. Empty means the form falls back to a
   * plain mailto: link, so the page is never broken — just less convenient.
   * See /workers/contact for deployment.
   */
  endpoint: import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? "",
};

export const nav = [
  { href: "#mission", label: "Mission" },
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];
