import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import { remarkMermaid } from "./src/utils/remarkMermaid";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://arklnd.github.io",
  integrations: [mdx()],
  env: {
    schema: {
      HITS_KEY: envField.string({ context: "server", access: "public", default: "dev" }),
    },
  },
  markdown: {
    remarkPlugins: [remarkMermaid, remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: "one-light",
        dark: "one-dark-pro",
      },
      defaultColor: false,
    },
  },
});
