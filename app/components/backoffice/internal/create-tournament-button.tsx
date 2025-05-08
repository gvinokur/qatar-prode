'use client'

import { useState } from "react";
import {Box, Button} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CreateTournamentModal from "./create-tournament-modal";
import { useRouter } from "next/navigation";

export default function CreateTournamentButton() {
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSuccess = () => {
    // Refresh the page to show the new tournament
    router.refresh();
  };

  return (
    <Box sx={{ mx: 2, my: 1 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleOpenModal}
      >
        Create New Tournament
      </Button>

      <CreateTournamentModal
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}
