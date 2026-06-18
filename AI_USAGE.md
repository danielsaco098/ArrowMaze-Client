# AI Usage Documentation — Arrow Maze Client

This document records how generative-AI tools were used while building this repository, as required by
Section 7 of the project brief. The team is fully responsible for all delivered code, AI-assisted or not.

---

## 1. Tools Used

| Tool | Model / Version | Role in the workflow |
| --- | --- | --- |
| Claude Code | Claude Opus 4.8 | Scaffolding, documentation drafting, architecture discussion, test generation, code review. |
| _(add others as used)_ | e.g. GitHub Copilot | Inline autocompletion while coding. |

---

## 2. Usage Log (per significant task)

> One entry per significant AI use. Keep prompts faithful (literal or close paraphrase) and always record
> what the team **changed** afterward.

### Entry 001 — Documentation scaffolding (READMEs, AI_USAGE, repo conventions)

- **Date:** 2026-06-17
- **Task:** Set up the documentation base for both repositories (README, AI_USAGE, CONTRIBUTING, license,
  /docs structure) before writing code, following the project brief and the team's existing class and
  Clean Architecture diagrams.
- **Tool:** Claude Code (Claude Opus 4.8)
- **Prompt (paraphrased):** "Here is the Arrow Maze project brief and our class + layer diagrams. The game
  mechanic is: tap an arrow to slide it off the board in its direction; if blocked by another arrow cell,
  lose a life (3 lives). Help me with the rest, starting with documentation. Stack: React Native + Expo
  (client), NestJS (backend)."
- **Result:** Generated `README.md`, `AI_USAGE.md`, `CONTRIBUTING.md`, `.gitignore`, `LICENSE`, and a
  `/docs` structure mapping the diagrams to Clean Architecture layers, GoF patterns, SOLID, and the AOP
  decorator strategy.
- **Team modifications:** _(fill in)_ — reviewed wording, confirmed the game mechanic, will replace
  screenshot placeholders and finalize code-link paths as the implementation lands.
- **Lessons / limitations:** The brief mentions cell "rotation" but our actual mechanic is "slide-out or
  lose a life"; the team confirmed the slide-out mechanic as authoritative and the AI adjusted accordingly.

### Entry 002 — _(next task)_

- **Date:**
- **Task:**
- **Tool:**
- **Prompt:**
- **Result:**
- **Team modifications:**
- **Lessons / limitations:**

---

## 3. Critical Evaluation

- **Approx. % of code AI-assisted:** _(fill in at the end — e.g. "~40% drafted with AI, 100% reviewed")_.
- **Incorrect / suboptimal AI outputs and how we caught them:** _(log cases here, e.g. an AI suggestion
  that violated the dependency rule and how the team corrected it)_.
- **Team reflection on AI's impact on productivity and quality:** _(fill in at the end)_.

---

## 4. Best-Practice Checklist (Section 7.3)

- [ ] Effective prompt engineering (clear context + constraints) documented above.
- [ ] All AI output critically reviewed against SOLID / patterns / Clean Architecture.
- [ ] AI-generated code covered by team-written tests.
- [ ] Granular commits so AI-assisted changes are traceable.
- [ ] Architecture decisions made by the team, AI used as assistant only.
- [ ] No secrets/credentials shared in prompts.
- [ ] Non-trivial AI-provided algorithms cited in code comments / docs.
