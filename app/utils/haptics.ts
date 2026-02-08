/**
 * Haptic feedback utilities for mobile devices
 * Uses the Web Vibration API for tactile feedback
 */

/**
 * Trigger haptic feedback for rank improvement celebration
 * Pattern: short-long-short vibration (50ms-100ms-50ms)
 * Only works on mobile devices with vibration support
 */
export function triggerRankUpHaptic(): void {
  if (globalThis.window !== undefined && 'vibrate' in navigator) {
    try {
      // Pattern: vibrate for 50ms, pause 100ms, vibrate for 50ms
      navigator.vibrate([50, 100, 50]);
    } catch (error) {
      // Intentionally ignoring errors - vibration is a progressive enhancement
      // that should fail gracefully without disrupting user experience
      if (process.env.NODE_ENV === 'development') {
        console.warn('Vibration API failed:', error);
      }
    }
  }
}

/**
 * Trigger subtle haptic feedback for rank change (non-improvement)
 * Pattern: single short vibration (30ms)
 */
export function triggerRankChangeHaptic(): void {
  if (globalThis.window !== undefined && 'vibrate' in navigator) {
    try {
      navigator.vibrate(30);
    } catch (error) {
      // Intentionally ignoring errors - vibration is a progressive enhancement
      // that should fail gracefully without disrupting user experience
      if (process.env.NODE_ENV === 'development') {
        console.warn('Vibration API failed:', error);
      }
    }
  }
}

/**
 * Check if haptic feedback is supported on the current device
 * @returns true if the Vibration API is available
 */
export function isHapticSupported(): boolean {
  return globalThis.window !== undefined && 'vibrate' in navigator;
}
