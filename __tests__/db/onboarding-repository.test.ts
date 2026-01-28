import { vi, describe, it, expect, beforeEach } from 'vitest'
import { OnboardingData } from '../../app/db/tables-definition'

// Mock the database connection
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn()
  }
}))

vi.mock('react', () => ({
  cache: vi.fn((fn) => fn)
}))

// Import after mocking
import * as onboardingRepository from '../../app/db/onboarding-repository'
import { db } from '../../app/db/database'

describe('OnboardingRepository', () => {
  let mockDb: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Get mocked instances
    mockDb = vi.mocked(db)

    // Setup default mock chain for selectFrom
    mockDb.selectFrom.mockReturnValue({
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(null)
    })

    // Setup default mock chain for updateTable
    mockDb.updateTable.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(null)
    })
  })

  describe('getOnboardingStatus', () => {
    it('should retrieve onboarding status for a user', async () => {
      const mockStatus = {
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_data: { currentStep: 1 }
      }

      const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockStatus)
      const mockSelect = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst })
      const mockWhere = vi.fn().mockReturnValue({ select: mockSelect })

      mockDb.selectFrom.mockReturnValue({ where: mockWhere })

      const result = await onboardingRepository.getOnboardingStatus('user-123')

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users')
      expect(mockWhere).toHaveBeenCalledWith('id', '=', 'user-123')
      expect(result).toEqual(mockStatus)
    })
  })

  describe('updateOnboardingData', () => {
    it('should merge new data with existing data', async () => {
      const existingData: OnboardingData = {
        currentStep: 1,
        skippedSteps: []
      }

      const newData: Partial<OnboardingData> = {
        currentStep: 2
      }

      // Mock getOnboardingStatus call
      const mockGetExecuteTakeFirst = vi.fn().mockResolvedValue({ onboarding_data: existingData })
      const mockGetSelect = vi.fn().mockReturnValue({ executeTakeFirst: mockGetExecuteTakeFirst })
      const mockGetWhere = vi.fn().mockReturnValue({ select: mockGetSelect })

      // Mock updateOnboardingData call
      const mockUpdateExecuteTakeFirst = vi.fn().mockResolvedValue({ onboarding_data: { ...existingData, ...newData } })
      const mockReturningAll = vi.fn().mockReturnValue({ executeTakeFirst: mockUpdateExecuteTakeFirst })
      const mockUpdateWhere = vi.fn().mockReturnValue({ returningAll: mockReturningAll })
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })

      mockDb.selectFrom.mockReturnValue({ where: mockGetWhere })
      mockDb.updateTable.mockReturnValue({ set: mockSet })

      const result = await onboardingRepository.updateOnboardingData('user-123', newData)

      expect(mockDb.updateTable).toHaveBeenCalledWith('users')
      expect(mockSet).toHaveBeenCalledWith({
        onboarding_data: JSON.stringify({
          currentStep: 2,
          skippedSteps: []
        })
      })
      expect(result.onboarding_data).toEqual({ currentStep: 2, skippedSteps: [] })
    })
  })

  describe('completeOnboarding', () => {
    it('should mark onboarding as completed', async () => {
      const mockResult = {
        onboarding_completed: true,
        onboarding_completed_at: new Date()
      }

      const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockResult)
      const mockReturningAll = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst })
      const mockWhere = vi.fn().mockReturnValue({ returningAll: mockReturningAll })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })

      mockDb.updateTable.mockReturnValue({ set: mockSet })

      const result = await onboardingRepository.completeOnboarding('user-123')

      expect(mockDb.updateTable).toHaveBeenCalledWith('users')
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_completed: true,
          onboarding_completed_at: expect.any(Date)
        })
      )
      expect(result.onboarding_completed).toBe(true)
    })
  })

  describe('dismissTooltip', () => {
    it('should add tooltip ID to dismissedTooltips array', async () => {
      const existingData: OnboardingData = {
        dismissedTooltips: ['tooltip-1']
      }

      // Mock getOnboardingStatus call
      const mockGetExecuteTakeFirst = vi.fn().mockResolvedValue({ onboarding_data: existingData })
      const mockGetSelect = vi.fn().mockReturnValue({ executeTakeFirst: mockGetExecuteTakeFirst })
      const mockGetWhere = vi.fn().mockReturnValue({ select: mockGetSelect })

      // Mock updateOnboardingData call
      const mockUpdateExecuteTakeFirst = vi.fn().mockResolvedValue({
        onboarding_data: { dismissedTooltips: ['tooltip-1', 'tooltip-2'] }
      })
      const mockReturningAll = vi.fn().mockReturnValue({ executeTakeFirst: mockUpdateExecuteTakeFirst })
      const mockUpdateWhere = vi.fn().mockReturnValue({ returningAll: mockReturningAll })
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })

      mockDb.selectFrom.mockReturnValue({ where: mockGetWhere })
      mockDb.updateTable.mockReturnValue({ set: mockSet })

      await onboardingRepository.dismissTooltip('user-123', 'tooltip-2')

      expect(mockSet).toHaveBeenCalledWith({
        onboarding_data: JSON.stringify({
          dismissedTooltips: ['tooltip-1', 'tooltip-2']
        })
      })
    })

    it('should not add duplicate tooltip IDs', async () => {
      const existingData: OnboardingData = {
        dismissedTooltips: ['tooltip-1']
      }

      const mockExecuteTakeFirst = vi.fn().mockResolvedValue({ onboarding_data: existingData })
      const mockSelect = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst })
      const mockWhere = vi.fn().mockReturnValue({ select: mockSelect })

      mockDb.selectFrom.mockReturnValue({ where: mockWhere })

      const result = await onboardingRepository.dismissTooltip('user-123', 'tooltip-1')

      // Should return existing data without calling update
      expect(mockDb.updateTable).not.toHaveBeenCalled()
      expect(result.onboarding_data.dismissedTooltips).toEqual(['tooltip-1'])
    })
  })

  describe('updateChecklistItem', () => {
    it('should update checklist item completion status', async () => {
      const existingData: OnboardingData = {
        checklist: {
          items: [
            { id: 'item-1', label: 'Task 1', completed: false, order: 1 },
            { id: 'item-2', label: 'Task 2', completed: false, order: 2 }
          ]
        }
      }

      // Mock getOnboardingStatus call
      const mockGetExecuteTakeFirst = vi.fn().mockResolvedValue({ onboarding_data: existingData })
      const mockGetSelect = vi.fn().mockReturnValue({ executeTakeFirst: mockGetExecuteTakeFirst })
      const mockGetWhere = vi.fn().mockReturnValue({ select: mockGetSelect })

      // Mock updateOnboardingData call
      const mockUpdateExecuteTakeFirst = vi.fn().mockResolvedValue({
        onboarding_data: {
          checklist: {
            items: [
              { id: 'item-1', label: 'Task 1', completed: true, completedAt: expect.any(Date), order: 1 },
              { id: 'item-2', label: 'Task 2', completed: false, order: 2 }
            ]
          }
        }
      })
      const mockReturningAll = vi.fn().mockReturnValue({ executeTakeFirst: mockUpdateExecuteTakeFirst })
      const mockUpdateWhere = vi.fn().mockReturnValue({ returningAll: mockReturningAll })
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })

      mockDb.selectFrom.mockReturnValue({ where: mockGetWhere })
      mockDb.updateTable.mockReturnValue({ set: mockSet })

      await onboardingRepository.updateChecklistItem('user-123', 'item-1', true)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_data: expect.stringContaining('"completed":true')
        })
      )
    })
  })
})
