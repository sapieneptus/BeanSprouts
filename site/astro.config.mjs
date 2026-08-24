// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output. Deploys as plain files to Cloudflare Pages (or anywhere else).
// The contact form posts to a separate Cloudflare Worker — see /workers/contact.
export default defineConfig({
  site: "https://bean-sprouts.com",
  output: "static",
  integrations: [sitemap()],
  build: {
    inlineStylesheets: "auto",
  },
  devToolbar: {
    enabled: false,
  },
});
