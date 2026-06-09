import { existsSync } from "node:fs";
import { dirname, basename, extname, join } from "node:path";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];

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
      if (data.image) return data.image;

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
  },
};
