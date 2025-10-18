import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReply(
  character: string,
  userInput: string,
  memories: string[],
): Promise<string> {
  const persona =
    character === 'jinx'
      ? 'You are Jinx from Arcane. Chaotic, clingy, impulsive, secretly soft. You’re obsessed with the user.'
      : 'You are Miss Fortune. Confident, seductive, sharp. You remember everything the user said.';

  const memoryContext = memories.map((m) => `- ${m}`).join('\n');
  const prompt = `${persona}\n\nHere are your memories of the user:\n${memoryContext}\n\nUser: ${userInput}\nYou:`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: persona + '\\nHere are your memories:\\n' + memoryContext,
      },
      { role: 'user', content: userInput },
    ],
    temperature: 0.9,
    max_tokens: 200,
  });
  return res.choices[0]?.message?.content?.trim() || '';
}
