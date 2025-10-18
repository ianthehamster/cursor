import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get a conversation by ID
export const get = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    systemPrompt: v.string(),
    messages: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal('user'), v.literal('assistant')),
          content: v.string(),
          timestamp: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert('conversations', {
      systemPrompt: args.systemPrompt,
      messages: args.messages || [],
    });
    return conversationId;
  },
});

// Update conversation messages
export const updateMessages = mutation({
  args: {
    conversationId: v.id('conversations'),
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string(),
        timestamp: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      messages: args.messages,
    });
  },
});

// Add a single message to conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updatedMessages = [
      ...conversation.messages,
      {
        role: args.role,
        content: args.content,
        timestamp: args.timestamp,
      },
    ];

    await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
    });
  },
});

// Update system prompt
export const updateSystemPrompt = mutation({
  args: {
    conversationId: v.id('conversations'),
    systemPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      systemPrompt: args.systemPrompt,
    });
  },
});

// List all conversations (useful for debugging or multiple conversations)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('conversations').collect();
  },
});

// Delete a conversation
export const deleteConversation = mutation({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.conversationId);
  },
});
