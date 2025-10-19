import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/router';
import axios from 'axios';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), {
  ssr: false, // 💥 disables server-side rendering
});

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [character, setCharacter] = useState<'jinx' | 'mf' | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧭 redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch user's selected character
  useEffect(() => {
    const fetchUserCharacter = async () => {
      if (session?.user?.username) {
        try {
          const res = await axios.get(`/api/user?username=${session.user.username}`);
          const userCharacter = res.data.character;

          // 🐛 Debug logging
          console.log('🔍 Raw character from DB:', userCharacter);
          console.log('🔍 Character type:', typeof userCharacter);

          // Map 'Chloe' -> 'mf', 'Jinx' -> 'jinx'
          // Make comparison case-insensitive and trim whitespace
          const normalizedChar = (userCharacter || '').toString().trim().toLowerCase();
          const mappedChar = normalizedChar === 'jinx' ? 'jinx' : 'mf';

          console.log('✅ Mapped character:', mappedChar);
          setCharacter(mappedChar);
        } catch (error) {
          console.error('Failed to fetch user character:', error);
          // Default to jinx if fetch fails
          setCharacter('jinx');
        } finally {
          setLoading(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchUserCharacter();
    }
  }, [session, status]);

  if (status === 'loading' || loading) return <p>Loading...</p>;
  if (!session || !character) return null; // avoid rendering flicker while redirecting
  return (
    <>
      <Head>
        <title>ChronoCrush</title>
      </Head>
      <main className="h-screen w-screen flex items-center justify-center bg-white">
        {/* Mobile app container with white sidebars */}
        <div className="relative w-full max-w-md h-full bg-white shadow-2xl">
          <ChatWindow character={character} />
        </div>
        <LogOut
          onClick={() => signOut()}
          className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer"
        />
      </main>
    </>
  );
}
