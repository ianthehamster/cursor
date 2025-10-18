import type { NextApiRequest, NextApiResponse } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api'; // ✅ import the typed Convex API

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body;

  try {
    await client.mutation(api.users.signup, { username, password });
    res.status(200).json({ ok: true });
  } catch (e) {
    const err = e as Error; // ✅ fix “e is of type unknown”
    res
      .status(400)
      .json({
        error: err.message || 'Signup failed. Is user already registered?',
      });
  }
}
