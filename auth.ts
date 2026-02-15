import NextAuth, {type DefaultSession} from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  findUserByEmail,
  getPasswordHash,
  findUserByOAuthAccount,
  linkOAuthAccount,
  createOAuthUser,
  verifyOTP,
  clearOTP
} from "./app/db/users-repository";
import {pick} from "next/dist/lib/pick";
import {OAuthAccount} from "./app/db/tables-definition";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/?openSignin=true',
    signOut: '/'
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: {label: 'Email', type: 'rext'},
        password: {label: 'Password', type: 'password'}
      },
      async authorize({email, password}: any) {
        const user = await findUserByEmail(email)
        const passwordHash = getPasswordHash(password)

        if (user && passwordHash === user.password_hash) {
          return {
            id: user.id,
            email: user.email,
            name: user.nickname || user.email,
            nickname: user.nickname,
            isAdmin: user.is_admin || false,
            emailVerified: user.email_verified || false,
          }
        }

        return null
      }
    }),
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'text' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize({ email, otp }: any) {
        if (!email || !otp) {
          return null;
        }

        // Verify OTP code
        const result = await verifyOTP(email, otp);

        if (result.success && result.user) {
          // Clear OTP after successful authentication
          await clearOTP(result.user.id);

          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.nickname || result.user.email,
            nickname: result.user.nickname,
            isAdmin: result.user.is_admin || false,
            emailVerified: result.user.email_verified || false,
          };
        }

        return null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Skip for credentials and OTP providers (already handled in authorize)
      if (account?.provider === "credentials" || account?.provider === "otp") {
        return true;
      }

      // OAuth provider sign-in flow
      if (account?.provider === "google" && profile?.email) {
        const oauthAccount: OAuthAccount = {
          provider: account.provider,
          provider_user_id: account.providerAccountId,
          email: profile.email,
          connected_at: new Date().toISOString()
        };

        // Check if OAuth account already exists
        const existingOAuthUser = await findUserByOAuthAccount(
          account.provider,
          account.providerAccountId
        );

        if (existingOAuthUser) {
          // OAuth account already linked, populate user object
          user.id = existingOAuthUser.id;
          user.email = existingOAuthUser.email;
          user.name = existingOAuthUser.nickname || existingOAuthUser.email;
          user.nickname = existingOAuthUser.nickname;
          user.isAdmin = existingOAuthUser.is_admin || false;
          user.emailVerified = existingOAuthUser.email_verified || false;
          return true;
        }

        // Check if user exists with this email (account merging)
        const existingUser = await findUserByEmail(profile.email);

        if (existingUser) {
          // Link OAuth account to existing user
          const updatedUser = await linkOAuthAccount(existingUser.id, oauthAccount);
          if (updatedUser) {
            user.id = updatedUser.id;
            user.email = updatedUser.email;
            user.name = updatedUser.nickname || updatedUser.email;
            user.nickname = updatedUser.nickname;
            user.isAdmin = updatedUser.is_admin || false;
            user.emailVerified = updatedUser.email_verified || false;
            return true;
          }
        }

        // Create new OAuth user
        const displayName = profile.name || null;
        const newUser = await createOAuthUser(profile.email, oauthAccount, displayName);

        if (newUser) {
          user.id = newUser.id;
          user.email = newUser.email;
          user.name = newUser.nickname || newUser.email;
          user.nickname = newUser.nickname;
          user.isAdmin = newUser.is_admin || false;
          user.emailVerified = newUser.email_verified || false;
          return true;
        }

        return false;
      }

      return true;
    },
    session: ({session, trigger, token, user }) => {
      session.user = {
        ...pick(token, ['email', 'name', 'nickname', 'isAdmin', 'id', 'emailVerified']),
        ...session.user,
      }
      return session
    },
    jwt: ({token, user, trigger, session}) => {
      if (user || session) {
        token = {
          ...token,
          ...(user || {}),
          ...(trigger === 'update' && session ? session : {})
        }
      }
      return token
    }
  },
})
