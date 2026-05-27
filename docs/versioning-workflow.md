# Versioning Workflow

Use this kit when prompts are starting to become product logic.

## Suggested flow

1. Create a prompt version with an explicit id.
2. Declare every variable the prompt expects.
3. Render through `renderPrompt` instead of string concatenation.
4. Use `diffPromptVersions` before promoting a draft.
5. Store a snapshot fingerprint for important prompt runs.
6. Roll back by switching the active version id.

## Version id examples

- `support-reply-v1`
- `support-reply-v2`
- `support-reply-2026-05-28`
- `lead-summary-experiment-a`

## What to commit

Commit prompt definitions, docs, and tests.

Do not commit real customer prompts, production secrets, or private output logs.
