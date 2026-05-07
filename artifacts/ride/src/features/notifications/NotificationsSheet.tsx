import { Bell } from "lucide-react";
import SlidePanel from "@/components/common/SlidePanel";
import { ComingSoon } from "@/components/common/ComingSoon";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({ open, onClose }: Props) {
  return (
    <SlidePanel open={open} onClose={onClose} title="Notifications">
      <ComingSoon icon={Bell} label="Notifications" />
    </SlidePanel>
  );
}
