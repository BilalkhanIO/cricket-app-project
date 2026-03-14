import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatOvers(balls: number) {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${overs}.${remainingBalls}`;
}

export function calcNRR(
  runsScored: number,
  oversFaced: number,
  runsConceded: number,
  oversBowled: number
): number {
  if (oversFaced === 0 || oversBowled === 0) return 0;
  return (
    Math.round((runsScored / oversFaced - runsConceded / oversBowled) * 100) /
    100
  );
}

export function calcStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return Math.round((runs / balls) * 100 * 100) / 100;
}

export function calcEconomy(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return Math.round((runs / overs) * 100) / 100;
}

// Convert cricket overs notation (e.g. 3.2 = 3 overs + 2 balls) into balls.
export function oversNotationToBalls(oversNotation: number): number {
  const wholeOvers = Math.trunc(oversNotation);
  const ballsPart = Math.round((oversNotation - wholeOvers) * 10 + Number.EPSILON);
  const legalBallsPart = Math.max(0, Math.min(5, ballsPart));
  return wholeOvers * 6 + legalBallsPart;
}

// Convert total legal balls into cricket overs notation (e.g. 20 balls => 3.2 overs).
export function ballsToOversNotation(balls: number): number {
  const safeBalls = Math.max(0, Math.trunc(balls));
  return Math.floor(safeBalls / 6) + (safeBalls % 6) / 10;
}

export function calcEconomyFromBalls(runsConceded: number, ballsBowled: number): number {
  if (ballsBowled === 0) return 0;
  return Math.round(((runsConceded * 6) / ballsBowled) * 100) / 100;
}

export function calcAverage(runs: number, dismissals: number): number {
  if (dismissals === 0) return runs;
  return Math.round((runs / dismissals) * 100) / 100;
}

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  LEAGUE_ADMIN: "LEAGUE_ADMIN",
  TEAM_MANAGER: "TEAM_MANAGER",
  SCORER: "SCORER",
  PLAYER: "PLAYER",
  FAN: "FAN",
} as const;

export const MATCH_STATUS = {
  UPCOMING: "UPCOMING",
  TOSS: "TOSS",
  LIVE: "LIVE",
  INNINGS_BREAK: "INNINGS_BREAK",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED",
  DELAYED: "DELAYED",
  CANCELED: "CANCELED",
} as const;

export const LEAGUE_STATUS = {
  DRAFT: "DRAFT",
  REGISTRATION: "REGISTRATION",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
} as const;

export const statusColors: Record<string, string> = {
  LIVE: "bg-red-500",
  UPCOMING: "bg-blue-500",
  COMPLETED: "bg-[#769FCD]",
  INNINGS_BREAK: "bg-yellow-500",
  ABANDONED: "bg-gray-500",
  DELAYED: "bg-orange-500",
  CANCELED: "bg-red-700",
  TOSS: "bg-purple-500",
};

export const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800",
  LEAGUE_ADMIN: "bg-purple-100 text-purple-800",
  TEAM_MANAGER: "bg-blue-100 text-blue-800",
  SCORER: "bg-[#D6E6F2] text-[#1B3A5C]",
  PLAYER: "bg-yellow-100 text-yellow-800",
  FAN: "bg-gray-100 text-gray-800",
};
