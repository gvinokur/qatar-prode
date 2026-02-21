# Translation Prompt Templates

This document provides reusable LLM prompts for translating content in the Qatar Prode application between Spanish and English.

## Project Context

**Application:** Prode - Football Cups Pick'em
**Domain:** Sports prediction platform for tournament games
**Target Audience:** Spanish and English-speaking football/soccer fans
**Key Features:** Score predictions, friend groups, leaderboards, tournaments (World Cup, Copa América, Euro)

**Brand Name Decision:** "Prode" remains untranslated as a brand name. In English contexts, use full branding: **"Prode - Football Cups Pick'em"**

---

## Template 1: Spanish → English Translation

Use this prompt when translating Spanish JSON translation files to English.

```
You are translating Spanish content to English for "Prode - Football Cups Pick'em", a sports prediction platform.

**Context:**
- Platform name: "Prode" (keep as-is, it's the brand name)
- Tagline in English: "Football Cups Pick'em"
- Users predict exact scores of tournament games (World Cup, Copa América, Euro)
- Social features: friend groups, leaderboards, invitations
- Audience: English-speaking football/soccer fans (American and international)

**Terminology Guidelines:**
- "Prode" → Keep as "Prode" (brand name, like "Uber" or "Spotify")
- Use "Football" (not "Soccer") in brand tagline for international appeal
- Use American sports terminology when appropriate:
  - "Pick'em" (not "Prode game")
  - "Match" or "Game" (be consistent, prefer "Match" for international football)
  - "Tournament" (for Copa América, World Cup, Euro)
  - "Standings" or "Leaderboard" (prefer "Standings" for tournament context)
- Keep proper nouns untranslated: team names, tournament names
- Keep emoji as-is

**Style Guidelines:**
- Tone: Casual, friendly, enthusiastic (NOT formal)
- Sports content: Maintain excitement ("Great prediction!", "You're on fire!")
- UI text: Concise (button text has space limits - aim for <15 characters when possible)
- Form errors: Clear and helpful (explain what went wrong, how to fix)
- Help content: Conversational but informative

**Technical Constraints (CRITICAL):**
1. **Preserve JSON structure exactly** - Same keys, same hierarchy
2. **Keep interpolation variables intact:** `{variable}` must remain exactly as-is
   - Examples: `{groupName}`, `{count}`, `{playerName}`, `{score}`, `{team}`, `{time}`
   - Do NOT translate variable names or remove braces
3. **Preserve HTML tags** in rich text (if any)
4. **Do NOT translate:**
   - Brand name "Prode"
   - Proper nouns (team names, player names, tournament names)
   - Emoji
   - URLs or email addresses

**Examples:**

Spanish: `"Invitar amigos a {groupName}"`
English: `"Invite friends to {groupName}"`
❌ WRONG: `"Invite friends to {nombreGrupo}"` (variable name changed)
❌ WRONG: `"Invite friends to groupName"` (braces removed)

Spanish: `"¡Bienvenido a Prode! Predice los resultados."`
English: `"Welcome to Prode! Predict the scores."`
✅ CORRECT: "Prode" kept as brand name

Spanish: `"Grande! Vas primero en la tabla 👑"`
English: `"Amazing! You're first on the leaderboard 👑"`
✅ CORRECT: Casual tone, emoji preserved

Spanish: `"Guardar"` (button text)
English: `"Save"`
✅ CORRECT: Concise, fits button

**Process:**
1. Read the Spanish JSON content I provide
2. Translate each string value to natural, conversational English
3. Maintain JSON structure exactly
4. Verify all `{variables}` are preserved with same names
5. Ensure tone is casual and friendly throughout
6. Output the complete translated JSON

**Ready for Spanish content to translate.**
```

---

## Template 2: English → Spanish Translation

Use this prompt when translating English JSON translation files to Spanish.

```
You are translating English content to Spanish for "Prode - Football Cups Pick'em" (Spanish branding: just "Prode"), a sports prediction platform.

**Context:**
- Platform name: "Prode" (Argentine slang for sports prediction game - keep as-is)
- Users predict exact scores of tournament games (World Cup, Copa América, Euro)
- Social features: friend groups, leaderboards, invitations
- Audience: Spanish-speaking football/soccer fans (primarily Latin American)

**Terminology Guidelines:**
- "Prode" → Keep as "Prode" (already Spanish, authentic term)
- "Pick'em" → "Pronósticos" or "Predicciones" (context-dependent)
- "Match" → "Partido"
- "Game" → "Partido" or "Juego" (prefer "Partido" for football context)
- "Tournament" → "Torneo"
- "Standings" → "Tabla de posiciones" or "Clasificación"
- "Leaderboard" → "Tabla de posiciones" or "Ranking"
- "Group" (friends) → "Grupo"
- "Prediction" → "Pronóstico" or "Predicción" (both acceptable, be consistent)
- Keep proper nouns in original language: team names, tournament names
- Keep emoji as-is

**Style Guidelines:**
- Tone: Casual, friendly, enthusiastic (NOT formal)
- Use Latin American Spanish (not Spain Spanish):
  - Use "ustedes" (not "vosotros")
  - Use "tú" for informal (not "vos" unless already established in codebase)
- Sports content: Maintain excitement and celebration ("¡Excelente!", "¡Qué crack!")
- UI text: Concise (button text has space limits)
- Form errors: Clear and helpful (explain the problem, how to fix)
- Help content: Conversational but informative

**Technical Constraints (CRITICAL):**
1. **Preserve JSON structure exactly** - Same keys, same hierarchy
2. **Keep interpolation variables intact:** `{variable}` must remain exactly as-is
   - Examples: `{groupName}`, `{count}`, `{playerName}`, `{score}`, `{team}`, `{time}`
   - Do NOT translate variable names or remove braces
3. **Preserve HTML tags** in rich text (if any)
4. **Do NOT translate:**
   - Brand name "Prode"
   - Proper nouns (team names, player names, tournament names)
   - Emoji
   - URLs or email addresses

**Examples:**

English: `"Invite friends to {groupName}"`
Spanish: `"Invitar amigos a {groupName}"`
❌ WRONG: `"Invitar amigos a {nombreGrupo}"` (variable name changed)
❌ WRONG: `"Invitar amigos a groupName"` (braces removed)

English: `"Welcome to Prode! Predict the match scores."`
Spanish: `"¡Bienvenido a Prode! Predice los resultados de los partidos."`
✅ CORRECT: "Prode" kept as brand name, natural Spanish phrasing

English: `"Amazing! You're first on the leaderboard 👑"`
Spanish: `"¡Increíble! Vas primero en la tabla 👑"`
✅ CORRECT: Casual tone, emoji preserved, Latin American Spanish

English: `"Save"` (button text)
Spanish: `"Guardar"`
✅ CORRECT: Concise, standard term

**Process:**
1. Read the English JSON content I provide
2. Translate each string value to natural, conversational Spanish (Latin American)
3. Maintain JSON structure exactly
4. Verify all `{variables}` are preserved with same names
5. Ensure tone is casual and friendly throughout
6. Output the complete translated JSON

**Ready for English content to translate.**
```

---

## Usage Instructions

### For New Translation Keys

**When adding new content:**

1. **Add Spanish first** (Spanish is the source language):
   ```json
   // locales/es/namespace.json
   {
     "newFeature": {
       "title": "Nueva Funcionalidad",
       "description": "Descripción de la función"
     }
   }
   ```

2. **Use Template 1 (ES→EN) to translate to English:**
   - Copy Template 1 prompt to LLM (Claude, GPT-4)
   - Provide the Spanish JSON
   - Review output for tone, interpolation, "Prode" usage
   - Save to English file

3. **Verify with validation script:**
   ```bash
   ./scripts/validate-translations.sh
   ```

### For Reverse Translation (EN→ES)

If you have English content that needs Spanish translation:

1. **Use Template 2 (EN→ES)**:
   - Copy Template 2 prompt to LLM
   - Provide the English JSON
   - Review output for tone, interpolation
   - Save to Spanish file

2. **Verify with validation script**

### Quality Checklist

After translation, verify:
- [ ] "Prode" kept as brand name (not translated)
- [ ] All `{variables}` preserved with exact same names
- [ ] JSON structure matches source file
- [ ] Tone is casual and friendly (not formal)
- [ ] Button text is concise (<15 chars ideally)
- [ ] Error messages are clear and helpful
- [ ] Emoji preserved
- [ ] Sports terminology consistent with glossary

---

## Common Pitfalls to Avoid

### ❌ WRONG: Translating variable names
```json
// Spanish
"invite": "Invitar a {groupName}"

// ❌ WRONG English
"invite": "Invite {nombreGrupo}"

// ✅ CORRECT English
"invite": "Invite {groupName}"
```

### ❌ WRONG: Removing interpolation braces
```json
// Spanish
"members": "{count} miembros"

// ❌ WRONG English
"members": "count members"

// ✅ CORRECT English
"members": "{count} members"
```

### ❌ WRONG: Translating brand name
```json
// Spanish
"welcome": "Bienvenido a Prode"

// ❌ WRONG English
"welcome": "Welcome to Prediction"

// ✅ CORRECT English
"welcome": "Welcome to Prode"
```

### ❌ WRONG: Overly formal tone
```json
// Spanish
"error": "No pudimos guardar tus cambios"

// ❌ WRONG English (too formal)
"error": "The system was unable to persist your modifications"

// ✅ CORRECT English (casual, friendly)
"error": "Couldn't save your changes"
```

### ❌ WRONG: Verbose button text
```json
// Spanish
"save": "Guardar"

// ❌ WRONG English (too long for button)
"save": "Save Changes Now"

// ✅ CORRECT English (concise)
"save": "Save"
```

---

## See Also

- **Translation Glossary:** `/docs/translation-glossary.md` - Sports and platform terminology reference
- **Validation Script:** `/scripts/validate-translations.sh` - Automated validation
- **i18n Guide:** `/docs/i18n-guide.md` - Complete internationalization documentation

---

**Last Updated:** 2026-02-21
**Decision:** "Prode" remains untranslated as brand name; English tagline: "Football Cups Pick'em"
