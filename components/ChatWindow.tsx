// /components/ChatWindow.tsx
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

        if (audioUrl) {
          playAudio(audioUrl);
        }
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
      ? 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/jinxLogo.jpg' // Replace with Jinx avatar
      : 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/Sarah_Fortune.jpg'; // Replace with Miss Fortune avatar

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex-1 overflow-y-auto bg-[#f3f4f6] rounded-lg p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
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
              className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap 
              ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-300 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'bot' && msg.audioUrl && (
              <button onClick={() => playAudio(msg.audioUrl!, idx)}>
                {playingIndex === idx ? (
                  <PauseCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-blue-500" />
                )}
              </button>
            )}
          </div>
        ))}

        {isAnimating && (
          <div className="flex items-start gap-2">
            <img
              src={avatar}
              className="w-8 h-8 rounded-full shadow-md"
              alt="avatar"
            />
            <div className="bg-gray-300 text-gray-800 text-sm px-4 py-2 rounded-2xl max-w-[70%] rounded-bl-none">
              {animatingText}
              <span className="animate-pulse">|</span>
            </div>
          </div>
        )}

        {loading && !isAnimating && (
          <div className="text-gray-500 text-sm">Thinking...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex items-center">
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
          className="flex-1 border border-gray-300 rounded-l-full px-4 py-2 text-sm outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-full text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
