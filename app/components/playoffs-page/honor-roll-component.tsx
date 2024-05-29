'use client'

import {useContext} from "react";
import {Avatar, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {Team} from "../../db/tables-definition";
import {GuessesContext} from "../context-providers/guesses-context-provider";

type Props = {
  teamsMap: {[k:string]: Team}
}
export default function HonorRoll({ teamsMap } : Props) {
  const {tournamentGuesses} = useContext(GuessesContext)

  return (
    <List>
      <ListItem>
        <ListItemAvatar>
          <Avatar alt='Campeon' src='/gold-medal.png'/>
        </ListItemAvatar>
        <ListItemText>
          {tournamentGuesses?.champion_team_id ? teamsMap[tournamentGuesses.champion_team_id].name : '-----------'}
        </ListItemText>
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar alt='Subampeon' src='/silver-medal.png'/>
        </ListItemAvatar>
        <ListItemText>
          {tournamentGuesses?.runner_up_team_id ? teamsMap[tournamentGuesses.runner_up_team_id].name : '-----------'}
        </ListItemText>
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar alt='Tercero' src='/bronze-medal.png'/>
        </ListItemAvatar>
        <ListItemText>
          {tournamentGuesses?.third_place_team_id ? teamsMap[tournamentGuesses.third_place_team_id].name : '-----------'}
        </ListItemText>
      </ListItem>
    </List>
  )
}
