import { mutation, query } from './_generated/server';
import bcrypt from 'bcryptjs';

export const signupRaw = mutation(
  async (ctx, args: { username: string; password: string; name: string }) => {
    await ctx.db.insert('users', {
      username: args.username,
      password: args.password,
      name: args.name,
    });
  },
);

export const signup = mutation(
  async (ctx, args: { username: string; password: string; name?: string }) => {
    // 🔍 check if user already exists
    const existing = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('username'), args.username))
      .first();

    if (existing) {
      throw new Error('Username already exists'); // 🚫 stop early
    }

    const hashedPassword = await bcrypt.hash(args.password, 10);

    await ctx.db.insert('users', {
      username: args.username,
      password: hashedPassword,
      name: args.name ?? args.username,
    });

    return 'User created';
  },
);

export const findUser = query(async (ctx, args: { username: string }) => {
  const user = await ctx.db
    .query('users')
    .filter((q) => q.eq(q.field('username'), args.username))
    .first();
  return user;
});
