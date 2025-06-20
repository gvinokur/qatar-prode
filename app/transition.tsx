"use client";

import {AnimatePresence, motion} from "framer-motion";
import {useEffect, useState} from "react";

export default function Transition({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  const [hidePage, setHidePage] = useState(false)

  useEffect(() => {
    const pageHideHandler = () => {
      setHidePage(true)
      };

    window.addEventListener('beforeunload', pageHideHandler )

    return () => {
      window.removeEventListener('beforeunload', pageHideHandler)
    }
  }, []);

  return (
    <AnimatePresence>
      {!hidePage && (
        <motion.div
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 0, opacity: 0 }}
          transition={{ ease: "easeIn", duration: 0.3,}}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
