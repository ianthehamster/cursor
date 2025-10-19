import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  conversations: defineTable({
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string(),
        timestamp: v.string(),
      }),
    ),
    systemPrompt: v.string(),
    character: v.optional(v.union(v.literal('Chloe'), v.literal('Jinx'))),
  }),

  memory: defineTable({
    content: v.string(),
    conversation_id: v.id('conversations'),
    date_range: v.string(),
  }).index('by_conversation', ['conversation_id']),

  // users: defineTable({
  //   username: 'string',
  //   password: 'string',
  //   name: 'string',
  // }),
  users: defineTable({
    username: v.string(),
    password: v.string(),
    name: v.string(),
    character: v.optional(v.union(v.literal('Chloe'), v.literal('Jinx'))),
  }).index('by_username', ['username']),
});
