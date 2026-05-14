import fs from "fs";
import path from "path";
import { loadConversationFromMarkdown } from "./load-conversation.js";
import { renderHtml } from "./renderer.js";

/**
 * Build one chat markdown into one HTML page.
 *
 * @param {string} inputMd - Chat markdown file path.
 * @param {string} outputHtml - Output HTML path.
 * @returns {void}
 *
 * @example
 * buildSingle('examples/chat.md', 'dist/index.html')
 */
export function buildSingle(inputMd, outputHtml) {
  const conv = loadConversationFromMarkdown(inputMd);

  const html = renderHtml({
    frontmatter: conv.frontmatter,
    profiles: conv.profiles,
    articles: conv.articles,
    chat: conv.chat,
    messages: conv.messages
  });

  fs.mkdirSync(path.dirname(outputHtml), { recursive: true });
  fs.writeFileSync(outputHtml, html, "utf-8");
  console.log(`Built: ${outputHtml}`);
}

/**
 * CLI entry for single-file build.
 *
 * @returns {void}
 *
 * @example
 * node src/build.js examples/chat.md dist/index.html
 */
function main() {
  try {
    const [inputMd, outputHtml] = process.argv.slice(2);
    if (!inputMd || !outputHtml) {
      console.error("Usage: node src/build.js <input.md> <output.html>");
      console.error("Single-file root semantics: relative frontmatter paths such as profiles, chat, and articles resolve from the input markdown file's directory.");
      process.exit(1);
    }
    buildSingle(inputMd, outputHtml);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[build-error] ${reason}`);
    process.exit(1);
  }
}

// Support being imported as a module without executing CLI.
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main();
}
