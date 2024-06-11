'use client'

import {Tab, Tabs} from "@mui/material";
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

  return(
    <>
      <Tabs
        value={selectedTab}
        onChange={(event, tabSelected) => setSelectedTab(tabSelected)}
        aria-label="scrollable auto tabs example"
        variant={"fullWidth"}
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
