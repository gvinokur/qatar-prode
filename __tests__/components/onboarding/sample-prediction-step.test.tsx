import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SamplePredictionStep from '../../../app/components/onboarding/onboarding-steps/sample-prediction-step'

// Mock GameResultEditDialog
vi.mock('../../../app/components/game-result-edit-dialog', () => ({
  __esModule: true,
  default: ({ open, onClose, onGameGuessSave }: any) => (
    open ? (
      <div data-testid="game-result-dialog">
        <button
          data-testid="save-prediction"
          onClick={() => onGameGuessSave('mock-game-id', 3, 1)}
        >
          Save
        </button>
        <button data-testid="close-dialog" onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

// Mock CompactGameViewCard
vi.mock('../../../app/components/compact-game-view-card', () => ({
  __esModule: true,
  default: ({ onEditClick, homeScore, awayScore }: any) => (
    <div data-testid="compact-game-card">
      <span>Argentina {homeScore} - {awayScore} Brasil</span>
      <button data-testid="edit-game" onClick={onEditClick}>Edit</button>
    </div>
  )
}))

// Mock TeamSelector
vi.mock('../../../app/components/awards/team-selector', () => ({
  __esModule: true,
  default: ({ label, onChange, selectedTeamId }: any) => (
    <div data-testid={`team-selector-${label}`}>
      <label>{label}</label>
      <select
        value={selectedTeamId}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`select-${label}`}
      >
        <option value="">Select</option>
        <option value="1">Argentina</option>
        <option value="2">Brasil</option>
      </select>
    </div>
  )
}))

// Mock MobileFriendlyAutocomplete
vi.mock('../../../app/components/awards/mobile-friendly-autocomplete', () => ({
  __esModule: true,
  default: ({ label, onChange, value, options }: any) => (
    <div data-testid="mobile-autocomplete">
      <label>{label}</label>
      <select
        value={value?.id || ''}
        onChange={(e) => {
          const selected = options.find((opt: any) => opt.id === e.target.value)
          onChange(null, selected || null)
        }}
        data-testid="select-player"
      >
        <option value="">Select player</option>
        {options.map((opt: any) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  )
}))

describe('SamplePredictionStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders step title', () => {
    render(<SamplePredictionStep />)
    expect(screen.getByText('Tipos de Predicciones')).toBeInTheDocument()
    expect(screen.getByText(/Hay tres tipos principales de predicciones/)).toBeInTheDocument()
  })

  it('renders three tabs', () => {
    render(<SamplePredictionStep />)
    expect(screen.getByRole('tab', { name: 'Partidos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Torneo' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Clasificación' })).toBeInTheDocument()
  })

  it('shows game prediction tab by default', () => {
    render(<SamplePredictionStep />)
    expect(screen.getByTestId('compact-game-card')).toBeInTheDocument()
    expect(screen.getByText(/Haz clic en el lápiz para editar tu predicción/)).toBeInTheDocument()
  })

  it('switches to tournament tab when clicked', () => {
    render(<SamplePredictionStep />)

    const tournamentTab = screen.getByRole('tab', { name: 'Torneo' })
    fireEvent.click(tournamentTab)

    expect(screen.getByTestId('team-selector-Campeón')).toBeInTheDocument()
    expect(screen.getByTestId('team-selector-Subcampeón')).toBeInTheDocument()
  })

  it('switches to qualifiers tab when clicked', () => {
    render(<SamplePredictionStep />)

    const qualifiersTab = screen.getByRole('tab', { name: 'Clasificación' })
    fireEvent.click(qualifiersTab)

    expect(screen.getByText('Tabla de Pronósticos - Grupo A')).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
    expect(screen.getByText('Uruguay')).toBeInTheDocument()
  })

  it('opens game edit dialog when edit button clicked', () => {
    render(<SamplePredictionStep />)

    const editButton = screen.getByTestId('edit-game')
    fireEvent.click(editButton)

    expect(screen.getByTestId('game-result-dialog')).toBeInTheDocument()
  })

  it('closes game edit dialog', () => {
    render(<SamplePredictionStep />)

    const editButton = screen.getByTestId('edit-game')
    fireEvent.click(editButton)

    expect(screen.getByTestId('game-result-dialog')).toBeInTheDocument()

    const closeButton = screen.getByTestId('close-dialog')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('game-result-dialog')).not.toBeInTheDocument()
  })

  it('updates game score when saved', async () => {
    render(<SamplePredictionStep />)

    // Initial scores
    expect(screen.getByText(/Argentina 2 - 1 Brasil/)).toBeInTheDocument()

    // Open dialog and save
    const editButton = screen.getByTestId('edit-game')
    fireEvent.click(editButton)

    const saveButton = screen.getByTestId('save-prediction')
    fireEvent.click(saveButton)

    // Scores should update
    await waitFor(() => {
      expect(screen.getByText(/Argentina 3 - 1 Brasil/)).toBeInTheDocument()
    })
  })

  it('shows success message after editing game', async () => {
    render(<SamplePredictionStep />)

    const editButton = screen.getByTestId('edit-game')
    fireEvent.click(editButton)

    const saveButton = screen.getByTestId('save-prediction')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/¡Perfecto! Así se editan las predicciones de partidos/)).toBeInTheDocument()
    })
  })

  it('allows selecting champion in tournament tab', () => {
    render(<SamplePredictionStep />)

    const tournamentTab = screen.getByRole('tab', { name: 'Torneo' })
    fireEvent.click(tournamentTab)

    const championSelect = screen.getByTestId('select-Campeón')
    fireEvent.change(championSelect, { target: { value: '1' } })

    expect(championSelect).toHaveValue('1')
  })

  it('allows selecting runner-up in tournament tab', () => {
    render(<SamplePredictionStep />)

    const tournamentTab = screen.getByRole('tab', { name: 'Torneo' })
    fireEvent.click(tournamentTab)

    const runnerUpSelect = screen.getByTestId('select-Subcampeón')
    fireEvent.change(runnerUpSelect, { target: { value: '2' } })

    expect(runnerUpSelect).toHaveValue('2')
  })

  it('allows selecting best player in tournament tab', () => {
    render(<SamplePredictionStep />)

    const tournamentTab = screen.getByRole('tab', { name: 'Torneo' })
    fireEvent.click(tournamentTab)

    const playerSelect = screen.getByTestId('select-player')
    fireEvent.change(playerSelect, { target: { value: '1' } })

    expect(playerSelect).toHaveValue('1')
  })

  it('shows success message after selecting tournament predictions', async () => {
    render(<SamplePredictionStep />)

    const tournamentTab = screen.getByRole('tab', { name: 'Torneo' })
    fireEvent.click(tournamentTab)

    const championSelect = screen.getByTestId('select-Campeón')
    fireEvent.change(championSelect, { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText(/¡Excelente! Así se predicen el podio y los premios del torneo/)).toBeInTheDocument()
    })
  })

  it('displays group table in qualifiers tab', () => {
    render(<SamplePredictionStep />)

    const qualifiersTab = screen.getByRole('tab', { name: 'Clasificación' })
    fireEvent.click(qualifiersTab)

    // Check table headers
    expect(screen.getByText('Pos')).toBeInTheDocument()
    expect(screen.getByText('Equipo')).toBeInTheDocument()
    expect(screen.getByText('Pts')).toBeInTheDocument()
    expect(screen.getByText('DG')).toBeInTheDocument()
  })

  it('shows deadline information for each prediction type', () => {
    render(<SamplePredictionStep />)

    // Game predictions deadline
    expect(screen.getByText(/Las predicciones de partidos cierran 1 hora antes/)).toBeInTheDocument()

    // Tournament deadline
    const tournamentTab = screen.getByRole('tab', { name: 'Torneo' })
    fireEvent.click(tournamentTab)
    expect(screen.getByText(/Las predicciones de torneo cierran 5 días después/)).toBeInTheDocument()

    // Qualifiers deadline
    const qualifiersTab = screen.getByRole('tab', { name: 'Clasificación' })
    fireEvent.click(qualifiersTab)
    expect(screen.getByText(/Las clasificaciones también cierran 5 días después/)).toBeInTheDocument()
  })
})
