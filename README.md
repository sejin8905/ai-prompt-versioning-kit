# AI Prompt Versioning Kit

Free TypeScript starter code for local AI prompt versioning, variable validation, diffing, rollback, and prompt snapshots.

This is a free ArchiNode source-code kit. It is not a hosted prompt management SaaS.

## What This Helps With

- Keep prompt versions in a readable TypeScript structure
- Declare required prompt variables
- Catch missing values before model calls
- Compare prompt versions before shipping changes
- Roll back to a previous active prompt version
- Create simple prompt fingerprints for debugging

## What Is Included

- Prompt version model
- Prompt registry validation
- Placeholder extraction
- Variable validation
- Prompt rendering helper
- Prompt version diff helper
- Rollback helper
- Changelog generator
- Snapshot fingerprint helper
- CLI reference
- Basic demo
- Failure demo
- Rollback demo
- Next.js route reference
- Vitest test suite
- Setup and production notes

## What This Is Not

- Not a hosted prompt management platform
- Not a Langfuse or PromptLayer replacement
- Not a prompt quality guarantee
- Not a team approval workflow
- Not a production governance system
- Not a security or compliance product

## Quickstart

```bash
npm install
npm test
npm run dev
```

## Useful Commands

```bash
npm run demo:failure
npm run demo:rollback
npm run typecheck
npm run build
```

## Basic Example

```ts
import { createPromptVersion, renderPrompt } from "ai-prompt-versioning-kit";

const prompt = createPromptVersion({
  id: "support-reply-v1",
  name: "support-reply",
  status: "active",
  body: "Write a {{tone}} reply for {{customerName}} about: {{issue}}",
  variables: [
    { name: "tone", required: true },
    { name: "customerName", required: true },
    { name: "issue", required: true }
  ]
});

const result = renderPrompt(prompt, {
  tone: "calm",
  customerName: "Mina",
  issue: "a duplicate invoice"
});
```

## Requirements

- Node.js 20 or newer recommended
- npm
- Basic TypeScript knowledge

No AI provider API key is required for the included demos.

## License

MIT License.

You can use and modify this code in your own projects. See `LICENSE.md`.

## Important Note

This kit is source code, not a hosted service. Review, test, and adapt it before using it with real users, real production data, or regulated workflows.
