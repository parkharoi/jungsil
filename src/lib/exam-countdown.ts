export const EXAM_DATE = "2026-10-25";
const DAY = 86_400_000;
const examDay = Date.parse(EXAM_DATE + "T00:00:00Z") / DAY;
const departureDay = Date.parse("2026-09-30T00:00:00Z") / DAY;

export function examCountdown(now: Date) {
  const today = Math.floor((now.getTime() + 9 * 3_600_000) / DAY);
  const days = examDay - today;
  return { days, progress: Math.max(0, Math.min(100, (today - departureDay) / (examDay - departureDay) * 100)) };
}
