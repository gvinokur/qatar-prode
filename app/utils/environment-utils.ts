export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}
