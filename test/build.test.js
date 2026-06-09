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
    it("exists and contains the top menu", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("casruta"), "site title missing");
      assert.ok(html.includes("Writing"), "Writing link missing");
      assert.ok(html.includes("About"), "About link missing");
    });

    it("contains a post list", () => {
      const html = readFileSync(join(SITE, "index.html"), "utf-8");
      assert.ok(html.includes("post-list"), "post-list class missing");
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

  describe("Single-column structure", () => {
    it("CSS uses a single-column layout with the editorial serif", () => {
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.ok(
        !css.includes("column-count: 2"),
        "two-column rule should be removed"
      );
      assert.ok(css.includes('"Alegreya"'), "Alegreya font missing");
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
  });
});
