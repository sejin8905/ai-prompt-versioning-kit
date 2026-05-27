import {
  createPromptVersion,
  renderPrompt,
  validateRegistry
} from "../src/index.js";

const broken = createPromptVersion({
  id: "support-router-v1",
  name: "support-router",
  status: "active",
  body: "Route this ticket for {{customerTier}} customer: {{ticketText}}. Hidden placeholder: {{missingVariable}}",
  variables: [
    { name: "customerTier", required: true },
    { name: "ticketText", required: true }
  ]
});

const registryIssues = validateRegistry({
  name: "support-router",
  activeVersionId: broken.id,
  versions: [broken]
});

const renderResult = renderPrompt(broken, {
  customerTier: "enterprise"
});

console.log("Registry issues:");
console.log(registryIssues);
console.log("");
console.log("Render result:");
console.log(renderResult);
