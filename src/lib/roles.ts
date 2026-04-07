export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  LEAGUE_ADMIN: "LEAGUE_ADMIN",
  TEAM_MANAGER: "TEAM_MANAGER",
  SCORER: "SCORER",
  UMPIRE: "UMPIRE",
  PLAYER: "PLAYER",
  VIEWER: "VIEWER",
  LEAGUE_STAFF: "LEAGUE_STAFF",
  TEAM_OWNER: "TEAM_OWNER",
  COACH: "COACH",
  SELECTOR: "SELECTOR",
  ANALYST: "ANALYST",
  MATCH_REFEREE: "MATCH_REFEREE",
  FAN: "FAN",
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

const ROLE_ALIASES: Record<string, string> = {
  [ROLE.LEAGUE_STAFF]: ROLE.LEAGUE_ADMIN,
  [ROLE.TEAM_OWNER]: ROLE.TEAM_MANAGER,
  [ROLE.COACH]: ROLE.TEAM_MANAGER,
  [ROLE.SELECTOR]: ROLE.TEAM_MANAGER,
  [ROLE.ANALYST]: ROLE.TEAM_MANAGER,
  [ROLE.MATCH_REFEREE]: ROLE.UMPIRE,
  [ROLE.FAN]: ROLE.VIEWER,
};

export function normalizeRole(role?: string | null) {
  if (!role) return null;
  return ROLE_ALIASES[role] || role;
}

export const ROLE_LABELS: Record<string, string> = {
  [ROLE.SUPER_ADMIN]: "Super Admin",
  [ROLE.LEAGUE_ADMIN]: "League Admin",
  [ROLE.TEAM_MANAGER]: "Team Manager",
  [ROLE.SCORER]: "Scorer",
  [ROLE.UMPIRE]: "Umpire",
  [ROLE.PLAYER]: "Player",
  [ROLE.VIEWER]: "Viewer",
  [ROLE.LEAGUE_STAFF]: "League Admin",
  [ROLE.TEAM_OWNER]: "Team Manager",
  [ROLE.COACH]: "Team Manager",
  [ROLE.SELECTOR]: "Team Manager",
  [ROLE.ANALYST]: "Team Manager",
  [ROLE.MATCH_REFEREE]: "Umpire",
  [ROLE.FAN]: "Viewer",
};

export const ROLE_COLORS: Record<string, string> = {
  [ROLE.SUPER_ADMIN]: "bg-red-100 text-red-800",
  [ROLE.LEAGUE_ADMIN]: "bg-purple-100 text-purple-800",
  [ROLE.TEAM_MANAGER]: "bg-blue-100 text-blue-800",
  [ROLE.SCORER]: "bg-[color:var(--card-muted)] text-[color:var(--color-ink)]",
  [ROLE.UMPIRE]: "bg-amber-100 text-amber-800",
  [ROLE.PLAYER]: "bg-yellow-100 text-yellow-800",
  [ROLE.VIEWER]: "bg-gray-100 text-gray-800",
  [ROLE.LEAGUE_STAFF]: "bg-purple-100 text-purple-800",
  [ROLE.TEAM_OWNER]: "bg-blue-100 text-blue-800",
  [ROLE.COACH]: "bg-blue-100 text-blue-800",
  [ROLE.SELECTOR]: "bg-blue-100 text-blue-800",
  [ROLE.ANALYST]: "bg-blue-100 text-blue-800",
  [ROLE.MATCH_REFEREE]: "bg-amber-100 text-amber-800",
  [ROLE.FAN]: "bg-gray-100 text-gray-800",
};

const NORMALIZED_ADMIN_ROLES: UserRole[] = [ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN];
const NORMALIZED_LEAGUE_OPERATIONS_ROLES: UserRole[] = [ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN];
const NORMALIZED_TEAM_STAFF_ROLES: UserRole[] = [ROLE.TEAM_MANAGER];
const NORMALIZED_MATCH_OFFICIAL_ROLES: UserRole[] = [ROLE.SCORER, ROLE.UMPIRE];
const NORMALIZED_SELF_REGISTRATION_ROLES: UserRole[] = [
  ROLE.VIEWER,
  ROLE.PLAYER,
  ROLE.TEAM_MANAGER,
  ROLE.SCORER,
  ROLE.UMPIRE,
];

export const SELF_REGISTRATION_ROLES: UserRole[] = [
  ROLE.VIEWER,
  ROLE.PLAYER,
  ROLE.TEAM_MANAGER,
  ROLE.SCORER,
  ROLE.UMPIRE,
];

export function getRoleLabel(role: string) {
  return ROLE_LABELS[role] || ROLE_LABELS[normalizeRole(role) || ""] || role;
}

export function isAdminRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return !!normalized && NORMALIZED_ADMIN_ROLES.includes(normalized as UserRole);
}

export function isLeagueOpsRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return !!normalized && NORMALIZED_LEAGUE_OPERATIONS_ROLES.includes(normalized as UserRole);
}

export function isTeamStaffRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return !!normalized && NORMALIZED_TEAM_STAFF_ROLES.includes(normalized as UserRole);
}

export function isMatchOfficialRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return !!normalized && NORMALIZED_MATCH_OFFICIAL_ROLES.includes(normalized as UserRole);
}

export function canSelfRegister(role?: string | null) {
  const normalized = normalizeRole(role);
  return !!normalized && NORMALIZED_SELF_REGISTRATION_ROLES.includes(normalized as UserRole);
}

export function getDashboardLinkForRole(role?: string | null) {
  switch (normalizeRole(role)) {
    case ROLE.SUPER_ADMIN:
    case ROLE.LEAGUE_ADMIN:
      return "/admin";
    case ROLE.TEAM_MANAGER:
      return "/dashboard/team";
    case ROLE.SCORER:
      return "/dashboard/scorer";
    case ROLE.UMPIRE:
      return "/dashboard/officials";
    case ROLE.PLAYER:
      return "/dashboard/player";
    default:
      return "/profile";
  }
}
