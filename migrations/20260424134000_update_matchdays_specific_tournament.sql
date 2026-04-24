-- Update matchdays for specific tournament
-- Tournament ID: c8f074d5-bc1a-432e-83d8-5c37ef15b5bd

UPDATE games 
SET matchday = 1 
WHERE tournament_id = 'c8f074d5-bc1a-432e-83d8-5c37ef15b5bd' 
AND game_number BETWEEN 1 AND 4;

UPDATE games 
SET matchday = 2 
WHERE tournament_id = 'c8f074d5-bc1a-432e-83d8-5c37ef15b5bd' 
AND game_number BETWEEN 5 AND 8;

UPDATE games 
SET matchday = 3 
WHERE tournament_id = 'c8f074d5-bc1a-432e-83d8-5c37ef15b5bd' 
AND game_number BETWEEN 9 AND 12;
