# Quickstart

AI Prompt Versioning Kit is a local TypeScript source-code starter for keeping prompt templates, variables, diffs, and rollbacks in one readable place.

It does not call an AI provider by default.

## Install

```bash
npm install
```

## Run tests

```bash
npm test
```

## Run the basic demo

```bash
npm run dev
```

## Run the failure demo

```bash
npm run demo:failure
```

This demo intentionally catches:

- undeclared placeholders
- missing required variable values

## Run the rollback demo

```bash
npm run demo:rollback
```

## Build package output

```bash
npm run build
```

The package exports from `dist/index.js`.
