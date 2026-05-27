import {
  createPromptSnapshot,
  createPromptVersion,
  generatePromptChangelog,
  renderPrompt
} from "../src/index.js";

const current = createPromptVersion({
  id: "lead-summary-v1",
  name: "lead-summary",
  status: "active",
  body: "Summarize {{leadName}} for a {{salesStage}} sales handoff. Keep it under {{maxWords}} words.",
  variables: [
    { name: "leadName", required: true },
    { name: "salesStage", required: true },
    { name: "maxWords", type: "number", required: false, defaultValue: 80 }
  ]
});

const next = createPromptVersion({
  id: "lead-summary-v2",
  name: "lead-summary",
  status: "draft",
  body: "Summarize {{leadName}} for a {{salesStage}} handoff. Mention risk: {{riskNote}}. Keep it under {{maxWords}} words.",
  variables: [
    { name: "leadName", required: true },
    { name: "salesStage", required: true },
    { name: "riskNote", required: true },
    { name: "maxWords", type: "number", required: false, defaultValue: 80 }
  ]
});

const rendered = renderPrompt(current, {
  leadName: "Acme Robotics",
  salesStage: "qualified"
});

console.log("Rendered prompt:");
console.log(rendered.rendered);
console.log("");
console.log(generatePromptChangelog(current, next));
console.log("");
console.log("Snapshot fingerprint:");
console.log(createPromptSnapshot(current, {
  leadName: "Acme Robotics",
  salesStage: "qualified"
}).fingerprint);
