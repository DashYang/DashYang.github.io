# Complete TODO Open Items: remark-vs-name and build-root clarification

## TL;DR
> **Summary**: Finish the last two `TODO.md` items by making display-name behavior consistent across single-chat and multi-chat renderers, then documenting the existing build-root semantics instead of changing path resolution behavior.
> **Deliverables**:
> - Canonical “昵称 vs 备注” rendering rules implemented everywhere relevant
> - Avatar modal always shows `profile.name`, never contact remark
> - README/spec/CLI guidance updated to explain build-root semantics
> - Existing build commands used as regression evidence
> **Effort**: Short
> **Parallel**: YES - 2 waves
> **Critical Path**: 1/2/3 → 4/5 → Final Verification

## Context
### Original Request
完成 `TODO.md` 中未完成的事项。

### Interview Summary
- Open item 1: “昵称和备注是分开的，点开头像显示的是昵称，就是profile配置的name，其他时候如果有备注显示备注”。
- Open item 2: “编译的时候应用的根目录是哪里？”。
- User decision: do **not** change build-root semantics; document the current behavior.
- User decision: verification uses existing build regression only; do not add test infrastructure.

### Metis Review (gaps addressed)
- Skipped by explicit user instruction.
- Guardrails were derived from repo facts instead: do not change path-resolution semantics, do not introduce new config concepts, do not broaden scope beyond the two TODO items.

## Work Objectives
### Core Objective
Close the last two TODOs by making the renderer honor “`profile.name` = nickname, `aliases.contacts` = remark” consistently, and by making build path resolution understandable from code-facing messages and repo documentation.

### Deliverables
- Updated single-chat renderer naming behavior in `src/renderer.js`
- Updated multi-chat renderer naming behavior in `src/multi-renderer.js`
- Clarified build usage/error text in CLI/build entrypoints
- Updated README and spec documentation for naming semantics and root resolution semantics

### Definition of Done (verifiable conditions with commands)
- `npm run build` succeeds.
- `npm run build:folder` succeeds.
- `npm run build:showcase` succeeds.
- Generated HTML from showcase demonstrates: avatar modal title uses `profile.name`, while message/list/recall/title surfaces prefer remark where configured.
- Repo docs explicitly state which directory relative paths are resolved from in single-file build and folder build.

### Must Have
- Avatar modal title source is the profile owner’s canonical nickname (`profile.name`).
- Non-modal display surfaces use contact remark when available, otherwise fall back to `profile.name`.
- Single-chat and multi-chat behavior match each other.
- Build-root explanation is explicit in both user docs and CLI-facing guidance.

### Must NOT Have
- Must NOT change path resolution to `process.cwd()`.
- Must NOT add a new `root` CLI flag.
- Must NOT add a new test framework.
- Must NOT reinterpret `aliases.contacts` as anything other than remark/display override.
- Must NOT leave any renderer surface using remark in avatar modal or using raw `name` where remark should appear.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + existing build scripts only
- QA policy: Every task includes agent-executed scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. Shared semantics are fixed first, then docs are updated against the finalized behavior.

Wave 1: Tasks 1, 2, 3
Wave 2: Tasks 4, 5

### Dependency Matrix (full, all tasks)
- Task 1: Blocks none | Blocked by none
- Task 2: Blocks none | Blocked by none
- Task 3: Blocks 4, 5 | Blocked by none
- Task 4: Blocks final verification | Blocked by 1, 2, 3
- Task 5: Blocks final verification | Blocked by 1, 2, 3
- F1-F4: Blocked by 1-5

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 3 tasks → quick, unspecified-low
- Wave 2 → 2 tasks → writing, quick
- Final Verification → 4 tasks → oracle, unspecified-high, deep

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Fix single-chat renderer name/remark contract

  **What to do**: Update `src/renderer.js` so every single-chat display surface follows one contract: avatar modal uses the clicked profile’s canonical nickname (`profile.name`), while message meta, recall text, quote sender name, and single-chat subtitle/title-facing display keep using remark-first logic (`aliases.contacts[senderId]` fallback to `name`). Replace the current avatar button dataset mapping that sends `displayName` into `data-name` and reuses `displayName` for `data-nick-name`, because that is what currently leaks remark into the modal.
  **Must NOT do**: Do not change unrelated card rendering, do not change contact-card payload semantics unless needed for consistency, and do not introduce a new profile schema.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: isolated renderer logic in a single source file
  - Skills: [] - no special skill required
  - Omitted: [`playwright`] - implementation task only; browser QA is in scenario section

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `src/renderer.js:176-184` - existing remark-first `resolveDisplayName` helper
  - Pattern: `src/renderer.js:289-308` - single-chat message row currently mixes `displayName` into avatar dataset
  - Pattern: `src/renderer.js:396-400` - modal currently renders `btn.dataset.name` and `btn.dataset.nickName`
  - API/Type: `src/load-conversation.js:42-63` - normalized profile shape includes `name`, `nickName`, `aliases`
  - Doc reference: `TODO.md:21-22` - exact unfinished item wording

  **Acceptance Criteria** (agent-executable only):
  - [ ] In `src/renderer.js`, avatar modal data source for modal title is profile `name`, not remark/displayName.
  - [ ] In `src/renderer.js`, message meta / quote / recall / subtitle surfaces still prefer remark when `aliases.contacts` exists.
  - [ ] `npm run build` completes successfully after the change.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Single-chat remark stays outside modal
    Tool: Bash
    Steps: Run `npm run build`; open `dist/index.html`; inspect generated HTML/embedded data for avatar button dataset and visible message meta strings tied to a contact with remark configuration.
    Expected: Modal-facing dataset contains canonical profile name; display text surfaces still show remark-first output where configured.
    Evidence: .sisyphus/evidence/task-1-single-renderer.txt

  Scenario: Single-chat fallback without remark
    Tool: Bash
    Steps: Run `npm run build`; inspect a sender without `aliases.contacts` override in the generated output.
    Expected: Non-modal display falls back to `profile.name`; no blank sender labels are introduced.
    Evidence: .sisyphus/evidence/task-1-single-renderer-fallback.txt
  ```

  **Commit**: NO | Message: `fix(renderer): separate remark and nickname display` | Files: [`src/renderer.js`]

- [x] 2. Fix multi-chat renderer parity for name/remark behavior

  **What to do**: Update `src/multi-renderer.js` so list title logic, in-chat message meta, recall text, quote sender names, and single-chat conversation titles remain remark-first, but avatar modal always opens with canonical `profile.name`. Ensure the runtime helper and avatar dataset contract match Task 1, so single-file and folder builds behave identically.
  **Must NOT do**: Do not change timeline/stage logic, unread badge logic, account unlock logic, article/moment filtering, or any unrelated multi-chat runtime behavior.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: focused logic change in one large file with known anchor points
  - Skills: [] - no special skill required
  - Omitted: [`playwright`] - implementation task only; browser QA is captured below

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `src/multi-renderer.js:1145-1155` - single-chat conversation title already uses remark-first contact alias
  - Pattern: `src/multi-renderer.js:1273-1277` - profile modal runtime currently reads `data.name` / `data.nickName`
  - Pattern: `src/multi-renderer.js:1285-1297` - runtime remark-first display helper and recall text
  - Pattern: `src/multi-renderer.js:1373-1392` - message row currently sends displayName into avatar dataset
  - Example data: `examples/showcase/profiles/protagonist.yml:1-23` - has both canonical names and contact remarks (`sister`, `admin`)
  - Example data: `examples/showcase/profiles/sister.yml:1-18` - has reverse contact remark (`protagonist: 弟弟`)

  **Acceptance Criteria** (agent-executable only):
  - [ ] Multi-chat avatar modal title source is canonical `profile.name` for clicked user.
  - [ ] Multi-chat list/message/recall/title surfaces still prefer `aliases.contacts` where configured.
  - [ ] `npm run build:showcase` completes successfully after the change.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Showcase modal vs remark separation
    Tool: Playwright
    Steps: Build showcase; open `dist/showcase-wechat-hub.html`; enter a conversation where protagonist has a contact remark for `sister` or `admin`; verify visible chat/list label uses the remark, then click avatar.
    Expected: List/chat label shows configured remark (for example `老姐` or `物业小雅（备注）`), while the modal title shows the clicked profile's canonical `name` (`姐姐` or `物业小雅`).
    Evidence: .sisyphus/evidence/task-2-multi-renderer.png

  Scenario: Reverse-account fallback still works
    Tool: Playwright
    Steps: In showcase, switch to sister account after unlock or use seeded visible sister conversation; inspect protagonist label and avatar modal.
    Expected: Sister-facing non-modal display uses remark `弟弟`, while avatar modal title for protagonist uses canonical `奋斗的西瓜`.
    Evidence: .sisyphus/evidence/task-2-multi-renderer-reverse.png
  ```

  **Commit**: NO | Message: `fix(multi-renderer): keep remarks out of avatar modal` | Files: [`src/multi-renderer.js`]

- [x] 3. Clarify build-root semantics in CLI/help/error surfaces

  **What to do**: Update user-facing usage/help/error messaging in `src/build.js`, `src/build-folder.js`, and `src/cli.js` so the repo explicitly communicates current root semantics instead of leaving them implicit. Single-file build guidance must say frontmatter relative paths (`profiles`, `chat`, `articles`) resolve from the input markdown file’s directory. Folder-build guidance must say `profiles/`, `profiles.yml`, `ui.yml`, `story.yml`, `chatFiles`, and `groupChats` resolve from the provided `inputDir`.
  **Must NOT do**: Do not change the actual `path.resolve(...)` behavior. This task is documentation/help-text clarification only.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: narrow CLI/help text update across a few small files
  - Skills: [] - no special skill required
  - Omitted: [`git-master`] - no git operation requested

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - API/Type: `src/load-conversation.js:144-159` - single-file relative resolution source of truth
  - API/Type: `src/build-folder.js:34-56` - folder build orchestration source of truth
  - API/Type: `src/build-folder.js:65-70` - folder profiles discovery relative to `inputDir`
  - API/Type: `src/build-folder.js:73-90` - `chatFiles` and `groupChats` resolved from `inputDir`
  - Pattern: `src/build.js:40-50` - current single-build usage/error message
  - Pattern: `src/build-folder.js:130-141` - current folder-build usage/error message
  - Pattern: `src/cli.js:17-55` - top-level CLI usage dispatch
  - Script surface: `package.json:9-16` - current build entry commands users actually run

  **Acceptance Criteria** (agent-executable only):
  - [ ] CLI/build usage text explicitly states current root-resolution semantics for single-file and folder build.
  - [ ] No code path changes relative-path behavior.
  - [ ] `npm run build` and `npm run build:folder` still succeed after the wording updates.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Usage text explains root semantics
    Tool: Bash
    Steps: Run `node src/build.js` with missing args and `node src/build-folder.js` with missing args; capture stderr.
    Expected: Output explicitly says which directory relative resources are resolved from for each mode.
    Evidence: .sisyphus/evidence/task-3-cli-help.txt

  Scenario: Existing semantics remain unchanged
    Tool: Bash
    Steps: Run `npm run build` and `npm run build:folder` using existing example inputs.
    Expected: Both commands still succeed without requiring path changes in example data.
    Evidence: .sisyphus/evidence/task-3-build-regression.txt
  ```

  **Commit**: NO | Message: `docs(cli): clarify build root semantics` | Files: [`src/build.js`, `src/build-folder.js`, `src/cli.js`]

- [x] 4. Update README for canonical nickname/remark and build-root rules

  **What to do**: Revise `README.md` so it clearly states: `profile.name` is the canonical nickname shown in avatar modal; `aliases.contacts[对方id]` is a remark used in normal conversation/list/title surfaces; and relative path resolution differs by build mode (single-file relative to input markdown directory, folder mode relative to `inputDir`). Update any stale wording that still implies avatar click only shows “name/bio” without explaining remark separation or that leaves build-root semantics implicit.
  **Must NOT do**: Do not introduce new configuration names or contradict implemented behavior.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: README wording precision matters more than code complexity
  - Skills: [] - no special skill required
  - Omitted: [`playwright`] - docs-only task

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: final verification | Blocked By: 1, 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `README.md:45-79` - current avatar/alias wording to revise
  - Pattern: `README.md:81-89` - folder-build overview where root semantics should be made explicit
  - Source of truth: `src/renderer.js:176-184` - single renderer remark-first logic
  - Source of truth: `src/load-conversation.js:146-159` - single-file root semantics
  - Source of truth: `src/build-folder.js:35-56` and `src/build-folder.js:73-90` - folder root semantics

  **Acceptance Criteria** (agent-executable only):
  - [ ] README explicitly distinguishes nickname (`name`) from remark (`aliases.contacts`).
  - [ ] README explicitly states relative-path roots for both build modes.
  - [ ] README wording matches the implemented renderer behavior.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: README rule text matches code behavior
    Tool: Bash
    Steps: Inspect README sections after update and compare against `src/renderer.js`, `src/multi-renderer.js`, `src/load-conversation.js`, and `src/build-folder.js`.
    Expected: No contradiction between README wording and code-path behavior.
    Evidence: .sisyphus/evidence/task-4-readme-audit.txt

  Scenario: Build instructions remain runnable
    Tool: Bash
    Steps: Run the README-listed build commands that cover single and folder modes.
    Expected: Commands in README still execute successfully without extra undocumented flags.
    Evidence: .sisyphus/evidence/task-4-readme-build.txt
  ```

  **Commit**: NO | Message: `docs(readme): explain remarks and build roots` | Files: [`README.md`]

- [x] 5. Update formal spec to encode the same semantics

  **What to do**: Revise `docs/chat-format-and-config-spec.md` so the formal configuration spec matches the chosen behavior: `users.<id>.name` is the canonical nickname, `aliases.contacts` is remark/显示备注, avatar click shows the profile’s canonical nickname rather than remark, and path references are resolved from the input markdown directory or `inputDir` depending on build mode. Remove or reword any stale language that treats `name` as a generic display label without distinguishing remark precedence.
  **Must NOT do**: Do not let spec wording diverge from README or renderer implementation.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: formal spec update with strict terminology
  - Skills: [] - no special skill required
  - Omitted: [`playwright`] - docs-only task

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: final verification | Blocked By: 1, 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `docs/chat-format-and-config-spec.md:184-212` - current profile-field wording to revise
  - Pattern: `docs/chat-format-and-config-spec.md:222-242` - alias example that should be aligned with remark terminology
  - Source of truth: `TODO.md:21-22` - final unfinished-item requirements
  - Source of truth: `src/load-conversation.js:42-63` - normalized profile fields
  - Source of truth: `src/load-conversation.js:146-159` and `src/build-folder.js:73-90` - actual path-resolution semantics

  **Acceptance Criteria** (agent-executable only):
  - [ ] Spec defines `name` as canonical nickname and `aliases.contacts` as remark override.
  - [ ] Spec describes avatar modal vs non-modal display behavior consistently.
  - [ ] Spec describes build-root semantics without implying `cwd` resolution.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Spec terminology is internally consistent
    Tool: Bash
    Steps: Read the updated profile and build sections in the spec and check for contradictory use of “显示名 / 昵称 / 备注 / 根目录”.
    Expected: Terms are used consistently and match the implemented behavior.
    Evidence: .sisyphus/evidence/task-5-spec-audit.txt

  Scenario: Spec matches examples and code
    Tool: Bash
    Steps: Compare spec examples against `examples/showcase/profiles/protagonist.yml`, `examples/showcase/profiles/sister.yml`, `src/load-conversation.js`, and `src/build-folder.js`.
    Expected: Example aliases and path rules described in the spec are realizable with current code.
    Evidence: .sisyphus/evidence/task-5-spec-code-alignment.txt
  ```

  **Commit**: NO | Message: `docs(spec): define nickname remark and root rules` | Files: [`docs/chat-format-and-config-spec.md`]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- Preferred: one final commit after Tasks 1-5 and before final verification reruns if needed.
- Suggested message: `fix(display): separate nickname remarks and clarify build roots`
- Do not create intermediate commits unless the executor is explicitly asked to do so.

## Success Criteria
- Both TODO items at `TODO.md:21-22` are implementable with no unresolved judgment calls.
- Single-chat and multi-chat rendering rules are identical for nickname vs remark semantics.
- Existing path resolution behavior is preserved and clearly documented.
- Regression builds (`build`, `build:folder`, `build:showcase`) succeed.
- Final reviewers can validate the work without needing clarification from the planner.
