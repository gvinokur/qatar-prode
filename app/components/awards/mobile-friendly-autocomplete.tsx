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
import { FixedSizeList, ListChildComponentProps } from 'react-window';

// Transition for Dialog
const Transition = forwardRef(function Transition(props: any, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Custom ListboxComponent for virtualization
const ListboxComponent = forwardRef(function ListboxComponent(props: any, ref: React.Ref<HTMLDivElement>) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const itemSize = 48;

  const renderRow = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>
      {itemData[index]}
    </div>
  );

  return (
    <div ref={ref}>
      <FixedSizeList
        height={Math.min(itemData.length * itemSize, 300)}
        itemCount={itemData.length}
        itemSize={itemSize}
        width="100%"
        {...other}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});

// Props type for the component
interface MobileFriendlyAutocompleteProps<T> {
  label: string;
  options: T[];
  groupBy?: (option: T) => string;
  getOptionLabel: (option: T) => string;
  value: T | null;
  onChange: (event: React.SyntheticEvent, value: T | null) => void;
  disabled?: boolean;
  renderOption?: (props: React.HTMLAttributes<HTMLLIElement>, option: T) => React.ReactNode;
  renderInput: (params: any) => React.ReactNode;
  [key: string]: any; // for any other Autocomplete props
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

  const handleInputChange = (event: any, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  return (
    <>
      <TextField
        label="Select Item"
        value={value ? getOptionLabel(value) : ''}
        onClick={handleOpen}
        fullWidth
        InputProps={{ readOnly: true }}
        disabled={disabled}
      />

      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
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
            onChange={(event, newValue) => {
              onChange?.(event, newValue);
              handleClose();
            }}
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