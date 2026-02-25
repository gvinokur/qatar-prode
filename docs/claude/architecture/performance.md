# Performance Optimization

This guide explains when and how to optimize performance in the qatar-prode application.

**Context:** Running on Vercel free tier requires careful resource management.

## When to Analyze Performance

✅ **Optimize When:**
- Making **5-10+ database queries** to render a single page/request
- Queries run sequentially (waterfall) when they could be parallel
- Same data queried multiple times in a request
- Query results used only for aggregation/counting (can be pushed to DB)
- Hitting Vercel function duration/memory limits

❌ **Don't Optimize When:**
- Page/request makes <5 queries total
- Queries already run in parallel (`Promise.all`)
- Admin-only features (low traffic)
- One-time data migrations or scripts

🤔 **Consider When:**
- 5-10 queries (borderline) but page feels slow
- Queries could easily be combined with JOINs

## Optimization Techniques

### 1. Materialization Pattern (Story #147 example)

Pre-calculate and store aggregations in database columns. Update via triggers or batch jobs after source data changes.

```typescript
// Before: On-demand aggregation (48+ queries per user)
const scores = await db.selectFrom('game_guesses')
  .where('user_id', '=', userId)
  .select(db.fn.sum('score').as('total'))
  .execute();

// After: Materialized columns (1 query per user)
const scores = await db.selectFrom('tournament_guesses')
  .where('user_id', '=', userId)
  .select(['total_game_score', 'total_boost_bonus'])  // Pre-calculated
  .executeTakeFirst();

// Impact: 93% compute reduction, 90% faster page loads
```

**Materialized Columns in Schema:**
- `tournament_guesses.total_game_score` - Sum of game scores
- `tournament_guesses.total_boost_bonus` - Sum of boost bonuses
- `tournament_guesses.total_correct_guesses` - Count of correct predictions
- Updated by `calculateGameScores()` action after game results published
- Legacy `legacyGetGameGuessStatisticsForUsers()` kept for validation

### 2. Parallel Queries

```typescript
// ❌ Sequential (slow)
const tournaments = await findTournaments();
const games = await findGames();
const users = await findUsers();

// ✅ Parallel (fast)
const [tournaments, games, users] = await Promise.all([
  findTournaments(),
  findGames(),
  findUsers(),
]);
```

### 3. Query Optimization
- Use JOINs to reduce round trips
- Select only needed columns
- Add indexes for frequently queried columns
- Use `.executeTakeFirst()` when expecting single result

## Measurement

- Count queries per page/request (aim for <5)
- Monitor Vercel function duration (check deployment logs)
- Use `legacyFunctionName()` pattern during transition for validation
