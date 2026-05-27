import {
  createPromptVersion,
  createVersionReport,
  rollbackRegistry,
  type PromptRegistry
} from "../src/index.js";

const stable = createPromptVersion({
  id: "classifier-v1",
  name: "classifier",
  status: "archived",
  body: "Classify this request into billing, support, or sales: {{text}}",
  variables: [{ name: "text", required: true }]
});

const experiment = createPromptVersion({
  id: "classifier-v2",
  name: "classifier",
  status: "active",
  body: "Classify this request into billing, support, sales, or security: {{text}}",
  variables: [{ name: "text", required: true }]
});

const registry: PromptRegistry = {
  name: "classifier",
  activeVersionId: experiment.id,
  versions: [stable, experiment]
};

console.log("Before rollback:");
console.log(createVersionReport(registry));
console.log("");

const rolledBack = rollbackRegistry(registry, stable.id);

console.log("After rollback:");
console.log(createVersionReport(rolledBack));
