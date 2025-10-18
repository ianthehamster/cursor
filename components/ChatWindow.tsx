// /components/ChatWindow.tsx (Messenger-style polished UI)
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { PlayCircle, PauseCircle } from 'lucide-react';

interface Props {
  character: 'jinx' | 'mf';
}

export default function ChatWindow({ character }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'bot'; content: string; audioUrl?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [animatingText, setAnimatingText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, animatingText]);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    setIsAnimating(false);
    setAnimatingText('');

    try {
      const res = await axios.post('/api/chat', { input: userMsg, character });
      const reply = res.data.reply || '...';
      const audioUrl = res.data.audioUrl || null;

      animateText(reply, audioUrl);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: '⚠️ Failed to fetch reply.' },
      ]);
      setLoading(false);
    }
  };

  const animateText = (text: string, audioUrl?: string) => {
    setIsAnimating(true);
    setAnimatingText('');
    let i = 0;

    const interval = setInterval(() => {
      setAnimatingText((prev) => prev + text[i]);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsAnimating(false);
        setMessages((prev) => [
          ...prev,
          { role: 'bot', content: text, audioUrl },
        ]);
        if (audioUrl) playAudio(audioUrl);
      }
    }, 20);
  };

  const playAudio = (url: string, index?: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const newAudio = new Audio(url);
    audioRef.current = newAudio;
    if (typeof index === 'number') setPlayingIndex(index);
    newAudio.play();
    newAudio.onended = () => setPlayingIndex(null);
  };

  const avatar =
    character === 'jinx'
      ? 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/jinxLogo.jpg'
      : 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/Sarah_Fortune.jpg';

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex items-end gap-2 max-w-[75%] ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {msg.role === 'bot' && (
                <img
                  src={avatar}
                  className="w-8 h-8 rounded-full shadow-md"
                  alt="avatar"
                />
              )}
              <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow 
                ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'bot' && msg.audioUrl && (
                <button
                  onClick={() => playAudio(msg.audioUrl!, idx)}
                  className="text-blue-500"
                >
                  {playingIndex === idx ? (
                    <PauseCircle className="w-5 h-5" />
                  ) : (
                    <PlayCircle className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isAnimating && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2 max-w-[75%]">
              <img
                src={avatar}
                className="w-8 h-8 rounded-full shadow-md"
                alt="avatar"
              />
              <div className="bg-gray-100 text-gray-900 text-sm px-4 py-2 rounded-2xl rounded-bl-none">
                {animatingText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={`Talk to ${
              character === 'jinx' ? 'Jinx' : 'Miss Fortune'
            }...`}
            className="flex-1 bg-gray-100 text-black border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
