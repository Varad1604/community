import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
export function StatCard({ label, value, sub, icon, trend }: { label: string; value: string | number; sub?: string; icon?: ReactNode; trend?: string }) {
  return (
    <Card className="border bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          {icon && <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>}
        </div>
        {trend && <p className="text-xs font-medium text-emerald-600 mt-2">{trend}</p>}
      </CardContent>
    </Card>
  );
}
