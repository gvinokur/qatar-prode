import { teams } from './teams';
import { groups } from './groups';
import { playoffs } from './playoffs';
import { games } from './games';
import { players } from './players';

/**
 * FIFA 2026 World Cup Tournament Data
 *
 * Host Countries: United States, Canada, Mexico
 * Dates: June 11 - July 19, 2026
 * Format: 48 teams, 12 groups, 104 total matches
 *
 * Key Features:
 * - First World Cup with 48 teams
 * - First World Cup hosted by three nations
 * - 12 groups of 4 teams (all teams play 3 group matches)
 * - Top 2 from each group + best 8 third-place teams advance (32 teams)
 * - Knockout stage includes Round of 32 for the first time
 * - 495 pre-defined third-place assignment combinations (FIFA Annex C)
 */
export default {
  tournament_name: 'FIFA World Cup 2026',
  tournament_short_name: 'WC 2026',
  tournament_theme: {
    primary_color: '#326295',
    secondary_color: '#A2AAAD',
    logo: '/fifa-2026.png', // Add logo to public folder
    web_page: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026',
  },
  teams,
  groups,
  playoffs,
  games,
  players,
};
