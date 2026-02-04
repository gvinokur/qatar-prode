'use client'

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';

interface TabPanelProps {
  readonly children?: React.ReactNode;
  readonly index: number;
  readonly value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `stats-tab-${index}`,
    'aria-controls': `stats-tabpanel-${index}`,
  };
}

type Props = {
  readonly performanceTab: React.ReactNode
  readonly precisionTab: React.ReactNode
  readonly boostsTab: React.ReactNode
}

export function StatsTabs({ performanceTab, precisionTab, boostsTab }: Props) {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="estadísticas del torneo">
          <Tab label="Rendimiento" {...a11yProps(0)} />
          <Tab label="Precisión" {...a11yProps(1)} />
          <Tab label="Análisis de Boosts" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {performanceTab}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {precisionTab}
      </TabPanel>
      <TabPanel value={value} index={2}>
        {boostsTab}
      </TabPanel>
    </Box>
  );
}
