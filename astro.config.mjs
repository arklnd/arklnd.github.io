import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { remarkMermaid } from "./src/utils/remarkMermaid";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import AstroPWA from "@vite-pwa/astro";
import { execSync } from "child_process";

const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

export default defineConfig({
  site: "https://arijitk.in",
  integrations: [
    mdx(),
    sitemap(),
    AstroPWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "Arijit's Blog",
        short_name: "Arijit",
        description: "A quiet place to read.",
        lang: "en",
        dir: "ltr",
        orientation: "any",
        categories: ["blog", "education", "personalization"],
        theme_color: "#3d6aa8",
        background_color: "#e6e9ed",
        display: "standalone",
        scope: "/",
        start_url: "/",
        prefer_related_applications: false,
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigationPreload: true,
        navigateFallback: null,
        globPatterns: ["**/*.{css,js,svg,png,ico,txt,xml}"],
        additionalManifestEntries: [
          { url: "/offline", revision: commitHash },
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: `pages-${commitHash}`,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              precacheFallback: {
                fallbackURL: "/offline",
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: `google-fonts-cache-${commitHash}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: `gstatic-fonts-cache-${commitHash}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: `jsdelivr-cache-${commitHash}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  env: {
    schema: {},
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
