import { describe, expect, it } from "vitest";
import {
  createPromptSnapshot,
  createPromptVersion,
  createVersionReport,
  diffPromptVersions,
  extractPlaceholders,
  generatePromptChangelog,
  renderPrompt,
  rollbackRegistry,
  selectActiveVersion,
  validateRegistry,
  type PromptRegistry
} from "../src/index.js";

const base = createPromptVersion({
  id: "reply-v1",
  name: "reply",
  status: "active",
  body: "Reply to {{name}} about {{issue}} in a {{tone}} tone.",
  variables: [
    { name: "name", required: true },
    { name: "issue", required: true },
    { name: "tone", required: false, defaultValue: "helpful" }
  ],
  createdAt: "2026-01-01T00:00:00.000Z"
});

describe("AI Prompt Versioning Kit", () => {
  it("extracts unique placeholders", () => {
    expect(extractPlaceholders("{{ name }} {{name}} {{issue_2}}")).toEqual(["issue_2", "name"]);
  });

  it("renders prompt templates with defaults", () => {
    const result = renderPrompt(base, { name: "Jin", issue: "billing" });
    expect(result.ok).toBe(true);
    expect(result.rendered).toContain("Jin");
    expect(result.rendered).toContain("helpful");
  });

  it("fails when a required variable is missing", () => {
    const result = renderPrompt(base, { name: "Jin" });
    expect(result.ok).toBe(false);
    expect(result.missingVariables).toEqual(["issue"]);
  });

  it("fails on unexpected extra values by default", () => {
    const result = renderPrompt(base, { name: "Jin", issue: "billing", unknown: "x" });
    expect(result.ok).toBe(false);
    expect(result.extraVariables).toEqual(["unknown"]);
  });

  it("can allow extra values when requested", () => {
    const result = renderPrompt(base, { name: "Jin", issue: "billing", unknown: "x" }, { allowExtraValues: true });
    expect(result.ok).toBe(true);
  });

  it("catches undeclared placeholders in registry validation", () => {
    const broken = createPromptVersion({
      id: "broken",
      name: "broken",
      body: "Hello {{missing}}",
      variables: []
    });
    expect(validateRegistry({ name: "broken", activeVersionId: "broken", versions: [broken] })).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "unknown_placeholder" })])
    );
  });

  it("catches duplicate version ids", () => {
    const issues = validateRegistry({ name: "dup", activeVersionId: "reply-v1", versions: [base, base] });
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "duplicate_version_id" })]));
  });

  it("catches duplicate variables", () => {
    const duplicate = createPromptVersion({
      id: "dup-vars",
      name: "dup-vars",
      body: "{{name}}",
      variables: [{ name: "name" }, { name: "name" }]
    });
    const issues = validateRegistry({ name: "dup-vars", activeVersionId: "dup-vars", versions: [duplicate] });
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "duplicate_variable" })]));
  });

  it("catches missing active version id", () => {
    const issues = validateRegistry({ name: "missing", activeVersionId: "does-not-exist", versions: [base] });
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "missing_active_version" })]));
  });

  it("selects the configured active version", () => {
    const registry: PromptRegistry = { name: "r", activeVersionId: base.id, versions: [base] };
    expect(selectActiveVersion(registry).id).toBe(base.id);
  });

  it("diffs added required variables as medium risk", () => {
    const next = createPromptVersion({
      id: "reply-v2",
      name: "reply",
      body: `${base.body} Include {{policyNote}}.`,
      variables: [...base.variables, { name: "policyNote", required: true }]
    });
    const diff = diffPromptVersions(base, next);
    expect(diff.addedVariables).toEqual(["policyNote"]);
    expect(diff.riskLevel).toBe("medium");
  });

  it("diffs removed variables as high risk", () => {
    const next = createPromptVersion({
      id: "reply-v3",
      name: "reply",
      body: "Reply to {{name}}.",
      variables: [{ name: "name", required: true }]
    });
    const diff = diffPromptVersions(base, next);
    expect(diff.removedVariables).toEqual(["issue", "tone"]);
    expect(diff.riskLevel).toBe("high");
  });

  it("rolls active version back without deleting history", () => {
    const next = createPromptVersion({
      id: "reply-v2",
      name: "reply",
      body: "Reply to {{name}}.",
      variables: [{ name: "name" }]
    });
    const registry: PromptRegistry = { name: "r", activeVersionId: next.id, versions: [{ ...base, status: "archived" }, { ...next, status: "active" }] };
    const rolledBack = rollbackRegistry(registry, base.id);
    expect(rolledBack.activeVersionId).toBe(base.id);
    expect(rolledBack.versions.find((version) => version.id === base.id)?.status).toBe("active");
  });

  it("throws when rolling back to a missing version", () => {
    expect(() => rollbackRegistry({ name: "r", versions: [base] }, "missing")).toThrow(/missing/);
  });

  it("creates deterministic snapshots for equivalent values", () => {
    const a = createPromptSnapshot(base, { issue: "billing", name: "Jin" });
    const b = createPromptSnapshot(base, { name: "Jin", issue: "billing" });
    expect(a.valuesFingerprint).toBe(b.valuesFingerprint);
  });

  it("creates a readable changelog", () => {
    const next = createPromptVersion({
      id: "reply-v2",
      name: "reply",
      body: "Reply to {{name}}.",
      variables: [{ name: "name" }]
    });
    expect(generatePromptChangelog(base, next)).toContain("Risk: high");
  });

  it("creates a registry report", () => {
    const report = createVersionReport({ name: "support", activeVersionId: base.id, versions: [base] });
    expect(report).toContain("Prompt registry: support");
    expect(report).toContain("Issues: 0");
  });

  it("type-checks number and boolean variables", () => {
    const numeric = createPromptVersion({
      id: "score-v1",
      name: "score",
      body: "Score {{score}} active {{active}}",
      variables: [
        { name: "score", type: "number" },
        { name: "active", type: "boolean" }
      ]
    });
    expect(renderPrompt(numeric, { score: "10", active: true }).ok).toBe(false);
    expect(renderPrompt(numeric, { score: 10, active: true }).ok).toBe(true);
  });
});
