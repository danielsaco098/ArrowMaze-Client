# AI Usage Documentation — Arrow Maze Client

This document records how generative-AI tools were used while building this repository, as required by
Section 7 of the project brief. **The team is fully responsible for all delivered code**, AI-assisted or
not, and is able to explain every file, pattern and decision during the defense.

---

## 1. Tools Used

| Tool | Model / Version | Role in the workflow |
| --- | --- | --- |
| Claude Code | Claude Opus 4.8 | Pair-programming agent: scaffolding, code generation, test generation, refactoring, documentation, and running the type-checker/tests in the terminal. |
| _(add any others the team used, e.g. GitHub Copilot, ChatGPT)_ | — | — |

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

---

## 3. Critical Evaluation

- **Approx. % of code AI-assisted:** A large majority of the code was drafted by Claude Code under the
  team's direction; **100% was reviewed by the team**, type-checked, covered by tests, and committed in
  small, traceable increments. _(Refine this estimate before delivery.)_
- **Incorrect / suboptimal AI outputs and how we caught them:**
  - **Two unsolvable levels** — caught by the greedy solver test, then fixed.
  - **Async RNTL v14 API** — widget tests failed until `render`/`fireEvent` were awaited.
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
- [x] No secrets/credentials shared in prompts.
- [x] Non-trivial decisions cited in code comments and this document.
