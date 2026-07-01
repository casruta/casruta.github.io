import markdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

// URL-safe slug for a hashtag, e.g. "DataAnalysis" → "dataanalysis"
const slugifyTag = (tag) =>
  String(tag)
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function (eleventyConfig) {
  // Copy CSS and JS to _site without processing
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");

  // Atom feed at /feed.xml (linked from <head> in base.njk)
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "post", limit: 0 },
    metadata: {
      language: "en",
      title: "casruta",
      subtitle:
        "Essays, op-eds, and data-driven social commentary by Kacper Ruta.",
      base: "https://casruta.github.io/",
      author: { name: "Kacper Ruta" },
    },
  });

  // Images dropped next to posts (e.g. my-essay.png beside my-essay.md)
  eleventyConfig.addPassthroughCopy("src/posts/*.{png,jpg,jpeg,webp,gif}");

  // Configure markdown-it with footnote support
  const md = markdownIt({ html: true, linkify: true, typographer: true })
    .use(markdownItFootnote);
  eleventyConfig.setLibrary("md", md);

  // Format a Date object as "February 20, 2026"
  eleventyConfig.addFilter("readableDate", (dateObj) =>
    dateObj.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  // Format a Date object as "2026-02-20" for <time datetime="">
  eleventyConfig.addFilter("htmlDateString", (dateObj) =>
    dateObj.toISOString().split("T")[0]
  );

  // Estimated reading time (≈200 wpm)
  eleventyConfig.addFilter("readTime", (content) => {
    const text = (content || "").replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  });

  eleventyConfig.addFilter("slugifyTag", slugifyTag);

  // All hashtags across posts: [{ name, slug, posts }], most-used first
  eleventyConfig.addCollection("hashtags", (collectionApi) => {
    const map = new Map();
    for (const post of collectionApi.getFilteredByTag("post")) {
      for (const name of post.data.hashtags || []) {
        const slug = slugifyTag(name);
        if (!map.has(slug)) map.set(slug, { name, slug, posts: [] });
        map.get(slug).posts.push(post);
      }
    }
    for (const tag of map.values()) {
      tag.posts.sort((a, b) => b.date - a.date);
    }
    return [...map.values()].sort(
      (a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name)
    );
  });

  // Posts sharing the most hashtags with the current one ("Read next")
  eleventyConfig.addFilter(
    "related",
    (posts, currentUrl, hashtags = [], limit = 3) => {
      const current = new Set((hashtags || []).map(slugifyTag));
      return posts
        .filter((p) => p.url !== currentUrl)
        .map((p) => ({
          post: p,
          score: (p.data.hashtags || []).reduce(
            (n, t) => n + (current.has(slugifyTag(t)) ? 1 : 0),
            0
          ),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || b.post.date - a.post.date)
        .slice(0, limit)
        .map((x) => x.post);
    }
  );

  // Posts grouped by year, newest first — for the archive page
  eleventyConfig.addCollection("postsByYear", (collectionApi) => {
    const groups = new Map();
    for (const post of collectionApi.getFilteredByTag("post")) {
      const y = post.date.getFullYear();
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push(post);
    }
    return [...groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, posts]) => ({
        year,
        posts: posts.sort((a, b) => b.date - a.date),
      }));
  });

  // Add loading="lazy" to all <img> tags in output
  eleventyConfig.addTransform("lazyImages", (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      return content.replace(
        /<img(?!.*loading=)([\s\S]*?)>/g,
        '<img loading="lazy"$1>'
      );
    }
    return content;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/",
  };
}
