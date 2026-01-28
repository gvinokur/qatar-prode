import { db } from './database'
import { OnboardingData } from './tables-definition'
import { cache } from 'react'

/**
 * Get onboarding status for a user
 * Returns onboarding_completed, onboarding_completed_at, and onboarding_data fields
 */
export const getOnboardingStatus = cache(async function(userId: string) {
  return db.selectFrom('users')
    .where('id', '=', userId)
    .select(['onboarding_completed', 'onboarding_completed_at', 'onboarding_data'])
    .executeTakeFirst()
})

/**
 * Update onboarding data for a user
 * Merges new data with existing data
 */
export async function updateOnboardingData(userId: string, data: Partial<OnboardingData>) {
  const existing = await getOnboardingStatus(userId)
  const currentData = existing?.onboarding_data || {}

  return db.updateTable('users')
    .set({
      onboarding_data: JSON.stringify({
        ...currentData,
        ...data
      })
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Mark onboarding as completed for a user
 */
export async function completeOnboarding(userId: string) {
  return db.updateTable('users')
    .set({
      onboarding_completed: true,
      onboarding_completed_at: new Date()
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Skip onboarding (same effect as completing - marks as done)
 */
export async function skipOnboarding(userId: string) {
  return completeOnboarding(userId)
}

/**
 * Dismiss a tooltip for a user
 * Adds tooltip ID to dismissedTooltips array
 */
export async function dismissTooltip(userId: string, tooltipId: string) {
  const existing = await getOnboardingStatus(userId)
  const dismissedTooltips = existing?.onboarding_data?.dismissedTooltips || []

  // Don't add duplicate
  if (dismissedTooltips.includes(tooltipId)) {
    return existing
  }

  return updateOnboardingData(userId, {
    dismissedTooltips: [...dismissedTooltips, tooltipId]
  })
}

/**
 * Update a checklist item's completion status
 */
export async function updateChecklistItem(userId: string, itemId: string, completed: boolean) {
  const existing = await getOnboardingStatus(userId)
  const checklist = existing?.onboarding_data?.checklist || { items: [] }

  const updatedItems = checklist.items.map(item =>
    item.id === itemId
      ? { ...item, completed, completedAt: completed ? new Date() : undefined }
      : item
  )

  return updateOnboardingData(userId, {
    checklist: { items: updatedItems }
  })
}
