'use client'

import {JSONTree} from "react-json-tree";
import { base16Themes } from 'react-base16-styling/lib/themes'
import {Box, useTheme} from "@mui/material";

export function DebugObject({ object }: {object: any}) {
  const theme = useTheme()
  return (
    <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius={2} mt={2} p={1}>
      <JSONTree data={(object)}  theme={base16Themes.threezerotwofour} invertTheme={true} />
    </Box>
  )
}
