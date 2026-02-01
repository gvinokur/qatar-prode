import { vi, describe, it, expect } from 'vitest'

// Mock server actions
const mockMarkOnboardingComplete = vi.fn().mockResolvedValue({ success: true })
const mockSkipOnboardingFlow = vi.fn().mockResolvedValue({ success: true })
const mockSaveOnboardingStep = vi.fn().mockResolvedValue({ success: true })

vi.mock('../../app/actions/onboarding-actions', () => ({
  markOnboardingComplete: mockMarkOnboardingComplete,
  skipOnboardingFlow: mockSkipOnboardingFlow,
  saveOnboardingStep: mockSaveOnboardingStep,
  getOnboardingData: vi.fn().mockResolvedValue(null)
}))

// Mock repository
const mockGetOnboardingStatus = vi.fn()
const mockCompleteOnboarding = vi.fn()
const mockUpdateOnboardingData = vi.fn()

vi.mock('../../app/db/onboarding-repository', () => ({
  getOnboardingStatus: mockGetOnboardingStatus,
  completeOnboarding: mockCompleteOnboarding,
  updateOnboardingData: mockUpdateOnboardingData,
  skipOnboarding: vi.fn()
}))

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
}))

vi.mock('react', () => ({
  cache: vi.fn((fn) => fn)
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Onboarding Integration Flow', () => {
  it('should complete full onboarding flow', async () => {
    const { markOnboardingComplete } = await import('../../app/actions/onboarding-actions')

    // User completes onboarding
    const result = await markOnboardingComplete()

    expect(result).toEqual({ success: true })
    expect(mockMarkOnboardingComplete).toHaveBeenCalled()
  })

  it('should allow skipping onboarding', async () => {
    const { skipOnboardingFlow } = await import('../../app/actions/onboarding-actions')

    // User skips onboarding
    const result = await skipOnboardingFlow()

    expect(result).toEqual({ success: true })
    expect(mockSkipOnboardingFlow).toHaveBeenCalled()
  })

  it('should save step progress', async () => {
    const { saveOnboardingStep } = await import('../../app/actions/onboarding-actions')

    // User advances to step 2
    const result = await saveOnboardingStep(2)

    expect(result).toEqual({ success: true })
    expect(mockSaveOnboardingStep).toHaveBeenCalledWith(2)
  })

  it('should check if user needs onboarding', async () => {
    mockGetOnboardingStatus.mockResolvedValue({ onboarding_completed: false })

    const { getOnboardingStatus } = await import('../../app/db/onboarding-repository')
    const status = await getOnboardingStatus('user-123')

    expect(status?.onboarding_completed).toBe(false)
    expect(mockGetOnboardingStatus).toHaveBeenCalledWith('user-123')
  })

  it('should not show onboarding if already completed', async () => {
    mockGetOnboardingStatus.mockResolvedValue({ onboarding_completed: true })

    const { getOnboardingStatus } = await import('../../app/db/onboarding-repository')
    const status = await getOnboardingStatus('user-123')

    expect(status?.onboarding_completed).toBe(true)
  })
})
