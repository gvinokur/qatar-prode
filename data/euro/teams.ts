import {TeamNames} from './base-data'
const team =  (name:string, short_name:string, primary_color:string, secondary_color:string) => ({
  name,
  short_name,
  primary_color,
  secondary_color
})

export const teams = [
  team(TeamNames.Albania, 'ALB', '#ED1C25', '#231F20'),
  team(TeamNames.Austria, 'AUS', '#ED1C25', '#FFFFFF'),
  team(TeamNames.Belgium, 'BEL', '#ED1C25', '#FFD504'),
  team(TeamNames.Croatia, 'CRO', '#ED1C25', '#10499D'),
  team(TeamNames.Czechia, 'CZE', '#015AAB', '#ED1C25'),
  team(TeamNames.Denmark, 'DEN', '#ED1C25', '#FFFFFF'),
  team(TeamNames.England, 'ENG', '#FFFFFF', '#ED1C25'),
  team(TeamNames.France, 'FRA', '#015aab', '#ffffff'),
  team(TeamNames.Georgia, 'GEO', '#ffffff', '#ed1c25'),
  team(TeamNames.Germany, 'GER', '#ffcb0a', '#231f20'),
  team(TeamNames.Hungary, 'HUN', '#008c55', '#ed1c25' ),
  team(TeamNames.Italy, 'ITA', '#006cb8', '#ffffff'),
  team(TeamNames.Netherlands, 'NED', '#f58349', '#015aab'),
  team(TeamNames.Poland, 'POL', '#FFFFFF', '#ED1C25'),
  team(TeamNames.Portugal, 'POR', '#ed1c25', '#016940'),
  team(TeamNames.Romania, 'ROM', '#ffde02', '#ed1c25'),
  team(TeamNames.Scotland, 'SCO', '#006cb8', '#ffffff'),
  team(TeamNames.Serbia, 'SRB', '#ed1c25', '#0f5a97'),
  team(TeamNames.Slovakia, 'SLK','#ed1c25', '#0f5a97'),
  team(TeamNames.Slovenia, 'SLN', '#015aab', '#ffffff'),
  team(TeamNames.Spain, 'SPA', '#c72027', '#fec40f'),
  team(TeamNames.Switzerland, 'SWI', '#ED1C25', '#FFFFFF'),
  team(TeamNames.Turkey, 'TUR', '#ed1c25', '#FFFFFF'),
  team(TeamNames.Ukraine, 'UKR', '#015aab', '#ffe802')
]
