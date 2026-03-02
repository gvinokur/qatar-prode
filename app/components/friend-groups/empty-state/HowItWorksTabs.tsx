'use client'

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Grid } from "@mui/material";
import { useTranslations } from 'next-intl';
import StepCard from './StepCard';
import CreateIcon from '@mui/icons-material/Create';
import ShareIcon from '@mui/icons-material/Share';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LinkIcon from '@mui/icons-material/Link';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SearchIcon from '@mui/icons-material/Search';

interface TabPanelProps {
  readonly children: React.ReactNode;
  readonly value: number;
  readonly index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{
        pt: 4,
        opacity: value === index ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {value === index && children}
    </Box>
  );
}

export default function HowItWorksTabs() {
  const t = useTranslations('groups.emptyState.landing.howItWorks');
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const createGroupSteps = [
    {
      icon: <CreateIcon />,
      title: t('createGroup.step1.title'),
      description: t('createGroup.step1.description'),
      tip: t('createGroup.step1.tip')
    },
    {
      icon: <ShareIcon />,
      title: t('createGroup.step2.title'),
      description: t('createGroup.step2.description'),
      tip: t('createGroup.step2.tip')
    },
    {
      icon: <CheckCircleIcon />,
      title: t('createGroup.step3.title'),
      description: t('createGroup.step3.description'),
      tip: t('createGroup.step3.tip')
    },
    {
      icon: <EmojiEventsIcon />,
      title: t('createGroup.step4.title'),
      description: t('createGroup.step4.description'),
      tip: t('createGroup.step4.tip')
    }
  ];

  const joinPrivateSteps = [
    {
      icon: <LinkIcon />,
      title: t('joinPrivate.step1.title'),
      description: t('joinPrivate.step1.description'),
      tip: t('joinPrivate.step1.tip')
    },
    {
      icon: <PersonAddIcon />,
      title: t('joinPrivate.step2.title'),
      description: t('joinPrivate.step2.description'),
      tip: t('joinPrivate.step2.tip')
    },
    {
      icon: <HourglassEmptyIcon />,
      title: t('joinPrivate.step3.title'),
      description: t('joinPrivate.step3.description'),
      tip: t('joinPrivate.step3.tip')
    },
    {
      icon: <CelebrationIcon />,
      title: t('joinPrivate.step4.title'),
      description: t('joinPrivate.step4.description'),
      tip: t('joinPrivate.step4.tip')
    }
  ];

  const joinPublicSteps = [
    {
      icon: <SearchIcon />,
      title: t('joinPublic.step1.title'),
      description: t('joinPublic.step1.description'),
      tip: t('joinPublic.step1.tip')
    },
    {
      icon: <PersonAddIcon />,
      title: t('joinPublic.step2.title'),
      description: t('joinPublic.step2.description'),
      tip: t('joinPublic.step2.tip')
    },
    {
      icon: <HourglassEmptyIcon />,
      title: t('joinPublic.step3.title'),
      description: t('joinPublic.step3.description'),
      tip: t('joinPublic.step3.tip')
    },
    {
      icon: <CelebrationIcon />,
      title: t('joinPublic.step4.title'),
      description: t('joinPublic.step4.description'),
      tip: t('joinPublic.step4.tip')
    }
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          {t('headline')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab label={t('tabs.create')} />
          <Tab label={t('tabs.joinPrivate')} />
          <Tab label={t('tabs.joinPublic')} />
        </Tabs>
      </Box>

      {/* Tab Panel: Create a Group */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {createGroupSteps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.title}>
              <StepCard
                stepNumber={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
                tip={step.tip}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab Panel: Join Private Group */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {joinPrivateSteps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.title}>
              <StepCard
                stepNumber={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
                tip={step.tip}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab Panel: Join Public Group */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {joinPublicSteps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.title}>
              <StepCard
                stepNumber={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
                tip={step.tip}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
}
