import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post('/api/signup', { username, password });
      setMessage('Account created! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500); // ⏩ go to login after 1.5s
    } catch (err) {
      setMessage('❌ Signup failed. User might already exist.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded shadow space-y-3 w-80"
      >
        <h2 className="text-lg font-bold text-center">Sign Up</h2>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <p className="text-sm text-center text-gray-600">{message}</p>

        {/* optional reverse link */}
        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
}
