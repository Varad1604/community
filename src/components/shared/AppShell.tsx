"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getNavForRoles, bottomNavItems } from "@/lib/navigation";
import { toast } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [society, setSociety] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasEmergency, setHasEmergency] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      if(d.user){ setUser(d.user); setRoles(d.roles?.map((r:any)=>r.role) || ["RESIDENT"]); }
    }).catch(()=>{});
    fetch("/api/societies").then(r=>r.json()).then(d=>{ if(Array.isArray(d)&&d.length) setSociety(d[0]); }).catch(()=>{});
    const fetchUnread = () => fetch("/api/notifications").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setUnread(d.filter((n:any)=>!n.readAt).length); }).catch(()=>{});
    fetchUnread(); const id = setInterval(fetchUnread, 30000);
    const fetchEmergency = () => fetch("/api/emergency").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setHasEmergency(d.some((a:any)=>a.status==="OPEN")); }).catch(()=>{});
    fetchEmergency(); const id2 = setInterval(fetchEmergency, 30000);
    return () => { clearInterval(id); clearInterval(id2); };
  }, []);

  const navSections = getNavForRoles(roles.length? roles : ["RESIDENT"]);

  async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); toast.success("Signed out"); location.href="/auth/sign-in"; }

  const Nav = ({ onClick }: { onClick?: ()=>void }) => (
    <nav className="space-y-6" aria-label="Primary">
      {navSections.map(section=>(
        <div key={section.title}>
          <p className="px-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">{section.title}</p>
          <ul className="space-y-1">
            {section.items.map(item=>{
              const active = pathname===item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onClick} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-14 items-center gap-2 border-b px-4">
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
                <span className="text-sm font-semibold">Society OS</span>
              </div>
              <div className="p-4 overflow-auto"><Nav onClick={()=>setOpen(false)} /></div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">{society?.name || "Green Acres"}</p>
              <p className="text-xs text-muted-foreground">{society?.code || "GAR001"} • {roles[0] || "RESIDENT"}</p>
            </div>
          </Link>
          {society && <Badge variant="outline" className="hidden md:inline-flex ml-2">{society.city}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Link href="/notifications" aria-label={`Notifications ${unread ? `(${unread} unread)` : ""}`} className="relative inline-flex">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          {hasEmergency && <Link href="/emergency" aria-label="Active emergency"><Badge variant="destructive" className="animate-pulse text-xs px-2">!</Badge></Link>}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border pl-1 pr-2 py-1 hover:bg-muted">
                  <Avatar className="h-7 w-7"><AvatarFallback>{user.fullName?.[0]?.toUpperCase() || "U"}</AvatarFallback></Avatar>
                  <span className="hidden sm:block text-sm font-medium">{user.fullName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/sign-in"><Button size="sm">Sign in</Button></Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="hidden lg:block w-60 shrink-0 border-r sticky top-14 h-[calc(100vh-56px)] overflow-auto p-4 bg-card">
          <Nav />
        </aside>
        <main className="flex-1 min-w-0">
          <div className="px-3 sm:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background" aria-label="Mobile bottom navigation">
        <div className="grid grid-cols-5">
          {bottomNavItems.map(item=>{
            const active = pathname===item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 py-2 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
