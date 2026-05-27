import { createHash } from "node:crypto";

export type PromptVersionStatus = "draft" | "active" | "archived";

export type PromptVariableType = "string" | "number" | "boolean" | "json";

export type PromptVariable = {
  name: string;
  required?: boolean;
  type?: PromptVariableType;
  description?: string;
  defaultValue?: unknown;
  example?: unknown;
};

export type PromptVersion = {
  id: string;
  name: string;
  body: string;
  status: PromptVersionStatus;
  variables: PromptVariable[];
  createdAt: string;
  notes?: string;
  tags?: string[];
};

export type PromptRegistry = {
  name: string;
  activeVersionId?: string;
  versions: PromptVersion[];
};

export type PromptIssue = {
  code:
    | "duplicate_version_id"
    | "duplicate_variable"
    | "missing_active_version"
    | "multiple_active_versions"
    | "unknown_placeholder"
    | "missing_value"
    | "type_mismatch";
  message: string;
  versionId?: string;
  variableName?: string;
};

export type RenderPromptOptions = {
  allowExtraValues?: boolean;
  strictPlaceholders?: boolean;
};

export type RenderPromptResult = {
  ok: boolean;
  rendered?: string;
  versionId: string;
  usedVariables: string[];
  missingVariables: string[];
  extraVariables: string[];
  issues: PromptIssue[];
};

export type PromptDiff = {
  fromVersionId: string;
  toVersionId: string;
  bodyChanged: boolean;
  addedVariables: string[];
  removedVariables: string[];
  changedVariables: string[];
  riskLevel: "low" | "medium" | "high";
  notes: string[];
};

export type PromptSnapshot = {
  versionId: string;
  name: string;
  fingerprint: string;
  rendered: string;
  valuesFingerprint: string;
  createdAt: string;
};

export function createPromptVersion(input: {
  id: string;
  name: string;
  body: string;
  variables?: PromptVariable[];
  status?: PromptVersionStatus;
  createdAt?: string;
  notes?: string;
  tags?: string[];
}): PromptVersion {
  return {
    id: input.id,
    name: input.name,
    body: input.body,
    status: input.status ?? "draft",
    variables: input.variables ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
    notes: input.notes,
    tags: input.tags
  };
}

export function extractPlaceholders(body: string): string[] {
  const names = new Set<string>();
  const pattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    names.add(match[1]);
  }
  return [...names].sort();
}

export function validateRegistry(registry: PromptRegistry): PromptIssue[] {
  const issues: PromptIssue[] = [];
  const ids = new Set<string>();
  const activeIds = registry.versions.filter((version) => version.status === "active").map((version) => version.id);

  for (const version of registry.versions) {
    if (ids.has(version.id)) {
      issues.push({
        code: "duplicate_version_id",
        message: `Duplicate prompt version id: ${version.id}`,
        versionId: version.id
      });
    }
    ids.add(version.id);

    const variables = new Set<string>();
    for (const variable of version.variables) {
      if (variables.has(variable.name)) {
        issues.push({
          code: "duplicate_variable",
          message: `Duplicate variable "${variable.name}" in ${version.id}`,
          versionId: version.id,
          variableName: variable.name
        });
      }
      variables.add(variable.name);
    }

    const declared = new Set(version.variables.map((variable) => variable.name));
    for (const placeholder of extractPlaceholders(version.body)) {
      if (!declared.has(placeholder)) {
        issues.push({
          code: "unknown_placeholder",
          message: `Placeholder "{{${placeholder}}}" is not declared in ${version.id}`,
          versionId: version.id,
          variableName: placeholder
        });
      }
    }
  }

  if (registry.activeVersionId && !ids.has(registry.activeVersionId)) {
    issues.push({
      code: "missing_active_version",
      message: `Active version id "${registry.activeVersionId}" does not exist`,
      versionId: registry.activeVersionId
    });
  }

  if (!registry.activeVersionId && activeIds.length === 0 && registry.versions.length > 0) {
    issues.push({
      code: "missing_active_version",
      message: "Registry has versions but no active version"
    });
  }

  if (activeIds.length > 1) {
    issues.push({
      code: "multiple_active_versions",
      message: `Registry has multiple active versions: ${activeIds.join(", ")}`
    });
  }

  return issues;
}

export function selectActiveVersion(registry: PromptRegistry): PromptVersion {
  const byId = registry.activeVersionId
    ? registry.versions.find((version) => version.id === registry.activeVersionId)
    : undefined;
  const byStatus = registry.versions.find((version) => version.status === "active");
  const selected = byId ?? byStatus;
  if (!selected) {
    throw new Error(`No active prompt version found for registry "${registry.name}"`);
  }
  return selected;
}

export function renderPrompt(
  version: PromptVersion,
  values: Record<string, unknown>,
  options: RenderPromptOptions = {}
): RenderPromptResult {
  const allowExtraValues = options.allowExtraValues ?? false;
  const strictPlaceholders = options.strictPlaceholders ?? true;
  const issues: PromptIssue[] = [];
  const placeholders = extractPlaceholders(version.body);
  const declared = new Map(version.variables.map((variable) => [variable.name, variable]));
  const requiredNames = version.variables.filter((variable) => variable.required !== false).map((variable) => variable.name);
  const missingVariables: string[] = [];

  for (const requiredName of requiredNames) {
    const variable = declared.get(requiredName);
    if (values[requiredName] === undefined && variable?.defaultValue === undefined) {
      missingVariables.push(requiredName);
      issues.push({
        code: "missing_value",
        message: `Missing required value for "${requiredName}"`,
        versionId: version.id,
        variableName: requiredName
      });
    }
  }

  for (const placeholder of placeholders) {
    if (!declared.has(placeholder) && strictPlaceholders) {
      issues.push({
        code: "unknown_placeholder",
        message: `Placeholder "{{${placeholder}}}" is not declared`,
        versionId: version.id,
        variableName: placeholder
      });
    }
  }

  for (const variable of version.variables) {
    const value = values[variable.name] ?? variable.defaultValue;
    if (value === undefined) continue;
    if (!matchesVariableType(value, variable.type ?? "string")) {
      issues.push({
        code: "type_mismatch",
        message: `Value for "${variable.name}" does not match expected type "${variable.type ?? "string"}"`,
        versionId: version.id,
        variableName: variable.name
      });
    }
  }

  const declaredNames = new Set(version.variables.map((variable) => variable.name));
  const extraVariables = Object.keys(values).filter((name) => !declaredNames.has(name)).sort();
  if (!allowExtraValues && extraVariables.length > 0) {
    for (const extra of extraVariables) {
      issues.push({
        code: "unknown_placeholder",
        message: `Value "${extra}" was provided but is not declared by this prompt version`,
        versionId: version.id,
        variableName: extra
      });
    }
  }

  if (issues.length > 0) {
    return {
      ok: false,
      versionId: version.id,
      usedVariables: [],
      missingVariables,
      extraVariables,
      issues
    };
  }

  const rendered = version.body.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_match, name: string) => {
    const variable = declared.get(name);
    const value = values[name] ?? variable?.defaultValue ?? "";
    return formatPromptValue(value);
  });

  return {
    ok: true,
    rendered,
    versionId: version.id,
    usedVariables: placeholders,
    missingVariables: [],
    extraVariables,
    issues: []
  };
}

export function diffPromptVersions(from: PromptVersion, to: PromptVersion): PromptDiff {
  const fromVariables = new Map(from.variables.map((variable) => [variable.name, variable]));
  const toVariables = new Map(to.variables.map((variable) => [variable.name, variable]));
  const addedVariables = [...toVariables.keys()].filter((name) => !fromVariables.has(name)).sort();
  const removedVariables = [...fromVariables.keys()].filter((name) => !toVariables.has(name)).sort();
  const changedVariables = [...toVariables.keys()]
    .filter((name) => {
      const before = fromVariables.get(name);
      const after = toVariables.get(name);
      return before && after && JSON.stringify(before) !== JSON.stringify(after);
    })
    .sort();

  const notes: string[] = [];
  if (from.body !== to.body) notes.push("Prompt body changed.");
  if (addedVariables.length > 0) notes.push(`Added variables: ${addedVariables.join(", ")}.`);
  if (removedVariables.length > 0) notes.push(`Removed variables: ${removedVariables.join(", ")}.`);
  if (changedVariables.length > 0) notes.push(`Changed variables: ${changedVariables.join(", ")}.`);

  const riskLevel = removedVariables.length > 0
    ? "high"
    : addedVariables.some((name) => toVariables.get(name)?.required !== false)
      ? "medium"
      : from.body !== to.body
        ? "medium"
        : "low";

  return {
    fromVersionId: from.id,
    toVersionId: to.id,
    bodyChanged: from.body !== to.body,
    addedVariables,
    removedVariables,
    changedVariables,
    riskLevel,
    notes
  };
}

export function rollbackRegistry(registry: PromptRegistry, targetVersionId: string): PromptRegistry {
  if (!registry.versions.some((version) => version.id === targetVersionId)) {
    throw new Error(`Cannot roll back to missing prompt version "${targetVersionId}"`);
  }

  return {
    ...registry,
    activeVersionId: targetVersionId,
    versions: registry.versions.map((version) => ({
      ...version,
      status: version.id === targetVersionId ? "active" : version.status === "active" ? "archived" : version.status
    }))
  };
}

export function createPromptSnapshot(version: PromptVersion, values: Record<string, unknown>): PromptSnapshot {
  const result = renderPrompt(version, values, { allowExtraValues: true });
  if (!result.ok || !result.rendered) {
    throw new Error(`Cannot snapshot invalid prompt version "${version.id}"`);
  }

  return {
    versionId: version.id,
    name: version.name,
    rendered: result.rendered,
    fingerprint: sha256(`${version.id}\n${version.body}\n${result.rendered}`),
    valuesFingerprint: sha256(stableJson(values)),
    createdAt: new Date().toISOString()
  };
}

export function generatePromptChangelog(from: PromptVersion, to: PromptVersion): string {
  const diff = diffPromptVersions(from, to);
  const lines = [
    `# Prompt changelog: ${from.id} -> ${to.id}`,
    "",
    `Risk: ${diff.riskLevel}`,
    "",
    "Changes:"
  ];
  if (diff.notes.length === 0) {
    lines.push("- No material changes detected.");
  } else {
    for (const note of diff.notes) {
      lines.push(`- ${note}`);
    }
  }
  return lines.join("\n");
}

export function createVersionReport(registry: PromptRegistry): string {
  const issues = validateRegistry(registry);
  const active = issues.some((issue) => issue.code === "missing_active_version")
    ? "missing"
    : selectActiveVersion(registry).id;

  return [
    `Prompt registry: ${registry.name}`,
    `Versions: ${registry.versions.length}`,
    `Active: ${active}`,
    `Issues: ${issues.length}`,
    ...issues.map((issue) => `- [${issue.code}] ${issue.message}`)
  ].join("\n");
}

function matchesVariableType(value: unknown, type: PromptVariableType): boolean {
  if (type === "json") return true;
  return typeof value === type;
}

function formatPromptValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
