import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlidePanel({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[700]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ background: "rgba(15,23,42,0.18)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[800] flex flex-col bg-white transform-gpu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 42, mass: 0.6 }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={0.05}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 400) onClose();
            }}
            style={{
              width: "88vw",
              maxWidth: 390,
              boxShadow: "-6px 0 32px rgba(15,23,42,0.08)",
              willChange: "transform",
              touchAction: "none",
            }}
          >
            <div
              className="flex items-center gap-3 px-5 border-b border-slate-100 shrink-0"
              style={{
                paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 20px)",
                paddingBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={16} strokeWidth={2.5} className="text-[#0f172a]" />
              </button>
              <h1 className="text-[17px] font-semibold text-[#0f172a] tracking-[-0.025em]">
                {title}
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ touchAction: "pan-y" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
