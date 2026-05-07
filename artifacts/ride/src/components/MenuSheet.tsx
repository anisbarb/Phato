import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  House, Clock3, Bookmark, Bell, CarTaxiFront, Settings2, X,
  Gauge, ChevronRight, Clock, Radio, Route, Car, Users,
  ArrowLeft,
} from "lucide-react";
import HomeLocationSheet from "@/features/home-location/HomeLocationSheet";
import TripsSheet from "@/features/trips/TripsSheet";
import SavedPlacesSheet from "@/features/saved-places/SavedPlacesSheet";
import NotificationsSheet from "@/features/notifications/NotificationsSheet";
import DriverRegisterSheet from "@/features/driver-register/DriverRegisterSheet";
import SettingsSheet from "@/features/settings/SettingsSheet";
import type { UserRole } from "@/lib/auth";

const SIDEBAR_W = 296;

interface Props {
  open: boolean;
  onClose: () => void;
  isDriver?: boolean;
}

function NavRow({
  Icon, label, sub, onClick, right, disabled,
}: {
  Icon: React.ElementType;
  label: string;
  sub?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? {} : { scale: 0.985 }}
      onClick={disabled ? undefined : onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-150 ${disabled ? "opacity-50 cursor-default" : "active:bg-black/[0.05] hover:bg-black/[0.03]"}`}
      style={{ touchAction: "manipulation" }}
    >
      <Icon size={18} strokeWidth={2.5} className="text-[#10213f] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] tracking-[-0.02em] font-medium text-[#10213f] leading-tight">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</div>}
      </div>
      {right}
    </motion.button>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "driver") return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-[2.5px] border-white" />;
  if (role === "pending") return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-400 border-[2.5px] border-white" />;
  return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-[2.5px] border-white" />;
}

export default function MenuSheet({ open, onClose, isDriver = false }: Props) {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(
    () => localStorage.getItem("phato_profile_img")
  );
  const [role, setRole] = useState<UserRole>(
    () => (localStorage.getItem("phato_user_role") as UserRole) ?? "passenger"
  );
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => {
      setRole((localStorage.getItem("phato_user_role") as UserRole) ?? "passenger");
    };
    window.addEventListener("phato_role_changed", handler);
    return () => window.removeEventListener("phato_role_changed", handler);
  }, []);

  const handleProfileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
      localStorage.setItem("phato_profile_img", base64);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }, []);

  const openSheet = useCallback((key: string) => {
    onClose();
    setTimeout(() => setActiveSheet(key), 280);
  }, [onClose]);

  const handleDriverAction = useCallback(() => {
    if (role === "driver") {
      setLocation("/driver");
      onClose();
    } else if (role === "passenger") {
      openSheet("driver-register");
    }
  }, [role, setLocation, onClose, openSheet]);

  const handleSwitchToPassenger = useCallback(() => {
    setLocation("/");
    onClose();
  }, [setLocation, onClose]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[800]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: "rgba(15,23,42,0.18)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="fixed top-0 right-0 bottom-0 z-[900] flex flex-col overflow-hidden transform-gpu select-none"
        animate={{ x: open ? 0 : SIDEBAR_W }}
        initial={{ x: SIDEBAR_W }}
        transition={{ type: "spring", stiffness: 460, damping: 44, mass: 0.6 }}
        drag="x"
        dragConstraints={{ left: 0, right: SIDEBAR_W }}
        dragElastic={0.05}
        dragMomentum={false}
        dragDirectionLock
        onDragEnd={(_, info) => {
          if (info.offset.x > 80 || info.velocity.x > 500) onClose();
        }}
        style={{
          width: SIDEBAR_W,
          background: "rgba(252,252,253,0.97)",
          backdropFilter: "blur(20px)",
          boxShadow: "-4px 0 24px rgba(15,23,42,0.08)",
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
          willChange: "transform",
          touchAction: "none",
        }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/5 pointer-events-none" />

        {/* Profile header */}
        <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,0px)+18px,24px)] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm active:scale-95 transition-transform"
                style={{ background: "#0f172a" }}
                aria-label="Upload profile picture"
              >
                {profileImage
                  ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="text-white text-[16px] font-bold select-none">{isDriver ? "D" : "P"}</span></div>}
              </button>
              <RoleBadge role={role} />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] tracking-[-0.02em] font-semibold text-[#0f172a] leading-snug">Phato User</div>
              <div className="text-[11px] text-slate-400 leading-snug capitalize flex items-center gap-1">
                {isDriver
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Driver</>
                  : role}
              </div>
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/90"
            aria-label="Close menu"
          >
            <X size={15} strokeWidth={2.5} className="text-slate-500" />
          </motion.button>
        </div>

        <div className="px-5 pb-3">
          <div className="h-px w-full bg-slate-100" />
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1" style={{ touchAction: "pan-y" }}>
          {isDriver ? (
            /* ── Driver-specific nav ── */
            <>
              <NavRow
                Icon={ArrowLeft}
                label="Passenger Mode"
                sub="Switch back to the map"
                onClick={handleSwitchToPassenger}
                right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />}
              />

              <div className="mx-4 my-2.5 h-px bg-slate-100" />

              <NavRow Icon={Route}    label="Live Corridor"       sub="Current route activity"    onClick={() => openSheet("notifications")} right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />
              <NavRow Icon={Users}    label="Passenger Requests"  sub="Waiting near your route"   onClick={() => openSheet("trips")}         right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />
              <NavRow Icon={Car}      label="My Vehicle"          sub="Seats & preferences"       onClick={() => openSheet("saved-places")}  right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />

              <div className="mx-4 my-2.5 h-px bg-slate-100" />

              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl">
                <Radio size={18} strokeWidth={2.5} className="text-[#10213f] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[#10213f] leading-tight">Availability</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Manage in dashboard</div>
                </div>
              </div>

              <NavRow Icon={Bookmark} label="Saved Routes"    onClick={() => openSheet("saved-places")}  right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />
              <NavRow Icon={Bell}     label="Notifications"   onClick={() => openSheet("notifications")} right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />
            </>
          ) : (
            /* ── Passenger nav ── */
            <>
              <NavRow Icon={House}    label="Home"            onClick={() => openSheet("home")} />
              <NavRow Icon={Clock3}   label="Trips"           onClick={() => openSheet("trips")} />
              <NavRow Icon={Bookmark} label="Saved Places"    onClick={() => openSheet("saved-places")} />
              <NavRow Icon={Bell}     label="Notifications"   onClick={() => openSheet("notifications")} />

              <div className="mx-4 my-3 h-px bg-slate-100" />

              {role === "passenger" && (
                <NavRow Icon={CarTaxiFront} label="Become a Driver" sub="Drive with Phato" onClick={handleDriverAction} right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />
              )}
              {role === "driver" && (
                <NavRow Icon={Gauge} label="Driver Dashboard" sub="Currently active" onClick={handleDriverAction} right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />} />
              )}
              {role === "pending" && (
                <NavRow Icon={Clock} label="Application Pending" sub="We'll call you within 24 hours" disabled />
              )}
            </>
          )}
        </div>

        <div className="mt-auto px-2 pb-[max(env(safe-area-inset-bottom,0px)+16px,22px)]">
          <div className="mx-4 mb-3 h-px bg-slate-100" />
          <NavRow
            Icon={Settings2}
            label="Settings"
            onClick={() => openSheet("settings")}
            right={<ChevronRight size={14} strokeWidth={2.5} className="text-slate-300" />}
          />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
        </div>
      </motion.aside>

      <HomeLocationSheet open={activeSheet === "home"} onClose={() => setActiveSheet(null)} />
      <TripsSheet open={activeSheet === "trips"} onClose={() => setActiveSheet(null)} />
      <SavedPlacesSheet open={activeSheet === "saved-places"} onClose={() => setActiveSheet(null)} />
      <NotificationsSheet open={activeSheet === "notifications"} onClose={() => setActiveSheet(null)} />
      <DriverRegisterSheet
        open={activeSheet === "driver-register"}
        onClose={() => setActiveSheet(null)}
        onApprovalPending={() => {
          localStorage.setItem("phato_user_role", "pending");
          setRole("pending");
          window.dispatchEvent(new Event("phato_role_changed"));
        }}
      />
      <SettingsSheet open={activeSheet === "settings"} onClose={() => setActiveSheet(null)} />
    </>
  );
}
