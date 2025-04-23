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
  useTheme
} from "@mui/material";
import {ExpandMore as ExpandMoreIcon} from "@mui/icons-material";
import {useState} from "react";

const rules = [
  '1 Punto por Ganador/Empate acertado',
  '1 punto extra por resultado exacto',
  '1 Punto por cada  clasificado a 8vos acertado',
  '5 Puntos por campeon',
  '3 Puntos por subcampeon',
  '1 Punto por tercer puesto, si es que el torneo tiene partido por el mismo',
  '3 Puntos por cada premio acertado (mejor jugador, arquero, goleador, etc...)',
]

const constraints = [
  'Se permite cambiar los pronosticos de cada partido hasta una hora antes del mismo',
  'Se permite modificar pronosticos de podio y premios individuales luego hasta el comienzo del campeonato',
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

export default function Rules() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true)

  const handleExpandClick = () => {
    setExpanded(!expanded);
  }

  return (
    <Card>
      <CardHeader
        title='Reglas Generales'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
        action={
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        }
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ borderBottom: `${theme.palette.primary.contrastText} 1px solid`, borderTop: `${theme.palette.primary.contrastText} 1px solid` }}>
          <Typography variant={'h6'}>
            Calculo de puntos
          </Typography>
          <List disablePadding>
            {rules.map((rule, index) => (
              <ListItem
                key={index}
                alignItems='flex-start'
                disableGutters>
                <ListItemText>{rule}</ListItemText>
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
    </Card>
  )
}
