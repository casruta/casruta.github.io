import markdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";

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
