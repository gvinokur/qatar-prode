'use client';
import React, {useEffect, useState} from 'react';
import {ExtendedGroupData} from "../../../definitions";
import {
  Box,
  FormControl, FormControlLabel,
  FormHelperText, FormLabel,
  InputLabel,
  MenuItem, Radio, RadioGroup,
  Select,
  SelectChangeEvent, Switch,
  TextField
} from "@mui/material";

interface GroupPositionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  groups: ExtendedGroupData[];
  disabled?: boolean;
}

export const GroupPositionSelector: React.FC<GroupPositionSelectorProps> = ({
                                                                       value,
                                                                       onChange,
                                                                       groups,
                                                                       disabled = false
                                                                     }) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [position, setPosition] = useState<number>(1);

  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        setSelectedGroups(parsed.group ? parsed.group.split('/') : []);
        setPosition(parsed.position);
      }
    } catch (e) {
      // If parsing fails, initialize with defaults
      setSelectedGroups([]);
      setPosition(1);
    }
  }, [value]);

  const handleGroupChange = (event: SelectChangeEvent<string[]>) => {
    const newGroups =
      typeof event.target.value !== 'string' && event.target.value || [];
    setSelectedGroups(newGroups);
    updateValue(newGroups, position);
  };

  const handlePositionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(event.target.value);
    setPosition(newPosition);
    updateValue(selectedGroups, newPosition);
  };

  const updateValue = (groups: string[], pos: number) => {
    const newValue = JSON.stringify({
      group: groups.join('/'),
      position: pos
    });
    onChange(newValue);
  };

  return (
    <Box>
      <FormControl fullWidth margin="normal" disabled={disabled}>
        <InputLabel>Group(s)</InputLabel>
        <Select
          multiple
          value={selectedGroups}
          onChange={handleGroupChange}
          renderValue={(selected) => (selected as string[]).join('/')}
          label="Group(s)"
        >
          {groups.map((group) => (
            <MenuItem key={group.group_letter} value={group.group_letter}>
              Group {group.group_letter}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Select one or more groups</FormHelperText>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={disabled}>
        <TextField
          label="Position in Group"
          type="number"
          value={position}
          onChange={handlePositionChange}
          InputProps={{ inputProps: { min: 1, max: 4 } }}
          helperText="Position in the group (1 = Winner, 2 = Runner-up, etc.)"
        />
      </FormControl>
    </Box>
  );
};

interface GameWinnerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  currentGameNumber: number;
  disabled?: boolean;
}

export const GameWinnerSelector: React.FC<GameWinnerSelectorProps> = ({
                                                                 value,
                                                                 onChange,
                                                                 currentGameNumber,
                                                                 disabled = false
                                                               }) => {
  const [gameNumber, setGameNumber] = useState<number>(0);
  const [isWinner, setIsWinner] = useState<boolean>(true);

  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        setGameNumber(parsed.game);
        setIsWinner(parsed.winner);
      }
    } catch (e) {
      // If parsing fails, initialize with defaults
      setGameNumber(0);
      setIsWinner(true);
    }
  }, [value]);

  const handleGameNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGameNumber = parseInt(event.target.value);
    setGameNumber(newGameNumber);
    updateValue(newGameNumber, isWinner);
  };

  const handleWinnerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsWinner = event.target.value === 'winner';
    setIsWinner(newIsWinner);
    updateValue(gameNumber, newIsWinner);
  };

  const updateValue = (game: number, winner: boolean) => {
    const newValue = JSON.stringify({
      game: game,
      winner: winner
    });
    onChange(newValue);
  };

  return (
    <Box>
      <FormControl fullWidth margin="normal" disabled={disabled}>
        <TextField
          label="Game Number"
          type="number"
          value={gameNumber}
          onChange={handleGameNumberChange}
          InputProps={{ inputProps: { min: 1, max: currentGameNumber - 1 } }}
          helperText="Enter the game number to reference"
        />
      </FormControl>

      <FormControl component="fieldset" fullWidth margin="normal" disabled={disabled}>
        <FormLabel component="legend">Select Winner or Loser</FormLabel>
        <RadioGroup
          row
          name="winner-selector"
          value={isWinner ? 'winner' : 'loser'}
          onChange={handleWinnerChange}
        >
          <FormControlLabel value="winner" control={<Radio />} label="Winner" />
          <FormControlLabel value="loser" control={<Radio />} label="Loser" />
        </RadioGroup>
        <FormHelperText>Select whether to use the winner or loser of the selected game</FormHelperText>
      </FormControl>
    </Box>
  );
};
