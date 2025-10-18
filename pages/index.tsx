import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
// import ChatWindow from '@/components/ChatWindow';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), {
  ssr: false, // 💥 disables server-side rendering
});

export default function Home() {
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
      </main>
    </>
  );
}
