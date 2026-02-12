import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  MockGuessesContextProvider,
  MockQualifiedTeamsContextProvider,
  useMockQualifiedTeamsContext,
} from '@/app/components/onboarding/demo/onboarding-demo-context'
import { GuessesContext } from '@/app/components/context-providers/guesses-context-provider'
import { DEMO_GAME_GUESSES, DEMO_QUALIFIED_PREDICTIONS } from '@/app/components/onboarding/demo/demo-data'
import type { GameGuessNew } from '@/app/db/tables-definition'

describe('MockGuessesContextProvider', () => {
  it('provides initial game guesses from demo data', () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = React.useContext(GuessesContext)
      return <div>Test</div>
    }

    render(
      <MockGuessesContextProvider>
        <TestComponent />
      </MockGuessesContextProvider>
    )

    expect(contextValue.gameGuesses).toEqual(DEMO_GAME_GUESSES)
  })

  it('provides updateGameGuess function', () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = React.useContext(GuessesContext)
      return <div>Test</div>
    }

    render(
      <MockGuessesContextProvider>
        <TestComponent />
      </MockGuessesContextProvider>
    )

    expect(contextValue.updateGameGuess).toBeDefined()
    expect(typeof contextValue.updateGameGuess).toBe('function')
  })

  it('updates game guess in local state', async () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = React.useContext(GuessesContext)
      return <div>Test</div>
    }

    render(
      <MockGuessesContextProvider>
        <TestComponent />
      </MockGuessesContextProvider>
    )

    const newGuess: GameGuessNew = {
      game_id: 'game-1',
      game_number: 1,
      user_id: 'demo-user',
      home_team: 'team-1',
      away_team: 'team-2',
      home_score: 3,
      away_score: 2,
      boost_type: null,
    }

    await contextValue.updateGameGuess('game-1', newGuess)

    expect(contextValue.gameGuesses['game-1'].home_score).toBe(3)
    expect(contextValue.gameGuesses['game-1'].away_score).toBe(2)
  })
})

describe('MockQualifiedTeamsContextProvider', () => {
  it('provides initial predictions from demo data', () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = useMockQualifiedTeamsContext()
      return <div>Test</div>
    }

    render(
      <MockQualifiedTeamsContextProvider>
        <TestComponent />
      </MockQualifiedTeamsContextProvider>
    )

    expect(contextValue.predictions).toEqual(DEMO_QUALIFIED_PREDICTIONS)
    expect(contextValue.saveState).toBe('idle')
    expect(contextValue.isSaving).toBe(false)
    expect(contextValue.lastSaved).toBeNull()
    expect(contextValue.error).toBeNull()
  })

  it('provides all required functions', () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = useMockQualifiedTeamsContext()
      return <div>Test</div>
    }

    render(
      <MockQualifiedTeamsContextProvider>
        <TestComponent />
      </MockQualifiedTeamsContextProvider>
    )

    expect(contextValue.updateGroupPositions).toBeDefined()
    expect(typeof contextValue.updateGroupPositions).toBe('function')
    expect(contextValue.clearError).toBeDefined()
    expect(typeof contextValue.clearError).toBe('function')
  })

  it('has correct save state properties', () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = useMockQualifiedTeamsContext()
      return <div>Test</div>
    }

    render(
      <MockQualifiedTeamsContextProvider>
        <TestComponent />
      </MockQualifiedTeamsContextProvider>
    )

    expect(contextValue).toHaveProperty('predictions')
    expect(contextValue).toHaveProperty('saveState')
    expect(contextValue).toHaveProperty('isSaving')
    expect(contextValue).toHaveProperty('lastSaved')
    expect(contextValue).toHaveProperty('error')
    expect(contextValue).toHaveProperty('updateGroupPositions')
    expect(contextValue).toHaveProperty('clearError')
  })
})

describe('useMockQualifiedTeamsContext', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function TestComponent() {
      useMockQualifiedTeamsContext()
      return <div>Test</div>
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useMockQualifiedTeamsContext must be used within MockQualifiedTeamsContextProvider')

    consoleError.mockRestore()
  })

  it('works correctly when used within provider', () => {
    let contextValue: any = null

    function TestComponent() {
      contextValue = useMockQualifiedTeamsContext()
      return <div data-testid="test">Test</div>
    }

    render(
      <MockQualifiedTeamsContextProvider>
        <TestComponent />
      </MockQualifiedTeamsContextProvider>
    )

    expect(screen.getByTestId('test')).toBeInTheDocument()
    expect(contextValue).toBeDefined()
    expect(contextValue.predictions).toBeDefined()
    expect(contextValue.updateGroupPositions).toBeDefined()
  })
})
