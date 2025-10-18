import type { NextApiRequest, NextApiResponse } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    await client.mutation(api.users.deleteUser, {
      username,
    });
    res.status(200).json({ ok: true, message: 'Account deleted successfully' });
  } catch (e) {
    const err = e as Error;
    res.status(400).json({
      error: err.message || 'Failed to delete account',
    });
  }
}
