import {GroupFinishRule, TeamWinnerRule} from "../db/tables-definition";

export const isGroupFinishRule = (object: any): object is GroupFinishRule => {
  return ('position' in object && 'group' in object);
}

export const isTeamWinnerRule = (object: any): object is TeamWinnerRule => {
  return ('winner' in object && 'game' in object);
}

export const getTeamDescription = (rule?: GroupFinishRule | TeamWinnerRule) => {
  if(isGroupFinishRule(rule)) {
    if (rule.position === 1) {
      return `Primero Grupo ${rule.group}`
    } else if (rule.position === 2) {
      return `Segundo Grupo ${rule.group}`
    } else if (rule.position === 3) {
      return `Tercero Grupo(s) ${rule.group}`
    }
  } else if (isTeamWinnerRule(rule)){
    if (rule.winner) {
      return `Ganador del Partido ${rule.game}`
    } else {
      return `Perdedor del Partido ${rule.game}`
    }
  }
  return ''
}
