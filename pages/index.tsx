import Head from 'next/head';
import dynamic from 'next/dynamic';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), {
  ssr: false,
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
