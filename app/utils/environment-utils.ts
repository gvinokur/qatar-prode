export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isHubEnabled(): boolean {
  return process.env.NEXT_PUBLIC_HUB_ENABLED === 'true';
}
