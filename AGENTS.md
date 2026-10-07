# ElectroCalc — Codex / Agent Instructions

## Project goal

ElectroCalc is a lightweight responsive electrical engineering calculator.
It must remain easy to understand, maintain and deploy as a static web app.

## Architecture

- Keep calculation logic separate from DOM/UI logic.
- Calculator-specific logic belongs in `/js/calculators`.
- Shared electrical helpers belong in `/js/utils/electrical.js`.
- Generic helpers belong in `/js/utils`.
- UI-only logic belongs in `/js/ui`.
- Static electrical/reference data belongs in `/data`.
- Avoid unnecessary abstraction and unnecessary files.
- Do not duplicate logic.

## Technology

- Use vanilla JavaScript and ES modules.
- Do not add React, Vue, Angular or another frontend framework unless explicitly requested.
- Do not add Node.js, Express or a backend unless explicitly requested and justified by the feature.
- The project must remain deployable to GitHub Pages.

## UI

- Preserve the current ElectroCalc visual language unless a UI change is explicitly requested.
- Preserve light and dark themes.
- Preserve responsive behavior.
- Preserve the intentional difference between browser navigation and future PWA standalone navigation.
- Do not redesign unrelated screens while implementing a feature.
- Prefer clear, compact engineering-tool UI over decorative elements.

## Code quality

- Modify the minimum number of files necessary.
- Do not rewrite working modules unnecessarily.
- Before adding a helper, check whether a suitable helper already exists.
- Do not create a new file for trivial one-use logic.
- Use clear names and small focused functions.
- Validate numeric input.
- Never render NaN, Infinity, undefined or invalid numerical output.

## Electrical calculations

- Keep mathematical calculation separate from normative interpretation.
- State assumptions explicitly in code/comments where needed.
- Do not label a result as standards-compliant unless the implemented logic actually verifies the relevant rules.
- Keep reference tables and standard-derived data separate from calculation code.
- Prefer testable pure functions for electrical formulas.

## Change workflow

Before editing:
1. Read this file.
2. Inspect the relevant existing modules.
3. Identify the smallest required change.

After editing:
1. Review the diff for unrelated changes.
2. Verify existing behavior was not broken.
3. Summarize which files changed and why.

## Testing

- Add or update tests when changing calculation logic or unit conversion.
- Run `npm test` before completing relevant work.
- Do not bypass failing tests by changing expected values unless the electrical behavior is intentionally changed and verified.
