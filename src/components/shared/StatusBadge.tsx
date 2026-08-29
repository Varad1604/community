import { Badge } from "@/components/ui/badge";
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-900 border-emerald-200",
    COLLECTED: "bg-emerald-100 text-emerald-900 border-emerald-200",
    CONFIRMED: "bg-emerald-100 text-emerald-900 border-emerald-200",
    CHECKED_OUT: "bg-emerald-100 text-emerald-900 border-emerald-200",
    RESOLVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
    APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
    CLOSED: "bg-emerald-100 text-emerald-900 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-900 border-amber-200",
    AT_GATE: "bg-amber-100 text-amber-900 border-amber-200",
    ASSIGNED: "bg-amber-100 text-amber-900 border-amber-200",
    PARTIAL: "bg-amber-100 text-amber-900 border-amber-200",
    ACKNOWLEDGED: "bg-amber-100 text-amber-900 border-amber-200",
    OVERDUE: "bg-red-100 text-red-900 border-red-200",
    REJECTED: "bg-red-100 text-red-900 border-red-200",
    CANCELLED: "bg-red-100 text-red-900 border-red-200",
    EXPIRED: "bg-red-100 text-red-900 border-red-200",
    RETURNED: "bg-red-100 text-red-900 border-red-200",
    OPEN: "bg-blue-100 text-blue-900 border-blue-200",
    IN_PROGRESS: "bg-blue-100 text-blue-900 border-blue-200",
    ISSUED: "bg-blue-100 text-blue-900 border-blue-200",
    DELIVERED: "bg-blue-100 text-blue-900 border-blue-200",
    CHECKED_IN: "bg-blue-100 text-blue-900 border-blue-200",
  };
  return <Badge variant="outline" className={map[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
}
