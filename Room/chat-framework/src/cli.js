#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CLI dispatcher for chat-framework
// Usage:
//   chat-framework build <input.md> <output.html>
//   chat-framework build:folder <input-folder> <output.html>
// Root semantics:
//   build -> relative frontmatter paths (profiles/chat/articles) resolve from the markdown file directory
//   build:folder -> profiles/, profiles.yml, ui.yml, story.yml, chatFiles, and groupChats resolve from inputDir

async function run() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  try {
    if (cmd === "build") {
      const [_, input, output] = argv;
      if (!input || !output) {
        console.error("Usage: chat-framework build <input.md> <output.html>");
        console.error("Single-file root semantics: relative frontmatter paths such as profiles, chat, and articles resolve from the input markdown file's directory.");
        process.exit(1);
      }
      const { default: buildModule } = await import(path.join(__dirname, "build.js"));
      // build.js exports buildSingle as a top-level function; call it if present
      if (typeof buildModule === "function") {
        // build.js used default export unexpectedly; support fallback
        buildModule(input, output);
      } else if (buildModule && typeof buildModule.buildSingle === "function") {
        buildModule.buildSingle(input, output);
      } else {
        // Try named import
        const mod = await import(path.join(__dirname, "build.js"));
        if (typeof mod.buildSingle === "function") mod.buildSingle(input, output);
        else throw new Error("buildSingle not found in build.js");
      }
      return;
    }

    if (cmd === "build:folder" || cmd === "build-folder") {
      const [_, input, output] = argv;
      if (!input || !output) {
        console.error("Usage: chat-framework build:folder <input-folder> <output.html>");
        console.error("Folder-build root semantics: profiles/, profiles.yml, ui.yml, story.yml, chatFiles, and groupChats resolve from the provided inputDir.");
        process.exit(1);
      }
      const mod = await import(path.join(__dirname, "build-folder.js"));
      if (typeof mod.buildFolder === "function") {
        mod.buildFolder(input, output);
      } else {
        throw new Error("buildFolder not found in build-folder.js");
      }
      return;
    }

    console.error('Unknown command. Available: build, build:folder');
    process.exit(1);
  } catch (err) {
    console.error(err && err.message ? err.message : String(err));
    process.exit(2);
  }
}

run();
