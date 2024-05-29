'use client'
import {useContext, useState} from "react";
import {GuessesContext} from "../context-providers/guesses-context-provider";
import {LoadingButton} from "@mui/lab";
import {Alert, Hidden, Snackbar} from "@mui/material";
import {useTheme} from "@mui/system";
import {updateOrCreateGameGuesses} from "../../actions/game-guesses-action";

export default function SaveComponent() {
  const {gameGuesses} = useContext(GuessesContext)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const savePredictions = async () => {
    setSaving(true);
    const updatedGameGuesses = await updateOrCreateGameGuesses(Object.values(gameGuesses))
    setSaving(false);
    setSaved(true);
  }

  return (
    <>
      <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions}
                     sx={{ marginTop: '16px', display: { xs: 'none', md: 'block'} }}>Guardar Pronostico</LoadingButton>
      <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions}
                     sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)',
                       display: { xs: 'block', md: 'none'} }}>Guardar Pronostico</LoadingButton>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </>
  )
}
