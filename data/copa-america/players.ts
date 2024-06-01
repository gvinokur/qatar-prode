
type PlayerDefTuple = [
  team: string,
  position: string,
  name: string,
  otherTeam: string,
  age: number
]

const playerList: PlayerDefTuple[] = [

]

export const players = playerList.map(player => ({
  team: player[0],
  position: player[1],
  name: player[2],
  age: player[4]
}))
