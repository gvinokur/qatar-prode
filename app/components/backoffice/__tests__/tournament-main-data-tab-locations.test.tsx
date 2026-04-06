import { act, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TournamentMainDataTab from '../tournament-main-data-tab'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'

vi.mock('../../../actions/tournament-actions', () => ({
  getTournamentById: vi.fn(),
  createOrUpdateTournament: vi.fn(),
  getPlayoffRounds: vi.fn(),
  getTournamentLocations: vi.fn(),
}))

vi.mock('../../../actions/backoffice-actions', () => ({
  getTournamentPermissionData: vi.fn(),
  updateTournamentPermissions: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
}))

vi.mock('../../friend-groups/image-picker', () => ({
  default: vi.fn(() => null),
}))

vi.mock('../internal/playoff-round-dialog', () => ({
  default: vi.fn(() => null),
}))

vi.mock('../tournament-permissions-selector', () => ({
  default: vi.fn(() => null),
}))

vi.mock('../i18n-field-editor', () => ({
  default: vi.fn(() => null),
}))

vi.mock('mui-color-input', () => ({
  MuiColorInput: vi.fn(({ value }: { value: string }) => (
    <input data-testid="color-input" value={value} readOnly />
  )),
}))

vi.mock('../../../utils/theme-utils', () => ({
  getThemeLogoUrl: vi.fn(() => null),
}))

import {
  getTournamentById,
  createOrUpdateTournament,
  getPlayoffRounds,
} from '../../../actions/tournament-actions'

function setupMocks(locations: string[] = []) {
  const tournament = testFactories.tournament({ locations }) as any
  vi.mocked(getTournamentById).mockResolvedValue(tournament)
  vi.mocked(getPlayoffRounds).mockResolvedValue([])
  vi.mocked(createOrUpdateTournament).mockResolvedValue(tournament)
}

async function renderAndWait(locations: string[] = []) {
  setupMocks(locations)
  renderWithTheme(<TournamentMainDataTab tournamentId="tournament-1" />)
  await act(async () => {})
}

describe('TournamentMainDataTab — location management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "No locations" alert when tournament has no locations', async () => {
    await renderAndWait([])

    await waitFor(() => {
      expect(screen.getByText(/No locations defined for this tournament/i)).toBeInTheDocument()
    })
  })

  it('renders a TextField for each location when tournament has locations', async () => {
    await renderAndWait(['Qatar', 'Lusail'])

    await waitFor(() => {
      expect(screen.getByDisplayValue('Qatar')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Lusail')).toBeInTheDocument()
    })
  })

  it('adds an empty TextField when "Add Location" is clicked', async () => {
    await renderAndWait([])

    await waitFor(() => {
      expect(screen.getByText(/No locations defined for this tournament/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }))

    await waitFor(() => {
      expect(screen.queryByText(/No locations defined for this tournament/i)).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\. Qatar/i)).toBeInTheDocument()
    })
  })

  it('removes the correct entry when its delete button is clicked', async () => {
    await renderAndWait(['Qatar', 'Lusail'])

    await waitFor(() => {
      expect(screen.getByDisplayValue('Qatar')).toBeInTheDocument()
    })

    // Find the ListItem containing "Qatar" and click its delete button
    const qatarInput = screen.getByDisplayValue('Qatar')
    const listItem = qatarInput.closest('li')!
    const deleteButton = within(listItem).getByRole('button')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Qatar')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Lusail')).toBeInTheDocument()
    })
  })

  it('serializes locations as JSON in FormData on submit, filtering empty strings', async () => {
    await renderAndWait(['Qatar', 'Lusail'])

    await waitFor(() => {
      expect(screen.getByDisplayValue('Qatar')).toBeInTheDocument()
    })

    // Add an empty location (should be filtered out on submit)
    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }))

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(createOrUpdateTournament).toHaveBeenCalled()
    })

    const [, submittedFormData] = vi.mocked(createOrUpdateTournament).mock.calls[0] as [string, FormData]
    const locationsJson = submittedFormData.get('locations') as string
    expect(JSON.parse(locationsJson)).toEqual(['Qatar', 'Lusail'])
  })
})
