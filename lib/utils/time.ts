import { format, parseISO } from "date-fns";

export function formatTime(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function remainingMinutes(end: string, now = new Date()): number {
  const e = parseISO(end).getTime();
  const n = now.getTime();
  return Math.max(0, Math.ceil((e - n) / 60_000));
}

export function formatRemainingDuration(end: string, now = new Date()): string {
  return `${formatDuration(remainingMinutes(end, now))} remaining`;
}

export function isActiveWindow(start: string, end: string, now = new Date()): boolean {
  const s = parseISO(start);
  const e = parseISO(end);
  return now >= s && now <= e;
}

export function windowProgress(start: string, end: string, now = new Date()): number {
  const s = parseISO(start).getTime();
  const e = parseISO(end).getTime();
  const n = now.getTime();
  if (n <= s) return 0;
  if (n >= e) return 1;
  return (n - s) / (e - s);
}

export function segmentPosition(
  segStart: string,
  segEnd: string,
  dayStart: string,
  dayEnd: string
): { left: number; width: number } {
  const start = parseISO(dayStart).getTime();
  const end = parseISO(dayEnd).getTime();
  const total = end - start;
  if (total <= 0) return { left: 0, width: 100 };

  const segS = parseISO(segStart).getTime();
  const segE = parseISO(segEnd).getTime();
  const left = Math.max(0, ((segS - start) / total) * 100);
  const width = Math.min(100 - left, ((segE - segS) / total) * 100);

  return { left, width: Math.max(width, 1) };
}

export const VOLT = "#C8F135";
