import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JoinRequestManager from '../join-request-manager'

// Mock the join request actions
vi.mock('@/app/actions/prode-group-join-request-actions', () => ({
  approveJoinRequestAction: vi.fn(),
  rejectJoinRequestAction: vi.fn(),
}))

// Mock the GA4 tracking utility
vi.mock('@/app/utils/ga4', () => ({
  trackEvent: vi.fn(),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}))

import { approveJoinRequestAction, rejectJoinRequestAction } from '@/app/actions/prode-group-join-request-actions'
import { trackEvent } from '@/app/utils/ga4'

describe('JoinRequestManager - Analytics Tracking', () => {
  const mockApproveAction = vi.mocked(approveJoinRequestAction)
  const mockRejectAction = vi.mocked(rejectJoinRequestAction)
  const mockTrackEvent = vi.mocked(trackEvent)

  const mockJoinRequest = {
    id: 'req-1',
    user_id: 'user-123',
    user_nickname: 'Test User',
    user_email: 'test@example.com',
    requested_at: new Date('2026-03-31T10:00:00Z'),
    request_source: 'direct',
    status: 'pending',
    message: null,
  }

  const defaultProps = {
    groupId: 'group-1',
    tournamentId: 'tour-1',
    locale: 'en' as const,
    initialRequests: [mockJoinRequest],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls trackEvent with correct arguments when approveJoinRequestAction returns success with analyticsEvent', async () => {
    const user = userEvent.setup()

    mockApproveAction.mockResolvedValue({
      success: true,
      message: 'ok',
      analyticsEvent: {
        name: 'group_joined',
        params: {
          group_id: 'group-1',
          tournament_id: 'tour-1',
        },
      },
    })

    render(<JoinRequestManager {...defaultProps} />)

    // Find and click the approve button
    const approveButtons = screen.getAllByText('approve')
    await user.click(approveButtons[0])

    // Wait for the trackEvent to be called
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith('group_joined', {
        group_id: 'group-1',
        tournament_id: 'tour-1',
      })
    })

    // Verify trackEvent was called exactly once
    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
  })

  it('does not call trackEvent when approveJoinRequestAction throws an error', async () => {
    const user = userEvent.setup()

    mockApproveAction.mockRejectedValue(new Error('Approval failed'))

    render(<JoinRequestManager {...defaultProps} />)

    // Find and click the approve button
    const approveButtons = screen.getAllByText('approve')
    await user.click(approveButtons[0])

    // Wait for error handling — component uses err.message, so shows the Error's message
    await waitFor(() => {
      expect(screen.getByText('Approval failed')).toBeInTheDocument()
    })

    // Verify trackEvent was NOT called
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('does not call trackEvent when approveJoinRequestAction returns success without analyticsEvent', async () => {
    const user = userEvent.setup()

    mockApproveAction.mockResolvedValue({
      success: true,
      message: 'ok',
      analyticsEvent: null,
    })

    render(<JoinRequestManager {...defaultProps} />)

    // Find and click the approve button
    const approveButtons = screen.getAllByText('approve')
    await user.click(approveButtons[0])

    // Wait for the action to complete (item is removed via optimistic update)
    await waitFor(() => {
      expect(mockApproveAction).toHaveBeenCalled()
    })

    // Verify trackEvent was NOT called (null analyticsEvent)
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('does not call trackEvent when approveJoinRequestAction returns failure', async () => {
    const user = userEvent.setup()

    mockApproveAction.mockResolvedValue({
      success: false,
      message: 'User already in group',
      analyticsEvent: null,
    })

    render(<JoinRequestManager {...defaultProps} />)

    // Find and click the approve button
    const approveButtons = screen.getAllByText('approve')
    await user.click(approveButtons[0])

    // Wait for the request to complete
    await waitFor(() => {
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })

  it('does not call trackEvent for reject action', async () => {
    const user = userEvent.setup()

    mockRejectAction.mockResolvedValue({
      success: true,
      message: 'ok',
    })

    render(<JoinRequestManager {...defaultProps} />)

    // Find and click the reject button
    const rejectButtons = screen.getAllByText('reject')
    await user.click(rejectButtons[0])

    // Wait for the action to complete (item is removed via optimistic update)
    await waitFor(() => {
      expect(mockRejectAction).toHaveBeenCalled()
    })

    // Verify trackEvent was NOT called for reject action
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('handles multiple approve actions and tracks each one independently', async () => {
    const user = userEvent.setup()

    const requests = [
      { ...mockJoinRequest, id: 'req-1' },
      { ...mockJoinRequest, id: 'req-2', user_nickname: 'User Two' },
    ]

    mockApproveAction.mockImplementation(async (requestId) => ({
      success: true,
      message: 'ok',
      analyticsEvent: {
        name: 'group_joined',
        params: {
          group_id: 'group-1',
          tournament_id: 'tour-1',
          request_id: requestId,
        },
      },
    }))

    render(<JoinRequestManager {...defaultProps} initialRequests={requests} />)

    // Click first approve button
    const approveButtons = screen.getAllByText('approve')
    await user.click(approveButtons[0])

    // Wait for first tracking call
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith('group_joined', {
        group_id: 'group-1',
        tournament_id: 'tour-1',
        request_id: 'req-1',
      })
    })

    // Clear and click second approve button
    mockTrackEvent.mockClear()
    const updatedApproveButtons = screen.getAllByText('approve')
    if (updatedApproveButtons.length > 0) {
      await user.click(updatedApproveButtons[0])

      // Wait for second tracking call
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('group_joined', {
          group_id: 'group-1',
          tournament_id: 'tour-1',
          request_id: 'req-2',
        })
      })
    }
  })

  it('tracks analytics event with correct event name from server response', async () => {
    const user = userEvent.setup()

    mockApproveAction.mockResolvedValue({
      success: true,
      message: 'ok',
      analyticsEvent: {
        name: 'custom_group_join_event',
        params: {
          group_id: 'group-1',
          tournament_id: 'tour-1',
          source: 'api',
        },
      },
    })

    render(<JoinRequestManager {...defaultProps} />)

    const approveButtons = screen.getAllByText('approve')
    await user.click(approveButtons[0])

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith('custom_group_join_event', {
        group_id: 'group-1',
        tournament_id: 'tour-1',
        source: 'api',
      })
    })

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
  })
})
