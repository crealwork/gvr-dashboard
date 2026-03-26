/**
 * Diverging color scale for percentage change values.
 * Negative = red, zero = white, positive = green. Clamps at ±20%.
 */
export function changeColor(percent: number): string {
  const clamped = Math.max(-20, Math.min(20, percent));
  const t = clamped / 20;

  if (t >= 0) {
    const r = Math.round(255 - t * (255 - 22));
    const g = Math.round(255 - t * (255 - 163));
    const b = Math.round(255 - t * (255 - 74));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const absT = Math.abs(t);
    const r = Math.round(255 - absT * (255 - 220));
    const g = Math.round(255 - absT * (255 - 38));
    const b = Math.round(255 - absT * (255 - 38));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export function changeTextColor(percent: number): string {
  const abs = Math.abs(percent);
  return abs > 10 ? "#FFFFFF" : "#111827";
}
