

export type NotificationDefinition = (params: {[key: string]: string}) => {
  description: string;
  params: string[];
  title: string;
  message: string;
  url: string;
}

export const NOTIFICATION_MESSAGES: {[key: string]: NotificationDefinition} = {
  'default': (params: {[key: string]: string}) => ({
    description: 'Recordatorio general',
    params: [],
    title: 'La Maquina te extraña',
    message: 'Abri La Maquina prode y juga gratis',
    url: process.env.NEXT_PUBLIC_APP_URL + '/'
  }),
  'games-tomorrow': (params: {[key: string]: string}) => ({
    description: 'Partidos a disputarse',
    params: ['games', 'tournament_id'],
    title: `Mañana hay partidos!`,
    message: `Manaña se juegan ${params['games']} partidos. Acordate que tenes hasta 1 hora antes de cada unos para ingresar tus pronosticos`,
    url: `/tournaments/${params['tournament_id']}`
  }),
  'game-score-updated': (params: {[key: string]: string}) => ({
    description: 'Partidos Finalizado',
    params: ['game', 'tournament_id', 'group_id'],
    title: `${params['game']} ha terminado`,
    message: `Ingresa para ver como te fue en tu pronostico`,
    url: `/tournaments/${params['tournament_id']}/${params['group_id'] ? `groups/${params['group_id']}` : 'playoffs'}`
  })
}
