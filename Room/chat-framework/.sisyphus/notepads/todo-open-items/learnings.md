## 2026-05-12T08:54:43Z Task: initialization
- Single-file renderer currently leaks remark/displayName into avatar modal via `data-name`; modal should instead use canonical `profile.name`.
- Non-modal display surfaces already largely use `aliases.contacts` fallback to `name`; preserve that behavior.
- Build-root semantics are current-behavior-only: single-file relative to markdown dir, folder mode relative to inputDir.
- 2026-05-12T08:54:43Z: `load-conversation.js` normalizes `profile.name`, `nickName`, and `aliases.contacts`, so renderer can rely on canonical `name` for modal headers while keeping remark-first display from `resolveDisplayName()`.
- 2026-05-12T00:00:00Z: Multi-renderer avatar buttons should carry canonical `profile.name` in `data-name`, while `data-nick-name` can preserve remark-first display text for modal body labels.
- 2026-05-12T00:00:00Z: CLI/help text now states the root-resolution contract explicitly for both single-file and folder builds, without changing any resolution logic.

## [2026-05-12] README Update Patterns
- Documented the distinction between `profile.name` (canonical nickname for avatar modal) and `aliases.contacts` (remark for display surfaces).
- Explicitly defined path resolution rules: single-file build resolves relative to markdown file; folder build resolves relative to inputDir.
- Verified that the updated README terminology matches the implementation in `src/renderer.js`, `src/build.js`, and `src/build-folder.js`.
2026-05-12: Updated docs/chat-format-and-config-spec.md to align with canonical nickname vs remark semantics and explicit path resolution rules. Terminology is now consistent with README and implementation.
2026-05-12: Narrowed Section 7 ('路径解析规则') in docs/chat-format-and-config-spec.md to only document approved root-resolution semantics (profiles, ui.yml, story.yml, chatFiles, groupChats relative to inputDir; frontmatter paths relative to markdown dir). Removed over-broad claims about general YAML/message resource paths to maintain strict alignment with the plan.
2026-05-12: Final Verification Wave passed after re-running F4. Consolidated verdicts: F1 APPROVE, F2 APPROVE, F3 APPROVE, F4 APPROVE.
