// All kickoff times are displayed in Melbourne local time (Australia/Melbourne).
// During the 2026 tournament window (Jun 11 – Jul 19) Melbourne is on AEST
// (UTC+10, no DST), so we render the label as "AEST" rather than computing it.
export const KICKOFF_TIME_ZONE = "Australia/Melbourne";
export const KICKOFF_TIME_ZONE_LABEL = "AEST";

// "Sat 11 Jun · 1:00 am AEST"
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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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

// "1:00 am" (12h with AM/PM, Melbourne)
export function formatKickoffTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    timeZone: KICKOFF_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// "2026-06-11" — the Melbourne-local calendar date, used as a grouping key
// for the chronological schedule view. We use sv-SE because its locale
// returns ISO-style YYYY-MM-DD which sorts as a string and is unambiguous.
export function kickoffDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("sv-SE", {
    timeZone: KICKOFF_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// "Thursday, 11 June" — for date-section headers in the schedule view.
export function formatKickoffLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    timeZone: KICKOFF_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
