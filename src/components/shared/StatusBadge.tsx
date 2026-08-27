import { Badge } from "@/components/ui/badge";
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
    ISSUED: "bg-amber-100 text-amber-900 border-amber-200",
    PAID: "bg-emerald-100 text-emerald-900 border-emerald-200",
    OVERDUE: "bg-red-100 text-red-900 border-red-200",
    OPEN: "bg-blue-100 text-blue-900 border-blue-200",
    RESOLVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
  };
  return <Badge variant="outline" className={map[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
}
