import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

  describe("2-column structure", () => {
    it("CSS contains the sidenote grid", () => {
      const css = readFileSync(join(SITE, "css", "style.css"), "utf-8");
      assert.ok(
        css.includes("grid-template-columns"),
        "grid-template-columns rule missing"
      );
    });
  });

  describe("Drop-in workflow", () => {
    const tempPost = join(ROOT, "src", "posts", "__test_dropin.md");
    const tempOutput = join(SITE, "posts", "__test_dropin", "index.html");

    after(() => {
      if (existsSync(tempPost)) unlinkSync(tempPost);
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
  });
});
