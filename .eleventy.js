import markdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";

export default function (eleventyConfig) {
  // Copy CSS and JS to _site without processing
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

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
