

export type NotificationDefinition = (params: {[key: string]: string}) => {
  title: string;
  message: string;
  url: string;
}

export const NOTIFICATION_MESSAGES: {[key: string]: NotificationDefinition} = {
  'default': (params: {[key: string]: string}) => ({
    title: 'La Maquina te extraña',
    message: 'Abri La Maquina prode y juga gratis',
    url: process.env.NEXT_PUBLIC_APP_URL + '/'
  }),
  'game-betting-window-closing-soon': (params: {[key: string]: string}) => ({
    title: `${params['game']} se juega pronto`,
    message: `Recorda que tenes hasta 1 hora antes del comienzo del mismo para hacer tu pronostico`,
    url: `/tournaments/${params['tournament_id']}/${params['group_id'] ? `groups/${params['group_id']}` : 'playoffs'}`
  }),
  'game-score-updated': (params: {[key: string]: string}) => ({
    title: `${params['game']} ha terminado`,
    message: `Ingresa para ver como te fue en tu pronostico`,
    url: `/tournaments/${params['tournament_id']}/${params['group_id'] ? `groups/${params['group_id']}` : 'playoffs'}`
  })
}
