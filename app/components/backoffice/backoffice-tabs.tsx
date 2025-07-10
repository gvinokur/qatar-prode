'use client'

import {Box, Tab, Tabs, Tooltip, useMediaQuery} from "@mui/material";
import TabPanel from "../tab-panel";
import {useCallback, useState} from "react";
import {BugReport} from "@mui/icons-material";

export type LabelledTab = {
  type: 'labelledTab'
  label: string,
  component: React.ReactNode
  isDevOnly?: boolean
}

export type ActionTab = {
  type: 'actionTab',
  action: React.ReactNode
}

type TabDefinition = LabelledTab | ActionTab

type Props = {
  readonly tabs: TabDefinition[]
}

export function BackofficeTabs({tabs} :Props) {
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const isNotExtraSmallScreen = useMediaQuery('(min-width:600px)')

  const handleTabChange = useCallback((event: any, tabSelected: number) => {
    setSelectedTab(tabSelected)
  }, [setSelectedTab])

  return(
    <>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant={isNotExtraSmallScreen ? "fullWidth" : 'scrollable'}
        scrollButtons={"auto"}
      >
        {tabs.map(tab=> tab.type === 'labelledTab' ? (
          <Tab key={tab.label} label={
            tab.isDevOnly ? (
              <Tooltip
                title={'Este torneo solo está disponible en el ambiente de desarrollo'}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                  {tab.label} <BugReport sx={{ ml:1, height: '16px'}} />
                </Box>
              </Tooltip>
            ) : tab.label
          } />
        ) : tab.action)}
      </Tabs>
      {tabs.map((tab, index) => tab.type === 'labelledTab' && (
        <TabPanel key={tab.label} index={index} value={selectedTab}>
          {tab.component}
        </TabPanel>
      ) || null )}
    </>
  )
}
