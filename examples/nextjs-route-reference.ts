import {
  createPromptVersion,
  renderPrompt
} from "../src/index.js";

// Reference only. Copy the pattern into your own Next.js route or server action.
const supportPrompt = createPromptVersion({
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

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;

  const result = renderPrompt(supportPrompt, {
    tone: body.tone,
    customerName: body.customerName,
    issue: body.issue
  });

  if (!result.ok) {
    return Response.json({ error: "Prompt input failed validation", issues: result.issues }, { status: 400 });
  }

  return Response.json({
    promptVersionId: result.versionId,
    prompt: result.rendered
  });
}
