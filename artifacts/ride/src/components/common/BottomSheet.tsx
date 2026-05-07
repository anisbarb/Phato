import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
  title?: string;
}

export default function BottomSheet({ open, onClose, children, height = "90vh", title }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[800]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[900] flex flex-col overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 42, mass: 0.65 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.06}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            style={{
              height,
              background: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: "0 -4px 40px rgba(15,23,42,0.12)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-slate-200" />
            </div>
            {title && (
              <div className="px-5 py-3 border-b border-slate-100 shrink-0">
                <h2 className="text-[17px] font-semibold text-[#0f172a] tracking-[-0.02em]">{title}</h2>
              </div>
            )}
            <div className="flex-1 overflow-y-auto" style={{ touchAction: "pan-y" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
