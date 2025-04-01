import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter";  // This is the native Prisma adapter

import {getUserById} from "./data/user"
import {db} from "@/lib/db";
import authConfig from "@/auth.config";



export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  callbacks: {
    async session({ token, session }) {
      console.log("SESSION CALLBACK:", { token, session });

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      return session;
    },

    async jwt({ token }) {
      console.log("JWT CALLBACK:", token);

      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;
      token.role = existingUser.role;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});


