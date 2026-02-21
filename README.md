# casruta.github.io

## Adding a post

Create a new `.md` file in `src/posts/` with this front matter:

```markdown
---
title: Post Title
date: YYYY-MM-DD
tags: post
layout: base.njk
---
```

Push to `main` — the site redeploys automatically via GitHub Actions.

## Local development

```bash
npm install
npm start   # http://localhost:8080
```
