# casruta.github.io

## Adding a post

Drop a `.md` file into `src/posts/`. Only a `title` is required:

```markdown
---
title: Post Title
subtitle: One-line summary shown on the home page.
hashtags:
  - topic-one
  - topic-two
---

Your content here.
```

- `layout` and `tags` are applied automatically.
- `date` defaults to the file's first git commit date if omitted.
- **Header image**: drop an image with the same basename next to the post
  (`post-title.md` + `post-title.png`) and it becomes the post's header image
  and home-page thumbnail automatically. Supported: png, jpg, jpeg, webp, gif.
  Override with `image: /path.png` in frontmatter, or disable with `image: false`.
- `hashtags` become clickable: each gets its own page at `/tags/<tag>/`,
  all tags are listed at `/tags/`, and the home page filter searches them.

Push to `main` — the site redeploys automatically via GitHub Actions.

## Local development

```bash
npm install
npm start   # http://localhost:8080
npm test    # build + integration tests
```
