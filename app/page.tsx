// mark as client component
'use server'

import Home from './components/home/home-component'
import {getTournaments} from "./actions/tournament-actions";

export default async function ServerHome() {

  const tournaments = await getTournaments();

  return (<Home tournaments={tournaments}></Home>)
}
