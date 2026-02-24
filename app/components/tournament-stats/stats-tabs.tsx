'use client'

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Tabs, Tab } from '@mui/material';
import { ScrollShadowContainer } from '../common/scroll-shadow-container';

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
  const t = useTranslations('stats');
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Fixed tabs header */}
      <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label={t('tabs.ariaLabel')}>
          <Tab label={t('tabs.performance')} {...a11yProps(0)} />
          <Tab label={t('tabs.accuracy')} {...a11yProps(1)} />
          <Tab label={t('tabs.boosts')} {...a11yProps(2)} />
        </Tabs>
      </Box>

      {/* Scrollable content */}
      <ScrollShadowContainer
        direction="vertical"
        hideScrollbar={true}
        sx={{ flex: 1, minHeight: 0 }}
        scrollContainerSx={{ pb: { xs: '56px', md: 2 } }} // Account for bottom nav on mobile
      >
        <TabPanel value={value} index={0}>
          {performanceTab}
        </TabPanel>
        <TabPanel value={value} index={1}>
          {precisionTab}
        </TabPanel>
        <TabPanel value={value} index={2}>
          {boostsTab}
        </TabPanel>
      </ScrollShadowContainer>
    </Box>
  );
}
