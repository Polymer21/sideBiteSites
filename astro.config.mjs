import { defineConfig } from "astro/config";

/** Static HTML only. No adapter, no server routes. */
export default defineConfig({
  output: "static",
  build: {
    format: "directory",
  },
});
