import { Clock3 } from "lucide-react";
import SlidePanel from "@/components/common/SlidePanel";
import { ComingSoon } from "@/components/common/ComingSoon";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TripsSheet({ open, onClose }: Props) {
  return (
    <SlidePanel open={open} onClose={onClose} title="Trips">
      <ComingSoon icon={Clock3} label="Trip History" />
    </SlidePanel>
  );
}
