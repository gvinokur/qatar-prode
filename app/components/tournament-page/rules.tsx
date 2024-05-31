'use client'

import {
  Card,
  CardContent,
  CardHeader,
  Collapse, IconButton,
  IconButtonProps,
  List,
  ListItem,
  ListItemText, styled,
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
  '1 Punto por tercer puesto',
  '3 Puntos por cada premio acertado (mejor jugador, arquero, goleador, etc...)',
  '(*) Se permite cambiar los pronosticos de cada partido hasta el dia anterior al mismo',
  '(**) No se permite modificar pronosticos de podio y premios individuales luego del comienzo del campeonato'
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
        </CardContent>
      </Collapse>
    </Card>
  )
}
