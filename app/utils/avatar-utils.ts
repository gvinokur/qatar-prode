const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
]

export function getAvatarColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}
