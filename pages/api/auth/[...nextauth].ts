import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const user = await client.query(api.users.findUser, {
          username: credentials.username,
        });

        if (!user) return null;
        if (user.password !== credentials.password) return null;

        return { id: user._id, name: user.name, username: user.username };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  jwt: { secret: process.env.NEXTAUTH_SECRET },
  pages: { signIn: '/login' },
});
