# Failure Modes

This starter kit is intentionally small. It helps catch common prompt versioning mistakes, but it is not a full prompt governance system.

## Mistakes this kit can catch

- Missing required prompt variables
- Undeclared placeholders in a prompt body
- Duplicate version ids
- Duplicate variable names
- Missing active version ids
- Risky diffs such as removed variables
- Type mismatches for basic variable types

## Mistakes it does not fully solve

- Bad prompt quality
- Model behavior drift
- Unsafe AI output
- Team approval workflows
- Prompt A/B testing
- Hosted prompt deployments
- Full observability

## Production note

Use this as a local starting point. Review and adapt it before using it with real customers, real production data, or regulated workflows.
