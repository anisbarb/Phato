import { CheckCircle2, CarFront } from "lucide-react";
import BottomSheet from "@/components/common/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  onApprovalPending: () => void;
}

export default function DriverRegisterSheet({
  open,
  onClose,
  onApprovalPending,
}: Props) {
  function handleContinue() {
    localStorage.setItem("phato_user_role", "driver");
    localStorage.setItem(
      "phato_driver_application",
      JSON.stringify({
        status: "active",
        approvedAt: new Date().toISOString(),
      }),
    );

    onApprovalPending();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Drive with Phato">
      <div className="px-5 py-4 flex flex-col gap-5 pb-10">
        <div className="rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-[13px] text-blue-700 leading-relaxed">
            Driver setup is being simplified for now. Tap continue to enter
            Driver Mode immediately.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CarFront className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          </div>

          <div className="text-center">
            <p className="text-[18px] font-semibold text-[#0f172a]">
              Enter Driver Mode
            </p>
            <p className="text-[14px] text-slate-400 mt-2 leading-relaxed">
              No approval step for now. You will go directly to the driver
              screen.
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full h-12 rounded-2xl text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
          style={{
            background: "#2563eb",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}
        >
          Continue to Driver Mode
        </button>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-2xl border border-slate-200 text-[15px] font-semibold text-slate-700 bg-white"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
