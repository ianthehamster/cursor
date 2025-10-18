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
      <main className="h-screen w-screen">
        <ChatWindow character="jinx" />
      </main>
    </>
  );
}
