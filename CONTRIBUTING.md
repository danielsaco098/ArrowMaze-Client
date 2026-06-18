# Contributing — Arrow Maze Client

Thanks for contributing! This repo follows industry conventions so the Git history stays clean and the
team's individual participation is verifiable.

## Branching workflow

- `main` is **protected**: no direct pushes, no force-push. All changes land via Pull Request.
- Branch off `main` using a descriptive name:
  - `feat/board-arrow-slide`
  - `fix/lives-not-decrementing`
  - `test/path-traversal-service`
  - `docs/readme-architecture`
- Keep commits **small and frequent** so AI-assisted vs. hand-written changes are traceable.

## Conventional Commits (required, in English)

Format: `type(scope): subject`

| Type | Use for |
| --- | --- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore` | Tooling, deps, CI config |
| `style` | Formatting only |
| `perf` | Performance improvement |

**Suggested scopes:** `board`, `cell`, `player`, `level`, `score`, `use-case`, `ui`, `audio`, `i18n`,
`persistence`, `ci`.

**Examples:**

```
feat(board): add arrow slide-out logic
fix(player): lose a life when target arrow is blocked
test(use-case): add unit tests for TapCellUseCase
docs(readme): embed clean architecture diagram
refactor(level): apply Factory Method to cell creation
```

Commit format is validated automatically by **commitlint** via a Husky `commit-msg` hook
(`npm install` sets it up).

## Pull Request checklist

- [ ] Branch is up to date with `main`.
- [ ] Commits follow Conventional Commits.
- [ ] `npm test` passes locally and **CI is green**.
- [ ] New/changed behavior is covered by tests (AAA, `should_<expected>_when_<condition>`).
- [ ] No secrets or credentials committed.
- [ ] PR description explains the change and links the related task.

At least one teammate reviews and approves before merge. Prefer **squash merge** to keep `main` linear.
