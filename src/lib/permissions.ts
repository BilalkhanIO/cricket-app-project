import { ROLE, isAdminRole, isLeagueOpsRole, normalizeRole } from "@/lib/roles";

function hasRole(role: string | null | undefined, allowedRoles: readonly string[]) {
  const normalized = normalizeRole(role);
  return !!normalized && allowedRoles.includes(normalized);
}

export { isLeagueOpsRole } from "@/lib/roles";

export function canAccessAdminArea(role?: string | null) {
  return isLeagueOpsRole(role);
}

export function canCreateLeague(role?: string | null) {
  return isLeagueOpsRole(role);
}

export function canEditLeague(role?: string | null) {
  return isLeagueOpsRole(role);
}

export function canGenerateFixtures(role?: string | null) {
  return isLeagueOpsRole(role);
}

export function canCreateTeam(role?: string | null) {
  return hasRole(role, [
    ROLE.SUPER_ADMIN,
    ROLE.LEAGUE_ADMIN,
    ROLE.TEAM_MANAGER,
  ]);
}

export function canManageTeamRegistrations(role?: string | null) {
  return isLeagueOpsRole(role);
}

export function canManageLeaguePlayers(role?: string | null) {
  return isLeagueOpsRole(role) || hasRole(role, [ROLE.TEAM_MANAGER]);
}

export function canAccessPlayerDashboard(role?: string | null) {
  return normalizeRole(role) === ROLE.PLAYER || isAdminRole(role);
}

export function canAccessTeamManagerDashboard(role?: string | null) {
  return normalizeRole(role) === ROLE.TEAM_MANAGER || isAdminRole(role);
}

export function canAccessTeamStaffDashboard(role?: string | null) {
  return hasRole(role, [ROLE.TEAM_MANAGER]) || isAdminRole(role);
}

export function canAccessLeagueStaffDashboard(role?: string | null) {
  return normalizeRole(role) === ROLE.LEAGUE_ADMIN || isAdminRole(role);
}

export function canAccessOfficialDashboard(role?: string | null) {
  return hasRole(role, [ROLE.UMPIRE]) || isAdminRole(role);
}

export function canScoreMatch(role?: string | null) {
  return hasRole(role, [ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN, ROLE.SCORER]);
}

export function canManageMatchOfficials(role?: string | null) {
  return isLeagueOpsRole(role);
}
