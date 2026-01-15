'use client'

import {Box, Tab, Tabs, Tooltip, useMediaQuery} from "@mui/material";
import TabPanel from "../tab-panel";
import {useCallback, useEffect, useMemo} from "react";
import {BugReport, CheckCircle, PauseCircle} from "@mui/icons-material";
import {useSearchParams, useRouter} from "next/navigation";

export type LabelledTab = {
  type: 'labelledTab'
  label: string,
  component: React.ReactNode
  isDevOnly?: boolean
  isActive?: boolean
}

export type ActionTab = {
  type: 'actionTab',
  action: React.ReactNode
}

type TabDefinition = LabelledTab | ActionTab

type Props = {
  readonly tabs: TabDefinition[]
  readonly tabIdParam?: string // URL search param name for tab selection (e.g., 'tab' or 'subtab')
}

// Helper function to get tooltip title based on tab properties
function getTooltipTitle(tab: LabelledTab): string {
  if (tab.isDevOnly && tab.isActive === true) {
    return 'Torneo activo (desarrollo)'
  }
  if (tab.isDevOnly && tab.isActive === false) {
    return 'Torneo inactivo (desarrollo)'
  }
  if (tab.isDevOnly) {
    return 'Torneo de desarrollo'
  }
  if (tab.isActive === true) {
    return 'Torneo activo'
  }
  if (tab.isActive === false) {
    return 'Torneo inactivo'
  }
  return ''
}

// Helper function to render tab label with icons
function renderTabLabel(tab: LabelledTab): React.ReactNode {
  const hasStatusIndicators = tab.isDevOnly || tab.isActive !== undefined

  if (!hasStatusIndicators) {
    return tab.label
  }

  return (
    <Tooltip title={getTooltipTitle(tab)}>
      <Box sx={{display: 'flex', alignItems: 'center'}}>
        {tab.label}
        {tab.isDevOnly && <BugReport sx={{ ml:1, height: '16px'}} />}
        {tab.isActive === true && <CheckCircle sx={{ ml:1, height: '16px', color: 'success.main'}} />}
        {tab.isActive === false && <PauseCircle sx={{ ml:1, height: '16px', color: 'warning.main'}} />}
      </Box>
    </Tooltip>
  )
}

export function BackofficeTabs({tabs, tabIdParam = 'tab'} :Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isNotExtraSmallScreen = useMediaQuery('(min-width:600px)')

  // Get the selected tab label from URL or default to first tab
  const selectedTabLabel = searchParams.get(tabIdParam)

  // Find the index of the selected tab by label
  const selectedTabIndex = useMemo(() => {
    if (!selectedTabLabel) return 0

    const labelledTabs = tabs.filter((tab): tab is LabelledTab => tab.type === 'labelledTab')
    const index = labelledTabs.findIndex(tab => tab.label === selectedTabLabel)

    return Math.max(index, 0)
  }, [selectedTabLabel, tabs])

  // Update URL when tab changes
  const handleTabChange = useCallback((event: any, tabIndex: number) => {
    const labelledTabs = tabs.filter((tab): tab is LabelledTab => tab.type === 'labelledTab')
    const selectedTab = labelledTabs[tabIndex]

    if (selectedTab) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set(tabIdParam, selectedTab.label)
      router.replace(`?${newParams.toString()}`, { scroll: false })
    }
  }, [tabs, searchParams, router, tabIdParam])

  // Set initial tab if not in URL
  useEffect(() => {
    if (!selectedTabLabel) {
      const labelledTabs = tabs.filter((tab): tab is LabelledTab => tab.type === 'labelledTab')
      if (labelledTabs.length > 0) {
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set(tabIdParam, labelledTabs[0].label)
        router.replace(`?${newParams.toString()}`, { scroll: false })
      }
    }
  }, [selectedTabLabel, tabs, searchParams, router, tabIdParam])

  return(
    <>
      <Tabs
        value={selectedTabIndex}
        onChange={handleTabChange}
        variant={isNotExtraSmallScreen ? "fullWidth" : 'scrollable'}
        scrollButtons={"auto"}
      >
        {tabs.map(tab =>
          tab.type === 'labelledTab'
            ? <Tab key={tab.label} label={renderTabLabel(tab)} />
            : tab.action
        )}
      </Tabs>
      {tabs.map((tab, index) => tab.type === 'labelledTab' && (
        <TabPanel key={tab.label} index={index} value={selectedTabIndex}>
          {tab.component}
        </TabPanel>
      ) || null )}
    </>
  )
}
