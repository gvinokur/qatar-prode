'use client'

import {
  Card,
  CardContent,
  CardHeader,
  Collapse, IconButton,
  IconButtonProps,
  List,
  ListItem,
  ListItemText, styled, Typography,
  useTheme, Button, CardActions, Box
} from "@mui/material";
import {ExpandMore as ExpandMoreIcon} from "@mui/icons-material";
import {useState} from "react";
import Link from 'next/link';
import WinnerDrawExample from './rules-examples/winner-draw';
import ExactScoreExample from './rules-examples/exact-score';
import RoundOf16Example from './rules-examples/round-of-16';
import ChampionExample from './rules-examples/champion';
import RunnerUpExample from './rules-examples/runner-up';
import ThirdPlaceExample from './rules-examples/third-place';
import IndividualAwardsExample from './rules-examples/individual-awards';

interface Rule {
  label: string;
  component?: React.ReactNode;
}

const rules: Rule[] = [
  { 
    label: '1 Punto por Ganador/Empate acertado',
    component: <WinnerDrawExample />
  },
  { 
    label: '1 punto extra por resultado exacto',
    component: <ExactScoreExample />
  },
  { 
    label: '1 Punto por cada  clasificado a 8vos acertado',
    component: <RoundOf16Example />
  },
  { 
    label: '5 Puntos por campeon',
    component: <ChampionExample />
  },
  { 
    label: '3 Puntos por subcampeon',
    component: <RunnerUpExample />
  },
  { 
    label: '1 Punto por tercer puesto, si es que el torneo tiene partido por el mismo',
    component: <ThirdPlaceExample />
  },
  { 
    label: '3 Puntos por cada premio acertado (mejor jugador, arquero, goleador, etc...)',
    component: <IndividualAwardsExample />
  },
]

const constraints = [
  'Se permite cambiar los pronosticos de cada partido hasta una hora antes del mismo',
  'Se permite modificar pronosticos de podio y premios individuales luego hasta 2 dias despues del comienzo del torneo',
  'No se permite mas de un pronostico por persona, pero el mismo se puede utilizar en multiples grupos'
]

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

export default function Rules({ expanded: defaultExpanded = true, fullpage = false }: { expanded?: boolean, fullpage?: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [expandedRules, setExpandedRules] = useState<number[]>([]);

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

  return (
    <Card sx={{ maxWidth: fullpage ? '800px' : '100%', mx: fullpage ? 'auto' : 0 }}>
      <CardHeader
        title='Reglas Generales'
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
                  <ListItemText>{rule.label}</ListItemText>
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
                key={index}
                alignItems='flex-start'
                disableGutters>
                <ListItemText>{constraint}</ListItemText>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Collapse>
      {!fullpage && (
        <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
          <Button
            component={Link}
            href="/rules"
            variant="text"
            color="primary"
          >
            Ver reglas completas y ejemplos
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
