-- Story #449: Seed FIFA World Rankings for all 48 FIFA 2026 World Cup teams
-- Source (ranks 1–19): Official FIFA World Rankings, April 1, 2026 update
-- Source (ranks 20+): Official FIFA World Rankings, November 19, 2025 (draw seedings)
-- Playoff teams (PO-A/B/C/D, IC-1/IC-2) use their placeholder short_names from the import script.
-- Qualified playoff teams (settled March 31, 2026):
--   PO-A = Bosnia & Herzegovina (65), PO-B = Sweden (38), PO-C = Turkey (22), PO-D = Czech Republic (41)
--   IC-1 = DR Congo (46), IC-2 = Iraq (57)

UPDATE teams SET rank = 1   WHERE short_name = 'FRA';  -- France
UPDATE teams SET rank = 2   WHERE short_name = 'ESP';  -- Spain
UPDATE teams SET rank = 3   WHERE short_name = 'ARG';  -- Argentina
UPDATE teams SET rank = 4   WHERE short_name = 'ENG';  -- England
UPDATE teams SET rank = 5   WHERE short_name = 'POR';  -- Portugal
UPDATE teams SET rank = 6   WHERE short_name = 'BRA';  -- Brazil
UPDATE teams SET rank = 7   WHERE short_name = 'NED';  -- Netherlands
UPDATE teams SET rank = 8   WHERE short_name = 'MAR';  -- Morocco
UPDATE teams SET rank = 9   WHERE short_name = 'BEL';  -- Belgium
UPDATE teams SET rank = 10  WHERE short_name = 'GER';  -- Germany
UPDATE teams SET rank = 11  WHERE short_name = 'CRO';  -- Croatia
UPDATE teams SET rank = 13  WHERE short_name = 'COL';  -- Colombia
UPDATE teams SET rank = 14  WHERE short_name = 'SEN';  -- Senegal
UPDATE teams SET rank = 15  WHERE short_name = 'MEX';  -- Mexico
UPDATE teams SET rank = 16  WHERE short_name = 'USA';  -- United States
UPDATE teams SET rank = 17  WHERE short_name = 'URU';  -- Uruguay
UPDATE teams SET rank = 18  WHERE short_name = 'JPN';  -- Japan
UPDATE teams SET rank = 19  WHERE short_name = 'SUI';  -- Switzerland
UPDATE teams SET rank = 20  WHERE short_name = 'IRN';  -- Iran
UPDATE teams SET rank = 22  WHERE short_name = 'PO-C'; -- Turkey (UEFA Path C)
UPDATE teams SET rank = 22  WHERE short_name = 'KOR';  -- South Korea
UPDATE teams SET rank = 23  WHERE short_name = 'ECU';  -- Ecuador
UPDATE teams SET rank = 24  WHERE short_name = 'AUT';  -- Austria
UPDATE teams SET rank = 26  WHERE short_name = 'AUS';  -- Australia
UPDATE teams SET rank = 27  WHERE short_name = 'CAN';  -- Canada
UPDATE teams SET rank = 29  WHERE short_name = 'NOR';  -- Norway
UPDATE teams SET rank = 30  WHERE short_name = 'PAN';  -- Panama
UPDATE teams SET rank = 34  WHERE short_name = 'EGY';  -- Egypt
UPDATE teams SET rank = 35  WHERE short_name = 'ALG';  -- Algeria
UPDATE teams SET rank = 36  WHERE short_name = 'SCO';  -- Scotland
UPDATE teams SET rank = 38  WHERE short_name = 'PO-B'; -- Sweden (UEFA Path B)
UPDATE teams SET rank = 39  WHERE short_name = 'PAR';  -- Paraguay
UPDATE teams SET rank = 40  WHERE short_name = 'TUN';  -- Tunisia
UPDATE teams SET rank = 41  WHERE short_name = 'PO-D'; -- Czech Republic (UEFA Path D)
UPDATE teams SET rank = 42  WHERE short_name = 'CIV';  -- Ivory Coast
UPDATE teams SET rank = 46  WHERE short_name = 'IC-1'; -- DR Congo (IC Path 1)
UPDATE teams SET rank = 50  WHERE short_name = 'UZB';  -- Uzbekistan
UPDATE teams SET rank = 51  WHERE short_name = 'QAT';  -- Qatar
UPDATE teams SET rank = 57  WHERE short_name = 'IC-2'; -- Iraq (IC Path 2)
UPDATE teams SET rank = 60  WHERE short_name = 'KSA';  -- Saudi Arabia
UPDATE teams SET rank = 61  WHERE short_name = 'RSA';  -- South Africa
UPDATE teams SET rank = 65  WHERE short_name = 'PO-A'; -- Bosnia & Herzegovina (UEFA Path A)
UPDATE teams SET rank = 66  WHERE short_name = 'JOR';  -- Jordan
UPDATE teams SET rank = 68  WHERE short_name = 'CPV';  -- Cape Verde
UPDATE teams SET rank = 72  WHERE short_name = 'GHA';  -- Ghana
UPDATE teams SET rank = 82  WHERE short_name = 'CUW';  -- Curacao
UPDATE teams SET rank = 84  WHERE short_name = 'HAI';  -- Haiti
UPDATE teams SET rank = 86  WHERE short_name = 'NZL';  -- New Zealand
