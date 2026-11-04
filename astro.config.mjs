import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

/**
 * Pages prerender to static HTML. API routes under src/pages/api set
 * `export const prerender = false` and become Vercel serverless functions.
 * That is the Astro 5 replacement for hybrid output.
 */
export default defineConfig({
  output: "static",
  adapter: vercel(),
  build: {
    format: "directory",
  },
});
