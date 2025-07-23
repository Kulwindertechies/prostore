import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";
import { cookies } from "next/headers";

export const config = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (credentials === null) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        if (user && user.password) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password
          );

          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, trigger, token }: any) {
      // Ensure user.id is available in session
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.name = token.name;

      if (trigger === "update") {
        session.user.name = user.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;         // Add this line
        token.role = user.role;

        if (user.name === "NO_NAME") {
          token.name = user.email!.split("@")[0];

          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }

        if(trigger === 'signIn' || trigger === 'signUp'){
         const cookiesObject = await cookies();
         const sessionCartId = cookiesObject.get('sessionCartId')?.value;

         if (sessionCartId) {
          const sessionCart = await prisma.cart.findFirst({
            where: {sessionCartId}
          });

          if (sessionCart) {
            //delete crrunt user cart
            await prisma.cart.deleteMany({
             where: {userId: user.id},
            });

            //assign new cart
            await prisma.cart.update({
              where: {id: sessionCart.id},
              data: {userId: user.id},
            })
          }
         }
        }
      }
      // Handle seeeion update
      if(session?.user.name && trigger === 'update'){
        token.name = session.user.name;
      }

      return token;
    },
//   authorized({ request, auth }) {
//   const protectedPaths = [
//     /\/shipping-address/,
//     /\/payment-method/,
//     /\/place-order/,
//     /\/profile/,
//     /\/user\/(.*)/,
//     /\/order\/(.*)/,
//     /\/admin/,
//   ];
//   const { pathname } = request.nextUrl;

//   if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

//   return true; // Allow by default
// }
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
