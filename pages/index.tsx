import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { query, initThinBackend, ensureIsUser, getCurrentUser } from 'thin-backend';
import { useQuery, useCurrentUser } from 'thin-backend-react';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import {Box} from "@mui/material";


initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });

const Home: NextPage = () => {
  return (
    <Box>
      {}
    </Box>
  )
}

export default Home
