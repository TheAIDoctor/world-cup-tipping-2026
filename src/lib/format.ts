// All kickoff times are displayed in Melbourne local time (Australia/Melbourne).
// During the 2026 tournament window (Jun 11 – Jul 19) Melbourne is on AEST
// (UTC+10, no DST), so we render the label as "AEST" rather than computing it.
export const KICKOFF_TIME_ZONE = "Australia/Melbourne";
export const KICKOFF_TIME_ZONE_LABEL = "AEST";

// "Sat 11 Jun · 01:00 AEST"
export function formatKickoff(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateLabel = d.toLocaleString("en-AU", {
    timeZone: KICKOFF_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = d.toLocaleString("en-AU", {
    timeZone: KICKOFF_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateLabel} · ${timeLabel} ${KICKOFF_TIME_ZONE_LABEL}`;
}

// "11 Jun"
export function formatKickoffDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    timeZone: KICKOFF_TIME_ZONE,
    day: "numeric",
    month: "short",
  });
}

// Flag emoji for the three 2026 host countries.
const HOST_COUNTRY_FLAGS: Record<string, string> = {
  USA: "🇺🇸",
  Mexico: "🇲🇽",
  Canada: "🇨🇦",
};

export function hostCountryFlag(country: string | null | undefined): string {
  if (!country) return "";
  return HOST_COUNTRY_FLAGS[country] ?? "";
}

// "01:00" (24h, Melbourne)
export function formatKickoffTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    timeZone: KICKOFF_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
