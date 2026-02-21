# Translation Glossary

Comprehensive bilingual (Spanish ↔ English) terminology reference for translating content in the Prode - Football Cups Pick'em application.

## Core Platform Terms

### Brand & Product

| Spanish | English | Usage Notes |
|---------|---------|-------------|
| **Prode** | **Prode** | ✅ **KEEP UNTRANSLATED** - Brand name (like "Uber", "Spotify") |
| La Maquina Prode | La Maquina Prode | Specific brand variant - keep as-is |
| Prode Mundial | World Cup Prode | Optional: Can add context in English |
| - | Football Cups Pick'em | English tagline/descriptor for "Prode" |

### Core Features

| Spanish | English | Context |
|---------|---------|---------|
| Pronóstico | Prediction | Main feature - predicting scores |
| Predicción | Prediction | Synonym for "pronóstico" - both acceptable |
| Pronósticos | Predictions / Pick'em | Plural; "Pick'em" more colloquial |
| Puntos | Points | Scoring system |
| Puntaje | Score | Total points earned |
| Tabla de posiciones | Standings | Tournament context (preferred) |
| Tabla | Table / Standings | Short form |
| Clasificación | Standings / Rankings | Alternative to "tabla" |
| Ranking | Leaderboard / Rankings | Friend group competition |

**Usage Examples:**
```json
// Spanish
"makeYourPrediction": "Haz tu pronóstico"

// English
"makeYourPrediction": "Make your prediction"
```

```json
// Spanish
"viewStandings": "Ver tabla de posiciones"

// English
"viewStandings": "View standings"
```

---

## Sports Terminology

### Game Elements

| Spanish | English | Context |
|---------|---------|---------|
| Partido | Match | ✅ Preferred for international football |
| Juego | Game | Alternative, less formal |
| Resultado | Result / Score | Final outcome |
| Marcador | Score | Current/final score |
| Gol | Goal | Scored goal |
| Goles | Goals | Plural |
| Empate | Draw / Tie | Match ends with same score |
| Victoria | Win | Winning outcome |
| Derrota | Loss | Losing outcome |

**Preference:** Use "Match" (not "Game") for football/soccer to maintain international appeal.

### Tournament Structure

| Spanish | English | Context |
|---------|---------|---------|
| Torneo | Tournament | World Cup, Copa América, Euro |
| Copa | Cup | "Copa América" = "Copa América" (keep Spanish) |
| Campeonato | Championship | Alternative to "torneo" |
| Fase de grupos | Group Stage | Tournament phase |
| Grupos | Groups | Teams divided into groups |
| Octavos de final | Round of 16 | Knockout stage |
| Cuartos de final | Quarterfinals | Knockout stage |
| Semifinal | Semifinal | Knockout stage |
| Final | Final | Championship match |
| Tercer puesto | Third Place | Third place match |
| Eliminatorias | Playoffs / Knockout Stage | Post-group stage |
| Eliminación directa | Knockout / Single Elimination | One loss = eliminated |
| Llave | Bracket | Tournament bracket visualization |

**Usage Examples:**
```json
// Spanish
"groupStage": "Fase de grupos"

// English
"groupStage": "Group Stage"
```

```json
// Spanish
"knockoutStage": "Eliminatorias"

// English
"knockoutStage": "Knockout Stage"
```

### Teams & Players

| Spanish | English | Context |
|---------|---------|---------|
| Equipo | Team | Football team |
| Selección | National Team | Country's team |
| Jugador | Player | Individual player |
| Plantel | Squad / Roster | Full team roster |
| Capitán | Captain | Team captain |
| Entrenador / DT | Manager / Coach | Team manager (UK: Manager, US: Coach) |
| Arquero / Portero | Goalkeeper | Position |
| Defensor | Defender | Position |
| Mediocampista | Midfielder | Position |
| Delantero | Forward / Striker | Position |

**Note:** Team names and player names should NEVER be translated (proper nouns).

---

## Social Features

### Groups & Friends

| Spanish | English | Context |
|---------|---------|---------|
| Grupo | Group | Friend group for competition |
| Grupo de amigos | Friend Group | More specific |
| Amigos | Friends | Social connections |
| Miembro | Member | Group member |
| Miembros | Members | Plural |
| Administrador | Admin / Administrator | Group admin |
| Invitación | Invitation | Invite to group |
| Invitar | Invite | Action |
| Unirse | Join | Join a group |
| Crear grupo | Create Group | Action |
| Salir del grupo | Leave Group | Action |
| Código de invitación | Invite Code | Code to join group |
| Enlace de invitación | Invite Link | Link to join group |

**Usage Examples:**
```json
// Spanish
"inviteToGroup": "Invitar amigos a {groupName}"

// English
"inviteToGroup": "Invite friends to {groupName}"
```

```json
// Spanish
"membersCount": "{count} miembros"

// English
"membersCount": "{count} members"
```

### Competition & Rankings

| Spanish | English | Context |
|---------|---------|---------|
| Ranking | Leaderboard / Rankings | Friend group rankings |
| Posición | Position / Rank | Your placement |
| Primero | First | Top position |
| Último | Last | Bottom position |
| Líder | Leader | Person in first place |
| Competencia | Competition | Social competition |

---

## UI & UX Terms

### Actions & Buttons

| Spanish | English | Context |
|---------|---------|---------|
| Guardar | Save | Save changes |
| Cancelar | Cancel | Cancel action |
| Confirmar | Confirm | Confirm action |
| Editar | Edit | Edit content |
| Eliminar | Delete | Delete content |
| Borrar | Delete / Clear | Alternative to "eliminar" |
| Cerrar | Close | Close dialog/window |
| Crear | Create | Create new item |
| Agregar | Add | Add item |
| Enviar | Send / Submit | Submit form |
| Copiar | Copy | Copy text |
| Compartir | Share | Share content |
| Ver | View / See | View content |
| Buscar | Search | Search action |
| Filtrar | Filter | Filter results |
| Ordenar | Sort | Sort list |
| Actualizar | Update / Refresh | Update/refresh data |
| Cargar | Load | Load data |
| Descargar | Download | Download file |
| Subir | Upload | Upload file |
| Continuar | Continue | Proceed to next step |
| Volver | Back / Return | Go back |
| Inicio | Home | Home page |
| Salir | Log Out / Exit | Leave app/session |

**Note:** Keep button text concise (< 15 characters when possible).

### Navigation

| Spanish | English | Context |
|---------|---------|---------|
| Menú | Menu | Navigation menu |
| Inicio | Home | Home page |
| Perfil | Profile | User profile |
| Configuración | Settings | App settings |
| Ayuda | Help | Help section |
| Acerca de | About | About page |
| Términos | Terms | Terms of service |
| Privacidad | Privacy | Privacy policy |
| Notificaciones | Notifications | User notifications |

### Form Fields & Validation

| Spanish | English | Context |
|---------|---------|---------|
| Nombre | Name | Name field |
| Email / Correo | Email | Email field |
| Contraseña | Password | Password field |
| Usuario | Username | Username field |
| Apodo / Nickname | Nickname | Display name |
| Requerido | Required | Required field |
| Opcional | Optional | Optional field |
| Inválido | Invalid | Invalid input |
| Campo vacío | Empty field | Empty input error |

### States & Messages

| Spanish | English | Context |
|---------|---------|---------|
| Cargando | Loading | Loading state |
| Guardando | Saving | Saving state |
| Enviando | Sending | Sending state |
| Procesando | Processing | Processing state |
| Éxito | Success | Success message |
| Error | Error | Error state |
| Advertencia | Warning | Warning message |
| Información | Info / Information | Info message |
| Vacío | Empty | Empty state |
| Sin resultados | No results | No search results |

---

## Error Messages

### Common Errors

| Spanish | English | Notes |
|---------|---------|-------|
| Ocurrió un error | An error occurred | Generic error |
| No se pudo guardar | Couldn't save | Save failed |
| No se pudo cargar | Couldn't load | Load failed |
| Por favor, intenta de nuevo | Please try again | Retry prompt |
| Campo requerido | This field is required | Validation |
| Email inválido | Invalid email | Validation |
| Contraseña incorrecta | Incorrect password | Auth error |
| Usuario no encontrado | User not found | Auth error |
| Sin conexión | No connection | Network error |
| Sesión expirada | Session expired | Auth timeout |

**Tone:** Errors should be clear, helpful, and not overly technical.

---

## Time & Dates

### Relative Time

| Spanish | English | Context |
|---------|---------|---------|
| Hace un momento | Just now | Very recent |
| Hace {n} minutos | {n} minutes ago | Recent |
| Hace {n} horas | {n} hours ago | Hours |
| Hace {n} días | {n} days ago | Days |
| Ayer | Yesterday | Yesterday |
| Hoy | Today | Today |
| Mañana | Tomorrow | Tomorrow |
| Próximamente | Coming soon | Future |

### Match Timing

| Spanish | English | Context |
|---------|---------|---------|
| En vivo | Live | Match in progress |
| Finalizado | Finished / Final | Match ended |
| Por comenzar | Starting soon | Match hasn't started |
| Próximo partido | Next match | Upcoming |
| Partido anterior | Previous match | Past match |

---

## Tone & Style Guidelines

### Casual vs. Formal

**✅ DO: Use casual, friendly tone**
- Spanish: "¡Excelente! Vas primero 👑"
- English: "Amazing! You're first 👑"

**❌ DON'T: Use formal, corporate tone**
- Spanish: "Felicitaciones por su desempeño superior"
- English: "Congratulations on your superior performance"

### Button Text

**✅ DO: Keep concise**
- Spanish: "Guardar"
- English: "Save"

**❌ DON'T: Make verbose**
- Spanish: "Guardar cambios ahora"
- English: "Save changes now"

### Error Messages

**✅ DO: Be helpful and clear**
- Spanish: "No pudimos guardar tus cambios. Verifica tu conexión."
- English: "Couldn't save your changes. Check your connection."

**❌ DON'T: Use technical jargon**
- Spanish: "Error 500: Fallo del servidor al persistir datos"
- English: "Error 500: Server failed to persist data"

---

## Regional Variations

### Latin American Spanish (Preferred)

- Use "ustedes" (not "vosotros")
- Use "tú" for informal (not "vos" unless already in codebase)
- "Computadora" (not "ordenador")
- "Celular" (not "móvil")
- "Email" / "Correo" (both acceptable)

### Football vs. Soccer

- **In English branding:** Use "Football Cups Pick'em" for international appeal
- **In general English text:** "Match" works for both audiences
- Avoid "Soccer" in branding (less international)

---

## Special Cases

### Untranslatable Terms

**NEVER translate:**
- ✅ Prode (brand name)
- ✅ La Maquina Prode (brand variant)
- ✅ Team names (Argentina, Brasil, England, etc.)
- ✅ Player names (Lionel Messi, Cristiano Ronaldo, etc.)
- ✅ Tournament names in original language:
  - Copa América (not "America Cup")
  - UEFA Euro (not "European Cup")
  - FIFA World Cup (keep FIFA)
- ✅ Emoji

### Interpolation Variables

**ALWAYS keep variable names in English** (code convention):
- `{groupName}` ← Never `{nombreGrupo}`
- `{count}` ← Never `{cuenta}`
- `{playerName}` ← Never `{nombreJugador}`
- `{score}` ← Never `{puntaje}`

---

## Quick Reference Card

| Category | Spanish | English |
|----------|---------|---------|
| **Brand** | Prode | Prode ✅ |
| **Tagline** | - | Football Cups Pick'em |
| **Main Feature** | Pronósticos | Predictions / Pick'em |
| **Game** | Partido | Match ✅ |
| **Tournament** | Torneo | Tournament |
| **Group Stage** | Fase de grupos | Group Stage |
| **Knockouts** | Eliminatorias | Knockout Stage |
| **Standings** | Tabla de posiciones | Standings |
| **Group** (social) | Grupo | Group |
| **Friends** | Amigos | Friends |
| **Save** | Guardar | Save |
| **Cancel** | Cancelar | Cancel |

---

## See Also

- **Translation Prompt Templates:** `/docs/translation-prompt-template.md`
- **Validation Script:** `/scripts/validate-translations.sh`
- **i18n Guide:** `/docs/i18n-guide.md`

---

**Last Updated:** 2026-02-21
**Maintained by:** Development team
**Terminology Decision:** "Prode" remains untranslated; "Football Cups Pick'em" for English branding
