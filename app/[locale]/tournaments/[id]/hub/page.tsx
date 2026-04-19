'use server'

import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentHubRedirectPage(props: Props) {
  const { id } = await props.params
  const locale = await getLocale()
  redirect(`/${locale}/tournaments/${id}`)
}
