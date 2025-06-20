import { 
  isGroupFinishRule, 
  isTeamWinnerRule, 
  getTeamDescription 
} from '../../app/utils/playoffs-rule-helper';
import { GroupFinishRule, TeamWinnerRule } from '../../app/db/tables-definition';

describe('isGroupFinishRule', () => {
  it('should return true for valid GroupFinishRule objects', () => {
    const validRule: GroupFinishRule = {
      group: 'A',
      position: 1
    };
    expect(isGroupFinishRule(validRule)).toBe(true);
  });

  it('should return true for GroupFinishRule with position 2', () => {
    const validRule: GroupFinishRule = {
      group: 'B',
      position: 2
    };
    expect(isGroupFinishRule(validRule)).toBe(true);
  });

  it('should return true for GroupFinishRule with position 3', () => {
    const validRule: GroupFinishRule = {
      group: 'C',
      position: 3
    };
    expect(isGroupFinishRule(validRule)).toBe(true);
  });

  it('should return false for objects missing position property', () => {
    const invalidRule = {
      group: 'A'
    };
    expect(isGroupFinishRule(invalidRule)).toBe(false);
  });

  it('should return false for objects missing group property', () => {
    const invalidRule = {
      position: 1
    };
    expect(isGroupFinishRule(invalidRule)).toBe(false);
  });

  it('should return false for objects with extra properties', () => {
    const invalidRule = {
      group: 'A',
      position: 1,
      extra: 'property'
    };
    expect(isGroupFinishRule(invalidRule)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isGroupFinishRule(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isGroupFinishRule(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isGroupFinishRule('string')).toBe(false);
    expect(isGroupFinishRule(123)).toBe(false);
    expect(isGroupFinishRule(true)).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(isGroupFinishRule({})).toBe(false);
  });
});

describe('isTeamWinnerRule', () => {
  it('should return true for valid TeamWinnerRule objects with winner true', () => {
    const validRule: TeamWinnerRule = {
      winner: true,
      game: 1
    };
    expect(isTeamWinnerRule(validRule)).toBe(true);
  });

  it('should return true for valid TeamWinnerRule objects with winner false', () => {
    const validRule: TeamWinnerRule = {
      winner: false,
      game: 2
    };
    expect(isTeamWinnerRule(validRule)).toBe(true);
  });

  it('should return true for TeamWinnerRule with different game numbers', () => {
    const validRule: TeamWinnerRule = {
      winner: true,
      game: 5
    };
    expect(isTeamWinnerRule(validRule)).toBe(true);
  });

  it('should return false for objects missing winner property', () => {
    const invalidRule = {
      game: 1
    };
    expect(isTeamWinnerRule(invalidRule)).toBe(false);
  });

  it('should return false for objects missing game property', () => {
    const invalidRule = {
      winner: true
    };
    expect(isTeamWinnerRule(invalidRule)).toBe(false);
  });

  it('should return false for objects with extra properties', () => {
    const invalidRule = {
      winner: true,
      game: 1,
      extra: 'property'
    };
    expect(isTeamWinnerRule(invalidRule)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isTeamWinnerRule(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isTeamWinnerRule(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isTeamWinnerRule('string')).toBe(false);
    expect(isTeamWinnerRule(123)).toBe(false);
    expect(isTeamWinnerRule(true)).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(isTeamWinnerRule({})).toBe(false);
  });
});

describe('getTeamDescription', () => {
  describe('GroupFinishRule descriptions', () => {
    it('should return correct description for position 1 (short)', () => {
      const rule: GroupFinishRule = { group: 'A', position: 1 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('1 A');
    });

    it('should return correct description for position 1 (long)', () => {
      const rule: GroupFinishRule = { group: 'A', position: 1 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Primero Grupo A');
    });

    it('should return correct description for position 2 (short)', () => {
      const rule: GroupFinishRule = { group: 'B', position: 2 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('2 B');
    });

    it('should return correct description for position 2 (long)', () => {
      const rule: GroupFinishRule = { group: 'B', position: 2 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Segundo Grupo B');
    });

    it('should return correct description for position 3 (short)', () => {
      const rule: GroupFinishRule = { group: 'C', position: 3 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('3 C');
    });

    it('should return correct description for position 3 (long)', () => {
      const rule: GroupFinishRule = { group: 'C', position: 3 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Tercero Grupo(s) C');
    });

    it('should handle different group letters', () => {
      const rule: GroupFinishRule = { group: 'D', position: 1 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('1 D');
    });

    it('should handle lowercase group letters', () => {
      const rule: GroupFinishRule = { group: 'a', position: 2 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('2 a');
    });
  });

  describe('TeamWinnerRule descriptions', () => {
    it('should return correct description for winner true (short)', () => {
      const rule: TeamWinnerRule = { winner: true, game: 1 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('G1');
    });

    it('should return correct description for winner true (long)', () => {
      const rule: TeamWinnerRule = { winner: true, game: 1 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Ganador #1');
    });

    it('should return correct description for winner false (short)', () => {
      const rule: TeamWinnerRule = { winner: false, game: 2 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('P2');
    });

    it('should return correct description for winner false (long)', () => {
      const rule: TeamWinnerRule = { winner: false, game: 2 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Perdedor #2');
    });

    it('should handle different game numbers', () => {
      const rule: TeamWinnerRule = { winner: true, game: 5 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('G5');
    });

    it('should handle large game numbers', () => {
      const rule: TeamWinnerRule = { winner: false, game: 15 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Perdedor #15');
    });
  });

  describe('Edge cases and invalid inputs', () => {
    it('should return empty string for undefined rule', () => {
      const result = getTeamDescription(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for null rule', () => {
      const result = getTeamDescription(null as any);
      expect(result).toBe('');
    });

    it('should return empty string for invalid rule object', () => {
      const invalidRule = { invalid: 'property' };
      const result = getTeamDescription(invalidRule as any);
      expect(result).toBe('');
    });

    it('should return empty string for empty object', () => {
      const result = getTeamDescription({} as any);
      expect(result).toBe('');
    });

    it('should return empty string for GroupFinishRule with invalid position', () => {
      const rule = { group: 'A', position: 4 } as GroupFinishRule;
      const result = getTeamDescription(rule);
      expect(result).toBe('');
    });

    it('should return empty string for GroupFinishRule with position 0', () => {
      const rule = { group: 'A', position: 0 } as GroupFinishRule;
      const result = getTeamDescription(rule);
      expect(result).toBe('');
    });

    it('should return empty string for GroupFinishRule with negative position', () => {
      const rule = { group: 'A', position: -1 } as GroupFinishRule;
      const result = getTeamDescription(rule);
      expect(result).toBe('');
    });

    it('should return empty string for objects with extra properties', () => {
      const rule = { group: 'A', position: 1, extra: 'property' } as any;
      const result = getTeamDescription(rule);
      expect(result).toBe('');
    });
  });

  describe('Default parameter behavior', () => {
    it('should default to long description when shortName is not provided', () => {
      const rule: GroupFinishRule = { group: 'A', position: 1 };
      const result = getTeamDescription(rule);
      expect(result).toBe('Primero Grupo A');
    });

    it('should use provided shortName parameter', () => {
      const rule: GroupFinishRule = { group: 'A', position: 1 };
      const result = getTeamDescription(rule, false);
      expect(result).toBe('Primero Grupo A');
    });

    it('should use short description when shortName is true', () => {
      const rule: GroupFinishRule = { group: 'A', position: 1 };
      const result = getTeamDescription(rule, true);
      expect(result).toBe('1 A');
    });
  });
}); 