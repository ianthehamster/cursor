import Head from 'next/head';
import { useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import MemorySidebar from '@/components/MemorySidebar';

export default function Home() {
  const [activeCharacter, setActiveCharacter] = useState<'jinx' | 'mf'>('jinx');

  return (
    <>
      <Head>
        <title>ChronoCrush</title>
      </Head>
      <main className="flex min-h-screen">
        <div className="w-1/4 border-r border-gray-300 p-4">
          <button
            onClick={() => setActiveCharacter('jinx')}
            className="block w-full mb-2 p-2 bg-pink-500 text-white rounded"
          >
            Jinx
          </button>
          <button
            onClick={() => setActiveCharacter('mf')}
            className="block w-full p-2 bg-red-600 text-white rounded"
          >
            Miss Fortune
          </button>
          <MemorySidebar character={activeCharacter} />
        </div>
        <div className="w-3/4 p-4">
          <ChatWindow character={activeCharacter} />
        </div>
      </main>
    </>
  );
}
