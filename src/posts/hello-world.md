---
title: Hello World
date: 2026-02-20
tags: post
layout: post.njk
hashtags:
  - typography
  - design
  - demo
---

<div class="abstract">
<p>This post is a living demonstration of the blog's typographic features: sidenotes, section anchors, a table of contents, justified text with first-line indentation, and the full Gwern-inspired dark theme.</p>
</div>

Welcome to the blog. This first post confirms that layout, typography, and the dark theme are all working correctly. The font is EB Garamond, served from Google Fonts — a close cousin of the Linux Libertine face Gwern uses.[^1] Paragraphs are justified and use first-line indentation instead of spacing, the traditional book convention.

The table of contents above was generated automatically by JavaScript from the headings in this post. On screens wider than 960 px, footnotes are silently converted into sidenotes that appear in the right margin alongside the text that cites them.

## Typography

Headings at the h2 and h3 level are set in small-caps. Hovering over any heading reveals the section-anchor link (§) so you can copy a direct URL to that section.

Body copy is fully justified with automatic hyphenation. Paragraphs are separated by a first-line indent rather than vertical whitespace — the convention in most printed books and in Gwern's own essays.[^2]

<div class="epigraph">
<p>The purpose of a writer is to keep civilization from destroying itself.</p>
<cite>Albert Camus</cite>
</div>

### Blockquotes and code

Blockquotes are indented with a left border and a slightly lighter background:

> A complex system that works is invariably found to have evolved from a simple system that worked.
> — John Gall

Inline `code` is highlighted in warm amber. Fenced code blocks get a bordered container:

```python
def greet(name: str) -> str:
    return f"Hello, {name}"
```

## Sidenotes

Every footnote you write becomes a sidenote on wide screens.[^3] On small screens the footnotes fall back to the standard section at the bottom of the page. No extra markup is needed — just use standard Markdown footnote syntax.

## Adding new posts

Create a `.md` file in `src/posts/` with this front matter:

```markdown
---
title: My Post Title
date: 2026-03-01
tags: post
layout: post.njk
---
```

Push to `main` and the site redeploys automatically via GitHub Actions.

[^1]: EB Garamond is Claude Garamond's 16th-century roman face revived by Georg Duffner. It is freely available on Google Fonts and pairs well with a dark background due to its generous x-height and open counters.

[^2]: The typographic convention is: use margin *or* indent, never both. Indent signals "this paragraph continues the same topic"; a larger gap signals a break. Most long-form web writing ignores this, to its detriment.

[^3]: The conversion is done in `src/js/main.js`. On load it finds all `sup.footnote-ref` elements, clones the corresponding footnote content, inserts an `<aside class="sidenote">` after the referencing paragraph, then hides the `<section class="footnotes">` at the bottom.
