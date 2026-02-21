---
title: Hello World
date: 2026-02-20
tags: post
layout: post.njk
---

Welcome to the blog. This is the first post — a placeholder to confirm that the layout, typography, and dark theme are working correctly.

Write your posts in plain Markdown. Headings, **bold**, *italic*, lists, links, blockquotes, code blocks, and footnotes are all supported out of the box.

## An example blockquote

> The purpose of a writer is to keep civilization from destroying itself.
> — Albert Camus

## An example code block

```python
def greet(name: str) -> str:
    return f"Hello, {name}"
```

## Adding a new post

Create a `.md` file in `src/posts/` with this front matter:

```markdown
---
title: My Post Title
date: 2026-03-01
tags: post
layout: post.njk
---
```

Push to `main` and the site redeploys automatically.
