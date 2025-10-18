'use node';

import { action } from '../_generated/server';
import { api } from '../_generated/api'; // ✅ import the typed API
import bcrypt from 'bcryptjs';

export const signup = action(
  async (ctx, args: { username: string; password: string; name: string }) => {
    // ✅ use typed reference instead of string
    const existing = await ctx.runQuery(api.users.findUser, {
      username: args.username,
    });
    if (existing) throw new Error('Username already exists');

    const hashedPassword = await bcrypt.hash(args.password, 10);

    // ✅ same here — use typed reference
    await ctx.runMutation(api.users.signupRaw, {
      username: args.username,
      password: hashedPassword,
      name: args.name,
    });

    return 'User created';
  },
);
