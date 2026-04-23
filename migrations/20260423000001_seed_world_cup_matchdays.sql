UPDATE games
SET matchday =
  CASE
    WHEN game_number BETWEEN  1 AND 24 THEN 1
    WHEN game_number BETWEEN 25 AND 48 THEN 2
    WHEN game_number BETWEEN 49 AND 72 THEN 3
  END
WHERE tournament_id = (SELECT id FROM tournaments WHERE short_name = 'World Cup 26')
  AND game_number BETWEEN 1 AND 72;
