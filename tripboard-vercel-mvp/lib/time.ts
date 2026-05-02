export const START_HOUR = 8;
export const END_HOUR = 22;
export const STEP_MINUTES = 30;
export const PIXELS_PER_STEP = 48;

export function minutesFromTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeFromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function clampToDay(minutes: number) {
  return Math.min(Math.max(minutes, START_HOUR * 60), END_HOUR * 60);
}

export function snap(minutes: number) {
  return Math.round(minutes / STEP_MINUTES) * STEP_MINUTES;
}

export function topFromTime(time: string) {
  return ((minutesFromTime(time) - START_HOUR * 60) / STEP_MINUTES) * PIXELS_PER_STEP;
}

export function heightFromDuration(duration: number) {
  return (duration / STEP_MINUTES) * PIXELS_PER_STEP;
}

export function timeFromTop(top: number) {
  const steps = Math.round(top / PIXELS_PER_STEP);
  return timeFromMinutes(START_HOUR * 60 + steps * STEP_MINUTES);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return minutesFromTime(aStart) < minutesFromTime(bEnd) && minutesFromTime(bStart) < minutesFromTime(aEnd);
}
