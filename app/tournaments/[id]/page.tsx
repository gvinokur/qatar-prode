'use server'

import {Box} from "../../components/mui-wrappers/";
import {UnifiedGamesPage} from "../../components/unified-games-page";

type Props = {
  readonly params: Promise<{
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function TournamentLandingPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  return (
    <Box sx={{ pt: 1 }}>
      <UnifiedGamesPage tournamentId={tournamentId} />
    </Box>
  )
}
