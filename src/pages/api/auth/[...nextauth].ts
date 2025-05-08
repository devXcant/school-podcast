import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "../../../lib/supabase";
import type { UserRole } from "../../../types";

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          // Authenticate with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            console.error("Supabase auth error:", error);
            return null;
          }

          // Get user profile data
          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileError || !profileData) {
            console.error("Profile fetch error:", profileError);
            return null;
          }

          // Validate the role is a valid UserRole
          const validRoles: UserRole[] = [
            "student",
            "course_rep",
            "lecturer",
            "admin",
          ];
          const role = validRoles.includes(profileData.role as UserRole)
            ? (profileData.role as UserRole)
            : "student";

          return {
            id: data.user.id,
            email: data.user.email || "",
            name: profileData.name || "",
            role: role,
            image: profileData.image || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      }
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "your-fallback-secret-do-not-use-in-production",
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
