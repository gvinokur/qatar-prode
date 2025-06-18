import {Box, BoxProps} from "@mui/material";

interface TabPanelProps extends BoxProps{
  children?: React.ReactNode;
  index: number;
  value: number;
}

export default function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      sx={{
        overflowY: 'auto',
      }}
      {...other}
    >
      {value === index && (
        <Box pt={1} pb={1}>
          {children}
        </Box>
      )}
    </Box>
  );
}
