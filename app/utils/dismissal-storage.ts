/**
 * localStorage helpers for managing dismissible UI overlays
 * Used to persist user dismissal preferences across sessions
 */

/**
 * Get dismissal state for a given key
 * @param key - The dismissal key (e.g., `dismissedLocked_${tournamentId}_qualifiedTeams`)
 * @returns true if dismissed, false if not dismissed or key doesn't exist
 */
export function getDismissalState(key: string): boolean {
  if (globalThis.window === undefined) {
    return false
  }

  try {
    const value = localStorage.getItem(key)
    return value === 'true'
  } catch (error) {
    console.error('Error reading dismissal state:', error)
    return false
  }
}

/**
 * Set dismissal state for a given key
 * @param key - The dismissal key (e.g., `dismissedLocked_${tournamentId}_qualifiedTeams`)
 * @param dismissed - true to mark as dismissed, false to clear dismissal
 */
export function setDismissalState(key: string, dismissed: boolean): void {
  if (globalThis.window === undefined) {
    return
  }

  try {
    if (dismissed) {
      localStorage.setItem(key, 'true')
    } else {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('Error setting dismissal state:', error)
  }
}

/**
 * Get the last selected tournament ID from localStorage
 * @returns The tournament ID as a string, or null if not found or error
 */
export function getLastSelectedTournamentId(): string | null {
  if (globalThis.window === undefined) {
    return null
  }

  try {
    const value = localStorage.getItem('lastSelectedTournamentId')
    return value
  } catch (error) {
    console.error('Error reading last selected tournament ID:', error)
    return null
  }
}

/**
 * Set the last selected tournament ID in localStorage
 * @param tournamentId - The tournament ID to store
 */
export function setLastSelectedTournamentId(tournamentId: string): void {
  if (globalThis.window === undefined) {
    return
  }

  try {
    localStorage.setItem('lastSelectedTournamentId', tournamentId)
  } catch (error) {
    console.error('Error setting last selected tournament ID:', error)
  }
}
