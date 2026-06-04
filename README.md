# casruta.github.io

## Adding a post

Drop a `.md` file into `src/posts/`. Only a `title` is required:

```markdown
---
title: Post Title
date: 2025-06-01
---

Your content here.
```

`layout` and `tags` are applied automatically. `date` defaults to the file's creation date if omitted.

Push to `main` — the site redeploys automatically via GitHub Actions.

## Local development

```bash
npm install
npm start   # http://localhost:8080
npm test    # build + integration tests
```
