"use client";

import {motion} from "framer-motion";

export default function Transition({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ x: 0, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ease: "easeIn", duration: 0.5,}}
    >
      {children}
    </motion.div>
  );
}
