'use client'


import {CompleteTournamentData} from "../definitions";
import {JSONTree} from "react-json-tree";

export function DebugObject({ object }: {object: any}) {
  return (
    <JSONTree data={(object)}/>
  )
}
