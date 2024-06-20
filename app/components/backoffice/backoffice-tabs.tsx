'use client'

import {Tab, Tabs, useMediaQuery} from "@mui/material";
import TabPanel from "../tab-panel";
import {useRef, useState} from "react";

type Props = {
  tabs: {
    label: string,
    component: React.ReactNode
  }[]
}

export default function BackofficeTabs({tabs} :Props) {
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const xsMatch = useMediaQuery('(min-width:600px)')

  return(
    <>
      <Tabs
        value={selectedTab}
        onChange={(event, tabSelected) => setSelectedTab(tabSelected)}
        aria-label="scrollable auto tabs example"
        variant={xsMatch ? "fullWidth" : 'scrollable'}
        centered={xsMatch ? false : true}
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
