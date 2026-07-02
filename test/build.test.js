import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE = join(ROOT, "_site");

function build() {
  execSync("npx @11ty/eleventy --quiet", { cwd: ROOT, stdio: "pipe" });
}

describe("Blog build", () => {
  before(() => build());

  describe("Home page", () => {
    it("has the centered blackletter badge and tab navigation", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("site-badge"), "site badge missing");
      assert.ok(html.includes('class="tabs"'), "tabs missing");
      for (const tab of ["Posts", "Archive", "Tags", "About"]) {
        assert.ok(html.includes(`>${tab}</a>`), `${tab} tab missing`);
      }
      assert.ok(html.includes("tab-active"), "active tab state missing");
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.match(
        css,
        /\.site-badge\s*\{[^}]*font-family: var\(--font-gothic\)/,
        "badge must use the blackletter"
      );
    });

    it("shows the profile hero with handle, avatar, and actions", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("profile-name"), "profile name missing");
      assert.ok(
        html.includes(">@CasparKozlowski</a>"),
        "twitter handle missing"
      );
      assert.match(
        html,
        /profile-handle" href="https:\/\/x\.com\/CasparKozlowski"/,
        "handle must link to X"
      );
      assert.ok(html.includes("profile-avatar"), "avatar missing");
      assert.ok(html.includes("btn-subscribe"), "Subscribe button missing");
      assert.ok(html.includes("btn-message"), "Message button missing");
      assert.ok(html.includes('class="pill"'), "profile pills missing");
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.match(
        css,
        /\.profile-avatar\s*\{[^}]*border-radius:\s*50%/,
        "avatar is not circular"
      );
    });

    it("contains a post list", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("post-list"), "post-list class missing");
    });

    it("features the newest post as a Latest post card with overlay", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("latest-label"), "Latest post label missing");
      assert.ok(html.includes('class="featured"'), "featured card missing");
      assert.ok(html.includes("featured-overlay"), "title overlay missing");
      assert.ok(
        html.includes("Spending Outpaced Growth"),
        "newest post should be featured"
      );
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.match(
        css,
        /\.featured-wrap\[hidden\]\s*\{\s*display:\s*none\s*!important/,
        "featured-wrap hide rule missing"
      );
    });

    it("keeps content visible without JavaScript (noscript fallback)", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(
        html.includes("<noscript>") && html.includes(".fade-target"),
        "noscript fallback for scroll-reveal missing"
      );
    });

    it("contains the post filter with searchable metadata", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("post-filter"), "filter input missing");
      assert.ok(html.includes('data-search="'), "data-search attributes missing");
      assert.ok(html.includes("#inflation"), "hashtags missing from search data");
    });

    it("shows a thumbnail for posts whose article contains a picture", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      // The Alberta post has charts in its body; the first one should be
      // surfaced as its list thumbnail.
      assert.ok(
        html.includes("post-list-thumb"),
        "no thumbnails in the post list"
      );
      assert.ok(
        html.includes("alberta_population_growth.png"),
        "first article image not used as thumbnail"
      );
    });
  });

  describe("Search filter (DOM)", () => {
    let window;

    before(() => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      const dom = new JSDOM(html, {
        url: "https://casruta.github.io/",
        runScripts: "outside-only",
      });
      window = dom.window;

      // Stubs for APIs jsdom lacks (used by unrelated init functions)
      window.matchMedia = () => ({ matches: false });
      window.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };

      const mainJs = readFileSync(join(SITE, "js", "main.js"), "utf-8");
      window.eval(mainJs);
      window.document.dispatchEvent(
        new window.Event("DOMContentLoaded", { bubbles: true })
      );
    });

    after(() => window.close());

    function type(query) {
      const input = window.document.querySelector(".post-filter");
      input.value = query;
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    }

    function visibleTitles() {
      return Array.from(
        window.document.querySelectorAll(".post-list li:not([hidden])")
      ).map((li) => li.querySelector(".post-list-text a").textContent.trim());
    }

    it("CSS actually hides [hidden] list items (display:flex override)", () => {
      // Regression: the filter sets the hidden attribute, but the author rule
      // `.post-list li { display: flex }` beats the UA `[hidden]` style unless
      // this explicit rule exists — without it, "hidden" posts stay visible.
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.match(
        css,
        /\.post-list li\[hidden\]\s*\{\s*display:\s*none\s*!important/,
        "missing .post-list li[hidden]{display:none!important} rule"
      );
    });

    it("filters by hashtag", () => {
      type("#inflation");
      const titles = visibleTitles();
      assert.equal(titles.length, 1, "expected exactly one match");
      assert.match(titles[0], /Spending Outpaced Growth/);
    });

    it("filters by title text", () => {
      type("hello");
      const titles = visibleTitles();
      assert.equal(titles.length, 1);
      assert.match(titles[0], /Hello World/);
    });

    it('"AI" matches only the AI post, not "gain" in another subtitle', () => {
      type("AI");
      const titles = visibleTitles();
      assert.equal(titles.length, 1, "expected only the AI article");
      assert.match(titles[0], /AI, Data, and Meta/);
      assert.ok(
        !titles.some((t) => /Spending Outpaced Growth/.test(t)),
        "the Alberta post (contains 'gain') must be hidden"
      );
    });

    it("does not match words that appear only in the subtitle", () => {
      // "budget" is in the Alberta subtitle but not its title or tags.
      type("budget");
      assert.equal(
        visibleTitles().length,
        0,
        "subtitle-only words should not match (title + tags only)"
      );
    });

    it("shows the empty message when nothing matches", () => {
      type("zzz-no-such-post");
      assert.equal(visibleTitles().length, 0);
      const empty = window.document.querySelector(".post-filter-empty");
      assert.equal(empty.hidden, false, "empty message should be visible");
    });

    it("restores all posts when cleared", () => {
      type("");
      assert.ok(visibleTitles().length >= 3, "all posts should reappear");
      const empty = window.document.querySelector(".post-filter-empty");
      assert.equal(empty.hidden, true, "empty message should be hidden");
    });
  });

  describe("Hashtag pages", () => {
    it("generates a page per hashtag listing its posts", () => {
      const path = join(SITE, "tags", "inflation", "index.html");
      assert.ok(existsSync(path), "tags/inflation/index.html missing");
      const html = readFileSync(path, "utf-8");
      assert.ok(
        html.includes("Spending Outpaced Growth"),
        "tagged post not listed on its tag page"
      );
    });

    it("generates a tags index listing all hashtags", () => {
      const path = join(SITE, "tags", "index.html");
      assert.ok(existsSync(path), "tags/index.html missing");
      const html = readFileSync(path, "utf-8");
      for (const tag of ["#inflation", "#alberta", "#typography"]) {
        assert.ok(html.includes(tag), `${tag} missing from tags index`);
      }
    });

    it("links post header hashtags to their tag pages", () => {
      const html = readFileSync(
        join(SITE, "posts", "spending-outpaced-growth", "index.html"),
        "utf-8"
      );
      assert.ok(
        html.includes('href="/tags/inflation/"'),
        "post hashtag not linked to tag page"
      );
    });
  });

  describe("Posts render", () => {
    const posts = [
      { slug: "hello-world", title: "hello world" },
      { slug: "ai-data-and-meta", title: "AI, Data and Meta" },
      { slug: "spending-outpaced-growth", title: "Spending Outpaced Growth" },
    ];

    for (const { slug, title } of posts) {
      it(`renders ${slug}`, () => {
        const path = join(SITE, "posts", slug, "index.html");
        assert.ok(existsSync(path), `posts/${slug}/index.html missing`);
        const html = readFileSync(path, "utf-8");
        assert.ok(html.includes("post-content"), "post-content class missing");
      });
    }
  });

  describe("Design tokens", () => {
    it("tokens.css defines the type voices", () => {
      const t = readFileSync(join(SITE, "css", "tokens.css"), "utf-8");
      assert.match(
        t,
        /--font-heading:\s*"Domine"/,
        "content headings must use the NYT-style Domine"
      );
      assert.match(
        t,
        /--font-gothic:\s*"UnifrakturMaguntia"/,
        "nameplate/nav blackletter missing"
      );
      assert.ok(t.includes("Georgia"), "body font missing");
      assert.ok(t.includes('"Libre Franklin"'), "sans/label font missing");
      assert.ok(t.includes("--font-body"), "--font-body token missing");
    });

    it("tab links use the sans label font", () => {
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.match(
        css,
        /\.tabs a \{[^}]*font-family: var\(--font-sans\)/,
        "tabs must use the sans font"
      );
    });

    it("post column is half the layout canvas (600px)", () => {
      const t = readFileSync(join(SITE, "css", "tokens.css"), "utf-8");
      assert.ok(
        t.includes("--post-width:    min(600px"),
        "halved post width missing"
      );
      assert.ok(t.includes("--layout-width"), "layout width token missing");
    });

    it("tokens.css defines the dark profile palette", () => {
      const t = readFileSync(join(SITE, "css", "tokens.css"), "utf-8").toLowerCase();
      for (const hex of ["#0f0f0f", "#e8e8e8", "#a855f7", "#1c1c1c"]) {
        assert.ok(t.includes(hex), `palette colour ${hex} missing`);
      }
    });

    it("every page loads the tokens stylesheet before style.css", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      const tokensAt = html.indexOf("/css/tokens.css");
      const styleAt = html.indexOf("/css/style.css");
      assert.ok(tokensAt !== -1, "tokens.css not linked");
      assert.ok(
        tokensAt < styleAt,
        "tokens.css must load before style.css"
      );
    });
  });

  describe("Wide single-column layout + scroll reveal", () => {
    it("CSS is single-column (no two-column rule)", () => {
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.ok(
        !css.includes("column-count: 2"),
        "two-column rule should be removed"
      );
    });

    it("CSS defines the scroll-reveal transition", () => {
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.ok(css.includes(".fade-target"), "fade-target class missing");
      assert.ok(
        css.includes(".fade-target.fade-in"),
        "fade-in reveal state missing"
      );
    });

    it("JS reveals blocks bidirectionally on scroll", () => {
      const js = readFileSync(join(SITE, "js", "main.js"), "utf-8");
      assert.ok(
        js.includes("IntersectionObserver"),
        "IntersectionObserver missing"
      );
      assert.ok(
        js.includes("toggle('fade-in', entry.isIntersecting)"),
        "bidirectional reveal toggle missing"
      );
    });
  });

  describe("Removed legacy chrome", () => {
    it("no X widgets script, sidebar, or newsletter box remains", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(
        !html.includes("platform.twitter.com"),
        "widgets.js should be removed"
      );
      assert.ok(
        !html.includes("social-sidebar"),
        "fixed social sidebar should be removed"
      );
      assert.ok(
        !html.includes("newsletter-box"),
        "newsletter box should be folded into the profile"
      );
    });
  });

  describe("Publication infrastructure", () => {
    it("generates a valid Atom feed", () => {
      const path = join(SITE, "feed.xml");
      assert.ok(existsSync(path), "feed.xml missing");
      const xml = readFileSync(path, "utf-8");
      assert.ok(xml.includes("<feed"), "not an Atom feed");
      assert.ok(
        xml.includes("Spending Outpaced Growth"),
        "posts missing from feed"
      );
    });

    it("generates sitemap.xml and robots.txt", () => {
      assert.ok(existsSync(join(SITE, "sitemap.xml")), "sitemap missing");
      const robots = readFileSync(join(SITE, "robots.txt"), "utf-8");
      assert.ok(robots.includes("Sitemap:"), "robots.txt missing sitemap ref");
    });

    it("builds a 404 page and favicon", () => {
      assert.ok(existsSync(join(SITE, "404.html")), "404 page missing");
      assert.ok(existsSync(join(SITE, "favicon.svg")), "favicon missing");
    });

    it("adds SEO and social-card meta to posts", () => {
      const html = readFileSync(
        join(SITE, "posts", "spending-outpaced-growth", "index.html"),
        "utf-8"
      );
      assert.ok(html.includes('name="description"'), "meta description missing");
      assert.ok(html.includes('rel="canonical"'), "canonical missing");
      assert.ok(html.includes('property="og:title"'), "og:title missing");
      assert.ok(html.includes('property="og:image"'), "og:image missing");
      assert.ok(html.includes('name="twitter:card"'), "twitter card missing");
    });

    it("renders share buttons and author card on posts", () => {
      const html = readFileSync(
        join(SITE, "posts", "spending-outpaced-growth", "index.html"),
        "utf-8"
      );
      assert.ok(html.includes("share-btn"), "share buttons missing");
      assert.ok(html.includes("twitter.com/intent/tweet"), "X share intent missing");
      assert.ok(html.includes("author-card"), "author card missing");
    });

    it("builds the archive page grouped by year", () => {
      const html = readFileSync(join(SITE, "archive", "index.html"), "utf-8");
      assert.ok(html.includes("archive-year"), "year grouping missing");
      assert.ok(html.includes("2026"), "year heading missing");
    });
  });

  describe("Drop-in workflow", () => {
    const tempPost = join(ROOT, "src", "posts", "__test_dropin.md");
    const tempImage = join(ROOT, "src", "posts", "__test_dropin.png");
    const tempOutput = join(SITE, "posts", "__test_dropin", "index.html");

    // Tiny valid 1×1 PNG
    const pngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    after(() => {
      if (existsSync(tempPost)) unlinkSync(tempPost);
      if (existsSync(tempImage)) unlinkSync(tempImage);
      build();
    });

    it("a markdown file with only a title is picked up", () => {
      writeFileSync(
        tempPost,
        "---\ntitle: Dropin Test\ndate: 2099-01-01\n---\n\nThis is a drop-in test post.\n",
        "utf-8"
      );
      build();

      assert.ok(existsSync(tempOutput), "drop-in post output missing");
      const html = readFileSync(tempOutput, "utf-8");
      assert.ok(html.includes("Dropin Test"), "drop-in title missing");
      assert.ok(html.includes("post-content"), "post-content class missing");

      const home = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(
        home.includes("Dropin Test"),
        "drop-in post not listed on home page"
      );
    });

    it("a sibling image with the same basename becomes the header image", () => {
      writeFileSync(
        tempPost,
        "---\ntitle: Dropin Test\ndate: 2099-01-01\n---\n\nThis is a drop-in test post.\n",
        "utf-8"
      );
      writeFileSync(tempImage, pngBytes);
      build();

      const html = readFileSync(tempOutput, "utf-8");
      assert.ok(html.includes("post-hero"), "post-hero figure missing");
      assert.ok(
        html.includes("/posts/__test_dropin.png"),
        "hero image URL missing from post"
      );
      assert.ok(
        existsSync(join(SITE, "posts", "__test_dropin.png")),
        "image not copied to output"
      );

      const home = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(
        home.includes("post-list-thumb"),
        "thumbnail missing from home page list"
      );
    });

    it("shows related posts when hashtags overlap", () => {
      // Shares the "typography" tag with Hello World → should appear as
      // "Read next" on the drop-in post.
      writeFileSync(
        tempPost,
        "---\ntitle: Dropin Test\ndate: 2099-01-01\nhashtags:\n  - typography\n---\n\nRelated-posts test.\n",
        "utf-8"
      );
      build();

      const html = readFileSync(tempOutput, "utf-8");
      assert.ok(html.includes("read-next"), "Read next section missing");
      assert.ok(
        html.includes("Hello World"),
        "post sharing a hashtag not suggested"
      );
    });
  });
});
