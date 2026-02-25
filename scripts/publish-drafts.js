import { readdir, readFile, writeFile, unlink, access } from "node:fs/promises";
import { join, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = join(__dirname, "..", "drafts");
const POSTS_DIR = join(__dirname, "..", "src", "posts");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHashtags(content) {
  const firstLine = content.split("\n")[0].trim();
  const match = firstLine.match(/^(#\w+\s*)+$/);
  if (!match) return { hashtags: [], body: content };

  const hashtags = firstLine
    .split(/\s+/)
    .map((tag) => tag.replace(/^#/, ""))
    .filter(Boolean);

  const body = content.slice(content.indexOf("\n") + 1);
  return { hashtags, body };
}

function normalizeHeaders(body) {
  return body.replace(/^###\s/gm, "## ");
}

function titleFromFilename(filename) {
  const name = basename(filename, extname(filename));
  return name.replace(/&/g, "and");
}

function buildFrontmatter(title, hashtags) {
  const date = new Date().toISOString().split("T")[0];
  let fm = `---\ntitle: "${title}"\ndate: ${date}\ntags: post\nlayout: post.njk\n`;
  if (hashtags.length > 0) {
    fm += "hashtags:\n";
    for (const tag of hashtags) {
      fm += `  - ${tag}\n`;
    }
  }
  fm += "---\n";
  return fm;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const files = (await readdir(DRAFTS_DIR)).filter(
    (f) => extname(f).toLowerCase() === ".md"
  );

  if (files.length === 0) {
    console.log("No drafts to publish.");
    return;
  }

  let published = 0;

  for (const file of files) {
    const slug = slugify(basename(file, extname(file)));
    const destPath = join(POSTS_DIR, `${slug}.md`);

    if (await fileExists(destPath)) {
      console.log(`Skipping "${file}" — ${slug}.md already exists in posts.`);
      continue;
    }

    const raw = await readFile(join(DRAFTS_DIR, file), "utf-8");
    const { hashtags, body } = extractHashtags(raw);
    const title = titleFromFilename(file);
    const normalized = normalizeHeaders(body);
    const frontmatter = buildFrontmatter(title, hashtags);

    await writeFile(destPath, frontmatter + "\n" + normalized.trimStart(), "utf-8");
    await unlink(join(DRAFTS_DIR, file));

    console.log(`Published: ${file} → src/posts/${slug}.md`);
    published++;
  }

  console.log(`Done. ${published} post(s) published.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
