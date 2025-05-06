export const getDateString = (dateUtc: string, xsMatch: boolean ) => {
  return new Date(Date.parse(dateUtc)).toLocaleString(undefined, {
    weekday: xsMatch ? 'long' : 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
