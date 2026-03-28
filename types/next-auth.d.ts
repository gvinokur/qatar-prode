import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `auth()`, `getSession()`, and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      nickname: string | null
      isAdmin: boolean
      isAdFree: boolean
      emailVerified: boolean
      preferred_locale?: string | null
    } & DefaultSession["user"]
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string
    nickname: string | null
    isAdmin: boolean
    isAdFree: boolean
    emailVerified: boolean
    preferred_locale?: string | null
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth()`, when using JWT sessions */
  interface JWT {
    id: string
    nickname: string | null
    isAdmin: boolean
    isAdFree: boolean
    emailVerified: boolean
    preferred_locale?: string | null
  }
}
