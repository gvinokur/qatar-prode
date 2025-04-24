import {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {findUserByEmail, getPasswordHash} from "./db/users-repository";
import {pick} from "next/dist/lib/pick";

export const authOptions: NextAuthOptions = {
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
            name: user.nickname,
            nickname: user.nickname,
            isAdmin: user.is_admin,
            email_verified: user.email_verified,
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    session: ({session, trigger, token, newSession}) => {
      session.user = {
        ...pick(token, ['email', 'name', 'nickname', 'isAdmin', 'id', 'email', 'email_verified']),
        ...session.user
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
}
