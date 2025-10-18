import React, { useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/router';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), {
  ssr: false, // 💥 disables server-side rendering
});

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🧭 redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return null; // avoid rendering flicker while redirecting
  return (
    <>
      <Head>
        <title>ChronoCrush</title>
      </Head>
      <main className="h-screen w-screen flex items-center justify-center bg-white">
        {/* Mobile app container with white sidebars */}
        <div className="relative w-full max-w-md h-full bg-white shadow-2xl">
          <ChatWindow character="jinx" />
        </div>
        <LogOut
          onClick={() => signOut()}
          className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer"
        />
      </main>
    </>
  );
}
