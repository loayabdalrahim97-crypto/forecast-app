import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Google is only registered as a provider when its credentials are
// actually configured — an unconfigured OAuth provider showing a
// broken "Continue with Google" button is worse than not showing one
// at all, so this stays entirely conditional on env vars being set.
const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // We use the JWT strategy (no database adapter), so an OAuth
      // sign-in needs its own find-or-create against our User table —
      // this is the one place that happens. Credentials sign-in
      // already returns our real user.id from authorize() above, so
      // it skips this entirely.
      if (account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: { email: user.email, name: user.name ?? undefined },
        });
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const isGoogleSignInAvailable = googleConfigured;
