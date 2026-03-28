import { ROLE, isAdminRole, isLeagueOpsRole } from "@/lib/roles";

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
  return [ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN, ROLE.LEAGUE_STAFF, ROLE.TEAM_OWNER, ROLE.TEAM_MANAGER].includes(
    role as string
  );
}

export function canManageTeamRegistrations(role?: string | null) {
  return isLeagueOpsRole(role);
}

export function canManageLeaguePlayers(role?: string | null) {
  return isLeagueOpsRole(role) || [ROLE.TEAM_OWNER, ROLE.TEAM_MANAGER].includes(role as string);
}

export function canAccessPlayerDashboard(role?: string | null) {
  return role === ROLE.PLAYER || isAdminRole(role);
}

export function canAccessTeamManagerDashboard(role?: string | null) {
  return role === ROLE.TEAM_MANAGER || isAdminRole(role);
}

export function canAccessTeamStaffDashboard(role?: string | null) {
  return [ROLE.TEAM_OWNER, ROLE.COACH, ROLE.SELECTOR, ROLE.ANALYST].includes(role as string) || isAdminRole(role);
}

export function canAccessLeagueStaffDashboard(role?: string | null) {
  return role === ROLE.LEAGUE_STAFF || isAdminRole(role);
}

export function canAccessOfficialDashboard(role?: string | null) {
  return [ROLE.UMPIRE, ROLE.MATCH_REFEREE].includes(role as string) || isAdminRole(role);
}

export function canScoreMatch(role?: string | null) {
  return [ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN, ROLE.LEAGUE_STAFF, ROLE.SCORER].includes(role as string);
}

export function canManageMatchOfficials(role?: string | null) {
  return isLeagueOpsRole(role);
}
