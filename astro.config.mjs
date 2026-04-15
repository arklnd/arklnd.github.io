import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { remarkMermaid } from "./src/utils/remarkMermaid";

export default defineConfig({
  site: "https://arklnd.github.io",
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkMermaid],
    shikiConfig: {
      themes: {
        light: "one-light",
        dark: "one-dark-pro",
      },
      defaultColor: false,
    },
  },
});
