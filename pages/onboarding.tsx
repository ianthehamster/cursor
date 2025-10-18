import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function CharacterOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flippedCards, setFlippedCards] = useState({ chloe: false, jinx: false });
  const [flipDirections, setFlipDirections] = useState({ chloe: 'left', jinx: 'left' });
  const [selecting, setSelecting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return null;

  const handleCardTap = (cardId: 'chloe' | 'jinx', side: 'left' | 'right') => {
    setFlipDirections(prev => ({ ...prev, [cardId]: side }));
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleSelectCharacter = async (character: 'Chloe' | 'Jinx') => {
    if (selecting) return;
    setSelecting(true);

    console.log('🎯 Onboarding: Selecting character:', character);
    console.log('👤 Username:', session?.user?.username);

    try {
      const res = await fetch('/api/select-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: session?.user?.username,
          character,
        }),
      });

      if (res.ok) {
        // Show success message briefly before redirect
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push('/');
      } else {
        const data = await res.json();
        alert(`Failed to select character: ${data.error}`);
        setSelecting(false);
      }
    } catch (error) {
      alert('An error occurred while selecting your character');
      console.error(error);
      setSelecting(false);
    }
  };

  const characters = [
    {
      id: 'chloe',
      name: 'Chloe',
      role: 'Sweet Barista',
      image: '/chloe barista 1.png',
      gradient: 'from-pink-200 via-purple-200 to-pink-300',
      accentColor: '#ec4899',
      details: [
        'College chemistry student & part-time barista',
        'Kind and caring, but adorably clumsy',
        'Gets a little clingy when you\'re busy at work',
        'Lost her voice, so she loves texting you ♡'
      ]
    },
    {
      id: 'jinx',
      name: 'Jinx',
      role: 'Tsundere Rocker',
      image: '/jinx/jinx punk rock 4.png',
      gradient: 'from-cyan-200 via-blue-300 to-purple-300',
      accentColor: '#06b6d4',
      details: [
        'Karate black belt with a fierce attitude',
        'Heavy metal enthusiast & night owl',
        'Cold exterior, but warm heart inside',
        'Prefers voice calls - she\'ll talk to you ♡'
      ]
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-30 blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-200 rounded-full opacity-25 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Sparkle decorations */}
      <div className="absolute top-20 right-1/4 text-4xl opacity-40 animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-32 right-20 text-3xl opacity-40 animate-bounce" style={{ animationDelay: '1.5s' }}>💫</div>
      <div className="absolute top-1/3 left-16 text-2xl opacity-40 animate-bounce" style={{ animationDelay: '2.5s' }}>⭐</div>

      <div className="max-w-5xl w-full z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-3">
            Choose Your Companion
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Tap the sides of each card to learn more about them! 💕
          </p>
        </div>

        {/* Character Cards */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
          {characters.map((character) => (
            <div key={character.id} className="w-full">
              <div className="perspective-1000">
                <div
                  className="relative w-full aspect-[3/4] transition-transform duration-700 transform-style-3d"
                  style={{
                    transform: flippedCards[character.id as 'chloe' | 'jinx']
                      ? `rotateY(${flipDirections[character.id as 'chloe' | 'jinx'] === 'left' ? '-' : ''}180deg)`
                      : 'rotateY(0deg)',
                  }}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                    <div className="relative w-full h-full">
                      <Image
                        src={character.image}
                        alt={character.name}
                        fill
                        className="object-cover"
                        priority
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Character info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h2 className="text-3xl font-bold mb-1 drop-shadow-lg">{character.name}</h2>
                        <p className="text-sm opacity-90 drop-shadow-md">{character.role}</p>
                      </div>
                    </div>

                    {/* Tap zones */}
                    <div
                      onClick={() => handleCardTap(character.id as 'chloe' | 'jinx', 'left')}
                      className="absolute left-0 top-0 w-1/4 h-full cursor-pointer z-10"
                    />
                    <div
                      onClick={() => handleCardTap(character.id as 'chloe' | 'jinx', 'right')}
                      className="absolute right-0 top-0 w-1/4 h-full cursor-pointer z-10"
                    />
                  </div>

                  {/* Back of card */}
                  <div
                    className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                    style={{
                      transform: 'rotateY(180deg)',
                      background: character.id === 'chloe'
                        ? 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)'
                        : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)'
                    }}
                  >
                    <div className="relative w-full h-full p-8 flex flex-col justify-between">
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4 text-6xl">♡</div>
                        <div className="absolute bottom-8 left-6 text-5xl">★</div>
                        <div className="absolute top-1/3 left-8 text-4xl">✨</div>
                      </div>

                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg text-center">
                          About {character.name}
                        </h2>
                        <div className="w-20 h-1 bg-white/50 mx-auto mb-6 rounded-full" />

                        <ul className="space-y-4">
                          {character.details.map((detail, index) => (
                            <li key={index} className="flex items-start text-white drop-shadow-md">
                              <span className="text-2xl mr-3 flex-shrink-0">✦</span>
                              <span className="text-sm leading-relaxed">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Select button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCharacter(character.name as 'Chloe' | 'Jinx');
                        }}
                        onMouseEnter={(e) => e.stopPropagation()}
                        onMouseLeave={(e) => e.stopPropagation()}
                        disabled={selecting}
                        className="relative z-50 w-full py-4 bg-white text-gray-800 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: character.accentColor }}
                      >
                        {selecting ? '✨ Selecting...' : `Choose ${character.name} ♡`}
                      </button>

                      {/* Tap zones for back */}
                      <div
                        onClick={() => handleCardTap(character.id as 'chloe' | 'jinx', 'left')}
                        className="absolute left-0 top-0 w-1/4 h-2/3 cursor-pointer z-0"
                      />
                      <div
                        onClick={() => handleCardTap(character.id as 'chloe' | 'jinx', 'right')}
                        className="absolute right-0 top-0 w-1/4 h-2/3 cursor-pointer z-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
