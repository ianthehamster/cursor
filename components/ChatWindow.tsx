// /components/ChatWindow.tsx (with typing dots only, no animatingText)
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { PlayCircle, PauseCircle, UserCircle, X } from "lucide-react";
import { useRouter } from "next/router";
import { bouncy } from "ldrs";
import Image from "next/image";
import VoiceCallButton from "./VoiceCallButton";

interface Props {
  character: 'jinx' | 'mf';
}

export default function ChatWindow({ character }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'bot'; content: string; audioUrl?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  // Background transition states
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [currentBg, setCurrentBg] = useState("");
  const [nextBg, setNextBg] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [enableTransition, setEnableTransition] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Register bouncy component on client-side only
  useEffect(() => {
    bouncy.register();
  }, []);

  // Fetch background images on mount
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const res = await axios.get("/api/backgrounds");
        const images = res.data.images || [];
        setBackgroundImages(images);
        if (images.length > 0) {
          setCurrentBg(images[0]);
        }
      } catch (error) {
        console.error("Failed to fetch background images:", error);
        // Fallback to a default image if API fails
        setBackgroundImages(["/ai-gf-whisking.png"]);
        setCurrentBg("/ai-gf-whisking.png");
      }
    };
    fetchBackgrounds();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { input: userMsg, character });
      const reply = res.data.reply || '...';
      const audioUrl = res.data.audioUrl || null;

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: reply, audioUrl },
      ]);

      if (audioUrl) playAudio(audioUrl);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: '⚠️ Failed to fetch reply.' },
      ]);
    } finally {
      setLoading(false);
    }
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

  const changeBackground = () => {
    // Don't change if no images are loaded yet
    if (backgroundImages.length === 0) return;

    // Calculate next index (rotate through images)
    const nextIndex = (currentBgIndex + 1) % backgroundImages.length;
    const newImageUrl = backgroundImages[nextIndex];

    // First, set the next background (it will be rendered at opacity 0)
    setNextBg(newImageUrl);

    // Wait for the DOM to render the next background layer, then start transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
    });

    // After transition completes, clean up
    setTimeout(() => {
      // Update currentBg while isTransitioning is still true (currentBg is at opacity 0)
      setCurrentBg(newImageUrl);
      setCurrentBgIndex(nextIndex);

      // Wait for the browser to paint the updated currentBg
      requestAnimationFrame(() => {
        // Now disable transitions to snap opacity without animation
        setEnableTransition(false);
        setIsTransitioning(false);

        // Wait one more frame for the opacity to snap to 1
        requestAnimationFrame(() => {
          // Now we can safely remove the nextBg layer
          setNextBg("");

          // Re-enable transitions for the next change
          requestAnimationFrame(() => {
            setEnableTransition(true);
          });
        });
      });
    }, 500); // Match this with your transition duration
  };

  const avatar =
    character === 'jinx'
      ? 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/jinxLogo.jpg'
      : 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/Sarah_Fortune.jpg';

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Current Background Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${
          enableTransition ? "transition-opacity duration-500" : ""
        }`}
        style={{
          backgroundImage: `url('${currentBg}')`,
          opacity: isTransitioning ? 0 : 1,
        }}
      />

      {/* Next Background Image (for transition) */}
      {nextBg && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url('${nextBg}')`,
            opacity: isTransitioning ? 1 : 0,
          }}
        />
      )}

      {/* Clickable area for background change - Right side white space (temporary mock event) */}
      <div
        className="absolute top-0 right-0 h-full w-1/3 cursor-pointer z-10"
        onClick={changeBackground}
        title="Click to change background (temporary)"
      />

      {/* Voice Call Button */}
      <VoiceCallButton character={character} />

      {/* User Menu - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-full shadow-lg transition"
          >
            <UserCircle className="w-6 h-6 text-gray-700" />
          </button>
          {showUserMenu && (
            <div className="absolute left-0 mt-2 w-32 bg-white border rounded-md shadow-lg text-sm z-50">
              <button
                onClick={() => router.push('/settings')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay when chat is expanded - click to dismiss */}
      {chatExpanded && (
        <div
          className="absolute inset-0 bg-black/20 z-30"
          onClick={() => setChatExpanded(false)}
        />
      )}

      {/* Collapsible Chat Section */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-md rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out ${
          chatExpanded ? "h-[61%]" : "h-16"
        }`}
      >
        {/* Chat Header Bar - Always visible */}
        <div
          className="flex items-center justify-between px-4 h-16 cursor-pointer border-b border-gray-200"
          onClick={() => setChatExpanded(!chatExpanded)}
        >
          <div className="flex items-center gap-2">
            <Image
              src={avatar}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full shadow-md"
              alt="avatar"
              priority
            />
            <span className="font-medium text-gray-800">
              {character === "jinx" ? "Jinx" : "Miss Fortune"}
            </span>
          </div>
          <button className="text-gray-600">
            {chatExpanded ? (
              <X className="w-5 h-5" />
            ) : (
              <div className="text-sm text-gray-500">Tap to chat</div>
            )}
          </button>
        </div>

        {/* Chat Messages - Only visible when expanded */}
        {chatExpanded && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 h-[calc(100%-8rem)]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[75%] ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {msg.role === "bot" && (
                      <Image
                        src={avatar}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full shadow-md"
                        alt="avatar"
                      />
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow
                      ${
                        msg.role === "user"
                          ? "bg-pink-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "bot" && msg.audioUrl && (
                      <button
                        onClick={() => playAudio(msg.audioUrl!, idx)}
                        className="text-pink-500"
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

              {/* Typing Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 max-w-[75%]">
                    <Image
                      src={avatar}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full shadow-md"
                      alt="avatar"
                    />
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none">
                      <l-bouncy size="20" speed="1.75" color="black"></l-bouncy>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar - Only visible when expanded */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/40 backdrop-blur-md border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Talk to ${
                    character === "jinx" ? "Jinx" : "Miss Fortune"
                  }...`}
                  className="flex-1 bg-gray-100 text-black border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
