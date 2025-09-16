
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: CampaignStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<CampaignStatus, string> = {
    Draft: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    Submitted: "bg-sky-200 text-sky-800 hover:bg-sky-300",
    Active: "bg-blue-200 text-blue-800 hover:bg-blue-300",
    Completed: "bg-purple-200 text-purple-800 hover:bg-purple-300",
    Validated: "bg-cyan-200 text-cyan-800 hover:bg-cyan-300",
    Returned: "bg-orange-200 text-orange-800 hover:bg-orange-300"
  };

  return (
    <Badge className={cn("border-transparent", statusStyles[status])}>
      {status}
    </Badge>
  );
}
