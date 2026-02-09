# FIFA 2026 World Cup Deployment Guide

This guide covers the deployment of the new features required for the 2026 FIFA World Cup:
- Third-place team assignment rules (495 combinations from FIFA Annex C)
- Team conduct score tiebreaker
- 2026 World Cup tournament data

## Prerequisites

- Admin access to the production database
- Access to the backoffice console
- Verified database backup capability

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved
- [ ] Database backup plan verified
- [ ] Rollback procedure documented

## Deployment Steps

### 1. Backup Production Database

**CRITICAL**: Always backup before schema changes.

```bash
# Example for PostgreSQL (adjust for your setup)
pg_dump -h <host> -U <user> -d <database> -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup was created
ls -lh backup_*.dump
```

**Store the backup securely** and note the filename for potential rollback.

### 2. Run Database Migrations

The application includes two new migrations:

#### Migration 1: Third-Place Rules Table
Creates `tournament_third_place_rules` table to store the 495 combinations.

#### Migration 2: Conduct Score Fields
Adds `conduct_score` column to:
- `tournament_group_teams`
- `tournament_group_team_stats_guess` *(deprecated in Feb 2026)*

#### Run Migrations

Migrations should run automatically when the application starts. To manually verify:

```bash
# Check if migrations have been applied
# (method depends on your migration tool)
npm run migrate:status

# Run pending migrations
npm run migrate
```

### 3. Deploy Application Code

Deploy the updated application code to your production environment:

```bash
# Example deployment steps (adjust for your setup)
git pull origin main
npm install
npm run build
pm2 restart qatar-prode  # or your process manager
```

Verify the application starts successfully and check logs for errors.

### 4. Import FIFA 2026 Annex C Rules

Once the application is deployed and migrations have run, import the 495 third-place assignment rules.

#### Option A: Via Import Script (Recommended)

1. First, create the 2026 World Cup tournament via the backoffice console (see Section 6)

2. Note the tournament ID from the database or URL

3. Run the import script:

```bash
npx ts-node scripts/import-fifa-2026-rules.ts <tournament-id>
```

Expected output:
```
Importing FIFA 2026 rules for tournament: <tournament-id>
Found 495 rules to import
Progress: 100/495 rules imported
Progress: 200/495 rules imported
Progress: 300/495 rules imported
Progress: 400/495 rules imported

Import complete!
Successfully imported: 495
Errors: 0

Total rules in database: 495
Script finished successfully
```

#### Option B: Via Backoffice UI

1. Navigate to Backoffice → WC 2026 → Third-Place Rules tab
2. Click "Add Rule" for each of the 495 combinations
3. Copy/paste combination key and rules JSON from `data/fifa-2026/annex-c-rules-raw.json`

**Note**: Option A is strongly recommended due to the large number of rules.

### 5. Verify Database Changes

```sql
-- Verify new table exists
SELECT COUNT(*) FROM tournament_third_place_rules;
-- Expected: 495 rows (after import)

-- Verify conduct_score columns exist
SELECT conduct_score FROM tournament_group_teams LIMIT 1;
-- Note: tournament_group_team_stats_guess table was deprecated in Feb 2026

-- Verify a sample third-place rule
SELECT * FROM tournament_third_place_rules
WHERE combination_key = 'ABCDEFGH';
```

### 6. Create 2026 World Cup Tournament

#### Step 1: Prepare Tournament Data

The tournament data is available in `data/fifa-2026/`:
- `index.ts` - Tournament metadata
- `teams.ts` - All 48 teams
- `groups.ts` - 12 groups (A-L)
- `playoffs.ts` - Playoff structure
- `games.ts` - All 104 games
- `players.ts` - Player data (optional)

#### Step 2: Create Tournament via Backoffice

1. Navigate to Backoffice console
2. Click "Create Tournament" button
3. Fill in tournament details:
   - Name: `FIFA World Cup 2026`
   - Short Name: `WC 2026`
   - Theme Colors:
     - Primary: `#326295`
     - Secondary: `#A2AAAD`
   - Logo: Upload FIFA 2026 logo to `/public/fifa-2026.png`
   - Website: `https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026`

4. Import Teams (48 teams)
   - Use data from `data/fifa-2026/teams.ts`
   - Include playoff placeholders (UEFA Playoff A/B/C/D, Intercontinental Playoff 1/2)

5. Create Groups (12 groups)
   - Use data from `data/fifa-2026/groups.ts`
   - Assign 4 teams to each group

6. Create Playoff Structure
   - Round of 32: 16 games
   - Round of 16: 8 games
   - Quarter-finals: 4 games
   - Semi-finals: 2 games
   - Third Place: 1 game
   - Final: 1 game

7. Create Games (104 games)
   - 48 group stage games (6 per group)
   - 32 knockout games
   - Use team qualification rules from `data/fifa-2026/games.ts`

### 7. Import Third-Place Rules

After tournament is created, import the 495 rules:

```bash
# Get tournament ID from database or backoffice URL
npx ts-node scripts/import-fifa-2026-rules.ts <tournament-id>
```

### 8. Verification Tests

#### Test 1: Conduct Score Tiebreaker

1. Navigate to Backoffice → WC 2026 → Game Scores → Any Group
2. Click "Edit Conduct Scores"
3. Set different conduct scores for teams with equal points/GD/GF
4. Verify team with lower conduct score ranks higher in table

#### Test 2: Third-Place Team Selection

1. Enter group stage results for all 12 groups
2. Ensure exactly 8 third-place teams qualify
3. Verify they are ranked by: Points → GD → GF → Conduct Score

#### Test 3: Round of 32 Bracket Assignment

1. After group stage is complete, check Round of 32 games
2. Verify third-place teams are assigned to correct bracket positions
3. Example: If groups A,B,C,D,E,F,G,H have best 3rd place teams:
   - Combination key: `ABCDEFGH`
   - Winner of Group E plays 3rd from Group A (or specified group based on rules)

#### Test 4: User Predictions

1. Create test user account
2. Make predictions for all group games
3. Verify predictions calculate correctly with conduct score tiebreaker
4. Check playoff bracket updates dynamically

### 9. Post-Deployment Monitoring

Monitor the following after deployment:

- **Application Logs**: Check for errors related to third-place calculations
- **Database Performance**: Monitor query performance on new table
- **User Activity**: Verify users can make predictions and view results
- **Backoffice Access**: Confirm admins can manage conduct scores

### 10. Update Playoff Placeholders (March 2026)

When UEFA and Intercontinental playoffs are complete:

1. Navigate to Backoffice → WC 2026 → Teams
2. Update placeholder team names:
   - UEFA Playoff A → Actual team (e.g., "Italy")
   - UEFA Playoff B → Actual team (e.g., "Sweden")
   - UEFA Playoff C → Actual team (e.g., "Turkey")
   - UEFA Playoff D → Actual team (e.g., "Denmark")
   - Intercontinental Playoff 1 → Actual team
   - Intercontinental Playoff 2 → Actual team
3. Update team colors/logos as needed

## Rollback Procedure

If issues occur after deployment:

### 1. Restore Database Backup

```bash
# Stop the application
pm2 stop qatar-prode

# Restore database from backup
pg_restore -h <host> -U <user> -d <database> -c backup_YYYYMMDD_HHMMSS.dump

# Restart application with previous code version
git checkout <previous-commit>
npm install
npm run build
pm2 restart qatar-prode
```

### 2. Verify Rollback

- Check application starts successfully
- Verify existing tournaments still work
- Test user predictions and scoring

## Troubleshooting

### Issue: Migrations fail to run

**Solution**: Check database permissions and manually run migration SQL files in order:
```bash
psql -h <host> -U <user> -d <database> -f migrations/20260113000000_add_third_place_rules_table.sql
psql -h <host> -U <user> -d <database> -f migrations/20260113000001_add_conduct_score_to_team_stats.sql
```

### Issue: Import script fails

**Solution**:
1. Verify tournament ID is correct
2. Check database connection
3. Ensure migrations have run successfully
4. Try importing one rule manually via backoffice to test

### Issue: Third-place teams not assigned correctly

**Solution**:
1. Verify all 495 rules are imported (check count in database)
2. Check group stage results are complete
3. Verify conduct scores are set for tied teams
4. Review application logs for playoff calculation errors

### Issue: Conduct score not affecting rankings

**Solution**:
1. Verify migration added conduct_score columns
2. Check conduct scores are set in database (not NULL or 0 for all teams)
3. Ensure teams have equal points, GD, and GF for conduct score to apply

## Testing Strategy

### Pre-Production Testing

1. **Local Testing**: Test full workflow on local environment
2. **Staging Testing**: Deploy to staging and run all verification tests
3. **Load Testing**: Simulate multiple users making predictions
4. **Edge Cases**: Test all 495 third-place combinations with sample data

### Production Testing

1. **Smoke Tests**: Basic functionality after deployment
2. **Integration Tests**: Test with real tournament data
3. **User Acceptance Testing**: Admin users test backoffice functionality

## Key Files Modified

### Database
- `migrations/20260113000000_add_third_place_rules_table.sql`
- `migrations/20260113000001_add_conduct_score_to_team_stats.sql`

### Backend
- `app/db/tournament-third-place-rules-repository.ts` (new)
- `app/db/tournament-group-repository.ts` (conduct score functions)
- `app/utils/playoff-teams-calculator.ts` (now async, uses database rules)
- `app/utils/group-position-calculator.ts` (conduct score tiebreaker)
- `app/actions/backoffice-actions.ts` (conduct score action)
- `app/actions/third-place-rules-actions.ts` (new)

### Frontend
- `app/components/backoffice/tournament-third-place-rules-tab.tsx` (new)
- `app/components/backoffice/internal/team-stats-edit-dialog.tsx` (new)
- `app/components/backoffice/group-backoffice-tab.tsx` (conduct score UI)
- `app/backoffice/page.tsx` (third-place rules tab)

### Data
- `data/fifa-2026/` (complete tournament data)
- `scripts/import-fifa-2026-rules.ts` (import script)
- `scripts/parse-annex-c-data.js` (CSV parser)

### Tests
- `__tests__/utils/group-position-calculator.test.ts` (conduct score tests)
- `__tests__/db/tournament-third-place-rules-repository.test.ts` (new)

## Support Contacts

- **Technical Issues**: [Your support contact]
- **FIFA Rules Questions**: Refer to official FIFA regulations PDF
- **Database Issues**: [Your DBA contact]

## References

- [FIFA World Cup 26 Regulations PDF](https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf)
- [FIFA 2026 Official Website](https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026)
- [GitHub Reference Implementation](https://github.com/ismailoksuz/FIFA-World-Cup-2026-Predictor)

---

**Last Updated**: January 2026
**Version**: 1.0
