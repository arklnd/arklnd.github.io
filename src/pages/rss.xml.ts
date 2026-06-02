import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("posts")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: "Arijit's Blog",
    description: "A tech blog by Arijit Kundu about software engineering, system design, authentication, Git workflows, .NET, and developer tools.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.id}`,
      author: post.data.author,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>
<managingEditor>Arijit Kundu</managingEditor>
<webMaster>Arijit Kundu</webMaster>`,
  });
}
