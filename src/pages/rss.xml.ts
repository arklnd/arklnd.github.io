import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import photos from "../data/photos";

export async function GET(context: APIContext) {
  const posts = (await getCollection("posts", ({ data }) => import.meta.env.DEV || !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const siteUrl = context.site!.toString().replace(/\/$/, "");

  const postItems = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: post.data.description,
    link: `/posts/${post.id}`,
    author: post.data.author,
    categories: post.data.tags,
  }));

  const photoItems = photos
    .filter((p) => p.caption)
    .map((photo) => ({
      title: `📷 ${photo.caption}`,
      pubDate: new Date(photo.date),
      description: photo.caption + (photo.place ? ` — ${photo.place}` : ""),
      link: `/photo-gallery/${photo.slug}`,
      content: `<img src="${siteUrl}/images/gallery/og/${photo.filename}.jpg" alt="${photo.caption}" />`,
    }));

  const items = [...postItems, ...photoItems].sort(
    (a, b) => (b.pubDate?.valueOf() ?? 0) - (a.pubDate?.valueOf() ?? 0)
  );

  return rss({
    title: "Arijit's Blog",
    description: "A tech blog by Arijit Kundu about software engineering, system design, authentication, Git workflows, .NET, and developer tools.",
    site: context.site!,
    items,
    customData: `<language>en-us</language>
<managingEditor>Arijit Kundu</managingEditor>
<webMaster>Arijit Kundu</webMaster>`,
  });
}
