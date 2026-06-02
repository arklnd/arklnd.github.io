import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    /** Last modified date — used for dateModified in structured data and article:modified_time OG tag */
    lastModified: z.coerce.date().optional(),
    /** Tags for content clustering, topical authority, and structured data keywords */
    tags: z.array(z.string()).default([]),
    /** OG image path (relative to public/) for social sharing and structured data */
    image: z.string().optional(),
    /** Post author — defaults to site owner */
    author: z.string().default("Arijit Kundu"),
    /** Exclude draft posts from production builds and sitemap */
    draft: z.boolean().default(false),
    /** ID from src/data/projects.ts — links this post to a project */
    project: z.string().optional(),
  }),
});

export const collections = { posts };
