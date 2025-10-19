// /pages/settings.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut, useSession } from 'next-auth/react';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { darkMode, toggleDarkMode } = useTheme();
  const [username, setUsername] = useState('');

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) {
    router.push('/login');
    return null;
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.',
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: session?.user?.name }),
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
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-pink-100/50 to-white dark:from-gray-900 dark:to-black transition-colors">
      {/* Floating top bar buttons */}
      <div className="absolute top-4 left-4 z-10 flex justify-between w-[calc(100%-2rem)]">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full text-sm text-gray-800 dark:text-gray-200 shadow-md hover:bg-white"
        >
          ← Back
        </button>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full text-sm shadow-md transition"
        >
          Log Out
        </button>
      </div>

      {/* Settings Card */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/40 dark:bg-gray-900/60 backdrop-blur-lg rounded-t-3xl shadow-2xl p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account & preferences
          </p>
        </div>

        {/* Profile */}
        <section className="space-y-3">
          <h2 className="text-md font-semibold text-gray-800 dark:text-gray-200">
            👤 Profile
          </h2>
          <div className="flex flex-col gap-3">
            <input
              value={username === '' ? session?.user?.name || 'User' : username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Username"
            />
            <input
              value={session?.user?.username || 'unknown@email.com'}
              disabled
              className="border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 p-3 rounded-xl text-sm"
            />
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-3">
          <h2 className="text-md font-semibold text-gray-800 dark:text-gray-200">
            🎨 Appearance
          </h2>
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Dark Mode
            </span>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => toggleDarkMode()}
              className="w-5 h-5 accent-pink-500"
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-3 border-t border-red-200 dark:border-red-900 pt-6">
          <h2 className="text-md font-semibold text-red-600 dark:text-red-400">
            ⚠️ Danger Zone
          </h2>
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm w-full font-medium transition"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
