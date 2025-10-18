import { mutation, query } from './_generated/server';
import bcrypt from 'bcryptjs';

export const signupRaw = mutation(
  async (ctx, args: { username: string; password: string; name: string; character: 'Chloe' | 'Jinx' }) => {
    await ctx.db.insert('users', {
      username: args.username,
      password: args.password,
      name: args.name,
      character: args.character,
    });
  },
);

export const signup = mutation(
  async (ctx, args: { username: string; password: string; name?: string; character?: 'Chloe' | 'Jinx' }) => {
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
      character: args.character ?? 'Chloe', // Default to Chloe if not specified
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

export const updateCharacter = mutation(
  async (ctx, args: { username: string; character: 'Chloe' | 'Jinx' }) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('username'), args.username))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      character: args.character,
    });

    return 'Character updated';
  },
);

export const deleteUser = mutation(
  async (ctx, args: { username: string }) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('username'), args.username))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.delete(user._id);

    return 'User deleted successfully';
  },
);
