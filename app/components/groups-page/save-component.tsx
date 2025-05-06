'use client'
import {useContext, useState} from "react";
import {GuessesContext} from "../context-providers/guesses-context-provider";
import {Alert, Button, Snackbar} from "@mui/material";
import {
  updateOrCreateGameGuesses,
  updateOrCreateTournamentGroupTeamGuesses,
  updatePlayoffGameGuesses
} from "../../actions/guesses-actions";
import {groupCompleteReducer} from "../../utils/playoff-teams-calculator";
import {useParams} from "next/navigation";


export default function SaveComponent() {
  const {gameGuesses, guessedPositions} = useContext(GuessesContext)
  const {id} = useParams() as { id:string }
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const savePredictions = async () => {
    setSaving(true);
    const updatedGameGuesses = await updateOrCreateGameGuesses(Object.values(gameGuesses))
    if(guessedPositions && guessedPositions.length > 0) {
      await updateOrCreateTournamentGroupTeamGuesses(guessedPositions)
      if(groupCompleteReducer(guessedPositions)) {
        //TODO: this does not handle well the case where the group was complete and some result has been deleted
        await updatePlayoffGameGuesses(id)
      }
    }
    setSaving(false);
    setSaved(true);
  }

  return (
    <>
      <Button loading={saving} variant='contained' size='large' onClick={savePredictions}
                     sx={{ marginTop: '16px', display: { xs: 'none', md: 'block'} }}>Guardar Pronostico</Button>
      <Button loading={saving} variant='contained' size='large' onClick={savePredictions}
                     sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)',
                       display: { xs: 'block', md: 'none'} }}>Guardar Pronostico</Button>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </>
  )
}
