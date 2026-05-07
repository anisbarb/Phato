import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDotCount((n) => (n + 1) % 4), 400);
    const timer = setTimeout(() => { clearInterval(interval); onDone(); }, 2200);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="flex items-baseline gap-[2px]">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#0f172a",
          }}
        >
          Phato
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#2563eb",
            letterSpacing: "-0.02em",
            minWidth: 36,
            display: "inline-block",
          }}
        >
          {".".repeat(dotCount)}
        </motion.span>
      </div>
    </motion.div>
  );
}
