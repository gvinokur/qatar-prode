'use client'

import {Tab, Tabs, useMediaQuery} from "@mui/material";
import TabPanel from "../tab-panel";
import {useCallback, useRef, useState} from "react";

type Props = {
  tabs: {
    label: string,
    component: React.ReactNode
  }[]
}

export default function BackofficeTabs({tabs} :Props) {
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
        aria-label="scrollable auto tabs example"
        variant={isNotExtraSmallScreen ? "fullWidth" : 'scrollable'}
        scrollButtons={"auto"}
      >
        {tabs.map(tab=> (
          <Tab label={tab.label} key={tab.label}/>
        ))}
      </Tabs>
      {tabs.map((tab, index) => (
        <TabPanel key={tab.label} index={index} value={selectedTab}>
          {tab.component}
        </TabPanel>
      ))}
    </>
  )

}
