import {GroupFinishRule, TeamWinnerRule} from "../db/tables-definition";

export const isGroupFinishRule = (object: any): object is GroupFinishRule => {
  return ('position' in object && 'group' in object);
}

export const isTeamWinnerRule = (object: any): object is TeamWinnerRule => {
  return ('winner' in object && 'game' in object);
}

export const getTeamDescription = (rule?: GroupFinishRule | TeamWinnerRule, shortName?: boolean) => {
  if(isGroupFinishRule(rule)) {
    if (rule.position === 1) {
      return shortName ? `1 ${rule.group}` : `Primero Grupo ${rule.group}`
    } else if (rule.position === 2) {
      return shortName ? `2 ${rule.group}` : `Segundo Grupo ${rule.group}`
    } else if (rule.position === 3) {
      return shortName ? `3 ${rule.group}` : `Tercero Grupo(s) ${rule.group}`
    }
  } else if (isTeamWinnerRule(rule)){
    if (rule.winner) {
      return shortName ? `G${rule.game}` : `Ganador #${rule.game}`
    } else {
      return shortName ? `P${rule.game}` : `Perdedor #${rule.game}`
    }
  }
  return ''
}
