import {
  createPromptSnapshot,
  createPromptVersion,
  createVersionReport,
  diffPromptVersions,
  generatePromptChangelog,
  renderPrompt,
  rollbackRegistry,
  type PromptRegistry
} from "./index.js";

const v1 = createPromptVersion({
  id: "support-reply-v1",
  name: "support-reply",
  status: "active",
  body: "Write a {{tone}} support reply for {{customerName}} about: {{issue}}",
  variables: [
    { name: "tone", required: true },
    { name: "customerName", required: true },
    { name: "issue", required: true }
  ],
  notes: "Initial prompt."
});

const v2 = createPromptVersion({
  id: "support-reply-v2",
  name: "support-reply",
  status: "draft",
  body: "Write a {{tone}} support reply for {{customerName}}. Mention policy: {{policyNote}}. Issue: {{issue}}",
  variables: [
    { name: "tone", required: true },
    { name: "customerName", required: true },
    { name: "issue", required: true },
    { name: "policyNote", required: true }
  ],
  notes: "Adds explicit policy note."
});

const registry: PromptRegistry = {
  name: "support-prompts",
  activeVersionId: v1.id,
  versions: [v1, v2]
};

const rendered = renderPrompt(v1, {
  tone: "calm",
  customerName: "Mina",
  issue: "a duplicate invoice"
});

console.log(createVersionReport(registry));
console.log("");
console.log("Render OK:", rendered.ok);
console.log(rendered.rendered);
console.log("");
console.log(generatePromptChangelog(v1, v2));
console.log("");
console.log("Diff risk:", diffPromptVersions(v1, v2).riskLevel);
console.log("Snapshot:", createPromptSnapshot(v1, {
  tone: "calm",
  customerName: "Mina",
  issue: "a duplicate invoice"
}).fingerprint.slice(0, 16));
console.log("Rollback active:", rollbackRegistry(registry, v1.id).activeVersionId);
