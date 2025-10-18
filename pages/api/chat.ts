import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMemories, storeMemory } from '@/lib/mem0';
import { generateReply } from '@/lib/ai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { character, input } = req.method === 'POST' ? req.body : req.query;
  if (!character || typeof character !== 'string')
    return res.status(400).json({ error: 'Missing character' });

  if (req.method === 'GET') {
    const memories = await fetchMemories(character);
    return res.status(200).json({ memories });
  }

  const memories = await fetchMemories(character);
  const reply = await generateReply(character, input, memories);
  await storeMemory(character, `User said: ${input}`);
  await storeMemory(character, `${character} replied: ${reply}`);

  return res.status(200).json({ reply });
}
