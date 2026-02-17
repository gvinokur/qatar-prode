'use client'

import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  List,
  ListItem,
  ListItemText, Typography,
  useTheme, Button, CardActions, Box, Tooltip
} from "@mui/material";
import {ExpandMore as ExpandMoreIcon, Gavel as GavelIcon} from "@mui/icons-material";
import {ExpandMore} from './expand-more';
import {useState} from "react";
import Link from 'next/link';
import { useLocale } from 'next-intl';
import WinnerDrawExample from './rules-examples/winner-draw';
import ExactScoreExample from './rules-examples/exact-score';
import RoundOf16Example from './rules-examples/round-of-16';
import ChampionExample from './rules-examples/champion';
import RunnerUpExample from './rules-examples/runner-up';
import ThirdPlaceExample from './rules-examples/third-place';
import IndividualAwardsExample from './rules-examples/individual-awards';
import MatchPredictionTimeExample from './rules-examples/match-prediction-time';
import PodiumPredictionTimeExample from './rules-examples/podium-prediction-time';
import SinglePredictionExample from './rules-examples/single-prediction';
import GroupPositionExample from './rules-examples/group-position';

interface Rule {
  label: string;
  component?: React.ReactNode;
}

export interface ScoringConfig {
  game_exact_score_points: number;
  game_correct_outcome_points: number;
  champion_points: number;
  runner_up_points: number;
  third_place_points: number;
  individual_award_points: number;
  qualified_team_points: number;
  exact_position_qualified_points: number;
  max_silver_games: number;
  max_golden_games: number;
}

// Default scoring config for display when no tournament-specific config is provided
const DEFAULT_SCORING: ScoringConfig = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
  max_silver_games: 0,
  max_golden_games: 0,
};

function getRules(config: ScoringConfig): Rule[] {
  const exactScoreBonus = config.game_exact_score_points - config.game_correct_outcome_points;

  const baseRules: Rule[] = [
    {
      label: `${config.game_correct_outcome_points} ${config.game_correct_outcome_points === 1 ? 'Punto' : 'Puntos'} por Ganador/Empate acertado`,
      component: <WinnerDrawExample />
    },
    {
      label: `${exactScoreBonus} ${exactScoreBonus === 1 ? 'punto' : 'puntos'} extra por resultado exacto (total: ${config.game_exact_score_points} ${config.game_exact_score_points === 1 ? 'punto' : 'puntos'})`,
      component: <ExactScoreExample />
    },
    {
      label: `${config.qualified_team_points} ${config.qualified_team_points === 1 ? 'Punto' : 'Puntos'} por cada equipo clasificado acertado`,
      component: <RoundOf16Example />
    },
    {
      label: `${config.exact_position_qualified_points} ${config.exact_position_qualified_points === 1 ? 'Punto' : 'Puntos'} adicional${config.exact_position_qualified_points === 1 ? '' : 'es'} por posición exacta en la fase de grupos (total: ${config.qualified_team_points + config.exact_position_qualified_points} puntos por equipo clasificado en posición exacta)`,
      component: <GroupPositionExample />
    },
    {
      label: `${config.champion_points} ${config.champion_points === 1 ? 'Punto' : 'Puntos'} por campeon`,
      component: <ChampionExample />
    },
    {
      label: `${config.runner_up_points} ${config.runner_up_points === 1 ? 'Punto' : 'Puntos'} por subcampeon`,
      component: <RunnerUpExample />
    },
    {
      label: `${config.third_place_points} ${config.third_place_points === 1 ? 'Punto' : 'Puntos'} por tercer puesto, si es que el torneo tiene partido por el mismo`,
      component: <ThirdPlaceExample />
    },
    {
      label: `${config.individual_award_points} ${config.individual_award_points === 1 ? 'Punto' : 'Puntos'} por cada premio acertado (mejor jugador, arquero, goleador, etc...)`,
      component: <IndividualAwardsExample />
    },
  ];

  // Add boost rules only if boosts are enabled
  if (config.max_silver_games > 0 || config.max_golden_games > 0) {
    const boostRules: Rule[] = [];

    if (config.max_silver_games > 0) {
      boostRules.push({
        label: `Boost Plateado: Puedes seleccionar hasta ${config.max_silver_games} ${config.max_silver_games === 1 ? 'partido' : 'partidos'} que valdrán el doble de puntos (2x)`,
      });
    }

    if (config.max_golden_games > 0) {
      boostRules.push({
        label: `Boost Dorado: Puedes seleccionar hasta ${config.max_golden_games} ${config.max_golden_games === 1 ? 'partido' : 'partidos'} que valdrán el triple de puntos (3x)`,
      });
    }

    boostRules.push({
      label: 'Los boosts solo pueden aplicarse antes de que comience el partido',
    });

    return [...baseRules, ...boostRules];
  }

  return baseRules;
}

const constraints: Rule[] = [
  {
    label: 'Se permite cambiar los pronosticos de cada partido hasta una hora antes del mismo',
    component: <MatchPredictionTimeExample />
  },
  {
    label: 'Se permite modificar pronosticos de podio y premios individuales luego hasta 2 dias despues del comienzo del torneo',
    component: <PodiumPredictionTimeExample />
  },
  {
    label: 'No se permite mas de un pronostico por persona, pero el mismo se puede utilizar en multiples grupos',
    component: <SinglePredictionExample />
  }
]

interface RulesProps {
  readonly expanded?: boolean;
  readonly fullpage?: boolean;
  readonly scoringConfig?: ScoringConfig;
  readonly tournamentId?: string;
  readonly isActive?: boolean;
}

export default function Rules({ expanded: defaultExpanded = true, fullpage = false, scoringConfig, tournamentId, isActive = false }: RulesProps) {
  const locale = useLocale();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [expandedRules, setExpandedRules] = useState<number[]>([]);
  const [expandedConstraints, setExpandedConstraints] = useState<number[]>([]);

  // Use provided config or defaults
  const config = scoringConfig || DEFAULT_SCORING;
  const rules = getRules(config);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  }

  const handleRuleExpand = (index: number) => {
    setExpandedRules(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }

  const handleConstraintExpand = (index: number) => {
    setExpandedConstraints(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }

  return (
    <Card sx={{
      maxWidth: fullpage ? '800px' : '100%',
      mx: fullpage ? 'auto' : 0,
      ...(isActive && {
        borderLeft: 3,
        borderColor: 'primary.main',
        backgroundColor: 'action.selected',
      })
    }}>
      <CardHeader
        title='Reglas Generales'
        subheader={isActive ? 'Estás aquí' : undefined}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`,
          ...(fullpage && { typography: 'h4' })
        }}
        action={
          !fullpage && (
            <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          )
        }
      />
      <Collapse in={fullpage ? true : expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ borderBottom: `${theme.palette.primary.contrastText} 1px solid`, borderTop: `${theme.palette.primary.contrastText} 1px solid` }}>
          <Typography variant={'h6'}>
            Calculo de puntos
          </Typography>
          <List disablePadding>
            {rules.map((rule, index) => (
              <ListItem
                key={index}
                alignItems='flex-start'
                disableGutters
                sx={{ flexDirection: 'column' }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  alignItems: 'center',
                  ...(fullpage && rule.component && { cursor: 'pointer' })
                }}
                onClick={() => fullpage && rule.component && handleRuleExpand(index)}
                >
                  {!fullpage && rule.component ? (
                    <Tooltip 
                      title={rule.component} 
                      placement="bottom"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            border: '1px solid',
                            borderColor: 'divider',
                            maxWidth: 400,
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&:before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              }
                            }
                          }
                        }
                      }}
                    >
                      <ListItemText>{rule.label}</ListItemText>
                    </Tooltip>
                  ) : (
                    <ListItemText>{rule.label}</ListItemText>
                  )}
                  {fullpage && rule.component && (
                    <ExpandMore
                      expand={expandedRules.includes(index)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRuleExpand(index);
                      }}
                      aria-expanded={expandedRules.includes(index)}
                      aria-label="show more"
                    >
                      <ExpandMoreIcon />
                    </ExpandMore>
                  )}
                </Box>
                {fullpage && rule.component && (
                  <Collapse in={expandedRules.includes(index)} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 2, pr: 1, py: 1 }}>
                      {rule.component}
                    </Box>
                  </Collapse>
                )}
              </ListItem>
            ))}
          </List>
          <Typography variant={'h6'}>
            Condiciones generales
          </Typography>
          <List disablePadding>
            {constraints.map((constraint, index) => (
              <ListItem
                key={constraint.label}
                alignItems='flex-start'
                disableGutters
                sx={{ flexDirection: 'column' }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  alignItems: 'center',
                  ...(fullpage && constraint.component && { cursor: 'pointer' })
                }}
                onClick={() => fullpage && constraint.component && handleConstraintExpand(index)}
                >
                  {!fullpage && constraint.component ? (
                    <Tooltip 
                      title={constraint.component} 
                      placement="bottom"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            border: '1px solid',
                            borderColor: 'divider',
                            maxWidth: 400,
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&:before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              }
                            }
                          }
                        }
                      }}
                    >
                      <ListItemText>{constraint.label}</ListItemText>
                    </Tooltip>
                  ) : (
                    <ListItemText>{constraint.label}</ListItemText>
                  )}
                  {fullpage && constraint.component && (
                    <ExpandMore
                      expand={expandedConstraints.includes(index)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConstraintExpand(index);
                      }}
                      aria-expanded={expandedConstraints.includes(index)}
                      aria-label="show more"
                    >
                      <ExpandMoreIcon />
                    </ExpandMore>
                  )}
                </Box>
                {fullpage && constraint.component && (
                  <Collapse in={expandedConstraints.includes(index)} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 2, pr: 1, py: 1 }}>
                      {constraint.component}
                    </Box>
                  </Collapse>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Collapse>
      {!fullpage && (
        <CardActions sx={{ justifyContent: 'center', px: 2, py: 1.5 }}>
          <Button
            component={Link}
            href={tournamentId ? `/${locale}/tournaments/${tournamentId}/rules` : `/${locale}/rules`}
            startIcon={<GavelIcon />}
            variant="text"
            color="primary"
          >
            Ver Reglas Completas
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
