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
  cvr: "46683420",
  country: "Denmark",
  tagline: "An independent software studio.",
  /** Used for page metadata and social previews. */
  metaDescription:
    "BeanSprouts is a small independent software studio in Denmark, building simple, honest, human-focused software to solve real problems.",
  /**
   * No email address is published anywhere on the site, on purpose — a
   * scrapeable mailto: is a spam magnet. The contact form is the only route
   * in, and it delivers to a private issue tracker. Don't reintroduce one.
   */
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
  heading: "Software for small, focused problems.",
  lede: `${company.name} is a one-person studio. I build for problems that matter enormously to the people who have them and are far too specific for anyone large to serve properly. Each one starts from something I ran into myself, and gets built simply enough that it doesn't need explaining.`,
};

/**
 * The mission section. States the actual thesis — small, specific problems —
 * and is upfront that the projects themselves look unrelated, because they are.
 */
export const mission = {
  heading: "Small problems, taken seriously",
  body: [
    "Most studios open with a sweeping vision. Mine is narrower than that, and I'd rather state it plainly than dress it up.",
    "I build software for small, focused problems. Not small as in unimportant: small as in specific. For example, a paper stamp rally at a convention can be a real headache for the people running one, yet nothing more than a rounding error to anyone with a boardroom.",
    "Where something comparable already exists at scale, the bet is simple: a tool built for one niche beats a general one stretched to cover it.",
    "So the projects look unrelated, and they are. What connects them is the size of problem I'm willing to chase, and the standard I hold every one of them to.",
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
    "Protect the customer and only charge for real value",
    "Your data is never sold, rented, or shared with third-party brokers.",
    "No dark patterns. Leaving is always as easy as arriving.",
    "No account required unless the product genuinely can't work without one.",
    "Honest status. Nothing is described as available when it isn't: everything below marked “in development” is exactly that.",
    "If a product ever shuts down, you get fair notice and a way to take your data with you.",
  ],
};

export const projects: Project[] = [
  {
    name: "RallyRush",
    tagline: "Artist-alley stamp rallies at conventions, minus the paper.",
    description:
      "A stamp rally is a group of artists teaming up: buy something at every table, collect a stamp at each, fill the card, win the prize. It has always run on paper cards and rubber stamps coordinated over Discord. RallyRush puts the card in the shopper's browser — no app, no account — mints each stamp code fresh so a screenshotted one is worthless, and gives the organizer a live view of the whole event.",
    status: "live",
    url: "https://rallyrush.app/landing",
    urlLabel: "See how it works",
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
 * Where you say what you actually think about AI. Specific, first-person, and
 * committing to a line you can be held to — which is the only version of this
 * section worth publishing.
 */
export const ai = {
  heading: "Where I use AI, and where I stop",
  lede: "It's a fair thing to want to know about any software company right now, so here's a straight answer rather than a policy page.",
  body: [
    "I've built software professionally for over ten years, from early-stage startups to global infrastructure. A lot of those hours went to work that was never the point: getting a button to line up, dealing with date arithmatic, chasing an off-by-one. That's accidental complexity; i.e. difficulty that comes from the tools rather than from the problem. I count those minutes as lost, not as craft.",
    "So I use AI heavily for that layer, on purpose. What it doesn't get to do is decide what to build, who it's for, or whether it's good enough to ship.",
    "In terms of art and assets, the line I draw is that AI-art (both visual and audio) is a useful, high-fidelity placeholder, but final assets must be produced by a human artist before any sales are made.",
    "I believe this balance allows me maximum development velocity while also preserving the value and economy of human artists."
  ],
  stances: [
    {
      verdict: "yes" as const,
      label: "Where AI helps",
      title: "The accidental complexity",
      body: "Alignment, boilerplate, date arithmetic, simple copy, generating examples from a template etc. Necessary work, but not the work that makes a product good. Handing it off buys back the hours that go into the parts that do.",
    },
    {
      verdict: "no" as const,
      label: "Where I decide",
      title: "Judgment and direction",
      body: "What's worth building, who it's for, and whether it's ready. Those are the high-value calls, and they're the ones I'm accountable for. Nothing ships because a model said it was fine.",
    },
    {
      verdict: "line" as const,
      label: "Where it stops",
      title: "Art that goes to market",
      body: "This is the hard line. Generative tools are genuinely good for prototyping; a rough visual tells you more about whether a screen works than a grey box does. But the prototype is where it stops. Anything visual that reaches a customer is commissioned from a real artist, working in their own style, with my mock-up as a brief and nothing more.",
    },
  ],
  closing:
    "If you ever think something I've shipped falls on the wrong side of that line, tell me.",
};

/**
 * TODO: this is a sketch in your voice, not a biography. Rewrite it as yourself —
 * the more specific and personal it is, the better it does its job.
 */
export const about = {
  heading: "About",
  /**
   * Drop a photo at site/public/portrait.jpg (square, ~600×600) and set this to
   * "/portrait.jpg". A real face does more for trust than anything else on the
   * page. Left empty, the ridgeline motif stands in.
   */
  portrait: "",
  portraitAlt: `${company.founder.name}, founder of ${company.name}`,
  body: [
    `I'm ${company.founder.name}, and ${company.name} is me. There's no team behind the "we" because there isn't a "we" — it's one person who has been building software for a long time and wanted to build some of it properly, on my own terms.`,
    "That means the products come out slower than they would elsewhere. It also means there's nobody to ask me to add tracking, or to make cancelling harder, or to ship something before it's ready. The trade seems worth it.",
    "If you're wondering whether something here would work for you, ask me directly. You'll get a real answer from the person who built it.",
  ],
};

export const contact = {
  heading: "Get in touch",
  lede: "Questions, bug reports, ideas, or just to say hello — this goes straight to me, and I read everything.",
  /**
   * The Cloudflare Worker that receives the form. Set PUBLIC_CONTACT_ENDPOINT in
   * your Cloudflare Pages build settings. Empty means the contact panel says so
   * rather than rendering a form that posts nowhere — and since no email
   * address is published, that build leaves visitors no way to reach you, so
   * treat an empty endpoint as a broken deploy. See /workers/contact.
   */
  endpoint: import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? "",
};

export const nav = [
  { href: "#mission", label: "Mission" },
  { href: "#projects", label: "Projects" },
  { href: "#ai", label: "On AI" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];
