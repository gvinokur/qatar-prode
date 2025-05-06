import { DefaultSession, Jwt as DefaultJwt } from "next-auth"
import { JWT as DefaultJWT} from "next-auth/jwt"
import {type AdapterUser as BaseAdapterUser, AdapterUser} from "next-auth/adapters";
import {DefaultUser} from "@auth/core/types";

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT{
    id:string
    isAdmin?: boolean,
    nickname?: string | null,
    email_verified?: boolean
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends BaseAdapterUser {
    id:string
    nickname?: string | null,
    isAdmin?: boolean
    email_verified?: boolean
  }
}


declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: AdapterUser
  }

  interface Jwt extends DefaultJwt{
    id:string
    isAdmin?: boolean,
    nickname?: string | null,
    email_verified?: boolean
  }

  interface User extends DefaultUser {
    id:string
    nickname?: string | null,
    isAdmin?: boolean
    email_verified?: boolean
  }
}
