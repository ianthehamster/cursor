// /pages/settings.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('Jinxy');
  const [aiCharacter, setAiCharacter] = useState<'jinx' | 'mf'>('jinx');
  const [affection, setAffection] = useState(3);
  const [jealousy, setJealousy] = useState(2);
  const [humor, setHumor] = useState('Flirty');
  const [voice, setVoice] = useState('Soft Jinx');
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  const { darkMode, toggleDarkMode } = useTheme();

  // wait or block unauthorized access
  if (status === 'loading') return <p>Loading...</p>;
  if (!session) {
    router.push('/login');
    return null;
  }

  console.log('User session:', session);

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: session?.user?.username,
        }),
      });

      if (res.ok) {
        await signOut({ redirect: false });
        router.push('/signup');
      } else {
        const data = await res.json();
        alert(`Failed to delete account: ${data.error}`);
      }
    } catch (error) {
      alert('An error occurred while deleting your account');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      {' '}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Chat
        </button>
      </div>
      {/* Profile */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">👤 Profile</h2>
        <div className="flex flex-col gap-2">
          <input
            value={username === '' ? session?.user?.name || 'User' : username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded"
            placeholder="Username"
          />
          <input
            value={session?.user?.username || 'unknown@email.com'}
            disabled
            className="border p-2 rounded bg-gray-100"
          />
          <LogOut
            onClick={() => router.push('/api/auth/signout')}
            className="cursor-pointer mt-3"
          />
        </div>
      </section>
      {/* Personalization */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">💞 AI Girlfriend</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Character</label>
            <select
              value={aiCharacter}
              onChange={(e) => setAiCharacter(e.target.value as 'jinx' | 'mf')}
              className="w-full border p-2 rounded"
            >
              <option value="jinx">Jinx</option>
              <option value="mf">Chloe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Affection</label>
            <input
              type="range"
              min="1"
              max="5"
              value={affection}
              onChange={(e) => setAffection(+e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm">Jealousy</label>
            <input
              type="range"
              min="1"
              max="5"
              value={jealousy}
              onChange={(e) => setJealousy(+e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm">Humor</label>
            <select
              value={humor}
              onChange={(e) => setHumor(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option>Flirty</option>
              <option>Goofy</option>
              <option>Chill</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option>Soft Jinx</option>
              <option>Chloe Classic</option>
              <option>Cybernetic Echo</option>
            </select>
          </div>
        </div>
      </section>
      {/* Memory & Chat */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">🧠 Memory & Chat</h2>
        <div className="flex items-center justify-between">
          <span>Enable Memory Storage</span>
          <input
            type="checkbox"
            checked={memoryEnabled}
            onChange={() => setMemoryEnabled((p) => !p)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm w-max">
            View Memories
          </button>
          <button className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded text-sm w-max">
            Clear Memory (⚠️)
          </button>
        </div>
      </section>
      {/* Appearance */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">🎨 Appearance</h2>
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => toggleDarkMode()}
          />
        </div>
      </section>
      {/* Chat History */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">🕒 Chat History</h2>
        <ul className="space-y-1 text-sm">
          <li className="flex justify-between items-center border px-3 py-2 rounded">
            <span>07 Oct 2025 – Lonely night</span>
            <div className="flex gap-2">
              <button className="text-blue-600 hover:underline">Open</button>
              <button className="text-red-500 hover:underline">🗑</button>
            </div>
          </li>
          <li className="flex justify-between items-center border px-3 py-2 rounded">
            <span>04 Oct 2025 – Pillow Talk</span>
            <div className="flex gap-2">
              <button className="text-blue-600 hover:underline">Open</button>
              <button className="text-red-500 hover:underline">🗑</button>
            </div>
          </li>
        </ul>
      </section>
      {/* Danger Zone */}
      <section className="space-y-2 border-t-2 border-red-200 pt-6">
        <h2 className="text-lg font-semibold text-red-600">⚠️ Danger Zone</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4 space-y-3">
          <p className="text-sm text-red-700">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
