import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  conversations: defineTable({
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string(),
        timestamp: v.string(),
      })
    ),
    systemPrompt: v.string(),
  }),

  memory: defineTable({
    content: v.string(),
    conversation_id: v.id('conversations'),
    date_range: v.string(),
  }).index('by_conversation', ['conversation_id']),
});
