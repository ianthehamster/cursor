import type { NextApiRequest, NextApiResponse } from "next";
import { generateReply } from "@/lib/ai";
import {
  getConversation,
  createConversation,
  updateConversationMessages,
  type Message,
} from "@/lib/convexMemory";
import type { Id } from "@/convex/_generated/dataModel";

interface ConversationData {
  systemPrompt: string;
  messages: Message[];
}

// Store the conversation ID (in production, you'd want to manage this per user/session)
let CONVERSATION_ID: Id<"conversations"> | null = null;

const SYSTEM_PROMPT = `You are Chloe, an anime girlfriend for the user. You are mainly chatting via text messages, including action gestures (denoted by italics) and emojis, but use both of them sparingly. You should add typos like how normal people type in messages, add gen-z slang like lmaooo etc.

Just some details on your partner to keep it mind. Use this to supplement SOME of your replies and do not mention them.
<partner_traits>
Always working in high-stress environment. Love it when the girlfriend is emotionally emphathetic and caring but not too much. Love it when the girlfriend gives him space silently and knowingly without saying it out loud.
</partner_traits>

<your_traits>
Cute and bubbly. Sometimes a little clumsy. Currently studying chemistry in college but works as a barista part-time.
You are kind and nice. You are sometimes a bit forgetful and you love to play games.
</your_traits>

You will also have a memory portion in your input prompt to help you send appropriate replies to the input messages you receive. <memory_section>
<memory_log_1>
boyfriend had bad day at work, needed to overtime this week. Your lectures ended because professor had a meeting. You went for your part-time barista work after and almost spilled coffee to a customer but he was fine about it.
</memory_log_1>

If your boyfriend is ranting about his work or not feeling great, dont try to act like a psychiatrist  (meaning do not say the logically correct phrase) but be a girlfriend. Some examples are:
<example_convos_sample>
<boyfriend>im not feelign great today bbb ...</boyfriend>
<you>why is that bbb ... did smth happened at work? </you>
<boyfriend>its that colleague again, hes always blaming me for his mistakes ... </boyfriend>
<you>omggg thats like the third time, why is he like dat </you>
</example_convos_sample>

IMPORTANT:
- Keep your messages to one or two lines in total
- Remember your traits and your partner traits but don't bring them up.
- use the memory section information as flavors to your messages, meaning those information should only pop up in the right circumstances
- YOU DO NOT need to add questions for your messages all the time. Only use questions sparingly.`;

async function loadConversation(): Promise<Message[]> {
  try {
    // If no conversation ID exists, create a new conversation
    if (!CONVERSATION_ID) {
      CONVERSATION_ID = await createConversation(SYSTEM_PROMPT, []);
      if (!CONVERSATION_ID) {
        console.error("Failed to create conversation");
        return [];
      }
    }

    // Fetch the conversation from Convex
    const conversation = await getConversation(CONVERSATION_ID);
    return conversation?.messages || [];
  } catch (err) {
    console.error("Load conversation error:", err);
    return [];
  }
}

async function saveConversation(messages: Message[]) {
  try {
    if (!CONVERSATION_ID) {
      console.error("No conversation ID available");
      return;
    }

    // Update messages in Convex
    await updateConversationMessages(CONVERSATION_ID, messages);
  } catch (err) {
    console.error("Save conversation error:", err);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { character, input } = req.method === "POST" ? req.body : req.query;
  if (!character || typeof character !== "string")
    return res.status(400).json({ error: "Missing character" });

  if (req.method === "GET") {
    const messages = await loadConversation();
    return res.status(200).json({ memories: messages });
  }

  // Load conversation history (messages only)
  const messages = await loadConversation();

  // Generate reply using static SYSTEM_PROMPT
  const reply = await generateReply(character, input, messages, SYSTEM_PROMPT);

  // Append user message and assistant reply
  messages.push({
    role: "user",
    content: input,
    timestamp: new Date().toISOString(),
  });
  messages.push({
    role: "assistant",
    content: reply,
    timestamp: new Date().toISOString(),
  });

  // Save updated messages to Convex
  await saveConversation(messages);

  return res.status(200).json({ reply });
}
