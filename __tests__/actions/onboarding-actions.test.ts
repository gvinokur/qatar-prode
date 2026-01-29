import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  getOnboardingData,
  saveOnboardingStep,
  markOnboardingComplete,
  skipOnboardingFlow,
  dismissTooltip,
  updateChecklistItem
} from '../../app/actions/onboarding-actions'
import * as onboardingRepository from '../../app/db/onboarding-repository'
import * as userActions from '../../app/actions/user-actions'

// Mock dependencies
vi.mock('../../app/db/onboarding-repository', () => ({
  getOnboardingStatus: vi.fn(),
  updateOnboardingData: vi.fn(),
  completeOnboarding: vi.fn(),
  skipOnboarding: vi.fn(),
  dismissTooltip: vi.fn(),
  updateChecklistItem: vi.fn()
}))

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('onboarding-actions', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(mockUser as any)
  })

  describe('getOnboardingData', () => {
    it('returns onboarding status for logged in user', async () => {
      const mockStatus = {
        onboarding_completed: false,
        onboarding_data: { currentStep: 2 }
      }
      vi.mocked(onboardingRepository.getOnboardingStatus).mockResolvedValue(mockStatus as any)

      const result = await getOnboardingData()

      expect(onboardingRepository.getOnboardingStatus).toHaveBeenCalledWith('user-123')
      expect(result).toEqual(mockStatus)
    })

    it('returns null when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)

      const result = await getOnboardingData()

      expect(result).toBeNull()
      expect(onboardingRepository.getOnboardingStatus).not.toHaveBeenCalled()
    })
  })

  describe('saveOnboardingStep', () => {
    it('saves onboarding step for logged in user', async () => {
      vi.mocked(onboardingRepository.updateOnboardingData).mockResolvedValue(undefined)

      await saveOnboardingStep(3)

      expect(onboardingRepository.updateOnboardingData).toHaveBeenCalledWith(
        'user-123',
        { currentStep: 3 }
      )
    })

    it('does nothing when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)

      await saveOnboardingStep(3)

      expect(onboardingRepository.updateOnboardingData).not.toHaveBeenCalled()
    })
  })

  describe('markOnboardingComplete', () => {
    it('marks onboarding as complete for logged in user', async () => {
      vi.mocked(onboardingRepository.completeOnboarding).mockResolvedValue(undefined)

      await markOnboardingComplete()

      expect(onboardingRepository.completeOnboarding).toHaveBeenCalledWith('user-123')
    })

    it('does nothing when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)

      await markOnboardingComplete()

      expect(onboardingRepository.completeOnboarding).not.toHaveBeenCalled()
    })
  })

  describe('skipOnboardingFlow', () => {
    it('skips onboarding for logged in user', async () => {
      vi.mocked(onboardingRepository.skipOnboarding).mockResolvedValue(undefined)

      await skipOnboardingFlow()

      expect(onboardingRepository.skipOnboarding).toHaveBeenCalledWith('user-123')
    })

    it('does nothing when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)

      await skipOnboardingFlow()

      expect(onboardingRepository.skipOnboarding).not.toHaveBeenCalled()
    })
  })

  describe('dismissTooltip', () => {
    it('dismisses tooltip for logged in user', async () => {
      vi.mocked(onboardingRepository.dismissTooltip).mockResolvedValue(undefined)

      await dismissTooltip('tooltip-123')

      expect(onboardingRepository.dismissTooltip).toHaveBeenCalledWith('user-123', 'tooltip-123')
    })

    it('does nothing when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)

      await dismissTooltip('tooltip-123')

      expect(onboardingRepository.dismissTooltip).not.toHaveBeenCalled()
    })
  })

  describe('updateChecklistItem', () => {
    it('updates checklist item for logged in user', async () => {
      vi.mocked(onboardingRepository.updateChecklistItem).mockResolvedValue(undefined)

      await updateChecklistItem('item-123', true)

      expect(onboardingRepository.updateChecklistItem).toHaveBeenCalledWith(
        'user-123',
        'item-123',
        true
      )
    })

    it('does nothing when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)

      await updateChecklistItem('item-123', true)

      expect(onboardingRepository.updateChecklistItem).not.toHaveBeenCalled()
    })

    it('marks item as incomplete when completed is false', async () => {
      vi.mocked(onboardingRepository.updateChecklistItem).mockResolvedValue(undefined)

      await updateChecklistItem('item-123', false)

      expect(onboardingRepository.updateChecklistItem).toHaveBeenCalledWith(
        'user-123',
        'item-123',
        false
      )
    })
  })

  describe('error handling', () => {
    it('handles errors in saveOnboardingStep gracefully', async () => {
      vi.mocked(onboardingRepository.updateOnboardingData).mockRejectedValue(new Error('DB error'))

      await expect(saveOnboardingStep(3)).rejects.toThrow('DB error')
    })

    it('handles errors in markOnboardingComplete gracefully', async () => {
      vi.mocked(onboardingRepository.completeOnboarding).mockRejectedValue(new Error('DB error'))

      await expect(markOnboardingComplete()).rejects.toThrow('DB error')
    })

    it('handles errors in skipOnboardingFlow gracefully', async () => {
      vi.mocked(onboardingRepository.skipOnboarding).mockRejectedValue(new Error('DB error'))

      await expect(skipOnboardingFlow()).rejects.toThrow('DB error')
    })

    it('handles errors in dismissTooltip gracefully', async () => {
      vi.mocked(onboardingRepository.dismissTooltip).mockRejectedValue(new Error('DB error'))

      await expect(dismissTooltip('tooltip-123')).rejects.toThrow('DB error')
    })

    it('handles errors in updateChecklistItem gracefully', async () => {
      vi.mocked(onboardingRepository.updateChecklistItem).mockRejectedValue(new Error('DB error'))

      await expect(updateChecklistItem('item-123', true)).rejects.toThrow('DB error')
    })
  })
})
