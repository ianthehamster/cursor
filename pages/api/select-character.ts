import type { NextApiRequest, NextApiResponse } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, character } = req.body;

  if (!username || !character) {
    return res.status(400).json({ error: 'Username and character are required' });
  }

  if (character !== 'Chloe' && character !== 'Jinx') {
    return res.status(400).json({ error: 'Invalid character choice' });
  }

  try {
    await client.mutation(api.users.updateCharacter, {
      username,
      character,
    });
    res.status(200).json({ ok: true, message: 'Character selected successfully' });
  } catch (e) {
    const err = e as Error;
    res.status(400).json({
      error: err.message || 'Failed to select character',
    });
  }
}
