import { Box, Typography } from "@mui/material";

export default function GroupPositionExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Ejemplo: Si predijiste que Argentina terminaría en 1er lugar del Grupo A y efectivamente termina 1ro, obtienes 1 punto. Si predijiste que Argentina terminaría en 2do lugar del Grupo A y efectivamente termina 3ro, no obtienes ningun punto. 
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Este puntaje suma incluso para los equipos que no clasifican a los playoffs.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Este puntaje se calcula unicamente cuanto todos los partidos del grupo se han jugado.
        Para sumar debes haber completado todos los pronosticos de partidos del grupo.
      </Typography>
    </Box>
  );
} 