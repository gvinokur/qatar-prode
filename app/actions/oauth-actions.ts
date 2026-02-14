"use server";

import { auth } from "@/auth";
import { getAuthMethodsForEmail, updateUser } from "../db/users-repository";
import { revalidatePath } from "next/cache";

/**
 * Check what authentication methods are available for an email
 * Used in progressive disclosure flow to determine next step
 */
export async function checkAuthMethods(email: string): Promise<{
  hasPassword: boolean;
  hasGoogle: boolean;
  userExists: boolean;
  success: boolean;
  error?: string;
}> {
  try {
    if (!email || !email.trim()) {
      return {
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: "Email is required"
      };
    }

    const authMethods = await getAuthMethodsForEmail(email.toLowerCase());

    return {
      ...authMethods,
      success: true
    };
  } catch (error) {
    console.error("Error checking auth methods:", error);
    return {
      hasPassword: false,
      hasGoogle: false,
      userExists: false,
      success: false,
      error: "Failed to check authentication methods"
    };
  }
}

/**
 * Set nickname for authenticated user
 * Used after OAuth signup when user needs to choose a nickname
 */
export async function setNickname(nickname: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated"
      };
    }

    if (!nickname || !nickname.trim()) {
      return {
        success: false,
        error: "Nickname is required"
      };
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 2) {
      return {
        success: false,
        error: "Nickname must be at least 2 characters"
      };
    }

    if (trimmedNickname.length > 50) {
      return {
        success: false,
        error: "Nickname must be less than 50 characters"
      };
    }

    // Update user nickname and clear nickname_setup_required flag
    await updateUser(session.user.id, {
      nickname: trimmedNickname,
      nickname_setup_required: false
    });

    // Revalidate paths that display user info
    revalidatePath('/');

    return {
      success: true
    };
  } catch (error) {
    console.error("Error setting nickname:", error);
    return {
      success: false,
      error: "Failed to set nickname"
    };
  }
}
