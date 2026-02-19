'use server'

import { getLoggedInUser } from './user-actions'
import {
  completeOnboarding,
  skipOnboarding,
  updateOnboardingData,
  dismissTooltip as dismissTooltipRepo,
  updateChecklistItem as updateChecklistItemRepo,
  getOnboardingStatus
} from '../db/onboarding-repository'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '../../i18n.config'

/**
 * Get onboarding data for the logged-in user
 */
export async function getOnboardingData() {
  const user = await getLoggedInUser()
  if (!user?.id) return null

  return getOnboardingStatus(user.id)
}

/**
 * Save current onboarding step for the logged-in user
 */
export async function saveOnboardingStep(step: number, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' })
  const user = await getLoggedInUser()
  if (!user?.id) return { error: t('unauthorized') }

  await updateOnboardingData(user.id, { currentStep: step })
  return { success: true }
}

/**
 * Mark onboarding as complete for the logged-in user
 */
export async function markOnboardingComplete(locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' })
  const user = await getLoggedInUser()
  if (!user?.id) return { error: t('unauthorized') }

  await completeOnboarding(user.id)
  revalidatePath('/') // Refresh to prevent showing onboarding again
  return { success: true }
}

/**
 * Skip the onboarding flow (marks as completed)
 */
export async function skipOnboardingFlow(locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' })
  const user = await getLoggedInUser()
  if (!user?.id) return { error: t('unauthorized') }

  await skipOnboarding(user.id)
  revalidatePath('/')
  return { success: true }
}

/**
 * Dismiss a tooltip for the logged-in user
 */
export async function dismissTooltip(tooltipId: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' })
  const user = await getLoggedInUser()
  if (!user?.id) return { error: t('unauthorized') }

  await dismissTooltipRepo(user.id, tooltipId)
  return { success: true }
}

/**
 * Update a checklist item's completion status
 */
export async function updateChecklistItem(itemId: string, completed: boolean, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' })
  const user = await getLoggedInUser()
  if (!user?.id) return { error: t('unauthorized') }

  await updateChecklistItemRepo(user.id, itemId, completed)
  revalidatePath('/profile') // Or wherever checklist is shown
  return { success: true }
}
