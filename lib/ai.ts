import { generateClaudeReply } from "@/prompts/chloe";

export async function generateReply(
  character: string,
  userInput: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
  systemPrompt: string,
): Promise<string> {
  // Use Claude API for all characters
  return await generateClaudeReply(
    systemPrompt,
    conversationHistory,
    userInput,
  );
}
