export type Role = "SUPER_ADMIN"|"SOCIETY_ADMIN"|"RWA_MEMBER"|"ACCOUNTANT"|"FACILITY_MANAGER"|"SECURITY_MANAGER"|"GUARD"|"RESIDENT"|"FAMILY_MEMBER"|"VENDOR"|"SERVICE_PROVIDER"|"DOMESTIC_HELP";
const perms: Record<string, Role[]> = {
  "visitor:approve": ["SOCIETY_ADMIN","SECURITY_MANAGER","RESIDENT"],
  "visitor:create": ["RESIDENT","FAMILY_MEMBER","SOCIETY_ADMIN","RWA_MEMBER"],
  "bill:issue": ["SOCIETY_ADMIN","ACCOUNTANT"],
  "payment:refund": ["SOCIETY_ADMIN","ACCOUNTANT"],
  "admin:access": ["SOCIETY_ADMIN","RWA_MEMBER","ACCOUNTANT","FACILITY_MANAGER","SECURITY_MANAGER"],
};
export function can(roles: Role[], action: string) {
  const allowed = perms[action];
  if (!allowed) return false;
  return roles.some(r => allowed.includes(r) || r === "SUPER_ADMIN");
}
