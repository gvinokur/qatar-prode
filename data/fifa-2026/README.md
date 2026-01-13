# FIFA 2026 World Cup Data

This directory contains all the data files needed to configure the 2026 FIFA World Cup tournament in the Qatar Prode application.

## Files

### `annex-c-rules-raw.json`
Raw JSON data containing all 495 third-place team assignment combinations extracted from FIFA's official regulations.

**Source**: FIFA World Cup 26 Regulations, Annex C (page 80)
- Official PDF: https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf
- Reference implementation: https://github.com/ismailoksuz/FIFA-World-Cup-2026-Predictor

**Format**:
```json
[
  {
    "combination": "ABCDEFGH",
    "matchups": {
      "1A": "H",
      "1B": "G",
      "1D": "B",
      "1E": "C",
      "1G": "A",
      "1I": "F",
      "1K": "D",
      "1L": "E"
    }
  }
]
```

### `third-place-rules.ts`
TypeScript module that exports the 495 rules with proper types and helper functions for looking up matchups.

**Usage**:
```typescript
import { FIFA_2026_THIRD_PLACE_RULES, getMatchupsForCombination } from './third-place-rules';

const matchups = getMatchupsForCombination(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
```

## Importing Rules into Database

Use the import script to load all 495 rules into the database for a specific tournament:

```bash
npx ts-node scripts/import-fifa-2026-rules.ts <tournament-id>
```

The script will:
1. Read all 495 rules from `third-place-rules.ts`
2. Insert/update each rule in the `tournament_third_place_rules` table
3. Report progress and final counts

## How Third-Place Rules Work

### The Problem
- 48 teams compete in 12 groups (A through L)
- 32 teams advance to knockout stage:
  - 12 group winners (1st place)
  - 12 runners-up (2nd place)
  - **Best 8 third-place teams** (ranked across all 12 groups)

- There are C(12,8) = **495 possible combinations** of which 8 groups' third-place teams qualify
- FIFA pre-defined the bracket assignment for each combination to ensure:
  - Balanced bracket
  - Geographic distribution
  - Teams from same group don't meet too early

### Example
If the best 8 third-place teams come from groups A, B, C, D, E, F, G, H:
- Combination key: `"ABCDEFGH"`
- Round of 32 matchups:
  - Winner of Group A (1A) plays 3rd place from Group H (3H)
  - Winner of Group B (1B) plays 3rd place from Group G (3G)
  - Winner of Group D (1D) plays 3rd place from Group B (3B)
  - Winner of Group E (1E) plays 3rd place from Group C (3C)
  - Winner of Group G (1G) plays 3rd place from Group A (3A)
  - Winner of Group I (1I) plays 3rd place from Group F (3F)
  - Winner of Group K (1K) plays 3rd place from Group D (3D)
  - Winner of Group L (1L) plays 3rd place from Group E (3E)

### Third-Place Ranking Tiebreakers
Third-place teams are ranked using these criteria (in order):
1. **Points** (3 for win, 1 for draw, 0 for loss)
2. **Goal difference** (goals for - goals against)
3. **Goals scored** (total goals for)
4. **Conduct score** (lower is better)
   - +1 per yellow card
   - +3 per indirect red card (yellow + red in same match)
   - +4 per direct red card
5. **FIFA World Ranking** (as of draw date)

## Tournament Data Files

All tournament data files have been created:
- [x] `index.ts` - Tournament metadata and theme
- [x] `base-data.ts` - Team names, venues, dates, playoff stages
- [x] `groups.ts` - 12 groups (A-L) with team assignments
- [x] `teams.ts` - All 48 teams with colors (including playoff placeholders)
- [x] `playoffs.ts` - Playoff structure (Round of 32 → Final)
- [x] `games.ts` - All 104 games (48 group stage + 32 knockout + 24 remaining)
- [x] `players.ts` - Player data placeholder (to be populated later)

### Next Steps

To use this tournament data:

1. **Import the 495 third-place rules** into the database:
   ```bash
   npx ts-node scripts/import-fifa-2026-rules.ts <tournament-id>
   ```

2. **Create the tournament** via backoffice console:
   - Use the data from `data/fifa-2026/index.ts`
   - Import teams, groups, playoffs, and games

3. **Update team names** for playoff placeholders once determined (March 2026):
   - UEFA Playoff A, B, C, D
   - Intercontinental Playoff 1, 2

4. **Add player data** once squads are announced (April-May 2026)

5. **Verify dates and venues** against official FIFA schedule
