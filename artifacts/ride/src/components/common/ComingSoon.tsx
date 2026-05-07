import { motion } from "framer-motion";

export function ComingSoon({ icon: Icon, label }: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-5 px-8 text-center"
      style={{ minHeight: 280 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon size={28} strokeWidth={1.8} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[17px] font-semibold text-[#0f172a] tracking-[-0.02em]">{label}</p>
        <p className="text-[14px] text-slate-400 mt-1.5 leading-relaxed">
          We&apos;re building this. Stay tuned.
        </p>
      </div>
    </motion.div>
  );
}
