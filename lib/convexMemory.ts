import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

// Initialize Convex client for server-side operations
const convexClient = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || ''
);

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  _id: Id<'conversations'>;
  messages: Message[];
  systemPrompt: string;
  character: 'Chloe' | 'Jinx';
  _creationTime: number;
}

// Get a conversation by ID
export async function getConversation(
  conversationId: Id<'conversations'>
): Promise<Conversation | null> {
  try {
    return await convexClient.query(api.conversations.get, {
      conversationId,
    });
  } catch (err) {
    console.error('Error fetching conversation:', err);
    return null;
  }
}

// Create a new conversation
export async function createConversation(
  systemPrompt: string,
  character: 'Chloe' | 'Jinx',
  messages: Message[] = []
): Promise<Id<'conversations'> | null> {
  try {
    return await convexClient.mutation(api.conversations.create, {
      systemPrompt,
      character,
      messages,
    });
  } catch (err) {
    console.error('Error creating conversation:', err);
    return null;
  }
}

// Update conversation messages
export async function updateConversationMessages(
  conversationId: Id<'conversations'>,
  messages: Message[]
): Promise<void> {
  try {
    await convexClient.mutation(api.conversations.updateMessages, {
      conversationId,
      messages,
    });
  } catch (err) {
    console.error('Error updating messages:', err);
  }
}

// Add a single message to conversation
export async function addMessageToConversation(
  conversationId: Id<'conversations'>,
  role: 'user' | 'assistant',
  content: string,
  timestamp: string
): Promise<void> {
  try {
    await convexClient.mutation(api.conversations.addMessage, {
      conversationId,
      role,
      content,
      timestamp,
    });
  } catch (err) {
    console.error('Error adding message:', err);
  }
}

// Update system prompt
export async function updateSystemPrompt(
  conversationId: Id<'conversations'>,
  systemPrompt: string
): Promise<void> {
  try {
    await convexClient.mutation(api.conversations.updateSystemPrompt, {
      conversationId,
      systemPrompt,
    });
  } catch (err) {
    console.error('Error updating system prompt:', err);
  }
}

// List all conversations
export async function listConversations(): Promise<Conversation[]> {
  try {
    return await convexClient.query(api.conversations.list);
  } catch (err) {
    console.error('Error listing conversations:', err);
    return [];
  }
}

// Delete a conversation
export async function deleteConversation(
  conversationId: Id<'conversations'>
): Promise<void> {
  try {
    await convexClient.mutation(api.conversations.deleteConversation, {
      conversationId,
    });
  } catch (err) {
    console.error('Error deleting conversation:', err);
  }
}
