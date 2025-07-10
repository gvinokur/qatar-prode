import React, { useState, forwardRef } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';

// Transition for Dialog
const Transition = forwardRef(function Transition(props: any, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Props type for the component
interface MobileFriendlyAutocompleteProps<T> {
  readonly label: string;
  readonly options: T[];
  readonly groupBy?: (_option: T) => string;
  readonly getOptionLabel: (_option: T) => string;
  readonly value: T | null;
  readonly onChange: (_event: React.SyntheticEvent, _value: T | null) => void;
  readonly disabled?: boolean;
  readonly renderOption?: (_props: React.HTMLAttributes<HTMLLIElement>, _option: T) => React.ReactNode;
  readonly renderInput: (_params: any) => React.ReactNode;
  readonly [key: string]: any; // for any other Autocomplete props
}

function MobileFriendlyAutocomplete<T>(props: MobileFriendlyAutocompleteProps<T>) {
  const {
    options,
    groupBy,
    getOptionLabel,
    label,
    value,
    onChange,
    disabled,
    renderOption,
    renderInput,
    ...autocompleteProps
  } = props;

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInputChange = (_event: any, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleChange = (_event: any, newValue: T | null) => {
    onChange?.(_event, newValue);
    handleClose();
  };

  return (
    <>
      <TextField
        label="Select Item"
        value={value ? getOptionLabel(value) : ''}
        onClick={handleOpen}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
        disabled={disabled}
      />

      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        slots={{ transition: Transition }}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {label}
            </Typography>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <Autocomplete
            open
            disablePortal
            onClose={() => {}}
            options={options}
            groupBy={groupBy}
            getOptionLabel={getOptionLabel}
            value={value}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            renderInput={renderInput}
            renderOption={renderOption}
            sx={{ width: '100%' }}
            disabled={disabled}
            {...autocompleteProps}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MobileFriendlyAutocomplete; 