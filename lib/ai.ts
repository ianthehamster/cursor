import Anthropic from "@anthropic-ai/sdk";

async function generateClaudeReply(
  systemPrompt: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>,
  userInput: string,
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
  });

  // Filter out timestamp fields - Anthropic API only accepts role and content
  const messages = [
    ...conversationHistory.map(({ role, content }) => ({ role, content })),
    { role: "user" as const, content: userInput },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 200,
    temperature: 0.7,
    system: systemPrompt,
    messages,
  });

  const firstContent = response.content[0];
  if (firstContent.type === "text") {
    return firstContent.text;
  }

  throw new Error("Unexpected response type from Claude API");
}

export async function generateReply(
  character: string,
  userInput: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
  systemPrompt: string,
): Promise<string> {
  return await generateClaudeReply(
    systemPrompt,
    conversationHistory,
    userInput,
  );
}
