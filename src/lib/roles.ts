export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  LEAGUE_ADMIN: "LEAGUE_ADMIN",
  LEAGUE_STAFF: "LEAGUE_STAFF",
  TEAM_OWNER: "TEAM_OWNER",
  TEAM_MANAGER: "TEAM_MANAGER",
  COACH: "COACH",
  SELECTOR: "SELECTOR",
  ANALYST: "ANALYST",
  SCORER: "SCORER",
  UMPIRE: "UMPIRE",
  MATCH_REFEREE: "MATCH_REFEREE",
  PLAYER: "PLAYER",
  FAN: "FAN",
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABELS: Record<string, string> = {
  [ROLE.SUPER_ADMIN]: "Super Admin",
  [ROLE.LEAGUE_ADMIN]: "League Admin",
  [ROLE.LEAGUE_STAFF]: "League Staff",
  [ROLE.TEAM_OWNER]: "Team Owner",
  [ROLE.TEAM_MANAGER]: "Team Manager",
  [ROLE.COACH]: "Coach",
  [ROLE.SELECTOR]: "Selector",
  [ROLE.ANALYST]: "Analyst",
  [ROLE.SCORER]: "Scorer",
  [ROLE.UMPIRE]: "Umpire",
  [ROLE.MATCH_REFEREE]: "Match Referee",
  [ROLE.PLAYER]: "Player",
  [ROLE.FAN]: "Fan",
};

export const ROLE_COLORS: Record<string, string> = {
  [ROLE.SUPER_ADMIN]: "bg-red-100 text-red-800",
  [ROLE.LEAGUE_ADMIN]: "bg-purple-100 text-purple-800",
  [ROLE.LEAGUE_STAFF]: "bg-indigo-100 text-indigo-800",
  [ROLE.TEAM_OWNER]: "bg-cyan-100 text-cyan-800",
  [ROLE.TEAM_MANAGER]: "bg-blue-100 text-blue-800",
  [ROLE.COACH]: "bg-sky-100 text-sky-800",
  [ROLE.SELECTOR]: "bg-teal-100 text-teal-800",
  [ROLE.ANALYST]: "bg-emerald-100 text-emerald-800",
  [ROLE.SCORER]: "bg-[color:var(--card-muted)] text-[color:var(--color-ink)]",
  [ROLE.UMPIRE]: "bg-amber-100 text-amber-800",
  [ROLE.MATCH_REFEREE]: "bg-orange-100 text-orange-800",
  [ROLE.PLAYER]: "bg-yellow-100 text-yellow-800",
  [ROLE.FAN]: "bg-gray-100 text-gray-800",
};

export const ADMIN_ROLES: UserRole[] = [ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN];
export const LEAGUE_OPERATIONS_ROLES: UserRole[] = [
  ROLE.SUPER_ADMIN,
  ROLE.LEAGUE_ADMIN,
  ROLE.LEAGUE_STAFF,
];
export const TEAM_STAFF_ROLES: UserRole[] = [
  ROLE.TEAM_OWNER,
  ROLE.TEAM_MANAGER,
  ROLE.COACH,
  ROLE.SELECTOR,
  ROLE.ANALYST,
];
export const MATCH_OFFICIAL_ROLES: UserRole[] = [
  ROLE.SCORER,
  ROLE.UMPIRE,
  ROLE.MATCH_REFEREE,
];
export const SELF_REGISTRATION_ROLES: UserRole[] = [
  ROLE.FAN,
  ROLE.PLAYER,
  ROLE.TEAM_MANAGER,
  ROLE.COACH,
  ROLE.ANALYST,
  ROLE.SCORER,
  ROLE.UMPIRE,
];

export function getRoleLabel(role: string) {
  return ROLE_LABELS[role] || role;
}

export function isAdminRole(role?: string | null) {
  return !!role && ADMIN_ROLES.includes(role as UserRole);
}

export function isLeagueOpsRole(role?: string | null) {
  return !!role && LEAGUE_OPERATIONS_ROLES.includes(role as UserRole);
}

export function isTeamStaffRole(role?: string | null) {
  return !!role && TEAM_STAFF_ROLES.includes(role as UserRole);
}

export function isMatchOfficialRole(role?: string | null) {
  return !!role && MATCH_OFFICIAL_ROLES.includes(role as UserRole);
}

export function canSelfRegister(role?: string | null) {
  return !!role && SELF_REGISTRATION_ROLES.includes(role as UserRole);
}

export function getDashboardLinkForRole(role?: string | null) {
  switch (role) {
    case ROLE.SUPER_ADMIN:
    case ROLE.LEAGUE_ADMIN:
      return "/admin";
    case ROLE.LEAGUE_STAFF:
      return "/dashboard/league-staff";
    case ROLE.TEAM_MANAGER:
      return "/dashboard/team";
    case ROLE.TEAM_OWNER:
    case ROLE.COACH:
    case ROLE.SELECTOR:
    case ROLE.ANALYST:
      return "/dashboard/team-staff";
    case ROLE.SCORER:
      return "/dashboard/scorer";
    case ROLE.UMPIRE:
    case ROLE.MATCH_REFEREE:
      return "/dashboard/officials";
    case ROLE.PLAYER:
      return "/dashboard/player";
    default:
      return "/profile";
  }
}
