import { awardsDefinition } from '../../app/utils/award-utils';
import { ExtendedPlayerData } from '../../app/definitions';

describe('award-utils', () => {
  describe('awardsDefinition', () => {
    it('should have correct structure for all awards', () => {
      expect(awardsDefinition).toHaveLength(4);
      
      awardsDefinition.forEach(award => {
        expect(award).toHaveProperty('label');
        expect(award).toHaveProperty('property');
        expect(award).toHaveProperty('playerFilter');
        expect(typeof award.label).toBe('string');
        expect(typeof award.property).toBe('string');
        expect(typeof award.playerFilter).toBe('function');
      });
    });

    it('should have correct labels in Spanish', () => {
      const labels = awardsDefinition.map(award => award.label);
      expect(labels).toEqual([
        'Mejor Jugador',
        'Goleador',
        'Mejor Arquero',
        'Mejor Jugador Joven'
      ]);
    });

    it('should have correct property names', () => {
      const properties = awardsDefinition.map(award => award.property);
      expect(properties).toEqual([
        'best_player_id',
        'top_goalscorer_player_id',
        'best_goalkeeper_player_id',
        'best_young_player_id'
      ]);
    });
  });

  describe('playerFilter functions', () => {
    const mockTeam = {
      id: 'team1',
      name: 'Test Team',
      short_name: 'TT',
      theme: null
    };

    const mockPlayer: ExtendedPlayerData = {
      id: '1',
      name: 'Test Player',
      position: 'FW',
      age_at_tournament: 25,
      team_id: 'team1',
      tournament_id: 'tournament1',
      team: mockTeam
    };

    it('should allow all players for best player filter', () => {
      const bestPlayerFilter = awardsDefinition.find(a => a.property === 'best_player_id')?.playerFilter;
      expect(bestPlayerFilter).toBeDefined();
      expect(bestPlayerFilter!(mockPlayer)).toBe(true);
    });

    it('should allow all players for top goalscorer filter', () => {
      const goalscorerFilter = awardsDefinition.find(a => a.property === 'top_goalscorer_player_id')?.playerFilter;
      expect(goalscorerFilter).toBeDefined();
      expect(goalscorerFilter!(mockPlayer)).toBe(true);
    });

    it('should only allow goalkeepers for best goalkeeper filter', () => {
      const goalkeeperFilter = awardsDefinition.find(a => a.property === 'best_goalkeeper_player_id')?.playerFilter;
      expect(goalkeeperFilter).toBeDefined();
      
      // Test with goalkeeper
      const goalkeeper = { ...mockPlayer, position: 'GK' };
      expect(goalkeeperFilter!(goalkeeper)).toBe(true);
      
      // Test with different positions
      const forward = { ...mockPlayer, position: 'FW' };
      expect(goalkeeperFilter!(forward)).toBe(false);
      
      const midfielder = { ...mockPlayer, position: 'MF' };
      expect(goalkeeperFilter!(midfielder)).toBe(false);
      
      const defender = { ...mockPlayer, position: 'DF' };
      expect(goalkeeperFilter!(defender)).toBe(false);
    });

    it('should handle goalkeeper position case insensitively', () => {
      const goalkeeperFilter = awardsDefinition.find(a => a.property === 'best_goalkeeper_player_id')?.playerFilter;
      expect(goalkeeperFilter).toBeDefined();
      
      const goalkeeperLower = { ...mockPlayer, position: 'gk' };
      expect(goalkeeperFilter!(goalkeeperLower)).toBe(true);
      
      const goalkeeperMixed = { ...mockPlayer, position: 'Gk' };
      expect(goalkeeperFilter!(goalkeeperMixed)).toBe(true);
    });

    it('should only allow young players for best young player filter', () => {
      const youngPlayerFilter = awardsDefinition.find(a => a.property === 'best_young_player_id')?.playerFilter;
      expect(youngPlayerFilter).toBeDefined();
      
      // Test with young player (under 22)
      const youngPlayer = { ...mockPlayer, age_at_tournament: 21 };
      expect(youngPlayerFilter!(youngPlayer)).toBe(true);
      
      const veryYoungPlayer = { ...mockPlayer, age_at_tournament: 18 };
      expect(youngPlayerFilter!(veryYoungPlayer)).toBe(true);
      
      // Test with older player (22 or older)
      const olderPlayer = { ...mockPlayer, age_at_tournament: 22 };
      expect(youngPlayerFilter!(olderPlayer)).toBe(false);
      
      const muchOlderPlayer = { ...mockPlayer, age_at_tournament: 30 };
      expect(youngPlayerFilter!(muchOlderPlayer)).toBe(false);
    });

    it('should handle edge case age of 21 for young player filter', () => {
      const youngPlayerFilter = awardsDefinition.find(a => a.property === 'best_young_player_id')?.playerFilter;
      expect(youngPlayerFilter).toBeDefined();
      
      const edgeCasePlayer = { ...mockPlayer, age_at_tournament: 21 };
      expect(youngPlayerFilter!(edgeCasePlayer)).toBe(true);
    });
  });
}); 