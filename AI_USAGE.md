# AI Usage Documentation — Arrow Maze Client

This document records how generative-AI tools were used while building this repository, as required by
Section 7 of the project brief. **The team is fully responsible for all delivered code**, AI-assisted or
not, and is able to explain every file, pattern and decision during the defense.

---

## 1. Tools Used

| Tool | Model / Version | Role in the workflow |
| --- | --- | --- |
| Claude Code | Claude Opus 4.8 (early phases), Claude Fable 5 (later sessions) | Pair-programming agent: scaffolding, code generation, test generation, refactoring, documentation, and running the type-checker/tests in the terminal. |

**Workflow.** The team worked in small, reviewed increments. For each task the team set the goal and the
constraints (React Native + Expo, Clean Architecture, framework-free domain, SOLID, named GoF patterns,
library-free AOP, AAA tests with the `should_..._when_...` convention). The AI implemented it, the team
reviewed the diff and ran `tsc` + Jest, and each block was merged via a Pull Request. Commits follow
Conventional Commits with a `Co-Authored-By: Claude` trailer for traceability.

---

## 2. Usage Log (per significant task)

### Entry 001 — Project planning and documentation scaffolding

- **Date:** 2026-06-17
- **Task:** Decide the stack and create the README, AI_USAGE, CONTRIBUTING, license and `/docs` structure.
- **Prompt (paraphrased):** "Here is the Arrow Maze brief and our class + Clean Architecture diagrams. The
  mechanic is: tap an arrow to slide it off the board; if blocked by another arrow, lose a life (3 lives).
  Help with the rest, starting with documentation. Stack: React Native + Expo."
- **Result:** Documentation set and a stack decision (Expo + TypeScript).
- **Team modifications / decision:** The brief says cells "rotate," but the team confirmed the real mechanic
  is **slide-out-or-lose-a-life**, which drove the domain design (`PathTraversalService` + `GameSession`).
- **Lessons / limitations:** A "planned" README drifts from the build; we re-aligned it later (Entry 010).

### Entry 002 — Domain layer (Layer 1) + Factory Method

- **Task:** Pure-TypeScript domain: `Direction`/`Position`/`Lives`/`Score` value objects, the `Cell`
  hierarchy, `Board`, `GameSession` (the tap rule), `PathTraversalService`, plus the `JsonCellFactory`
  (Factory Method) and AAA unit tests.
- **Prompt (paraphrased):** "Implement Layer 1 with no framework imports; encode the slide-out rule and the
  3-lives logic; add a cell factory and AAA tests named `should_..._when_...`."
- **Result:** 50 tests passing, ~95% coverage on the domain.
- **Team modifications:** Decided to test the domain with **ts-jest in a Node environment** (no React
  Native), proving the inner layers are framework-decoupled.
- **Lessons / limitations:** `expo/tsconfig.base` does not auto-include Jest types — added
  `"types": ["jest","react"]` to `tsconfig.json`.

### Entry 003 — Use cases (Layer 2) + domain events

- **Task:** `UseCase<I,O>` port, `IEventPublisher`/`ILevelRepository`/`IObserver` ports, domain events, and
  `TapCellUseCase` (publishes events) + `LoadLevelUseCase`, with AAA tests using fakes.
- **Result:** Use cases orchestrate the domain and notify observers; tests green.
- **Team modifications:** Confirmed the Dependency-Inversion shape (use cases depend only on ports).

### Entry 004 — Builder + Observer; the 15 levels

- **Task:** `JsonLevelBuilder` (Builder), `InMemoryEventBus` (Observer), then 15 progressive levels and a
  `BundledLevelRepository`.
- **Prompt (paraphrased):** "Build levels step by step from JSON; author 15 progressive, solvable levels;
  prove solvability with a test."
- **Result:** Levels + a **greedy solver test** that certifies every level is fully clearable.
- **Incorrect AI output caught:** The solver test **failed on 2 of the 15 levels** — the AI had created
  configurations where arrows blocked each other in a cycle (deadlock). The fix (making a corner arrow exit
  directly) was applied and verified. _This is the clearest example of tests catching AI mistakes._

### Entry 005 — AOP decorators

- **Task:** Library-free AOP via the Decorator pattern over `UseCase<I,O>`:
  `Logging`/`Metrics`/`ExceptionHandling` decorators with injected `ILogger`/`IClock`/`IMetricsRecorder`.
- **Result:** 3 aspects + a composition test stacking all three over the real `TapCellUseCase`.
- **Team modifications:** Reviewed that the business code never references a logger/clock/error handler.

### Entry 006 — Scoring (Strategy) + local persistence

- **Task:** `IScoringStrategy`/`StandardScoringStrategy`, `PlayerProgress`, persistence ports
  (`IProgressRepository`/`IKeyValueStorage`), `LocalProgressRepository`, `AsyncStorageKeyValue`, and the
  `RecordLevelResult`/`GetProgress` use cases.
- **Result:** Scoring + progress persistence behind ports; tests green.
- **Team modifications:** Confirmed corrupt/missing storage falls back to empty progress (never crashes).

### Entry 007 — React Native UI + Composition Root + widget tests

- **Task:** DI container (Composition Root wiring all use cases with the AOP decorators), navigation,
  screens (Home / Level Select / Game with victory & defeat overlays), the `useGame` view-model hook, and
  widget tests.
- **Result:** A playable, navigable app; 135 tests; verified the app bundles for Android via `expo export`.
- **Incorrect AI output caught:** The first widget tests failed because in **React Native Testing Library
  v14, `render`/`fireEvent` are async** (the AI initially wrote them synchronously). Switching to
  `await render(...)` fixed it. Also configured Jest with **two projects** (ts-jest for logic, jest-expo
  for UI).

### Entry 008 — i18n (ES/EN) + audio with mute

- **Task:** In-app translations with a pure `translate()` and `I18nProvider`; an audio architecture
  (`IAudioService`, `AudioManager` singleton with mute, `AudioObserver`) and a mute toggle.
- **Result:** All screens localized with a language toggle; full audio control wired through the event bus.
- **Honest limitation:** **No real sound-asset files yet** — the engine is a `NoopAudioService`. The mute /
  Singleton / Observer architecture is complete and tested; the team must add royalty-free sound files and
  an asset-backed engine via `AudioManager.useEngine(...)`.

### Entry 009 — CI/CD

- **Task:** GitHub Actions workflow running `npm ci` → `npm run typecheck` → `npm test` on push and PR.
- **Result:** CI on every PR; live status badge in the README. The exact CI commands were verified locally.

### Entry 010 — README re-alignment

- **Task:** Rewrite the README so the patterns, SOLID and AOP sections reflect the real code.
- **Result:** Removed patterns that were never implemented (Facade/Command/State/Template Method), corrected
  the ISP example, and linked every claim to an actual source file (links verified to resolve).

### Entry 011 — Backend integration + online UI

- **Task:** HTTP client, REST adapters (auth/leaderboard/progress), session persistence, and the
  Login/Leaderboard screens with score sync on victory.
- **Prompt (paraphrased):** "Integrate the NestJS backend behind ports: FetchHttpClient, Rest* adapters,
  SessionStore on AsyncStorage; login/register UI and a leaderboard screen; best-effort score sync."
- **Result:** Online features behind the same port abstractions; widget tests with a fully faked container.
- **Lessons:** RNTL v14 needs `await render/fireEvent`; the composition root importing AsyncStorage forces a
  jest mock for every widget test that touches the container.

### Entry 012 — Multi-cell arrows + solvable-by-construction generator

- **Task:** Arrows spanning several cells (slide as a block) and a deterministic level generator that is
  provably solvable, replacing hand-authored sparse levels with 15 dense progressive ones.
- **Prompt (paraphrased):** "Cells sharing an arrowId form one arrow; generate levels by placing an arrow
  only if its head-to-edge lane is clear, so reverse order always solves."
- **Result:** `Board.headOfArrow/clearArrow`, seeded PRNG generator, greedy-solver oracle test over all levels.
- **Team modifications:** Curated the 15 seeds/sizes; the solver test is the acceptance gate.

### Entry 013 — Brief 1.1 board elements: walls, time limit, collectibles

- **Task:** The three missing 1.1 mechanics, preserving generator solvability.
- **Result:** Walls placed BEFORE arrows (lanes stay wall-free ⇒ solvability holds), HARD-level countdown
  with `GameSession.timeUp()`, and collectible stars swept by escaping arrows (+50 each in scoring).
- **Team modifications / fix:** The AI's first star-placement strategy (drop stars on leftover empty cells)
  produced almost zero placeable stars — the data inspection showed why (cells left empty are rarely on an
  exit lane). It was redesigned to RESERVE star spots before the arrows are placed.
- **Lessons:** Generative changes need data-level verification (counts per level), not just green tests.

### Entry 014 — Auth aspect, overall leaderboard, cache aspect

- **Task:** Automatic active-session verification before auth-required use cases (brief 3.4), the per-level /
  total leaderboard toggle, and the result-caching aspect — completing all five suggested aspects.
- **Result:** `AuthenticationUseCaseDecorator` + `ISessionSource`, `GetOverallLeaderboardUseCase` (SQL
  SUM/GROUP BY server-side), `CachingUseCaseDecorator` (TTL via the injected clock).
- **Team modifications:** Kept the backend leaderboard endpoint public by design — the client enforces the
  session rule at the use-case layer, which is what the brief asks for.

### Entry 015 — Test hardening + Pact consumer contract

- **Task:** Enforce the `should_[result]_when_[condition]` convention suite-wide, add Router-level
  navigation flow tests (home → level → victory; defeat → retry), and record the client↔backend contract.
- **Result:** 89 tests renamed across both repos (0 non-conforming, verified by grep); 7 Pact interactions
  generated by running the real REST adapters against a Pact mock provider.
- **Team modifications / fix:** The first levels contract required `direction`/`arrowId` on EVERY cell;
  provider verification failed because walls/stars don't carry them. The contract was corrected to pin only
  the keys common to all cell kinds — exactly the class of bug contract testing exists to catch.

### Entry 016 — Real audio, screenshots, diagram sources

- **Task:** Replace the no-op audio engine with real sound, capture the README screenshots, and produce the
  editable PlantUML sources required by section 4.
- **Result:** Five WAVs synthesized from scratch by a script (no licensing risk), `ExpoAudioService`
  (expo-audio) plugged into the AudioManager singleton; an automated Chrome session played and beat level 1
  to capture Home/LevelSelect/Gameplay/Victory; `.puml` sources re-rendered to the committed PNGs.
- **Lessons:** PlantUML quirks were caught only by LOOKING at the rendered output (creole `--` strikethrough,
  the 4096-px render limit truncating a diagram) — visual artifacts need visual review.

### Entry 017 — Android delivery: EAS builds, emulator, per-user progress

- **Task:** Ship signed APKs (EAS Build with a local keystore), run and verify the game on an Android
  emulator end-to-end against both PostgreSQL databases (local and Neon), and make level unlocks belong to
  the signed-in ACCOUNT instead of the device (per-user storage keys + progress pull on login).
- **Result:** Releases v1.0.0–v1.3.0 on GitHub; per-user `LocalProgressRepository` keys, the
  `PullRemoteProgressUseCase` (wrapped by the auth aspect) and a home-screen leaderboard with a level picker.
- **Lessons:** Android specifics (cleartext HTTP in release builds, the status-bar gesture zone swallowing
  taps) only surfaced on a REAL device image — emulator verification became part of the definition of done.

### Entry 018 — Winding arrows, rail-glide animation and hole mechanics

- **Task:** Rework arrows into winding multi-cell snakes like the original game (per-cell direction +
  `segmentIndex`), rebuild the escape animation as a constant-speed sliding window over an SVG rail, and
  make holes real: they swallow arrows, end the star sweep, and act as escape hatches past blockers.
- **Result:** A generator that stays solvable-by-construction while banning self-crossing lanes and dead
  holes (validated by invariant tests + deterministic seed retries), adjacency-aware arrow colouring, a
  flight queue for simultaneous escapes, ghost stars with a collect chime, and a volume slider.
- **Lessons (AI mistakes caught):** the AI's first `JsonLevelBuilder` silently DROPPED the new
  `segmentIndex` field — every level became unsolvable, and only the solver-oracle test exposed it; the
  fold-back arrows ("an arrow pointing at itself") looked fine to every unit test and were caught by
  playing the game and LOOKING at the board; an `Animated`-driven test flaked only on slow CI runners and
  was fixed by mocking the animation clock in the test setup.

### Entry 019 — Level 16: the 3D cube (design-first, PR by PR, domain untouched)

- **Date:** 2026-07-13
- **Task:** Add level 16 played on the surface of a cube — six faces, free 360° orbit, tap arrows on any
  visible face, escape flights in 3D — **without modifying a single line of `src/domain/`**. The team
  ran this as a disciplined sequence: design document first (no code), then five reviewed PRs, each gated
  by a human play-test.
- **Actual prompts (abridged, key lines verbatim):**
  1. *Design brief:* "Read this repository before writing anything. […] GOAL: add a level 16 played on a
     CUBE. […] **HARD CONSTRAINT — this is not negotiable: DO NOT MODIFY ANY FILE UNDER `src/domain/`.
     Not one line.** […] A cube is NOT a business rule. It is a PROJECTION. […] Lay the six faces out ON
     THE DIAGONAL of a single flat Board of size 6N x 6N. […] If two faces shared a row band or a column
     band, an arrow on one face could be blocked by an arrow on another — which this game never does.
     […] Deliverable for THIS message: NO CODE."
  2. *Blocking correction after the design:* "**BLOCKING — you missed the risk I was fishing for.
     ARROW IDS COLLIDE ACROSS FACES.** `generateLevel` numbers arrows from 1 on EVERY face, and `Board`
     treats `arrowId` as GLOBAL. […] `isCleared()` declares VICTORY once one face is clear. Nothing
     throws. The game is just wrong. […] it is not a spatial problem — it is an identity problem."
  3. *Identity invariant placement:* "Id uniqueness is the SAME KIND of invariant as geometric
     disjointness […] Identity must live in the same place, with the same treatment. […] Do not clamp,
     do not modulo — **throw**." (Plus the caveat: never write `if (!layout.faceAt(r, c))` — FRONT is
     face 0 and 0 is falsy.)
  4. *Integration overrule:* "I am overruling the other decision. Wire level 16 into the repository, in
     THIS PR. […] the integration seam — the exact thing the go/no-go gate existed to exercise — is
     still untested. **A green test suite is not that.** […] Then tell me it is ready and I will play it
     in the flat 30x30 BoardView myself. That human pass IS the gate."
  5. *Test-scope correction:* "You loosened more than you had to. […] The no-dead-gaps convention must
     be **REPARAMETERISED** for the cube, not switched off. […] padding is the escape medium, in-face
     holes are gameplay." (Also demanded a test that the cube is a PUZZLE: at least one arrow blocked at
     start.)
  6. *PR-3:* "`orbit.ts`, the pure projection module. Zero React […] Per-face 3D bases […] this is the
     R3 risk you named, so pin each face's basis with a test against a known orientation. […] Cull faces
     seen nearly edge-on (|normal · view| < 0.15) so sliver cells are untappable rather than
     mis-tappable."
  7. *PR-4:* "CubeBoardView + CubeFace, wired into GameScreen. […] TAP vs DRAG is a hard requirement
     […] Getting this wrong costs the player a life every time they rotate; test it. […] PADDING IS
     NEVER DRAWN."
  8. *Trackball replacement after the human pass:* "The fix is NOT raising the ±85° pitch clamp. The
     clamp was a band-aid over the Euler representation itself […] Replace the yaw/pitch state with
     **TRACKBALL ROTATION** — accumulate the rotation matrix itself […] RENORMALIZE R after each
     accumulation […] a horizontal drag still rotates in the same screen direction (the camera-space
     property — this is the test that would FAIL under Euler)."
  9. *PR-5:* "the escape flight on the orbiting cube. […] **RE-PROJECT THE FLIGHT EVERY FRAME** from the
     current rotation state. The flight's state lives in cube space (face, lane, progress); screen
     coordinates are derived. […] A hole INSIDE the face still swallows […] `layout.isPadding` is the
     discriminator."
- **Result:** `src/domain/` untouched (verified by `git status` after every PR). New: `CubeLayout` +
  `CubeFaceComposer` (adapters), `cubeLevels` (data), `orbit`/`orbitGesture`/`cubeFlight` pure math +
  `CubeBoardView`/`CubeFace`/`CubeRailEscape`/`cubeRegistry` (UI). 381 tests green across 53 suites,
  including property tests for the two cube invariants (pairwise face disjointness; arrow-id
  injectivity), trackball drift (1000 random drags, RᵀR ≈ I), tap-vs-drag, and hit-test round-trips at
  tumbled attitudes.
- **Two bugs only the HUMAN PASS caught (378 tests were green through both):**
  - **Detached glyphs on sheared faces** — the arrowhead's base edge used a screen-space perpendicular
    and stars were fixed screen shapes translated to a projected centroid. Invisible at identity;
    measured **16.4° of head misalignment at a ~30° tumble**. Fixed by one rule: every point of every
    glyph is defined in cube space and projected point by point (one continuous Path per arrow, head and
    stars built face-locally); a regression test now asserts the head's base edge follows the face's
    PROJECTED perpendicular.
  - **White screen on level 15 → "Next" → 16** — GameScreen stays mounted across the levelId change, so
    for one async beat its refs still held the 11×11 board while the registry already supplied the 30×30
    cube layout; walking the layout over the small board threw `OutOfBoundsError` mid-render. Fixed
    structurally (a size mismatch IS the loading state, no try/catch), with a transition regression test
    on the exact user path.
  - **Why 378 green tests missed both:** every render test mounted an already-consistent world and
    asserted topology (which faces exist, which cell a tap resolves to), not visual alignment or the
    mid-transition window. The user arrived mid-transition and looked at the pixels. The lesson is the
    same one as Entry 018's fold-back arrows: some bug classes are only visible to a human holding the
    running game — budget a device pass per feature, and when it finds something, convert what the eye
    saw into an assertion (the shear test, the wrong-size-board test) so it stays caught.
- **Team modifications / decisions:** every prompt above IS a team decision the AI then implemented; the
  team also accepted two AI-flagged deviations with justification (raw responder protocol instead of
  PanResponder, so the tap-vs-drag component tests drive the real code path; `hitTest` returning the
  CubeLayout face index so it feeds `layout.toBoard` directly).
- **Lessons (AI mistakes caught by the team):** the AI's risk analysis (a) missed the **arrow-id
  collision** entirely — the geometry was right, the identity was not, and nothing would have thrown
  (prompt 2); (b) hand-wrote the id remap as a magic `faceIndex * 1000 + localId` inside the composer
  until told to move the invariant next to its geometric twin (prompt 3); (c) guarded a **non-problem**
  (the `allCompleted` count) and in doing so left the real integration seam untested (prompt 4); (d)
  over-scoped test exclusions, silently shipping the cube with **zero walls and zero stars** — restoring
  the conventions the team demanded exposed the missing content (prompt 5); (e) shipped a pitch clamp
  that a human play-test revealed as an Euler band-aid rather than a fix (prompt 8).

---

## 3. Critical Evaluation

- **Approx. % of code AI-assisted:** **~90% of the code was first drafted with AI assistance** — traceable
  commit by commit through the `Co-Authored-By: Claude` trailer in the git history. **100% was reviewed by
  the team**, type-checked, covered by tests, and committed in small increments; the architecture, mechanic
  interpretation and acceptance criteria were set by the team before each task.
- **Incorrect / suboptimal AI outputs and how we caught them:**
  - **Two unsolvable levels** — caught by the greedy solver test, then fixed.
  - **Star placement produced ~0 collectable stars** — the first generator strategy looked right and passed
    the type-checker; per-level data inspection exposed it, and it was redesigned (reserve-first).
  - **The first Pact contract over-specified the cell shape** (required `direction`/`arrowId` on walls and
    stars) — caught by the backend's provider verification, not by any unit test.
  - **Async RNTL v14 API** — widget tests failed until `render`/`fireEvent` were awaited.
  - **A level builder that silently dropped `segmentIndex`** — types were happy, every level became
    unsolvable; only the solver-oracle test caught it.
  - **Arrows pointing at their own body** — passed all unit tests; caught by actually playing and looking
    at the board, then locked down with a new generator invariant test.
  - **The cube design's risk analysis missed the cross-face arrow-id collision** — a silent false-victory
    bug (one cleared face would win the game, nothing thrown); caught in design review before any code,
    then locked down with an id-injectivity property test and cross-face behaviour tests.
  - **Jest type resolution** under the Expo tsconfig — fixed via an explicit `types` array.
  - An early README listed patterns that were never built — corrected against the code.
- **Team reflection:** AI dramatically accelerated boilerplate (entities, use cases, repositories, tests,
  UI), but the architecture, the game-mechanic interpretation and the validation of behavior were owned by
  the team. The automated test gate (`tsc` + Jest + the level solver) is what made the AI output reliable.

---

## 4. Best-Practice Checklist (Section 7.3)

- [x] Effective prompt engineering (clear context + constraints) documented above.
- [x] All AI output critically reviewed against SOLID / patterns / Clean Architecture.
- [x] AI-generated code covered by team-run tests (unit + widget) and a green type-check.
- [x] Granular Conventional Commits so AI-assisted changes are traceable.
- [x] Architecture decisions (Clean layering, the mechanic, library-free AOP) made by the team.
- [x] No secrets committed to the repository: credentials live only in git-ignored `.env` files, and
  development database passwords are rotated before delivery.
- [x] Non-trivial decisions cited in code comments and this document.
