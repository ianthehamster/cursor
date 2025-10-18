import axios from 'axios';

const BASE = 'https://api.mem0.dev/v1';
const API_KEY = process.env.MEM0_API_KEY || '';

const memoryStore: Record<string, string[]> = {
  jinx: [],
  mf: [],
};

export async function fetchMemories(character: string): Promise<string[]> {
  return memoryStore[character] || [];
}

export async function storeMemory(character: string, text: string) {
  if (!memoryStore[character]) memoryStore[character] = [];
  memoryStore[character].push(text);
}

// export async function fetchMemories(character: string): Promise<string[]> {
//   try {
//     const res = await axios.get(`${BASE}/memories/${character}`, {
//       headers: { Authorization: `Bearer ${API_KEY}` },
//     });
//     return res.data.memories || [];
//   } catch (err) {
//     console.error('FetchMemories error:', err);
//     return [];
//   }
// }

// export async function storeMemory(character: string, text: string) {
//   try {
//     await axios.post(
//       `${BASE}/memories/${character}`,
//       { text },
//       {
//         headers: { Authorization: `Bearer ${API_KEY}` },
//       },
//     );
//   } catch (err) {
//     console.error('StoreMemory error:', err);
//   }
// }
