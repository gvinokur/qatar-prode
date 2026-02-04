/**
 * Returns accessibility props for skeleton loading states
 * @param label - The aria-label describing what is loading
 */
export function getSkeletonA11yProps(label: string) {
  return {
    role: 'status' as const,
    'aria-busy': 'true' as const,
    'aria-label': label,
  };
}
