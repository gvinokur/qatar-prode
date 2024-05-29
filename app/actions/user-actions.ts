'use server';

import {UserNew} from "../db/tables-definition"
import {createUser, findUserByEmail, getPasswordHash, updateUser} from "../db/users-repository"
import {getServerSession} from "next-auth/next";
import {authOptions} from "../api/auth/[...nextauth]/route";

/**
 *
 * @param user - password_hash in this case should be the plain text password
 */
export async function signupUser(user: UserNew) {
  const existingUser = await findUserByEmail(user.email)
  if (!existingUser) {
    return await createUser({
      ...user,
      password_hash: getPasswordHash(user.password_hash)
    })
  } else {
    return 'Ya existe un usuario con ese e-mail'
  }
}

export async function updateNickname(nickname: string) {
  const user = await getLoggedInUser();
  if(!user) {
    return 'Unauthorized'
  }
  await updateUser(user.id, { nickname })
}

export async function getLoggedInUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}
