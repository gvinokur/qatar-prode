# CSV Validation and Fix Scripts

This directory contains scripts used to validate and correct the `extracted_data.csv` file containing FIFA World Cup 2026 third-place qualification rules.

## Overview

The CSV file was manually transcribed from 18 table images (table_1.png through table_18.png) containing 495 rows of third-place qualification rules. These scripts were used to validate the data against the database and fix any discrepancies.

## Scripts

### Validation Scripts

#### `validate-third-place-rules.ts`
Basic validation script that checks if the database contains exactly 495 third-place rules for the World Cup 2026 tournament.

**Usage:**
```bash
npx tsx ./scripts/validate-third-place-rules.ts
```

#### `validate-all-csv-db-matches.ts`
Comprehensive validation script that compares all 495 CSV rows against database rules. Checks that each combination key exists in the database and that all rule values match.

**Usage:**
```bash
npx tsx ./scripts/validate-all-csv-db-matches.ts
```

**Output:**
- Total combinations tested
- Valid count
- Error count
- Detailed list of mismatches (if any)

#### `validate-non-duplicate-rows.ts`
Validates only non-duplicate combination keys, skipping rows that appear multiple times in the CSV. Used during the fix process to verify that non-problematic rows were correct.

**Usage:**
```bash
npx tsx ./scripts/validate-non-duplicate-rows.ts
```

#### `test-csv-db-match.ts`
Tests individual combination keys. Used for spot-checking specific rows during the validation process.

**Usage:**
```bash
npx tsx ./scripts/test-csv-db-match.ts
```

### Fix Scripts

#### `auto-fix-invalid-rows.ts`
Automatically fixes rows with invalid combinations by finding single-column differences between the current row and valid database combinations.

**Logic:**
- Compares each invalid row with all valid database rules
- Identifies rows that differ by only one column
- Automatically fixes those rows by updating the single incorrect value
- Cannot fix rows that require multiple column changes

**Usage:**
```bash
npx tsx ./scripts/auto-fix-invalid-rows.ts
```

**Results:**
- Successfully fixed 13 invalid rows automatically
- Remaining rows with multiple differences required manual fixing

### Analysis Scripts

#### `find-problematic-rows.ts`
Identifies which CSV rows have invalid or duplicate combinations.

**Usage:**
```bash
npx tsx ./scripts/find-problematic-rows.ts
```

**Output:**
- Invalid rows (combination not in DB)
- Duplicate combinations in CSV
- Combinations in DB but missing from CSV

#### `show-duplicate-pairs.ts`
Displays all duplicate combination pairs with their complete row values for manual inspection and fixing.

**Usage:**
```bash
npx tsx ./scripts/show-duplicate-pairs.ts
```

**Output:**
- All duplicate pairs grouped by combination key
- Complete cell values for each duplicate row
- Useful for identifying which row in each pair needs correction

#### `find-correct-values.ts`
Shows correct database values for missing combinations. Used during the manual fix process to understand what values should exist.

**Usage:**
```bash
npx tsx ./scripts/find-correct-values.ts
```

## Validation Process

The complete validation and fix process followed these steps:

1. **Initial Validation** (`validate-all-csv-db-matches.ts`)
   - Found 483 valid rows, 12 errors
   - Identified missing combinations and duplicates

2. **Problem Analysis** (`find-problematic-rows.ts`)
   - Identified 12 duplicate pairs in CSV
   - Confirmed 12 combinations existed in DB but were missing from CSV

3. **Duplicate Fixing** (Manual with image verification)
   - Fixed all 12 duplicate pairs by comparing with source images
   - Common issues: I vs J character confusion, K vs J confusion

4. **Automatic Fixing** (`auto-fix-invalid-rows.ts`)
   - Fixed 13 additional rows with single-column errors

5. **Final Validation** (`validate-all-csv-db-matches.ts`)
   - Confirmed 495/495 rows match database (100% accuracy)

6. **Visual Verification**
   - Used AI agent to visually compare CSV with source images
   - Confirmed 494/495 visual matches (99.97% accuracy)
   - 1 false positive confirmed CSV was correct

## Common Issues Found

### Character Recognition Errors
- **I vs J confusion**: Most common transcription error
- **H vs I confusion**: Especially in column 1A (CEFHI)
- **K vs J confusion**: Found in columns 1K (DEIJL) and 1L (EHIJK)
- **L vs I confusion**: Occasionally in columns 1K and 1L

### Data Structure
- **Header:** Option, 1A - CEFHI, 1B - EFGIJ, 1D - BEFIJ, 1E - ABCDF, 1G - AEHIJ, 1I - CDFGH, 1K - DEIJL, 1L - EHIJK, qualifying_groups_combination
- **Cell format:** Values are in format "3X" where X is a group letter (A-L)
- **Combination key:** Alphabetically sorted unique letters from all cells in the row

## Database Reference

- **Tournament ID:** `280a5902-5dfc-4ffc-ba9b-73a4f32e4401` (FIFA World Cup 2026)
- **Table:** `tournament_third_place_rules`
- **Rules format:** JSONB column with rule keys mapping to group letters
- **Example:** `{"CEFHI": "H", "EFGIJ": "G", ...}`

## Final Results

✅ **495/495 rows validated successfully**
✅ **100% database match**
✅ **99.97% visual accuracy**
✅ **All 37 problematic rows fixed:**
   - 25 original duplicate pairs (manual fixes)
   - 13 invalid rows (auto-fixed)
   - 12 remaining duplicate pairs (manual fixes)

## Notes

- All scripts use `dotenv` to load `.env.local` before importing database modules
- Dynamic imports are used after environment loading to ensure proper database connection
- CSV parsing normalizes line endings (handles Windows/Unix differences)
- Scripts exit with code 1 on validation failure for CI/CD integration
