// mark as client component
'use server'

import Home from './components/home/home-component'
import {getTournaments} from "./actions/tournament-actions";
import {getGroupsForUser} from "./actions/prode-group-actions";

export default async function ServerHome() {

  const tournaments = await getTournaments();
  const prodeGroups = await getGroupsForUser()

  return (<Home tournaments={tournaments} groups={prodeGroups}></Home>)
}
