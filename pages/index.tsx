import Head from 'next/head';
import ChatWindow from '@/components/ChatWindow';

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
