"use server";

import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import { auth } from "@/auth";
import { getAuthMethodsForEmail, updateUser } from "../db/users-repository";
import { revalidatePath } from "next/cache";

/**
 * Check what authentication methods are available for an email
 * Used in progressive disclosure flow to determine next step
 */
export async function checkAuthMethods(email: string, locale: Locale = 'es'): Promise<{
  hasPassword: boolean;
  hasGoogle: boolean;
  userExists: boolean;
  success: boolean;
  error?: string;
}> {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    if (!email?.trim()) {
      return {
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: t('emailInput.email.error')
      };
    }

    const authMethods = await getAuthMethodsForEmail(email.toLowerCase());

    return {
      ...authMethods,
      success: true
    };
  } catch (error) {
    console.error("Error checking auth methods:", error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return {
      hasPassword: false,
      hasGoogle: false,
      userExists: false,
      success: false,
      error: tErrors('generic')
    };
  }
}

/**
 * Set nickname for authenticated user
 * Used after OAuth signup when user needs to choose a nickname
 */
export async function setNickname(nickname: string, locale: Locale = 'es'): Promise<{
  success: boolean;
  error?: string;
}> {
  const tAuth = await getTranslations({ locale, namespace: 'auth' });
  const tErrors = await getTranslations({ locale, namespace: 'errors' });

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: tErrors('auth.unauthorized')
      };
    }

    if (!nickname?.trim()) {
      return {
        success: false,
        error: tAuth('accountSetup.nickname.required')
      };
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 2) {
      return {
        success: false,
        error: tAuth('nicknameSetup.nickname.helperText')
      };
    }

    if (trimmedNickname.length > 50) {
      return {
        success: false,
        error: tAuth('nicknameSetup.nickname.helperText')
      };
    }

    // Update user nickname
    await updateUser(session.user.id, {
      nickname: trimmedNickname
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
      error: tErrors('generic')
    };
  }
}
