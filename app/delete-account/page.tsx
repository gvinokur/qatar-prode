'use server'

import {Box} from "@mui/material";
import DeleteAccountButton from "../components/delete-account-button";

export default async function Page() {
  return (
    <Box sx={{
      display: 'flex',
      mt: 8,
      width: '100%',
      alignContent: 'center',
      justifyContent: 'center',
    }}>
      <DeleteAccountButton />
    </Box>
  );
}
