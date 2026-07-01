import { existsSync, readFileSync } from "node:fs";
import { dirname, basename, extname, join } from "node:path";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];

// First image referenced in the post body — markdown ![](url) or <img src="">
function firstContentImage(inputPath) {
  try {
    const source = readFileSync(inputPath, "utf-8");
    const md = source.match(/!\[[^\]]*\]\(([^)\s]+)/);
    if (md) return md[1];
    const html = source.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (html) return html[1];
  } catch {
    // unreadable file — no thumbnail
  }
  return false;
}

export default {
  layout: "post.njk",
  tags: "post",
  // Date of the file's first git commit — stable across deploys, so a
  // drop-in post needs no date in its frontmatter. Explicit `date:` wins.
  date: "git Created",
  eleventyComputed: {
    // Header image convention: an image sharing the post's basename
    // (my-essay.md + my-essay.png) becomes the post's hero image.
    // Frontmatter `image:` overrides; `image: false` disables.
    heroImage: (data) => {
      if (data.image === false) return false;
      if (data.image) {
        // Normalize bare filenames (image: foo.png) to the /posts/ output
        // path; leave absolute paths and full URLs untouched.
        if (/^(\/|https?:\/\/)/.test(data.image)) return data.image;
        return `/posts/${data.image}`;
      }

      const inputPath = data.page.inputPath;
      const dir = dirname(inputPath);
      const base = basename(inputPath, extname(inputPath));

      for (const ext of IMAGE_EXTENSIONS) {
        if (existsSync(join(dir, `${base}.${ext}`))) {
          return `/posts/${base}.${ext}`;
        }
      }
      return false;
    },
    // List thumbnail: the hero image, or failing that the first picture
    // that appears inside the article itself.
    thumbnail: (data) => {
      if (data.image === false) return false;
      return data.heroImage || firstContentImage(data.page.inputPath);
    },
  },
};
